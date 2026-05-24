import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ClipboardCheck, Search, Filter, Download, ChevronDown, Check, X, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — GeoFence" }] }),
  component: Attendance,
});

interface Student {
  id: string;
  name: string;
  studentId: string;
  zone: string;
  status: "present" | "absent" | "late";
  time: string;
  block: string;
}

const STUDENTS: Student[] = [
  { id: "s1", name: "Maya Verma", studentId: "ID 4421", zone: "Campus A", status: "present", time: "8:12 AM", block: "Block A" },
  { id: "s2", name: "Noah Kim", studentId: "ID 3001", zone: "Hostel Block C", status: "absent", time: "—", block: "Block B" },
  { id: "s3", name: "Kai Tanaka", studentId: "ID 3187", zone: "Outside", status: "late", time: "9:41 AM", block: "Block A" },
  { id: "s4", name: "Iris Bloom", studentId: "ID 2204", zone: "Library", status: "present", time: "8:05 AM", block: "Block C" },
  { id: "s5", name: "Aria Bose", studentId: "ID 5511", zone: "Field", status: "present", time: "8:18 AM", block: "Block B" },
  { id: "s6", name: "Leo Park", studentId: "ID 1109", zone: "Field", status: "present", time: "8:22 AM", block: "Block A" },
  { id: "s7", name: "Eva Lin", studentId: "ID 0982", zone: "Block C", status: "present", time: "8:09 AM", block: "Block C" },
  { id: "s8", name: "Aarav Shah", studentId: "ID 0021", zone: "Library", status: "late", time: "9:15 AM", block: "Block B" },
  { id: "s9", name: "Zara Ahmed", studentId: "ID 6677", zone: "Campus A", status: "present", time: "8:30 AM", block: "Block A" },
  { id: "s10", name: "Riya Menon", studentId: "ID 7890", zone: "Cafeteria", status: "absent", time: "—", block: "Block C" },
];

const statusCfg = {
  present: { label: "Present", color: "success", Icon: Check },
  absent: { label: "Absent", color: "danger", Icon: X },
  late: { label: "Late", color: "warning", Icon: Clock },
};

function Attendance() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "late">("all");
  const [students, setStudents] = useState<Student[]>(STUDENTS);

  const filtered = students.filter((s) => {
    const matchSearch = search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const lateCount = students.filter((s) => s.status === "late").length;
  const pct = Math.round((presentCount / students.length) * 100);

  const markStatus = (id: string, status: Student["status"]) => {
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, status, time: status === "absent" ? "—" : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } : s));
    toast.success(`Attendance updated.`);
  };

  return (
    <DashboardShell title="Attendance" subtitle="Automated presence detection · Today">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: students.length, color: "cyan" },
          { label: "Present", value: presentCount, color: "success" },
          { label: "Absent", value: absentCount, color: "danger" },
          { label: "Late", value: lateCount, color: "warning" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 size-24 rounded-full blur-2xl opacity-40" style={{ background: `var(--${s.color})` }} />
            <div className="relative">
              <div className="text-xs text-muted-foreground uppercase tracking-widest">{s.label}</div>
              <div className="font-display text-3xl font-bold mt-1" style={{ color: s.label === "Total Students" ? undefined : `var(--${s.color})` }}>
                {s.value}
              </div>
              {s.label === "Total Students" && (
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 h-10 rounded-xl bg-white/5 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "present", "absent", "late"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium transition",
                statusFilter === f ? "gradient-primary text-primary-foreground" : "glass hover:bg-white/10 text-muted-foreground"
              )}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => toast.success("Attendance report exported!")}
          className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm hover:bg-white/10 transition"
        >
          <Download className="size-4" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 glass rounded-3xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Student</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Zone</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Block</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Time</th>
              <th className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const cfg = statusCfg[s.status];
              return (
                <tr key={s.id} className="border-b border-border/30 hover:bg-white/3 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {s.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{s.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{s.zone}</td>
                  <td className="p-4 text-muted-foreground hidden lg:table-cell">{s.block}</td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                    )} style={{ background: `color-mix(in oklab, var(--${cfg.color}) 20%, transparent)`, color: `var(--${cfg.color})` }}>
                      <cfg.Icon className="size-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-muted-foreground hidden md:table-cell">{s.time}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => markStatus(s.id, "present")} title="Mark Present" className="size-7 rounded-lg hover:bg-success/20 flex items-center justify-center transition">
                        <Check className="size-3.5 text-success" />
                      </button>
                      <button onClick={() => markStatus(s.id, "late")} title="Mark Late" className="size-7 rounded-lg hover:bg-warning/20 flex items-center justify-center transition">
                        <Clock className="size-3.5 text-warning" />
                      </button>
                      <button onClick={() => markStatus(s.id, "absent")} title="Mark Absent" className="size-7 rounded-lg hover:bg-danger/20 flex items-center justify-center transition">
                        <X className="size-3.5 text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <ClipboardCheck className="size-10 mx-auto mb-3 opacity-30" />
            No students match your search.
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
