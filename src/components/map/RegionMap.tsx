"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_GEO, regionColor } from "@/lib/geo";
import type { District, Region } from "@/lib/types";

export interface DistrictMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
}

export default function RegionMap({
  regions,
  counts,
  selected,
  onSelect,
  districtMarkers = [],
  onSelectDistrict,
}: {
  regions: Region[];
  counts: Record<string, number>;
  selected: string | null;
  onSelect: (regionId: string | null) => void;
  districtMarkers?: DistrictMarker[];
  onSelectDistrict?: (districtId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onSelectDistrictRef = useRef(onSelectDistrict);
  onSelectDistrictRef.current = onSelectDistrict;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [41.3, 64.5],
      zoom: 6,
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
      markerLayerRef.current = null;
    };
  }, []);

  // Region poligonlari (borderlar)
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
        fillOpacity: active ? 0.85 : 0.6,
      });
      poly.bindTooltip(`${r.name}: ${count}`, { sticky: true });
      poly.on("click", () => onSelectRef.current(active ? null : r.id));
      poly.addTo(group);
    });
    group.addTo(map);
    layerRef.current = group;
  }, [regions, counts, selected]);

  // Tuman/punkt markerlari (raqamlar bilan)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (markerLayerRef.current) {
      markerLayerRef.current.clearLayers();
      map.removeLayer(markerLayerRef.current);
    }
    const group = L.layerGroup();
    districtMarkers.forEach((d, i) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          display:flex;align-items:center;justify-content:center;
          width:26px;height:26px;border-radius:50%;
          background:${d.count > 0 ? "#1e3a8a" : "#94a3b8"};
          color:#fff;font-weight:700;font-size:12px;
          border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);
          cursor:pointer;
        ">${d.count}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([d.lat, d.lng], { icon, interactive: true });
      marker.bindTooltip(d.name, { sticky: true });
      if (onSelectDistrictRef.current) {
        marker.on("click", () => onSelectDistrictRef.current?.(d.id));
      }
      marker.addTo(group);
    });
    group.addTo(map);
    markerLayerRef.current = group;
  }, [districtMarkers]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
      <div ref={containerRef} className="h-[380px] w-full sm:h-[460px]" />
      {districtMarkers.length > 0 && (
        <div className="absolute bottom-2 left-2 z-[400] rounded-lg bg-white/90 px-2.5 py-1.5 text-xs text-slate-500 shadow-sm backdrop-blur">
          ● — punkt (raqam = bemorlar soni)
        </div>
      )}
    </div>
  );
}
