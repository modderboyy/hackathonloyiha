"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS, type Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "medical_worker", "hospital_doctor", "family_doctor"];

export function RoleEditor({
  profileId,
  currentRole,
  disabled,
}: {
  profileId: string;
  currentRole: Role;
  disabled?: boolean;
}) {
  const [role, setRole] = useState<Role>(currentRole);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as Role;
    setRole(newRole);
    setSaving(true);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);

    setSaving(false);
    setSaved(!error);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={onChange}
        disabled={disabled || saving}
        className="field max-w-[200px] py-1.5"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {saving && <span className="text-xs text-slate-400">Saqlanmoqda…</span>}
      {saved && <span className="text-xs text-green-600">✓</span>}
    </div>
  );
}
