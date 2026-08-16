"use client";

import { useId } from "react";

// Inline SVG grafiklar — MUI bilan birga ishlatiladi, tashqi bog'liqliksiz

export function BarChart({
  data,
  height = 220,
  color = "#1e3a8a",
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.round((d.value / max) * (height - 40));
          return (
            <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-semibold text-slate-700 opacity-0 transition group-hover:opacity-100">
                {d.value}
              </span>
              <div
                className="w-full max-w-[52px] rounded-t-md transition-all duration-500"
                style={{
                  height: Math.max(4, h),
                  background: `linear-gradient(180deg, #3b82f6, ${color})`,
                  opacity: 0.85 + (d.value / max) * 0.15,
                }}
                title={`${d.label}: ${d.value}`}
              />
              <span className="mt-1 truncate text-[10px] text-slate-500 sm:text-[11px]">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AreaChart({
  data,
  labels,
  height = 220,
}: {
  data: number[];
  labels: string[];
  height?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const gradId = `areaGrad-${uid}`;

  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const range = max - min || 1;
  const W = 600;
  const H = 200;
  const pad = 12;
  const stepX = data.length > 1 ? (W - pad * 2) / (data.length - 1) : 0;

  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y] as const;
  });

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${H - pad} L${pts[0][0]},${H - pad} Z`;

  const allZero = data.every((v) => v === 0);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={pad}
            x2={W - pad}
            y1={H * f}
            y2={H * f}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#fff" stroke="#1e3a8a" strokeWidth="2">
            <title>{`${labels[i]}: ${data[i]}`}</title>
          </circle>
        ))}
        {allZero && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fill="#94a3b8" fontSize="14">
            Hozircha ma'lumot yo'q
          </text>
        )}
      </svg>
      <div className="mt-1 flex justify-between px-1">
        {labels.map((l, i) => (
          <span key={i} className="text-[10px] text-slate-400 sm:text-[11px]">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  size = 160,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const r = 52;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * C;
          const el = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            >
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
          offset += dash;
          return el;
        })}
        <text x="70" y="66" textAnchor="middle" fill="#0f172a" style={{ fontSize: 22, fontWeight: 700 }}>
          {centerValue ?? total}
        </text>
        <text x="70" y="84" textAnchor="middle" fill="#94a3b8" style={{ fontSize: 10 }}>
          {centerLabel ?? "Jami"}
        </text>
      </svg>
      <ul className="space-y-2">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="ml-auto font-semibold text-slate-900">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
