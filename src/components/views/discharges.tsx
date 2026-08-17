"use client";

import { useMemo, useState } from "react";
import {
  AddRounded,
  CheckCircleRounded,
  ContentPasteSearchRounded,
  ErrorOutlineRounded,
  LocalHospitalRounded,
  MonitorHeartRounded,
  SearchRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useData } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import DischargeDialog from "@/components/discharge/DischargeDialog";

export function Discharges() {
  const { profile, patients, discharges, followUps, medications } = useData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const scopeClinic = profile?.role === "super_admin" ? null : profile?.clinic_id;
  const rows = useMemo(() => discharges.filter((item) => !scopeClinic || item.clinic_id === scopeClinic).filter((item) => {
    const patient = patients.find((candidate) => candidate.id === item.patient_id);
    return `${patient?.full_name ?? ""} ${item.diagnosis ?? ""} ${item.summary ?? ""}`.toLowerCase().includes(query.toLowerCase());
  }), [discharges, patients, scopeClinic, query]);

  const completion = rows.filter((item) => followUps.find((followUp) => followUp.discharge_id === item.id)?.status === "completed").length;
  const waiting = rows.filter((item) => { const followUp = followUps.find((value) => value.discharge_id === item.id); return !followUp || ["pending", "in_progress"].includes(followUp.status); }).length;
  const issues = rows.filter((item) => followUps.find((followUp) => followUp.discharge_id === item.id)?.status === "overdue").length;
  const patientName = (id: string) => patients.find((patient) => patient.id === id)?.full_name ?? "Bemor";

  return <Stack spacing={3}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5, flexDirection: { xs: "column", sm: "row" } }}><Box><Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Chiqarish</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Statsionardan uyga — davolash rejasini uzluksiz davom ettiring</Typography></Box><Button variant="contained" size="large" startIcon={<AddRounded />} onClick={() => setOpen(true)}>Chiqarishni rasmiylashtirish</Button></Box>

    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 4 }}><TinyMetric title="Jami chiqarish" value={rows.length} icon={<LocalHospitalRounded />} color="#155EEF" tint="#EFF4FF" /></Grid>
      <Grid size={{ xs: 12, sm: 4 }}><TinyMetric title="Muvaffaqiyatli yakunlangan" value={completion} icon={<CheckCircleRounded />} color="#12B76A" tint="#ECFDF3" /></Grid>
      <Grid size={{ xs: 12, sm: 4 }}><TinyMetric title="Faol care rejasi" value={waiting} icon={<MonitorHeartRounded />} color="#F79009" tint="#FFFAEB" detail={issues ? `${issues} ta diqqat talab qiladi` : "Hammasi nazorat ostida"} error={Boolean(issues)} /></Grid>
    </Grid>

    <Card><CardContent sx={{ p: { xs: 1.75, sm: 2 } }}><TextField fullWidth value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bemor, tashxis yoki xulosa bo‘yicha qidirish…" InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: "#98A2B3" }} /></InputAdornment> }} /></CardContent></Card>

    {rows.length === 0 ? <Card><CardContent sx={{ py: 8, textAlign: "center" }}><ContentPasteSearchRounded sx={{ color: "#98A2B3", fontSize: 38 }} /><Typography variant="h6" sx={{ mt: 1.5 }}>Chiqarish topilmadi</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Bemor profilidan yoki shu sahifadan yangi chiqarish yarating.</Typography><Button variant="outlined" sx={{ mt: 2 }} onClick={() => setOpen(true)}>Yangi chiqarish</Button></CardContent></Card> : <Stack spacing={1.5}>{rows.map((item) => {
      const followUp = followUps.find((value) => value.discharge_id === item.id);
      const status = followUp?.status ?? "pending";
      const result = status === "completed" ? { label: "Muvaffaqiyatli", color: "success" as const, icon: <CheckCircleRounded /> } : status === "overdue" ? { label: "Diqqat kerak", color: "error" as const, icon: <ErrorOutlineRounded /> } : { label: "Davom etyapti", color: "warning" as const, icon: <MonitorHeartRounded /> };
      const meds = medications.filter((medicine) => medicine.patient_id === item.patient_id).length;
      return <Card key={item.id}><CardContent sx={{ p: { xs: 2, sm: 2.5 } }}><Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between"><Stack direction="row" spacing={1.3} alignItems="flex-start"><Avatar sx={{ bgcolor: "#F4EBFF", color: "#6938EF", borderRadius: 2.75 }}><LocalHospitalRounded /></Avatar><Box><Stack direction="row" flexWrap="wrap" gap={1} alignItems="center"><Typography variant="subtitle1">{patientName(item.patient_id)}</Typography><Chip size="small" color={result.color} icon={result.icon} label={result.label} /></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: .35 }}>{formatDate(item.discharge_date)} · {item.diagnosis || "Tashxis ko‘rsatilmagan"}</Typography></Box></Stack><Stack direction="row" spacing={.75} alignItems="center"><Chip size="small" icon={<MonitorHeartRounded />} label={item.requires_follow_up ? `${item.follow_up_days ?? 7} kunlik kuzatuv` : "Kuzatuv belgilanmagan"} sx={{ bgcolor: "#F2F4F7", color: "#475467" }} /><Chip size="small" icon={<CheckCircleRounded />} label={`${meds} dori rejasi`} sx={{ bgcolor: "#EFF4FF", color: "#175CD3" }} /></Stack></Stack><Grid container spacing={2} sx={{ mt: 2 }}><Grid size={{ xs: 12, md: 6 }}><Detail title="Davolash yakuni" value={item.summary || "Kiritilmagan"} /></Grid><Grid size={{ xs: 12, md: 6 }}><Detail title="Tavsiyalar" value={item.recommendations || "Kiritilmagan"} /></Grid></Grid>{followUp && <Box sx={{ mt: 2, px: 1.5, py: 1.2, borderRadius: 2, bgcolor: result.color === "error" ? "#FEF3F2" : result.color === "success" ? "#ECFDF3" : "#FFFAEB" }}><Stack direction="row" spacing={1} alignItems="center"><MonitorHeartRounded fontSize="small" color={result.color} /><Typography variant="caption" sx={{ color: "#344054", fontWeight: 700 }}>{followUp.status === "completed" ? followUp.result_notes || "Kuzatuv muvaffaqiyatli yakunlangan" : `Keyingi care nuqtasi: ${formatDate(followUp.due_date)}`}</Typography></Stack></Box>}</CardContent></Card>;
    })}</Stack>}

    <DischargeDialog open={open} onClose={() => setOpen(false)} />
  </Stack>;
}

function TinyMetric({ title, value, icon, color, tint, detail, error }: { title: string; value: number; icon: React.ReactNode; color: string; tint: string; detail?: string; error?: boolean }) { return <Card><CardContent sx={{ p: 2.2 }}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="body2" color="text.secondary" fontWeight={700}>{title}</Typography><Typography sx={{ mt: .4, fontSize: 31, lineHeight: 1, color: "#101828", fontWeight: 800, letterSpacing: "-.05em" }}>{value}</Typography></Box><Avatar sx={{ bgcolor: tint, color, borderRadius: 2.5 }}>{icon}</Avatar></Stack><Typography variant="caption" sx={{ display: "block", mt: 1.4, color: error ? "#B42318" : "#667085", fontWeight: error ? 700 : 500 }}>{detail || "Oxirgi 30 kun bo‘yicha"}</Typography></CardContent></Card>; }
function Detail({ title, value }: { title: string; value: string }) { return <Box><Typography variant="caption" color="text.secondary" fontWeight={700}>{title}</Typography><Typography variant="body2" sx={{ mt: .35, color: "#475467", lineHeight: 1.55 }}>{value}</Typography></Box>; }
