import { useState, useRef, useEffect } from "react";
import { X, QrCode, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function JoinZoneModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<"code" | "qr">("code");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && tab === "code") setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, tab]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleJoin = () => {
    if (!code.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Joined zone "${code.toUpperCase()}" successfully!`);
      setCode("");
      onClose();
    }, 1200);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm glass-strong rounded-3xl border border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h2 className="font-display font-semibold">Join a Zone</h2>
            <button onClick={onClose} className="size-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition">
              <X className="size-4" />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="p-4 pb-0">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white/5 border border-border">
              {(["code", "qr"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition",
                    tab === t ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                  )}
                >
                  {t === "code" ? <Hash className="size-3.5" /> : <QrCode className="size-3.5" />}
                  {t === "code" ? "Enter Code" : "Scan QR"}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {tab === "code" ? (
              <>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Zone access code</span>
                  <input
                    ref={inputRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder="e.g. CAMPUS-A"
                    maxLength={20}
                    className="mt-1.5 w-full h-12 px-4 rounded-xl bg-white/5 border border-border text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan/40 placeholder:tracking-normal placeholder:font-sans"
                  />
                </label>
                <button
                  onClick={handleJoin}
                  disabled={!code.trim() || loading}
                  className="w-full gradient-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold glow-cyan hover:scale-[1.02] transition disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : null}
                  {loading ? "Joining..." : "Join Zone"}
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <QRCodeSVG
                    value={`${typeof window !== "undefined" ? window.location.origin : "https://geofence.app"}/student?join=CAMPUS-A&shape=circle&radius=200`}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#0a0e1a"
                    level="M"
                    marginSize={1}
                    imageSettings={{
                      src: "/favicon.ico",
                      height: 24,
                      width: 24,
                      excavate: true,
                    }}
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-mono font-semibold text-cyan">CAMPUS-A</p>
                  <p className="text-xs text-muted-foreground">
                    Scan with your phone camera to join this zone.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
