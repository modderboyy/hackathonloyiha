"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { SearchInput, Badge, Avatar, Modal, Field, Select, Input, StatCard } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ROLE_LABELS, type Profile, type Role } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const STAFF_ROLES: Role[] = ["medical_worker", "hospital_doctor", "family_doctor"];

export function Admin() {
  const { profile } = useData();
  if (!profile) return null;

  if (profile.role === "super_admin") return <SuperAdminView />;
  if (profile.role === "admin") return <RegionAdminView />;
  if (profile.role === "district_admin") return <DistrictAdminView />;
  return null;
}

// =====================================================================
// SUPER ADMIN — respublika: viloyatlarga admin biriktirish + hamma narsa
// =====================================================================
function SuperAdminView() {
  const { regions, districts, profiles, patients, audit, setRole } = useData();
  const [query, setQuery] = useState("");
  const [assigning, setAssigning] = useState<{ regionId: string; regionName: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const hay = `${p.full_name} ${ROLE_LABELS[p.role]}`.toLowerCase();
      return !q || hay.includes(q);
    });
  }, [profiles, query]);

  const districtCount = districts.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Respublika boshqaruvi</h1>
        <p className="text-sm text-slate-500">
          Viloyatlarga admin biriktirish, statistika va to&lsquo;liq nazorat
        </p>
      </div>

      {/* Statistika */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Viloyatlar" value={regions.length} icon="map" tone="primary" />
        <StatCard label="Tumanlar" value={districtCount} icon="grid" tone="violet" />
        <StatCard label="Foydalanuvchilar" value={profiles.length} icon="users" tone="emerald" />
        <StatCard label="Bemorlar" value={patients.length} icon="heart" tone="red" />
      </div>

      {/* Viloyatlarga admin biriktirish */}
      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Viloyat adminlari</h2>
        <div className="space-y-2">
          {regions.map((r) => {
            const admin = profiles.find((p) => p.role === "admin" && p.region_id === r.id);
            return (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <Icon name="map-pin" size={18} />
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">
                      {districts.filter((d) => d.region_id === r.id).length} tuman
                    </p>
                  </div>
                </div>
                {admin ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={admin.full_name} size={28} />
                    <span className="text-sm font-medium text-slate-700">{admin.full_name}</span>
                    <button
                      onClick={() => setAssigning({ regionId: r.id, regionName: r.name })}
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label="O'zgartirish"
                    >
                      <Icon name="edit" size={15} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setAssigning({ regionId: r.id, regionName: r.name })} className="btn-ghost py-1.5">
                    <Icon name="plus" size={14} /> Admin biriktirish
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Foydalanuvchilar */}
      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Foydalanuvchilar ({profiles.length})</h2>
          <div className="w-full max-w-xs">
            <SearchInput value={query} onChange={setQuery} placeholder="Qidirish..." />
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar name={p.full_name} size={36} />
                <div>
                  <p className="font-medium text-slate-900">{p.full_name}</p>
                  <p className="text-xs text-slate-500">{p.phone ?? "—"}</p>
                </div>
              </div>
              <Badge className={roleTone(p.role)}>{ROLE_LABELS[p.role]}</Badge>
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
            {audit.slice(0, 30).map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${actionTone(a.action)}`}>{a.action}</span>
                  <span className="text-slate-600">{a.entity}</span>
                  {a.entity_id && <span className="text-xs text-slate-400">({a.entity_id})</span>}
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {assigning && (
        <AssignAdminModal
          title={`${assigning.regionName} — viloyat admini`}
          candidates={profiles.filter((p) => p.role === "medical_worker" || p.role === "admin" || p.role === "district_admin")}
          onClose={() => setAssigning(null)}
          onAssign={(profileId) => setRole(profileId, "admin", { region_id: assigning.regionId })}
          onDone={() => setAssigning(null)}
        />
      )}
    </div>
  );
}

// =====================================================================
// VILOYAT ADMINI — tuman adminlarini biriktirish
// =====================================================================
function RegionAdminView() {
  const { profile, regions, districts, profiles, setRole } = useData();
  const regionId = profile?.region_id;
  const region = regions.find((r) => r.id === regionId);
  const myDistricts = districts.filter((d) => d.region_id === regionId);
  const [assigning, setAssigning] = useState<{ districtId: string; districtName: string } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{region?.name ?? "Viloyat"} boshqaruvi</h1>
        <p className="text-sm text-slate-500">Tumanlar va tuman adminlarini boshqarish</p>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Tuman adminlari</h2>
        {myDistricts.length === 0 ? (
          <p className="text-sm text-slate-500">Bu viloyatda hozircha tumanlar yo&lsquo;q. &ldquo;Punktlar&rdquo; bo&lsquo;limidan qo&lsquo;shing.</p>
        ) : (
          <div className="space-y-2">
            {myDistricts.map((d) => {
              const admin = profiles.find((p) => p.role === "district_admin" && p.district_id === d.id);
              return (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <Icon name="grid" size={18} />
                    </span>
                    <p className="font-medium text-slate-900">{d.name}</p>
                  </div>
                  {admin ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={admin.full_name} size={28} />
                      <span className="text-sm font-medium text-slate-700">{admin.full_name}</span>
                      <button onClick={() => setAssigning({ districtId: d.id, districtName: d.name })} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
                        <Icon name="edit" size={15} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setAssigning({ districtId: d.id, districtName: d.name })} className="btn-ghost py-1.5">
                      <Icon name="plus" size={14} /> Admin biriktirish
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {assigning && (
        <AssignAdminModal
          title={`${assigning.districtName} — tuman admini`}
          candidates={profiles.filter((p) => p.role === "medical_worker" || p.role === "district_admin")}
          onClose={() => setAssigning(null)}
          onAssign={(profileId) => setRole(profileId, "district_admin", { district_id: assigning.districtId })}
          onDone={() => setAssigning(null)}
        />
      )}
    </div>
  );
}

// =====================================================================
// TUMAN ADMINI — mahallalar va xodimlar (approval orqali)
// =====================================================================
function DistrictAdminView() {
  const { profile, districts, neighborhoods, profiles } = useData();
  const districtId = profile?.district_id;
  const district = districts.find((d) => d.id === districtId);
  const myNeighborhoods = neighborhoods.filter((n) => n.district_id === districtId);
  const myStaff = profiles.filter((p) => STAFF_ROLES.includes(p.role) && p.neighborhood_id && myNeighborhoods.some((n) => n.id === p.neighborhood_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{district?.name ?? "Tuman"} boshqaruvi</h1>
        <p className="text-sm text-slate-500">Mahallalar va xodimlarni boshqarish</p>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Mahallalar ({myNeighborhoods.length})</h2>
        {myNeighborhoods.length === 0 ? (
          <p className="text-sm text-slate-500">Hozircha mahallalar yo&lsquo;q. &ldquo;Punktlar&rdquo; bo&lsquo;limidan qo&lsquo;shing.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {myNeighborhoods.map((n) => {
              const count = profiles.filter((p) => STAFF_ROLES.includes(p.role) && p.neighborhood_id === n.id).length;
              return (
                <div key={n.id} className="rounded-xl border border-slate-100 px-4 py-3">
                  <p className="font-medium text-slate-900">{n.name}</p>
                  <p className="text-xs text-slate-500">{count} xodim</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Xodimlar ({myStaff.length})</h2>
        {myStaff.length === 0 ? (
          <p className="text-sm text-slate-500">
            Xodimlar &ldquo;Tasdiqlash&rdquo; oqimi orqali qo&lsquo;shiladi va tasdiqlangach shu yerda ko&lsquo;rinadi.
          </p>
        ) : (
          <div className="space-y-2">
            {myStaff.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={p.full_name} size={34} />
                  <div>
                    <p className="font-medium text-slate-900">{p.full_name}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[p.role]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Admin biriktirish modali
// =====================================================================
function AssignAdminModal({
  title,
  candidates,
  onClose,
  onAssign,
  onDone,
}: {
  title: string;
  candidates: Profile[];
  onClose: () => void;
  onAssign: (profileId: string) => Promise<string | null>;
  onDone: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setErr("Foydalanuvchini tanlang.");
      return;
    }
    setBusy(true);
    const error = await onAssign(selected);
    setBusy(false);
    if (error) setErr(error);
    else onDone();
  }

  return (
    <Modal open onClose={onClose} title={title}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Foydalanuvchi" required>
          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Tanlang...</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} — {ROLE_LABELS[c.role]}
              </option>
            ))}
          </Select>
        </Field>
        {candidates.length === 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Mos foydalanuvchi topilmadi. Avval xodim qo&lsquo;shish kerak.
          </p>
        )}
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">Bekor qilish</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saqlanmoqda..." : "Biriktirish"}</button>
        </div>
      </form>
    </Modal>
  );
}

function roleTone(r: Role): string {
  const m: Record<Role, string> = {
    super_admin: "bg-slate-900 text-white",
    admin: "bg-primary-100 text-primary-800",
    district_admin: "bg-violet-100 text-violet-700",
    medical_worker: "bg-sky-100 text-sky-700",
    hospital_doctor: "bg-teal-100 text-teal-700",
    family_doctor: "bg-emerald-100 text-emerald-700",
  };
  return m[r];
}

function actionTone(a: string): string {
  if (a === "INSERT") return "bg-emerald-100 text-emerald-700";
  if (a === "UPDATE") return "bg-amber-100 text-amber-700";
  if (a === "DELETE") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}
