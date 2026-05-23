import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, lazy, Suspense } from "react";
import { useLocationTracker } from "@/hooks/use-location-tracker";
import { ClientOnly } from "@/components/client-only";
import { Radar, MapPin, ShieldCheck, Activity, Sparkles, ArrowRight, Check, ChevronRight, Bell, Users, BarChart3, Lock, Globe2, Navigation, Wifi, AlertCircle, Crosshair } from "lucide-react";

// Leaflet map lazy-loaded so it never runs during SSR
const LiveTrackingMap = lazy(() =>
  import("@/components/live-tracking-map").then((mod) => ({ default: mod.LiveTrackingMap }))
);

const MapFallback = ({ height = 520 }: { height?: number }) => (
  <div
    style={{ height }}
    className="w-full bg-slate-950/40 rounded-3xl border border-border/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm font-medium"
  >
    <Radar className="size-8 text-cyan animate-pulse" />
    <span>Initializing secure tracking map...</span>
  </div>
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GeoFence — Real-Time Smart Monitoring Platform" },
      { name: "description", content: "Track. Protect. Monitor. AI-powered GPS geofencing for schools, organizations and security teams." },
      { property: "og:title", content: "GeoFence — Real-Time Smart Monitoring" },
      { property: "og:description", content: "AI-powered GPS geofencing platform with live tracking, automated attendance and SOS alerts." },
    ],
  }),
  component: Landing,
});

// Helper to get or create a device ID
function getDeviceId() {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

function Landing() {
  const [geoEnabled, setGeoEnabled] = useState(true); // Auto-start on open
  const [deviceId] = useState(() => getDeviceId());
  
  const { trackerStatus, start, stop } = useLocationTracker({
    userId: deviceId,
    intervalMs: 5000,
  });

  useEffect(() => {
    if (geoEnabled) start();
    else stop();
  }, [geoEnabled, start, stop]);
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <div className="pointer-events-none fixed inset-0 gradient-hero opacity-70" />
      <div className="pointer-events-none fixed inset-0 grid-bg grid-bg-fade opacity-60" />

      {/* Nav */}
      <header className="relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl gradient-primary flex items-center justify-center glow-cyan">
              <Radar className="size-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">GeoFence</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#preview" className="hover:text-foreground transition">Live Demo</a>

            <a href="#testimonials" className="hover:text-foreground transition">Customers</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition">Sign in</Link>
            <Link to="/dashboard" className="group inline-flex items-center gap-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2 glow-cyan hover:scale-105 transition-transform">
              Launch Dashboard <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-mono text-muted-foreground">
              <Sparkles className="size-3 text-cyan" /> AI · GPS · GEOFENCE INTELLIGENCE
            </div>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-tight">
              Real-Time <span className="text-gradient">Smart GeoFence</span> Monitoring
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Track. Protect. Monitor. The next-generation platform for schools, campuses and security teams —
              powered by AI-driven location intelligence and live geofence telemetry.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="group inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground font-semibold px-6 py-3 glow-cyan hover:scale-[1.03] transition">
                Get Started <ArrowRight className="size-4 group-hover:translate-x-0.5 transition" />
              </Link>
              <a href="#preview" className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 font-semibold hover:bg-white/10 transition">
                <Activity className="size-4 text-cyan" /> Live Demo
              </a>
            </div>
            <div className="mt-12 flex items-center gap-8 text-xs text-muted-foreground">
              <div>
                <div className="font-display text-2xl font-bold text-foreground">99.98%</div>
                <div>Uptime SLA</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="font-display text-2xl font-bold text-foreground">2.4M+</div>
                <div>Locations / day</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="font-display text-2xl font-bold text-foreground">&lt;120ms</div>
                <div>Alert latency</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="absolute -inset-8 gradient-violet opacity-20 blur-3xl rounded-full" />
            <div className="relative float-y">
              <ClientOnly fallback={<MapFallback height={520} />}>
                <Suspense fallback={<MapFallback height={520} />}>
                  <LiveTrackingMap height={520} highlightUserId={deviceId} />
                </Suspense>
              </ClientOnly>
            </div>
            {/* Floating cards */}
            <div className="hidden md:block absolute -left-6 top-10 glass rounded-2xl p-3 w-56 glow-cyan">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-success/20 text-success flex items-center justify-center"><ShieldCheck className="size-4" /></div>
                <div>
                  <div className="text-xs font-semibold">Zone Safe</div>
                  <div className="text-[10px] text-muted-foreground">128 students inside</div>
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute -right-4 bottom-8 glass rounded-2xl p-3 w-60">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-danger/20 text-danger flex items-center justify-center"><Bell className="size-4" /></div>
                <div>
                  <div className="text-xs font-semibold">SOS Triggered</div>
                  <div className="text-[10px] text-muted-foreground">Maya · East Gate · just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo cloud */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-10">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">Trusted by leading institutions</p>
        <div className="mt-6 flex flex-wrap justify-center gap-x-12 gap-y-4 opacity-60">
          {["NORTHGATE UNIV.", "META ACADEMY", "PALANTECH", "AURORA HIGH", "ZENITH CAMPUS", "HELIX LABS"].map((n) => (
            <div key={n} className="font-display font-semibold tracking-wider text-sm">{n}</div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-cyan font-mono">// CAPABILITIES</span>
          <h2 className="mt-4 font-display text-4xl lg:text-5xl font-bold tracking-tight">A command center for the physical world</h2>
          <p className="mt-4 text-muted-foreground">Every tool you need to monitor, secure and orchestrate people across geofenced spaces — unified in one beautiful surface.</p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {([
            { Icon: MapPin, title: "Live GPS Tracking", desc: "Stream device positions with sub-second latency on an interactive map.", color: "cyan" },
            { Icon: Hex, title: "Smart Geofencing", desc: "Draw circular or polygon zones. Get notified the instant entries or exits occur.", color: "violet" },
            { Icon: ShieldCheck, title: "SOS Emergency", desc: "One-tap distress signals route to responders with full context in milliseconds.", color: "danger" },
            { Icon: Users, title: "Auto Attendance", desc: "Presence is detected automatically when devices enter a learning zone.", color: "success" },
            { Icon: BarChart3, title: "Movement Analytics", desc: "AI-derived heatmaps, traffic flows and dwell-time insights for any zone.", color: "cyan" },
            { Icon: Lock, title: "Privacy-First", desc: "End-to-end encryption, role-based access and full audit logs by default.", color: "violet" },
          ] as const).map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* Live GPS Try Demo */}
      <section id="preview" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-cyan font-mono">// TRY IT LIVE</span>
          <h2 className="mt-4 font-display text-4xl lg:text-5xl font-bold tracking-tight">Your location. Right now.</h2>
          <p className="mt-4 text-muted-foreground">GeoFence tracks real people in real time. Share your location to see exactly how our platform captures, maps, and displays live GPS data — straight from your device.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* Left panel — controls + info */}
          <div className="lg:col-span-2 space-y-4">
            {/* CTA card */}
            <div className="relative glass-strong rounded-3xl p-6 overflow-hidden animated-border">
              <div className="absolute -top-12 -right-12 size-40 rounded-full bg-cyan/20 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-2xl gradient-primary flex items-center justify-center glow-cyan">
                    <Navigation className="size-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-display font-semibold">Live GPS Demo</div>
                    <div className="text-xs text-muted-foreground">Browser-native · No signup needed</div>
                  </div>
                </div>

                {trackerStatus.status === "idle" && (
                  <>
                    <p className="text-sm text-muted-foreground mb-5">Click below to share your location. Your browser will ask for permission — your data never leaves your device.</p>
                    <button
                      id="share-location-btn"
                      onClick={() => setGeoEnabled(true)}
                      className="w-full rounded-2xl gradient-primary text-primary-foreground font-semibold py-3.5 flex items-center justify-center gap-2 glow-cyan hover:scale-[1.02] transition-transform"
                    >
                      <Crosshair className="size-4" /> Share My Location
                    </button>
                  </>
                )}

                {trackerStatus.status === "requesting" && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="size-10 rounded-full border-2 border-cyan/40 border-t-cyan animate-spin" />
                    <p className="text-sm text-muted-foreground text-center">Waiting for browser permission…</p>
                    <button onClick={() => setGeoEnabled(false)} className="text-xs text-muted-foreground hover:text-foreground underline">Cancel</button>
                  </div>
                )}

                {trackerStatus.status === "tracking" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--success)" }}>
                      <span className="relative flex size-2.5">
                        <span className="absolute inset-0 rounded-full bg-success pulse-ring opacity-80" />
                        <span className="relative rounded-full bg-success size-2.5" />
                      </span>
                      Location active — streaming live
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="glass rounded-xl p-3">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">Latitude</div>
                        <div className="font-mono text-sm font-bold mt-0.5" style={{ color: "var(--cyan)" }}>{trackerStatus.latitude.toFixed(5)}°</div>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">Longitude</div>
                        <div className="font-mono text-sm font-bold mt-0.5" style={{ color: "var(--cyan)" }}>{trackerStatus.longitude.toFixed(5)}°</div>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">Accuracy</div>
                        <div className="font-mono text-sm font-bold mt-0.5" style={{ color: "var(--success)" }}>±{Math.round(trackerStatus.accuracy)}m</div>
                      </div>
                      <div className="glass rounded-xl p-3">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">Heading</div>
                        <div className="font-mono text-sm font-bold mt-0.5">{trackerStatus.heading !== null ? `${Math.round(trackerStatus.heading)}°` : "N/A"}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setGeoEnabled(false)}
                      className="w-full rounded-xl glass py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
                    >
                      Stop sharing
                    </button>
                  </div>
                )}

                {trackerStatus.status === "error" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
                      <p className="text-xs" style={{ color: "var(--danger)" }}>{trackerStatus.message}</p>
                    </div>
                    <button
                      onClick={() => { setGeoEnabled(false); setTimeout(() => setGeoEnabled(true), 100); }}
                      className="w-full rounded-xl gradient-primary text-primary-foreground text-sm font-semibold py-2.5"
                    >
                      Try again
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Feature bullets */}
            <div className="glass rounded-3xl p-5 space-y-3">
              {[
                { icon: Wifi, label: "Real-time telemetry", desc: "Position updates as you move" },
                { icon: MapPin, label: "Geofence detection", desc: "Entry & exit events in milliseconds" },
                { icon: Activity, label: "Movement analytics", desc: "Speed, heading & dwell time" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-cyan/10 flex items-center justify-center shrink-0" style={{ color: "var(--cyan)" }}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/tracking" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:underline">
              Open full tracking dashboard <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Right — live map */}
          <div className="lg:col-span-3 relative">
            <ClientOnly fallback={<MapFallback height={520} />}>
              <Suspense fallback={<MapFallback height={520} />}>
                <LiveTrackingMap height={520} highlightUserId={deviceId} />
              </Suspense>
            </ClientOnly>
            {trackerStatus.status !== "tracking" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="glass-strong rounded-2xl px-5 py-3 text-center pointer-events-auto">
                  <div className="text-sm font-medium">Demo markers active</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Share your location to add your real pin 📍</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.25em] text-cyan font-mono">// VOICES</span>
          <h2 className="mt-4 font-display text-4xl lg:text-5xl font-bold tracking-tight">Loved by operations teams.</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {[
            { name: "Dr. Reyna Chen", role: "Dean, Northgate University", quote: "We replaced three separate tools with GeoFence. Our response times dropped by 64%." },
            { name: "Marcus Vidal", role: "Head of Security, Aurora High", quote: "It feels less like a dashboard and more like superpowers. The maps are unreal." },
            { name: "Priya Kapoor", role: "Operations Lead, Helix Labs", quote: "The SOS pipeline alone justifies the platform. It's the calmest emergency stack we've shipped." },
          ].map((t) => (
            <div key={t.name} className="glass rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 size-32 rounded-full bg-violet/20 blur-3xl" />
              <p className="text-sm leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="size-10 rounded-xl gradient-violet flex items-center justify-center font-bold text-sm">{t.name.split(" ").map(n=>n[0]).join("")}</div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="relative glass-strong rounded-[2.5rem] p-12 lg:p-16 overflow-hidden animated-border">
          <div className="absolute -top-20 -right-20 size-80 rounded-full bg-cyan/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-violet/30 blur-3xl" />
          <div className="relative text-center">
            <Globe2 className="mx-auto size-10 text-cyan" />
            <h2 className="mt-4 font-display text-4xl lg:text-5xl font-bold tracking-tight">Bring your world online.</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Provision your first geofence in under 60 seconds.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/signup" className="rounded-full gradient-primary text-primary-foreground font-semibold px-7 py-3 glow-cyan hover:scale-105 transition">Start free trial</Link>
              <Link to="/dashboard" className="rounded-full glass px-7 py-3 font-semibold hover:bg-white/10 transition">See dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg gradient-primary flex items-center justify-center">
              <Radar className="size-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">GeoFence</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Hex(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}

function FeatureCard({ Icon, title, desc, color }: { Icon: any; title: string; desc: string; color: "cyan" | "violet" | "danger" | "success" }) {
  const colorMap: Record<string, string> = {
    cyan: "from-cyan/25 text-cyan", violet: "from-violet/25 text-violet", danger: "from-danger/25 text-danger", success: "from-success/25 text-success",
  };
  return (
    <div className="group relative glass rounded-3xl p-6 hover:-translate-y-1 transition overflow-hidden">
      <div className={`absolute -top-16 -right-16 size-40 rounded-full bg-gradient-to-br blur-3xl opacity-60 group-hover:opacity-100 transition ${colorMap[color]}`} />
      <div className={`relative size-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${colorMap[color]}`}>
        <Icon className="size-5" />
      </div>
      <h3 className="relative mt-5 font-display font-semibold text-lg">{title}</h3>
      <p className="relative mt-2 text-sm text-muted-foreground">{desc}</p>
      <div className="relative mt-5 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition">
        Learn more <ArrowRight className="size-3 group-hover:translate-x-0.5 transition" />
      </div>
    </div>
  );
}
