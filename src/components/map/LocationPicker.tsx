"use client";

import { useEffect, useRef, useState } from "react";

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

export default function LocationPicker({
  value,
  polygon,
  onChange,
  center,
}: {
  value: { lat: number; lng: number } | null;
  polygon?: { lat: number; lng: number }[] | null;
  onChange: (lat: number | null, lng: number | null, poly: { lat: number; lng: number }[] | null) => void;
  center?: { lat: number; lng: number };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;

    const initialCenter = center ?? { lat: 41.311081, lng: 69.240562 }; // Tashkent default
    const map = new window.google.maps.Map(containerRef.current, {
      center: initialCenter,
      zoom: center ? 12 : 6,
      mapTypeId: "roadmap",
      streetViewControl: false,
      mapTypeControl: false,
    });
    mapRef.current = map;

    // Search Autocomplete
    if (inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "uz" },
        fields: ["geometry", "name"],
      });
      autocomplete.bindTo("bounds", map);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;
        map.setCenter(place.geometry.location);
        map.setZoom(14);
      });
    }

    // Drawing Manager
    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          window.google.maps.drawing.OverlayType.MARKER,
          window.google.maps.drawing.OverlayType.POLYGON,
        ],
      },
      polygonOptions: {
        fillColor: "#1e3a8a",
        fillOpacity: 0.4,
        strokeWeight: 2,
        clickable: false,
        editable: true,
        zIndex: 1,
      },
    });
    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    window.google.maps.event.addListener(drawingManager, "overlaycomplete", (event: any) => {
      // Faqat bitta marker yoki poligon bo'lishiga ruxsat beramiz
      if (markerRef.current) markerRef.current.setMap(null);
      if (polygonRef.current) polygonRef.current.setMap(null);

      if (event.type === window.google.maps.drawing.OverlayType.MARKER) {
        markerRef.current = event.overlay;
        const pos = event.overlay.getPosition();
        onChange(pos.lat(), pos.lng(), null);
      } else if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
        polygonRef.current = event.overlay;
        const path = event.overlay.getPath();
        const coords = [];
        for (let i = 0; i < path.getLength(); i++) {
          const pt = path.getAt(i);
          coords.push({ lat: pt.lat(), lng: pt.lng() });
        }
        onChange(null, null, coords);
        
        // Poligon tahrirlanganda update qilish
        window.google.maps.event.addListener(path, "set_at", () => updatePolygonCoords(path));
        window.google.maps.event.addListener(path, "insert_at", () => updatePolygonCoords(path));
      }
      drawingManager.setDrawingMode(null);
    });

    function updatePolygonCoords(path: any) {
      const coords = [];
      for (let i = 0; i < path.getLength(); i++) {
        const pt = path.getAt(i);
        coords.push({ lat: pt.lat(), lng: pt.lng() });
      }
      onChange(null, null, coords);
    }

  }, [ready]);

  // Boshlang'ich qiymatlarni chizish
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (markerRef.current) markerRef.current.setMap(null);
    if (polygonRef.current) polygonRef.current.setMap(null);

    if (value && value.lat && value.lng) {
      markerRef.current = new window.google.maps.Marker({
        position: value,
        map: map,
      });
      map.setCenter(value);
    }

    if (polygon && polygon.length > 0) {
      polygonRef.current = new window.google.maps.Polygon({
        paths: polygon,
        strokeColor: "#1e3a8a",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#1e3a8a",
        fillOpacity: 0.4,
        map: map,
        editable: true,
      });
      
      const bounds = new window.google.maps.LatLngBounds();
      polygon.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds);

      const path = polygonRef.current.getPath();
      window.google.maps.event.addListener(path, "set_at", () => updateExistingPolygon(path));
      window.google.maps.event.addListener(path, "insert_at", () => updateExistingPolygon(path));
    }

    function updateExistingPolygon(path: any) {
      const coords = [];
      for (let i = 0; i < path.getLength(); i++) {
        const pt = path.getAt(i);
        coords.push({ lat: pt.lat(), lng: pt.lng() });
      }
      onChange(null, null, coords);
    }
  }, [value, polygon, ready]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="text"
        placeholder="O'zbekiston bo'ylab joy qidirish..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200">
        <div ref={containerRef} className="h-[350px] w-full" />
      </div>
      <p className="text-xs text-slate-500">
        Xarita ustidagi asboblar yordamida markazni belgilang (Marker) yoki hudud chegaralarini chizing (Polygon).
      </p>
    </div>
  );
}
