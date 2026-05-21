import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldAlert, CheckCircle2, MapPin, Clock } from "lucide-react";

export type AlertSeverity = "emergency" | "warning" | "safe";

export function AlertCard({
  severity, title, user, location, time, description,
}: {
  severity: AlertSeverity; title: string; user: string; location: string; time: string; description?: string;
}) {
  const cfg = {
    emergency: { Icon: ShieldAlert, color: "var(--danger)", glow: "glow-danger", chip: "bg-danger/20 text-danger border-danger/40", grad: "from-danger/20" },
    warning: { Icon: AlertTriangle, color: "var(--warning)", glow: "", chip: "bg-warning/20 text-warning border-warning/40", grad: "from-warning/15" },
    safe: { Icon: CheckCircle2, color: "var(--success)", glow: "", chip: "bg-success/20 text-success border-success/40", grad: "from-success/15" },
  }[severity];
  const Icon = cfg.Icon;
  return (
    <div className={cn("relative overflow-hidden glass rounded-2xl p-4 group hover:-translate-y-0.5 transition", severity === "emergency" && cfg.glow)}>
      <div className={cn("absolute inset-0 bg-gradient-to-r to-transparent opacity-50 pointer-events-none", cfg.grad)} />
      <div className="relative flex items-start gap-3">
        <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in oklab, ${cfg.color} 22%, transparent)`, color: cfg.color }}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{user}</p>
            </div>
            <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-mono", cfg.chip)}>
              {severity}
            </span>
          </div>
          {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{location}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-3" />{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
