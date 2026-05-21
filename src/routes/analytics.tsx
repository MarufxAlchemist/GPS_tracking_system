import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Sparkles, TrendingUp, Activity, Layers } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Radar as RadarR, RadarChart, PolarAngleAxis, PolarGrid } from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — GeoFence" }] }),
  component: Analytics,
});

const trend = Array.from({ length: 30 }, (_, i) => ({ d: i+1, value: 70 + Math.round(Math.sin(i/3)*10 + Math.random()*8) }));
const flow = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], in: 60+Math.round(Math.random()*30), out: 40+Math.round(Math.random()*25) }));
const radar = [
  { z: "Campus A", v: 88 }, { z: "Library", v: 92 }, { z: "Field", v: 41 },
  { z: "Hostel", v: 67 }, { z: "Cafeteria", v: 78 }, { z: "Gym", v: 53 },
];
const heat = Array.from({ length: 7*24 }, () => Math.random());

function Analytics() {
  return (
    <DashboardShell title="Analytics" subtitle="AI-driven movement intelligence">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <Header title="Attendance trend" sub="30-day rolling" />
          <div className="h-64 mt-4">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.16 200)" stopOpacity={0.7}/>
                    <stop offset="100%" stopColor="oklch(0.6 0.24 285)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="d" stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="value" stroke="oklch(0.82 0.16 200)" strokeWidth={2} fill="url(#ga)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 size-48 bg-violet/30 blur-3xl rounded-full" />
          <Header title="AI Insights" icon={<Sparkles className="size-4 text-cyan" />} />
          <ul className="relative mt-4 space-y-3 text-sm">
            {[
              "Peak movement detected Wed 11am — recommend 2 extra responders.",
              "Library has 14% more dwell time vs. last month.",
              "5 students show consistent late entry — auto-flagged.",
              "Geofence 'East Gate' shows 22 anomaly exits.",
            ].map((t, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="size-1.5 mt-2 rounded-full bg-cyan shrink-0 shadow-[0_0_8px_var(--cyan)]" />
                <span className="text-muted-foreground">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <Header title="Zone flow · entries vs exits" sub="Monthly" />
          <div className="h-60 mt-4">
            <ResponsiveContainer>
              <BarChart data={flow}>
                <defs>
                  <linearGradient id="bin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.82 0.16 200)"/><stop offset="100%" stopColor="oklch(0.65 0.22 245)"/></linearGradient>
                  <linearGradient id="bout" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.6 0.24 285)"/><stop offset="100%" stopColor="oklch(0.55 0.24 285)"/></linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Bar dataKey="in" fill="url(#bin)" radius={[6,6,0,0]} />
                <Bar dataKey="out" fill="url(#bout)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <Header title="Zone utilization" sub="By area" icon={<Layers className="size-4 text-cyan" />} />
          <div className="h-60 mt-4">
            <ResponsiveContainer>
              <RadarChart data={radar}>
                <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
                <PolarAngleAxis dataKey="z" stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <RadarR name="util" dataKey="v" stroke="oklch(0.82 0.16 200)" fill="oklch(0.82 0.16 200)" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 glass rounded-3xl p-6">
        <Header title="Movement heatmap" sub="Last 7 days · hourly" icon={<Activity className="size-4 text-cyan" />} />
        <div className="mt-4 grid grid-cols-24 gap-1" style={{ gridTemplateColumns: "repeat(24, 1fr)" }}>
          {heat.map((v, i) => (
            <div key={i} className="aspect-square rounded-[3px]" style={{
              background: `color-mix(in oklab, var(--cyan) ${Math.round(v*90)}%, transparent)`,
              boxShadow: v > 0.85 ? "0 0 8px var(--cyan)" : undefined,
            }} />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
        </div>
      </div>
    </DashboardShell>
  );
}

function Header({ title, sub, icon }: { title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-display font-semibold flex items-center gap-2">{icon}{title}</h3>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <TrendingUp className="size-4 text-muted-foreground" />
    </div>
  );
}
