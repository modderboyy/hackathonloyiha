"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_GEO, regionColor } from "@/lib/geo";
import type { Region } from "@/lib/types";

export default function RegionMap({
  regions,
  counts,
  selected,
  onSelect,
}: {
  regions: Region[];
  counts: Record<string, number>;
  selected: string | null;
  onSelect: (regionId: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Xaritani bir marta init qilish
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [41.3, 64.5],
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Poligonlar va raqamlarni yangilash
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layerRef.current) {
      layerRef.current.clearLayers();
      map.removeLayer(layerRef.current);
    }

    const max = Math.max(1, ...regions.map((r) => counts[r.id] ?? 0));
    const group = L.layerGroup();

    regions.forEach((r) => {
      const geo = REGION_GEO[r.code];
      if (!geo) return;
      const count = counts[r.id] ?? 0;
      const active = selected === r.id;

      const poly = L.polygon(geo.points, {
        color: active ? "#1e3a8a" : "#ffffff",
        weight: active ? 3 : 1.5,
        fillColor: regionColor(count, max),
        fillOpacity: active ? 0.85 : 0.65,
      });
      poly.bindTooltip(`${r.name}: ${count}`, { sticky: true });
      poly.on("click", () => onSelectRef.current(active ? null : r.id));
      poly.addTo(group);

      // Raqam markeri (divIcon)
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          display:flex;align-items:center;justify-content:center;
          width:30px;height:30px;border-radius:50%;
          background:${active ? "#172554" : "#1e3a8a"};
          color:#fff;font-weight:700;font-size:13px;
          border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);
          cursor:pointer;
        ">${count}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      const marker = L.marker(geo.center, { icon, interactive: true });
      marker.on("click", () => onSelectRef.current(active ? null : r.id));
      marker.addTo(group);
    });

    group.addTo(map);
    layerRef.current = group;
  }, [regions, counts, selected]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
      <div ref={containerRef} className="h-[380px] w-full sm:h-[460px]" />
    </div>
  );
}
