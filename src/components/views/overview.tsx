"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useData } from "@/lib/data";
import { BarChart, DonutChart, AreaChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { formatDate, cn } from "@/lib/utils";

const RegionMap = dynamic(() => import("@/components/map/RegionMap"), {
  ssr: false,
  loading: () => <div className="h-[380px] w-full animate-pulse rounded-xl bg-slate-100 sm:h-[460px]" />,
});

const MONTH_NAMES = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

export function Overview({ onRegionSelect }: { onRegionSelect: (regionId: string) => void }) {
  const { regions, districts, patients, profiles, followUps, discharges, visits, hospitalizations, clientHealth } = useData();

  // ===== Sog'/kasal bemorlar =====
  const patientStats = useMemo(() => {
    const total = patients.length;
    const sick = patients.filter((p) => {
      const hasActiveHosp = hospitalizations.some((h) => h.patient_id === p.id && h.status === "active");
      const profileRow = profiles.find((pr) => pr.patient_id === p.id);
      const hasCondition = profileRow
        ? clientHealth.some((ch) => ch.client_id === profileRow.id && ch.current_condition)
        : false;
      return hasActiveHosp || hasCondition;
    }).length;
    return { total, sick, healthy: total - sick };
  }, [patients, profiles, hospitalizations, clientHealth]);

  // ===== Statsionar (hospitalizatsiya) =====
  const hospitalStats = useMemo(() => {
    const total = hospitalizations.length;
    let ongoing = hospitalizations.filter((h) => h.status === "active").length;
    const discharged = hospitalizations.filter((h) => h.status === "discharged");

    let success = 0;
    let failed = 0;
    discharged.forEach((h) => {
      const disc = discharges.find((d) => d.hospitalization_id === h.id);
      const fu = disc ? followUps.find((f) => f.discharge_id === disc.id) : null;
      if (!fu) {
        success++;
      } else if (fu.status === "completed") {
        success++;
      } else if (fu.status === "overdue") {
        failed++;
      } else {
        ongoing++; // kuzatuv hali davom etyabti
      }
    });

    return { total, ongoing, success, failed };
  }, [hospitalizations, followUps, discharges]);

  // ===== Kuzatuv (follow-up) =====
  const followUpStats = useMemo(() => {
    const counts = { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
    followUps.forEach((f) => {
      if (f.status in counts) counts[f.status as keyof typeof counts]++;
    });
    return counts;
  }, [followUps]);

  const regionCounts = useMemo(() => {
    const m: Record<string, number> = {};
    regions.forEach((r) => (m[r.id] = 0));
    patients.forEach((p) => {
      if (p.region_id && m[p.region_id] !== undefined) m[p.region_id]++;
    });
    return m;
  }, [regions, patients]);

  const districtMarkers = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach((p) => {
      if (p.district_id) counts[p.district_id] = (counts[p.district_id] ?? 0) + 1;
    });
    return districts
      .filter((d) => d.lat !== null && d.lng !== null)
      .map((d) => ({ id: d.id, name: d.name, lat: d.lat as number, lng: d.lng as number, count: counts[d.id] ?? 0, polygon: d.polygon }));
  }, [districts, patients]);

  const followUpDist = [
    { label: "Kutilmoqda", value: followUpStats.pending, color: "#f59e0b" },
    { label: "Jarayonda", value: followUpStats.in_progress, color: "#3b82f6" },
    { label: "Yakunlandi", value: followUpStats.completed, color: "#10b981" },
    { label: "Muddati o'tdi", value: followUpStats.overdue, color: "#ef4444" },
  ];

  const monthly = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_NAMES[d.getMonth()], value: 0 });
    }
    visits.forEach((v) => {
      const d = new Date(v.visit_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const b = buckets.find((x) => x.key === key);
      if (b) b.value++;
    });
    return buckets;
  }, [visits]);

  const recent = useMemo(() => {
    const ev = [
      ...visits.map((v) => ({ date: v.visit_date, title: "Klinik tashrif", pid: v.patient_id, icon: "clipboard" })),
      ...discharges.map((d) => ({ date: d.discharge_date, title: "Chiqarish", pid: d.patient_id, icon: "bed" })),
      ...followUps.map((f) => ({ date: f.due_date, title: "Follow-up", pid: f.patient_id, icon: "clock" })),
    ].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return ev.slice(0, 6);
  }, [visits, discharges, followUps]);

  const pname = (id: string) => patients.find((p) => p.id === id)?.full_name ?? "—";

  return (
    <div className="space-y-6">
      {/* ===== Sarlavha ===== */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bosh sahifa</h1>
        <p className="text-sm text-slate-500">Tizimning umumiy holati va statistikasi</p>
      </div>

      {/* ===== Asosiy KPI kartalar ===== */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Jami bemorlar */}
        <KpiCard
          title="Jami bemorlar"
          icon="users"
          value={patientStats.total}
          gradient="from-blue-600 to-indigo-700"
          segments={[
            { label: "Sog'", value: patientStats.healthy, color: "bg-emerald-400" },
            { label: "Kasal", value: patientStats.sick, color: "bg-rose-400" },
          ]}
        />

        {/* Statsionar */}
        <KpiCard
          title="Statsionar"
          icon="bed"
          value={hospitalStats.total}
          gradient="from-violet-600 to-purple-700"
          segments={[
            { label: "Davom etyabti", value: hospitalStats.ongoing, color: "bg-sky-400" },
            { label: "Muvaffaqiyatli", value: hospitalStats.success, color: "bg-emerald-400" },
            { label: "Muvaffaqiyatsiz", value: hospitalStats.failed, color: "bg-rose-400" },
          ]}
        />

        {/* Kuzatuv */}
        <KpiCard
          title="Kuzatuvlar"
          icon="clipboard"
          value={followUpStats.pending + followUpStats.in_progress + followUpStats.overdue}
          gradient="from-amber-500 to-orange-600"
          segments={[
            { label: "Kutilmoqda", value: followUpStats.pending, color: "bg-amber-400" },
            { label: "Jarayonda", value: followUpStats.in_progress, color: "bg-sky-400" },
            { label: "Yakunlangan", value: followUpStats.completed, color: "bg-emerald-400" },
            { label: "Muddati o'tdi", value: followUpStats.overdue, color: "bg-rose-400" },
          ]}
        />
      </div>

      {/* ===== Xarita ===== */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Hududlar bo'yicha bemorlar</h2>
            <p className="text-sm text-slate-500">Hududni bosing — bemorlar ro'yxati filtrlanadi</p>
          </div>
          <Icon name="map" size={22} className="text-primary-700" />
        </div>
        <RegionMap regions={regions} counts={regionCounts} selected={null} districtMarkers={districtMarkers} onSelect={(id) => id && onRegionSelect(id)} />
      </div>

      {/* ===== Grafiklar ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Hududlar kesimida</h2>
          {regions.length > 0 ? (
            <BarChart data={regions.map((r) => ({ label: r.code, value: regionCounts[r.id] ?? 0 }))} height={220} />
          ) : (
            <p className="text-sm text-slate-500">Hududlar yuklanmagan.</p>
          )}
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Kuzatuv holati</h2>
          <DonutChart data={followUpDist} centerLabel="Kuzatuv" centerValue={followUps.length} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Tashriflar dinamikasi (6 oy)</h2>
        <AreaChart data={monthly.map((m) => m.value)} labels={monthly.map((m) => m.label)} height={200} />
      </div>

      {/* ===== So'nggi faollik ===== */}
      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">So'nggi faollik</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">Hozircha faollik yo'q.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((e, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <Icon name={e.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {e.title} — {pname(e.pid)}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{formatDate(e.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ===== Katta KPI karta (gradient + segmentlar) =====
function KpiCard({
  title,
  icon,
  value,
  gradient,
  segments,
}: {
  title: string;
  icon: string;
  value: number;
  gradient: string;
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Yuqori gradient qism */}
      <div className={cn("relative bg-gradient-to-br p-5 text-white", gradient)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/80">{title}</p>
            <p className="mt-2 text-4xl font-bold leading-none drop-shadow-sm">{value}</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <Icon name={icon} size={22} />
          </span>
        </div>
        {/* dekorativ doiralar */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -right-2 h-28 w-28 rounded-full bg-white/10" />
      </div>

      {/* Segmentlar */}
      <div className="space-y-2.5 p-4">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className={cn("h-2 w-2 rounded-full", seg.color)} />
                  {seg.label}
                </span>
                <span className="font-semibold text-slate-800">{seg.value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", seg.color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
