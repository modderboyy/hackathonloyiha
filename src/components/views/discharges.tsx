"use client";

import { useMemo, useState } from "react";
import { useData, type DischargeInput, type DischargeResult } from "@/lib/data";
import { SearchInput, Badge, Modal, Field, Input, Select, Textarea, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export function Discharges() {
  const { patients, discharges, profiles, followUps, addDischarge } = useData();
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return discharges.filter((d) => {
      const p = patients.find((x) => x.id === d.patient_id);
      const hay = `${p?.full_name ?? ""} ${d.summary ?? ""}`.toLowerCase();
      return !q || hay.includes(q);
    });
  }, [discharges, patients, query]);

  const pname = (id: string) => patients.find((p) => p.id === id)?.full_name ?? "—";
  const dname = (id: string | null) => profiles.find((p) => p.id === id)?.full_name ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chiqarishlar</h1>
          <p className="text-sm text-slate-500">Statsionardan chiqarish va avtomatik yo'naltirish</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <Icon name="plus" size={16} /> Yangi chiqarish
        </button>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Bemor yoki xulosa bo'yicha qidirish..." />

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon="bed" title="Chiqarishlar yo'q" desc="Birinchi chiqarishni yarating — kuzatuv avtomatik ochiladi." />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const fu = followUps.find((f) => f.discharge_id === d.id);
            return (
              <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{pname(d.patient_id)}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(d.discharge_date)}
                    {d.assigned_family_doctor_id ? ` · ${dname(d.assigned_family_doctor_id)}` : ""}
                  </p>
                  {d.summary && <p className="mt-1 text-sm text-slate-600 line-clamp-1">{d.summary}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {d.requires_follow_up ? (
                    <Badge className="bg-primary-100 text-primary-800">Kuzatuv {d.follow_up_days ?? 7} kun</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-600">Kuzatuvsiz</Badge>
                  )}
                  {fu && (
                    <span className="text-xs text-slate-400">
                      {fu.status === "completed" ? "✓ Yakunlangan" : `Follow-up: ${formatDate(fu.due_date)}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && <DischargeModal onClose={() => setShowNew(false)} onSubmit={addDischarge} onDone={() => setShowNew(false)} />}
    </div>
  );
}

function DischargeModal({
  onClose,
  onSubmit,
  onDone,
}: {
  onClose: () => void;
  onSubmit: (d: DischargeInput) => Promise<DischargeResult>;
  onDone: () => void;
}) {
  const { patients, profiles } = useData();
  const familyDoctors = profiles.filter((p) => p.role === "family_doctor");
  const today = new Date().toISOString().slice(0, 10);

  const [patientId, setPatientId] = useState("");
  const [admissionDate, setAdmissionDate] = useState(today);
  const [dischargeDate, setDischargeDate] = useState(today);
  const [diagnosis, setDiagnosis] = useState("");
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(true);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [familyDoctorId, setFamilyDoctorId] = useState("");
  const [medications, setMedications] = useState<{ name: string; dosage: string; frequency: string }[]>([
    { name: "", dosage: "", frequency: "" },
  ]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultCode, setResultCode] = useState<string | null>(null);

  function updateMed(i: number, field: "name" | "dosage" | "frequency", value: string) {
    setMedications((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setErr("Bemorni tanlang (majburiy).");
      return;
    }
    const meds = medications.filter((m) => m.name.trim());
    setBusy(true);
    const res = await onSubmit({
      patientId,
      admissionDate,
      dischargeDate,
      diagnosis,
      summary,
      recommendations,
      requiresFollowUp,
      followUpDays,
      familyDoctorId: familyDoctorId || null,
      medications: meds,
    });
    setBusy(false);
    if (res.error) setErr(res.error);
    else setResultCode(res.code);
  }

  // Natija (kod) ko'rsatish ekrani
  if (resultCode) {
    const patient = patients.find((p) => p.id === patientId);
    return (
      <Modal open onClose={onClose} title="Chiqarish yakunlandi">
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Icon name="check" size={26} />
          </span>
          <p className="font-semibold text-slate-900">{patient?.full_name ?? "Bemor"} statsionardan chiqarildi</p>
          <p className="text-sm text-slate-500">Bemorga bering — mobil ilovada shu kod bilan klinik obunani faollashtiradi:</p>
          <div className="rounded-xl bg-slate-900 p-4">
            <p className="font-mono text-2xl font-bold tracking-[0.3em] text-white">{resultCode}</p>
          </div>
          <p className="text-xs text-slate-400">
            Bu kod statsionar muddati ({requiresFollowUp ? followUpDays : 0} kun) davomida faol bo'ladi. Bemor ma'lumotlari va dori-darmonlar avtomatik sinxronlanadi.
          </p>
          <button onClick={onDone} className="btn-primary w-full">Tayyor</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title="Chiqarish va yo'naltirish" wide>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Bemor" required>
          <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            <option value="">Bemorni tanlang...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Qabul sanasi" optional>
            <Input type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} />
          </Field>
          <Field label="Chiqarish sanasi" optional>
            <Input type="date" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Tashxis" optional>
          <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Statsionar tashxis" />
        </Field>
        <Field label="Davolash yakuni (xulosa)" optional>
          <Textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </Field>
        <Field label="Tavsiyalar" optional>
          <Textarea rows={2} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />
        </Field>

        {/* Dori-darmonlar */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label">Dori-darmonlar (bemorga sinxronlanadi)</p>
            <button
              type="button"
              onClick={() => setMedications((prev) => [...prev, { name: "", dosage: "", frequency: "" }])}
              className="text-sm font-medium text-primary-700 hover:text-primary-800"
            >
              + Qo'shish
            </button>
          </div>
          <div className="space-y-2">
            {medications.map((m, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Input placeholder="Nomi" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
                <Input placeholder="Dozasi" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
                <Input placeholder="Qabul vaqti" value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} />
                <button
                  type="button"
                  onClick={() => setMedications((prev) => prev.filter((_, idx) => idx !== i))}
                  className="self-center rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={requiresFollowUp}
              onChange={(e) => setRequiresFollowUp(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-700"
            />
            <span className="text-sm font-medium text-slate-800">Keyingi kuzatuv kerak</span>
          </label>
          {requiresFollowUp && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Kuzatuv muddati (kun)" optional>
                <Input type="number" min={1} value={followUpDays} onChange={(e) => setFollowUpDays(+e.target.value)} />
              </Field>
              <Field label="Oilaviy shifokor" optional hint="Bo'sh qoldirsangiz hudud bo'yicha avtomatik topiladi">
                <Select value={familyDoctorId} onChange={(e) => setFamilyDoctorId(e.target.value)}>
                  <option value="">Avtomatik (hudud bo'yicha)</option>
                  {familyDoctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          <p className="mt-3 flex items-center gap-2 text-xs text-primary-700">
            <Icon name="zap" size={13} /> Saqlangach bemor uchun klinik kod yaratiladi, follow-up va xabarnoma avtomatik ochiladi.
          </p>
        </div>

        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Bekor qilish</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saqlanmoqda..." : "Chiqarish va yo'naltirish"}</button>
        </div>
      </form>
    </Modal>
  );
}
