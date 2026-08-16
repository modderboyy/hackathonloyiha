"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { SearchInput, Badge, Avatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const ROLE_ORDER: Role[] = ["super_admin", "admin", "medical_worker", "hospital_doctor", "family_doctor"];

const ROLE_TONE: Record<Role, string> = {
  super_admin: "bg-slate-900 text-white",
  admin: "bg-primary-100 text-primary-800",
  medical_worker: "bg-sky-100 text-sky-700",
  hospital_doctor: "bg-violet-100 text-violet-700",
  family_doctor: "bg-emerald-100 text-emerald-700",
};

export function Admin() {
  const { profiles, audit, regions, setRole, profile } = useData();
  const [query, setQuery] = useState("");

  const isSuperAdmin = profile?.role === "super_admin";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const hay = `${p.full_name} ${ROLE_LABELS[p.role]}`.toLowerCase();
      return !q || hay.includes(q);
    });
  }, [profiles, query]);

  const regionName = (id: string | null) => regions.find((r) => r.id === id)?.name ?? "—";
  const uname = (id: string | null) => profiles.find((p) => p.id === id)?.full_name ?? "Noma'lum";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Boshqaruv paneli</h1>
        <p className="text-sm text-slate-500">
          Foydalanuvchilar, rollar va tizim auditi
          {isSuperAdmin && <span className="ml-2 rounded bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">Super admin rejimi</span>}
        </p>
      </div>

      {/* Foydalanuvchilar */}
      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Foydalanuvchilar ({profiles.length})</h2>
          <div className="w-full max-w-xs">
            <SearchInput value={query} onChange={setQuery} placeholder="Ism yoki rol qidirish..." />
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={p.full_name} size={38} />
                <div>
                  <p className="font-medium text-slate-900">
                    {p.full_name}
                    {p.id === profile?.id && <span className="ml-2 text-xs text-slate-400">(siz)</span>}
                  </p>
                  <p className="text-xs text-slate-500">{p.phone ?? "Telefon yo'q"} · {regionName(p.region_id)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin ? (
                  <select
                    value={p.role}
                    disabled={p.id === profile?.id}
                    onChange={(e) => setRole(p.id, e.target.value as Role)}
                    className="field max-w-[180px] py-1.5"
                  >
                    {ROLE_ORDER.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge className={ROLE_TONE[p.role]}>{ROLE_LABELS[p.role]}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit */}
      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Audit jurnali</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-slate-500">Audit yozuvlari yo'q.</p>
        ) : (
          <div className="space-y-2">
            {audit.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${actionTone(a.action)}`}>{a.action}</span>
                  <span className="font-medium text-slate-700">{uname(a.user_id)}</span>
                  <span className="text-slate-500">→ {a.entity}</span>
                  {a.entity_id && <span className="text-xs text-slate-400">({a.entity_id})</span>}
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rollar izohi */}
      <div className="card">
        <h2 className="mb-3 font-semibold text-slate-900">Rollar va ruxsatlar</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_ORDER.map((r) => (
            <div key={r} className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center gap-2">
                <Icon name={roleIcon(r)} size={16} className="text-primary-700" />
                <span className="font-medium text-slate-800">{ROLE_LABELS[r]}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{roleDesc(r)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function actionTone(a: string): string {
  if (a === "INSERT") return "bg-emerald-100 text-emerald-700";
  if (a === "UPDATE") return "bg-amber-100 text-amber-700";
  if (a === "DELETE") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}

function roleIcon(r: Role): string {
  const m: Record<Role, string> = {
    super_admin: "shield",
    admin: "settings",
    medical_worker: "stethoscope",
    hospital_doctor: "bed",
    family_doctor: "heart",
  };
  return m[r];
}

function roleDesc(r: Role): string {
  const m: Record<Role, string> = {
    super_admin: "To'liq boshqaruv: adminlar, rollar, audit va barcha ma'lumotlar.",
    admin: "Hududlar, muassasalar va foydalanuvchilarni boshqaradi.",
    medical_worker: "Bemorni ro'yxatga oladi, shikoyat va ko'rsatkichlarni kiritadi.",
    hospital_doctor: "Statsionar davolash, discharge va yo'naltirish.",
    family_doctor: "Follow-up kuzatuvlari va natijalarini qayd qiladi.",
  };
  return m[r];
}
