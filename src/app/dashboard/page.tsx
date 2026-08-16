"use client";

import { useState } from "react";
import { DataProvider, useData } from "@/lib/data";
import { Icon, Logo } from "@/components/icons";
import { ROLE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Overview } from "@/components/views/overview";
import { Patients } from "@/components/views/patients";
import { Discharges } from "@/components/views/discharges";
import { FollowUps } from "@/components/views/followups";
import { Notifications } from "@/components/views/notifications";
import { Admin } from "@/components/views/admin";

type View = "overview" | "patients" | "discharges" | "followups" | "notifications" | "admin";

const NAV: { id: View; label: string; icon: string; adminOnly?: boolean }[] = [
  { id: "overview", label: "Bosh sahifa", icon: "home" },
  { id: "patients", label: "Bemorlar", icon: "users" },
  { id: "discharges", label: "Chiqarish", icon: "bed" },
  { id: "followups", label: "Kuzatuvlar", icon: "clipboard" },
  { id: "notifications", label: "Xabarnomalar", icon: "bell" },
  { id: "admin", label: "Boshqaruv", icon: "shield", adminOnly: true },
];

export default function DashboardPage() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}

function Shell() {
  const [view, setView] = useState<View>("overview");
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const data = useData();

  const { ready, notConfigured, profile, notifications } = data;
  const unread = notifications.filter((n) => !n.is_read).length;
  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin";

  function navigate(v: View) {
    setView(v);
    setNavOpen(false);
  }

  // Supabase sozlanmagan
  if (notConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center">
            <Logo size={48} withText />
          </div>
          <h1 className="mt-6 text-xl font-bold text-slate-900">Supabase sozlanmagan</h1>
          <p className="mt-2 text-sm text-slate-500">
            Real rejimda ishlash uchun <code className="rounded bg-slate-100 px-1">.env.local</code> faylini
            to&lsquo;ldiring:
          </p>
          <div className="mt-4 rounded-xl bg-slate-900 p-4 text-left font-mono text-xs text-slate-100">
            <p>NEXT_PUBLIC_SUPABASE_URL=...</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</p>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Keyin <code className="rounded bg-slate-100 px-1">supabase/migrations/00001_init.sql</code> ni
            SQL editor&apos;da ishga tushiring va serverni qayta yuklang.
          </p>
        </div>
      </div>
    );
  }

  // Yuklanmoqda
  if (!ready || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700" />
          <p className="text-sm text-slate-500">Ma&lsquo;lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const nav = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="flex min-h-screen">
      {/* Overlay (mobil) */}
      {navOpen && <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
          <Logo size={34} withText />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                view === n.id ? "bg-primary-50 text-primary-800" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon name={n.icon} size={18} gradient={view === n.id} />
              <span className="flex-1 text-left">{n.label}</span>
              {n.id === "notifications" && unread > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-800 font-semibold text-white">
              {(profile.full_name || "?").charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{profile.full_name}</p>
              <p className="truncate text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Asosiy kontent */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            onClick={() => setNavOpen(true)}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Menyu"
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
              {NAV.find((n) => n.id === view)?.label}
            </h2>
          </div>
          <button
            onClick={() => navigate("notifications")}
            className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
            aria-label="Xabarnomalar"
          >
            <Icon name="bell" size={20} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">
          <div key={view} className="view-enter mx-auto max-w-6xl">
            {view === "overview" && (
              <Overview onRegionSelect={(rid) => { setRegionFilter(rid); setView("patients"); }} />
            )}
            {view === "patients" && (
              <Patients regionFilter={regionFilter} onClearRegion={() => setRegionFilter(null)} />
            )}
            {view === "discharges" && <Discharges />}
            {view === "followups" && <FollowUps />}
            {view === "notifications" && <Notifications />}
            {view === "admin" && isAdmin && <Admin />}
          </div>
        </main>
      </div>
    </div>
  );
}
