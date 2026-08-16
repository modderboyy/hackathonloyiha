import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  const unread = notifications?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Xabarnomalar</h1>
        <p className="mt-1 text-sm text-slate-500">
          {unread > 0 ? `${unread} ta o'qilmagan xabarnoma` : "Barcha xabarnomalar o'qilgan"}
        </p>
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n: Notification) => (
            <div
              key={n.id}
              className={`card flex items-start justify-between gap-4 ${n.is_read ? "" : "border-teal-300 bg-teal-50/50"}`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-xl">{typeIcon(n.type)}</span>
                <div>
                  <p className="font-semibold text-slate-900">{n.title}</p>
                  <p className="text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
              {!n.is_read && <span className="badge bg-teal-100 text-teal-700">Yangi</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-slate-500">Xabarnomalar yo&lsquo;q.</p>
        </div>
      )}
    </div>
  );
}

function typeIcon(type: string): string {
  const map: Record<string, string> = {
    info: "ℹ️",
    follow_up: "📋",
    discharge: "🏥",
    alert: "⚠️",
  };
  return map[type] ?? "🔔";
}
