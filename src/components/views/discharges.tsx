"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SearchInput, Badge, Modal, Field, Input, Select, Textarea, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export function Discharges() {
  const { patients, discharges, profiles, followUps, addDischarge } = useStore();
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [prePatient, setPrePatient] = useState("");

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
        <button onClick={() => { setPrePatient(""); setShowNew(true); }} className="btn-primary">
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
                    <Badge className="bg-primary-100 text-primary-800">
                      Kuzatuv {d.follow_up_days ?? 7} kun
                    </Badge>
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

      {showNew && (
        <DischargeModal
          onClose={() => setShowNew(false)}
          preselect={prePatient}
          onSubmit={(d) => {
            addDischarge(d);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function DischargeModal({
  onClose,
  preselect,
  onSubmit,
}: {
  onClose: () => void;
  preselect: string;
  onSubmit: (d: {
    patientId: string;
    admissionDate: string;
    dischargeDate: string;
    diagnosis: string;
    summary: string;
    recommendations: string;
    requiresFollowUp: boolean;
    followUpDays: number;
    familyDoctorId: string | null;
  }) => void;
}) {
  const { patients, profiles } = useStore();
  const familyDoctors = profiles.filter((p) => p.role === "family_doctor");
  const today = new Date().toISOString().slice(0, 10);

  const [patientId, setPatientId] = useState(preselect);
  const [admissionDate, setAdmissionDate] = useState(today);
  const [dischargeDate, setDischargeDate] = useState(today);
  const [diagnosis, setDiagnosis] = useState("");
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [requiresFollowUp, setRequiresFollowUp] = useState(true);
  const [followUpDays, setFollowUpDays] = useState(7);
  const [familyDoctorId, setFamilyDoctorId] = useState("");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setErr("Bemorni tanlang (majburiy).");
      return;
    }
    onSubmit({
      patientId,
      admissionDate,
      dischargeDate,
      diagnosis,
      summary,
      recommendations,
      requiresFollowUp,
      followUpDays,
      familyDoctorId: familyDoctorId || null,
    });
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
            <Icon name="zap" size={13} /> Saqlangach CareLink avtomatik follow-up va xabarnoma yaratadi.
          </p>
        </div>

        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Bekor qilish</button>
          <button type="submit" className="btn-primary">Chiqarish va yo'naltirish</button>
        </div>
      </form>
    </Modal>
  );
}
