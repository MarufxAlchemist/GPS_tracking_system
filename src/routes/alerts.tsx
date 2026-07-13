import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { AlertCard, type AlertSeverity } from "@/components/alert-card";
import { ShieldAlert, AlertTriangle, CheckCircle2, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alerts — GeoFence" }] }),
  component: Alerts,
});

interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  user: string;
  location: string;
  time: string;
  description?: string;
  status: "active" | "acknowledged" | "resolved";
}

const INITIAL_ALERTS: AlertItem[] = [];

type FilterTab = "all" | "emergency" | "warning" | "resolved";

function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const acknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: "acknowledged" } : a));
    toast.success("Alert acknowledged.");
  };

  const resolve = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: "resolved" } : a));
    toast.success("Alert resolved.");
  };

  const filtered = alerts.filter((a) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "resolved") return a.status === "resolved";
    return a.severity === activeFilter && a.status !== "resolved";
  });

  const emergencies = alerts.filter((a) => a.severity === "emergency" && a.status !== "resolved").length;
  const warnings = alerts.filter((a) => a.severity === "warning" && a.status !== "resolved").length;
  const resolved = alerts.filter((a) => a.status === "resolved").length;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: alerts.length },
    { key: "emergency", label: "Emergency", count: emergencies },
    { key: "warning", label: "Warnings", count: warnings },
    { key: "resolved", label: "Resolved", count: resolved },
  ];

  return (
    <DashboardShell title="Alert Operations" subtitle="Triaged incident stream · live">
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={<ShieldAlert className="size-4" />} label="Emergencies" value={String(emergencies)} color="danger" />
        <Stat icon={<AlertTriangle className="size-4" />} label="Warnings" value={String(warnings)} color="warning" />
        <Stat icon={<CheckCircle2 className="size-4" />} label="Resolved Today" value={String(resolved)} color="success" />
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition inline-flex items-center gap-2",
              activeFilter === tab.key
                ? "gradient-primary text-primary-foreground"
                : "glass hover:bg-white/10 text-muted-foreground"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
              activeFilter === tab.key ? "bg-white/20" : "bg-white/10"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alert list. */}
      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="lg:col-span-2 py-16 text-center text-muted-foreground">
            <CheckCircle2 className="size-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No alerts in this category.</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <div key={alert.id} className="relative">
              <AlertCard
                severity={alert.severity}
                title={alert.title}
                user={alert.user}
                location={alert.location}
                time={alert.time}
                description={alert.description}
              />
              {/* Status badge & action buttons. */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                {alert.status === "acknowledged" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/20 text-cyan border border-cyan/30">
                    ACK
                  </span>
                )}
                {alert.status === "resolved" && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30">
                    RESOLVED
                  </span>
                )}
                {alert.status === "active" && (
                  <>
                    <button
                      onClick={() => acknowledge(alert.id)}
                      className="size-7 rounded-lg bg-cyan/10 hover:bg-cyan/20 flex items-center justify-center transition"
                      title="Acknowledge"
                    >
                      <Check className="size-3.5 text-cyan" />
                    </button>
                    <button
                      onClick={() => resolve(alert.id)}
                      className="size-7 rounded-lg bg-success/10 hover:bg-success/20 flex items-center justify-center transition"
                      title="Resolve"
                    >
                      <X className="size-3.5 text-success" />
                    </button>
                  </>
                )}
                {alert.status === "acknowledged" && (
                  <button
                    onClick={() => resolve(alert.id)}
                    className="size-7 rounded-lg bg-success/10 hover:bg-success/20 flex items-center justify-center transition"
                    title="Resolve"
                  >
                    <X className="size-3.5 text-success" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardShell>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: "danger" | "warning" | "success" }) {
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
