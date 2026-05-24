import { useEffect, useState } from "react";
import type { GeoState } from "@/hooks/use-geolocation";
import { useLiveLocations } from "@/hooks/use-live-locations";

type Marker = { id: string; x: number; y: number; status: "safe" | "warn" | "alert"; name: string };


/**
 * Map real-world lat/lon to SVG % coordinates [0..100].
 * We use a simple linear mapping anchored at the Equator / Prime Meridian center (0,0),
 * scaled to fit the globe ellipse in the SVG viewport.
 * Result is clamped to [8, 92] so the dot stays inside the visible area.
 */
function latLonToSvg(lat: number, lon: number): { x: number; y: number } {
  // Mercator-inspired linear projection mapped to 0–100 SVG space
  const x = ((lon + 180) / 360) * 100;
  // Flip y because SVG y increases downward
  const y = ((90 - lat) / 180) * 100;
  return {
    x: Math.min(92, Math.max(8, x)),
    y: Math.min(88, Math.max(12, y)),
  };
}

interface LiveMapProps {
  height?: number;
  compact?: boolean;
  /** Real-world geolocation state from useGeolocation hook */
  geoState?: GeoState;
}

export function LiveMap({ height = 520, compact = false, geoState }: LiveMapProps) {
  const { locations } = useLiveLocations();

  const markers: Marker[] = Array.from(locations.values()).map(loc => {
    const pos = latLonToSvg(loc.latitude, loc.longitude);
    const timeSince = Math.round((Date.now() - new Date(loc.updated_at).getTime()) / 1000);
    return {
      id: loc.user_id,
      x: pos.x,
      y: pos.y,
      status: timeSince < 15 ? "safe" : timeSince < 60 ? "warn" : "alert",
      name: loc.username || `User ${loc.user_id.slice(0, 4)}`
    };
  });

  // Geofence zones
  const zones = [
    { cx: 35, cy: 45, r: 18, label: "Campus A", color: "var(--cyan)" },
    { cx: 70, cy: 60, r: 14, label: "Library", color: "var(--violet)" },
    { cx: 55, cy: 25, r: 10, label: "Field", color: "var(--success)" },
  ];

  const statusColor = (s: Marker["status"]) =>
    s === "safe" ? "var(--success)" : s === "warn" ? "var(--warning)" : "var(--danger)";

  // Real user position
  const realUser = geoState?.status === "active" ? latLonToSvg(geoState.lat, geoState.lon) : null;
  const realLat = geoState?.status === "active" ? geoState.lat : null;
  const realLon = geoState?.status === "active" ? geoState.lon : null;
  const realAccuracy = geoState?.status === "active" ? geoState.accuracy : null;

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
        {/* Animated route lines between markers (disabled for real data as it requires path tracking) */}
        {/* Zones */}
        {zones.map((z) => (
          <g key={z.label}>
            <circle cx={z.cx} cy={z.cy} r={z.r} fill={z.color} fillOpacity="0.06" stroke={z.color} strokeOpacity="0.4" strokeWidth="0.2" />
            <circle cx={z.cx} cy={z.cy} r={z.r} fill="none" stroke={z.color} strokeOpacity="0.2" strokeWidth="0.15" strokeDasharray="1 1" />
          </g>
        ))}
        {/* Real user accuracy ring */}
        {realUser && (
          <circle
            cx={realUser.x}
            cy={realUser.y}
            r={2.5}
            fill="oklch(0.82 0.16 200 / 0.12)"
            stroke="oklch(0.82 0.16 200 / 0.5)"
            strokeWidth="0.15"
            strokeDasharray="0.5 0.5"
          />
        )}
      </svg>

      {/* Demo markers */}
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

      {/* Real "You" marker */}
      {realUser && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${realUser.x}%`, top: `${realUser.y}%` }}
        >
          <div className="relative">
            {/* outer pulse */}
            <span
              className="absolute inset-0 m-auto size-4 rounded-full pulse-ring"
              style={{ background: "var(--cyan)", opacity: 0.8 }}
            />
            {/* Accuracy circle animation */}
            <span
              className="absolute inset-0 m-auto size-5 rounded-full"
              style={{
                background: "oklch(0.82 0.16 200 / 0.15)",
                border: "1px solid oklch(0.82 0.16 200 / 0.4)",
              }}
            />
            {/* Dot */}
            <span
              className="relative block size-4 rounded-full ring-2 ring-background"
              style={{ background: "var(--cyan)", boxShadow: "0 0 18px var(--cyan)" }}
            />
            {/* Label */}
            <span
              className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-mono font-bold px-2 py-0.5 rounded-md"
              style={{
                background: "oklch(0.82 0.16 200 / 0.2)",
                border: "1px solid oklch(0.82 0.16 200 / 0.4)",
                color: "var(--cyan)",
              }}
            >
              📍 You
            </span>
          </div>
        </div>
      )}

      {/* Corner HUD — top left */}
      <div className="absolute top-4 left-4 glass rounded-2xl px-3 py-2 flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inset-0 rounded-full bg-success pulse-ring opacity-70" />
          <span className="relative rounded-full bg-success size-2" />
        </span>
        <span className="text-xs font-mono">LIVE · {markers.length + (realUser ? 1 : 0)} TRACKED</span>
      </div>

      {/* Coordinates HUD — bottom right */}
      <div className="absolute bottom-4 right-4 glass rounded-2xl px-3 py-2 font-mono text-[10px] text-muted-foreground">
        {realLat !== null && realLon !== null
          ? `LAT ${realLat.toFixed(4)}° · LON ${realLon.toFixed(4)}°`
          : "LAT 12.9716° · LON 77.5946°"}
      </div>

      {/* Accuracy badge — only when real GPS is active */}
      {realAccuracy !== null && (
        <div className="absolute top-4 right-4 glass rounded-2xl px-3 py-2 font-mono text-[10px]" style={{ color: "var(--cyan)" }}>
          ±{Math.round(realAccuracy)}m accuracy
        </div>
      )}

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
