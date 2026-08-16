"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SearchInput, Badge, Modal, Field, Textarea, Input, Select, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";
import { FOLLOWUP_STATUS, type FollowUp } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function FollowUps() {
  const { patients, followUps, profiles, completeFollowUp } = useStore();
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
          {filtered.map((f) => (
            <div key={f.id} className="card flex flex-wrap items-center justify-between gap-3">
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
          ))}
        </div>
      )}

      {completing && (
        <CompleteModal
          followUp={completing}
          onClose={() => setCompleting(null)}
          onSubmit={(notes, next) => {
            completeFollowUp(completing.id, notes, next);
            setCompleting(null);
          }}
        />
      )}
    </div>
  );
}

function CompleteModal({
  followUp,
  onClose,
  onSubmit,
}: {
  followUp: FollowUp;
  onClose: () => void;
  onSubmit: (notes: string, next: string) => void;
}) {
  const { patients } = useStore();
  const [notes, setNotes] = useState("");
  const [next, setNext] = useState("");
  const pname = patients.find((p) => p.id === followUp.patient_id)?.full_name ?? "—";

  return (
    <Modal open onClose={onClose} title={`Kuzatuv natijasi — ${pname}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(notes, next);
        }}
        className="space-y-4"
      >
        <Field label="Ko'rik natijasi" required>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bemor holati, o'lchovlar..." />
        </Field>
        <Field label="Keyingi qadam" optional>
          <Input value={next} onChange={(e) => setNext(e.target.value)} placeholder="Masalan: 1 oydan keyin qayta ko'rik" />
        </Field>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">Bekor qilish</button>
          <button type="submit" className="btn-primary">Yakunlash</button>
        </div>
      </form>
    </Modal>
  );
}
