"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Facility } from "@/lib/types";

const UZ_BOUNDS = L.latLngBounds([36.75, 55.1], [46.3, 74.5]);

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[char] ?? char));
}

export default function ClinicMap({
  clinics,
  selectedId,
  onSelect,
  height = 460,
}: {
  clinics: Facility[];
  selectedId?: string | null;
  onSelect?: (clinicId: string) => void;
  height?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const hasFitRef = useRef(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!rootRef.current || mapRef.current) return;
    const map = L.map(rootRef.current, {
      center: [41.45, 63.1],
      zoom: 6,
      minZoom: 5,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
      maxBounds: UZ_BOUNDS,
      maxBoundsViscosity: 0.9,
      worldCopyJump: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      noWrap: true,
      crossOrigin: true,
      attribution: "",
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layersRef.current) {
      layersRef.current.clearLayers();
      map.removeLayer(layersRef.current);
    }

    const group = L.layerGroup();
    const bounds: L.LatLngExpression[] = [];
    const located = clinics.filter((clinic) => clinic.lat != null && clinic.lng != null && Number.isFinite(Number(clinic.lat)) && Number.isFinite(Number(clinic.lng)));

    located.forEach((clinic) => {
      const lat = Number(clinic.lat);
      const lng = Number(clinic.lng);
      const active = clinic.is_active && ["active", "trial"].includes(clinic.subscription_status ?? "inactive");
      const selected = selectedId === clinic.id;
      const radiusMeters = Math.max(0.6, Number(clinic.radius_km ?? 3)) * 1000;
      const color = active ? "#155EEF" : "#98A2B3";

      L.circle([lat, lng], {
        radius: radiusMeters,
        color,
        weight: selected ? 2 : 1,
        fillColor: color,
        fillOpacity: selected ? 0.16 : 0.08,
        dashArray: active ? undefined : "5 7",
        interactive: false,
      }).addTo(group);

      const icon = L.divIcon({
        className: "",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        html: `<div class="clinic-pin${active ? "" : " clinic-pin--inactive"}">${active ? "✚" : "–"}</div>`,
      });
      const marker = L.marker([lat, lng], { icon, riseOnHover: true, keyboard: true });
      const statusLabel = active ? (clinic.subscription_status === "trial" ? "Sinov obunasi" : "Obuna faol") : "Obuna faol emas";
      marker.bindPopup(
        `<div style="min-width:190px;padding:2px 0;font-family:Inter,Arial,sans-serif">
          <div style="font-weight:800;color:#101828;margin-bottom:4px">${escapeHtml(clinic.name)}</div>
          <div style="font-size:12px;color:#475467;margin-bottom:8px">${escapeHtml(clinic.address || "Manzil kiritilmagan")}</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:${active ? "#027A48" : "#667085"}">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${active ? "#12B76A" : "#98A2B3"}"></span>${statusLabel}
          </div>
        </div>`,
        { closeButton: false, offset: [0, -8], maxWidth: 260 }
      );
      marker.on("click", () => onSelectRef.current?.(clinic.id));
      marker.addTo(group);
      bounds.push([lat, lng]);
    });

    group.addTo(map);
    layersRef.current = group;

    if (!hasFitRef.current && bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [42, 42], maxZoom: 8 });
      hasFitRef.current = true;
    } else if (!hasFitRef.current && bounds.length === 1) {
      map.setView(bounds[0], 10);
      hasFitRef.current = true;
    }
  }, [clinics, selectedId]);

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, height }}>
      <div ref={rootRef} style={{ height: "100%", width: "100%", background: "#ECF3FF" }} />
      <div
        style={{
          position: "absolute", left: 14, bottom: 14, zIndex: 500, display: "flex", alignItems: "center", gap: 10,
          borderRadius: 10, background: "rgba(255,255,255,.94)", padding: "9px 12px", boxShadow: "0 4px 12px rgba(16,24,40,.10)",
          color: "#475467", fontSize: 12, fontWeight: 650, backdropFilter: "blur(8px)",
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 99, background: "#155EEF", boxShadow: "0 0 0 4px rgba(21,94,239,.14)" }} />
        Faol klinika radiusi
        <span style={{ width: 9, height: 9, borderRadius: 99, background: "#98A2B3", marginLeft: 4 }} />
        Faol emas
      </div>
    </div>
  );
}
