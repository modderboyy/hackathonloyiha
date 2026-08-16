"use client";

import { useActionState, useState } from "react";
import type { Patient, Profile } from "@/lib/types";

export function DischargeForm({
  action,
  patients,
  familyDoctors,
  preselectedPatient,
}: {
  action: (f: FormData) => Promise<{ error?: string } | void>;
  patients: Patient[];
  familyDoctors: Profile[];
  preselectedPatient?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await action(formData)) ?? null,
    null
  );
  const [requiresFollowUp, setRequiresFollowUp] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label">Bemor *</label>
        <select name="patient_id" required className="field" defaultValue={preselectedPatient ?? ""}>
          <option value="" disabled>
            Bemorni tanlang
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Statsionarga qabul sanasi</label>
          <input name="admission_date" type="date" className="field" defaultValue={today} />
        </div>
        <div>
          <label className="label">Chiqarish sanasi</label>
          <input name="discharge_date" type="date" className="field" defaultValue={today} />
        </div>
      </div>

      <div>
        <label className="label">Tashxis</label>
        <input name="diagnosis" className="field" placeholder="Statsionar tashxis" />
      </div>

      <div>
        <label className="label">Davolash yakuni (xulosa)</label>
        <textarea name="summary" rows={3} className="field" placeholder="Davolash natijalari, holati..." />
      </div>

      <div>
        <label className="label">Tavsiyalar</label>
        <textarea name="recommendations" rows={2} className="field" placeholder="Dori-darmon, rejim, parhez..." />
      </div>

      {/* Follow-up belgilash */}
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="requires_follow_up"
            checked={requiresFollowUp}
            onChange={(e) => setRequiresFollowUp(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-teal-600"
          />
          <span className="text-sm font-medium text-slate-800">
            Keyingi kuzatuv kerak
          </span>
        </label>

        {requiresFollowUp && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Kuzatuv muddati (kun)</label>
              <input name="follow_up_days" type="number" min={1} defaultValue={7} className="field" />
            </div>
            <div>
              <label className="label">Oilaviy shifokor (ixtiyoriy)</label>
              <select name="assigned_family_doctor_id" className="field">
                <option value="">Avtomatik (hudud bo'yicha)</option>
                {familyDoctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saqlanmoqda..." : "Chiqarish va yo'naltirish"}
        </button>
        <a href="/dashboard/discharges" className="btn-secondary">
          Bekor qilish
        </a>
      </div>
    </form>
  );
}
