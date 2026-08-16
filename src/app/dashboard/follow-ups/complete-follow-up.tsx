"use client";

import { useState } from "react";
import { completeFollowUpAction } from "@/lib/actions/discharge";

export function CompleteFollowUp({ followUpId }: { followUpId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("id", followUpId);
    const result = await completeFollowUpAction(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        Natijani qayd etish
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">Kuzatuv natijasi</h3>
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div>
                <label className="label">Ko&lsquo;rik natijasi</label>
                <textarea name="result_notes" rows={3} className="field" placeholder="Bemor holati, o'lchovlar..." />
              </div>
              <div>
                <label className="label">Keyingi qadam</label>
                <input name="next_step" className="field" placeholder="Masalan: 1 oydan keyin qayta ko'rik" />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={pending} className="btn-primary flex-1">
                  {pending ? "Saqlanmoqda..." : "Yakunlash"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Yopish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
