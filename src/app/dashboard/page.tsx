"use client";

import { useMemo, useState } from "react";
import {
  AccountCircleOutlined,
  ApartmentRounded,
  CloseRounded,
  DashboardRounded,
  DescriptionRounded,
  FavoriteRounded,
  LogoutRounded,
  MenuRounded,
  NotificationsNoneRounded,
  PeopleAltRounded,
  QueryStatsRounded,
} from "@mui/icons-material";
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import ThemeRegistry from "@/lib/theme";
import { DataProvider, useData } from "@/lib/data";
import { Overview } from "@/components/views/overview";
import { Patients } from "@/components/views/patients";
import { Discharges } from "@/components/views/discharges";
import { FollowUps } from "@/components/views/followups";
import { Clinics } from "@/components/views/clinics";

const drawerWidth = 270;
type View = "overview" | "patients" | "discharges" | "followups" | "clinics";

const commonNav: { id: Exclude<View, "clinics">; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Bosh sahifa", icon: <DashboardRounded /> },
  { id: "patients", label: "Bemorlar", icon: <PeopleAltRounded /> },
  { id: "discharges", label: "Chiqarish", icon: <DescriptionRounded /> },
  { id: "followups", label: "Kuzatuvlar", icon: <QueryStatsRounded /> },
];

export default function DashboardPage() {
  return <ThemeRegistry><DataProvider><DashboardShell /></DataProvider></ThemeRegistry>;
}

function DashboardShell() {
  const theme = useTheme();
  const { profile, notifications, liveNotification, notConfigured } = useData();
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const isSuper = profile?.role === "super_admin";
  const unread = notifications.filter((notification) => !notification.is_read).length;
  const nav = useMemo(() => isSuper ? [...commonNav, { id: "clinics" as const, label: "Klinikalar", icon: <ApartmentRounded /> }] : commonNav, [isSuper]);
  const navigate = (target: View) => { setView(target); setMobileOpen(false); };

  const sidebar = <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
    <Box sx={{ px: 2.5, py: 2.5 }}><Brand /></Box>
    <Divider />
    <Box sx={{ px: 1.35, pt: 2 }}><Typography variant="overline" sx={{ px: 1.25, color: "#98A2B3", fontWeight: 800, letterSpacing: ".08em" }}>ISH MAYDONI</Typography></Box>
    <List sx={{ px: 1.15, py: 1, flex: 1 }}>
      {nav.map((item) => <ListItemButton key={item.id} selected={view === item.id} onClick={() => navigate(item.id)} sx={{ mb: .5, px: 1.35, py: 1.12, borderRadius: 2.5, "&.Mui-selected": { bgcolor: "#EFF4FF", color: "#155EEF", "& .MuiListItemIcon-root": { color: "#155EEF" } }, "&:hover": { bgcolor: view === item.id ? "#EFF4FF" : "#F9FAFB" } }}><ListItemIcon sx={{ minWidth: 38, color: view === item.id ? "#155EEF" : "#667085" }}>{item.icon}</ListItemIcon><ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: view === item.id ? 750 : 620 }} /></ListItemButton>)}
    </List>
    <Box sx={{ p: 1.5 }}><Box sx={{ p: 1.5, border: "1px solid #EAECF0", borderRadius: 3, bgcolor: "#FCFCFD" }}><Stack direction="row" spacing={1.1} alignItems="center"><Avatar sx={{ bgcolor: isSuper ? "#0B1F4A" : "#155EEF", width: 38, height: 38, fontWeight: 800 }}>{(profile?.full_name || "C").slice(0, 1)}</Avatar><Box minWidth={0}><Typography variant="body2" fontWeight={750} noWrap>{profile?.full_name || "CareLink foydalanuvchisi"}</Typography><Typography variant="caption" color="text.secondary">{isSuper ? "Super admin" : profile?.role === "patient" ? "Bemor" : "Tibbiyot xodimi"}</Typography></Box></Stack></Box></Box>
  </Box>;

  return <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F7F9FC" }}>
    <Drawer variant="permanent" open sx={{ display: { xs: "none", lg: "block" }, width: drawerWidth, flexShrink: 0, "& .MuiDrawer-paper": { width: drawerWidth, borderRight: "1px solid #EAECF0", boxSizing: "border-box" } }}>{sidebar}</Drawer>
    <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { lg: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}>{sidebar}</Drawer>
    <Box sx={{ flex: 1, minWidth: 0, pb: { xs: 8.5, lg: 0 } }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(255,255,255,.88)", borderBottom: "1px solid #EAECF0", backdropFilter: "blur(14px)" }}><Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 1.5, sm: 3 } }}>
        <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { lg: "none" }, mr: .5 }}><MenuRounded /></IconButton>
        <Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>{nav.find((item) => item.id === view)?.label}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>{isSuper ? "CareLink tizimi boshqaruvi" : "Klinik care coordination markazi"}</Typography></Box>
        <Tooltip title={unread ? `${unread} ta yangi xabarnoma` : "Xabarnomalar"}><IconButton sx={{ mr: .5 }}><Badge badgeContent={unread} color="error"><NotificationsNoneRounded /></Badge></IconButton></Tooltip>
        <IconButton onClick={(event) => setAnchor(event.currentTarget)}><AccountCircleOutlined /></IconButton>
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><Box sx={{ px: 2, py: 1.25, minWidth: 200 }}><Typography variant="body2" fontWeight={750}>{profile?.full_name || "CareLink"}</Typography><Typography variant="caption" color="text.secondary">{isSuper ? "Super admin" : "Tibbiyot xodimi"}</Typography></Box><Divider /><MenuItem component={Link} href="/" onClick={() => setAnchor(null)}><ListItemIcon><LogoutRounded fontSize="small" /></ListItemIcon>Bosh sahifaga chiqish</MenuItem></Menu>
      </Toolbar></AppBar>
      <Box component="main" sx={{ maxWidth: 1500, mx: "auto", px: { xs: 1.5, sm: 3, lg: 4 }, py: { xs: 2.25, sm: 3.5 } }}>
        {notConfigured && <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.5 }}>Preview rejimi: Supabase kalitlari qo‘shilgach, bu demo ko‘rsatkichlar real klinika ma’lumotlari va RLS bilan almashinadi.</Alert>}
        {view === "overview" && <Overview onOpenPatients={() => navigate("patients")} />}
        {view === "patients" && <Patients />}
        {view === "discharges" && <Discharges />}
        {view === "followups" && <FollowUps />}
        {view === "clinics" && isSuper && <Clinics />}
      </Box>
    </Box>
    <Box sx={{ display: { xs: "block", lg: "none" }, position: "fixed", bottom: 0, left: 0, right: 0, zIndex: theme.zIndex.appBar, borderTop: "1px solid #EAECF0", bgcolor: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)" }}><BottomNavigation showLabels value={view === "clinics" ? "overview" : view} onChange={(_, value: View) => navigate(value)} sx={{ height: 66 }}><BottomNavigationAction label="Bosh sahifa" value="overview" icon={<DashboardRounded />} /><BottomNavigationAction label="Bemorlar" value="patients" icon={<PeopleAltRounded />} /><BottomNavigationAction label="Chiqarish" value="discharges" icon={<DescriptionRounded />} /><BottomNavigationAction label="Kuzatuvlar" value="followups" icon={<QueryStatsRounded />} /></BottomNavigation></Box>
    <Snackbar open={Boolean(liveNotification)} autoHideDuration={5000} anchorOrigin={{ vertical: "top", horizontal: "center" }}><Alert severity={liveNotification?.type === "alert" ? "warning" : "info"} icon={<FavoriteRounded />} action={<IconButton size="small" color="inherit"><CloseRounded fontSize="small" /></IconButton>} sx={{ borderRadius: 2.5 }}><Typography variant="body2" fontWeight={750}>{liveNotification?.title}</Typography>{liveNotification?.body && <Typography variant="caption">{liveNotification.body}</Typography>}</Alert></Snackbar>
  </Box>;
}

function Brand() { return <Stack direction="row" spacing={1.1} alignItems="center"><Avatar sx={{ width: 36, height: 36, bgcolor: "#155EEF", borderRadius: 2.5, boxShadow: "0 6px 14px rgba(21,94,239,.24)" }}><FavoriteRounded fontSize="small" /></Avatar><Typography sx={{ color: "#101828", fontSize: 20, fontWeight: 800, letterSpacing: "-.045em" }}>Care<span style={{ color: "#155EEF" }}>Link</span></Typography></Stack>; }
