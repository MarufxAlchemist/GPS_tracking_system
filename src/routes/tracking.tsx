import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, lazy, Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useLocationTracker } from "@/hooks/use-location-tracker";
import { ClientOnly } from "@/components/client-only";
import { type GeofenceZone } from "@/lib/geofence";
import { Search, Layers, Crosshair, Flame, MapPin, Activity, Navigation, AlertCircle, Users, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GenerateJoinLinkModal } from "@/components/generate-join-link-modal";
import { supabase } from "@/lib/supabase";
import { useLiveLocations } from "@/hooks/use-live-locations";


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

function getDeviceId(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let id = localStorage.getItem("device_id");
  if (!id) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem("device_id", id);
  }
  return id;
}

function shortId(uid: string) {
  return uid.slice(0, 8).toUpperCase();
}

type StatusFilter = "all" | "safe" | "warning" | "alert";

function Tracking() {
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [zones, setZones] = useState<GeofenceZone[]>([]);
  const [deviceId] = useState<string>(() => getDeviceId());
  
  const { locations: liveLocations, connectionStatus } = useLiveLocations();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [layerActive, setLayerActive] = useState(false);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const { trackerStatus, start, stop } = useLocationTracker({
    userId: deviceId,
    intervalMs: 5000,
  });

  useEffect(() => {
    if (geoEnabled) {
      start();
    } else {
      stop();
    }
  }, [geoEnabled, start, stop]);

  useEffect(() => {
    if (trackerStatus.status === "tracking" && zones.length === 0) {
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

  // Cleanup disconnected users (older than 15 mins)
  useEffect(() => {
    const cleanup = async () => {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      await supabase.from("live_locations").delete().lt("updated_at", fifteenMinsAgo);
    };
    cleanup();
    const interval = setInterval(cleanup, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const allUsers = Array.from(liveLocations.values()).sort((a, b) => {
    if (a.user_id === deviceId) return -1;
    if (b.user_id === deviceId) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Filter by search
  const filteredUsers = allUsers.filter((loc) => {
    const idMatch = searchQuery === "" || loc.user_id.toUpperCase().includes(searchQuery.toUpperCase());
    const isYou = loc.user_id === deviceId;
    const timeSince = Math.round((Date.now() - new Date(loc.updated_at).getTime()) / 1000);
    const isRecent = timeSince < 15;

    let statusMatch = true;
    if (statusFilter === "safe") statusMatch = isRecent;
    else if (statusFilter === "warning") statusMatch = !isRecent;
    else if (statusFilter === "alert") statusMatch = isYou && !isRecent;

    return idMatch && statusMatch;
  });

  const trackedCount = liveLocations.size;

  const handleLayerToggle = () => {
    setLayerActive((v) => !v);
    toast.info(layerActive ? "Satellite layer off" : "Satellite layer on");
  };

  const handleRecenter = () => {
    if (trackerStatus.status === "tracking") {
      toast.success(`Recentered on ${trackerStatus.latitude.toFixed(4)}°, ${trackerStatus.longitude.toFixed(4)}°`);
    } else {
      toast.error("Enable location sharing to recenter map");
    }
  };

  const handleHeatmap = () => {
    setHeatmapActive((v) => !v);
    toast.info(heatmapActive ? "Heatmap overlay off" : "Heatmap overlay on");
  };

  const mapControls = [
    { Icon: Layers, label: "Layers", active: layerActive, action: handleLayerToggle },
    { Icon: Crosshair, label: "Recenter", active: false, action: handleRecenter },
    { Icon: Flame, label: "Heatmap", active: heatmapActive, action: handleHeatmap },
  ];

  const filterPills: { key: StatusFilter; label: string; color: string }[] = [
    { key: "all", label: "All", color: "cyan" },
    { key: "safe", label: "Safe", color: "success" },
    { key: "warning", label: "Warning", color: "warning" },
    { key: "alert", label: "Alert", color: "danger" },
  ];

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
                locations={liveLocations}
                connectionStatus={connectionStatus}
              />
            </Suspense>
          </ClientOnly>
          {/* Floating map controls */}
          <div className="absolute top-4 right-4 glass rounded-2xl p-2 flex flex-col gap-1">
            {mapControls.map(({ Icon, label, active, action }) => (
              <button
                key={label}
                onClick={action}
                title={label}
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center transition group",
                  active ? "bg-cyan/20" : "hover:bg-white/10"
                )}
              >
                <Icon className={cn("size-4 transition", active ? "text-cyan" : "text-muted-foreground group-hover:text-cyan")} />
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Realtime GPS Debug Panel */}
          <div className="glass rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="size-4" style={{ color: "var(--cyan)" }} />
              <span className="text-sm font-semibold font-display">Realtime GPS Debug</span>
            </div>

            {trackerStatus.status === "idle" && (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-muted-foreground bg-white/5 p-3 rounded-xl border border-border/50">
                  Tracking is currently inactive. Enable it to begin broadcasting GPS telemetry.
                </div>
                <button
                  onClick={() => setGeoEnabled(true)}
                  className="w-full rounded-xl gradient-primary text-primary-foreground text-xs font-semibold py-2.5 hover:scale-[1.02] transition"
                >
                  Start Live Tracking
                </button>
              </div>
            )}

            {trackerStatus.status === "requesting" && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan/10 border border-cyan/20">
                <div className="size-4 rounded-full border-2 border-cyan/40 border-t-cyan animate-spin shrink-0" />
                <span className="text-xs text-cyan font-medium">Awaiting GPS permission…</span>
              </div>
            )}

            {trackerStatus.status === "error" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-danger" />
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-danger">Permission Denied / Error</p>
                    <p className="text-danger/80 leading-relaxed">{trackerStatus.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setGeoEnabled(false); setTimeout(() => setGeoEnabled(true), 100); }}
                  className="w-full rounded-xl gradient-primary text-primary-foreground text-xs font-semibold py-2.5 hover:scale-[1.02] transition"
                >
                  Retry GPS Access
                </button>
              </div>
            )}

            {trackerStatus.status === "tracking" && (
              <div className="space-y-3">
                {/* State Badges */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/15 border border-success/30 text-[10px] font-semibold text-success uppercase tracking-wider">
                    <span className="relative flex size-1.5">
                      <span className="absolute inset-0 rounded-full bg-success pulse-ring opacity-80" />
                      <span className="relative rounded-full bg-success size-1.5" />
                    </span>
                    Tracking Active
                  </div>

                  {trackerStatus.syncStatus === "syncing" && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan/10 border border-cyan/30 text-[10px] font-semibold text-cyan uppercase tracking-wider">
                      <Navigation className="size-3 animate-spin" /> Upserting
                    </div>
                  )}
                  {trackerStatus.syncStatus === "success" && (
                    <div className="px-2.5 py-1 rounded-md bg-success/10 border border-success/30 text-[10px] font-semibold text-success uppercase tracking-wider">
                      Sync OK
                    </div>
                  )}
                  {trackerStatus.syncStatus === "error" && (
                    <div className="px-2.5 py-1 rounded-md bg-danger/10 border border-danger/30 text-[10px] font-semibold text-danger uppercase tracking-wider">
                      Sync Failed
                    </div>
                  )}
                </div>

                {/* Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-black/20 rounded-xl px-3 py-2 border border-border/40">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Latitude</span>
                    <span className="text-white">{trackerStatus.latitude.toFixed(6)}°</span>
                  </div>
                  <div className="bg-black/20 rounded-xl px-3 py-2 border border-border/40">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Longitude</span>
                    <span className="text-white">{trackerStatus.longitude.toFixed(6)}°</span>
                  </div>
                  <div className="bg-black/20 rounded-xl px-3 py-2 border border-border/40">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">GPS Acc</span>
                    <span className="text-success">±{Math.round(trackerStatus.accuracy)}m</span>
                  </div>
                  <div className="bg-black/20 rounded-xl px-3 py-2 border border-border/40">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">Database Sync</span>
                    <span className={trackerStatus.syncStatus === "error" ? "text-danger" : "text-cyan"}>
                      {trackerStatus.lastSyncedAt ? new Date(trackerStatus.lastSyncedAt).toLocaleTimeString() : "Pending…"}
                    </span>
                  </div>
                </div>

                {/* Sync Error Detail */}
                {trackerStatus.syncStatus === "error" && trackerStatus.syncError && (
                  <div className="p-2.5 rounded-lg bg-danger/10 border border-danger/20 text-[10px] text-danger mt-1">
                    <span className="font-semibold block mb-0.5">Insert Failed:</span>
                    {trackerStatus.syncError}
                  </div>
                )}

                <button
                  onClick={() => setGeoEnabled(false)}
                  className="w-full mt-2 rounded-xl glass py-2 text-[11px] font-medium text-muted-foreground hover:text-white hover:bg-white/10 transition border border-border/50"
                >
                  Stop Debug Session
                </button>
              </div>
            )}
          </div>

          {/* Search + filter */}
          <div className="glass rounded-3xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user ID…"
                className="w-full pl-9 pr-3 h-10 rounded-xl bg-white/5 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {filterPills.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                    statusFilter === f.key
                      ? "gradient-primary text-primary-foreground border-transparent"
                      : "border-border hover:bg-white/5"
                  )}
                >
                  {f.label}
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
              <button 
                onClick={() => setJoinModalOpen(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan/10 hover:bg-cyan/20 text-cyan text-[10px] font-semibold uppercase tracking-wider transition"
              >
                <LinkIcon className="size-3" />
                Invite
              </button>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="py-6 flex flex-col items-center gap-2 text-center">
                <MapPin className="size-8 text-muted-foreground opacity-40" />
                <p className="text-xs text-muted-foreground">
                  {allUsers.length === 0 ? "No users tracked yet." : "No users match filter."}
                </p>
                {allUsers.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/60">
                    Open the site on another device to see it appear here.
                  </p>
                )}
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-hide">
                {filteredUsers.map((loc) => {
                  const isYou = loc.user_id === deviceId;
                  const initials = isYou ? "YOU" : shortId(loc.user_id).slice(0, 3);
                  const timeSince = Math.round((Date.now() - new Date(loc.updated_at).getTime()) / 1000);
                  const isRecent = timeSince < 15;

                  return (
                    <li
                      key={loc.user_id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-xl transition",
                        isYou ? "bg-cyan/5 border border-cyan/20" : "hover:bg-white/5 cursor-pointer"
                      )}
                    >
                      <div className="relative shrink-0">
                        <div className={cn("size-9 rounded-xl flex items-center justify-center text-xs font-bold", isYou ? "gradient-primary" : "gradient-violet")}>
                          {initials}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background"
                          style={{ background: isRecent ? "var(--success)" : "var(--warning)", boxShadow: `0 0 8px ${isRecent ? "var(--success)" : "var(--warning)"}` }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: isYou ? "var(--cyan)" : undefined }}>
                          {isYou ? "You (Live)" : loc.username || `User ${shortId(loc.user_id)}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {loc.latitude.toFixed(3)}°, {loc.longitude.toFixed(3)}°{" · "}
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
      
      <GenerateJoinLinkModal open={joinModalOpen} onClose={() => setJoinModalOpen(false)} />
    </DashboardShell>
  );
}
