"use client";

import { useMemo, useState } from "react";
import {
  AddRounded,
  ArrowForwardRounded,
  CalendarMonthRounded,
  CheckCircleRounded,
  CloseRounded,
  LocalHospitalRounded,
  MedicationRounded,
  MonitorHeartRounded,
  PhoneRounded,
  SearchRounded,
  ShieldRounded,
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
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useData } from "@/lib/data";
import type { Facility, Patient } from "@/lib/types";
import { ageFromBirthDate, formatDate, formatDateTime } from "@/lib/utils";
import DischargeDialog from "@/components/discharge/DischargeDialog";

export function Patients() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { profile, facilities, patients, hospitalizations, followUps, addPatient } = useData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [dischargePatient, setDischargePatient] = useState<Patient | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const scopeClinic = profile?.role === "super_admin" ? null : profile?.clinic_id;

  const rows = useMemo(() => {
    return patients
      .filter((patient) => !scopeClinic || patient.clinic_id === scopeClinic)
      .filter((patient) => {
        const patientStatus = getStatus(patient.id, hospitalizations, followUps);
        const haystack = `${patient.full_name} ${patient.pinfl ?? ""} ${patient.phone ?? ""}`.toLowerCase();
        return (!query.trim() || haystack.includes(query.trim().toLowerCase())) && (status === "all" || patientStatus.key === status);
      });
  }, [patients, scopeClinic, query, status, hospitalizations, followUps]);

  return <Stack spacing={3}>
    <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
      <Box><Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Bemorlar</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{scopeClinic ? "Faqat klinikangizga biriktirilgan bemorlar" : "Klinikalar bo‘yicha barcha saqlangan bemorlar"} · {rows.length} ta</Typography></Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}><Chip icon={<ShieldRounded />} label={scopeClinic ? "Klinika doirasida" : "Super admin ko‘rinishi"} sx={{ bgcolor: "#EFF4FF", color: "#175CD3" }} /><Button variant="contained" startIcon={<AddRounded />} onClick={() => setShowAddPatient(true)}>Bemor qo‘shish</Button></Stack>
    </Box>

    <Card><CardContent sx={{ p: { xs: 1.75, sm: 2 } }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}><TextField fullWidth placeholder="Ism, JSHSHIR yoki telefon bo‘yicha qidirish…" value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: "#98A2B3" }} /></InputAdornment> }} /><TextField select value={status} onChange={(event) => setStatus(event.target.value)} sx={{ width: { xs: "100%", sm: 210 } }}><MenuItem value="all">Barcha holatlar</MenuItem><MenuItem value="stable">Barqaror</MenuItem><MenuItem value="inpatient">Statsionarda</MenuItem><MenuItem value="followup">Kuzatuvda</MenuItem><MenuItem value="attention">Diqqat kerak</MenuItem></TextField></Stack></CardContent></Card>

    {mobile ? <Stack spacing={1.25}>{rows.map((patient) => <PatientMobileRow key={patient.id} patient={patient} hospitalizations={hospitalizations} followUps={followUps} onClick={() => setSelected(patient)} />)}{rows.length === 0 && <Empty />}</Stack> : <TableContainer component={Card}><Table><TableHead><TableRow sx={{ bgcolor: "#FCFCFD" }}><Head>Bemor</Head><Head>JSHSHIR</Head><Head>Yosh</Head><Head>Telefon</Head><Head>Care holati</Head><Head align="right">Amal</Head></TableRow></TableHead><TableBody>{rows.map((patient) => <TableRow hover key={patient.id} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }} onClick={() => setSelected(patient)}><TableCell><Stack direction="row" spacing={1.25} alignItems="center"><PatientAvatar name={patient.full_name} /><Box><Typography variant="body2" fontWeight={750}>{patient.full_name}</Typography><Typography variant="caption" color="text.secondary">{patient.gender === "female" ? "Ayol" : patient.gender === "male" ? "Erkak" : "Jins ko‘rsatilmagan"}</Typography></Box></Stack></TableCell><TableCell><Typography variant="body2" color="text.secondary">{patient.pinfl || "—"}</Typography></TableCell><TableCell><Typography variant="body2" color="text.secondary">{ageFromBirthDate(patient.birth_date)}</Typography></TableCell><TableCell><Typography variant="body2" color="text.secondary">{patient.phone || "—"}</Typography></TableCell><TableCell><StatusChip status={getStatus(patient.id, hospitalizations, followUps)} /></TableCell><TableCell align="right"><Button size="small" endIcon={<ArrowForwardRounded />} onClick={(event) => { event.stopPropagation(); setSelected(patient); }}>Profil</Button></TableCell></TableRow>)}{rows.length === 0 && <TableRow><TableCell colSpan={6}><Empty /></TableCell></TableRow>}</TableBody></Table></TableContainer>}

    {showAddPatient && <NewPatientDialog profileRole={profile?.role ?? "medical_worker"} fixedClinicId={scopeClinic} facilities={facilities} onClose={() => setShowAddPatient(false)} onSave={addPatient} />}
    <PatientDrawer patient={selected} open={Boolean(selected)} onClose={() => setSelected(null)} onDischarge={() => { setDischargePatient(selected); setSelected(null); }} />
    <DischargeDialog open={Boolean(dischargePatient)} onClose={() => setDischargePatient(null)} initialPatientId={dischargePatient?.id} />
  </Stack>;
}

type CareStatus = { key: "stable" | "inpatient" | "followup" | "attention"; label: string; color: "success" | "info" | "warning" | "error" };
function getStatus(patientId: string, hospitalizations: { patient_id: string; status: string }[], followUps: { patient_id: string; status: string }[]): CareStatus {
  if (followUps.some((followUp) => followUp.patient_id === patientId && followUp.status === "overdue")) return { key: "attention", label: "Diqqat kerak", color: "error" };
  if (hospitalizations.some((hospitalization) => hospitalization.patient_id === patientId && hospitalization.status === "active")) return { key: "inpatient", label: "Statsionarda", color: "info" };
  if (followUps.some((followUp) => followUp.patient_id === patientId && ["pending", "in_progress"].includes(followUp.status))) return { key: "followup", label: "Kuzatuvda", color: "warning" };
  return { key: "stable", label: "Barqaror", color: "success" };
}
function StatusChip({ status }: { status: CareStatus }) { return <Chip size="small" label={status.label} color={status.color} variant={status.color === "success" ? "outlined" : "filled"} sx={status.color === "success" ? { bgcolor: "#ECFDF3" } : undefined} />; }
function PatientAvatar({ name }: { name: string }) { const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2); return <Avatar sx={{ bgcolor: "#EFF4FF", color: "#155EEF", fontWeight: 800 }}>{initials}</Avatar>; }
function Head({ children, align }: { children: React.ReactNode; align?: "right" }) { return <TableCell align={align} sx={{ color: "#667085", fontSize: 12, fontWeight: 750, textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid #EAECF0" }}>{children}</TableCell>; }
function Empty() { return <Box sx={{ py: 5, textAlign: "center" }}><SearchRounded sx={{ color: "#98A2B3", fontSize: 30 }} /><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Bu filtr bo‘yicha bemor topilmadi.</Typography></Box>; }

function NewPatientDialog({
  profileRole,
  fixedClinicId,
  facilities,
  onClose,
  onSave,
}: {
  profileRole: string;
  fixedClinicId: string | null | undefined;
  facilities: Facility[];
  onClose: () => void;
  onSave: (patient: Omit<Patient, "id" | "created_at" | "created_by">) => Promise<string | null>;
}) {
  const isSuperAdmin = profileRole === "super_admin";
  const [form, setForm] = useState({
    full_name: "",
    pinfl: "",
    birth_date: "",
    gender: "",
    phone: "",
    address: "",
    emergency_contact: "",
    clinic_id: fixedClinicId ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const clinicName = facilities.find((clinic) => clinic.id === fixedClinicId)?.name ?? "Klinika biriktirilmagan";

  async function save() {
    if (!form.full_name.trim()) { setError("Bemorning to‘liq ism-familiyasi majburiy."); return; }
    if (isSuperAdmin && !form.clinic_id) { setError("Bemorni bog‘lash uchun klinikani tanlang."); return; }
    if (!isSuperAdmin && !fixedClinicId) { setError("Sizning profilingiz klinikaga biriktirilmagan."); return; }
    setBusy(true);
    setError("");
    const result = await onSave({
      full_name: form.full_name.trim(),
      pinfl: form.pinfl.trim() || null,
      birth_date: form.birth_date || null,
      gender: (form.gender || null) as Patient["gender"],
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      emergency_contact: form.emergency_contact.trim() || null,
      clinic_id: isSuperAdmin ? form.clinic_id : fixedClinicId ?? null,
      region_id: null,
      district_id: null,
      neighborhood_id: null,
    });
    setBusy(false);
    if (result) { setError(result); return; }
    onClose();
  }

  return <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
    <DialogTitle><Typography variant="h6">Yangi bemor qo‘shish</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{isSuperAdmin ? "Bemorni kerakli klinikaga biriktiring." : "Bemor avtomatik ravishda sizning klinikangizga biriktiriladi."}</Typography></DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      {isSuperAdmin ? <TextField select required fullWidth label="Klinika" value={form.clinic_id} onChange={(event) => set("clinic_id", event.target.value)}><MenuItem value=""><em>Klinikani tanlang…</em></MenuItem>{facilities.map((clinic) => <MenuItem key={clinic.id} value={clinic.id}>{clinic.name}</MenuItem>)}</TextField> : <TextField disabled fullWidth label="Biriktiriladigan klinika" value={clinicName} helperText="Bemor faqat shu klinika xodimlariga ko‘rinadi" />}
      <TextField required fullWidth label="To‘liq ism-familiya" placeholder="Masalan: Dilnoza Karimova" value={form.full_name} onChange={(event) => set("full_name", event.target.value)} />
      <Grid container spacing={1.5}><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="JSHSHIR (ixtiyoriy)" inputProps={{ maxLength: 14 }} value={form.pinfl} onChange={(event) => set("pinfl", event.target.value.replace(/\D/g, ""))} /></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Tug‘ilgan sana" type="date" value={form.birth_date} onChange={(event) => set("birth_date", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid></Grid>
      <Grid container spacing={1.5}><Grid size={{ xs: 12, sm: 6 }}><TextField select fullWidth label="Jinsi" value={form.gender} onChange={(event) => set("gender", event.target.value)}><MenuItem value="">Ko‘rsatilmagan</MenuItem><MenuItem value="male">Erkak</MenuItem><MenuItem value="female">Ayol</MenuItem><MenuItem value="other">Boshqa</MenuItem></TextField></Grid><Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Telefon" placeholder="+998 90 000 00 00" value={form.phone} onChange={(event) => set("phone", event.target.value)} /></Grid></Grid>
      <TextField fullWidth label="Manzil" placeholder="Turar joy manzili" value={form.address} onChange={(event) => set("address", event.target.value)} />
      <TextField fullWidth label="Favqulodda aloqa" placeholder="Qarindosh telefoni" value={form.emergency_contact} onChange={(event) => set("emergency_contact", event.target.value)} />
      <Alert severity="info" icon={<ShieldRounded />}>Bemor yozuvi klinikaga biriktiriladi. Tibbiyot xodimi faqat o‘z klinikasidagi bemorlarni ko‘ra oladi.</Alert>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack></DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}><Button color="inherit" onClick={onClose} disabled={busy}>Bekor qilish</Button><Button variant="contained" startIcon={<AddRounded />} onClick={save} disabled={busy}>{busy ? "Saqlanmoqda…" : "Bemorni saqlash"}</Button></DialogActions>
  </Dialog>;
}

function PatientMobileRow({ patient, hospitalizations, followUps, onClick }: { patient: Patient; hospitalizations: { patient_id: string; status: string }[]; followUps: { patient_id: string; status: string }[]; onClick: () => void }) { const care = getStatus(patient.id, hospitalizations, followUps); return <Card onClick={onClick} sx={{ cursor: "pointer" }}><CardContent sx={{ p: 1.75 }}><Stack direction="row" spacing={1.25} alignItems="center"><PatientAvatar name={patient.full_name} /><Box flex={1} minWidth={0}><Typography variant="body2" noWrap fontWeight={750}>{patient.full_name}</Typography><Typography variant="caption" color="text.secondary">{ageFromBirthDate(patient.birth_date)} · {patient.phone || "telefon yo‘q"}</Typography></Box><StatusChip status={care} /></Stack></CardContent></Card>; }

function PatientDrawer({ patient, open, onClose, onDischarge }: { patient: Patient | null; open: boolean; onClose: () => void; onDischarge: () => void }) {
  const { discharges, followUps, hospitalizations, medications, clientHealth } = useData();
  if (!patient) return null;
  const latestDischarge = discharges.filter((item) => item.patient_id === patient.id).sort((a, b) => +new Date(b.discharge_date) - +new Date(a.discharge_date))[0];
  const latestFollowUp = followUps.filter((item) => item.patient_id === patient.id).sort((a, b) => +new Date(b.due_date) - +new Date(a.due_date))[0];
  const patientMeds = medications.filter((item) => item.patient_id === patient.id);
  const admissions = hospitalizations.filter((item) => item.patient_id === patient.id);
  const health = clientHealth.find((item) => item.client_id === patient.id);
  const timeline = [
    ...admissions.map((item) => ({ id: `h-${item.id}`, icon: <LocalHospitalRounded />, color: "#155EEF", title: item.status === "active" ? "Statsionar davolanish davom etmoqda" : "Statsionar davolanish", detail: item.diagnosis || "Tashxis kiritilmagan", date: item.admission_date })),
    ...discharges.filter((item) => item.patient_id === patient.id).map((item) => ({ id: `d-${item.id}`, icon: <CheckCircleRounded />, color: "#12B76A", title: "Statsionardan chiqarildi", detail: item.summary || item.diagnosis || "Xulosa kiritilmagan", date: item.discharge_date })),
    ...followUps.filter((item) => item.patient_id === patient.id).map((item) => ({ id: `f-${item.id}`, icon: <MonitorHeartRounded />, color: item.status === "completed" ? "#12B76A" : "#F79009", title: `Kuzatuv: ${item.status === "completed" ? "yakunlangan" : "faol"}`, detail: item.result_notes || item.next_step || "Kuzatuv natijasi kutilmoqda", date: item.completed_at || item.due_date })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 530 }, bgcolor: "#F8FAFC" } }}>
    <Box sx={{ p: { xs: 2, sm: 2.5 }, minHeight: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Stack direction="row" spacing={1.5} alignItems="center"><PatientAvatar name={patient.full_name} /><Box><Typography variant="h6">{patient.full_name}</Typography><Typography variant="caption" color="text.secondary">{ageFromBirthDate(patient.birth_date)} · {patient.pinfl || "JSHSHIR kiritilmagan"}</Typography></Box></Stack><IconButton onClick={onClose}><CloseRounded /></IconButton></Stack>
      <Grid container spacing={1.25} sx={{ mt: 2.5 }}><Grid size={{ xs: 6 }}><InfoCard label="Telefon" value={patient.phone || "—"} icon={<PhoneRounded />} /></Grid><Grid size={{ xs: 6 }}><InfoCard label="Favqulodda aloqa" value={patient.emergency_contact || "—"} icon={<ShieldRounded />} /></Grid></Grid>
      <Button fullWidth variant="contained" size="large" startIcon={<LocalHospitalRounded />} sx={{ mt: 2 }} onClick={onDischarge}>Shu bemorni chiqarish</Button>

      <Section title="Care holati" icon={<MonitorHeartRounded />}>{latestFollowUp ? <Box><Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="body2" fontWeight={750}>{latestFollowUp.status === "completed" ? "Kuzatuv yakunlangan" : "Kuzatuv faol"}</Typography><StatusChip status={getStatus(patient.id, hospitalizations, followUps)} /></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: .75 }}>{latestFollowUp.next_step || latestFollowUp.result_notes || "Keyingi baholash belgilanadi"}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: .75 }}>Muddat: {formatDate(latestFollowUp.due_date)}</Typography></Box> : <Typography variant="body2" color="text.secondary">Hozircha kuzatuv rejalashtirilmagan.</Typography>}</Section>

      <Section title="Oxirgi chiqarish rejasi" icon={<CalendarMonthRounded />}>{latestDischarge ? <Stack spacing={1.25}><DetailLine label="Tashxis" value={latestDischarge.diagnosis || health?.hospital_diagnosis || "—"} /><DetailLine label="Davolash yakuni" value={latestDischarge.summary || health?.treatment_summary || "—"} /><DetailLine label="Tavsiyalar" value={latestDischarge.recommendations || health?.discharge_recommendations || "—"} /></Stack> : <Typography variant="body2" color="text.secondary">Bemor hali statsionardan chiqarilmagan.</Typography>}</Section>

      <Section title={`Dori rejasi · ${patientMeds.length}`} icon={<MedicationRounded />}>{patientMeds.length ? <Stack spacing={1}>{patientMeds.map((medicine) => <Paper key={medicine.id} variant="outlined" sx={{ p: 1.25, borderRadius: 2.5, bgcolor: "#fff" }}><Stack direction="row" spacing={1.15} alignItems="center"><Avatar sx={{ width: 32, height: 32, bgcolor: "#F4EBFF", color: "#7A5AF8" }}><MedicationRounded fontSize="small" /></Avatar><Box flex={1}><Typography variant="body2" fontWeight={750}>{medicine.name} {medicine.dosage ? `· ${medicine.dosage}` : ""}</Typography><Typography variant="caption" color="text.secondary">{medicine.frequency_type === "hourly" ? `Har ${medicine.interval_hours ?? 1} soatda` : `${medicine.times?.join(" · ") || `Kuniga ${medicine.times_per_day ?? 1} mahal`} · ${medicine.duration_days ?? "—"} kun`}</Typography></Box></Stack></Paper>)}</Stack> : <Typography variant="body2" color="text.secondary">Dori rejasi hali kiritilmagan.</Typography>}</Section>

      <Section title="Tibbiy timeline" icon={<MonitorHeartRounded />}>{timeline.length ? <Stack spacing={0} sx={{ position: "relative" }}>{timeline.map((event, index) => <Box key={event.id} sx={{ display: "flex", gap: 1.2, position: "relative", pb: index === timeline.length - 1 ? 0 : 2 }}><Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}><Avatar sx={{ width: 30, height: 30, bgcolor: `${event.color}14`, color: event.color }}>{event.icon}</Avatar>{index !== timeline.length - 1 && <Box sx={{ width: 1, flex: 1, minHeight: 20, bgcolor: "#D0D5DD", my: .5 }} />}</Box><Box sx={{ pt: .25, minWidth: 0 }}><Typography variant="body2" fontWeight={750}>{event.title}</Typography><Typography variant="caption" color="text.secondary">{event.detail}</Typography><Typography variant="caption" sx={{ display: "block", mt: .35, color: "#98A2B3" }}>{formatDateTime(event.date)}</Typography></Box></Box>)}</Stack> : <Typography variant="body2" color="text.secondary">Hali tibbiy voqea yozilmagan.</Typography>}</Section>
    </Box>
  </Drawer>;
}
function InfoCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2.5, bgcolor: "#fff" }}><Stack direction="row" spacing={.75} alignItems="center"><Box sx={{ color: "#667085", display: "grid" }}>{icon}</Box><Box minWidth={0}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={700} noWrap>{value}</Typography></Box></Stack></Paper>; }
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <Card sx={{ mt: 2, borderRadius: 3 }}><CardContent sx={{ p: 2 }}><Stack direction="row" spacing={.8} alignItems="center" sx={{ mb: 1.5, color: "#155EEF" }}>{icon}<Typography variant="subtitle2" color="text.primary">{title}</Typography></Stack>{children}</CardContent></Card>; }
function DetailLine({ label, value }: { label: string; value: string }) { return <Box><Typography variant="caption" sx={{ color: "#667085", fontWeight: 700 }}>{label}</Typography><Typography variant="body2" sx={{ mt: .2, color: "#344054", lineHeight: 1.55 }}>{value}</Typography></Box>; }
