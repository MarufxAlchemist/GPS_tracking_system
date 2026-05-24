import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { User, Bell, Shield, Users, Hexagon, Sliders, Save, Moon, Globe, Key, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — GeoFence" }] }),
  component: Settings,
});

type SettingsTab = "profile" | "notifications" | "security" | "team" | "zones" | "appearance";

const TABS: { key: SettingsTab; label: string; Icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", Icon: User },
  { key: "notifications", label: "Notifications", Icon: Bell },
  { key: "security", label: "Security", Icon: Shield },
  { key: "team", label: "Team", Icon: Users },
  { key: "zones", label: "Zones Config", Icon: Hexagon },
  { key: "appearance", label: "Appearance", Icon: Sliders },
];

function Toggle({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors",
          checked ? "bg-cyan" : "bg-white/10"
        )}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
      </button>
    </div>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [name, setName] = useState("Maruf Nadaf");
  const [email, setEmail] = useState("maruf@pvpit.edu.in");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [notifs, setNotifs] = useState({
    sos: true,
    geofence: true,
    attendance: false,
    weekly: true,
    sms: false,
    email: true,
  });
  const [darkMode, setDarkMode] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [animationsOn, setAnimationsOn] = useState(true);

  const save = () => toast.success("Settings saved!");

  const team = [
    { name: "Neeraj Sonar", role: "Security Lead", email: "neeraj@campus.edu", avatar: "NS" },
    { name: "Amol Jagdale", role: "Teacher", email: "amol@campus.edu", avatar: "AJ" },
    { name: "Dhanashree Dhokate", role: "Admin", email: "dhanashree@campus.edu", avatar: "DD" },
  ];

  return (
    <DashboardShell title="Settings" subtitle="Manage your account, notifications and preferences">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <aside className="lg:w-56 shrink-0">
          <div className="glass rounded-3xl p-3 space-y-1">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition text-left",
                  activeTab === key
                    ? "gradient-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 glass rounded-3xl p-6 space-y-6">
          {activeTab === "profile" && (
            <>
              <h2 className="font-display font-semibold text-lg">Profile Information</h2>
              <div className="flex items-center gap-4">
                <img src="/profile.jpg" alt="Profile" className="size-16 rounded-2xl object-cover shadow-lg border border-white/10" />
                <div>
                  <button onClick={() => toast.info("Photo upload coming soon.")} className="text-sm text-cyan hover:underline">Change photo</button>
                  <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG up to 5MB</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Full name", value: name, set: setName },
                  { label: "Email", value: email, set: setEmail },
                  { label: "Phone", value: phone, set: setPhone },
                ].map(({ label, value, set }) => (
                  <label key={label} className="block">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      className="mt-1.5 w-full h-11 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="text-xs text-muted-foreground">Role</span>
                  <select className="mt-1.5 w-full h-11 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40 appearance-none">
                    <option className="bg-[#0f1423] text-foreground">Admin</option>
                    <option className="bg-[#0f1423] text-foreground">Teacher</option>
                    <option className="bg-[#0f1423] text-foreground">Security</option>
                  </select>
                </label>
              </div>
              <button onClick={save} className="flex items-center gap-2 gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold glow-cyan hover:scale-[1.02] transition">
                <Save className="size-4" /> Save Changes
              </button>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <h2 className="font-display font-semibold text-lg">Notification Preferences</h2>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">Alert types</p>
                <Toggle label="SOS Emergencies" sub="Instant alerts for triggered SOS signals" checked={notifs.sos} onChange={(v) => setNotifs((p) => ({ ...p, sos: v }))} />
                <Toggle label="Geofence breaches" sub="When a device leaves a designated zone" checked={notifs.geofence} onChange={(v) => setNotifs((p) => ({ ...p, geofence: v }))} />
                <Toggle label="Attendance events" sub="Automatic check-in / check-out events" checked={notifs.attendance} onChange={(v) => setNotifs((p) => ({ ...p, attendance: v }))} />
                <Toggle label="Weekly summary" sub="Digest of movement and alert data" checked={notifs.weekly} onChange={(v) => setNotifs((p) => ({ ...p, weekly: v }))} />
              </div>
              <div className="space-y-1 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">Channels</p>
                <Toggle label="Email notifications" checked={notifs.email} onChange={(v) => setNotifs((p) => ({ ...p, email: v }))} />
                <Toggle label="SMS notifications" sub="Standard carrier rates may apply" checked={notifs.sms} onChange={(v) => setNotifs((p) => ({ ...p, sms: v }))} />
              </div>
              <button onClick={save} className="flex items-center gap-2 gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold glow-cyan hover:scale-[1.02] transition">
                <Save className="size-4" /> Save Preferences
              </button>
            </>
          )}

          {activeTab === "security" && (
            <>
              <h2 className="font-display font-semibold text-lg">Security</h2>
              <div className="space-y-4">
                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="size-5 text-cyan" />
                    <div>
                      <div className="text-sm font-medium">Password</div>
                      <div className="text-xs text-muted-foreground">Last changed 30 days ago</div>
                    </div>
                  </div>
                  <button onClick={() => toast.info("Password reset link sent to your email.")} className="text-xs text-cyan hover:underline">Change</button>
                </div>
                <div className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="size-5 text-success" />
                    <div>
                      <div className="text-sm font-medium">Two-factor authentication</div>
                      <div className="text-xs text-muted-foreground">Authenticator app enabled</div>
                    </div>
                  </div>
                  <button onClick={() => toast.success("2FA settings updated.")} className="text-xs text-cyan hover:underline">Manage</button>
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="text-sm font-medium mb-3">Active sessions</div>
                  {[
                    { device: "Chrome · Windows 11", location: "Bangalore, IN", time: "Current session" },
                    { device: "Safari · iPhone 15", location: "Bangalore, IN", time: "2 hours ago" },
                  ].map((s) => (
                    <div key={s.device} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <div className="text-sm">{s.device}</div>
                        <div className="text-xs text-muted-foreground">{s.location} · {s.time}</div>
                      </div>
                      {s.time !== "Current session" && (
                        <button onClick={() => toast.success("Session revoked.")} className="text-xs text-danger hover:underline">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "team" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg">Team Members</h2>
                <button onClick={() => toast.info("Invite link copied to clipboard!")} className="gradient-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-xl glow-cyan hover:scale-[1.02] transition">
                  Invite Member
                </button>
              </div>
              <div className="space-y-3">
                {team.map((m) => (
                  <div key={m.email} className="flex items-center gap-4 p-4 glass rounded-2xl group">
                    <div className="size-10 rounded-xl gradient-primary flex items-center justify-center text-sm font-bold shrink-0">{m.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground glass px-2.5 py-1 rounded-full">{m.role}</span>
                    <button onClick={() => toast.error(`${m.name} removed from team.`)} className="size-7 rounded-lg hover:bg-danger/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="size-3.5 text-danger" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "zones" && (
            <>
              <h2 className="font-display font-semibold text-lg">Zone Configuration</h2>
              <div className="space-y-4">
                {[
                  { label: "Default alert radius", sub: "Geofence breach detection range", value: "100", unit: "m" },
                  { label: "Alert cooldown", sub: "Min time between repeated alerts for same zone", value: "60", unit: "sec" },
                  { label: "Update interval", sub: "How often device positions are polled", value: "5", unit: "sec" },
                ].map(({ label, sub, value, unit }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{sub}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input defaultValue={value} className="w-20 h-9 px-3 rounded-xl bg-white/5 border border-border text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-cyan/40" />
                      <span className="text-xs text-muted-foreground">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={save} className="flex items-center gap-2 gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold glow-cyan hover:scale-[1.02] transition">
                <Save className="size-4" /> Save Config
              </button>
            </>
          )}

          {activeTab === "appearance" && (
            <>
              <h2 className="font-display font-semibold text-lg">Appearance</h2>
              <div className="space-y-1">
                <Toggle label="Dark mode" sub="Use dark color scheme across the dashboard" checked={darkMode} onChange={setDarkMode} />
                <Toggle label="Compact mode" sub="Reduce spacing for more information density" checked={compactMode} onChange={setCompactMode} />
                <Toggle label="Animations" sub="Enable smooth transitions and micro-interactions" checked={animationsOn} onChange={setAnimationsOn} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">Language & region</p>
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-muted-foreground" />
                  <select className="h-10 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40">
                    <option>English (US)</option>
                    <option>Hindi</option>
                    <option>Tamil</option>
                  </select>
                </div>
              </div>
              <button onClick={save} className="flex items-center gap-2 gradient-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold glow-cyan hover:scale-[1.02] transition">
                <Save className="size-4" /> Apply
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
