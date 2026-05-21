import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  label, value, delta, icon, accent = "cyan", sub,
}: {
  label: string; value: string; delta?: number; icon: ReactNode;
  accent?: "cyan" | "violet" | "success" | "warning" | "danger";
  sub?: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: "from-cyan/30 to-electric/10 text-cyan",
    violet: "from-violet/30 to-electric/10 text-violet",
    success: "from-success/30 to-success/5 text-success",
    warning: "from-warning/30 to-warning/5 text-warning",
    danger: "from-danger/30 to-danger/5 text-danger",
  };
  return (
    <div className="relative glass rounded-3xl p-5 overflow-hidden group hover:-translate-y-0.5 transition-transform">
      <div className={cn("absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-50 bg-gradient-to-br", accentMap[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn("size-10 rounded-2xl flex items-center justify-center bg-gradient-to-br", accentMap[accent])}>
          {icon}
        </div>
      </div>
      {typeof delta === "number" && (
        <div className="relative mt-3 flex items-center gap-1.5 text-xs">
          {delta >= 0 ? <TrendingUp className="size-3.5 text-success" /> : <TrendingDown className="size-3.5 text-danger" />}
          <span className={delta >= 0 ? "text-success" : "text-danger"}>{Math.abs(delta)}%</span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}
