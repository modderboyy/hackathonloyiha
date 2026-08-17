"use client";

import { useMemo, useState } from "react";
import {
  AddRounded,
  CheckCircleRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  InfoOutlined,
  MedicationRounded,
  NotificationsActiveRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useData, type MedicationScheduleInput, type VitalInput } from "@/lib/data";

const today = () => new Date().toISOString().slice(0, 10);

type MedicationDraft = Required<Pick<MedicationScheduleInput, "name" | "dosage" | "frequencyType" | "timesPerDay" | "intervalHours" | "durationDays" | "startDate" | "times">> & Pick<MedicationScheduleInput, "notes">;

function freshMedication(): MedicationDraft {
  return { name: "", dosage: "", frequencyType: "daily", timesPerDay: 2, intervalHours: 8, durationDays: 30, startDate: today(), times: ["08:00", "20:00"], notes: "" };
}

type VitalDraft = { bp_sys: string; bp_dia: string; heart_rate: string; temperature: string; spo2: string; weight: string };
const blankVitals = (): VitalDraft => ({ bp_sys: "", bp_dia: "", heart_rate: "", temperature: "", spo2: "", weight: "" });
const asOptionalNumber = (value: string) => value.trim() === "" ? null : Number(value);
const normalizeVitals = (draft: VitalDraft): VitalInput => ({
  bp_sys: asOptionalNumber(draft.bp_sys),
  bp_dia: asOptionalNumber(draft.bp_dia),
  heart_rate: asOptionalNumber(draft.heart_rate),
  temperature: asOptionalNumber(draft.temperature),
  spo2: asOptionalNumber(draft.spo2),
  weight: asOptionalNumber(draft.weight),
});

export default function DischargeDialog(props: {
  open: boolean;
  onClose: () => void;
  initialPatientId?: string | null;
  onCompleted?: () => void;
}) {
  // Dialog yopilganda ichki forma unmount bo'ladi. Keyingi ochilishda yangi bemor
  // va yangi sana bilan qayta yaratiladi; state-ni effect orqali reset qilish shart emas.
  if (!props.open) return null;
  return <DischargeDialogInner {...props} />;
}

function DischargeDialogInner({
  open,
  onClose,
  initialPatientId,
  onCompleted,
}: {
  open: boolean;
  onClose: () => void;
  initialPatientId?: string | null;
  onCompleted?: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { patients, addDischarge } = useData();
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [admissionDate, setAdmissionDate] = useState(today());
  const [dischargeDate, setDischargeDate] = useState(today());
  const [diagnosis, setDiagnosis] = useState("");
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [vitals, setVitals] = useState<VitalDraft>(blankVitals());
  const [requiresFollowUp, setRequiresFollowUp] = useState(true);
  const [followUpDays, setFollowUpDays] = useState(14);
  const [medications, setMedications] = useState<MedicationDraft[]>([freshMedication()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const selectedPatient = useMemo(() => patients.find((patient) => patient.id === patientId), [patients, patientId]);

  function patchMedication(index: number, patch: Partial<MedicationDraft>) {
    setMedications((current) => current.map((medicine, itemIndex) => itemIndex === index ? { ...medicine, ...patch } : medicine));
  }

  function updateTimes(index: number, count: number) {
    const safeCount = Math.min(Math.max(count, 1), 6);
    const existing = medications[index]?.times ?? [];
    const defaults = ["08:00", "12:00", "16:00", "20:00", "22:00", "06:00"];
    patchMedication(index, { timesPerDay: safeCount, times: Array.from({ length: safeCount }, (_, timeIndex) => existing[timeIndex] ?? defaults[timeIndex]) });
  }

  async function submit() {
    if (!patientId) { setError("Chiqarish uchun bemorni tanlang."); return; }
    if (!diagnosis.trim()) { setError("Tashxis maydonini to‘ldiring."); return; }
    if (!summary.trim()) { setError("Davolash yakuni (xulosa) majburiy."); return; }
    const invalidMedication = medications.some((medicine) => medicine.name.trim() && (medicine.frequencyType === "daily" ? medicine.times.some((time) => !time) : !medicine.intervalHours));
    if (invalidMedication) { setError("Har bir dori uchun qabul vaqtini yoki intervalini belgilang."); return; }

    setBusy(true);
    setError("");
    const result = await addDischarge({
      patientId,
      admissionDate,
      dischargeDate,
      diagnosis: diagnosis.trim(),
      summary: summary.trim(),
      recommendations: recommendations.trim(),
      requiresFollowUp,
      followUpDays,
      familyDoctorId: null,
      vitals: normalizeVitals(vitals),
      medications: medications.filter((medicine) => medicine.name.trim()).map((medicine) => ({
        name: medicine.name,
        dosage: medicine.dosage,
        notes: medicine.notes,
        frequencyType: medicine.frequencyType,
        timesPerDay: medicine.frequencyType === "daily" ? medicine.timesPerDay : null,
        intervalHours: medicine.frequencyType === "hourly" ? medicine.intervalHours : null,
        durationDays: medicine.durationDays,
        startDate: medicine.startDate || dischargeDate,
        times: medicine.frequencyType === "daily" ? medicine.times : [],
        frequency: medicine.frequencyType === "hourly" ? `Har ${medicine.intervalHours} soatda` : `Kuniga ${medicine.timesPerDay} mahal`,
      })),
    });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    setCode(result.code);
    onCompleted?.();
  }

  if (code) {
    return <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 } } }}>
      <DialogContent sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
        <Box sx={{ width: 64, height: 64, mx: "auto", display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#ECFDF3", color: "#12B76A" }}><CheckCircleRounded sx={{ fontSize: 34 }} /></Box>
        <Typography variant="h5" sx={{ mt: 2.25 }}>Chiqarish muvaffaqiyatli yakunlandi</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.65 }}>{selectedPatient?.full_name ?? "Bemor"} uchun klinik obuna kodi yaratildi. Kod faqat klinika obunasi faol bo‘lganda ishlaydi.</Typography>
        <Box sx={{ mt: 3, p: 2.1, borderRadius: 3, bgcolor: "#101828", color: "#fff", fontFamily: "monospace", fontSize: { xs: 24, sm: 29 }, letterSpacing: ".2em", fontWeight: 800 }}>{code}</Box>
        <Button startIcon={<ContentCopyRounded />} variant="text" onClick={() => navigator.clipboard?.writeText(code)} sx={{ mt: 1.2 }}>Kodni nusxalash</Button>
        <Alert severity="success" icon={<NotificationsActiveRounded />} sx={{ mt: 2.5, textAlign: "left", borderRadius: 2.5 }}>Tashxis, xulosa, tavsiyalar, hayotiy ko‘rsatkichlar va dori rejasi bemor profiliga hamda AI/reminders tizimiga sinxronlandi.</Alert>
        <Button fullWidth variant="contained" size="large" sx={{ mt: 3 }} onClick={onClose}>Tayyor</Button>
      </DialogContent>
    </Dialog>;
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: { xs: 0, sm: 4 }, overflow: "hidden" } }}>
      <DialogTitle sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.25, borderBottom: "1px solid #EAECF0" }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box sx={{ display: "grid", placeItems: "center", width: 40, height: 40, bgcolor: "#EFF4FF", color: "#155EEF", borderRadius: 2.5 }}><MedicationRounded /></Box>
          <Box><Typography variant="h6">Statsionardan chiqarish</Typography><Typography variant="caption" color="text.secondary">Bemor care rejasini mobil ilova bilan sinxronlang</Typography></Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>1. Bemor va statsionar ma’lumoti</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth size="small"><InputLabel id="discharge-patient-label">Bemor</InputLabel><Select labelId="discharge-patient-label" label="Bemor" value={patientId} onChange={(event) => setPatientId(event.target.value)} disabled={Boolean(initialPatientId)}>
                  {!initialPatientId && <MenuItem value=""><em>Bemorni tanlang…</em></MenuItem>}
                  {patients.map((patient) => <MenuItem key={patient.id} value={patient.id}>{patient.full_name} {patient.phone ? `· ${patient.phone}` : ""}</MenuItem>)}
                </Select></FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Statsionarga qabul sanasi" type="date" value={admissionDate} onChange={(event) => setAdmissionDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Chiqarish sanasi" type="date" value={dischargeDate} onChange={(event) => setDischargeDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
            </Grid>
          </Box>

          <Divider />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.25 }}>2. Klinik yakun</Typography>
            <Stack spacing={2}>
              <TextField fullWidth required label="Tashxis" placeholder="Masalan: arterial gipertoniya, II daraja" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} />
              <TextField fullWidth required multiline minRows={3} label="Davolash yakuni / xulosa" placeholder="Statsionardagi davolash natijasi va bemorning chiqarilish paytidagi holati…" value={summary} onChange={(event) => setSummary(event.target.value)} helperText="Bu ma’lumot bemor mobile ilovasidagi AI kontekstiga yuboriladi." />
              <TextField fullWidth multiline minRows={3} label="Tavsiyalar" placeholder="Uy sharoitidagi parvarish, ovqatlanish, faollik va nazorat bo‘yicha tavsiyalar…" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} />
              <VitalsCapture value={vitals} onChange={setVitals} />
            </Stack>
          </Box>

          <Divider />
          <Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mb: 1.5 }}>
              <Box><Typography variant="subtitle2">3. Dori-darmonlar va auto-reminders</Typography><Typography variant="caption" color="text.secondary">Kunlik aniq vaqtlarda yoki belgilangan soat oralig‘ida yuboriladi.</Typography></Box>
              <Button size="small" startIcon={<AddRounded />} onClick={() => setMedications((current) => [...current, freshMedication()])}>Dori qo‘shish</Button>
            </Stack>
            <Stack spacing={1.5}>
              {medications.map((medicine, index) => <MedicationEditor key={index} medicine={medicine} onChange={(patch) => patchMedication(index, patch)} onTimesChange={(count) => updateTimes(index, count)} onRemove={() => setMedications((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : current)} removable={medications.length > 1} />)}
            </Stack>
          </Box>

          <Divider />
          <Box sx={{ p: 2, border: "1px solid #B2DDFF", borderRadius: 3, bgcolor: "#F0F9FF" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
              <FormControlLabel control={<Switch checked={requiresFollowUp} onChange={(event) => setRequiresFollowUp(event.target.checked)} />} label={<Box><Typography variant="body2" fontWeight={750}>Keyingi kuzatuv kerak</Typography><Typography variant="caption" color="text.secondary">Kuzatuvlar bo‘limida avtomatik vazifa yaratiladi.</Typography></Box>} />
              {requiresFollowUp && <TextField size="small" label="Muddat (kun)" type="number" value={followUpDays} inputProps={{ min: 1, max: 365 }} onChange={(event) => setFollowUpDays(Math.max(1, Number(event.target.value) || 1))} sx={{ width: { xs: "100%", sm: 150 } }} />}
            </Stack>
          </Box>
          {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.25, borderTop: "1px solid #EAECF0" }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>Bekor qilish</Button>
        <Button variant="contained" size="large" startIcon={<CheckCircleRounded />} onClick={submit} disabled={busy}>{busy ? "Saqlanmoqda…" : "Chiqarish va sinxronlash"}</Button>
      </DialogActions>
    </Dialog>
  );
}

function VitalsCapture({ value, onChange }: { value: VitalDraft; onChange: (next: VitalDraft) => void }) {
  const patch = (key: keyof VitalDraft, next: string) => onChange({ ...value, [key]: next });
  const fields: { key: keyof VitalDraft; label: string; hint: string; unit: string }[] = [
    { key: "bp_sys", label: "AB sistolik", hint: "120", unit: "mmHg" },
    { key: "bp_dia", label: "AB diastolik", hint: "80", unit: "mmHg" },
    { key: "heart_rate", label: "Puls", hint: "72", unit: "bpm" },
    { key: "temperature", label: "Harorat", hint: "36.6", unit: "°C" },
    { key: "spo2", label: "SpO₂", hint: "98", unit: "%" },
    { key: "weight", label: "Vazn", hint: "70", unit: "kg" },
  ];
  return <Box sx={{ p: 1.75, borderRadius: 2.5, bgcolor: "#F8FAFC", border: "1px solid #EAECF0" }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}><Box sx={{ display: "grid", placeItems: "center", width: 30, height: 30, bgcolor: "#EFF4FF", color: "#155EEF", borderRadius: 2 }}><NotificationsActiveRounded fontSize="small" /></Box><Box><Typography variant="body2" fontWeight={800}>Hayotiy ko‘rsatkichlar</Typography><Typography variant="caption" color="text.secondary">Ixtiyoriy — bemor AI profiliga avtomatik sinxronlanadi.</Typography></Box></Stack>
    <Grid container spacing={1.2}>{fields.map((field) => <Grid key={field.key} size={{ xs: 6, sm: 4 }}><TextField fullWidth size="small" type="number" label={field.label} placeholder={field.hint} value={value[field.key]} onChange={(event) => patch(field.key, event.target.value)} InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">{field.unit}</Typography> }} /></Grid>)}</Grid>
  </Box>;
}

function MedicationEditor({ medicine, onChange, onTimesChange, onRemove, removable }: { medicine: MedicationDraft; onChange: (patch: Partial<MedicationDraft>) => void; onTimesChange: (count: number) => void; onRemove: () => void; removable: boolean }) {
  return <Box sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid #EAECF0", borderRadius: 3, bgcolor: "#FCFCFD" }}>
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}><AvatarMed /><Typography variant="body2" fontWeight={750} flex={1}>Dori qabul rejasi</Typography>{removable && <Tooltip title="Dorilar ro‘yxatidan olib tashlash"><IconButton size="small" color="error" onClick={onRemove}><DeleteOutlineRounded fontSize="small" /></IconButton></Tooltip>}</Stack>
    <Grid container spacing={1.5}>
      <Grid size={{ xs: 12, sm: 7 }}><TextField size="small" fullWidth label="Dori nomi" placeholder="Masalan: Bisoprolol" value={medicine.name} onChange={(event) => onChange({ name: event.target.value })} /></Grid>
      <Grid size={{ xs: 12, sm: 5 }}><TextField size="small" fullWidth label="Dozasi" placeholder="5 mg" value={medicine.dosage} onChange={(event) => onChange({ dosage: event.target.value })} /></Grid>
      <Grid size={{ xs: 12, sm: 4 }}><FormControl fullWidth size="small"><InputLabel id={`mode-${medicine.name}`}>Qabul rejimi</InputLabel><Select labelId={`mode-${medicine.name}`} label="Qabul rejimi" value={medicine.frequencyType} onChange={(event) => onChange({ frequencyType: event.target.value as MedicationDraft["frequencyType"] })}><MenuItem value="daily">Har kuni</MenuItem><MenuItem value="hourly">Har soatda</MenuItem><MenuItem value="as_needed">Zaruratga ko‘ra</MenuItem></Select></FormControl></Grid>
      {medicine.frequencyType === "daily" && <Grid size={{ xs: 12, sm: 3 }}><TextField size="small" fullWidth label="Kuniga necha mahal" type="number" value={medicine.timesPerDay} inputProps={{ min: 1, max: 6 }} onChange={(event) => onTimesChange(Number(event.target.value) || 1)} /></Grid>}
      {medicine.frequencyType === "hourly" && <Grid size={{ xs: 12, sm: 3 }}><TextField size="small" fullWidth label="Har necha soatda" type="number" value={medicine.intervalHours} inputProps={{ min: 1, max: 24 }} onChange={(event) => onChange({ intervalHours: Math.max(1, Number(event.target.value) || 1) })} /></Grid>}
      <Grid size={{ xs: 12, sm: medicine.frequencyType === "daily" || medicine.frequencyType === "hourly" ? 5 : 4 }}><TextField size="small" fullWidth label="Necha kun" type="number" value={medicine.durationDays} inputProps={{ min: 1, max: 365 }} onChange={(event) => onChange({ durationDays: Math.max(1, Number(event.target.value) || 1) })} /></Grid>
      {medicine.frequencyType === "daily" && <Grid size={{ xs: 12 }}><Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">{medicine.times.map((time, index) => <TextField key={index} size="small" label={`${index + 1}-mahal`} type="time" value={time} onChange={(event) => onChange({ times: medicine.times.map((oldTime, timeIndex) => timeIndex === index ? event.target.value : oldTime) })} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 124 }} />)}<Chip size="small" icon={<InfoOutlined />} label="Bu vaqtlarda mobile reminder chiqadi" sx={{ bgcolor: "#EFF4FF", color: "#175CD3" }} /></Stack></Grid>}
      <Grid size={{ xs: 12 }}><TextField size="small" fullWidth label="Qo‘shimcha ko‘rsatma (ixtiyoriy)" placeholder="Ovqatdan keyin, suv bilan qabul qiling…" value={medicine.notes ?? ""} onChange={(event) => onChange({ notes: event.target.value })} /></Grid>
    </Grid>
  </Box>;
}

function AvatarMed() { return <Box sx={{ display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: 2, bgcolor: "#F4EBFF", color: "#7A5AF8" }}><MedicationRounded fontSize="small" /></Box>; }
