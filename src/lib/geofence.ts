/**
 * Geofence — types and pure detection logic using geolib.
 *
 * This module has ZERO React / Supabase dependencies so it can be used
 * in hooks, workers, or server-side code.
 */

import { getDistance } from "geolib";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A circular geofence zone. */
export interface GeofenceZone {
  /** Unique zone identifier. */
  id: string;
  /** Human-readable name (e.g. "Campus A"). */
  name: string;
  /** Center latitude (WGS-84 decimal degrees). */
  latitude: number;
  /** Center longitude (WGS-84 decimal degrees). */
  longitude: number;
  /** Radius in metres. */
  radiusMetres: number;
  /** Display colour — any CSS colour value. */
  color?: string;
}

/** Result of checking a single point against a single zone. */
export interface GeofenceCheckResult {
  zone: GeofenceZone;
  /** Distance in metres from the zone centre. */
  distanceMetres: number;
  /** True when the user is inside the zone boundary. */
  inside: boolean;
}

/** A breach event — emitted when a user crosses outside a zone. */
export interface GeofenceBreach {
  zoneId: string;
  zoneName: string;
  userId: string;
  latitude: number;
  longitude: number;
  distanceMetres: number;
  radiusMetres: number;
  /** How far outside the boundary, in metres. 0 if inside. */
  overshootMetres: number;
  timestamp: string; // ISO-8601
}

/** Row shape that maps to the Supabase `alerts` table. */
export interface AlertRow {
  user_id: string;
  zone_id: string;
  zone_name: string;
  latitude: number;
  longitude: number;
  distance_metres: number;
  radius_metres: number;
  overshoot_metres: number;
  alert_type: "geofence_breach";
  created_at: string;
}

// ---------------------------------------------------------------------------
// Detection functions
// ---------------------------------------------------------------------------

/**
 * Check whether a point (lat, lon) is inside a single circular zone.
 */
export function checkZone(
  lat: number,
  lon: number,
  zone: GeofenceZone,
): GeofenceCheckResult {
  const distanceMetres = getDistance(
    { latitude: lat, longitude: lon },
    { latitude: zone.latitude, longitude: zone.longitude },
    1, // 1-metre accuracy
  );

  return {
    zone,
    distanceMetres,
    inside: distanceMetres <= zone.radiusMetres,
  };
}

/**
 * Check a point against **all** zones and return only the breaches
 * (zones where the user is **outside** the boundary).
 */
export function detectBreaches(
  userId: string,
  lat: number,
  lon: number,
  zones: GeofenceZone[],
): GeofenceBreach[] {
  const now = new Date().toISOString();
  const breaches: GeofenceBreach[] = [];

  for (const zone of zones) {
    const result = checkZone(lat, lon, zone);
    if (!result.inside) {
      breaches.push({
        zoneId: zone.id,
        zoneName: zone.name,
        userId,
        latitude: lat,
        longitude: lon,
        distanceMetres: result.distanceMetres,
        radiusMetres: zone.radiusMetres,
        overshootMetres: result.distanceMetres - zone.radiusMetres,
        timestamp: now,
      });
    }
  }

  return breaches;
}

/**
 * Convert a GeofenceBreach into an AlertRow ready for Supabase insert.
 */
export function breachToAlertRow(breach: GeofenceBreach): AlertRow {
  return {
    user_id: breach.userId,
    zone_id: breach.zoneId,
    zone_name: breach.zoneName,
    latitude: breach.latitude,
    longitude: breach.longitude,
    distance_metres: breach.distanceMetres,
    radius_metres: breach.radiusMetres,
    overshoot_metres: breach.overshootMetres,
    alert_type: "geofence_breach",
    created_at: breach.timestamp,
  };
}
