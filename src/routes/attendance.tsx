import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useState, useMemo } from "react";
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpRight,
  Battery,
  Wifi,
  Settings,
  Check,
  Plus,
  Edit3,
  Sliders,
  X,
  ChevronRight,
  MapPin,
  Activity,
  Info,
  UserCheck,
  Compass,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance Management — GeoFence" }] }),
  component: AttendancePage,
});

interface Student {
  id: string;
  name: string;
  grade: string;
  zone: string;
  status: "Present" | "Late" | "Absent" | "Excused";
  checkIn: string;
  checkOut: string;
  battery: number;
  gps: "Strong" | "Medium" | "Weak" | "Offline";
  timeline: { time: string; msg: string }[];
}

// Initial mock data for students
const INITIAL_STUDENTS: Student[] = [
  {
    id: "ST0021",
    name: "Aarav Sharma",
    grade: "Grade 10-A",
    zone: "Campus A",
    status: "Present",
    checkIn: "08:12 AM",
    checkOut: "--",
    battery: 89,
    gps: "Strong",
    timeline: [
      { time: "07:55 AM", msg: "Device detected near outer perimeter" },
      { time: "08:12 AM", msg: "Entered Campus A geofence (auto-checkin)" },
      { time: "08:15 AM", msg: "Signal verified: Strong connectivity" },
      { time: "11:30 AM", msg: "Moved to Cafeteria annex" },
    ],
  },
  {
    id: "ST4421",
    name: "Maya Verma",
    grade: "Grade 12-B",
    zone: "Outside",
    status: "Absent",
    checkIn: "--",
    checkOut: "--",
    battery: 12,
    gps: "Offline",
    timeline: [
      { time: "07:30 AM", msg: "Device went offline (battery depleted)" },
      { time: "08:30 AM", msg: "Missed scheduled check-in window" },
      { time: "09:00 AM", msg: "Parent alert auto-dispatched" },
    ],
  },
  {
    id: "ST3187",
    name: "Kai Tanaka",
    grade: "Grade 11-A",
    zone: "Outside",
    status: "Late",
    checkIn: "09:05 AM",
    checkOut: "--",
    battery: 94,
    gps: "Medium",
    timeline: [
      { time: "08:20 AM", msg: "Transit: 1.2km away from Campus" },
      { time: "08:45 AM", msg: "Crossed perimeter boundary" },
      { time: "09:05 AM", msg: "Entered Block B: Check-in registered (Late)" },
    ],
  },
  {
    id: "ST2204",
    name: "Iris Bloom",
    grade: "Grade 10-A",
    zone: "Library",
    status: "Present",
    checkIn: "08:05 AM",
    checkOut: "--",
    battery: 78,
    gps: "Strong",
    timeline: [
      { time: "07:48 AM", msg: "Entered Main Gate" },
      { time: "08:05 AM", msg: "Entered Library geofence (auto-checkin)" },
      { time: "10:15 AM", msg: "Dwell time check: 2.1 hours in Library" },
    ],
  },
  {
    id: "ST0982",
    name: "Eva Lin",
    grade: "Grade 10-B",
    zone: "Block C",
    status: "Present",
    checkIn: "08:42 AM",
    checkOut: "--",
    battery: 64,
    gps: "Strong",
    timeline: [
      { time: "08:35 AM", msg: "Entered Campus A geofence" },
      { time: "08:42 AM", msg: "Entered Block C (Attendance Marked)" },
    ],
  },
  {
    id: "ST1109",
    name: "Leo Park",
    grade: "Grade 12-A",
    zone: "Field",
    status: "Present",
    checkIn: "08:10 AM",
    checkOut: "--",
    battery: 52,
    gps: "Weak",
    timeline: [
      { time: "07:58 AM", msg: "Entered Main Gate" },
      { time: "08:10 AM", msg: "Entered Field geofence (auto-checkin)" },
      { time: "12:00 PM", msg: "GPS signal degraded: Obstruction alert" },
    ],
  },
  {
    id: "ST5511",
    name: "Aria Bose",
    grade: "Grade 11-B",
    zone: "Library",
    status: "Excused",
    checkIn: "--",
    checkOut: "--",
    battery: 83,
    gps: "Offline",
    timeline: [
      { time: "07:00 AM", msg: "Medical leave approved by admin" },
      { time: "08:00 AM", msg: "Status overridden: Excused (Sick Leave)" },
    ],
  },
  {
    id: "ST8829",
    name: "Liam Quill",
    grade: "Grade 12-B",
    zone: "Campus A",
    status: "Present",
    checkIn: "08:24 AM",
    checkOut: "--",
    battery: 91,
    gps: "Strong",
    timeline: [
      { time: "08:10 AM", msg: "Entered Outer Ring" },
      { time: "08:24 AM", msg: "Entered Campus A (Attendance Marked)" },
    ],
  },
  {
    id: "ST7743",
    name: "Zara Ansari",
    grade: "Grade 11-A",
    zone: "Block C",
    status: "Present",
    checkIn: "08:19 AM",
    checkOut: "--",
    battery: 73,
    gps: "Strong",
    timeline: [
      { time: "08:05 AM", msg: "Entered Main Gate" },
      { time: "08:19 AM", msg: "Entered Block C (Attendance Marked)" },
    ],
  },
  {
    id: "ST3001",
    name: "Noah Kim",
    grade: "Grade 10-B",
    zone: "Outside",
    status: "Absent",
    checkIn: "--",
    checkOut: "--",
    battery: 4,
    gps: "Offline",
    timeline: [
      { time: "08:30 AM", msg: "Device inactive: Critical battery warning" },
      { time: "09:15 AM", msg: "Flagged absent after no-show" },
    ],
  },
  {
    id: "ST9902",
    name: "Ravi Nair",
    grade: "Grade 12-A",
    zone: "Campus A",
    status: "Present",
    checkIn: "08:02 AM",
    checkOut: "--",
    battery: 85,
    gps: "Medium",
    timeline: [
      { time: "07:50 AM", msg: "Entered perimeter" },
      { time: "08:02 AM", msg: "Entered Campus A (Attendance Marked)" },
    ],
  },
  {
    id: "ST1224",
    name: "Sasha Patel",
    grade: "Grade 11-A",
    zone: "Outside",
    status: "Late",
    checkIn: "08:55 AM",
    checkOut: "--",
    battery: 98,
    gps: "Strong",
    timeline: [
      { time: "08:40 AM", msg: "Bus delay reported: Telemetry outside" },
      { time: "08:55 AM", msg: "Entered Campus A: Registered late" },
    ],
  },
];

// Arrival trend data
const ARRIVAL_TREND = [
  { time: "07:30 AM", arrivals: 12, cumulative: 12 },
  { time: "07:45 AM", arrivals: 45, cumulative: 57 },
  { time: "08:00 AM", arrivals: 180, cumulative: 237 },
  { time: "08:15 AM", arrivals: 420, cumulative: 657 },
  { time: "08:30 AM", arrivals: 340, cumulative: 997 },
  { time: "08:45 AM", arrivals: 110, cumulative: 1107 },
  { time: "09:00 AM", arrivals: 52, cumulative: 1159 },
  { time: "09:15 AM", arrivals: 21, cumulative: 1180 },
  { time: "09:30 AM", arrivals: 6, cumulative: 1186 },
];

function AttendancePage() {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [zoneFilter, setZoneFilter] = useState<string>("All");

  // Selection states
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<"Present" | "Late" | "Absent" | "Excused">("Present");

  // Action loading states
  const [isExporting, setIsExporting] = useState(false);

  // Auto-attendance rules settings
  const [rules, setRules] = useState({
    thresholdMinutes: 5,
    lateTime: "08:30",
    autoNotify: true,
    requireVerification: false,
    syncInterval: "realtime",
  });
  const [showConfig, setShowConfig] = useState(false);

  // Dynamic statistics calculations
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.status === "Present").length;
    const late = students.filter((s) => s.status === "Late").length;
    const absent = students.filter((s) => s.status === "Absent").length;
    const excused = students.filter((s) => s.status === "Excused").length;

    const presentRate = ((present / total) * 100).toFixed(1);
    const lateRate = ((late / total) * 100).toFixed(1);
    const absentRate = ((absent / total) * 100).toFixed(1);
    const excusedRate = ((excused / total) * 100).toFixed(1);

    return {
      total,
      present,
      presentRate,
      late,
      lateRate,
      absent,
      absentRate,
      excused,
      excusedRate,
    };
  }, [students]);

  // Zone statistics based on current active list
  const zoneStats = useMemo(() => {
    const counts: Record<string, number> = {
      "Campus A": 0,
      Library: 0,
      "Block C": 0,
      Field: 0,
      Outside: 0,
    };
    students.forEach((s) => {
      if (counts[s.zone] !== undefined) {
        counts[s.zone]++;
      }
    });

    const totalPresent = students.filter((s) => s.status === "Present" || s.status === "Late").length || 1;

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalPresent) * 100),
    }));
  }, [students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.grade.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      const matchesZone = zoneFilter === "All" || s.zone === zoneFilter;

      return matchesSearch && matchesStatus && matchesZone;
    });
  }, [students, searchQuery, statusFilter, zoneFilter]);

  // Detail student object
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Handle manual attendance edit submission
  const handleApplyOverride = () => {
    if (!editingStudentId) return;

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === editingStudentId) {
          const timestamp = new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const updatedTimeline = [
            { time: timestamp, msg: `Manual status override: Marked as ${overrideStatus}` },
            ...s.timeline,
          ];

          return {
            ...s,
            status: overrideStatus,
            checkIn: overrideStatus === "Absent" ? "--" : s.checkIn === "--" ? timestamp : s.checkIn,
            timeline: updatedTimeline,
          };
        }
        return s;
      })
    );

    const studentName = students.find((s) => s.id === editingStudentId)?.name || "Student";
    toast.success(`Updated status for ${studentName} to ${overrideStatus}`);
    setEditingStudentId(null);
  };

  // Mock export report
  const handleExport = () => {
    setIsExporting(true);
    toast.loading("Compiling attendance logs and telemetry map...", { id: "export" });

    setTimeout(() => {
      setIsExporting(false);
      toast.success("Attendance Report Exported! (PDF/CSV generated)", { id: "export" });
    }, 1500);
  };

  // Save rules config
  const handleSaveRules = () => {
    toast.success("Geofence attendance rules updated successfully!");
    setShowConfig(false);
  };

  return (
    <DashboardShell
      title="Attendance & Presence"
      subtitle="Automated geofence telemetry · Active verification hub"
    >
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 glass rounded-2xl p-2 px-3 text-xs text-muted-foreground">
          <Calendar className="size-4 text-cyan" />
          <span>Showing logs for:</span>
          <span className="font-semibold text-foreground font-mono">Today, {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl glass px-4 py-2.5 text-xs font-semibold hover:bg-white/10 transition"
          >
            <Sliders className="size-3.5 text-violet" />
            Config Rules
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold glow-cyan hover:scale-[1.02] disabled:opacity-50 transition"
          >
            {isExporting ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Download className="size-3.5" />
            )}
            Export Report
          </button>
        </div>
      </div>

      {/* Rules Config Panel */}
      {showConfig && (
        <div className="mb-6 glass rounded-3xl p-6 border-violet/30 animate-fade-in relative overflow-hidden">
          <div className="absolute -top-12 -right-12 size-40 bg-violet/20 blur-3xl rounded-full" />
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <Settings className="size-4 text-violet" /> Configure Geofencing Attendance Rules
            </h3>
            <button
              onClick={() => setShowConfig(false)}
              className="size-7 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Zone Dwell Threshold</label>
              <select
                value={rules.thresholdMinutes}
                onChange={(e) => setRules((prev) => ({ ...prev, thresholdMinutes: +e.target.value }))}
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-violet/40"
              >
                <option value={1} className="bg-background text-foreground">1 Minute (Instant)</option>
                <option value={5} className="bg-background text-foreground">5 Minutes (Recommended)</option>
                <option value={10} className="bg-background text-foreground">10 Minutes</option>
                <option value={20} className="bg-background text-foreground">20 Minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Lateness Cutoff Time</label>
              <input
                type="time"
                value={rules.lateTime}
                onChange={(e) => setRules((prev) => ({ ...prev, lateTime: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-violet/40 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Database Sync Interval</label>
              <select
                value={rules.syncInterval}
                onChange={(e) => setRules((prev) => ({ ...prev, syncInterval: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-violet/40"
              >
                <option value="realtime" className="bg-background text-foreground">Real-time Stream</option>
                <option value="hourly" className="bg-background text-foreground">Hourly Batches</option>
                <option value="daily" className="bg-background text-foreground">End-of-day Summary</option>
              </select>
            </div>
            <div className="flex flex-col justify-end gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={rules.autoNotify}
                  onChange={(e) => setRules((prev) => ({ ...prev, autoNotify: e.target.checked }))}
                  className="accent-violet size-3.5"
                />
                <span className="text-muted-foreground">Auto-notify parents on absence</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={rules.requireVerification}
                  onChange={(e) => setRules((prev) => ({ ...prev, requireVerification: e.target.checked }))}
                  className="accent-violet size-3.5"
                />
                <span className="text-muted-foreground">Require hardware signature</span>
              </label>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowConfig(false)}
              className="rounded-xl glass px-4 py-2 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRules}
              className="rounded-xl gradient-primary text-primary-foreground px-4 py-2 text-xs font-semibold glow-cyan"
            >
              Save Rules
            </button>
          </div>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-success" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-success/20 text-success flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Presence Rate</div>
              <div className="font-display text-2xl font-bold">{stats.presentRate}%</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stats.present} of {stats.total} present</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-warning" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-warning/20 text-warning flex items-center justify-center">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Late Arrivals</div>
              <div className="font-display text-2xl font-bold">{stats.lateRate}%</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stats.late} flagged late today</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-danger" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-danger/20 text-danger flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Absence Rate</div>
              <div className="font-display text-2xl font-bold">{stats.absentRate}%</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stats.absent} marked absent</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-cyan" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-cyan/20 text-cyan flex items-center justify-center">
              <UserCheck className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Excused</div>
              <div className="font-display text-2xl font-bold">{stats.excusedRate}%</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stats.excused} approved exemptions</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-5 relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-40 bg-violet" />
          <div className="relative flex items-center gap-3">
            <div className="size-10 rounded-xl bg-violet/20 text-violet flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Avg. Check-In</div>
              <div className="font-display text-2xl font-bold">8:24 AM</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">5m faster than yesterday</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Columns - Analytics Charts & Zone stats */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          {/* Check-In Flow Chart */}
          <div className="glass rounded-3xl p-5 flex-1">
            <div>
              <h3 className="font-display font-semibold text-sm">Arrival Telemetry Peak</h3>
              <p className="text-xs text-muted-foreground">Daily cumulative check-in flow</p>
            </div>
            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ARRIVAL_TREND}>
                  <defs>
                    <linearGradient id="checkinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.82 0.16 200)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.82 0.16 200)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="time" stroke="oklch(0.68 0.02 250)" fontSize={9} tickLine={false} />
                  <YAxis stroke="oklch(0.68 0.02 250)" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.18 0.03 265)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="oklch(0.82 0.16 200)"
                    strokeWidth={2}
                    fill="url(#checkinGrad)"
                    name="Checked In"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance by Zone List */}
          <div className="glass rounded-3xl p-5">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <Compass className="size-4 text-cyan" /> Zone Presence Breakdown
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Tracking checked-in device distributions</p>

            <ul className="space-y-3.5">
              {zoneStats.map((z) => (
                <li key={z.name} className="flex flex-col">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium flex items-center gap-1">
                      <MapPin className="size-3 text-muted-foreground" /> {z.name}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      <strong className="text-foreground">{z.count}</strong> students ({z.pct}%)
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-primary transition-all duration-500"
                      style={{ width: `${Math.max(2, z.pct)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Columns - Main Student Directory and Filters */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass rounded-3xl p-5">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-4">
              <div>
                <h3 className="font-display font-semibold text-base">Students Attendance Registry</h3>
                <p className="text-xs text-muted-foreground">Search and override real-time presence indicators</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, ID, grade..."
                    className="w-full md:w-48 pl-9 pr-3 h-8.5 rounded-xl bg-white/5 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-cyan/40 focus:border-cyan/40 transition"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8.5 rounded-xl bg-white/5 border border-border text-xs px-2.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan/40"
                >
                  <option value="All" className="bg-background text-foreground">All Statuses</option>
                  <option value="Present" className="bg-background text-foreground">Present</option>
                  <option value="Late" className="bg-background text-foreground">Late</option>
                  <option value="Absent" className="bg-background text-foreground">Absent</option>
                  <option value="Excused" className="bg-background text-foreground">Excused</option>
                </select>

                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="h-8.5 rounded-xl bg-white/5 border border-border text-xs px-2.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan/40"
                >
                  <option value="All" className="bg-background text-foreground">All Zones</option>
                  <option value="Campus A" className="bg-background text-foreground">Campus A</option>
                  <option value="Library" className="bg-background text-foreground">Library</option>
                  <option value="Block C" className="bg-background text-foreground">Block C</option>
                  <option value="Field" className="bg-background text-foreground">Field</option>
                  <option value="Outside" className="bg-background text-foreground">Outside Geofence</option>
                </select>
              </div>
            </div>

            {/* Student Grid / List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pl-2">Student</th>
                    <th className="pb-3">Grade</th>
                    <th className="pb-3">Active Zone</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Check In</th>
                    <th className="pb-3">Telemetry</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-muted-foreground">
                        No students match the selected search or filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      // Status Badge configuration
                      let statusBadge = "";
                      if (s.status === "Present") {
                        statusBadge = "bg-success/15 text-success border-success/20";
                      } else if (s.status === "Late") {
                        statusBadge = "bg-warning/15 text-warning border-warning/20";
                      } else if (s.status === "Absent") {
                        statusBadge = "bg-danger/15 text-danger border-danger/20";
                      } else {
                        statusBadge = "bg-cyan/15 text-cyan border-cyan/20";
                      }

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-white/[0.02] group transition-colors cursor-pointer"
                          onClick={() => setSelectedStudentId(s.id)}
                        >
                          <td className="py-3.5 pl-2 flex items-center gap-3">
                            <div className="size-9 rounded-xl gradient-violet flex items-center justify-center text-xs font-bold shrink-0">
                              {s.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground group-hover:text-cyan transition-colors">
                                {s.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                ID {s.id}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-muted-foreground">{s.grade}</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-1 text-foreground">
                              <MapPin className="size-3 text-muted-foreground shrink-0" />
                              <span>{s.zone}</span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge}`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono text-muted-foreground">{s.checkIn}</td>
                          <td className="py-3.5">
                            <div className="flex items-center gap-3">
                              <span
                                className={`inline-flex items-center gap-0.5 text-[10px] ${
                                  s.battery < 20
                                    ? "text-danger"
                                    : s.battery < 50
                                      ? "text-warning"
                                      : "text-success"
                                }`}
                              >
                                <Battery className="size-3" />
                                {s.battery}%
                              </span>
                              <span
                                className={`inline-flex items-center gap-0.5 text-[10px] ${
                                  s.gps === "Offline"
                                    ? "text-danger"
                                    : s.gps === "Weak"
                                      ? "text-warning"
                                      : "text-success"
                                }`}
                              >
                                <Wifi className="size-3" />
                                {s.gps}
                              </span>
                            </div>
                          </td>
                          <td
                            className="py-3.5 pr-2 text-right"
                            onClick={(e) => e.stopPropagation()} // Prevent clicking parent row details triggers
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setOverrideStatus(s.status);
                                  setEditingStudentId(s.id);
                                }}
                                className="size-7.5 rounded-lg hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                title="Override Status"
                              >
                                <Edit3 className="size-3.5 text-cyan" />
                              </button>
                              <button
                                onClick={() => setSelectedStudentId(s.id)}
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
      </div>

      {/* Details Slide-out Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setSelectedStudentId(null)}
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-md h-full glass-strong border-l border-border/50 p-6 flex flex-col justify-between shadow-elevated z-10 animate-slide-in">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl gradient-violet flex items-center justify-center text-sm font-bold">
                    {selectedStudent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">{selectedStudent.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedStudent.grade} · ID {selectedStudent.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="size-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Status Section */}
              <div className="glass rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-center text-xs mb-3 text-muted-foreground">
                  <span>SYSTEM INDICATORS</span>
                  <span className="font-mono text-cyan">LIVE PINGS</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="glass rounded-xl p-2.5">
                    <Wifi className="size-4 text-cyan mx-auto mb-1" />
                    <span className="block text-[10px] text-muted-foreground uppercase">GPS Signal</span>
                    <span className="text-xs font-semibold text-foreground">{selectedStudent.gps}</span>
                  </div>
                  <div className="glass rounded-xl p-2.5">
                    <Battery className={`size-4 mx-auto mb-1 ${selectedStudent.battery < 20 ? "text-danger" : "text-success"}`} />
                    <span className="block text-[10px] text-muted-foreground uppercase">Battery</span>
                    <span className="text-xs font-semibold text-foreground">{selectedStudent.battery}%</span>
                  </div>
                  <div className="glass rounded-xl p-2.5 font-semibold">
                    <MapPin className="size-4 text-violet mx-auto mb-1" />
                    <span className="block text-[10px] text-muted-foreground uppercase">Current Zone</span>
                    <span className="text-xs font-semibold text-foreground truncate block">{selectedStudent.zone}</span>
                  </div>
                </div>
              </div>

              {/* Live Status Override */}
              <div className="flex justify-between items-center glass rounded-2xl p-4 mb-6">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase block mb-0.5">Presence Status</span>
                  <span className="text-sm font-semibold">{selectedStudent.status}</span>
                </div>
                <button
                  onClick={() => {
                    setOverrideStatus(selectedStudent.status);
                    setEditingStudentId(selectedStudent.id);
                  }}
                  className="rounded-xl glass border-cyan/30 text-cyan hover:bg-cyan/10 px-3 py-1.5 text-xs font-semibold transition"
                >
                  Force Override
                </button>
              </div>

              {/* Timeline Tracker */}
              <div>
                <h4 className="font-display font-semibold text-xs text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                  <Activity className="size-3.5 text-cyan" /> Telemetry Path Timeline
                </h4>
                <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {selectedStudent.timeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[14.5px] top-1.5 size-2 rounded-full bg-cyan ring-4 ring-background shadow-[0_0_8px_var(--cyan)]" />
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

            <div className="pt-4 border-t border-border/40 flex justify-between gap-3 text-xs">
              <button
                onClick={() => {
                  toast.info(`Tracing real-time telemetry route for ${selectedStudent.name}`);
                  setSelectedStudentId(null);
                }}
                className="flex-1 rounded-xl glass hover:bg-white/10 py-2.5 font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Compass className="size-3.5 text-violet" /> Map Route
              </button>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="flex-1 rounded-xl gradient-primary text-primary-foreground py-2.5 font-semibold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Status Override Modal */}
      {editingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setEditingStudentId(null)}
          />

          {/* Modal Container */}
          <div className="relative glass-strong rounded-3xl p-6 w-full max-w-sm border border-border/50 shadow-elevated z-10 animate-scale-up">
            <h3 className="font-display font-semibold text-base mb-2">Manual Attendance Override</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Select the override presence indicator status for{" "}
              <strong className="text-foreground">
                {students.find((s) => s.id === editingStudentId)?.name}
              </strong>
              . This will immediately override geofence automatic matching.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {([
                { name: "Present", color: "success" },
                { name: "Late", color: "warning" },
                { name: "Absent", color: "danger" },
                { name: "Excused", color: "cyan" },
              ] as const).map((s) => {
                const isSelected = overrideStatus === s.name;
                return (
                  <button
                    key={s.name}
                    onClick={() => setOverrideStatus(s.name)}
                    className={`rounded-2xl py-2 px-3 border text-xs font-semibold text-center transition ${
                      isSelected
                        ? `bg-${s.color}/15 text-${s.color} border-${s.color}/30 glow-${s.color}`
                        : "border-border hover:bg-white/5 text-muted-foreground hover:text-foreground"
                    }`}
                    style={{
                      borderColor: isSelected ? `var(--${s.color})` : undefined,
                      color: isSelected ? `var(--${s.color})` : undefined,
                      boxShadow: isSelected ? `0 0 12px color-mix(in oklab, var(--${s.color}) 20%, transparent)` : undefined,
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setEditingStudentId(null)}
                className="flex-1 rounded-xl glass hover:bg-white/10 py-2.5 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                className="flex-1 rounded-xl gradient-primary text-primary-foreground py-2.5 font-semibold glow-cyan"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
