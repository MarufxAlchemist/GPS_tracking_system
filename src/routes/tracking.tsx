import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { LocationRow } from "@/components/live-tracking-map";
import { useLocationTracker } from "@/hooks/use-location-tracker";
import { ClientOnly } from "@/components/client-only";
import { type GeofenceZone } from "@/lib/geofence";
import { Search, Layers, Crosshair, Flame, MapPin, Activity, Navigation, AlertCircle, Users } from "lucide-react";

// Leaflet map lazy-loaded so it never runs during SSR
const LiveTrackingMap = lazy(() =>
  import("@/components/live-tracking-map").then((mod) => ({ default: mod.LiveTrackingMap }))
);

const MapFallback = ({ height = 680 }: { height?: number }) => (
  <div
    style={{ height }}
    className="w-full bg-slate-950/40 rounded-3xl border border-border/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm font-medium"
  >
    <Activity className="size-8 text-cyan animate-pulse" />
    <span>Connecting to geolocation telemetry...</span>
  </div>
);

export const Route = createFileRoute("/tracking")({
  head: () => ({ meta: [{ title: "Live Tracking — GeoFence" }] }),
  component: Tracking,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDeviceId(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let id = localStorage.getItem("device_id");
  if (!id) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    localStorage.setItem("device_id", id);
  }
  return id;
}

/** Shorten a UUID to first 8 chars for display */
function shortId(uid: string) {
  return uid.slice(0, 8).toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Tracking() {
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [deviceId] = useState<string>(() => getDeviceId());
  // All live users from the map (updated via onLocationsChange callback)
  const [liveLocations, setLiveLocations] = useState<Map<string, LocationRow>>(new Map());

  const { trackerStatus, start, stop } = useLocationTracker({
    userId: deviceId,
    intervalMs: 5000,
  });

  // Start / stop tracking based on geoEnabled toggle
  useEffect(() => {
    if (geoEnabled) {
      console.log("[Tracking] Starting location tracker for device:", deviceId);
      start();
    } else {
      console.log("[Tracking] Stopping location tracker.");
      stop();
    }
  }, [geoEnabled, start, stop, deviceId]);

  // Auto-create a geofence zone on first fix
  useEffect(() => {
    if (trackerStatus.status === "tracking" && zones.length === 0) {
      console.log("[Tracking] Creating initial geofence zone at:", {
        lat: trackerStatus.latitude,
        lon: trackerStatus.longitude,
      });
      setZones([
        {
          id: "home-base",
          name: "Home Base",
          latitude: trackerStatus.latitude,
          longitude: trackerStatus.longitude,
          radiusMetres: 100,
        },
      ]);
    }
  }, [trackerStatus, zones]);

  // Callback from LiveTrackingMap whenever its internal location map changes
  const handleLocationsChange = useCallback((locs: Map<string, LocationRow>) => {
    console.log(`[Tracking] Location map updated: ${locs.size} user(s)`);
    setLiveLocations(new Map(locs));
  }, []);

  // Derive the live user list, putting "you" first
  const liveUsers = Array.from(liveLocations.values()).sort((a, b) => {
    if (a.user_id === deviceId) return -1;
    if (b.user_id === deviceId) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const trackedCount = liveLocations.size;

  return (
    <DashboardShell
      title="Live Tracking"
      subtitle={`Realtime device telemetry · ${trackedCount} active`}
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Map */}
        <div className="xl:col-span-3 relative">
          <ClientOnly fallback={<MapFallback height={680} />}>
            <Suspense fallback={<MapFallback height={680} />}>
              <LiveTrackingMap
                height={680}
                highlightUserId={deviceId}
                zones={zones}
                onLocationsChange={handleLocationsChange}
              />
            </Suspense>
          </ClientOnly>
          {/* Floating map controls */}
          <div className="absolute top-4 right-4 glass rounded-2xl p-2 flex flex-col gap-1">
            {[Layers, Crosshair, Flame].map((I, i) => (
              <button key={i} className="size-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition group">
                <I className="size-4 text-muted-foreground group-hover:text-cyan transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Your location card */}
          <div className="glass rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="size-4" style={{ color: "var(--cyan)" }} />
              <span className="text-sm font-semibold font-display">Your Location</span>
            </div>

            {trackerStatus.status === "idle" && (
              <button
                onClick={() => setGeoEnabled(true)}
                className="w-full rounded-xl gradient-primary text-primary-foreground text-xs font-semibold py-2.5"
              >
                Share Location
              </button>
            )}

            {trackerStatus.status === "requesting" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="size-4 rounded-full border border-cyan/40 border-t-cyan animate-spin" />
                Requesting permission…
              </div>
            )}

            {trackerStatus.status === "tracking" && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--success)" }}>
                  <span className="relative flex size-2">
                    <span className="absolute inset-0 rounded-full bg-success pulse-ring opacity-80" />
                    <span className="relative rounded-full bg-success size-2" />
                  </span>
                  Live · streaming
                </div>
                <div className="grid grid-cols-1 gap-1.5 font-mono text-[11px]">
                  <div className="flex justify-between glass rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground">LAT</span>
                    <span style={{ color: "var(--cyan)" }}>{trackerStatus.latitude.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between glass rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground">LON</span>
                    <span style={{ color: "var(--cyan)" }}>{trackerStatus.longitude.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between glass rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground">ACC</span>
                    <span style={{ color: "var(--success)" }}>±{Math.round(trackerStatus.accuracy)}m</span>
                  </div>
                  {trackerStatus.heading !== null && (
                    <div className="flex justify-between glass rounded-lg px-2.5 py-1.5">
                      <span className="text-muted-foreground">HDG</span>
                      <span>{Math.round(trackerStatus.heading)}°</span>
                    </div>
                  )}
                  {trackerStatus.lastSyncedAt && (
                    <div className="flex justify-between glass rounded-lg px-2.5 py-1.5">
                      <span className="text-muted-foreground">SYNC</span>
                      <span>{new Date(trackerStatus.lastSyncedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setGeoEnabled(false)}
                  className="w-full rounded-xl glass py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
                >
                  Stop sharing
                </button>
              </div>
            )}

            {trackerStatus.status === "error" && (
              <div className="space-y-2">
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-danger/10 border border-danger/20">
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
                  <p className="text-[11px]" style={{ color: "var(--danger)" }}>{trackerStatus.message}</p>
                </div>
                <button
                  onClick={() => { setGeoEnabled(false); setTimeout(() => setGeoEnabled(true), 100); }}
                  className="w-full rounded-xl gradient-primary text-primary-foreground text-xs font-semibold py-2"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Search + filter */}
          <div className="glass rounded-3xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                placeholder="Search user…"
                className="w-full pl-9 pr-3 h-10 rounded-xl bg-white/5 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { l: "All", c: "cyan" },
                { l: "Safe", c: "success" },
                { l: "Warning", c: "warning" },
                { l: "Alert", c: "danger" },
              ].map((f, i) => (
                <button
                  key={f.l}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    i === 0
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : "border-border hover:bg-white/5"
                  }`}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {/* Live user list */}
          <div className="glass rounded-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="size-4" style={{ color: "var(--cyan)" }} />
                <h3 className="font-display font-semibold text-sm">Active Users</h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {trackedCount} tracked
              </span>
            </div>

            {liveUsers.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-center">
                <MapPin className="size-8 text-muted-foreground opacity-40" />
                <p className="text-xs text-muted-foreground">No users tracked yet.</p>
                <p className="text-[10px] text-muted-foreground/60">
                  Open the site on another device to see it appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-hide">
                {liveUsers.map((loc) => {
                  const isYou = loc.user_id === deviceId;
                  const initials = isYou ? "YOU" : shortId(loc.user_id).slice(0, 3);
                  const timeSince = Math.round(
                    (Date.now() - new Date(loc.updated_at).getTime()) / 1000,
                  );
                  const isRecent = timeSince < 15;

                  return (
                    <li
                      key={loc.user_id}
                      className={`flex items-center gap-3 p-2 rounded-xl transition ${
                        isYou
                          ? "bg-cyan/5 border border-cyan/20"
                          : "hover:bg-white/5 cursor-pointer"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`size-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isYou ? "gradient-primary" : "gradient-violet"
                          }`}
                        >
                          {initials}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background"
                          style={{
                            background: isRecent ? "var(--success)" : "var(--warning)",
                            boxShadow: `0 0 8px ${isRecent ? "var(--success)" : "var(--warning)"}`,
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: isYou ? "var(--cyan)" : undefined }}
                        >
                          {isYou ? "You (Live)" : `User ${shortId(loc.user_id)}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {loc.latitude.toFixed(3)}°, {loc.longitude.toFixed(3)}°
                          {" · "}
                          {timeSince < 60 ? `${timeSince}s ago` : `${Math.round(timeSince / 60)}m ago`}
                        </div>
                      </div>
                      {isYou ? (
                        <Navigation className="size-3.5 shrink-0" style={{ color: "var(--cyan)" }} />
                      ) : (
                        <Activity className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
