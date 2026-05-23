import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { AlertCard } from "@/components/alert-card";
import { ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts — GeoFence" }] }),
  component: Alerts,
});

function Alerts() {
  return (
    <DashboardShell title="Alert Operations" subtitle="Triaged incident stream · live">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={<ShieldAlert className="size-4" />} label="Emergencies" value="2" color="danger" />
        <Stat icon={<AlertTriangle className="size-4" />} label="Warnings" value="14" color="warning" />
        <Stat icon={<CheckCircle2 className="size-4" />} label="Resolved Today" value="46" color="success" />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-4">
        <AlertCard severity="emergency" title="SOS Triggered" user="Maya Verma · ID 4421" location="East Gate" time="just now" description="Distress signal received. Responders dispatched, ETA 2 min." />
        <AlertCard severity="emergency" title="Device went dark" user="Noah Kim · ID 3001" location="Hostel Block C" time="3 min ago" description="No telemetry received for 4 minutes. Auto-escalated." />
        <AlertCard severity="warning" title="Left Geofence" user="Kai Tanaka · ID 3187" location="Campus A perimeter" time="6 min ago" />
        <AlertCard severity="warning" title="Idle outside zone" user="Iris Bloom · ID 2204" location="Library annex" time="11 min ago" />
        <AlertCard severity="warning" title="Battery critical" user="Aria Bose · ID 5511" location="Field" time="22 min ago" />
        <AlertCard severity="safe" title="Returned to zone" user="Leo Park · ID 1109" location="Field" time="31 min ago" />
        <AlertCard severity="safe" title="Attendance marked" user="Eva Lin · ID 0982" location="Block C" time="42 min ago" />
        <AlertCard severity="safe" title="Zone entered" user="Aarav S. · ID 0021" location="Library" time="58 min ago" />
      </div>
    </DashboardShell>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: "danger"|"warning"|"success" }) {
  return (
    <div className="glass rounded-3xl p-5 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-50" style={{ background: `var(--${color})` }} />
      <div className="relative flex items-center gap-3">
        <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in oklab, var(--${color}) 22%, transparent)`, color: `var(--${color})` }}>
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}
// try again
