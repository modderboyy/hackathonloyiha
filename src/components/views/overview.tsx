"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useData } from "@/lib/data";
import { StatCard } from "@/components/ui";
import { BarChart, DonutChart, AreaChart } from "@/components/charts";
import { Icon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

const RegionMap = dynamic(() => import("@/components/map/RegionMap"), {
  ssr: false,
  loading: () => <div className="h-[380px] w-full animate-pulse rounded-xl bg-slate-100 sm:h-[460px]" />,
});

const MONTH_NAMES = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

export function Overview({ onRegionSelect }: { onRegionSelect: (regionId: string) => void }) {
  const { regions, patients, followUps, notifications, discharges, visits } = useData();

  const regionCounts = useMemo(() => {
    const m: Record<string, number> = {};
    regions.forEach((r) => (m[r.id] = 0));
    patients.forEach((p) => {
      if (p.region_id && m[p.region_id] !== undefined) m[p.region_id]++;
    });
    return m;
  }, [regions, patients]);

  const activeFollowUps = followUps.filter((f) => f.status === "pending" || f.status === "in_progress").length;
  const unread = notifications.filter((n) => !n.is_read).length;

  const followUpDist = useMemo(() => {
    const counts = { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
    followUps.forEach((f) => {
      if (f.status in counts) counts[f.status as keyof typeof counts]++;
    });
    return [
      { label: "Kutilmoqda", value: counts.pending, color: "#f59e0b" },
      { label: "Jarayonda", value: counts.in_progress, color: "#3b82f6" },
      { label: "Yakunlandi", value: counts.completed, color: "#10b981" },
      { label: "Muddati o'tdi", value: counts.overdue, color: "#ef4444" },
    ];
  }, [followUps]);

  // So'nggi 6 oylik tashriflar
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
      {/* Statistika */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jami bemorlar" value={patients.length} icon="users" tone="primary" />
        <StatCard label="Faol kuzatuvlar" value={activeFollowUps} icon="clipboard" tone="amber" />
        <StatCard label="O'qilmagan xabarlar" value={unread} icon="bell" tone="red" />
        <StatCard label="Chiqarishlar" value={discharges.length} icon="bed" tone="violet" />
      </div>

      {/* Xarita */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Hududlar bo'yicha bemorlar</h2>
            <p className="text-sm text-slate-500">Hududni bosing — bemorlar ro'yxati filtrlanadi</p>
          </div>
          <Icon name="map" size={22} className="text-primary-700" />
        </div>
        <RegionMap regions={regions} counts={regionCounts} selected={null} onSelect={(id) => id && onRegionSelect(id)} />
      </div>

      {/* Grafiklar */}
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

      {/* So'nggi faollik */}
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
