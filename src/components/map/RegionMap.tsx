"use client";

import { useEffect, useRef, useState } from "react";
import { REGION_GEO, regionColor } from "@/lib/geo";
import type { Region } from "@/lib/types";

export interface DistrictMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  count: number;
  polygon?: {lat: number; lng: number}[] | null;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao";

function loadGoogleMapsScript(callback: () => void) {
  if (typeof window === "undefined") return;
  if ((window as any).google?.maps) {
    callback();
    return;
  }
  const existingScript = document.getElementById("google-maps-script");
  if (existingScript) {
    existingScript.addEventListener("load", callback);
    return;
  }
  const script = document.createElement("script");
  script.id = "google-maps-script";
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,drawing`;
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.head.appendChild(script);
}

// Chiroyli Custom Map Style (Silver / Light)
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

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
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const districtPolysRef = useRef<google.maps.Polygon[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;

    const map = new window.google.maps.Map(containerRef.current, {
      center: { lat: 41.3, lng: 64.5 }, // Uzbekistan center
      zoom: 6,
      styles: MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
    });
    mapRef.current = map;
  }, [ready]);

  // Region poligonlarini chizish
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    polygonsRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current = [];

    const max = Math.max(1, ...regions.map((r) => counts[r.id] ?? 0));

    regions.forEach((r) => {
      const geo = REGION_GEO[r.code];
      if (!geo) return;
      
      const count = counts[r.id] ?? 0;
      const active = selected === r.id;

      // Leaflet (lat, lng) to Google Maps {lat, lng} if needed. REGION_GEO points are [lat, lng] arrays.
      const paths = geo.points.map((p: any) => ({ lat: p[0], lng: p[1] }));

      const poly = new window.google.maps.Polygon({
        paths,
        strokeColor: active ? "#1e3a8a" : "#ffffff",
        strokeOpacity: active ? 1.0 : 0.8,
        strokeWeight: active ? 3 : 1.5,
        fillColor: regionColor(count, max),
        fillOpacity: active ? 0.85 : 0.6,
        map,
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 4px; font-family: sans-serif; font-weight: bold; color: #1e3a8a;">${r.name}: ${count} bemor</div>`,
      });

      poly.addListener("mouseover", (e: any) => {
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
        poly.setOptions({ fillOpacity: 0.9, strokeColor: "#1e3a8a" });
      });

      poly.addListener("mouseout", () => {
        infoWindow.close();
        poly.setOptions({ 
          fillOpacity: active ? 0.85 : 0.6, 
          strokeColor: active ? "#1e3a8a" : "#ffffff" 
        });
      });

      poly.addListener("click", () => {
        onSelect(active ? null : r.id);
      });

      polygonsRef.current.push(poly);
    });
  }, [regions, counts, selected, ready]);

  // Tuman/punkt markerlari va ularning chizilgan hududlari (polygons)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    districtPolysRef.current.forEach((p) => p.setMap(null));
    districtPolysRef.current = [];

    districtMarkers.forEach((d) => {
      if (d.polygon && d.polygon.length > 0) {
        // Tuman chizilgan chegarasi
        const poly = new window.google.maps.Polygon({
          paths: d.polygon,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.3,
          map,
        });
        
        const info = new window.google.maps.InfoWindow({
          content: `<div style="font-family: sans-serif; font-weight: bold;">${d.name}: ${d.count}</div>`,
        });

        poly.addListener("mouseover", (e: any) => {
          poly.setOptions({ fillOpacity: 0.5 });
          info.setPosition(e.latLng);
          info.open(map);
        });
        poly.addListener("mouseout", () => {
          poly.setOptions({ fillOpacity: 0.3 });
          info.close();
        });
        if (onSelectDistrict) {
          poly.addListener("click", () => onSelectDistrict(d.id));
        }
        districtPolysRef.current.push(poly);
      } else {
        // Shunchaki nuqta (marker) bo'lsa
        // HTML marker yasash uchun Google Maps'da AdvancedMarker yoki oddiy Icon ishlatiladi.
        // SVG Icon ishlatamiz raqam bilan
        const marker = new window.google.maps.Marker({
          position: { lat: d.lat, lng: d.lng },
          map,
          label: {
            text: d.count.toString(),
            color: "white",
            fontSize: "12px",
            fontWeight: "bold",
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: d.count > 0 ? "#1e3a8a" : "#94a3b8",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
            scale: 13, // 26px diameter
          },
          title: d.name,
        });

        if (onSelectDistrict) {
          marker.addListener("click", () => onSelectDistrict(d.id));
        }

        markersRef.current.push(marker);
      }
    });

  }, [districtMarkers, ready]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
      <div ref={containerRef} className="h-[380px] w-full sm:h-[460px]" />
      {districtMarkers.length > 0 && (
        <div className="absolute bottom-2 left-2 z-10 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs text-slate-500 shadow-sm backdrop-blur">
          ● / ⬡ — Punkt (Marker yoki Chizilgan hudud), raqam = bemorlar soni
        </div>
      )}
    </div>
  );
}
