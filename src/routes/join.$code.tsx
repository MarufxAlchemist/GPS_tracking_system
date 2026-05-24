import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Radio,
  Satellite,
  Signal,
  Loader2,
} from "lucide-react";
import { useLocationTracker } from "@/hooks/use-location-tracker";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/join/$code")({
  head: () => ({
    meta: [
      { title: "Join Tracking Session — GeoFence" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
      },
    ],
  }),
  component: JoinSession,
});

// ---------------------------------------------------------------------------
// Persistent session ID — survives page reloads / tab closures
// ---------------------------------------------------------------------------
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr-placeholder";
  const key = "geofence_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    if (crypto?.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem(key, id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function JoinSession() {
  const { code } = Route.useParams();
  const [sessionId] = useState<string>(() => getOrCreateSessionId());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const autoStarted = useRef(false);

  const { trackerStatus, start } = useLocationTracker({
    userId: sessionId,
    username: `Session ${code.toUpperCase()}`,
    intervalMs: 5_000,
  });

  // Auto-start tracking immediately on mount — no button click needed
  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    // Small delay to let the component mount / paint first
    const timer = setTimeout(() => start(), 300);
    return () => clearTimeout(timer);
  }, [start]);

  // Elapsed-time counter while actively tracking
  useEffect(() => {
    if (trackerStatus.status !== "tracking") return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [trackerStatus.status]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Derive status color
  const isTracking = trackerStatus.status === "tracking";
  const isRequesting = trackerStatus.status === "requesting";
  const isError = trackerStatus.status === "error";
  const isIdle = trackerStatus.status === "idle";

  return (
    <div className="min-h-[100dvh] bg-[#0a0e1a] text-slate-200 flex flex-col items-center justify-center p-5 relative overflow-hidden font-sans select-none">
      {/* ---- Ambient background blurs ---- */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-[15%] left-[10%] size-80 bg-cyan/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] right-[10%] size-80 bg-violet/8 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-cyan/3 rounded-full blur-[200px]" />
      </div>

      {/* ---- Grid overlay ---- */}
      <div className="fixed inset-0 grid-bg opacity-40 pointer-events-none" aria-hidden />

      {/* ---- Main card ---- */}
      <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="glass-strong rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
          {/* ---------- Header banner ---------- */}
          <div className="relative px-6 pt-8 pb-6 flex flex-col items-center text-center">
            {/* Icon */}
            <div
              className={cn(
                "size-16 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-700",
                isTracking
                  ? "bg-success/15 border border-success/30 shadow-[0_0_40px_-8px_rgba(34,197,94,0.4)]"
                  : isError
                    ? "bg-danger/15 border border-danger/30"
                    : "bg-cyan/10 border border-cyan/20 shadow-[0_0_40px_-8px_rgba(34,211,238,0.3)]",
              )}
            >
              {isTracking && (
                <Satellite className="size-8 text-success animate-in zoom-in duration-500" />
              )}
              {isRequesting && (
                <Loader2 className="size-8 text-cyan animate-spin" />
              )}
              {isError && (
                <AlertTriangle className="size-8 text-danger" />
              )}
              {isIdle && <MapPin className="size-8 text-cyan" />}
            </div>

            <h1 className="font-display font-bold text-[22px] text-white mb-1.5 tracking-tight">
              {isTracking
                ? "Tracking Active"
                : isError
                  ? "Permission Required"
                  : "Connecting…"}
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[260px]">
              {isTracking
                ? "Your location is streaming securely to the dashboard."
                : isRequesting
                  ? "Please allow location access when prompted by your browser."
                  : isError
                    ? "Location access was denied. Please enable it and try again."
                    : "Initializing geolocation telemetry…"}
            </p>
          </div>

          {/* ---------- Session ID badge ---------- */}
          <div className="mx-6 mb-5">
            <div className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-border/40 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Session
              </span>
              <span className="text-sm font-mono font-bold tracking-[0.15em] text-white">
                {code.toUpperCase()}
              </span>
            </div>
          </div>

          {/* ---------- Live telemetry panel (tracking state) ---------- */}
          {isTracking && trackerStatus.status === "tracking" && (
            <div className="mx-6 mb-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <div className="rounded-2xl bg-success/[0.06] border border-success/20 p-4 space-y-3">
                {/* Pulse indicator */}
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
                    <span className="relative rounded-full bg-success size-2.5" />
                  </span>
                  <span className="text-xs font-semibold text-success uppercase tracking-wider">
                    Live
                  </span>
                  <span className="ml-auto text-[11px] font-mono text-muted-foreground">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>

                {/* Coordinates grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/20 rounded-xl px-3 py-2">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Latitude
                    </span>
                    <span className="text-[13px] font-mono font-medium text-white">
                      {trackerStatus.latitude.toFixed(6)}°
                    </span>
                  </div>
                  <div className="bg-black/20 rounded-xl px-3 py-2">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Longitude
                    </span>
                    <span className="text-[13px] font-mono font-medium text-white">
                      {trackerStatus.longitude.toFixed(6)}°
                    </span>
                  </div>
                  <div className="bg-black/20 rounded-xl px-3 py-2">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Accuracy
                    </span>
                    <span className="text-[13px] font-mono font-medium" style={{ color: "var(--cyan)" }}>
                      ±{Math.round(trackerStatus.accuracy)}m
                    </span>
                  </div>
                  <div className="bg-black/20 rounded-xl px-3 py-2">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Last Sync
                    </span>
                    <span className="text-[13px] font-mono font-medium text-white">
                      {trackerStatus.lastSyncedAt
                        ? new Date(trackerStatus.lastSyncedAt).toLocaleTimeString()
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------- Requesting state — pulsing animation ---------- */}
          {isRequesting && (
            <div className="mx-6 mb-5 animate-in fade-in duration-500">
              <div className="rounded-2xl bg-cyan/[0.06] border border-cyan/20 p-5 flex flex-col items-center gap-3">
                <div className="relative size-12">
                  <div className="absolute inset-0 border-2 border-cyan/20 rounded-full animate-ping" />
                  <div className="absolute inset-2 border-2 border-cyan/30 rounded-full animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Signal className="size-5 text-cyan" />
                  </div>
                </div>
                <p className="text-xs text-cyan/80 text-center">
                  Waiting for GPS permission…
                </p>
              </div>
            </div>
          )}

          {/* ---------- Error state — retry button ---------- */}
          {isError && trackerStatus.status === "error" && (
            <div className="mx-6 mb-5 animate-in fade-in duration-300">
              <div className="rounded-2xl bg-danger/[0.06] border border-danger/20 p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-danger" />
                  <p className="text-xs text-danger/90 leading-relaxed">
                    {trackerStatus.message}
                  </p>
                </div>
                <button
                  onClick={() => {
                    autoStarted.current = false;
                    start();
                  }}
                  className="w-full h-11 gradient-primary text-primary-foreground rounded-xl text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
                >
                  <Navigation className="size-4" />
                  Retry GPS Access
                </button>
              </div>
            </div>
          )}

          {/* ---------- Footer ---------- */}
          <div className="px-6 pb-6">
            {/* Tracking active success badge */}
            {isTracking && (
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-success/[0.08] border border-success/20 mb-4 animate-in fade-in zoom-in-95 duration-500">
                <CheckCircle2 className="size-3.5 text-success" />
                <span className="text-[11px] font-medium text-success">
                  GPS streaming every 5 seconds
                </span>
              </div>
            )}

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/70">
              <ShieldCheck className="size-3 text-success/60" />
              <span>Encrypted telemetry · Session {sessionId.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* ---------- Bottom attribution ---------- */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
            <Radio className="size-3" />
            <span>Powered by GeoFence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
