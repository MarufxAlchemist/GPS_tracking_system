import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { LiveMap } from "@/components/live-map";
import { Hexagon, Circle, QrCode, Plus, Trash2, Edit3 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/zones")({
  head: () => ({ meta: [{ title: "Zones — GeoFence" }] }),
  component: Zones,
});

function Zones() {
  const [radius, setRadius] = useState(120);
  const [shape, setShape] = useState<"circle" | "polygon">("circle");
  const [name, setName] = useState("New Geofence");

  const zones = [
    { name: "Campus A", users: 412, color: "cyan" },
    { name: "Library", users: 184, color: "violet" },
    { name: "Field", users: 96, color: "success" },
    { name: "Hostel Block", users: 318, color: "warning" },
  ];

  return (
    <DashboardShell title="Zone Designer" subtitle="Draw, edit and provision geofences with millimeter precision">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 relative">
          <LiveMap height={620} />
        </div>

        <div className="space-y-5">
          <div className="glass rounded-3xl p-5">
            <h3 className="font-display font-semibold text-sm">Create Zone</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-border">
              {(["circle", "polygon"] as const).map((s) => (
                <button key={s} onClick={() => setShape(s)} className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition ${shape===s ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {s === "circle" ? <Circle className="size-3.5" /> : <Hexagon className="size-3.5" />}
                  {s[0].toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>

            <label className="block mt-4">
              <span className="text-xs text-muted-foreground">Zone name</span>
              <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40" />
            </label>

            <div className="mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Radius</span>
                <span className="font-mono text-cyan">{radius} m</span>
              </div>
              <input type="range" min={20} max={500} value={radius} onChange={(e)=>setRadius(+e.target.value)}
                className="mt-2 w-full accent-cyan" />
            </div>

            <button className="mt-5 w-full rounded-2xl gradient-primary text-primary-foreground font-semibold py-3 inline-flex items-center justify-center gap-2 glow-cyan hover:scale-[1.02] transition">
              <Plus className="size-4" /> Save Geofence
            </button>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">QR Provisioning</h3>
              <QrCode className="size-4 text-cyan" />
            </div>
            <div className="mt-3 grid place-items-center p-5 rounded-2xl bg-white/5">
              <div className="size-32 rounded-xl bg-foreground p-2">
                <div className="size-full rounded-lg" style={{ background: "repeating-conic-gradient(#0a0e1a 0deg 90deg, #fff 90deg 180deg) 0 0 / 12px 12px" }} />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground text-center">Scan to enroll a device into <span className="text-foreground font-medium">{name}</span></p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-display font-semibold mb-3">Existing Zones</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((z) => (
            <div key={z.name} className="group glass rounded-3xl p-5 relative overflow-hidden hover:-translate-y-0.5 transition">
              <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-60" style={{ background: `var(--${z.color})` }} />
              <div className="relative flex items-center justify-between">
                <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in oklab, var(--${z.color}) 20%, transparent)`, color: `var(--${z.color})` }}>
                  <Hexagon className="size-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center"><Edit3 className="size-3.5" /></button>
                  <button className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center"><Trash2 className="size-3.5 text-danger" /></button>
                </div>
              </div>
              <div className="relative mt-4">
                <div className="font-display font-semibold">{z.name}</div>
                <div className="text-xs text-muted-foreground">{z.users} active devices</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
