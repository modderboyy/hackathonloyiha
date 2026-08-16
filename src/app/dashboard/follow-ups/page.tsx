import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { CompleteFollowUp } from "./complete-follow-up";
import type { FollowUp } from "@/lib/types";

export default async function FollowUpsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("*, patients(full_name)")
    .order("due_date", { ascending: true });

  const pending = followUps?.filter((f) => f.status === "pending" || f.status === "in_progress") ?? [];
  const completed = followUps?.filter((f) => f.status === "completed") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kuzatuvlar (Follow-up)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Bemorlarning keyingi ko&lsquo;rik rejalari va natijalari
        </p>
      </div>

      {/* Kutilayotgan */}
      <section>
        <h2 className="mb-3 font-semibold text-slate-900">
          Kutilayotgan ({pending.length})
        </h2>
        {pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((f: FollowUp & { patients?: { full_name: string } | null }) => (
              <div key={f.id} className="card flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{f.patients?.full_name}</p>
                  <p className="text-sm text-slate-500">Muddat: {formatDate(f.due_date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={f.status} />
                  <CompleteFollowUp followUpId={f.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Kutilayotgan kuzatuvlar yo&lsquo;q.</p>
        )}
      </section>

      {/* Yakunlangan */}
      <section>
        <h2 className="mb-3 font-semibold text-slate-900">
          Yakunlangan ({completed.length})
        </h2>
        {completed.length > 0 ? (
          <div className="space-y-3">
            {completed.map((f: FollowUp & { patients?: { full_name: string } | null }) => (
              <div key={f.id} className="card">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{f.patients?.full_name}</p>
                  <StatusBadge status={f.status} />
                </div>
                {f.result_notes && <p className="mt-2 text-sm text-slate-600">{f.result_notes}</p>}
                {f.next_step && (
                  <p className="mt-1 text-sm text-slate-500">
                    <span className="font-medium">Keyingi qadam:</span> {f.next_step}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Yakunlangan kuzatuvlar yo&lsquo;q.</p>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Kutilmoqda", cls: "bg-amber-100 text-amber-700" },
    in_progress: { label: "Jarayonda", cls: "bg-blue-100 text-blue-700" },
    completed: { label: "Yakunlandi", cls: "bg-green-100 text-green-700" },
    overdue: { label: "Muddati o'tdi", cls: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-600" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
