import { useState, useEffect } from "react";
import { X, Circle, Hexagon, Save } from "lucide-react";

export interface ZoneData {
  id: string;
  name: string;
  shape: "circle" | "polygon";
  radius: number;
  color: string;
}

interface Props {
  zone: ZoneData | null;
  open: boolean;
  onClose: () => void;
  onSave: (zone: ZoneData) => void;
}

export function ZoneEditModal({ zone, open, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [shape, setShape] = useState<"circle" | "polygon">("circle");
  const [radius, setRadius] = useState(120);

  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setShape(zone.shape);
      setRadius(zone.radius);
    }
  }, [zone]);

  if (!open || !zone) return null;

  const handleSave = () => {
    onSave({ ...zone, name: name.trim() || zone.name, shape, radius });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm glass-strong rounded-3xl border border-border/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h2 className="font-display font-semibold">Edit Zone</h2>
            <button onClick={onClose} className="size-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition">
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Shape */}
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Shape</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 border border-border">
                {(["circle", "polygon"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setShape(s)}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition ${shape === s ? "gradient-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    {s === "circle" ? <Circle className="size-3.5" /> : <Hexagon className="size-3.5" />}
                    {s[0].toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <label className="block">
              <span className="text-xs text-muted-foreground">Zone name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-xl bg-white/5 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-cyan/40"
              />
            </label>

            {/* Radius */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Radius</span>
                <span className="font-mono text-cyan">{radius} m</span>
              </div>
              <input
                type="range"
                min={20}
                max={500}
                value={radius}
                onChange={(e) => setRadius(+e.target.value)}
                className="w-full accent-cyan"
              />
            </div>
          </div>

          <div className="flex gap-3 p-5 pt-0">
            <button onClick={onClose} className="flex-1 glass rounded-xl py-2.5 text-sm hover:bg-white/10 transition">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 glow-cyan hover:scale-[1.02] transition"
            >
              <Save className="size-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
