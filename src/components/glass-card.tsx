import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children, className, glow, animated,
}: { children: ReactNode; className?: string; glow?: "cyan" | "violet" | "danger" | "none"; animated?: boolean }) {
  return (
    <div
      className={cn(
        "relative glass rounded-3xl",
        animated && "animated-border",
        glow === "cyan" && "glow-cyan",
        glow === "violet" && "glow-violet",
        glow === "danger" && "glow-danger",
        className,
      )}
    >
      {children}
    </div>
  );
}
