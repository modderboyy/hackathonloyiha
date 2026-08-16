import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { ROLE_LABELS, type AuditEntry, type Profile } from "@/lib/types";
import { RoleEditor } from "./role-editor";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const [{ data: profiles }, { data: audit }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_log").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Boshqaruv paneli</h1>
        <p className="mt-1 text-sm text-slate-500">
          Foydalanuvchi rollari va tizim auditi
        </p>
      </div>

      {/* Foydalanuvchilar */}
      <section className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Foydalanuvchilar</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-medium">Ism</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Rolni o&lsquo;zgartirish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles?.map((p: Profile) => (
                <tr key={p.id}>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-900">{p.full_name || "—"}</p>
                    <p className="text-xs text-slate-400">{p.id.slice(0, 8)}…</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="badge bg-slate-100 text-slate-700">
                      {ROLE_LABELS[p.role]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <RoleEditor profileId={p.id} currentRole={p.role} disabled={p.id === user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit log */}
      <section className="card">
        <h2 className="mb-4 font-semibold text-slate-900">Audit jurnali</h2>
        {audit && audit.length > 0 ? (
          <div className="space-y-2">
            {audit.map((a: AuditEntry & { profiles?: { full_name: string } | null }) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <div className="text-sm">
                  <span className="font-medium text-slate-700">
                    {a.profiles?.full_name ?? "Noma'lum"}
                  </span>{" "}
                  <span className="text-slate-500">
                    — {actionLabel(a.action)} {a.entity}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Audit yozuvlari yo&lsquo;q.</p>
        )}
      </section>
    </div>
  );
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    INSERT: "yaratdi",
    UPDATE: "yangiladi",
    DELETE: "o'chirdi",
  };
  return map[action] ?? action;
}
