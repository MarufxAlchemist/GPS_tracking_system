import React, { useEffect, useRef } from "react";
import { X, ShieldAlert, AlertTriangle, CheckCircle2, MapPin, Clock, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  severity: "emergency" | "warning" | "safe";
  title: string;
  user: string;
  location: string;
  time: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id: "n1", severity: "emergency", title: "SOS Triggered", user: "Maruf Nadaf · ID 4421", location: "East Gate", time: "just now", read: false },
  { id: "n2", severity: "emergency", title: "Device went dark", user: "Gautam Iyengar · ID 3001", location: "Hostel Block C", time: "3 min ago", read: false },
  { id: "n3", severity: "warning", title: "Left Geofence", user: "Anuja Naik · ID 3187", location: "Campus A perimeter", time: "6 min ago", read: false },
  { id: "n4", severity: "warning", title: "Idle outside zone", user: "Samidha Ghorpade · ID 2204", location: "Library annex", time: "11 min ago", read: true },
  { id: "n5", severity: "warning", title: "Battery critical", user: "Harsh Joshi · ID 5511", location: "Field", time: "22 min ago", read: true },
  { id: "n6", severity: "safe", title: "Returned to zone", user: "Tushar Dhanawade · ID 1109", location: "Field", time: "31 min ago", read: true },
  { id: "n7", severity: "safe", title: "Attendance marked", user: "Sameer Barathe · ID 0982", location: "Block C", time: "42 min ago", read: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ open, onClose }: Props) {
  const [notifications, setNotifications] = React.useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const cfg = {
    emergency: { Icon: ShieldAlert, color: "var(--danger)", chip: "bg-danger/20 text-danger" },
    warning: { Icon: AlertTriangle, color: "var(--warning)", chip: "bg-warning/20 text-warning" },
    safe: { Icon: CheckCircle2, color: "var(--success)", chip: "bg-success/20 text-success" },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed right-0 top-0 z-50 h-screen w-full max-w-sm glass-strong border-l border-border/50 flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0">
          <div>
            <h2 className="font-display font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-cyan hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="size-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <BellOff className="size-10 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { Icon, color, chip } = cfg[n.severity];
              return (
                <div
                  key={n.id}
                  className={cn(
                    "relative glass rounded-2xl p-3.5 group transition",
                    !n.read && "border border-cyan/20 bg-cyan/5",
                  )}
                >
                  {!n.read && (
                    <span className="absolute top-3.5 right-3.5 size-1.5 rounded-full bg-cyan" />
                  )}
                  <div className="flex items-start gap-3 pr-4">
                    <div
                      className="size-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in oklab, ${color} 20%, transparent)`, color }}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{n.title}</p>
                        <span className={cn("text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full shrink-0", chip)}>
                          {n.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{n.user}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{n.location}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="size-3" />{n.time}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => dismiss(n.id)}
                    className="absolute top-2 right-2 size-6 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 flex items-center justify-center transition"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
