"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { SearchInput, Badge, Modal, Field, Input, Select, Textarea, EmptyState, Avatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { GENDER_LABELS, type Patient, type TimelineEvent } from "@/lib/types";
import { ageFromBirthDate, formatDate, formatDateTime } from "@/lib/utils";

export function Patients({ regionFilter, onClearRegion }: { regionFilter: string | null; onClearRegion: () => void }) {
  const { patients, regions, deletePatient } = useData();

  const [query, setQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [regionLocal, setRegionLocal] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [showNew, setShowNew] = useState(false);

  const activeRegion = regionFilter ?? regionLocal;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (activeRegion && p.region_id !== activeRegion) return false;
      if (genderFilter && p.gender !== genderFilter) return false;
      if (q) {
        const hay = `${p.full_name} ${p.pinfl ?? ""} ${p.phone ?? ""} ${p.address ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [patients, query, genderFilter, activeRegion]);

  const regionName = (id: string | null) => regions.find((r) => r.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bemorlar</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} natija {patients.length} tadan
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Icon name="plus" size={16} /> Yangi bemor
        </button>
      </div>

      {/* Qidiruv va filtr */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder="Ism, JSHSHIR, telefon yoki manzil bo'yicha qidirish..." />
        </div>
        <Select value={activeRegion} onChange={(e) => (regionFilter ? onClearRegion() : setRegionLocal(e.target.value))} className="sm:w-48">
          <option value="">Barcha hududlar</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
        <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="sm:w-40">
          <option value="">Barcha jinslar</option>
          <option value="male">Erkak</option>
          <option value="female">Ayol</option>
          <option value="other">Boshqa</option>
        </Select>
      </div>

      {activeRegion && (
        <div className="flex items-center gap-2">
          <Badge className="bg-primary-100 text-primary-800">
            <Icon name="map-pin" size={12} /> {regionName(activeRegion)}
          </Badge>
          <button onClick={onClearRegion} className="text-xs font-medium text-slate-500 hover:text-slate-700">
            Tozalash ✕
          </button>
        </div>
      )}

      {/* Ro'yxat */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="users"
            title="Bemor topilmadi"
            desc="Qidiruv so'zini o'zgartiring yoki yangi bemor qo'shing."
            action={
              <button onClick={() => setShowNew(true)} className="btn-primary">
                <Icon name="plus" size={16} /> Yangi bemor
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Bemor</th>
                  <th className="px-4 py-3 font-medium">JSHSHIR</th>
                  <th className="px-4 py-3 font-medium">Yosh</th>
                  <th className="px-4 py-3 font-medium">Hudud</th>
                  <th className="px-4 py-3 font-medium">Telefon</th>
                  <th className="px-4 py-3 font-medium text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(p)} className="flex items-center gap-2 font-medium text-slate-900 hover:text-primary-700">
                        <Avatar name={p.full_name} size={28} />
                        {p.full_name}
                      </button>
                      {p.gender && <span className="ml-9 text-xs text-slate-400">{GENDER_LABELS[p.gender]}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.pinfl ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{ageFromBirthDate(p.birth_date)}</td>
                    <td className="px-4 py-3 text-slate-600">{regionName(p.region_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(p)} className="rounded-lg p-1.5 text-primary-700 transition hover:bg-primary-50" aria-label="Ko'rish">
                        <Icon name="eye" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((p) => (
              <li key={p.id}>
                <button onClick={() => setSelected(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <Avatar name={p.full_name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{p.full_name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {ageFromBirthDate(p.birth_date)} · {regionName(p.region_id)}
                    </p>
                  </div>
                  <Icon name="chevron-right" size={18} className="text-slate-300" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showNew && <NewPatientModal onClose={() => setShowNew(false)} onCreated={() => setShowNew(false)} />}
      {selected && (
        <PatientDetail
          patient={selected}
          onClose={() => setSelected(null)}
          onDeleted={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// --- Yangi bemor modali ---
function NewPatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { regions, addPatient } = useData();
  const [form, setForm] = useState({ full_name: "", pinfl: "", birth_date: "", gender: "", region_id: "", phone: "", address: "", emergency_contact: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setErr("To'liq ism majburiy.");
      return;
    }
    setBusy(true);
    const error = await addPatient({
      full_name: form.full_name.trim(),
      pinfl: form.pinfl || null,
      birth_date: form.birth_date || null,
      gender: (form.gender as Patient["gender"]) || null,
      region_id: form.region_id || null,
      phone: form.phone || null,
      address: form.address || null,
      emergency_contact: form.emergency_contact || null,
    });
    setBusy(false);
    if (error) setErr(error);
    else onCreated();
  }

  return (
    <Modal open onClose={onClose} title="Yangi bemor" wide>
      <form onSubmit={submit} className="space-y-4">
        <Field label="To'liq ism" required>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Alisher Karimov" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="JSHSHIR (PINFL)" optional>
            <Input value={form.pinfl} onChange={(e) => set("pinfl", e.target.value)} maxLength={14} placeholder="14 raqam" />
          </Field>
          <Field label="Tug'ilgan sana" optional>
            <Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
          </Field>
          <Field label="Jinsi" optional>
            <Select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">Tanlanmagan</option>
              <option value="male">Erkak</option>
              <option value="female">Ayol</option>
              <option value="other">Boshqa</option>
            </Select>
          </Field>
          <Field label="Yashash hududi" optional>
            <Select value={form.region_id} onChange={(e) => set("region_id", e.target.value)}>
              <option value="">Tanlanmagan</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Telefon" optional>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+998 90 000 00 00" />
          </Field>
          <Field label="Favqulodda aloqa" optional>
            <Input value={form.emergency_contact} onChange={(e) => set("emergency_contact", e.target.value)} placeholder="Qarindosh telefoni" />
          </Field>
        </div>
        <Field label="Manzil" optional>
          <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Qishloq, ko'cha, uy" />
        </Field>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Bekor qilish</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saqlanmoqda..." : "Saqlash"}</button>
        </div>
      </form>
    </Modal>
  );
}

// --- Bemor batafsil modali ---
function PatientDetail({ patient, onClose, onDeleted }: { patient: Patient; onClose: () => void; onDeleted: () => void }) {
  const { regions, visits, vitals, discharges, followUps, addVisit, deletePatient } = useData();
  const [tab, setTab] = useState<"timeline" | "visit">("timeline");
  const [complaint, setComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [vt, setVt] = useState({ bp_sys: "", bp_dia: "", heart_rate: "", temperature: "", spo2: "", weight: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const pVisits = visits.filter((v) => v.patient_id === patient.id);
  const pVitals = vitals.filter((v) => v.patient_id === patient.id);
  const pDischarges = discharges.filter((d) => d.patient_id === patient.id);
  const pFollowUps = followUps.filter((f) => f.patient_id === patient.id);

  const timeline: TimelineEvent[] = [
    ...pVisits.map((v) => ({ id: v.id, type: "visit" as const, title: "Klinik tashrif", detail: v.chief_complaint || v.diagnosis || "Tashrif", date: v.visit_date })),
    ...pVitals.map((v) => ({ id: v.id, type: "vital" as const, title: "Ko'rsatkichlar", detail: fmtVitals(v), date: v.measured_at })),
    ...pDischarges.map((d) => ({ id: d.id, type: "discharge" as const, title: "Chiqarish", detail: d.summary || "Chiqarildi", date: d.discharge_date })),
    ...pFollowUps.map((f) => ({ id: f.id, type: "follow_up" as const, title: "Follow-up", detail: f.result_notes || f.status, date: f.due_date })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const lastVital = pVitals[0];

  async function submitVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!complaint.trim()) {
      setErr("Shikoyat majburiy.");
      return;
    }
    setBusy(true);
    const error = await addVisit(
      { patient_id: patient.id, facility_id: null, chief_complaint: complaint || null, diagnosis: diagnosis || null, notes: null, recommendations: null },
      {
        bp_sys: vt.bp_sys ? +vt.bp_sys : null,
        bp_dia: vt.bp_dia ? +vt.bp_dia : null,
        heart_rate: vt.heart_rate ? +vt.heart_rate : null,
        temperature: vt.temperature ? +vt.temperature : null,
        spo2: vt.spo2 ? +vt.spo2 : null,
        weight: vt.weight ? +vt.weight : null,
      }
    );
    setBusy(false);
    if (error) {
      setErr(error);
    } else {
      setComplaint("");
      setDiagnosis("");
      setVt({ bp_sys: "", bp_dia: "", heart_rate: "", temperature: "", spo2: "", weight: "" });
      setTab("timeline");
    }
  }

  async function handleDelete() {
    if (!confirm("Bemorni o'chirishni tasdiqlaysizmi?")) return;
    const error = await deletePatient(patient.id);
    if (!error) onDeleted();
  }

  const regionName = regions.find((r) => r.id === patient.region_id)?.name ?? "—";

  return (
    <Modal open onClose={onClose} title="" wide>
      <div className="-mt-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={patient.full_name} size={52} />
            <div>
              <h3 className="text-lg font-bold text-slate-900">{patient.full_name}</h3>
              <p className="text-sm text-slate-500">
                {ageFromBirthDate(patient.birth_date)}
                {patient.gender ? ` · ${GENDER_LABELS[patient.gender]}` : ""} · {regionName}
              </p>
            </div>
          </div>
          <button onClick={handleDelete} className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 transition hover:bg-red-50">
            <Icon name="trash" size={15} /> O'chirish
          </button>
        </div>

        <dl className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <Info label="JSHSHIR" value={patient.pinfl} />
          <Info label="Telefon" value={patient.phone} />
          <Info label="Favqulodda aloqa" value={patient.emergency_contact} />
          <Info label="Manzil" value={patient.address} />
          <Info label="Ro'yxatga olingan" value={formatDate(patient.created_at)} />
          {lastVital && <Info label="So'nggi AB" value={lastVital.bp_sys ? `${lastVital.bp_sys}/${lastVital.bp_dia}` : "—"} />}
        </dl>

        <div className="mt-5 flex gap-1 border-b border-slate-200">
          <TabBtn active={tab === "timeline"} onClick={() => setTab("timeline")} icon="activity" label="Timeline" />
          <TabBtn active={tab === "visit"} onClick={() => setTab("visit")} icon="plus" label="Yangi tashrif" />
        </div>

        {tab === "timeline" ? (
          <div className="mt-4">
            {timeline.length === 0 ? (
              <EmptyState icon="clock" title="Ma'lumot yo'q" desc="Hozircha tibbiy tarix qayd etilmagan." />
            ) : (
              <ol className="relative space-y-5 border-l-2 border-slate-200 pl-5">
                {timeline.map((e) => (
                  <li key={`${e.type}-${e.id}`} className="relative">
                    <span className={`absolute -left-[27px] top-1 flex h-4 w-4 rounded-full ring-4 ring-white ${dotColor(e.type)}`} />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{e.title}</p>
                        <p className="text-sm text-slate-600">{e.detail}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{formatDateTime(e.date)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : (
          <form onSubmit={submitVisit} className="mt-4 space-y-4">
            <Field label="Asosiy shikoyat" required>
              <Textarea rows={2} value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Bemorning shikoyati..." />
            </Field>
            <Field label="Tashxis (ishchi)" optional>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Masalan: Gipertoniya II daraja" />
            </Field>
            <div>
              <p className="label">Hayotiy ko'rsatkichlar</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <VInput label="AB (sist.)" value={vt.bp_sys} onChange={(v) => setVt((s) => ({ ...s, bp_sys: v }))} placeholder="120" />
                <VInput label="AB (diast.)" value={vt.bp_dia} onChange={(v) => setVt((s) => ({ ...s, bp_dia: v }))} placeholder="80" />
                <VInput label="Puls" value={vt.heart_rate} onChange={(v) => setVt((s) => ({ ...s, heart_rate: v }))} placeholder="72" />
                <VInput label="Harorat °C" value={vt.temperature} onChange={(v) => setVt((s) => ({ ...s, temperature: v }))} placeholder="36.6" />
                <VInput label="SpO₂ %" value={vt.spo2} onChange={(v) => setVt((s) => ({ ...s, spo2: v }))} placeholder="98" />
                <VInput label="Vazn kg" value={vt.weight} onChange={(v) => setVt((s) => ({ ...s, weight: v }))} placeholder="70" />
              </div>
            </div>
            {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <div className="flex justify-end gap-3">
              <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saqlanmoqda..." : "Tashvisni saqlash"}</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value || "—"}</dd>
    </div>
  );
}

function VInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
        active ? "border-primary-800 text-primary-800" : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon name={icon} size={16} /> {label}
    </button>
  );
}

function fmtVitals(v: { bp_sys: number | null; bp_dia: number | null; heart_rate: number | null; temperature: number | null; spo2: number | null; weight: number | null }): string {
  const parts: string[] = [];
  if (v.bp_sys && v.bp_dia) parts.push(`AB ${v.bp_sys}/${v.bp_dia}`);
  if (v.heart_rate) parts.push(`Puls ${v.heart_rate}`);
  if (v.temperature) parts.push(`T ${v.temperature}°`);
  if (v.spo2) parts.push(`SpO₂ ${v.spo2}%`);
  if (v.weight) parts.push(`Vazn ${v.weight}kg`);
  return parts.join(" · ") || "Ko'rsatkichlar";
}

function dotColor(type: string): string {
  const m: Record<string, string> = {
    visit: "bg-primary-500",
    vital: "bg-sky-500",
    hospitalization: "bg-violet-500",
    discharge: "bg-amber-500",
    follow_up: "bg-emerald-500",
  };
  return m[type] ?? "bg-slate-400";
}
