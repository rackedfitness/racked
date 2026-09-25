"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type GymMapPin = {
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  avgRating: number;
  reviewCount: number;
};

const FALLBACK_CENTER = { lat: 51.5074, lng: -0.1278 }; // London — only used when there's nothing else to center on

// Custom divIcon pins instead of Leaflet's default marker image, which
// needs its own webpack/asset-path workaround in Next.js — a styled div
// sidesteps that entirely and lets the pin show the rating at a glance.
function makePin(label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:inline-flex;align-items:center;gap:3px;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:11px;border-radius:9999px;padding:4px 8px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5);transform:translate(-50%,-100%);">${label}</div>`,
  });
}

export default function GymMap({
  pins,
  center,
  zoom = 12,
  onSelectPin,
}: {
  pins: GymMapPin[];
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  onSelectPin?: (placeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initialize once. Later updates to pins/center are handled by the
  // effects below rather than tearing the map down and rebuilding it.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initial = center ?? (pins[0] ? { lat: pins[0].lat, lng: pins[0].lng } : FALLBACK_CENTER);
    const map = L.map(containerRef.current).setView([initial.lat, initial.lng], zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapRef.current && center) {
      mapRef.current.setView([center.lat, center.lng], zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = pins.map((pin) => {
      const marker = L.marker([pin.lat, pin.lng], { icon: makePin(`★ ${pin.avgRating.toFixed(1)} (${pin.reviewCount})`) }).addTo(map);
      if (onSelectPin) marker.on("click", () => onSelectPin(pin.placeId));
      return marker;
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [pins, onSelectPin]);

  return <div ref={containerRef} className="h-full w-full" />;
}
