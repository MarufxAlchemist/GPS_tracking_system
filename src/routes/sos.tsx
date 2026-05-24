import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ShieldAlert, MapPin, Clock, CheckCircle2, AlertOctagon, Phone, Radio } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sos")({
  head: () => ({ meta: [{ title: "SOS Reports — GeoFence" }] }),
  component: SosReports,
});

interface SosEvent {
  id: string;
  user: string;
  userId: string;
  location: string;
  coordinates: string;
  time: string;
  date: string;
  status: "active" | "responding" | "resolved";
  responder?: string;
  resolvedIn?: string;
}

const EVENTS: SosEvent[] = [
  { id: "e1", user: "Maruf Nadaf", userId: "ID 4421", location: "East Gate", coordinates: "12.9716°N, 77.5946°E", time: "just now", date: "Today", status: "active" },
  { id: "e2", user: "Gautam Iyengar", userId: "ID 3001", location: "Hostel Block C", coordinates: "12.9720°N, 77.5952°E", time: "3 min ago", date: "Today", status: "responding", responder: "Officer Chen" },
  { id: "e3", user: "Anuja Naik", userId: "ID 3187", location: "Library Exit", coordinates: "12.9711°N, 77.5941°E", time: "1 hr ago", date: "Today", status: "resolved", responder: "Officer Patel", resolvedIn: "4m 22s" },
  { id: "e4", user: "Samidha Ghorpade", userId: "ID 8801", location: "Parking Lot B", coordinates: "12.9725°N, 77.5958°E", time: "3 hr ago", date: "Today", status: "resolved", responder: "Officer Lee", resolvedIn: "6m 11s" },
  { id: "e5", user: "Harsh Joshi", userId: "ID 2290", location: "Field North", coordinates: "12.9709°N, 77.5938°E", time: "Yesterday", date: "Yesterday", status: "resolved", responder: "Officer Chen", resolvedIn: "3m 45s" },
];

const statusCfg = {
  active: { label: "ACTIVE", color: "danger", Icon: AlertOctagon },
  responding: { label: "RESPONDING", color: "warning", Icon: Radio },
  resolved: { label: "RESOLVED", color: "success", Icon: CheckCircle2 },
};

function SosReports() {
  const [events, setEvents] = useState<SosEvent[]>(EVENTS);
  const [filter, setFilter] = useState<"all" | "active" | "responding" | "resolved">("all");

  const filtered = events.filter((e) => filter === "all" || e.status === filter);

  const activeCount = events.filter((e) => e.status === "active").length;
  const respondingCount = events.filter((e) => e.status === "responding").length;
  const resolvedCount = events.filter((e) => e.status === "resolved").length;

  const dispatch = (id: string) => {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: "responding", responder: "Officer Chen" } : e));
    toast.success("Responder dispatched!");
  };

  const resolve = (id: string) => {
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: "resolved", resolvedIn: "2m 15s" } : e));
    toast.success("SOS event resolved.");
  };

  return (
    <DashboardShell title="SOS Reports" subtitle="Emergency incident command center">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass rounded-3xl p-5 relative overflow-hidden border border-danger/20">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-danger" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-danger/20 text-danger flex items-center justify-center"><AlertOctagon className="size-5" /></div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Active SOS</div>
              <div className="font-display text-3xl font-bold text-danger">{activeCount}</div>
            </div>
          </div>
        </div>
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-warning" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-warning/20 text-warning flex items-center justify-center"><Radio className="size-5" /></div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Responding</div>
              <div className="font-display text-3xl font-bold text-warning">{respondingCount}</div>
            </div>
          </div>
        </div>
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-success" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-success/20 text-success flex items-center justify-center"><CheckCircle2 className="size-5" /></div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Resolved Today</div>
              <div className="font-display text-3xl font-bold text-success">{resolvedCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "active", "responding", "resolved"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition",
              filter === f ? "gradient-primary text-primary-foreground" : "glass hover:bg-white/10 text-muted-foreground"
            )}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Events */}
      <div className="mt-4 space-y-3">
        {filtered.map((event) => {
          const cfg = statusCfg[event.status];
          return (
            <div
              key={event.id}
              className={cn(
                "glass rounded-3xl p-5 relative overflow-hidden transition hover:-translate-y-0.5",
                event.status === "active" && "border border-danger/30"
              )}
            >
              {event.status === "active" && (
                <div className="absolute -top-8 -right-8 size-32 rounded-full blur-2xl opacity-30 bg-danger" />
              )}
              <div className="relative flex items-start gap-4">
                <div
                  className="size-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in oklab, var(--${cfg.color}) 20%, transparent)`, color: `var(--${cfg.color})` }}
                >
                  <cfg.Icon className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold">{event.user}</span>
                        <span className="text-xs font-mono text-muted-foreground">{event.userId}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{event.location}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="size-3" />{event.time} · {event.date}</span>
                        <span className="font-mono">{event.coordinates}</span>
                      </div>
                      {event.responder && (
                        <div className="mt-1.5 text-xs" style={{ color: `var(--${cfg.color})` }}>
                          Responder: {event.responder}{event.resolvedIn ? ` · Resolved in ${event.resolvedIn}` : " · En route"}
                        </div>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0"
                      style={{ background: `color-mix(in oklab, var(--${cfg.color}) 15%, transparent)`, color: `var(--${cfg.color})`, borderColor: `color-mix(in oklab, var(--${cfg.color}) 40%, transparent)` }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {event.status !== "resolved" && (
                <div className="relative mt-4 flex gap-2">
                  {event.status === "active" && (
                    <button
                      onClick={() => dispatch(event.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-semibold glow-cyan hover:scale-[1.02] transition"
                    >
                      <Phone className="size-3.5" /> Dispatch Responder
                    </button>
                  )}
                  <button
                    onClick={() => resolve(event.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-xs font-medium hover:bg-white/10 transition"
                  >
                    <CheckCircle2 className="size-3.5 text-success" /> Mark Resolved
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
