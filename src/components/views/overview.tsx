"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  AccessTimeRounded,
  ArrowForwardRounded,
  CheckCircleRounded,
  ErrorOutlineRounded,
  FavoriteRounded,
  LocalHospitalRounded,
  MapRounded,
  MedicationRounded,
  PeopleAltRounded,
  TrendingUpRounded,
  WatchLaterRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useData } from "@/lib/data";
import { formatDate } from "@/lib/utils";

const ClinicMap = dynamic(() => import("@/components/map/ClinicMap"), {
  ssr: false,
  loading: () => <Box sx={{ height: 440, borderRadius: 3, bgcolor: "#EEF4FF" }} />,
});

export function Overview({ onOpenPatients }: { onOpenPatients: () => void }) {
  const { profile, patients, hospitalizations, discharges, followUps, facilities, checkins, medications } = useData();
  const scopeClinic = profile?.role === "super_admin" ? null : profile?.clinic_id;
  const scopedPatients = useMemo(() => scopeClinic ? patients.filter((patient) => patient.clinic_id === scopeClinic) : patients, [patients, scopeClinic]);
  const scopedDischarges = useMemo(() => scopeClinic ? discharges.filter((item) => item.clinic_id === scopeClinic) : discharges, [discharges, scopeClinic]);
  const scopedFollowUps = useMemo(() => scopeClinic ? followUps.filter((item) => item.clinic_id === scopeClinic) : followUps, [followUps, scopeClinic]);
  const scopedHospitals = useMemo(() => scopeClinic ? hospitalizations.filter((item) => item.clinic_id === scopeClinic || item.facility_id === scopeClinic) : hospitalizations, [hospitalizations, scopeClinic]);
  const clinics = useMemo(() => scopeClinic ? facilities.filter((clinic) => clinic.id === scopeClinic) : facilities, [facilities, scopeClinic]);

  const patientStats = useMemo(() => {
    const riskyPatientIds = new Set(scopedHospitals.filter((item) => item.status === "active").map((item) => item.patient_id));
    checkins.filter((item) => ["answered_bad", "locked", "escalated"].includes(item.status)).forEach((checkin) => riskyPatientIds.add(checkin.client_id));
    // client_id har doim patient_id bo'lmasligi mumkin; active statsionar eng ishonchli indikatsiya sifatida ishlaydi.
    const sick = scopedPatients.filter((patient) => riskyPatientIds.has(patient.id)).length;
    return { total: scopedPatients.length, sick, healthy: Math.max(0, scopedPatients.length - sick) };
  }, [scopedPatients, scopedHospitals, checkins]);

  const dischargeStats = useMemo(() => {
    let successful = 0;
    let unsuccessful = 0;
    let ongoing = 0;
    scopedDischarges.forEach((discharge) => {
      const related = scopedFollowUps.find((followUp) => followUp.discharge_id === discharge.id);
      if (!related) { ongoing += 1; return; }
      if (related.status === "completed") successful += 1;
      else if (related.status === "overdue") unsuccessful += 1;
      else ongoing += 1;
    });
    return { total: scopedDischarges.length, successful, unsuccessful, ongoing };
  }, [scopedDischarges, scopedFollowUps]);

  const observationStats = useMemo(() => ({
    pending: scopedFollowUps.filter((item) => item.status === "pending").length,
    active: scopedFollowUps.filter((item) => item.status === "in_progress").length,
    urgent: scopedFollowUps.filter((item) => item.status === "overdue").length,
    complete: scopedFollowUps.filter((item) => item.status === "completed").length,
  }), [scopedFollowUps]);

  const upcoming = useMemo(() => scopedFollowUps.filter((item) => item.status !== "completed").sort((a, b) => +new Date(a.due_date) - +new Date(b.due_date)).slice(0, 4), [scopedFollowUps]);
  const patientName = (id: string) => scopedPatients.find((patient) => patient.id === id)?.full_name ?? "Bemor";
  const activeClinics = clinics.filter((clinic) => clinic.is_active && ["active", "trial"].includes(clinic.subscription_status ?? "inactive")).length;

  return (
    <Stack spacing={3.1}>
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Bosh sahifa</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{profile?.role === "super_admin" ? "Barcha klinikalar bo‘yicha care holati" : "Klinikangizdagi bemorlar va kuzatuvlar holati"}</Typography>
        </Box>
        <Button variant="outlined" endIcon={<ArrowForwardRounded />} onClick={onOpenPatients}>Bemorlar ro‘yxati</Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}><MetricCard icon={<PeopleAltRounded />} title="Jami bemorlar" value={patientStats.total} tint="#EFF4FF" color="#155EEF" chips={[{ label: "Sog‘", value: patientStats.healthy, color: "#027A48" }, { label: "Kasal", value: patientStats.sick, color: "#B42318" }]} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><MetricCard icon={<LocalHospitalRounded />} title="Statsionardan chiqarilganlar" value={dischargeStats.total} tint="#F4F3FF" color="#6938EF" chips={[{ label: "Muvaffaqiyatli", value: dischargeStats.successful, color: "#027A48" }, { label: "Muvaffaqiyatsiz", value: dischargeStats.unsuccessful, color: "#B42318" }, { label: "Davom etyapti", value: dischargeStats.ongoing, color: "#B54708" }]} /></Grid>
        <Grid size={{ xs: 12, md: 4 }}><MetricCard icon={<FavoriteRounded />} title="Kuzatuvlar" value={observationStats.pending + observationStats.active + observationStats.urgent} tint="#ECFDF3" color="#0E9384" chips={[{ label: "Kutilmoqda", value: observationStats.pending, color: "#B54708" }, { label: "Jarayonda", value: observationStats.active, color: "#155EEF" }, { label: "Muddat o‘tgan", value: observationStats.urgent, color: "#B42318" }]} /></Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ height: "100%", overflow: "hidden" }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
                <Box><Stack direction="row" alignItems="center" spacing={.8}><MapRounded sx={{ color: "#155EEF" }} /><Typography variant="h6">Klinikalar xaritasi</Typography></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: .4 }}>O‘zbekiston ichidagi klinikalar, xizmat radiusi va obuna holati</Typography></Box>
                <Chip size="small" icon={<CheckCircleRounded />} label={`${activeClinics}/${clinics.length} faol`} sx={{ bgcolor: "#ECFDF3", color: "#027A48" }} />
              </Stack>
              <ClinicMap clinics={clinics} height={410} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="h6">Kuzatuvlar holati</Typography><TrendingUpRounded sx={{ color: "#12B76A" }} /></Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Faol vazifalar tezkor ko‘rinishi</Typography>
              <Stack spacing={2.1} sx={{ mt: 3 }}>
                <Distribution label="Yakunlangan" value={observationStats.complete} total={scopedFollowUps.length} color="#12B76A" />
                <Distribution label="Jarayonda" value={observationStats.active} total={scopedFollowUps.length} color="#155EEF" />
                <Distribution label="Kutilmoqda" value={observationStats.pending} total={scopedFollowUps.length} color="#F79009" />
                <Distribution label="Muddatidan o‘tgan" value={observationStats.urgent} total={scopedFollowUps.length} color="#F04438" />
              </Stack>
              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={1.2} alignItems="center"><Avatar sx={{ bgcolor: "#F4EBFF", color: "#7A5AF8", width: 38, height: 38 }}><MedicationRounded fontSize="small" /></Avatar><Box><Typography variant="body2" fontWeight={750}>{medications.length} ta dori rejasi</Typography><Typography variant="caption" color="text.secondary">Mobile reminders tizimiga sinxronlanadi</Typography></Box></Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.75 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h6">Yaqin kuzatuvlar</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .4 }}>Ustuvor follow-up vazifalari</Typography></Box><WatchLaterRounded sx={{ color: "#F79009" }} /></Stack>
              <Stack divider={<Divider flexItem />} sx={{ mt: 2 }}>
                {upcoming.length === 0 ? <EmptyText text="Hozircha kutilayotgan kuzatuv yo‘q." /> : upcoming.map((followUp) => {
                  const isLate = followUp.status === "overdue" || new Date(followUp.due_date) < new Date();
                  return <Stack key={followUp.id} direction="row" spacing={1.4} alignItems="center" sx={{ py: 1.5 }}><Avatar sx={{ width: 38, height: 38, bgcolor: isLate ? "#FEF3F2" : "#EFF4FF", color: isLate ? "#F04438" : "#155EEF", fontSize: 13, fontWeight: 800 }}>{patientName(followUp.patient_id).split(" ").map((part) => part[0]).join("").slice(0, 2)}</Avatar><Box flex={1} minWidth={0}><Typography variant="body2" fontWeight={750} noWrap>{patientName(followUp.patient_id)}</Typography><Typography variant="caption" color="text.secondary">{followUp.next_step || "Klinik baholash kutilmoqda"}</Typography></Box><Chip size="small" icon={isLate ? <ErrorOutlineRounded /> : <AccessTimeRounded />} label={isLate ? "Diqqat" : formatDate(followUp.due_date)} color={isLate ? "error" : "default"} sx={isLate ? undefined : { bgcolor: "#F2F4F7", color: "#475467" }} /></Stack>;
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: "100%", bgcolor: "#0B1F4A", border: "none", color: "#fff", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", width: 210, height: 210, right: -70, top: -80, borderRadius: "50%", border: "30px solid rgba(255,255,255,.06)" }} />
            <CardContent sx={{ position: "relative", p: { xs: 2.3, sm: 2.75 }, height: "100%", display: "flex", flexDirection: "column" }}><Avatar sx={{ bgcolor: "rgba(255,255,255,.12)", color: "#9BC0FF", width: 44, height: 44 }}><LocalHospitalRounded /></Avatar><Typography variant="h6" sx={{ mt: 2 }}>CareLink mobile bilan bog‘langan</Typography><Typography variant="body2" sx={{ color: "rgba(255,255,255,.7)", mt: .9, lineHeight: 1.7 }}>Chiqarish paytida yaratilgan kod bemor ilovasiga klinik reja, dori va eslatmalarni olib boradi.</Typography><Box flex={1} /><Button variant="contained" sx={{ mt: 3, alignSelf: "flex-start", bgcolor: "#fff", color: "#0B1F4A", "&:hover": { bgcolor: "#EEF4FF" } }} onClick={onOpenPatients}>Bemorni chiqarish</Button></CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}

function MetricCard({ icon, title, value, tint, color, chips }: { icon: React.ReactNode; title: string; value: number; tint: string; color: string; chips: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...chips.map((chip) => chip.value));
  return <Card sx={{ height: "100%" }}><CardContent sx={{ p: { xs: 2.1, sm: 2.5 } }}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="body2" color="text.secondary" fontWeight={700}>{title}</Typography><Typography sx={{ color: "#101828", fontSize: { xs: 31, sm: 36 }, fontWeight: 800, letterSpacing: "-.05em", mt: .5 }}>{value}</Typography></Box><Avatar sx={{ bgcolor: tint, color, borderRadius: 2.75 }}>{icon}</Avatar></Stack><Stack spacing={1.05} sx={{ mt: 2.1 }}>{chips.map((chip) => <Box key={chip.label}><Stack direction="row" justifyContent="space-between" sx={{ mb: .55 }}><Typography variant="caption" color="text.secondary">{chip.label}</Typography><Typography variant="caption" fontWeight={800} sx={{ color: chip.color }}>{chip.value}</Typography></Stack><LinearProgress variant="determinate" value={(chip.value / max) * 100} sx={{ height: 5, borderRadius: 3, bgcolor: "#F2F4F7", "& .MuiLinearProgress-bar": { bgcolor: chip.color, borderRadius: 3 } }} /></Box>)}</Stack></CardContent></Card>;
}

function Distribution({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { return <Box><Stack direction="row" justifyContent="space-between" sx={{ mb: .6 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="body2" fontWeight={800}>{value}</Typography></Stack><LinearProgress variant="determinate" value={total ? (value / total) * 100 : 0} sx={{ height: 7, borderRadius: 9, bgcolor: "#F2F4F7", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 9 } }} /></Box>; }
function EmptyText({ text }: { text: string }) { return <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>{text}</Typography>; }
