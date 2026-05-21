import { useEffect, useState } from "react";

type Marker = { id: string; x: number; y: number; vx: number; vy: number; status: "safe" | "warn" | "alert"; name: string };

const NAMES = ["Aarav", "Maya", "Liam", "Zara", "Noah", "Eva", "Kai", "Mia", "Leo", "Aria", "Ravi", "Iris"];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

export function LiveMap({ height = 520, compact = false }: { height?: number; compact?: boolean }) {
  const [markers, setMarkers] = useState<Marker[]>(() =>
    Array.from({ length: compact ? 4 : 9 }, (_, i) => ({
      id: String(i),
      x: rand(15, 85),
      y: rand(20, 80),
      vx: rand(-0.15, 0.15),
      vy: rand(-0.15, 0.15),
      status: i === 2 ? "alert" : i % 4 === 0 ? "warn" : "safe",
      name: NAMES[i % NAMES.length],
    })),
  );

  useEffect(() => {
    const t = setInterval(() => {
      setMarkers((prev) =>
        prev.map((m) => {
          let nx = m.x + m.vx;
          let ny = m.y + m.vy;
          let vx = m.vx, vy = m.vy;
          if (nx < 8 || nx > 92) { vx = -vx; nx = m.x + vx; }
          if (ny < 12 || ny > 88) { vy = -vy; ny = m.y + vy; }
          return { ...m, x: nx, y: ny, vx, vy };
        }),
      );
    }, 80);
    return () => clearInterval(t);
  }, []);

  // Geofence zones
  const zones = [
    { cx: 35, cy: 45, r: 18, label: "Campus A", color: "var(--cyan)" },
    { cx: 70, cy: 60, r: 14, label: "Library", color: "var(--violet)" },
    { cx: 55, cy: 25, r: 10, label: "Field", color: "var(--success)" },
  ];

  const statusColor = (s: Marker["status"]) =>
    s === "safe" ? "var(--success)" : s === "warn" ? "var(--warning)" : "var(--danger)";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl glass-strong" style={{ height }}>
      {/* Backdrop */}
      <div className="absolute inset-0 gradient-hero opacity-70" />
      <div className="absolute inset-0 grid-bg opacity-60" />

      {/* World contour decorative SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="globe" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.78 0.16 200 / 0.18)" />
            <stop offset="70%" stopColor="oklch(0.6 0.24 285 / 0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="route" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--violet)" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="50" rx="45" ry="42" fill="url(#globe)" />
        {/* Latitude/longitude curves */}
        {[20, 35, 50, 65, 80].map((y) => (
          <path key={y} d={`M 5 ${y} Q 50 ${y - 6}, 95 ${y}`} stroke="oklch(1 0 0 / 0.06)" fill="none" />
        ))}
        {[20, 40, 60, 80].map((x) => (
          <path key={x} d={`M ${x} 8 Q ${x - 6} 50, ${x} 92`} stroke="oklch(1 0 0 / 0.06)" fill="none" />
        ))}
        {/* Animated route lines between markers */}
        {markers.slice(0, 4).map((m, i) => {
          const n = markers[(i + 1) % 4];
          return (
            <path
              key={m.id}
              d={`M ${m.x} ${m.y} Q ${(m.x + n.x) / 2} ${(m.y + n.y) / 2 - 8}, ${n.x} ${n.y}`}
              stroke="url(#route)"
              strokeWidth="0.25"
              fill="none"
              strokeDasharray="2 3"
              className="dash-flow"
              opacity="0.6"
            />
          );
        })}
        {/* Zones */}
        {zones.map((z) => (
          <g key={z.label}>
            <circle cx={z.cx} cy={z.cy} r={z.r} fill={z.color} fillOpacity="0.06" stroke={z.color} strokeOpacity="0.4" strokeWidth="0.2" />
            <circle cx={z.cx} cy={z.cy} r={z.r} fill="none" stroke={z.color} strokeOpacity="0.2" strokeWidth="0.15" strokeDasharray="1 1" />
          </g>
        ))}
      </svg>

      {/* Markers */}
      {markers.map((m) => (
        <div
          key={m.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-linear"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        >
          <div className="relative">
            <span
              className="absolute inset-0 m-auto size-3 rounded-full pulse-ring"
              style={{ background: statusColor(m.status), opacity: 0.6 }}
            />
            <span
              className="relative block size-3 rounded-full ring-2 ring-background"
              style={{ background: statusColor(m.status), boxShadow: `0 0 12px ${statusColor(m.status)}` }}
            />
            {!compact && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-mono px-1.5 py-0.5 rounded-md glass">
                {m.name}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Corner HUD */}
      <div className="absolute top-4 left-4 glass rounded-2xl px-3 py-2 flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inset-0 rounded-full bg-success pulse-ring opacity-70" />
          <span className="relative rounded-full bg-success size-2" />
        </span>
        <span className="text-xs font-mono">LIVE · {markers.length} TRACKED</span>
      </div>
      <div className="absolute bottom-4 right-4 glass rounded-2xl px-3 py-2 font-mono text-[10px] text-muted-foreground">
        LAT 12.9716° · LON 77.5946°
      </div>
      {!compact && (
        <div className="absolute bottom-4 left-4 glass rounded-2xl p-2 flex gap-1">
          {["+", "−", "⊕"].map((s) => (
            <button key={s} className="size-8 rounded-xl hover:bg-white/10 transition text-sm">{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
