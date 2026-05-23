import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { LiveMap } from "@/components/live-map";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Search, Layers, Crosshair, Flame, MapPin, Activity, Navigation, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/tracking")({
  head: () => ({ meta: [{ title: "Live Tracking — GeoFence" }] }),
  component: Tracking,
});

function Tracking() {
  const [geoEnabled, setGeoEnabled] = useState(true);
  const geoState = useGeolocation(geoEnabled);

  return (
    <DashboardShell title="Live Tracking" subtitle="Realtime device telemetry · 1,284 active">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 relative">
          <LiveMap height={680} geoState={geoState} />
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
          {/* Your location card */}
          <div className="glass rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation className="size-4" style={{ color: "var(--cyan)" }} />
              <span className="text-sm font-semibold font-display">Your Location</span>
            </div>

            {geoState.status === "idle" && (
              <button
                onClick={() => setGeoEnabled(true)}
                className="w-full rounded-xl gradient-primary text-primary-foreground text-xs font-semibold py-2.5"
              >
                Share Location
              </button>
            )}

            {geoState.status === "requesting" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="size-4 rounded-full border border-cyan/40 border-t-cyan animate-spin" />
                Requesting permission…
              </div>
            )}

            {geoState.status === "active" && (
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
                    <span style={{ color: "var(--cyan)" }}>{geoState.lat.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between glass rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground">LON</span>
                    <span style={{ color: "var(--cyan)" }}>{geoState.lon.toFixed(5)}°</span>
                  </div>
                  <div className="flex justify-between glass rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground">ACC</span>
                    <span style={{ color: "var(--success)" }}>±{Math.round(geoState.accuracy)}m</span>
                  </div>
                  {geoState.heading !== null && (
                    <div className="flex justify-between glass rounded-lg px-2.5 py-1.5">
                      <span className="text-muted-foreground">HDG</span>
                      <span>{Math.round(geoState.heading)}°</span>
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

            {geoState.status === "error" && (
              <div className="space-y-2">
                <div className="flex items-start gap-1.5 p-2 rounded-lg bg-danger/10 border border-danger/20">
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
                  <p className="text-[11px]" style={{ color: "var(--danger)" }}>{geoState.message}</p>
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
              <span className="text-[10px] font-mono text-muted-foreground">{geoState.status === "active" ? "13" : "12"} visible</span>
            </div>
            <ul className="mt-3 space-y-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-hide">
              {/* Real user entry */}
              {geoState.status === "active" && (
                <li className="flex items-center gap-3 p-2 rounded-xl bg-cyan/5 border border-cyan/20">
                  <div className="relative">
                    <div className="size-9 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold">YOU</div>
                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-background" style={{ background: "var(--cyan)", boxShadow: "0 0 8px var(--cyan)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "var(--cyan)" }}>You (Live)</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{geoState.lat.toFixed(3)}°, {geoState.lon.toFixed(3)}°</div>
                  </div>
                  <Navigation className="size-3.5" style={{ color: "var(--cyan)" }} />
                </li>
              )}
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
