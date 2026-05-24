import { useEffect, useState, useRef } from "react";

export type GeoState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "active"; lat: number; lon: number; accuracy: number; heading: number | null }
  | { status: "error"; message: string };

export function useGeolocation(enabled: boolean) {
  const [state, setState] = useState<GeoState>({ status: "idle" });
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      setState({ status: "idle" });
      return;
    }

    if (!navigator.geolocation) {
      setState({ status: "error", message: "Geolocation is not supported by your browser." });
      return;
    }

    setState({ status: "requesting" });

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          status: "active",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location permission denied. Please allow access in your browser.",
          2: "Location unavailable. Check your device GPS.",
          3: "Location request timed out.",
        };
        setState({ status: "error", message: messages[err.code] ?? "Unknown location error." });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [enabled]);

  return state;
}
