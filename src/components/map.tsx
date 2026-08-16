"use client";

import { useState } from "react";
import type { Region } from "@/lib/types";

// Stilizatsiyalangan O'zbekiston xaritasi — hududlar, raqamlar va tanlash
export function UzMap({
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
  const [hovered, setHovered] = useState<string | null>(null);
  const max = Math.max(1, ...regions.map((r) => counts[r.id] ?? 0));

  function color(regionId: string) {
    const v = counts[regionId] ?? 0;
    if (v === 0) return "#e2e8f0";
    const t = v / max;
    // deep ko'k gradient
    const c = Math.round(190 - t * 140);
    return `rgb(${c}, ${Math.round(c + 30)}, 250)`;
  }

  return (
    <div className="relative w-full">
      <svg viewBox="0 0 900 560" className="w-full" role="img" aria-label="O'zbekiston hududlari xaritasi">
        {regions.map((r) => {
          if (!r.points) return null;
          const active = selected === r.id;
          const hov = hovered === r.id;
          return (
            <g key={r.id}>
              <polygon
                points={r.points}
                fill={color(r.id)}
                stroke={active ? "#1e3a8a" : "#ffffff"}
                strokeWidth={active ? 2.5 : 1.5}
                className="cursor-pointer transition-all duration-200"
                style={{
                  opacity: active || hovered ? 1 : 0.92,
                  filter: hov ? "brightness(1.05)" : undefined,
                }}
                onMouseEnter={() => setHovered(r.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(active ? null : r.id)}
              />
              {/* raqam */}
              <g
                transform={`translate(${r.cx}, ${r.cy})`}
                className="cursor-pointer"
                onClick={() => onSelect(active ? null : r.id)}
              >
                <circle
                  r={active ? 17 : 14}
                  fill="#1e3a8a"
                  style={{ opacity: active ? 1 : 0.9 }}
                />
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#fff"
                  style={{ fontSize: 14, fontWeight: 700 }}
                >
                  {counts[r.id] ?? 0}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: "#e2e8f0" }} /> 0 bemor
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ background: "linear-gradient(90deg,#93c5fd,#1e3a8a)" }}
          />
          ko'p
        </span>
        <span className="ml-auto">Hududni tanlash uchun bosing — ro'yxat filtrlanadi</span>
      </div>
    </div>
  );
}
