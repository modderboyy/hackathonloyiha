"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth";
import { ROLE_LABELS, type Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Bosh sahifa", icon: "🏠" },
  { href: "/dashboard/patients", label: "Bemorlar", icon: "👤" },
  { href: "/dashboard/discharges", label: "Chiqarish", icon: "🏥" },
  { href: "/dashboard/follow-ups", label: "Kuzatuvlar", icon: "📋" },
  { href: "/dashboard/notifications", label: "Xabarnomalar", icon: "🔔" },
];

const ADMIN_NAV = [{ href: "/dashboard/admin", label: "Boshqaruv", icon: "🛡️" }];

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const isAdmin = profile.role === "admin";

  const links = [...NAV, ...(isAdmin ? ADMIN_NAV : [])];

  return (
    <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
          C
        </span>
        <span className="font-bold text-slate-900">CareLink</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              pathname === l.href
                ? "bg-teal-50 text-teal-700"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="mb-3">
          <p className="truncate text-sm font-semibold text-slate-900">
            {profile.full_name || "Foydalanuvchi"}
          </p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Chiqish
          </button>
        </form>
      </div>
    </aside>
  );
}
