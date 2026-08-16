"use client";

import { useActionState } from "react";

export function LoginForm({ action }: { action: (f: FormData) => Promise<{ error?: string } | void> }) {
  const [state, formAction, pending] = useActionState(async (_prev: { error?: string } | null, formData: FormData) => {
    return (await action(formData)) ?? null;
  }, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required className="field" placeholder="doctor@carelink.uz" />
      </div>
      <div>
        <label htmlFor="password" className="label">Parol</label>
        <input id="password" name="password" type="password" required className="field" placeholder="••••••••" />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
        {pending ? "Kirilmoqda..." : "Kirish"}
      </button>
    </form>
  );
}
