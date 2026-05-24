/**
 * LiveTrackingMap
 *
 * Renders a real-time Leaflet map with markers for all users stored in the
 * Supabase `live_locations` table. Subscribes to realtime INSERT/UPDATE events.
 *
 * IMPORTANT: This component must only be loaded client-side (never during SSR).
 * Use React.lazy() + Suspense to import it, as done in the route files.
 */

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
// Leaflet is imported here but this module is only ever evaluated client-side
// because we mark it as SSR-external in vite.config.ts and lazy-load it in routes.
import L from "leaflet";
import { AlertTriangle, X, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useGeofenceMonitor } from "@/hooks/use-geofence-monitor";
import { type GeofenceZone } from "@/lib/geofence";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationRow {
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface LiveTrackingMapProps {
  /** Map height — CSS value or number (px). Default "100%" */
  height?: string | number;
  /** Initial center [lat, lon]. Defaults to world center. */
  center?: [number, number];
  /** Initial zoom. Default 3. */
  zoom?: number;
  /** Optional: highlight a specific user_id with a different style */
  highlightUserId?: string;
  /** Geofence zones to render and monitor */
  zones?: GeofenceZone[];
  /** Extra CSS class applied to the wrapper div */
  className?: string;
  /** Called whenever the tracked locations map changes */
  onLocationsChange?: (locations: Map<string, LocationRow>) => void;
}

// ---------------------------------------------------------------------------
// Custom marker icons — created lazily inside the component (client-only)
// ---------------------------------------------------------------------------

function createPulsingIcon(color: string, highlighted = false): L.DivIcon {
  const size = highlighted ? 18 : 12;
  const ringSize = highlighted ? 30 : 22;
  return L.divIcon({
    className: "", // suppress default leaflet-div-icon styles
    iconSize: [ringSize, ringSize],
    iconAnchor: [ringSize / 2, ringSize / 2],
    popupAnchor: [0, -(ringSize / 2 + 4)],
    html: `
      <div style="position:relative;width:${ringSize}px;height:${ringSize}px;display:flex;align-items:center;justify-content:center;">
        <span style="
          position:absolute;inset:0;border-radius:50%;
          background:${color};opacity:0.35;
          animation:lt-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;
        "></span>
        <span style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${color};
          box-shadow:0 0 14px ${color},0 0 4px ${color};
          border:2px solid rgba(255,255,255,0.9);
          position:relative;z-index:1;
        "></span>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Sub-component: smoothly animates marker to new position
// ---------------------------------------------------------------------------

function AnimatedMarker({
  position,
  icon,
  children,
}: {
  position: [number, number];
  icon: L.DivIcon;
  children?: React.ReactNode;
}) {
  const markerRef = useRef<L.Marker | null>(null);
  const prevPos = useRef<[number, number]>(position);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (prevPos.current[0] !== position[0] || prevPos.current[1] !== position[1]) {
      const start: [number, number] = [prevPos.current[0], prevPos.current[1]];
      const end = position;
      const duration = 800;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        const lat = start[0] + (end[0] - start[0]) * ease;
        const lng = start[1] + (end[1] - start[1]) * ease;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
      prevPos.current = position;
    }

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: auto-fits bounds when markers first arrive
// ---------------------------------------------------------------------------

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (positions.length === 0 || fitted.current) return;
    if (positions.length === 1) {
      map.setView(positions[0], 15, { animate: true });
    } else {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds.pad(0.3), { maxZoom: 16, animate: true });
    }
    fitted.current = true;
  }, [positions, map]);

  return null;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LiveTrackingMap({
  height = "100%",
  center = [20, 0],
  zoom = 3,
  highlightUserId,
  zones = [],
  className = "",
  onLocationsChange,
}: LiveTrackingMapProps) {
  const [locations, setLocations] = useState<Map<string, LocationRow>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting");

  // Create icons once per mount (client-only, safe here since this module is SSR-external)
  const defaultIcon = useRef<L.DivIcon | null>(null);
  const highlightIcon = useRef<L.DivIcon | null>(null);
  if (!defaultIcon.current) defaultIcon.current = createPulsingIcon("oklch(0.82 0.16 200)");
  if (!highlightIcon.current) highlightIcon.current = createPulsingIcon("oklch(0.78 0.17 65)", true);

  // -----------------------------------------------------------------------
  // 1. Fetch initial data from live_locations
  // -----------------------------------------------------------------------
  useEffect(() => {
    async function fetchInitial() {
      console.log("[LiveTrackingMap] Fetching initial locations from live_locations…");

      const { data, error } = await supabase
        .from("live_locations")
        .select("user_id, latitude, longitude, updated_at");

      if (error) {
        console.error("[LiveTrackingMap] Initial fetch failed:", error.message);
        return;
      }

      console.log(`[LiveTrackingMap] Initial fetch returned ${data?.length ?? 0} row(s):`, data);

      if (data && data.length > 0) {
        setLocations((prev) => {
          const next = new Map(prev);
          for (const row of data) {
            if (
              row &&
              typeof row.latitude === "number" &&
              typeof row.longitude === "number" &&
              !isNaN(row.latitude) &&
              !isNaN(row.longitude)
            ) {
              next.set(row.user_id, row as LocationRow);
            }
          }
          console.log(`[LiveTrackingMap] Location map now has ${next.size} user(s)`);
          return next;
        });
      }
    }

    void fetchInitial();
  }, []);

  // -----------------------------------------------------------------------
  // 2. Supabase Realtime subscription for INSERT and UPDATE
  // -----------------------------------------------------------------------
  useEffect(() => {
    const uniqueChannelName = `live_locations_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    console.log(`[LiveTrackingMap] Subscribing to realtime on channel "${uniqueChannelName}"…`);

    const handleRow = (row: LocationRow, event: "INSERT" | "UPDATE") => {
      if (
        !row ||
        typeof row.latitude !== "number" ||
        typeof row.longitude !== "number" ||
        isNaN(row.latitude) ||
        isNaN(row.longitude)
      ) {
        console.warn("[LiveTrackingMap] Ignoring row with invalid coords:", row);
        return;
      }

      console.log(`[LiveTrackingMap] Realtime ${event} received for user ${row.user_id}:`, {
        lat: row.latitude,
        lon: row.longitude,
        at: row.updated_at,
      });

      setLocations((prev) => {
        const next = new Map(prev);
        next.set(row.user_id, row);
        console.log(`[LiveTrackingMap] Location map now has ${next.size} user(s)`);
        return next;
      });
    };

    const channel = supabase
      .channel(uniqueChannelName)
      .on<LocationRow>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_locations" },
        (payload) => handleRow(payload.new, "INSERT"),
      )
      .on<LocationRow>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_locations" },
        (payload) => handleRow(payload.new, "UPDATE"),
      )
      .subscribe((status) => {
        console.log("[LiveTrackingMap] Realtime subscription status:", status);
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("error");
          console.error("[LiveTrackingMap] Realtime subscription failed with status:", status);
        }
      });

    return () => {
      console.log(`[LiveTrackingMap] Removing realtime channel "${uniqueChannelName}"`);
      void supabase.removeChannel(channel);
    };
  }, []);

  // -----------------------------------------------------------------------
  // Notify parent whenever locations map changes
  // -----------------------------------------------------------------------
  const onLocationsChangeRef = useRef(onLocationsChange);
  useEffect(() => { onLocationsChangeRef.current = onLocationsChange; }, [onLocationsChange]);

  useEffect(() => {
    onLocationsChangeRef.current?.(locations);
  }, [locations]);

  // -----------------------------------------------------------------------
  // Derived data & Geofence Monitor
  // -----------------------------------------------------------------------
  const markers = useMemo(
    () => Array.from(locations.values()).filter(
      (m) => m && typeof m.latitude === "number" && typeof m.longitude === "number" &&
        !isNaN(m.latitude) && !isNaN(m.longitude)
    ),
    [locations],
  );

  const positions = useMemo<[number, number][]>(
    () => markers.map((m) => [m.latitude, m.longitude]),
    [markers],
  );

  const highlightedLoc = highlightUserId ? locations.get(highlightUserId) : undefined;

  const { alerts, zoneStatus, dismissAlert } = useGeofenceMonitor({
    userId: highlightUserId ?? "unknown",
    zones,
    latitude: highlightedLoc?.latitude ?? null,
    longitude: highlightedLoc?.longitude ?? null,
  });

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const computedHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${className}`}
      style={{ height: computedHeight }}
    >
      {/* Pulse animation keyframes — injected once */}
      <style>{`
        @keyframes lt-pulse {
          0%   { transform: scale(0.7); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-container {
          background: oklch(0.14 0.025 265) !important;
          font-family: var(--font-sans), system-ui, sans-serif !important;
        }
        .leaflet-popup-content-wrapper {
          background: oklch(0.18 0.03 265 / 0.95) !important;
          backdrop-filter: blur(16px) saturate(140%);
          border: 1px solid oklch(1 0 0 / 0.1) !important;
          border-radius: 1rem !important;
          color: oklch(0.97 0.01 240) !important;
          box-shadow: 0 12px 40px oklch(0 0 0 / 0.5) !important;
        }
        .leaflet-popup-content {
          margin: 12px 16px !important;
          font-size: 12px !important;
          line-height: 1.5 !important;
        }
        .leaflet-popup-tip {
          background: oklch(0.18 0.03 265 / 0.95) !important;
          border: 1px solid oklch(1 0 0 / 0.1) !important;
          border-top: none !important;
          border-left: none !important;
        }
        .leaflet-control-zoom a {
          background: oklch(0.18 0.03 265 / 0.85) !important;
          backdrop-filter: blur(12px);
          color: oklch(0.85 0.01 240) !important;
          border-color: oklch(1 0 0 / 0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: oklch(0.22 0.035 265 / 0.9) !important;
        }
        .leaflet-control-attribution {
          background: oklch(0.14 0.025 265 / 0.7) !important;
          color: oklch(0.5 0.02 250) !important;
          font-size: 9px !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-control-attribution a {
          color: oklch(0.65 0.12 200) !important;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
      >
        {/* Dark tiles — CartoDB dark_matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Auto-fit bounds on first data load */}
        <FitBounds positions={positions} />

        {/* Geofence zone circles */}
        {zones.map((zone) => {
          const isSafe = zoneStatus.get(zone.id) ?? true;
          const color = zone.color || (isSafe ? "oklch(0.6 0.15 150)" : "oklch(0.6 0.2 25)");
          return (
            <Circle
              key={zone.id}
              center={[zone.latitude, zone.longitude]}
              radius={zone.radiusMetres}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.15,
                weight: 2,
                dashArray: isSafe ? "5, 5" : undefined,
              }}
            />
          );
        })}

        {/* Realtime markers */}
        {markers.map((loc) => {
          const isHighlighted = loc.user_id === highlightUserId;
          const icon = isHighlighted ? highlightIcon.current! : defaultIcon.current!;
          return (
            <AnimatedMarker
              key={loc.user_id}
              position={[loc.latitude, loc.longitude]}
              icon={icon}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: isHighlighted ? "oklch(0.78 0.17 65)" : "oklch(0.82 0.16 200)",
                      boxShadow: `0 0 8px ${isHighlighted ? "oklch(0.78 0.17 65)" : "oklch(0.82 0.16 200)"}`,
                      flexShrink: 0,
                    }} />
                    <strong style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: "0.02em" }}>
                      {isHighlighted ? "📍 You" : loc.user_id.slice(0, 8) + "…"}
                    </strong>
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: "2px 10px",
                    fontSize: 11,
                    fontFamily: "var(--font-mono), monospace",
                  }}>
                    <span style={{ color: "oklch(0.55 0.02 250)" }}>LAT</span>
                    <span>{loc.latitude.toFixed(5)}°</span>
                    <span style={{ color: "oklch(0.55 0.02 250)" }}>LON</span>
                    <span>{loc.longitude.toFixed(5)}°</span>
                    <span style={{ color: "oklch(0.55 0.02 250)" }}>UPD</span>
                    <span>{new Date(loc.updated_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </Popup>
            </AnimatedMarker>
          );
        })}
      </MapContainer>

      {/* Empty state overlay — shown when connected but no users yet */}
      {connectionStatus === "connected" && markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
          <div className="glass rounded-2xl px-6 py-4 text-center space-y-2">
            <Users className="size-8 mx-auto text-muted-foreground opacity-60" />
            <p className="text-sm font-medium text-muted-foreground">No users tracked yet</p>
            <p className="text-xs text-muted-foreground/70">Allow location access on any device<br />sharing this URL to see them here.</p>
          </div>
        </div>
      )}

      {/* Connection status HUD — top left */}
      <div
        className="absolute top-4 left-4 z-[1000] glass rounded-2xl px-3 py-2 flex items-center gap-2"
        style={{ pointerEvents: "none" }}
      >
        <span className="relative flex" style={{ width: 8, height: 8 }}>
          {connectionStatus === "connected" && (
            <>
              <span className="absolute inset-0 rounded-full bg-success pulse-ring opacity-70" />
              <span className="relative rounded-full bg-success" style={{ width: 8, height: 8 }} />
            </>
          )}
          {connectionStatus === "connecting" && (
            <span className="rounded-full" style={{ width: 8, height: 8, background: "var(--warning)" }} />
          )}
          {connectionStatus === "error" && (
            <span className="rounded-full" style={{ width: 8, height: 8, background: "var(--danger)" }} />
          )}
        </span>
        <span className="text-xs font-mono">
          {connectionStatus === "connected" && `LIVE · ${markers.length} TRACKED`}
          {connectionStatus === "connecting" && "CONNECTING…"}
          {connectionStatus === "error" && "CONNECTION ERROR"}
        </span>
      </div>

      {/* Alerts HUD — top right */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 max-w-sm" style={{ pointerEvents: "none" }}>
        {alerts.filter(a => !a.dismissed).map(alert => (
          <div
            key={alert.id}
            className="glass border border-danger/30 bg-danger/10 p-3 rounded-xl shadow-lg flex items-start gap-3 backdrop-blur-md"
            style={{ pointerEvents: "auto" }}
          >
            <AlertTriangle className="size-5 shrink-0" style={{ color: "var(--danger)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Zone Breach: {alert.breach.zoneName}</p>
              <p className="text-xs opacity-90 truncate">
                User {alert.breach.userId.slice(0, 8)} is {Math.round(alert.breach.overshootMetres)}m outside.
              </p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="shrink-0 p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="size-4 opacity-70" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
