"use client";

import {
  AddRounded,
  LocalHospitalRounded,
  LocationOnOutlined,
  PriorityHighRounded,
  SearchRounded,
  ShieldRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useData } from "@/lib/data";

export function EmergencyOverview() {
  const { patients, facilities, checkins } = useData();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const filtered = checkins.filter((checkin) => {
      if (!query) return true;
      const patient = patients.find((item) => item.id === checkin.client_id);
      const haystack = `${patient?.full_name ?? ""} ${checkin.status} ${checkin.ai_message ?? ""}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

    return filtered.slice(0, 6).map((checkin, index) => {
      const patient = patients.find((item) => item.id === checkin.client_id) ?? patients[0];
      const clinic = facilities.find((facility) => facility.id === patient?.clinic_id) ?? facilities[0];
      const priority = checkin.status === "locked" || checkin.status === "escalated" || checkin.escalation >= 2 ? "Critical" : checkin.status === "answered_bad" ? "High" : "Moderate";
      const status = checkin.status === "escalated" ? "Accepted" : checkin.status === "answered_bad" ? "Searching" : checkin.status === "locked" ? "Resolved" : "Accepted";
      const locationKm = `${(index + 1) * 1.1} km`;

      return {
        request: `#CL-${1000 + index + checkin.escalation}`,
        patient: patient?.full_name ?? "Bemor",
        location: locationKm,
        priority,
        clinic: clinic?.name ?? "CareLink klinikasi",
        status,
        time: `${9 + index}:${String((index + 1) * 12).padStart(2, "0")}`,
      };
    });
  }, [checkins, facilities, patients, query]);

  const metrics = useMemo(() => ({
    active: checkins.filter((item) => ["sent", "answered_bad", "locked", "escalated"].includes(item.status)).length,
    accepted: checkins.filter((item) => ["answered_bad", "escalated"].includes(item.status)).length,
    inProgress: checkins.filter((item) => item.status === "sent").length,
    resolved: checkins.filter((item) => item.status === "locked").length,
  }), [checkins]);

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 27, md: 32 } }}>Favqulodda holatlar</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Real SOS / check-in ma’lumotlariga asoslangan tezkor javob</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRounded />} sx={{ bgcolor: "#C74B49", "&:hover": { bgcolor: "#AD3C3A" } }}>Yangi SOS</Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Faol SOS" value={metrics.active} color="#C74B49" tint="#FEF3F2" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Qabul qilingan" value={metrics.accepted} color="#D9872F" tint="#FFF7E8" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Jarayonda" value={metrics.inProgress} color="#136C83" tint="#EAF7FA" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Yakunlangan" value={metrics.resolved} color="#1FA777" tint="#ECFDF3" /></Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 2.4 } }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Request yoki joylashuv bo‘yicha qidirish"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: "#98A2B3" }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField select SelectProps={{ native: true }} size="small" defaultValue="all" sx={{ minWidth: 150 }}>
              <option value="all">Prioritet</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
            </TextField>
          </Stack>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Clinic</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.request} hover>
                    <TableCell>{row.request}</TableCell>
                    <TableCell>{row.patient}</TableCell>
                    <TableCell><Stack direction="row" spacing={0.6} alignItems="center"><LocationOnOutlined sx={{ fontSize: 16, color: "#0F6E5C" }} />{row.location}</Stack></TableCell>
                    <TableCell><Chip label={row.priority} sx={{ bgcolor: row.priority === "Critical" ? "#FEF3F2" : row.priority === "High" ? "#FFF7E8" : "#EAF7FA", color: row.priority === "Critical" ? "#C74B49" : row.priority === "High" ? "#D9872F" : "#136C83" }} /></TableCell>
                    <TableCell>{row.clinic}</TableCell>
                    <TableCell><Chip label={row.status} sx={{ bgcolor: row.status === "Searching" ? "#FFF7E8" : row.status === "Accepted" ? "#EAF7FA" : "#ECFDF3", color: row.status === "Searching" ? "#D9872F" : row.status === "Accepted" ? "#136C83" : "#1FA777" }} /></TableCell>
                    <TableCell>{row.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  );
}

function MetricCard({ label, value, color, tint }: { label: string; value: number; color: string; tint: string }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography sx={{ mt: 0.7, fontSize: 30, fontWeight: 800, letterSpacing: "-.05em" }}>{value}</Typography>
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: tint, display: "grid", placeItems: "center", color }}>
            {label.includes("SOS") ? <ShieldRounded /> : label.includes("Qabul") ? <PriorityHighRounded /> : label.includes("Jarayonda") ? <LocalHospitalRounded /> : <PriorityHighRounded />}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}