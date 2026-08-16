"use client";

import { useActionState } from "react";
import { createVisitAction } from "@/lib/actions/patients";

export function VisitForm({ patientId }: { patientId: string }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await createVisitAction(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="patient_id" value={patientId} />

      <div>
        <label className="label">Asosiy shikoyat</label>
        <textarea name="chief_complaint" rows={2} className="field" placeholder="Bemorning shikoyati..." />
      </div>

      <div>
        <label className="label">Tashxis (ishchi)</label>
        <input name="diagnosis" className="field" placeholder="Masalan: Gipertoniya II daraja" />
      </div>

      {/* Hayotiy ko'rsatkichlar */}
      <div>
        <p className="label">Hayotiy ko&lsquo;rsatkichlar</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500">AB (sistolik)</label>
            <input name="bp_sys" type="number" className="field" placeholder="120" />
          </div>
          <div>
            <label className="text-xs text-slate-500">AB (diastolik)</label>
            <input name="bp_dia" type="number" className="field" placeholder="80" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Puls</label>
            <input name="heart_rate" type="number" className="field" placeholder="72" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Harorat (°C)</label>
            <input name="temperature" type="number" step="0.1" className="field" placeholder="36.6" />
          </div>
          <div>
            <label className="text-xs text-slate-500">SpO₂ (%)</label>
            <input name="spo2" type="number" className="field" placeholder="98" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Vazn (kg)</label>
            <input name="weight" type="number" step="0.1" className="field" placeholder="70" />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Shifokor ko&lsquo;rigi / qo&lsquo;shimcha eslatmalar</label>
        <textarea name="notes" rows={2} className="field" placeholder="Ko'rik natijalari..." />
      </div>

      <div>
        <label className="label">Tavsiyalar / keyingi yo&lsquo;nalish</label>
        <input name="recommendations" className="field" placeholder="Tavsiyalar..." />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saqlanmoqda..." : "Tashrifni saqlash"}
      </button>
    </form>
  );
}
