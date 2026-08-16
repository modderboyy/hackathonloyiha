"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Grid,
  Stack,
} from "@mui/material";
import {
  People as PeopleIcon,
  Bed as BedIcon,
  Assignment as AssignmentIcon,
  Map as MapIcon,
  NotificationsActive as NotifIcon,
  Medication as MedIcon,
  ArrowForward as ArrowIcon,
} from "@mui/icons-material";
import { useData } from "@/lib/data";
import { BarChart, DonutChart, AreaChart } from "@/components/charts";
import { formatDate } from "@/lib/utils";

const RegionMap = dynamic(() => import("@/components/map/RegionMap"), {
  ssr: false,
  loading: () => <Box sx={{ height: 400, bgcolor: "grey.100", borderRadius: 2 }} />,
});

const MONTH_NAMES = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

export function Overview({ onRegionSelect }: { onRegionSelect: (regionId: string) => void }) {
  const { regions, districts, patients, profiles, followUps, discharges, visits, hospitalizations, clientHealth } = useData();

  const patientStats = useMemo(() => {
    const total = patients.length;
    const sick = patients.filter((p) => {
      const hasActiveHosp = hospitalizations.some((h) => h.patient_id === p.id && h.status === "active");
      const profileRow = profiles.find((pr) => pr.patient_id === p.id);
      const hasCondition = profileRow
        ? clientHealth.some((ch) => ch.client_id === profileRow.id && ch.current_condition)
        : false;
      return hasActiveHosp || hasCondition;
    }).length;
    return { total, sick, healthy: total - sick };
  }, [patients, profiles, hospitalizations, clientHealth]);

  const hospitalStats = useMemo(() => {
    const total = hospitalizations.length;
    let ongoing = hospitalizations.filter((h) => h.status === "active").length;
    const discharged = hospitalizations.filter((h) => h.status === "discharged");
    let success = 0;
    let failed = 0;
    discharged.forEach((h) => {
      const disc = discharges.find((d) => d.hospitalization_id === h.id);
      const fu = disc ? followUps.find((f) => f.discharge_id === disc.id) : null;
      if (!fu || fu.status === "completed") success++;
      else if (fu.status === "overdue") failed++;
      else ongoing++;
    });
    return { total, ongoing, success, failed };
  }, [hospitalizations, followUps, discharges]);

  const followUpStats = useMemo(() => {
    const counts = { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
    followUps.forEach((f) => {
      if (f.status in counts) counts[f.status as keyof typeof counts]++;
    });
    return counts;
  }, [followUps]);

  const regionCounts = useMemo(() => {
    const m: Record<string, number> = {};
    regions.forEach((r) => (m[r.id] = 0));
    patients.forEach((p) => {
      if (p.region_id && m[p.region_id] !== undefined) m[p.region_id]++;
    });
    return m;
  }, [regions, patients]);

  const districtMarkers = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach((p) => {
      if (p.district_id) counts[p.district_id] = (counts[p.district_id] ?? 0) + 1;
    });
    return districts
      .filter((d) => d.lat !== null && d.lng !== null)
      .map((d) => ({ id: d.id, name: d.name, lat: d.lat as number, lng: d.lng as number, count: counts[d.id] ?? 0, polygon: d.polygon }));
  }, [districts, patients]);

  const followUpDist = [
    { label: "Kutilmoqda", value: followUpStats.pending, color: "#f59e0b" },
    { label: "Jarayonda", value: followUpStats.in_progress, color: "#3b82f6" },
    { label: "Yakunlandi", value: followUpStats.completed, color: "#10b981" },
    { label: "Muddati o'tdi", value: followUpStats.overdue, color: "#ef4444" },
  ];

  const monthly = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_NAMES[d.getMonth()], value: 0 });
    }
    visits.forEach((v) => {
      const d = new Date(v.visit_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const b = buckets.find((x) => x.key === key);
      if (b) b.value++;
    });
    return buckets;
  }, [visits]);

  const recent = useMemo(() => {
    const ev = [
      ...visits.map((v) => ({ date: v.visit_date, title: "Klinik tashrif", pid: v.patient_id, icon: "clipboard" })),
      ...discharges.map((d) => ({ date: d.discharge_date, title: "Chiqarish", pid: d.patient_id, icon: "bed" })),
      ...followUps.map((f) => ({ date: f.due_date, title: "Follow-up", pid: f.patient_id, icon: "clock" })),
    ].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return ev.slice(0, 6);
  }, [visits, discharges, followUps]);

  const pname = (id: string) => patients.find((p) => p.id === id)?.full_name ?? "—";

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} color="text.primary">
          Bosh sahifa
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tizimning umumiy holati va statistikasi
        </Typography>
      </Box>

      {/* KPI kartalar */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Jami bemorlar"
            icon={<PeopleIcon />}
            value={patientStats.total}
            gradient="linear-gradient(135deg, #2563eb, #4338ca)"
            segments={[
              { label: "Sog'", value: patientStats.healthy, color: "#34d399" },
              { label: "Kasal", value: patientStats.sick, color: "#f87171" },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Statsionar"
            icon={<BedIcon />}
            value={hospitalStats.total}
            gradient="linear-gradient(135deg, #7c3aed, #6d28d9)"
            segments={[
              { label: "Davom etyabti", value: hospitalStats.ongoing, color: "#38bdf8" },
              { label: "Muvaffaqiyatli", value: hospitalStats.success, color: "#34d399" },
              { label: "Muvaffaqiyatsiz", value: hospitalStats.failed, color: "#f87171" },
            ]}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <KpiCard
            title="Kuzatuvlar"
            icon={<AssignmentIcon />}
            value={followUpStats.pending + followUpStats.in_progress + followUpStats.overdue}
            gradient="linear-gradient(135deg, #f59e0b, #ea580c)"
            segments={[
              { label: "Kutilmoqda", value: followUpStats.pending, color: "#fbbf24" },
              { label: "Jarayonda", value: followUpStats.in_progress, color: "#38bdf8" },
              { label: "Yakunlangan", value: followUpStats.completed, color: "#34d399" },
              { label: "Muddati o'tdi", value: followUpStats.overdue, color: "#f87171" },
            ]}
          />
        </Grid>
      </Grid>

      {/* Xarita */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Hududlar bo'yicha bemorlar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hududni bosing — bemorlar ro'yxati filtrlanadi
              </Typography>
            </Box>
            <MapIcon sx={{ color: "primary.main" }} />
          </Box>
          <RegionMap regions={regions} counts={regionCounts} selected={null} districtMarkers={districtMarkers} onSelect={(id) => id && onRegionSelect(id)} />
        </CardContent>
      </Card>

      {/* Grafiklar */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Hududlar kesimida
              </Typography>
              <BarChart data={regions.map((r) => ({ label: r.code, value: regionCounts[r.id] ?? 0 }))} height={220} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Kuzatuv holati
              </Typography>
              <DonutChart data={followUpDist} centerLabel="Kuzatuv" centerValue={followUps.length} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Tashriflar dinamikasi (6 oy)
          </Typography>
          <AreaChart data={monthly.map((m) => m.value)} labels={monthly.map((m) => m.label)} height={200} />
        </CardContent>
      </Card>

      {/* So'nggi faollik */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            So'nggi faollik
          </Typography>
          {recent.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Hozircha faollik yo'q.
            </Typography>
          ) : (
            <List disablePadding>
              {recent.map((e, i) => (
                <ListItem key={i} divider={i < recent.length - 1} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.light", color: "primary.contrastText", width: 36, height: 36 }}>
                      {e.icon === "bed" ? <BedIcon /> : e.icon === "clock" ? <NotifIcon /> : <MedIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${e.title} — ${pname(e.pid)}`}
                    secondary={formatDate(e.date)}
                  />
                  <ArrowIcon sx={{ color: "grey.400" }} />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function KpiCard({
  title,
  icon,
  value,
  gradient,
  segments,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  gradient: string;
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <Card sx={{ height: "100%", overflow: "hidden" }}>
      {/* Gradient header */}
      <Box
        sx={{
          background: gradient,
          color: "white",
          p: 2.5,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ mt: 1, lineHeight: 1, fontWeight: 800 }}>
              {value}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}>{icon}</Avatar>
        </Box>
        {/* dekorativ doiralar */}
        <Box sx={{ position: "absolute", top: -24, right: -24, width: 96, height: 96, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.12)" }} />
        <Box sx={{ position: "absolute", bottom: -40, right: -8, width: 112, height: 112, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />
      </Box>

      {/* Segmentlar */}
      <CardContent sx={{ py: 1.5 }}>
        <Stack spacing={1.5}>
          {segments.map((seg, i) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            return (
              <Box key={i}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: seg.color }} />
                    {seg.label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {seg.value}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: "grey.100",
                    "& .MuiLinearProgress-bar": { bgcolor: seg.color, borderRadius: 3 },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
