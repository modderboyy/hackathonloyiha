"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { StatCard } from "@/components/ui";
import { BarChart, DonutChart, AreaChart } from "@/components/charts";
import { UzMap } from "@/components/map";
import { FOLLOWUP_STATUS } from "@/lib/types";
import { MONTHLY_VISITS } from "@/lib/mock";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/icons";

export function Overview({ onRegionSelect }: { onRegionSelect: (regionId: string) => void }) {
  const { regions, patients, followUps, notifications, discharges, visits } = useStore();

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
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Hududlar bo'yicha bemorlar</h2>
            <p className="text-sm text-slate-500">Hududni bosing — ro'yxat filtrlanadi</p>
          </div>
          <Icon name="map" size={22} className="text-primary-700" />
        </div>
        <UzMap regions={regions} counts={regionCounts} selected={null} onSelect={(id) => id && onRegionSelect(id)} />
      </div>

      {/* Grafiklar */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Hududlar kesimida</h2>
          <BarChart
            data={regions.map((r) => ({ label: r.code, value: regionCounts[r.id] ?? 0 }))}
            height={220}
          />
        </div>
        <div className="card">
          <h2 className="mb-4 font-semibold text-slate-900">Kuzatuv holati</h2>
          <DonutChart data={followUpDist} centerLabel="Kuzatuv" centerValue={followUps.length} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Tashriflar dinamikasi (6 oy)</h2>
        <AreaChart data={MONTHLY_VISITS.map((m) => m.value)} labels={MONTHLY_VISITS.map((m) => m.label)} height={200} />
      </div>

      {/* So'nggi faollik */}
      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">So'nggi faollik</h2>
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
      </div>
    </div>
  );
}
