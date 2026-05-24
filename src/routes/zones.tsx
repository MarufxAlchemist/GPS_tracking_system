import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { LiveMap } from "@/components/live-map";
import { ZoneEditModal, type ZoneData } from "@/components/zone-edit-modal";
import { ClientOnly } from "@/components/client-only";
import { QRCodeSVG } from "qrcode.react";
import { Hexagon, Circle, QrCode, Plus, Trash2, Edit3, AlertTriangle, Download, Copy } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/zones")({
  head: () => ({ meta: [{ title: "Zones — GeoFence" }] }),
  component: Zones,
});

const INITIAL_ZONES: ZoneData[] = [
  { id: "campus-a", name: "Campus A", shape: "circle", radius: 200, color: "cyan" },
  { id: "library", name: "Library", shape: "circle", radius: 80, color: "violet" },
  { id: "field", name: "Field", shape: "polygon", radius: 150, color: "success" },
  { id: "hostel-block", name: "Hostel Block", shape: "circle", radius: 120, color: "warning" },
];

const ZONE_USERS: Record<string, number> = {
  "campus-a": 412,
  library: 184,
  field: 96,
  "hostel-block": 318,
};

function Zones() {
  const [radius, setRadius] = useState(120);
  const [shape, setShape] = useState<"circle" | "polygon">("circle");
  const [name, setName] = useState("New Geofence");
  const [zones, setZones] = useState<ZoneData[]>(INITIAL_ZONES);
  const [editingZone, setEditingZone] = useState<ZoneData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const qrRef = useRef<SVGSVGElement>(null);

  // Zone code derived from name — updated live
  const zoneCode = name.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 16) || "NEW-GEOFENCE";
  // Build URL only client-side (window is undefined on server)
  const [qrUrl, setQrUrl] = useState("");
  useEffect(() => {
    setQrUrl(`${window.location.origin}/student?join=${encodeURIComponent(zoneCode)}&shape=${shape}&radius=${radius}`);
  }, [zoneCode, shape, radius]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a zone name.");
      return;
    }
    const id = name.trim().toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const newZone: ZoneData = { id, name: name.trim(), shape, radius, color: "cyan" };
    setZones((prev) => [...prev, newZone]);
    toast.success(`Zone "${name.trim()}" created!`);
    setName("New Geofence");
    setRadius(120);
    setShape("circle");
  };

  const handleEditSave = (updated: ZoneData) => {
    setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
    toast.success(`Zone "${updated.name}" updated!`);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      const zone = zones.find((z) => z.id === id);
      setZones((prev) => prev.filter((z) => z.id !== id));
      toast.success(`Zone "${zone?.name}" deleted.`);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svgEl = qrRef.current;
    const xml = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${zoneCode}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("QR code downloaded!");
  };

  const handleCopyCode = () => {
    void navigator.clipboard.writeText(zoneCode);
    toast.success(`Code "${zoneCode}" copied!`);
  };

  return (
    <DashboardShell title="Zone Designer" subtitle="Draw, edit and provision geofences with millimeter precision">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 relative">
          <LiveMap height={620} />
        </div>

        <div className="space-y-5">
          <div className="glass rounded-3xl p-5">
            <h3 className="font-display font-semibold text-sm">Create Zone</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-border">
              {(["circle", "polygon"] as const).map((s) => (
                <button key={s} onClick={() => setShape(s)} className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition ${shape === s ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {s === "circle" ? <Circle className="size-3.5" /> : <Hexagon className="size-3.5" />}
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            <label className="block mt-4">
              <span className="text-xs text-muted-foreground">Zone name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
              />
            </label>

            <div className="mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Radius</span>
                <span className="font-mono text-cyan">{radius} m</span>
              </div>
              <input type="range" min={20} max={500} value={radius} onChange={(e) => setRadius(+e.target.value)}
                className="mt-2 w-full accent-cyan" />
            </div>

            <button
              onClick={handleSave}
              className="mt-5 w-full rounded-2xl gradient-primary text-primary-foreground font-semibold py-3 inline-flex items-center justify-center gap-2 glow-cyan hover:scale-[1.02] transition"
            >
              <Plus className="size-4" /> Save Geofence
            </button>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">QR Provisioning</h3>
              <QrCode className="size-4 text-cyan" />
            </div>

            {/* Live QR code */}
            <div className="mt-3 grid place-items-center p-5 rounded-2xl bg-white/5">
              <ClientOnly fallback={
                <div className="size-44 rounded-2xl bg-white/10 animate-pulse flex items-center justify-center">
                  <QrCode className="size-8 text-muted-foreground opacity-40" />
                </div>
              }>
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  <QRCodeSVG
                    ref={qrRef}
                    value={qrUrl}
                    size={160}
                    bgColor="#ffffff"
                    fgColor="#0a0e1a"
                    level="M"
                    marginSize={1}
                    imageSettings={{
                      src: "/favicon.ico",
                      height: 28,
                      width: 28,
                      excavate: true,
                    }}
                  />
                </div>
              </ClientOnly>
            </div>

            {/* Zone code chip */}
            <div className="mt-3 flex items-center justify-between gap-2 glass rounded-xl px-3 py-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Zone Code</p>
                <p className="font-mono text-sm font-semibold text-cyan">{zoneCode}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
                title="Copy code"
              >
                <Copy className="size-3.5" />
              </button>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground text-center">
              Scan to enroll into <span className="text-foreground font-medium">{name || "New Geofence"}</span>
            </p>

            <button
              onClick={handleDownloadQR}
              className="mt-3 w-full flex items-center justify-center gap-2 glass rounded-xl py-2.5 text-xs font-medium hover:bg-white/10 transition"
            >
              <Download className="size-3.5" /> Download QR
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-display font-semibold mb-3">Existing Zones <span className="text-sm text-muted-foreground font-normal">({zones.length})</span></h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((z) => (
            <div key={z.id} className="group glass rounded-3xl p-5 relative overflow-hidden hover:-translate-y-0.5 transition">
              <div className="absolute -top-10 -right-10 size-32 rounded-full blur-2xl opacity-60" style={{ background: `var(--${z.color})` }} />
              <div className="relative flex items-center justify-between">
                <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in oklab, var(--${z.color}) 20%, transparent)`, color: `var(--${z.color})` }}>
                  {z.shape === "circle" ? <Circle className="size-5" /> : <Hexagon className="size-5" />}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => { setEditingZone(z); setEditOpen(true); }}
                    className="size-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
                    title="Edit zone"
                  >
                    <Edit3 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(z.id)}
                    className="size-8 rounded-lg hover:bg-danger/10 flex items-center justify-center"
                    title={deleteConfirm === z.id ? "Click again to confirm" : "Delete zone"}
                  >
                    {deleteConfirm === z.id ? (
                      <AlertTriangle className="size-3.5 text-danger animate-pulse" />
                    ) : (
                      <Trash2 className="size-3.5 text-danger" />
                    )}
                  </button>
                </div>
              </div>
              <div className="relative mt-4">
                <div className="font-display font-semibold">{z.name}</div>
                <div className="text-xs text-muted-foreground">{ZONE_USERS[z.id] ?? Math.floor(Math.random() * 200 + 10)} active devices</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-1">{z.shape} · {z.radius}m radius</div>
              </div>
            </div>
          ))}
        </div>
        {deleteConfirm && (
          <p className="mt-3 text-xs text-warning text-center animate-pulse">
            ⚠ Click the trash icon again to confirm deletion
          </p>
        )}
      </div>

      <ZoneEditModal
        zone={editingZone}
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditingZone(null); }}
        onSave={handleEditSave}
      />
    </DashboardShell>
  );
}
