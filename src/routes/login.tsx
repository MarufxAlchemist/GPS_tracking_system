import { createFileRoute, Link } from "@tanstack/react-router";
import { LiveMap } from "@/components/live-map";
import { Radar, Mail, Lock, ChevronRight, GraduationCap, UserRound } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — GeoFence" }, { name: "description", content: "Access your GeoFence command center." }] }),
  component: AuthPage,
});

function AuthPage() { return <Auth mode="login" />; }

export function Auth({ mode }: { mode: "login" | "signup" }) {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left visual */}
      <div className="relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative h-full flex flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl gradient-primary flex items-center justify-center glow-cyan">
              <Radar className="size-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">GeoFence</span>
          </Link>
          <div className="relative">
            <LiveMap height={520} />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight">A live map of <span className="text-gradient">your world.</span></h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">Sign in to access realtime telemetry, geofence intelligence and your secure operations console.</p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="relative flex items-center justify-center p-6 lg:p-12">
        <div className="absolute inset-0 gradient-hero opacity-30 lg:hidden" />
        <div className="relative w-full max-w-md">
          <div className="glass-strong rounded-3xl p-8 lg:p-10 animated-border">
            <div className="lg:hidden mb-6 flex items-center justify-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="size-8 rounded-xl gradient-primary flex items-center justify-center"><Radar className="size-4 text-primary-foreground" /></div>
                <span className="font-display font-bold">GeoFence</span>
              </Link>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{mode === "login" ? "Welcome back" : "Create account"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? "Sign in to your operations console." : "Start your 14-day free trial."}</p>

            {/* Role switch */}
            <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-border">
              {(["teacher", "student"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition",
                    role === r ? "gradient-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r === "teacher" ? <UserRound className="size-4" /> : <GraduationCap className="size-4" />}
                  {r[0].toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4">
              <InputField icon={Mail} label="Email" type="email" placeholder="you@campus.edu" />
              <InputField icon={Lock} label="Password" type="password" placeholder="••••••••" />
              {mode === "login" && (
                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 text-muted-foreground">
                    <input type="checkbox" className="rounded border-border accent-cyan" /> Remember me
                  </label>
                  <a href="#" className="text-cyan hover:underline">Forgot password?</a>
                </div>
              )}
              <Link to="/dashboard" className="group flex items-center justify-center gap-1.5 w-full rounded-2xl gradient-primary text-primary-foreground font-semibold py-3 glow-cyan hover:scale-[1.02] transition">
                Continue <ChevronRight className="size-4 group-hover:translate-x-0.5 transition" />
              </Link>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
              </div>

              <button type="button" className="w-full glass rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition">
                <GoogleIcon /> Continue with Google
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {mode === "login" ? (
                <>New here? <Link to="/signup" className="text-cyan hover:underline">Create an account</Link></>
              ) : (
                <>Already have an account? <Link to="/login" className="text-cyan hover:underline">Sign in</Link></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, label, ...props }: { icon: any; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="mt-1.5 relative group">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-cyan transition" />
        <input
          {...props}
          className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 focus:border-cyan/50 transition placeholder:text-muted-foreground/60"
        />
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/></svg>
  );
}
