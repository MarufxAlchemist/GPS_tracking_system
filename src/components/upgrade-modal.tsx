import { X, Check, Sparkles, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

const plans = [
  {
    name: "Free",
    price: "$0",
    per: "forever",
    color: "muted",
    features: ["Up to 3 zones", "25 tracked devices", "7-day alert history", "Email support"],
    cta: "Current plan",
    disabled: true,
  },
  {
    name: "Pro",
    price: "$49",
    per: "per month",
    color: "cyan",
    features: ["Unlimited zones", "500 tracked devices", "90-day history", "AI insights", "Priority support", "SOS pipeline"],
    cta: "Start 14-day trial",
    disabled: false,
    recommended: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "contact us",
    color: "violet",
    features: ["Everything in Pro", "Unlimited devices", "Custom integrations", "Dedicated CSM", "SLA 99.99%", "On-premise option"],
    cta: "Contact sales",
    disabled: false,
  },
];

export function UpgradeModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-3xl glass-strong rounded-3xl border border-border/50 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="relative p-6 border-b border-border/50 overflow-hidden">
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-violet/30 blur-3xl" />
            <div className="absolute -top-8 left-24 size-32 rounded-full bg-cyan/20 blur-3xl" />
            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl gradient-primary flex items-center justify-center glow-cyan">
                  <Sparkles className="size-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Upgrade GeoFence</h2>
                  <p className="text-sm text-muted-foreground">Unlock unlimited zones, AI insights and more.</p>
                </div>
              </div>
              <button onClick={onClose} className="size-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="p-6 grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl p-5 border transition",
                  plan.recommended
                    ? "border-cyan/40 bg-cyan/5"
                    : "border-border/50 glass",
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full gradient-primary text-primary-foreground text-[10px] font-semibold font-mono uppercase tracking-wider">
                    Recommended
                  </div>
                )}
                <div className="flex items-center gap-2 mb-4">
                  {plan.name === "Pro" ? <Zap className="size-4 text-cyan" /> : plan.name === "Enterprise" ? <Shield className="size-4 text-violet" /> : null}
                  <span className="font-display font-bold">{plan.name}</span>
                </div>
                <div className="mb-4">
                  <span className="font-display text-3xl font-bold">{plan.price}</span>
                  <span className="text-xs text-muted-foreground ml-1">/ {plan.per}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="size-3.5 mt-0.5 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={plan.disabled}
                  onClick={onClose}
                  className={cn(
                    "w-full rounded-xl py-2.5 text-sm font-semibold transition",
                    plan.disabled
                      ? "glass text-muted-foreground cursor-default"
                      : plan.recommended
                        ? "gradient-primary text-primary-foreground glow-cyan hover:scale-[1.02]"
                        : "glass hover:bg-white/10",
                  )}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
