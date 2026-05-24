import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackerStatus =
  | { status: "idle" }
  | { status: "requesting" }
  | {
      status: "tracking";
      latitude: number;
      longitude: number;
      accuracy: number;
      heading: number | null;
      speed: number | null;
      /** ISO timestamp of the last successful Supabase upsert */
      lastSyncedAt: string | null;
      /** Status of the Supabase sync */
      syncStatus: "idle" | "syncing" | "success" | "error";
      /** Error message if the last sync failed */
      syncError: string | null;
    }
  | { status: "error"; code: GeolocationPositionError["code"]; message: string };

export interface UseLocationTrackerOptions {
  /** Supabase row identifier — used as the upsert conflict key (`user_id`). */
  userId: string;
  /** Optional username to display on the dashboard */
  username?: string;
  /**
   * Minimum milliseconds between Supabase upserts.
   * Defaults to 5000 (5 s). Set to 0 to upsert on every position update.
   */
  intervalMs?: number;
  /** Called after every successful upsert. */
  onSync?: (latitude: number, longitude: number) => void;
  /** Called when a Supabase write fails. */
  onError?: (err: unknown) => void;
}

export interface UseLocationTrackerReturn {
  /** Current tracker state */
  trackerStatus: TrackerStatus;
  /** Start tracking (no-op if already tracking) */
  start: () => void;
  /** Stop tracking and clear the geolocation watcher */
  stop: () => void;
}

// ---------------------------------------------------------------------------
// Human-readable error messages for GeolocationPositionError codes
// ---------------------------------------------------------------------------
const GEO_ERROR_MESSAGES: Record<number, string> = {
  1: "Location permission denied. Please allow access in your browser or device settings.",
  2: "Location unavailable. Check that your device GPS / network is enabled.",
  3: "Location request timed out. Ensure you have a GPS signal and try again.",
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useLocationTracker
 *
 * Continuously tracks the device GPS position via `navigator.geolocation.watchPosition`
 * and upserts the coordinates into the Supabase `live_locations` table at most
 * once every `intervalMs` milliseconds (default 5 000 ms).
 *
 * @example
 * ```tsx
 * const { trackerStatus, start, stop } = useLocationTracker({ userId: "uuid-here" });
 * ```
 */
export function useLocationTracker({
  userId,
  username,
  intervalMs = 5_000,
  onSync,
  onError,
}: UseLocationTrackerOptions): UseLocationTrackerReturn {
  const [trackerStatus, setTrackerStatus] = useState<TrackerStatus>({ status: "idle" });

  // Internal refs — stable across renders, never cause re-renders
  const watchIdRef = useRef<number | null>(null);
  const lastUpsertAtRef = useRef<number>(0); // epoch ms of last successful upsert
  const lastSyncedAtRef = useRef<string | null>(null);
  const enabledRef = useRef(false);

  // Keep callbacks stable so useEffect deps don't change every render
  const onSyncRef = useRef(onSync);
  const onErrorRef = useRef(onError);
  useEffect(() => { onSyncRef.current = onSync; }, [onSync]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // ---------------------------------------------------------------------------
  // Upsert helper
  // ---------------------------------------------------------------------------
  const upsertLocation = useCallback(
    async (latitude: number, longitude: number) => {
      const now = Date.now();

      // Throttle: skip if we upserted too recently (and it's not the first call)
      if (lastUpsertAtRef.current !== 0 && now - lastUpsertAtRef.current < intervalMs) {
        console.log(`[useLocationTracker] Skipping upsert (throttled, next in ${Math.round((intervalMs - (now - lastUpsertAtRef.current)) / 1000)}s)`);
        return;
      }

      const updatedAt = new Date().toISOString();
      console.log(`[useLocationTracker] Upserting location for user ${userId}:`, { latitude, longitude, updatedAt });

      setTrackerStatus((prev) =>
        prev.status === "tracking" ? { ...prev, syncStatus: "syncing", syncError: null } : prev
      );

      const { error } = await supabase.from("live_locations").upsert(
        {
          user_id: userId,
          username: username || null,
          latitude,
          longitude,
          updated_at: updatedAt,
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) {
        console.error("[useLocationTracker] Supabase upsert failed:", error.message, error);
        onErrorRef.current?.(error);
        setTrackerStatus((prev) =>
          prev.status === "tracking" ? { ...prev, syncStatus: "error", syncError: error.message } : prev
        );
        return;
      }

      console.log(`[useLocationTracker] Upsert successful for user ${userId} at ${updatedAt}`);
      lastUpsertAtRef.current = now;
      lastSyncedAtRef.current = updatedAt;
      onSyncRef.current?.(latitude, longitude);

      setTrackerStatus((prev) =>
        prev.status === "tracking"
          ? { ...prev, lastSyncedAt: updatedAt, syncStatus: "success", syncError: null }
          : prev,
      );
    },
    [userId, intervalMs],
  );

  // ---------------------------------------------------------------------------
  // Start tracking
  // ---------------------------------------------------------------------------
  const start = useCallback(() => {
    if (enabledRef.current) return; // already running

    if (!navigator.geolocation) {
      setTrackerStatus({
        status: "error",
        code: 2,
        message: "Geolocation is not supported by this browser.",
      });
      return;
    }

    enabledRef.current = true;
    setTrackerStatus({ status: "requesting" });

    watchIdRef.current = navigator.geolocation.watchPosition(
      // Success callback — fires whenever the device reports a new position
      (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;

        console.log(`[useLocationTracker] GPS update for user ${userId}:`, {
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
          timestamp: new Date(position.timestamp).toISOString(),
        });

        setTrackerStatus({
          status: "tracking",
          latitude,
          longitude,
          accuracy,
          heading,
          speed,
          lastSyncedAt: lastSyncedAtRef.current,
          syncStatus: "idle",
          syncError: null,
        });

        void upsertLocation(latitude, longitude);
      },

      // Error callback
      (err: GeolocationPositionError) => {
        const message =
          GEO_ERROR_MESSAGES[err.code] ??
          `Geolocation error (code ${err.code}): ${err.message}`;

        console.warn("[useLocationTracker] Geolocation error:", message);
        setTrackerStatus({ status: "error", code: err.code, message });

        // Stop the watcher — user must call start() again after fixing permission
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        enabledRef.current = false;
      },

      // Options
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0, // always fetch a fresh position
      },
    );
  }, [upsertLocation]);

  // ---------------------------------------------------------------------------
  // Stop tracking
  // ---------------------------------------------------------------------------
  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    enabledRef.current = false;
    lastUpsertAtRef.current = 0;
    lastSyncedAtRef.current = null;
    setTrackerStatus({ status: "idle" });
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      enabledRef.current = false;
    };
  }, []);

  return { trackerStatus, start, stop };
}
