import React, { useState, ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MapPin, Hexagon, ClipboardCheck, Bell, BarChart3, ShieldAlert, Settings, Radar, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Search, Bell as BellIcon, ChevronDown } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tracking", label: "Live Tracking", icon: MapPin },
  { to: "/zones", label: "Zones", icon: Hexagon },
  { to: "/attendance", label: "Attendance", icon: ClipboardCheck },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/sos", label: "SOS Reports", icon: ShieldAlert },
  { to: "/settings", label: "Settings", icon: Settings },
] satisfies { to: string; label: string; icon: React.ElementType }[];


export function DashboardShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 gradient-hero opacity-40" />
      <div className="pointer-events-none fixed inset-0 grid-bg grid-bg-fade opacity-50" />

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-0 h-screen shrink-0 transition-all duration-300 hidden md:flex flex-col glass-strong border-r border-border/50 z-30",
            collapsed ? "w-[76px]" : "w-[244px]",
          )}
        >
          <div className="flex items-center justify-between p-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-9 rounded-xl gradient-primary flex items-center justify-center glow-cyan">
                <Radar className="size-5 text-primary-foreground" />
              </div>
              {!collapsed && (
                <div className="leading-tight">
                  <div className="font-display font-bold">GeoFence</div>
                  <div className="text-[10px] text-muted-foreground font-mono">v2.4 · LIVE</div>
                </div>
              )}
            </Link>
            <button onClick={() => setCollapsed(!collapsed)} className="size-7 rounded-lg hover:bg-white/5 flex items-center justify-center">
              <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
            </button>
          </div>

          <nav className="px-3 mt-2 flex-1 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  to={item.to as any}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-gradient-to-r from-cyan/15 to-violet/5 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-r bg-gradient-to-b from-cyan to-violet" />}
                  <item.icon className={cn("size-4 shrink-0", active && "text-cyan")} />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {!collapsed && (
            <div className="p-3">
              <div className="glass rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 size-24 rounded-full bg-violet/30 blur-2xl" />
                <p className="text-xs font-display font-semibold">Upgrade to Pro</p>
                <p className="text-[11px] text-muted-foreground mt-1">Unlimited zones & AI insights.</p>
                <button className="mt-3 w-full rounded-xl gradient-primary text-primary-foreground text-xs font-semibold py-2">
                  Upgrade
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-20 glass-strong border-b border-border/50">
            <div className="flex items-center gap-4 px-4 md:px-8 h-16">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  placeholder="Search students, zones, alerts…"
                  className="w-full pl-10 pr-4 h-10 rounded-xl bg-white/5 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan/40 transition"
                />
              </div>
              <div className="hidden md:flex items-center gap-2 glass rounded-xl px-3 py-1.5 text-xs font-mono">
                <span className="relative flex size-2">
                  <span className="absolute inset-0 rounded-full bg-success pulse-ring opacity-70" />
                  <span className="relative rounded-full bg-success size-2" />
                </span>
                ALL SYSTEMS LIVE
              </div>
              <button className="relative size-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition">
                <BellIcon className="size-4" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-danger ring-2 ring-background" />
              </button>
              <button className="flex items-center gap-2 glass rounded-xl pl-1 pr-3 py-1 hover:bg-white/10 transition">
                <div className="size-8 rounded-lg gradient-violet flex items-center justify-center text-xs font-bold">AK</div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold leading-tight">Ananya K.</div>
                  <div className="text-[10px] text-muted-foreground">Admin</div>
                </div>
                <ChevronDown className="size-3 text-muted-foreground" />
              </button>
            </div>
            <div className="px-4 md:px-8 pb-4 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>
          </header>

          <main className="px-4 md:px-8 py-6 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
