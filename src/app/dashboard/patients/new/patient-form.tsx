"use client";

import { useActionState } from "react";
import type { Region } from "@/lib/types";

export function PatientForm({
  action,
  regions,
}: {
  action: (f: FormData) => Promise<{ error?: string } | void>;
  regions: Region[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) =>
      (await action(formData)) ?? null,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label">To&lsquo;liq ism *</label>
        <input name="full_name" required className="field" placeholder="Alisher Karimov" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">JSHSHIR (PINFL)</label>
          <input name="pinfl" className="field" placeholder="14 raqamli" maxLength={14} />
        </div>
        <div>
          <label className="label">Tug&lsquo;ilgan sana</label>
          <input name="birth_date" type="date" className="field" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Jinsi</label>
          <select name="gender" className="field">
            <option value="">Tanlanmagan</option>
            <option value="male">Erkak</option>
            <option value="female">Ayol</option>
            <option value="other">Boshqa</option>
          </select>
        </div>
        <div>
          <label className="label">Yashash hududi</label>
          <select name="region_id" className="field">
            <option value="">Tanlanmagan</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Telefon (ixtiyoriy)</label>
          <input name="phone" className="field" placeholder="+998 XX XXX XX XX" />
        </div>
        <div>
          <label className="label">Favqulodda aloqa raqami</label>
          <input name="emergency_contact" className="field" placeholder="Qarindosh telefoni" />
        </div>
      </div>

      <div>
        <label className="label">Manzil</label>
        <input name="address" className="field" placeholder="Qishloq, ko'cha, uy" />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saqlanmoqda..." : "Saqlash"}
        </button>
        <a href="/dashboard/patients" className="btn-secondary">
          Bekor qilish
        </a>
      </div>
    </form>
  );
}
