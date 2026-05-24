import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { LiveMap } from "@/components/live-map";
import { useState, useMemo } from "react";
import {
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Compass,
  MapPin,
  Users,
  Activity,
  Search,
  Filter,
  Check,
  X,
  ChevronRight,
  Plus,
  Battery,
  Wifi,
  Send,
  Info,
  AlertCircle,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sos")({
  head: () => ({ meta: [{ title: "SOS Incident Control — GeoFence" }] }),
  component: SOSPage,
});

interface Incident {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  location: string;
  timestamp: string;
  status: "Active" | "Dispatched" | "Resolved" | "False Alarm";
  priority: "Critical" | "Moderate";
  responders: string;
  battery: number;
  gps: "Strong" | "Medium" | "Weak" | "Offline";
  timeline: { time: string; msg: string }[];
}

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-1094",
    studentId: "ST4421",
    studentName: "Maya Verma",
    grade: "Grade 12-B",
    location: "East Gate Perimeter",
    timestamp: "Just now",
    status: "Active",
    priority: "Critical",
    responders: "None",
    battery: 12,
    gps: "Offline",
    timeline: [
      { time: "08:35 PM", msg: "SOS Triggered by hardware button hold" },
      { time: "08:35 PM", msg: "Warning: Low battery telemetry warning (<15%)" },
      { time: "08:36 PM", msg: "Attempted automated cell connection: Failed" },
    ],
  },
  {
    id: "INC-1093",
    studentId: "ST3001",
    studentName: "Noah Kim",
    grade: "Grade 10-B",
    location: "Hostel Block C",
    timestamp: "4 min ago",
    status: "Dispatched",
    priority: "Critical",
    responders: "Alpha Unit (Officer Jack)",
    battery: 4,
    gps: "Offline",
    timeline: [
      { time: "08:30 PM", msg: "SOS Triggered: Telemetry went dark" },
      { time: "08:31 PM", msg: "Incident created automatically: Signal Lost" },
      { time: "08:32 PM", msg: "Responder team Alpha Unit dispatched by dispatch center" },
    ],
  },
  {
    id: "INC-1092",
    studentId: "ST3187",
    studentName: "Kai Tanaka",
    grade: "Grade 11-A",
    location: "Campus A Perimeter",
    timestamp: "12 min ago",
    status: "Dispatched",
    priority: "Moderate",
    responders: "Bravo Patrol Team",
    battery: 94,
    gps: "Medium",
    timeline: [
      { time: "08:22 PM", msg: "User triggered panic alert via Web-App" },
      { time: "08:23 PM", msg: "Geofence violation: Device left safe zone boundary" },
      { time: "08:24 PM", msg: "Bravo Patrol Team dispatched to intercept" },
    ],
  },
  {
    id: "INC-1091",
    studentId: "ST1109",
    studentName: "Leo Park",
    grade: "Grade 12-A",
    location: "Athletic Field",
    timestamp: "45 min ago",
    status: "Resolved",
    priority: "Moderate",
    responders: "Campus Security Team",
    battery: 52,
    gps: "Weak",
    timeline: [
      { time: "07:45 PM", msg: "Accidental button trigger detected" },
      { time: "07:46 PM", msg: "Security guard contacted student via voice channel" },
      { time: "07:55 PM", msg: "Checked safe on-site: Guard closed incident" },
    ],
  },
  {
    id: "INC-1090",
    studentId: "ST0982",
    studentName: "Eva Lin",
    grade: "Grade 10-B",
    location: "Block C Annex",
    timestamp: "2 hours ago",
    status: "False Alarm",
    priority: "Moderate",
    responders: "None",
    battery: 64,
    gps: "Strong",
    timeline: [
      { time: "06:12 PM", msg: "Distress ping registered" },
      { time: "06:14 PM", msg: "Identified as user key-press test" },
      { time: "06:15 PM", msg: "Marked false alarm: Device remains safe" },
    ],
  },
];

function SOSPage() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Selection states
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [dispatchingIncidentId, setDispatchingIncidentId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState("Alpha Unit (Tactical Guard)");

  // Dispatch guards lists
  const GUARD_UNITS = [
    "Alpha Unit (Tactical Guard)",
    "Bravo Patrol Team (Campus)",
    "Delta Rescue Team (Medical & First Aid)",
    "Campus Police Dispatch Force",
  ];

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = incidents.length;
    const active = incidents.filter((i) => i.status === "Active").length;
    const dispatched = incidents.filter((i) => i.status === "Dispatched").length;
    const resolved = incidents.filter((i) => i.status === "Resolved").length;
    const falseAlarms = incidents.filter((i) => i.status === "False Alarm").length;

    return {
      total,
      active,
      dispatched,
      resolved,
      falseAlarms,
      responseTime: "2.4 min",
    };
  }, [incidents]);

  // Filtered incidents list
  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      const matchesSearch =
        i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.location.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || i.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || i.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [incidents, searchQuery, statusFilter, priorityFilter]);

  // Selected incident detail
  const selectedIncident = useMemo(() => {
    return incidents.find((i) => i.id === selectedIncidentId) || null;
  }, [incidents, selectedIncidentId]);

  // Dispatch a guard team to the incident location
  const handleDispatchResponders = () => {
    if (!dispatchingIncidentId) return;

    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === dispatchingIncidentId) {
          const timestamp = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const updatedTimeline = [
            { time: timestamp, msg: `Responder unit dispatched: ${selectedUnit}` },
            ...i.timeline,
          ];

          return {
            ...i,
            status: "Dispatched",
            responders: selectedUnit,
            timeline: updatedTimeline,
          };
        }
        return i;
      })
    );

    const studentName = incidents.find((i) => i.id === dispatchingIncidentId)?.studentName || "Student";
    toast.success(`${selectedUnit} dispatched to assist ${studentName}!`);
    setDispatchingIncidentId(null);
  };

  // Change incident status (Resolve or False Alarm)
  const handleSetStatus = (id: string, newStatus: "Resolved" | "False Alarm") => {
    setIncidents((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const timestamp = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const updatedTimeline = [
            { time: timestamp, msg: `Incident marked as ${newStatus}` },
            ...i.timeline,
          ];

          return {
            ...i,
            status: newStatus,
            timeline: updatedTimeline,
          };
        }
        return i;
      })
    );

    const studentName = incidents.find((i) => i.id === id)?.studentName || "Student";
    toast.success(`Incident ${id} (${studentName}) closed: ${newStatus}`);
  };

  return (
    <DashboardShell
      title="SOS Emergency Center"
      subtitle="Realtime telemetry incident response dashboard"
    >
      {/* Top Banner with date */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 glass rounded-2xl p-2 px-3 text-xs text-muted-foreground">
          <Calendar className="size-4 text-danger" />
          <span>Active Dispatcher Terminal:</span>
          <span className="font-semibold text-foreground font-mono">Today, {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
        <button
          onClick={() => {
            // Pick a student to launch a test alert
            toast.error("Simulated SOS trigger active! New incoming critical alarm.");
            const newSos: Incident = {
              id: `INC-${Math.round(rand(1095, 2000))}`,
              studentId: "ST9902",
              studentName: "Ravi Nair",
              grade: "Grade 12-A",
              location: "Library Annex Gate",
              timestamp: "Just now",
              status: "Active",
              priority: "Critical",
              responders: "None",
              battery: 85,
              gps: "Medium",
              timeline: [
                { time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), msg: "SOS Triggered by User Panic Signal" }
              ]
            };
            setIncidents(prev => [newSos, ...prev]);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl glass border-danger/30 hover:bg-danger/10 text-danger text-xs font-semibold px-4 py-2.5 transition"
        >
          <AlertOctagon className="size-3.5 animate-pulse" />
          Simulate SOS Panic Signal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Alerts */}
        <div className="glass rounded-3xl p-5 relative overflow-hidden border-danger/25">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-danger" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-danger/20 text-danger flex items-center justify-center relative">
              {stats.active > 0 && (
                <span className="absolute inset-0 m-auto size-10 rounded-xl bg-danger/30 pulse-ring" />
              )}
              <AlertOctagon className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Active Pings</div>
              <div className="font-display text-2xl font-bold flex items-center gap-2">
                {stats.active}
                {stats.active > 0 && (
                  <span className="size-2 rounded-full bg-danger animate-ping" />
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Require direct dispatch</div>
            </div>
          </div>
        </div>

        {/* Responders Dispatched */}
        <div className="glass rounded-3xl p-5 relative overflow-hidden border-warning/25">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-warning" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-warning/20 text-warning flex items-center justify-center">
              <Compass className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Dispatched Units</div>
              <div className="font-display text-2xl font-bold">{stats.dispatched}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Teams on-route</div>
            </div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="glass rounded-3xl p-5 relative overflow-hidden border-cyan/25">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-cyan" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-cyan/20 text-cyan flex items-center justify-center">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Response Dispatch</div>
              <div className="font-display text-2xl font-bold">{stats.responseTime}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Average dispatch speed</div>
            </div>
          </div>
        </div>

        {/* False Alarms */}
        <div className="glass rounded-3xl p-5 relative overflow-hidden col-span-1">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-muted" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/5 text-muted-foreground flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">False Alarms</div>
              <div className="font-display text-2xl font-bold">{stats.falseAlarms}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Mismarked triggers</div>
            </div>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="glass rounded-3xl p-5 relative overflow-hidden col-span-2 lg:col-span-1 border-success/25">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-success" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-success/20 text-success flex items-center justify-center">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Resolved Incidents</div>
              <div className="font-display text-2xl font-bold">{stats.resolved}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Closed emergencies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Incident List directory */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-5">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-4">
              <div>
                <h3 className="font-display font-semibold text-base">Emergency Logs Registry</h3>
                <p className="text-xs text-muted-foreground">Verify, dispatch, and clear student SOS panic triggers</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search incident, student name..."
                    className="w-full md:w-48 pl-9 pr-3 h-8.5 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-danger/40 focus:border-danger/40 transition"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8.5 rounded-xl bg-white/5 border border-border text-xs px-2.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-danger/40"
                >
                  <option value="All" className="bg-background text-foreground">All Statuses</option>
                  <option value="Active" className="bg-background text-foreground">Active</option>
                  <option value="Dispatched" className="bg-background text-foreground">Dispatched</option>
                  <option value="Resolved" className="bg-background text-foreground">Resolved</option>
                  <option value="False Alarm" className="bg-background text-foreground">False Alarm</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-8.5 rounded-xl bg-white/5 border border-border text-xs px-2.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-danger/40"
                >
                  <option value="All" className="bg-background text-foreground">All Priorities</option>
                  <option value="Critical" className="bg-background text-foreground font-semibold text-danger">Critical</option>
                  <option value="Moderate" className="bg-background text-foreground">Moderate</option>
                </select>
              </div>
            </div>

            {/* Grid list of incidents */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pl-2">Incident ID</th>
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Trigger Zone</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Responders</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-xs">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        No emergencies match the selected criteria. All systems clear.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((i) => {
                      let statusBadge = "";
                      let isBlinking = false;
                      if (i.status === "Active") {
                        statusBadge = "bg-danger/15 text-danger border-danger/30";
                        isBlinking = true;
                      } else if (i.status === "Dispatched") {
                        statusBadge = "bg-warning/15 text-warning border-warning/30";
                      } else if (i.status === "Resolved") {
                        statusBadge = "bg-success/15 text-success border-success/30";
                      } else {
                        statusBadge = "bg-white/5 text-muted-foreground border-border";
                      }

                      return (
                        <tr
                          key={i.id}
                          className="hover:bg-white/[0.02] group transition-colors cursor-pointer"
                          onClick={() => setSelectedIncidentId(i.id)}
                        >
                          <td className="py-3.5 pl-2 font-mono font-semibold text-foreground group-hover:text-cyan transition-colors">
                            {i.id}
                          </td>
                          <td className="py-3.5 flex items-center gap-3">
                            <div className="size-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center text-xs font-bold shrink-0">
                              {i.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{i.studentName}</div>
                              <div className="text-[10px] text-muted-foreground">{i.grade}</div>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3 text-muted-foreground" />
                              <span>{i.location}</span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`font-semibold ${
                                i.priority === "Critical" ? "text-danger" : "text-warning"
                              }`}
                            >
                              {i.priority}
                            </span>
                          </td>
                          <td className="py-3.5 text-muted-foreground font-medium">{i.responders}</td>
                          <td className="py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}
                            >
                              {isBlinking && (
                                <span className="size-1.5 rounded-full bg-danger animate-ping" />
                              )}
                              {i.status}
                            </span>
                          </td>
                          <td
                            className="py-3.5 pr-2 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              {i.status === "Active" && (
                                <button
                                  onClick={() => setDispatchingIncidentId(i.id)}
                                  className="rounded-xl gradient-primary text-primary-foreground font-semibold px-2.5 py-1.5 text-[10px] glow-cyan hover:scale-[1.02] transition"
                                >
                                  Dispatch
                                </button>
                              )}
                              {(i.status === "Active" || i.status === "Dispatched") && (
                                <>
                                  <button
                                    onClick={() => handleSetStatus(i.id, "Resolved")}
                                    className="size-7.5 rounded-lg hover:bg-success/20 flex items-center justify-center text-muted-foreground hover:text-success transition-colors"
                                    title="Mark Resolved"
                                  >
                                    <Check className="size-4" />
                                  </button>
                                  <button
                                    onClick={() => handleSetStatus(i.id, "False Alarm")}
                                    className="size-7.5 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-danger transition-colors"
                                    title="Flag False Alarm"
                                  >
                                    <X className="size-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => setSelectedIncidentId(i.id)}
                                className="size-7.5 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                title="View Details"
                              >
                                <ChevronRight className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live System Heat HUD / Alert instructions */}
        <div className="space-y-6">
          {/* Active alerts map widget */}
          <div className="glass rounded-3xl p-5 relative overflow-hidden">
            <h3 className="font-display font-semibold text-sm mb-1">Telemetry Broadcast Grid</h3>
            <p className="text-xs text-muted-foreground mb-4">Location mapping for active incident coordinates</p>
            <LiveMap height={280} compact />
          </div>

          {/* Quick Dispatch SOP card */}
          <div className="glass rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-30 bg-danger" />
            <h3 className="font-display font-semibold text-sm flex items-center gap-1.5">
              <ShieldAlert className="size-4 text-danger" /> Incident Response SOP
            </h3>
            <ul className="mt-3.5 space-y-3 text-xs">
              <li className="flex gap-2">
                <span className="size-5 rounded-full bg-danger/25 text-danger flex items-center justify-center shrink-0 font-bold">1</span>
                <span className="text-muted-foreground">Verify coordinate accuracy and signal path strength in the telemetry drawer.</span>
              </li>
              <li className="flex gap-2">
                <span className="size-5 rounded-full bg-warning/25 text-warning flex items-center justify-center shrink-0 font-bold">2</span>
                <span className="text-muted-foreground">Dispatch the nearest responder patrol team (Alpha, Bravo, Delta) instantly.</span>
              </li>
              <li className="flex gap-2">
                <span className="size-5 rounded-full bg-success/25 text-success flex items-center justify-center shrink-0 font-bold">3</span>
                <span className="text-muted-foreground">Initiate direct voice call channel or parent sms triggers if battery drops under 10%.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Details Slide-out Drawer */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Drawer backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setSelectedIncidentId(null)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-md h-full glass-strong border-l border-border/50 p-6 flex flex-col justify-between shadow-elevated z-10 animate-slide-in">
            <div className="space-y-6 overflow-y-auto max-h-[85vh] pr-1 scrollbar-hide">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-danger/10 text-danger flex items-center justify-center text-sm font-bold shrink-0 animate-pulse">
                    {selectedIncident.studentName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">{selectedIncident.studentName}</h3>
                    <p className="text-xs text-muted-foreground">
                      ID {selectedIncident.studentId} · {selectedIncident.grade}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIncidentId(null)}
                  className="size-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Location Map Widget */}
              <div className="relative rounded-2xl overflow-hidden border border-border">
                <LiveMap height={200} compact />
                <div className="absolute bottom-3 left-3 glass rounded-xl px-2.5 py-1 text-[10px] font-mono flex items-center gap-1">
                  <MapPin className="size-3 text-danger" /> {selectedIncident.location}
                </div>
              </div>

              {/* Status & Priority info */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="glass rounded-xl p-3">
                  <span className="block text-[10px] text-muted-foreground uppercase">Severity</span>
                  <span
                    className={`text-sm font-bold ${
                      selectedIncident.priority === "Critical" ? "text-danger" : "text-warning"
                    }`}
                  >
                    {selectedIncident.priority}
                  </span>
                </div>
                <div className="glass rounded-xl p-3">
                  <span className="block text-[10px] text-muted-foreground uppercase">Alert Status</span>
                  <span className="text-sm font-bold text-foreground">{selectedIncident.status}</span>
                </div>
              </div>

              {/* Telemetry info */}
              <div className="glass rounded-xl p-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-3">
                  <span>LAST KNOWN STATUS</span>
                  <span className="font-mono text-cyan">TELEMETRY</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="glass rounded-xl p-2.5">
                    <Wifi className="size-4 text-cyan mx-auto mb-1" />
                    <span className="block text-[9px] text-muted-foreground uppercase">GPS Quality</span>
                    <span className="text-xs font-semibold">{selectedIncident.gps}</span>
                  </div>
                  <div className="glass rounded-xl p-2.5">
                    <Battery className={`size-4 mx-auto mb-1 ${selectedIncident.battery < 15 ? "text-danger" : "text-success"}`} />
                    <span className="block text-[9px] text-muted-foreground uppercase">Battery</span>
                    <span className="text-xs font-semibold">{selectedIncident.battery}%</span>
                  </div>
                </div>
              </div>

              {/* Timeline list */}
              <div>
                <h4 className="font-display font-semibold text-xs text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                  <Activity className="size-3.5 text-danger" /> Incident Dispatch Logs
                </h4>
                <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {selectedIncident.timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[14.5px] top-1.5 size-2 rounded-full bg-danger ring-4 ring-background shadow-[0_0_8px_var(--danger)]" />
                      <div className="text-xs">
                        <span className="font-mono text-muted-foreground text-[10px] block mb-0.5">
                          {item.time}
                        </span>
                        <p className="text-foreground font-medium">{item.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-border/40 flex flex-col gap-2 text-xs">
              {selectedIncident.status === "Active" && (
                <button
                  onClick={() => {
                    setDispatchingIncidentId(selectedIncident.id);
                    setSelectedIncidentId(null);
                  }}
                  className="w-full rounded-xl gradient-primary text-primary-foreground py-3 font-semibold inline-flex items-center justify-center gap-2 glow-cyan"
                >
                  <Send className="size-3.5" /> Dispatch Responder Units
                </button>
              )}

              {(selectedIncident.status === "Active" || selectedIncident.status === "Dispatched") && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleSetStatus(selectedIncident.id, "Resolved");
                      setSelectedIncidentId(null);
                    }}
                    className="flex-1 rounded-xl glass border-success/30 text-success hover:bg-success/10 py-2.5 font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Check className="size-3.5" /> Mark Resolved
                  </button>
                  <button
                    onClick={() => {
                      handleSetStatus(selectedIncident.id, "False Alarm");
                      setSelectedIncidentId(null);
                    }}
                    className="flex-1 rounded-xl glass hover:bg-white/5 py-2.5 font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <X className="size-3.5 text-danger" /> False Alarm
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedIncidentId(null)}
                className="w-full rounded-xl glass hover:bg-white/10 py-2.5 font-semibold text-center"
              >
                Close Logs Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guard Dispatch Modal */}
      {dispatchingIncidentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDispatchingIncidentId(null)}
          />

          <div className="relative glass-strong rounded-3xl p-6 w-full max-w-sm border border-border/50 shadow-elevated z-10 animate-scale-up">
            <div className="flex items-center gap-2 mb-2 text-danger">
              <ShieldAlert className="size-5" />
              <h3 className="font-display font-semibold text-base">Dispatch Rescue Patrol</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Select available security or medical rescue patrol unit to dispatch to{" "}
              <strong className="text-foreground">
                {incidents.find((i) => i.id === dispatchingIncidentId)?.location}
              </strong>{" "}
              for{" "}
              <strong className="text-foreground">
                {incidents.find((i) => i.id === dispatchingIncidentId)?.studentName}
              </strong>
              .
            </p>

            <label className="block text-xs text-muted-foreground mb-1.5">Select Guard Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-danger/40 mb-5 text-foreground"
            >
              {GUARD_UNITS.map((unit) => (
                <option key={unit} value={unit} className="bg-background text-foreground">
                  {unit}
                </option>
              ))}
            </select>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setDispatchingIncidentId(null)}
                className="flex-1 rounded-xl glass hover:bg-white/10 py-2.5 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchResponders}
                className="flex-1 rounded-xl gradient-primary text-primary-foreground py-2.5 font-semibold glow-cyan"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
