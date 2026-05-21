import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { LiveMap } from "@/components/live-map";
import { StatCard } from "@/components/stat-card";
import { AlertCard } from "@/components/alert-card";
import { Users, MapPin, Hexagon, ClipboardCheck, ShieldAlert, Activity, ArrowRight, Sparkles, Layers } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Command Center — GeoFence" }, { name: "description", content: "Realtime operations dashboard." }] }),
  component: Dashboard,
});

const attendance = Array.from({ length: 14 }, (_, i) => ({ d: `D${i+1}`, present: 80 + Math.round(Math.sin(i/2) * 8 + Math.random() * 6), expected: 100 }));
const movement = Array.from({ length: 24 }, (_, i) => ({ h: `${i}h`, value: Math.round(20 + Math.abs(Math.sin(i/3)*40) + Math.random()*8) }));

function Dashboard() {
  return (
    <DashboardShell title="Command Center" subtitle="Realtime overview · Northgate Campus">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active Students" value="1,284" delta={4.2} sub="of 1,420 enrolled" icon={<Users className="size-4" />} accent="cyan" />
        <StatCard label="Outside Zone" value="37" delta={-12} sub="6 require attention" icon={<MapPin className="size-4" />} accent="warning" />
        <StatCard label="Active Zones" value="14" delta={2} sub="3 created this week" icon={<Hexagon className="size-4" />} accent="violet" />
        <StatCard label="Attendance" value="94.6%" delta={1.8} sub="Today" icon={<ClipboardCheck className="size-4" />} accent="success" />
        <StatCard label="Emergency Alerts" value="2" delta={-50} sub="last 24h" icon={<ShieldAlert className="size-4" />} accent="danger" />
      </div>

      {/* Map + Alerts feed */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Live Operations Map</h2>
              <p className="text-xs text-muted-foreground">Geofences · Live markers · Movement flow</p>
            </div>
            <Link to="/tracking" className="text-xs font-medium text-cyan hover:underline inline-flex items-center gap-1">
              Open full view <ArrowRight className="size-3" />
            </Link>
          </div>
          <LiveMap height={520} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Realtime Alerts</h2>
            <span className="text-[10px] font-mono text-muted-foreground glass rounded-full px-2 py-1">12 today</span>
          </div>
          <AlertCard severity="emergency" title="SOS Triggered" user="Maya Verma · ID 4421" location="East Gate" time="just now" description="Distress signal received. Responders dispatched." />
          <AlertCard severity="warning" title="Left Geofence" user="Kai Tanaka · ID 3187" location="Campus A perimeter" time="2 min ago" />
          <AlertCard severity="warning" title="Idle outside zone" user="Iris Bloom · ID 2204" location="Library annex" time="6 min ago" />
          <AlertCard severity="safe" title="Returned to zone" user="Leo Park · ID 1109" location="Field" time="11 min ago" />
          <AlertCard severity="safe" title="Attendance marked" user="Eva Lin · ID 0982" location="Block C" time="18 min ago" />
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold">Attendance trend</h3>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
            <div className="flex gap-2 text-[10px] font-mono">
              <Legend dot="var(--cyan)" label="Present" />
              <Legend dot="var(--violet)" label="Expected" />
            </div>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer>
              <AreaChart data={attendance}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.82 0.16 200)" stopOpacity={0.6}/><stop offset="100%" stopColor="oklch(0.82 0.16 200)" stopOpacity={0}/></linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.6 0.24 285)" stopOpacity={0.4}/><stop offset="100%" stopColor="oklch(0.6 0.24 285)" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="d" stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="expected" stroke="oklch(0.6 0.24 285)" strokeWidth={1.5} fill="url(#g2)" />
                <Area type="monotone" dataKey="present" stroke="oklch(0.82 0.16 200)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-40 bg-violet/20 blur-3xl rounded-full" />
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-cyan" />
            <h3 className="font-display font-semibold">AI Insights</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              { t: "Attendance dipped 6% in Block C between 2–3pm. Likely caused by track meet.", c: "cyan" },
              { t: "Zone 'Library' is at 92% capacity. Consider opening overflow zone.", c: "warning" },
              { t: "Suggested geofence redraw at East Gate — 14 false exits this week.", c: "violet" },
            ].map((i, idx) => (
              <li key={idx} className="flex gap-3">
                <div className="size-2 mt-2 rounded-full shrink-0" style={{ background: `var(--${i.c})`, boxShadow: `0 0 10px var(--${i.c})` }} />
                <span className="text-muted-foreground">{i.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold">Hourly movement</h3>
              <p className="text-xs text-muted-foreground">Live ping volume</p>
            </div>
            <span className="text-[10px] font-mono glass rounded-full px-2 py-1">pings / hour</span>
          </div>
          <div className="h-52 mt-4">
            <ResponsiveContainer>
              <BarChart data={movement}>
                <defs>
                  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.82 0.16 200)"/><stop offset="100%" stopColor="oklch(0.6 0.24 285)"/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="h" stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <YAxis stroke="oklch(0.68 0.02 250)" fontSize={10} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.03 265)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                <Bar dataKey="value" fill="url(#bar)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-cyan" />
            <h3 className="font-display font-semibold">Zone Stats</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {[
              { name: "Campus A", count: 412, pct: 88 },
              { name: "Library", count: 184, pct: 92 },
              { name: "Field", count: 96, pct: 41 },
              { name: "Hostel Block", count: 318, pct: 67 },
            ].map((z) => (
              <li key={z.name}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{z.name}</span>
                  <span className="text-muted-foreground font-mono">{z.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full gradient-primary" style={{ width: `${z.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-5 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5"><Activity className="size-3 text-success" /> System healthy</span>
            <Link to="/zones" className="text-xs text-cyan hover:underline">Manage zones →</Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="size-2 rounded-full" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} /> {label}
    </span>
  );
}
