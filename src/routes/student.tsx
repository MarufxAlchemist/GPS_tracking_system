import { createFileRoute, Link } from "@tanstack/react-router";
import { LiveMap } from "@/components/live-map";
import { JoinZoneModal } from "@/components/join-zone-modal";
import { Radar, ShieldCheck, Battery, Wifi, MapPin, ChevronRight, AlertOctagon, ClipboardCheck, Hexagon, Bell } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/student")({
  head: () => ({ meta: [{ title: "My Status — GeoFence" }] }),
  component: Student,
});

function Student() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [sosProgress, setSosProgress] = useState(0); // 0–100
  const [sosFired, setSosFired] = useState(false);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStart = useRef<number>(0);
  const HOLD_DURATION = 1500; // ms

  const startHold = useCallback(() => {
    if (sosFired) return;
    holdStart.current = Date.now();
    holdInterval.current = setInterval(() => {
      const elapsed = Date.now() - holdStart.current;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setSosProgress(pct);
      if (pct >= 100) {
        clearInterval(holdInterval.current!);
        setSosFired(true);
        setSosProgress(100);
        toast.error("🚨 SOS signal sent! Responders have been notified.", { duration: 6000 });
        setTimeout(() => { setSosFired(false); setSosProgress(0); }, 4000);
      }
    }, 30);
  }, [sosFired]);

  const cancelHold = useCallback(() => {
    if (holdInterval.current) {
      clearInterval(holdInterval.current);
      holdInterval.current = null;
    }
    if (!sosFired) setSosProgress(0);
  }, [sosFired]);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 gradient-hero opacity-50" />
      <div className="pointer-events-none fixed inset-0 grid-bg grid-bg-fade opacity-50" />

      <div className="relative max-w-md mx-auto px-5 py-6 space-y-5">
        {/* Top */}
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-xl gradient-primary flex items-center justify-center glow-cyan"><Radar className="size-5 text-primary-foreground" /></div>
            <span className="font-display font-bold">GeoFence</span>
          </Link>
          <button
            onClick={() => toast.info("You have 2 unread notifications")}
            className="relative size-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition"
          >
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-danger ring-2 ring-background" />
          </button>
        </header>

        {/* Status hero */}
        <div className="relative glass-strong rounded-3xl p-6 overflow-hidden animated-border">
          <div className="absolute -top-16 -right-16 size-48 bg-success/30 blur-3xl rounded-full" />
          <div className="relative flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-success/20 text-success flex items-center justify-center"><ShieldCheck className="size-6" /></div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Current Status</p>
              <p className="font-display text-2xl font-bold">Inside Campus A</p>
            </div>
          </div>
          <div className="relative mt-5 grid grid-cols-3 gap-3 text-center">
            <Mini icon={<Wifi className="size-4 text-cyan" />} label="GPS" value="Strong" />
            <Mini icon={<Battery className="size-4 text-success" />} label="Battery" value="86%" />
            <Mini icon={<MapPin className="size-4 text-violet" />} label="Zone" value="Library" />
          </div>
        </div>

        {/* Mini map */}
        <div className="relative">
          <LiveMap height={260} compact />
          <div className="absolute bottom-3 left-3 glass rounded-2xl px-3 py-1.5 text-[11px] font-mono">You · 12.9716°N · 77.5946°E</div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Tile icon={<ClipboardCheck className="size-5 text-success" />} label="Attendance" value="Present" sub="Marked 8:42 AM" />
          <Tile icon={<Hexagon className="size-5 text-cyan" />} label="Active Zone" value="Library" sub="92% capacity" />
        </div>

        {/* Join zone */}
        <button
          onClick={() => setJoinOpen(true)}
          className="w-full flex items-center justify-between glass rounded-2xl p-4 hover:bg-white/10 transition"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl gradient-primary flex items-center justify-center"><Hexagon className="size-5 text-primary-foreground" /></div>
            <div className="text-left">
              <div className="font-semibold text-sm">Join a Zone</div>
              <div className="text-xs text-muted-foreground">Scan QR or enter code</div>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>

        {/* SOS hold-to-send */}
        <div
          className="relative w-full overflow-hidden rounded-3xl p-6 group select-none"
          style={{ background: "linear-gradient(135deg, oklch(0.5 0.25 25), oklch(0.45 0.24 15))" }}
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={startHold}
          onTouchEnd={cancelHold}
        >
          {/* Hold progress ring */}
          {sosProgress > 0 && (
            <div
              className="absolute inset-0 rounded-3xl transition-all"
              style={{
                background: `conic-gradient(oklch(1 0 0 / 0.4) ${sosProgress * 3.6}deg, transparent ${sosProgress * 3.6}deg)`,
              }}
            />
          )}
          <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition" style={{ background: "radial-gradient(circle at center, oklch(1 0 0 / 0.3), transparent 60%)" }} />
          <div className="relative flex flex-col items-center gap-2">
            <div className="relative">
              <span className="absolute inset-0 m-auto size-14 rounded-full bg-white/30 pulse-ring" />
              <div className="relative size-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <AlertOctagon className="size-7 text-white" />
              </div>
            </div>
            <div className="font-display text-xl font-bold text-white">
              {sosFired ? "SOS SENT ✓" : "SOS Emergency"}
            </div>
            <div className="text-xs text-white/80">
              {sosProgress > 0 && !sosFired
                ? `Hold… ${Math.round(sosProgress)}%`
                : "Hold 1.5s to send distress signal"}
            </div>
          </div>
        </div>
      </div>

      <JoinZoneModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </div>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="flex justify-center">{icon}</div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Tile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="size-9 rounded-xl bg-white/5 flex items-center justify-center">{icon}</div>
      <div className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold leading-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
