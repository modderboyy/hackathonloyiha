"use client";

import { useMemo, useState } from "react";
import {
  CheckCircleRounded,
  ErrorOutlineRounded,
  MonitorHeartRounded,
  MoreTimeRounded,
  PhoneInTalkRounded,
  SearchRounded,
  SmartToyRounded,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useData } from "@/lib/data";
import type { FollowUp } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

export function FollowUps() {
  const { profile, patients, followUps, checkins, chatMessages, completeFollowUp } = useData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<FollowUp | null>(null);
  const scopeClinic = profile?.role === "super_admin" ? null : profile?.clinic_id;
  const rows = useMemo(() => followUps.filter((followUp) => !scopeClinic || followUp.clinic_id === scopeClinic).filter((followUp) => {
    const patient = patients.find((candidate) => candidate.id === followUp.patient_id);
    return (filter === "all" || followUp.status === filter) && `${patient?.full_name ?? ""} ${followUp.result_notes ?? ""}`.toLowerCase().includes(query.toLowerCase());
  }), [followUps, scopeClinic, filter, patients, query]);
  const patientName = (id: string) => patients.find((patient) => patient.id === id)?.full_name ?? "Bemor";
  const urgent = rows.filter((item) => item.status === "overdue" || new Date(item.due_date) < new Date()).length;
  const active = rows.filter((item) => ["pending", "in_progress"].includes(item.status)).length;

  return <Stack spacing={3}>
    <Box><Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Kuzatuvlar</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Bemor home care jarayoni va mobile monitoring signalari</Typography></Box>
    <Grid container spacing={2}><Grid size={{ xs: 12, sm: 4 }}><FollowMetric title="Faol kuzatuvlar" value={active} color="#155EEF" tint="#EFF4FF" icon={<MonitorHeartRounded />} /></Grid><Grid size={{ xs: 12, sm: 4 }}><FollowMetric title="Yakunlangan" value={rows.filter((item) => item.status === "completed").length} color="#12B76A" tint="#ECFDF3" icon={<CheckCircleRounded />} /></Grid><Grid size={{ xs: 12, sm: 4 }}><FollowMetric title="Diqqat talab qiladi" value={urgent} color="#F04438" tint="#FEF3F2" icon={<ErrorOutlineRounded />} /></Grid></Grid>
    <Card><CardContent sx={{ p: { xs: 1.75, sm: 2 } }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField fullWidth placeholder="Bemor yoki kuzatuv natijasi bo‘yicha qidirish…" value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: "#98A2B3" }} /></InputAdornment> }} /><TextField select value={filter} onChange={(event) => setFilter(event.target.value)} sx={{ width: { xs: "100%", sm: 190 } }}><MenuItem value="all">Barcha holatlar</MenuItem><MenuItem value="pending">Kutilmoqda</MenuItem><MenuItem value="in_progress">Jarayonda</MenuItem><MenuItem value="completed">Yakunlangan</MenuItem><MenuItem value="overdue">Muddat o‘tgan</MenuItem></TextField></Stack></CardContent></Card>
    {rows.length === 0 ? <Card><CardContent sx={{ py: 8, textAlign: "center" }}><MoreTimeRounded sx={{ color: "#98A2B3", fontSize: 40 }} /><Typography variant="h6" sx={{ mt: 1 }}>Kuzatuv topilmadi</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Chiqarish yakunlanganda follow-up vazifasi avtomatik paydo bo‘ladi.</Typography></CardContent></Card> : <Stack spacing={1.5}>{rows.map((followUp) => <FollowCard key={followUp.id} followUp={followUp} patientName={patientName(followUp.patient_id)} checkins={checkins} chats={chatMessages} onComplete={() => setSelected(followUp)} />)}</Stack>}
    {selected && <CompleteDialog followUp={selected} patientName={patientName(selected.patient_id)} onClose={() => setSelected(null)} onComplete={completeFollowUp} />}
  </Stack>;
}

function FollowCard({ followUp, patientName, checkins, chats, onComplete }: { followUp: FollowUp; patientName: string; checkins: { client_id: string; status: string; created_at: string; ai_message: string | null }[]; chats: { client_id: string; content: string; created_at: string }[]; onComplete: () => void }) {
  const late = followUp.status === "overdue" || (followUp.status !== "completed" && new Date(followUp.due_date) < new Date());
  const latestCheckin = checkins[0];
  const latestChat = chats[0];
  const status = followUp.status === "completed" ? { label: "Yakunlangan", color: "success" as const } : late ? { label: "Diqqat kerak", color: "error" as const } : followUp.status === "in_progress" ? { label: "Jarayonda", color: "info" as const } : { label: "Kutilmoqda", color: "warning" as const };
  return <Card><CardContent sx={{ p: { xs: 2, sm: 2.5 } }}><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}><Stack direction="row" spacing={1.25}><Avatar sx={{ bgcolor: late ? "#FEF3F2" : "#EFF4FF", color: late ? "#F04438" : "#155EEF", fontWeight: 800 }}>{patientName.split(" ").map((part) => part[0]).join("").slice(0, 2)}</Avatar><Box><Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}><Typography variant="subtitle1">{patientName}</Typography><Chip size="small" color={status.color} label={status.label} /></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: .35 }}>Kuzatuv muddati: <b>{formatDate(followUp.due_date)}</b></Typography>{followUp.next_step && <Typography variant="caption" color="text.secondary">Keyingi qadam: {followUp.next_step}</Typography>}</Box></Stack>{followUp.status !== "completed" && <Button variant={late ? "contained" : "outlined"} color={late ? "error" : "primary"} startIcon={<CheckCircleRounded />} onClick={onComplete}>Natijani qayd etish</Button>}</Stack>
    <Grid container spacing={1.25} sx={{ mt: 2.25 }}><Grid size={{ xs: 12, sm: 4 }}><MonitoringTile icon={<MonitorHeartRounded />} label="Oxirgi AI check-in" value={latestCheckin ? checkinLabel(latestCheckin.status) : "Signal kutilmoqda"} detail={latestCheckin ? formatDateTime(latestCheckin.created_at) : "Mobile ilova orqali"} tone={latestCheckin?.status === "answered_bad" ? "error" : "info"} /></Grid><Grid size={{ xs: 12, sm: 4 }}><MonitoringTile icon={<SmartToyRounded />} label="AI suhbat" value={latestChat ? "Faol muloqot" : "Hali xabar yo‘q"} detail={latestChat?.content || "Bemor chat tarixi shu yerda ko‘rinadi"} tone="secondary" /></Grid><Grid size={{ xs: 12, sm: 4 }}><MonitoringTile icon={<PhoneInTalkRounded />} label="Tibbiyot xodimi" value={followUp.status === "completed" ? "Natija qabul qilindi" : "Baholash kutilmoqda"} detail={followUp.result_notes || "Care koordinatsiyasi davom etmoqda"} tone={late ? "error" : "success"} /></Grid></Grid>
    {followUp.result_notes && <Box sx={{ mt: 1.75, p: 1.35, borderRadius: 2.25, bgcolor: "#ECFDF3" }}><Typography variant="caption" color="success.dark" fontWeight={750}>KO‘RIK NATIJASI</Typography><Typography variant="body2" sx={{ mt: .35, color: "#344054" }}>{followUp.result_notes}</Typography></Box>}
  </CardContent></Card>;
}

function FollowMetric({ title, value, icon, color, tint }: { title: string; value: number; icon: React.ReactNode; color: string; tint: string }) { return <Card><CardContent sx={{ p: 2.15 }}><Stack direction="row" justifyContent="space-between"><Box><Typography variant="body2" color="text.secondary" fontWeight={700}>{title}</Typography><Typography sx={{ mt: .45, fontSize: 31, fontWeight: 800, lineHeight: 1, letterSpacing: "-.05em" }}>{value}</Typography></Box><Avatar sx={{ bgcolor: tint, color, borderRadius: 2.5 }}>{icon}</Avatar></Stack></CardContent></Card>; }
function MonitoringTile({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: "error" | "info" | "secondary" | "success" }) { const tones = { error: ["#FEF3F2", "#F04438"], info: ["#EFF8FF", "#2E90FA"], secondary: ["#F4EBFF", "#7A5AF8"], success: ["#ECFDF3", "#12B76A"] }; const [bg, color] = tones[tone]; return <Box sx={{ p: 1.35, borderRadius: 2.5, bgcolor: "#F9FAFB", minHeight: 91 }}><Stack direction="row" spacing={.85} alignItems="center"><Avatar sx={{ width: 28, height: 28, bgcolor: bg, color, borderRadius: 2 }}>{icon}</Avatar><Typography variant="caption" color="text.secondary" fontWeight={700}>{label}</Typography></Stack><Typography variant="body2" sx={{ mt: .9, fontWeight: 750, color: "#344054" }}>{value}</Typography><Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: .25, overflow: "hidden", textOverflow: "ellipsis" }}>{detail}</Typography></Box>; }

function CompleteDialog({ followUp, patientName, onClose, onComplete }: { followUp: FollowUp; patientName: string; onClose: () => void; onComplete: (id: string, notes: string, next: string) => Promise<string | null> }) {
  const [notes, setNotes] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() { if (!notes.trim()) { setError("Ko‘rik natijasini kiriting."); return; } setBusy(true); const result = await onComplete(followUp.id, notes, next); setBusy(false); if (result) setError(result); else onClose(); }
  return <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}><DialogTitle sx={{ pb: 1.5 }}><Typography variant="h6" component="div">Kuzatuv natijasi — {patientName}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Bu natija bemor care timeline’iga saqlanadi.</Typography></DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField required multiline minRows={4} label="Ko‘rik natijasi" placeholder="Bemorning holati, o‘lchovlari, shikoyatlari va qilingan choralarni yozing…" value={notes} onChange={(event) => setNotes(event.target.value)} /><TextField label="Keyingi qadam" placeholder="Masalan: 7 kundan so‘ng qayta aloqa" value={next} onChange={(event) => setNext(event.target.value)} />{error && <Alert severity="error">{error}</Alert>}</Stack></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button color="inherit" onClick={onClose}>Bekor qilish</Button><Button variant="contained" onClick={submit} disabled={busy}>{busy ? "Saqlanmoqda…" : "Kuzatuvni yakunlash"}</Button></DialogActions></Dialog>;
}
function checkinLabel(value: string) { return ({ answered_fine: "Bemor: yaxshiman", answered_bad: "Bemor: yordam kerak", locked: "Shoshilinch signal", escalated: "Kuchaytirilgan signal", sent: "Javob kutilmoqda", sms_sent: "SMS yuborilgan" } as Record<string, string>)[value] || "Holat noma’lum"; }
