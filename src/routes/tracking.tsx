import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { LiveMap } from "@/components/live-map";
import { Search, Filter, Layers, Crosshair, Flame, Users, MapPin, Activity } from "lucide-react";

export const Route = createFileRoute("/tracking")({
  head: () => ({ meta: [{ title: "Live Tracking — GeoFence" }] }),
  component: Tracking,
});

function Tracking() {
  return (
    <DashboardShell title="Live Tracking" subtitle="Realtime device telemetry · 1,284 active">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 relative">
          <LiveMap height={680} />
          {/* Floating controls */}
          <div className="absolute top-4 right-4 glass rounded-2xl p-2 flex flex-col gap-1">
            {[Layers, Crosshair, Flame].map((I, i) => (
              <button key={i} className="size-10 rounded-xl hover:bg-white/10 flex items-center justify-center transition group">
                <I className="size-4 text-muted-foreground group-hover:text-cyan transition" />
              </button>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="glass rounded-3xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input placeholder="Search user…" className="w-full pl-9 pr-3 h-10 rounded-xl bg-white/5 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { l: "All", c: "cyan" },
                { l: "Safe", c: "success" },
                { l: "Warning", c: "warning" },
                { l: "Alert", c: "danger" },
              ].map((f, i) => (
                <button key={f.l} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${i===0 ? "gradient-primary text-primary-foreground border-transparent" : "border-border hover:bg-white/5"}`}>
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">Active Users</h3>
              <span className="text-[10px] font-mono text-muted-foreground">12 visible</span>
            </div>
            <ul className="mt-3 space-y-1.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-hide">
              {["Aarav S.", "Maya V.", "Liam Q.", "Zara A.", "Noah K.", "Eva L.", "Kai T.", "Mia R.", "Leo P.", "Aria B.", "Ravi N.", "Iris H."].map((n, i) => {
                const status = i === 1 ? "alert" : i % 4 === 0 ? "warn" : "safe";
                const color = status === "alert" ? "var(--danger)" : status === "warn" ? "var(--warning)" : "var(--success)";
                return (
                  <li key={n} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition">
                    <div className="relative">
                      <div className="size-9 rounded-xl gradient-violet flex items-center justify-center text-xs font-bold">{n.split(" ").map(s=>s[0]).join("")}</div>
                      <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{n}</div>
                      <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><MapPin className="size-2.5" /> {status === "alert" ? "East Gate" : "Campus A"}</div>
                    </div>
                    <Activity className="size-3.5 text-muted-foreground group-hover:text-cyan transition" />
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
