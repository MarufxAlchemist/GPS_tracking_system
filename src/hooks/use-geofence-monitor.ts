/**
 * useGeofenceMonitor
 *
 * Watches a user's live position against a set of circular geofence zones.
 * When the user moves outside any zone boundary:
 *   1. Fires an `onBreach` callback with full breach details
 *   2. Inserts an alert row into the Supabase `alerts` table
 *   3. De-duplicates — won't re-alert for the same zone until the user
 *      re-enters and leaves again (or `cooldownMs` elapses)
 *
 * Also subscribes to Supabase Realtime on the `alerts` table so that
 * alerts created by *other* clients appear instantly.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  type GeofenceZone,
  type GeofenceBreach,
  type AlertRow,
  detectBreaches,
  breachToAlertRow,
} from "@/lib/geofence";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeofenceAlert {
  id: string;
  breach: GeofenceBreach;
  /** "local" if created by this client, "remote" if received via Realtime */
  source: "local" | "remote";
  /** Whether the user has dismissed the popup */
  dismissed: boolean;
}

export interface UseGeofenceMonitorOptions {
  /** User ID used in alert rows */
  userId: string;
  /** Zones to monitor */
  zones: GeofenceZone[];
  /** Current latitude (from GPS tracker) */
  latitude: number | null;
  /** Current longitude (from GPS tracker) */
  longitude: number | null;
  /** Minimum ms between re-alerting for the same zone. Default 60 000 (1 min). */
  cooldownMs?: number;
  /** Called on every new breach */
  onBreach?: (breach: GeofenceBreach) => void;
  /** Called on Supabase write error */
  onError?: (err: unknown) => void;
}

export interface UseGeofenceMonitorReturn {
  /** All recent alerts (local + remote), newest first */
  alerts: GeofenceAlert[];
  /** For each zone: is the user currently inside? */
  zoneStatus: Map<string, boolean>;
  /** Dismiss a specific alert popup */
  dismissAlert: (alertId: string) => void;
  /** Dismiss all alert popups */
  dismissAll: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

let alertCounter = 0;
function nextAlertId() {
  return `ga-${Date.now()}-${++alertCounter}`;
}

export function useGeofenceMonitor({
  userId,
  zones,
  latitude,
  longitude,
  cooldownMs = 60_000,
  onBreach,
  onError,
}: UseGeofenceMonitorOptions): UseGeofenceMonitorReturn {
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [zoneStatus, setZoneStatus] = useState<Map<string, boolean>>(new Map());

  // Track last alert timestamp per zone to implement cooldown
  const lastAlertTimeRef = useRef<Map<string, number>>(new Map());

  // Stable refs for callbacks
  const onBreachRef = useRef(onBreach);
  const onErrorRef = useRef(onError);
  useEffect(() => { onBreachRef.current = onBreach; }, [onBreach]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // -----------------------------------------------------------------------
  // Core: check position against all zones on every lat/lon update
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (latitude === null || longitude === null || zones.length === 0) return;

    // Build zone status map
    const statusMap = new Map<string, boolean>();
    const breaches = detectBreaches(userId, latitude, longitude, zones);
    const breachedIds = new Set(breaches.map((b) => b.zoneId));

    for (const zone of zones) {
      statusMap.set(zone.id, !breachedIds.has(zone.id));
    }
    setZoneStatus(statusMap);

    // Process breaches with cooldown
    const now = Date.now();
    const newBreaches: GeofenceBreach[] = [];

    for (const breach of breaches) {
      const lastAlert = lastAlertTimeRef.current.get(breach.zoneId) ?? 0;
      if (now - lastAlert < cooldownMs) continue; // cooldown active

      lastAlertTimeRef.current.set(breach.zoneId, now);
      newBreaches.push(breach);
    }

    if (newBreaches.length === 0) return;

    // Fire callbacks & create local alerts
    const newAlerts: GeofenceAlert[] = newBreaches.map((breach) => {
      onBreachRef.current?.(breach);
      return {
        id: nextAlertId(),
        breach,
        source: "local" as const,
        dismissed: false,
      };
    });

    setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50)); // cap at 50

    // Save to Supabase (fire-and-forget)
    const rows: AlertRow[] = newBreaches.map(breachToAlertRow);
    void supabase
      .from("alerts")
      .insert(rows)
      .then(({ error }) => {
        if (error) {
          console.error("[useGeofenceMonitor] Alert insert failed:", error.message);
          onErrorRef.current?.(error);
        }
      });

    // When user re-enters a zone, clear its cooldown so next exit alerts again
    // We do this by checking zones the user IS inside — clear those cooldowns
    for (const zone of zones) {
      if (!breachedIds.has(zone.id)) {
        lastAlertTimeRef.current.delete(zone.id);
      }
    }
  }, [userId, latitude, longitude, zones, cooldownMs]);

  // -----------------------------------------------------------------------
  // Supabase Realtime: listen for alerts from OTHER clients
  // -----------------------------------------------------------------------
  useEffect(() => {
    const channel = supabase
      .channel("alerts_realtime")
      .on<AlertRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          const row = payload.new;
          // Skip alerts we created ourselves
          if (row.user_id === userId) return;

          const remoteAlert: GeofenceAlert = {
            id: nextAlertId(),
            breach: {
              zoneId: row.zone_id,
              zoneName: row.zone_name,
              userId: row.user_id,
              latitude: row.latitude,
              longitude: row.longitude,
              distanceMetres: row.distance_metres,
              radiusMetres: row.radius_metres,
              overshootMetres: row.overshoot_metres,
              timestamp: row.created_at,
            },
            source: "remote",
            dismissed: false,
          };

          setAlerts((prev) => [remoteAlert, ...prev].slice(0, 50));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)),
    );
  }, []);

  const dismissAll = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, dismissed: true })));
  }, []);

  return { alerts, zoneStatus, dismissAlert, dismissAll };
}
