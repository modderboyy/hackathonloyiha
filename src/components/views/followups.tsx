"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { SearchInput, Badge, Modal, Field, Textarea, Input, Select, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { FOLLOWUP_STATUS, type FollowUp } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function FollowUps() {
  const { patients, followUps, profiles, completeFollowUp, checkins, chatMessages } = useData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [completing, setCompleting] = useState<FollowUp | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return followUps.filter((f) => {
      if (statusFilter && f.status !== statusFilter) return false;
      const p = patients.find((x) => x.id === f.patient_id);
      const hay = `${p?.full_name ?? ""} ${f.result_notes ?? ""}`.toLowerCase();
      return !q || hay.includes(q);
    });
  }, [followUps, patients, query, statusFilter]);

  const pname = (id: string) => patients.find((p) => p.id === id)?.full_name ?? "—";
  const dname = (id: string | null) => profiles.find((p) => p.id === id)?.full_name ?? "—";

  // Bemorning monitoring ma'lumotlari (mobil ilova bilan integratsiya)
  // checkins.client_id = profiles.id, profiles.patient_id = bemor
  const monitoring = useMemo(() => {
    return (patientId: string) => {
      const profileRow = profiles.find((p) => p.patient_id === patientId);
      const clientId = profileRow?.id;
      if (!clientId) return { lastCheckin: null, chatCount: 0, lastChat: null };
      const chk = checkins.filter((c) => c.client_id === clientId);
      const chat = chatMessages.filter((c) => c.client_id === clientId);
      return {
        lastCheckin: chk[0] ?? null,
        chatCount: chat.length,
        lastChat: chat[0] ?? null,
      };
    };
  }, [profiles, checkins, chatMessages]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kuzatuvlar</h1>
        <p className="text-sm text-slate-500">Follow-up rejalari va natijalar</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={query} onChange={setQuery} placeholder="Bemor bo'yicha qidirish..." />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-48">
          <option value="">Barcha holatlar</option>
          <option value="pending">Kutilmoqda</option>
          <option value="in_progress">Jarayonda</option>
          <option value="completed">Yakunlandi</option>
          <option value="overdue">Muddati o'tdi</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon="clipboard" title="Kuzatuvlar yo'q" desc="Chiqarish jarayonida kuzatuv avtomatik yaratiladi." />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => {
            const m = monitoring(f.patient_id);
            return (
              <div key={f.id} className="card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{pname(f.patient_id)}</p>
                      <Badge className={FOLLOWUP_STATUS[f.status]?.cls ?? "bg-slate-100 text-slate-600"}>
                        {FOLLOWUP_STATUS[f.status]?.label ?? f.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      Muddat: {formatDate(f.due_date)}
                      {f.family_doctor_id ? ` · ${dname(f.family_doctor_id)}` : ""}
                    </p>
                    {f.result_notes && <p className="mt-1 text-sm text-slate-600">{f.result_notes}</p>}
                    {f.next_step && (
                      <p className="mt-1 text-xs text-slate-500">
                        <span className="font-medium">Keyingi qadam:</span> {f.next_step}
                      </p>
                    )}
                  </div>
                  {f.status !== "completed" && (
                    <button onClick={() => setCompleting(f)} className="btn-primary">
                      <Icon name="check" size={15} /> Natijani qayd etish
                    </button>
                  )}
                </div>

                {/* Monitoring (mobil ilova integratsiyasi) */}
                <div className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-400">Oxirgi tekshiruv</p>
                    {m.lastCheckin ? (
                      <div className="mt-0.5">
                        <span className={checkinTone(m.lastCheckin.status)}>
                          {checkinLabel(m.lastCheckin.status)}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">{formatDate(m.lastCheckin.created_at)}</span>
                      </div>
                    ) : (
                      <p className="text-slate-400">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">AI suhbat</p>
                    {m.chatCount > 0 ? (
                      <div className="mt-0.5">
                        <span className="font-medium text-slate-700">{m.chatCount} xabar</span>
                        {m.lastChat && (
                          <p className="line-clamp-1 text-xs text-slate-400">"{m.lastChat.content}"</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Holat darajasi</p>
                    <div className="mt-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={`h-2 w-4 rounded-sm ${i <= level(m) ? "bg-primary-600" : "bg-slate-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completing && (
        <CompleteModal
          followUp={completing}
          onClose={() => setCompleting(null)}
          onSubmit={completeFollowUp}
          onDone={() => setCompleting(null)}
        />
      )}
    </div>
  );
}

function checkinLabel(s: string): string {
  switch (s) {
    case "answered_fine": return "✓ Yaxshiman";
    case "answered_bad": return "⚠ Yomonman";
    case "locked": return "🔒 Qulflangan";
    case "sms_sent": return "📱 SMS yuborilgan";
    case "escalated": return "↑ Kuchaytirilgan";
    default: return "⏳ Kutilmoqda";
  }
}

function checkinTone(s: string): string {
  switch (s) {
    case "answered_fine": return "font-medium text-emerald-600";
    case "answered_bad": return "font-medium text-amber-600";
    case "locked": return "font-medium text-red-600";
    default: return "font-medium text-slate-500";
  }
}

function level(m: { lastCheckin: { status: string } | null; chatCount: number }): number {
  if (!m.lastCheckin) return m.chatCount > 0 ? 2 : 1;
  switch (m.lastCheckin.status) {
    case "answered_fine": return 5;
    case "answered_bad": return 2;
    case "locked": return 1;
    case "sms_sent": return 2;
    case "escalated": return 3;
    default: return 3;
  }
}

function CompleteModal({
  followUp,
  onClose,
  onSubmit,
  onDone,
}: {
  followUp: FollowUp;
  onClose: () => void;
  onSubmit: (id: string, notes: string, next: string) => Promise<string | null>;
  onDone: () => void;
}) {
  const { patients } = useData();
  const [notes, setNotes] = useState("");
  const [next, setNext] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const pname = patients.find((p) => p.id === followUp.patient_id)?.full_name ?? "—";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!notes.trim()) {
      setErr("Ko'rik natijasi majburiy.");
      return;
    }
    setBusy(true);
    const error = await onSubmit(followUp.id, notes, next);
    setBusy(false);
    if (error) setErr(error);
    else onDone();
  }

  return (
    <Modal open onClose={onClose} title={`Kuzatuv natijasi — ${pname}`}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ko'rik natijasi" required>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bemor holati, o'lchovlar..." />
        </Field>
        <Field label="Keyingi qadam" optional>
          <Input value={next} onChange={(e) => setNext(e.target.value)} placeholder="Masalan: 1 oydan keyin qayta ko'rik" />
        </Field>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">Bekor qilish</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Saqlanmoqda..." : "Yakunlash"}</button>
        </div>
      </form>
    </Modal>
  );
}
