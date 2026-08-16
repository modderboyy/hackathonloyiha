"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { SearchInput, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { formatDateTime } from "@/lib/utils";

const TYPE_META: Record<string, { icon: string; label: string; cls: string }> = {
  info: { icon: "info", label: "Ma'lumot", cls: "bg-sky-100 text-sky-700" },
  follow_up: { icon: "clipboard", label: "Kuzatuv", cls: "bg-primary-100 text-primary-800" },
  discharge: { icon: "bed", label: "Chiqarish", cls: "bg-violet-100 text-violet-700" },
  alert: { icon: "alert-triangle", label: "Ogohlantirish", cls: "bg-red-100 text-red-700" },
};

export function Notifications() {
  const { notifications, patients, markNotificationRead } = useData();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((n) => {
      if (filter === "unread" && n.is_read) return false;
      if (q) {
        const hay = `${n.title} ${n.body ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notifications, filter, query]);

  const unread = notifications.filter((n) => !n.is_read).length;
  const pname = (id: string | null) => (id ? patients.find((p) => p.id === id)?.full_name ?? "" : "");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xabarnomalar</h1>
        <p className="text-sm text-slate-500">{unread} ta o'qilmagan</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder="Xabarnoma bo'yicha qidirish..." />
        </div>
        <div className="flex gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="Barchasi" />
          <FilterChip active={filter === "unread"} onClick={() => setFilter("unread")} label="O'qilmagan" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon="bell" title="Xabarnomalar yo'q" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.info;
            return (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`card flex w-full items-start gap-3 text-left transition hover:shadow-md ${
                  n.is_read ? "" : "border-primary-300 bg-primary-50/40"
                }`}
              >
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}>
                  <Icon name={meta.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary-600" />}
                  </div>
                  <p className="text-sm text-slate-600">
                    {n.body}
                    {pname(n.patient_id) && <span className="font-medium"> — {pname(n.patient_id)}</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
                <Badge className={`${meta.cls} hidden sm:inline-flex`}>{meta.label}</Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-primary-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
