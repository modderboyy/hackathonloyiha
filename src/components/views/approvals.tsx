"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { Badge, Modal, Field, Input, Select, Textarea, EmptyState, Avatar } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ROLE_LABELS, type Approval, type Role } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

const STAFF_ROLES: Role[] = ["medical_worker", "hospital_doctor", "family_doctor"];

const STATUS_META: Record<Approval["status"], { label: string; cls: string }> = {
  pending_region: { label: "Viloyat kutilmoqda", cls: "bg-amber-100 text-amber-700" },
  pending_republic: { label: "Respublika kutilmoqda", cls: "bg-violet-100 text-violet-700" },
  approved: { label: "Tasdiqlandi", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rad etildi", cls: "bg-red-100 text-red-700" },
};

export function Approvals() {
  const { profile, approvals, districts, regions, profiles, submitApproval, decideApproval } = useData();
  const [showNew, setShowNew] = useState(false);

  const role = profile?.role;

  // Ko'rinadigan so'rovlar (rolga qarab)
  const visible = useMemo(() => {
    if (role === "super_admin") return approvals; // hammasi
    if (role === "admin")
      return approvals.filter((a) => a.region_id === profile?.region_id || a.status === "pending_region" && a.region_id === profile?.region_id);
    if (role === "district_admin")
      return approvals.filter((a) => a.district_id === profile?.district_id);
    return approvals.filter((a) => a.submitted_by === profile?.id);
  }, [approvals, role, profile]);

  // Qaysi darajada qaror qabul qilish mumkin
  const canDecideRegion = role === "admin";
  const canDecideRepublic = role === "super_admin";
  const canSubmit = role === "district_admin" || role === "admin";

  const dname = (id: string | null) => districts.find((d) => d.id === id)?.name ?? "—";
  const rname = (id: string | null) => regions.find((r) => r.id === id)?.name ?? "—";
  const uname = (id: string | null) => profiles.find((p) => p.id === id)?.full_name ?? "Noma'lum";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasdiqlash oqimi</h1>
          <p className="text-sm text-slate-500">
            Xodim qo&lsquo;shish va boshqa so&lsquo;rovlar tasdiqlash orqali
          </p>
        </div>
        {canSubmit && (
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Icon name="plus" size={16} /> Xodim qo&lsquo;shish so&lsquo;rovi
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState icon="shield" title="So'rovlar yo'q" desc="Hozircha tasdiqlash kutilayotgan so'rovlar mavjud emas." />
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => (
            <ApprovalCard
              key={a.id}
              approval={a}
              dname={dname}
              rname={rname}
              uname={uname}
              canDecideRegion={canDecideRegion && a.status === "pending_region"}
              canDecideRepublic={canDecideRepublic && a.status === "pending_republic"}
              onDecide={decideApproval}
            />
          ))}
        </div>
      )}

      {showNew && <NewStaffRequestModal onClose={() => setShowNew(false)} onSubmit={submitApproval} onDone={() => setShowNew(false)} />}
    </div>
  );
}

function ApprovalCard({
  approval,
  dname,
  rname,
  uname,
  canDecideRegion,
  canDecideRepublic,
  onDecide,
}: {
  approval: Approval;
  dname: (id: string | null) => string;
  rname: (id: string | null) => string;
  uname: (id: string | null) => string;
  canDecideRegion: boolean;
  canDecideRepublic: boolean;
  onDecide: (id: string, level: "region" | "republic", decision: "approve" | "reject") => Promise<string | null>;
}) {
  const payload = approval.payload as Record<string, string | undefined>;
  const [busy, setBusy] = useState(false);

  async function decide(decision: "approve" | "reject") {
    setBusy(true);
    const level = canDecideRepublic ? "republic" : "region";
    await onDecide(approval.id, level, decision);
    setBusy(false);
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{approval.title}</p>
            <Badge className={STATUS_META[approval.status].cls}>{STATUS_META[approval.status].label}</Badge>
          </div>
          <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            <p><span className="text-slate-400">Xodim:</span> {payload.full_name ?? "—"}</p>
            <p><span className="text-slate-400">Rol:</span> {payload.role ? ROLE_LABELS[payload.role as Role] : "—"}</p>
            <p><span className="text-slate-400">Viloyat:</span> {rname(approval.region_id)}</p>
            <p><span className="text-slate-400">Tuman:</span> {dname(approval.district_id)}</p>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Yuboruvchi: {uname(approval.submitted_by)} · {formatDateTime(approval.created_at)}
          </p>
        </div>

        {/* Qaror tugmalari */}
        {(canDecideRegion || canDecideRepublic) && (
          <div className="flex gap-2">
            <button
              onClick={() => decide("approve")}
              disabled={busy}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Icon name="check" size={15} /> Tasdiqlash
            </button>
            <button
              onClick={() => decide("reject")}
              disabled={busy}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Icon name="close" size={15} /> Rad etish
            </button>
          </div>
        )}
      </div>

      {/* Qaror tarixi */}
      {(approval.region_decision || approval.republic_decision) && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {approval.region_decision && (
            <p>
              Viloyat: <span className={approval.region_decision === "approve" ? "text-emerald-600" : "text-red-600"}>{approval.region_decision === "approve" ? "tasdiqladi" : "rad etdi"}</span> ({uname(approval.region_decided_by)})
            </p>
          )}
          {approval.republic_decision && (
            <p>
              Respublika: <span className={approval.republic_decision === "approve" ? "text-emerald-600" : "text-red-600"}>{approval.republic_decision === "approve" ? "tasdiqladi" : "rad etdi"}</span> ({uname(approval.republic_decided_by)})
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NewStaffRequestModal({
  onClose,
  onSubmit,
  onDone,
}: {
  onClose: () => void;
  onSubmit: (a: { type: Approval["type"]; title: string; payload: Record<string, unknown>; district_id?: string | null; region_id?: string | null }) => Promise<string | null>;
  onDone: () => void;
}) {
  const { profile, districts, regions } = useData();
  const myDistricts = profile?.district_id ? districts.filter((d) => d.id === profile.district_id) : districts;
  const myRegionId = profile?.region_id ?? (myDistricts[0]?.region_id ?? null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("medical_worker");
  const [districtId, setDistrictId] = useState(profile?.district_id ?? "");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setErr("Ism majburiy.");
      return;
    }
    setBusy(true);
    const error = await onSubmit({
      type: "staff_join",
      title: `Xodim qo'shish: ${fullName}`,
      payload: { full_name: fullName, phone, role, note },
      district_id: districtId || null,
      region_id: myRegionId,
    });
    setBusy(false);
    if (error) setErr(error);
    else onDone();
  }

  return (
    <Modal open onClose={onClose} title="Xodim qo'shish so'rovi" wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p className="flex items-center gap-2 font-medium">
            <Icon name="info" size={15} /> Tasdiqlash oqimi
          </p>
          <p className="mt-1 text-xs">
            So&lsquo;rov avval <b>viloyat</b>ga boradi. Viloyat tasdiqlasa tugaydi; rad etsa{" "}
            <b>respublika</b>ga o&lsquo;tadi, respublika ham rad etsa rad etiladi.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="To'liq ism" required>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dilnoza Karimova" />
          </Field>
          <Field label="Telefon" optional>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 000 00 00" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rol" required>
            <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tuman" required>
            <Select value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
              <option value="">Tanlang...</option>
              {myDistricts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Izoh" optional>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qo'shimcha ma'lumot..." />
        </Field>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">Bekor qilish</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? "Yuborilmoqda..." : "So'rov yuborish"}</button>
        </div>
      </form>
    </Modal>
  );
}
