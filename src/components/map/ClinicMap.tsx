"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Facility } from "@/lib/types";

const UZ_BOUNDS = L.latLngBounds([36.7, 55.0], [46.4, 74.7]);

function createClinicPin(active: boolean, selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="clinic-pin ${active ? "" : "clinic-pin--inactive"} ${selected ? "clinic-pin--selected" : ""}"><span>${active ? "•" : ""}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -24],
    tooltipAnchor: [0, -18],
  });
}

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
  selectedLocation,
  onLocationSelect,
  selectedRadiusKm,
  showRadius = true,
}: {
  clinics: Facility[];
  selectedId?: string | null;
  onSelect?: (clinicId: string) => void;
  height?: number;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedRadiusKm?: number | null;
  showRadius?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const onLocationSelectRef = useRef(onLocationSelect);
  const hasFitRef = useRef(false);
  const selectionMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (!rootRef.current || mapRef.current) return;

    try {
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

      if (onLocationSelect) {
        map.on("click", (event: L.LeafletMouseEvent) => {
          const { lat, lng } = event.latlng;
          const clamped = {
            lat: Math.min(Math.max(lat, UZ_BOUNDS.getSouthWest().lat), UZ_BOUNDS.getNorthEast().lat),
            lng: Math.min(Math.max(lng, UZ_BOUNDS.getSouthWest().lng), UZ_BOUNDS.getNorthEast().lng),
          };
          onLocationSelectRef.current?.(clamped.lat, clamped.lng);
        });
      }

      mapRef.current = map;
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // Ignore errors during cleanup
        }
        mapRef.current = null;
      }
      layersRef.current = null;
      selectionMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      if (layersRef.current) {
        layersRef.current.clearLayers();
        map.removeLayer(layersRef.current);
        layersRef.current = null;
      }

      if (selectionMarkerRef.current) {
        try {
          map.removeLayer(selectionMarkerRef.current);
        } catch (e) {
          // Marker might already be removed
        }
        selectionMarkerRef.current = null;
      }
    } catch (error) {
      console.error("Error clearing layers:", error);
    }

    const group = L.layerGroup();
    const bounds: L.LatLngExpression[] = [];
    const located = clinics.filter((clinic) => clinic.lat != null && clinic.lng != null && Number.isFinite(Number(clinic.lat)) && Number.isFinite(Number(clinic.lng)));

    located.forEach((clinic) => {
      try {
        const lat = Number(clinic.lat);
        const lng = Number(clinic.lng);
        const active = Boolean(clinic.is_active && ["active", "trial"].includes(clinic.subscription_status ?? "inactive"));
        const selected = Boolean(selectedId === clinic.id);

        if (showRadius) {
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
        }

        const shortName = clinic.name.trim().replace(/\s+/g, " ");
        const label = shortName.length > 16 ? `${shortName.slice(0, 15)}…` : shortName;
        const marker = L.marker([lat, lng], {
          title: clinic.name,
          riseOnHover: true,
          keyboard: true,
          icon: createClinicPin(active, selected),
        });
        marker.bindTooltip(label, { permanent: true, direction: "top", offset: [0, -12], className: "clinic-map-tooltip" });
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
      } catch (error) {
        console.error("Error adding clinic marker:", error);
      }
    });

    if (selectedLocation && onLocationSelectRef.current) {
      try {
        const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
          draggable: true,
          title: "Klinika joylashuvi",
          icon: createClinicPin(true, true),
        });
        marker.on("dragend", (event) => {
          const point = event.target.getLatLng();
          onLocationSelectRef.current?.(point.lat, point.lng);
        });
        marker.addTo(group);
        selectionMarkerRef.current = marker;
      } catch (error) {
        console.error("Error adding selection marker:", error);
      }
    }

    try {
      group.addTo(map);
      layersRef.current = group;

      if (!hasFitRef.current && bounds.length > 1) {
        map.fitBounds(L.latLngBounds(bounds), { padding: [42, 42], maxZoom: 8 });
        hasFitRef.current = true;
      } else if (!hasFitRef.current && bounds.length === 1) {
        map.setView(bounds[0], 10);
        hasFitRef.current = true;
      } else if (selectedLocation && onLocationSelectRef.current) {
        map.setView([selectedLocation.lat, selectedLocation.lng], 10);
      }
    } catch (error) {
      console.error("Error finalizing map layers:", error);
    }
  }, [clinics, selectedId, selectedLocation, showRadius]);

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, height }}>
      <div ref={rootRef} style={{ height: "100%", width: "100%", background: "#ECF3FF", cursor: onLocationSelect ? "crosshair" : "grab" }} />
      {onLocationSelect && (
        <div style={{
          position: "absolute", top: 14, left: 14, zIndex: 501, background: "rgba(15, 110, 92, 0.9)", color: "white", padding: "8px 12px",
          borderRadius: 6, fontSize: 12, fontWeight: 600, backdropFilter: "blur(8px)", pointerEvents: "none"
        }}>
          ✓ Xaritani bosing — joyni belgilang
        </div>
      )}
      {showRadius && (
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
      )}
    </div>
  );
}
