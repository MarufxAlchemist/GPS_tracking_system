import React, { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { User, Settings, LogOut, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function UserMenu({ open, onClose, anchorRef }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, anchorRef]);

  const items = [
    { icon: User, label: "Profile", to: "/settings" },
    { icon: Settings, label: "Settings", to: "/settings" },
    { icon: Shield, label: "Security", to: "/settings" },
  ];

  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute right-0 top-full mt-2 z-50 w-56 glass-strong rounded-2xl border border-border/50 overflow-hidden shadow-xl transition-all duration-200 origin-top-right",
        open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
      )}
    >
      {/* User info */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl gradient-violet flex items-center justify-center text-sm font-bold">AK</div>
          <div>
            <div className="text-sm font-semibold">Ananya K.</div>
            <div className="text-[11px] text-muted-foreground">ananya@campus.edu</div>
            <div className="text-[10px] text-cyan font-mono mt-0.5">Admin · Pro plan</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-2">
        {items.map(({ icon: Icon, label, to }) => (
          <Link
            key={label}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={to as any}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 text-sm transition group"
          >
            <Icon className="size-4 text-muted-foreground group-hover:text-foreground transition" />
            <span>{label}</span>
            <ChevronRight className="size-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <div className="p-2 border-t border-border/50">
        <Link
          to="/login"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-danger/10 text-sm text-danger transition group w-full"
        >
          <LogOut className="size-4" />
          <span>Sign out</span>
        </Link>
      </div>
    </div>
  );
}
