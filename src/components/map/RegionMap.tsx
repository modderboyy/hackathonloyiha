"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_GEO, regionColor } from "@/lib/geo";
import type { Region } from "@/lib/types";

export interface DistrictMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  polygon?: { lat: number; lng: number }[] | null;
}

// O'zbekistonning tashqi chegarasi (taxminiy, barcha regionlar birlashmasi)
const UZ_BOUNDS = [
  [45.4, 55.8], [44.0, 62.2], [41.0, 66.2], [37.2, 69.5], [41.2, 73.1], [41.2, 73.1],
] as [number, number][];

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
  const regionLayerRef = useRef<L.LayerGroup | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onSelectDistrictRef = useRef(onSelectDistrict);
  onSelectDistrictRef.current = onSelectDistrict;

  // Xaritani init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [41.5, 63.5],
      zoom: 6,
      minZoom: 5,
      maxZoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      // Faqat O'zbekiston bilan chegaralash
      maxBounds: L.latLngBounds([36.0, 55.0], [46.0, 74.0]),
      maxBoundsViscosity: 0.8,
    });

    // OpenStreetMap qatlami
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      regionLayerRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  // Region poligonlari (borderlar + ranglar)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (regionLayerRef.current) {
      regionLayerRef.current.clearLayers();
      map.removeLayer(regionLayerRef.current);
    }

    const max = Math.max(1, ...regions.map((r) => counts[r.id] ?? 0));
    const group = L.layerGroup();

    // O'zbekiston tashqi chegarasi (chiziq)
    const outerRing = L.polygon(UZ_BOUNDS, {
      color: "#1e3a8a",
      weight: 3,
      fill: false,
      dashArray: "6 4",
      opacity: 0.6,
    });
    outerRing.addTo(group);

    regions.forEach((r) => {
      const geo = REGION_GEO[r.code];
      if (!geo) return;
      const count = counts[r.id] ?? 0;
      const active = selected === r.id;

      // Region polygon
      const poly = L.polygon(geo.points, {
        color: active ? "#172554" : "#ffffff",
        weight: active ? 2.5 : 1.5,
        fillColor: regionColor(count, max),
        fillOpacity: active ? 0.9 : 0.72,
        opacity: active ? 1 : 0.85,
      });

      poly.bindTooltip(
        `<div style="font-weight:600">${r.name}</div><div style="font-size:12px">${count} bemor</div>`,
        { sticky: true, direction: "top" }
      );
      poly.on("click", () => onSelectRef.current(active ? null : r.id));
      poly.on("mouseover", () => {
        poly.setStyle({ fillOpacity: 0.85, weight: 2 });
        poly.bringToFront();
      });
      poly.on("mouseout", () => {
        poly.setStyle({ fillOpacity: active ? 0.9 : 0.72, weight: active ? 2.5 : 1.5 });
      });
      poly.addTo(group);
    });

    group.addTo(map);
    regionLayerRef.current = group;
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
    districtMarkers.forEach((d) => {
      const hasCount = d.count > 0;
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          display:flex;align-items:center;justify-content:center;
          width:26px;height:26px;border-radius:50%;
          background:${hasCount ? "#1e3a8a" : "#94a3b8"};
          color:#fff;font-weight:700;font-size:12px;
          border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);
          cursor:pointer;
        ">${d.count}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const marker = L.marker([d.lat, d.lng], { icon, interactive: true });
      marker.bindTooltip(d.name, { sticky: true, direction: "top" });
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
      <div ref={containerRef} className="h-[400px] w-full sm:h-[480px]" />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-col gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#dbeafe" }} /> kam
          <span className="ml-1 h-2.5 w-6 rounded-full" style={{ background: "linear-gradient(90deg,#93c5fd,#1e3a8a)" }} />
          <span className="ml-1 font-medium text-slate-700">ko'p</span>
        </span>
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-white bg-primary-800 shadow" /> punkt (bemorlar soni)
        </span>
      </div>
    </div>
  );
}
