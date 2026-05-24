import { useState, useEffect } from "react";
import { X, Check, Copy, UserRound, GraduationCap, Shield, User, RefreshCw, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { ClientOnly } from "@/components/client-only";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Role = "admin" | "teacher" | "student" | "security";

export function InviteMemberModal({ open, onClose }: Props) {
  const [role, setRole] = useState<Role>("teacher");
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Generate a random code on mount or when role changes
  const generateNewCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += "-";
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(`INV-${code}`);
    setGeneratedLink("");
    setCopied(false);
  };

  useEffect(() => {
    if (open) {
      generateNewCode();
    }
  }, [open, role]);

  const handleGenerate = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
    const link = `${origin}/signup?invite=${inviteCode}&role=${role}${email ? `&email=${encodeURIComponent(email)}` : ""}`;
    setGeneratedLink(link);
    setCopied(false);
    toast.success("Invite link generated!");
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md glass-strong rounded-3xl border border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <div>
              <h2 className="font-display font-semibold text-lg text-white">Invite Team Member</h2>
              <p className="text-xs text-muted-foreground">Generate a secure invite link to onboard a new member.</p>
            </div>
            <button onClick={onClose} className="size-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition">
              <X className="size-4 text-white" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Role selection */}
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Member Role</label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-white/5 border border-border">
                {([
                  { key: "admin", label: "Admin", Icon: Shield },
                  { key: "teacher", label: "Teacher", Icon: UserRound },
                  { key: "security", label: "Security", Icon: User },
                  { key: "student", label: "Student", Icon: GraduationCap },
                ] as const).map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium transition",
                      role === r.key
                        ? "gradient-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <r.Icon className="size-3.5" />
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email pre-fill (optional) */}
            <label className="block">
              <span className="text-xs text-muted-foreground">Invitee Email (Optional)</span>
              <p className="text-[10px] text-muted-foreground/60 mb-1.5">Pre-fills the email address on the registration form.</p>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
              />
            </label>

            {/* Invite code generation details */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-border/50">
              <div>
                <span className="text-xs text-muted-foreground block">Invite Code</span>
                <span className="text-sm font-mono font-bold tracking-wider text-cyan">{inviteCode}</span>
              </div>
              <button
                onClick={generateNewCode}
                className="size-9 rounded-xl hover:bg-white/10 flex items-center justify-center transition border border-border/50"
                title="Regenerate Invite Code"
              >
                <RefreshCw className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* Actions / Output */}
            {!generatedLink ? (
              <button
                onClick={handleGenerate}
                className="w-full gradient-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold glow-cyan hover:scale-[1.02] transition flex items-center justify-center gap-2"
              >
                Generate Invite Link
              </button>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Generated Invite Link</span>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={generatedLink}
                      className="flex-1 h-10 px-3 rounded-xl bg-white/5 border border-border text-xs text-muted-foreground font-mono truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "px-3.5 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition shrink-0",
                        copied
                          ? "bg-success/20 border-success/30 text-success"
                          : "bg-white/5 border-border hover:bg-white/10 text-white"
                      )}
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="text-xs text-cyan hover:underline flex items-center gap-1.5"
                  >
                    <QrCode className="size-3.5" />
                    {showQR ? "Hide QR Code" : "Show QR Code"}
                  </button>
                  <button
                    onClick={generateNewCode}
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    Create another link
                  </button>
                </div>

                {showQR && (
                  <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-lg mt-2 mx-auto w-fit transition animate-in fade-in slide-in-from-top-2 duration-200">
                    <ClientOnly fallback={
                      <div className="size-32 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center" />
                    }>
                      <QRCodeSVG
                        value={generatedLink}
                        size={120}
                        bgColor="#ffffff"
                        fgColor="#0a0e1a"
                        level="M"
                        marginSize={1}
                      />
                    </ClientOnly>
                    <span className="text-[10px] text-slate-500 font-mono">Scan to register</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
