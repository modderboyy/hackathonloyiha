"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function LocationPicker({
  value,
  onChange,
  center,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  center?: { lat: number; lng: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [center?.lat ?? 41.3, center?.lng ?? 64.5],
      zoom: center ? 10 : 6,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Markerni yangilash
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (value) {
      markerRef.current = L.marker([value.lat, value.lng]).addTo(map);
      map.flyTo([value.lat, value.lng], 12);
    }
  }, [value, ready]);

  // Markazni yangilash (tuman tanlanganda)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.setView([center.lat, center.lng], 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.lat, center?.lng]);

  return (
    <div>
      <div ref={containerRef} className="h-[260px] w-full overflow-hidden rounded-xl border border-slate-200" />
      <p className="mt-1.5 text-xs text-slate-400">
        Joyni belgilash uchun xaritani bosing.
        {value ? ` Tanlangan: ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : ""}
      </p>
    </div>
  );
}
