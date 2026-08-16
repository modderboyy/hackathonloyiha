import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { ROLE_LABELS, type FollowUp, type Notification, type Patient } from "@/lib/types";

export default async function DashboardPage() {
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

  const [{ count: patientCount }, { count: followUpCount }, { data: followUps }, { data: notifications }, { data: patients }] =
    await Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true }),
      supabase
        .from("follow_ups")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "in_progress"]),
      supabase
        .from("follow_ups")
        .select("*, patients(full_name)")
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true })
        .limit(5),
      supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Xush kelibsiz, {profile?.full_name || "hamkasb"} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {profile?.role ? ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] : ""} — bugungi holat
        </p>
      </div>

      {/* Statistika */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jami bemorlar" value={patientCount ?? 0} href="/dashboard/patients" />
        <StatCard label="Faol kuzatuvlar" value={followUpCount ?? 0} href="/dashboard/follow-ups" />
        <StatCard label="O'qilmagan xabarlar" value={notifications?.length ?? 0} href="/dashboard/notifications" />
        <StatCard label="Yangi bemorlar" value={patients?.length ?? 0} href="/dashboard/patients" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kuzatuvlar */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Kutilayotgan kuzatuvlar</h2>
            <Link href="/dashboard/follow-ups" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              Barchasi →
            </Link>
          </div>
          {followUps && followUps.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {followUps.map((fu: FollowUp & { patients?: Patient | null }) => (
                <li key={fu.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {(fu as unknown as { patients?: { full_name?: string } }).patients?.full_name ?? "Bemor"}
                    </p>
                    <p className="text-xs text-slate-500">Muddat: {formatDate(fu.due_date)}</p>
                  </div>
                  <StatusBadge status={fu.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Hozircha kutilayotgan kuzatuv yo&lsquo;q.</p>
          )}
        </div>

        {/* Xabarnomalar */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">So&lsquo;nggi xabarnomalar</h2>
            <Link href="/dashboard/notifications" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              Barchasi →
            </Link>
          </div>
          {notifications && notifications.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {notifications.map((n: Notification) => (
                <li key={n.id} className="py-3">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Yangi xabarnomalar yo&lsquo;q.</p>
          )}
        </div>
      </div>

      {/* Tezkor amallar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction href="/dashboard/patients/new" title="Yangi bemor" desc="Bemorni ro'yxatdan o'tkazish" icon="➕" />
        <QuickAction href="/dashboard/discharges/new" title="Chiqarish" desc="Statsionardan chiqarish va yo'naltirish" icon="🏥" />
        <QuickAction href="/dashboard/follow-ups" title="Kuzatuv" desc="Follow-up natijalarini qayd qilish" icon="📋" />
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card block transition hover:border-teal-200 hover:shadow-sm">
      <p className="text-3xl font-bold text-teal-600">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Link>
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

function QuickAction({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link href={href} className="card flex items-center gap-4 transition hover:border-teal-200 hover:shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-xl">{icon}</span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}
