/**
 * useLiveLocations
 *
 * Shared, SSR-safe hook that:
 *  1. Fetches all current rows from the `live_locations` table on mount.
 *  2. Subscribes to INSERT / UPDATE / DELETE realtime events.
 *  3. Returns a `Map<user_id, LiveLocationRow>` kept in sync with the database.
 *
 * Safe to use in any component — guards all Supabase calls with
 * `typeof window !== "undefined"` so it never crashes during SSR.
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LiveLocationRow {
  user_id: string;
  /** Optional display name stored in the database. May be null. */
  username: string | null;
  latitude: number;
  longitude: number;
  /** ISO 8601 timestamp of the last position update. */
  updated_at: string;
}

export type LiveConnectionStatus = "connecting" | "connected" | "error";

export interface UseLiveLocationsReturn {
  /** Map from user_id to their latest location row. */
  locations: Map<string, LiveLocationRow>;
  /** Realtime channel connection status. */
  connectionStatus: LiveConnectionStatus;
  /** Convenience shorthand for `locations.size`. */
  count: number;
}

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

function isValidRow(row: unknown): row is LiveLocationRow {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r["user_id"] === "string" &&
    typeof r["latitude"] === "number" &&
    typeof r["longitude"] === "number" &&
    !isNaN(r["latitude"] as number) &&
    !isNaN(r["longitude"] as number)
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLiveLocations(): UseLiveLocationsReturn {
  const [locations, setLocations] = useState<Map<string, LiveLocationRow>>(
    () => new Map()
  );
  const [connectionStatus, setConnectionStatus] =
    useState<LiveConnectionStatus>("connecting");

  // Stable ref so callbacks never go stale
  const setLocationsRef = useRef(setLocations);
  setLocationsRef.current = setLocations;

  // -----------------------------------------------------------------------
  // 1. Initial fetch
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    async function fetchInitial() {
      const { data, error } = await supabase
        .from("live_locations")
        .select("user_id, username, latitude, longitude, updated_at");

      if (error) {
        console.error("[useLiveLocations] Initial fetch error:", error.message);
        return;
      }

      if (!data || data.length === 0) return;

      setLocationsRef.current(() => {
        const next = new Map<string, LiveLocationRow>();
        for (const row of data) {
          if (isValidRow(row)) {
            next.set(row.user_id, row);
          }
        }
        return next;
      });
    }

    void fetchInitial();
  }, []);

  // -----------------------------------------------------------------------
  // 2. Realtime subscription — INSERT, UPDATE, DELETE
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const channelName = `use_live_locations_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    const upsertRow = (row: unknown) => {
      if (!isValidRow(row)) return;
      setLocationsRef.current((prev) => {
        const next = new Map(prev);
        next.set(row.user_id, row);
        return next;
      });
    };

    const deleteRow = (oldRow: unknown) => {
      if (!oldRow || typeof oldRow !== "object") return;
      const userId = (oldRow as Record<string, unknown>)["user_id"];
      if (typeof userId !== "string") return;
      setLocationsRef.current((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    };

    const channel = supabase
      .channel(channelName)
      .on<LiveLocationRow>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_locations" },
        (payload) => upsertRow(payload.new)
      )
      .on<LiveLocationRow>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_locations" },
        (payload) => upsertRow(payload.new)
      )
      .on<LiveLocationRow>(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "live_locations" },
        (payload) => deleteRow(payload.old)
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("error");
          console.error(
            "[useLiveLocations] Realtime subscription failed:",
            status
          );
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return { locations, connectionStatus, count: locations.size };
}
