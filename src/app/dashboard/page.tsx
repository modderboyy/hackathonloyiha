"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AccountCircleOutlined,
  ApartmentRounded,
  ChatRounded,
  CloseRounded,
  DashboardRounded,
  DescriptionRounded,
  FavoriteRounded,
  LogoutRounded,
  MenuRounded,
  NotificationsNoneRounded,
  PeopleAltRounded,
  QueryStatsRounded,
  SearchRounded,
  ShieldRounded,
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
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ThemeRegistry from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { DataProvider, useData } from "@/lib/data";
import { Overview } from "@/components/views/overview";
import { Patients } from "@/components/views/patients";
import { Discharges } from "@/components/views/discharges";
import { FollowUps } from "@/components/views/followups";
import { Clinics } from "@/components/views/clinics";
import { DoctorsOverview } from "@/components/views/doctors";
import { MapOverview } from "@/components/views/map-view";
import { AppointmentsOverview } from "@/components/views/appointments";
import { RoomsOverview } from "@/components/views/rooms";
import { EmergencyOverview } from "@/components/views/emergency";

const drawerWidth = 280;
type View = "overview" | "patients" | "doctors" | "clinics" | "map" | "appointments" | "rooms" | "emergency" | "discharges" | "followups";

const dashboardNav: { id: View; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Bosh sahifa", icon: <DashboardRounded /> },
  { id: "patients", label: "Bemorlar", icon: <PeopleAltRounded /> },
  { id: "doctors", label: "Shifokorlar", icon: <ShieldRounded /> },
  { id: "clinics", label: "Klinikalar", icon: <ApartmentRounded /> },
  { id: "map", label: "Klinikalar xaritasi", icon: <ApartmentRounded /> },
  { id: "appointments", label: "Qabul va navbatlar", icon: <DescriptionRounded /> },
  { id: "rooms", label: "Xonalar", icon: <DescriptionRounded /> },
  { id: "emergency", label: "SOS / Favqulodda holatlar", icon: <ShieldRounded /> },
  { id: "followups", label: "Kuzatuvlar", icon: <QueryStatsRounded /> },
  { id: "discharges", label: "Chiqish", icon: <DescriptionRounded /> },
];

export default function DashboardPage() {
  return (
    <ThemeRegistry>
      <DataProvider>
        <DashboardShell />
      </DataProvider>
    </ThemeRegistry>
  );
}

function DashboardShell() {
  const theme = useTheme();
  const { profile, notifications, liveNotification, notConfigured } = useData();
  const [view, setView] = useState<View>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewParam = new URLSearchParams(window.location.search).get("view");
    if (viewParam === "emergency") setView("emergency");
    if (viewParam === "appointments") setView("appointments");
    if (viewParam === "doctors") setView("doctors");
    if (viewParam === "clinics") setView("clinics");
    if (viewParam === "patients") setView("patients");
    if (viewParam === "rooms") setView("rooms");
  }, []);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);
  const isSuper = profile?.role === "super_admin";
  const unread = notifications.filter((notification) => !notification.is_read).length;
  const nav = useMemo(() => (isSuper ? dashboardNav : dashboardNav.filter((item) => ["overview", "patients", "doctors", "appointments", "rooms", "emergency", "followups", "discharges"].includes(item.id))), [isSuper]);
  const navigate = (target: View) => { setView(target); setMobileOpen(false); };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // stale browser state falls through to redirect below
    }
    setAnchor(null);
    window.location.assign("/login");
  };

  const sidebar = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #F8FBF9 0%, #F1F6F4 100%)" }}>
      <Box sx={{ px: 2.25, py: 2.25 }}>
        <Brand />
      </Box>
      <Divider sx={{ borderColor: "rgba(17,34,31,.08)" }} />
      <Box sx={{ px: 1.5, pt: 2.2 }}>
        <Typography variant="overline" sx={{ px: 1.2, color: "#5A6D68", fontWeight: 800, letterSpacing: ".12em" }}>
          ISH MAYDONI
        </Typography>
      </Box>
      <List sx={{ px: 1.2, py: 1.3, flex: 1 }}>
        {nav.map((item) => (
          <ListItemButton
            key={item.id}
            selected={view === item.id}
            onClick={() => navigate(item.id)}
            sx={{
              mb: 0.8,
              px: 1.4,
              py: 1.15,
              borderRadius: 2.2,
              color: view === item.id ? "#123E36" : "#485B56",
              background: view === item.id ? "linear-gradient(135deg, rgba(15,110,92,.12), rgba(15,110,92,.04))" : "transparent",
              border: view === item.id ? "1px solid rgba(15,110,92,.18)" : "1px solid transparent",
              boxShadow: view === item.id ? "inset 0 0 0 1px rgba(15,110,92,.08), 0 8px 18px rgba(15,110,92,.08)" : "none",
              "&:hover": { background: view === item.id ? "linear-gradient(135deg, rgba(15,110,92,.16), rgba(15,110,92,.08))" : "rgba(17,34,31,.02)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: view === item.id ? "#0F6E5C" : "#5E7670" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: view === item.id ? 750 : 650 }} />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ p: 1.5 }}>
        <Box sx={{ p: 1.5, borderRadius: 3, background: "linear-gradient(135deg, rgba(15,110,92,.08), rgba(19,108,131,.04))", border: "1px solid rgba(15,110,92,.12)" }}>
          <Stack direction="row" spacing={1.15} alignItems="center">
            <Avatar sx={{ bgcolor: "linear-gradient(135deg, #0F6E5C, #1F5A73)", color: "#F3FBF8", width: 39, height: 39, fontWeight: 800 }}>
              {(profile?.full_name || "C").slice(0, 1)}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={750} noWrap>{profile?.full_name || "CareLink foydalanuvchisi"}</Typography>
              <Typography variant="caption" sx={{ color: "#5A6D68" }}>
                {isSuper ? "Super admin" : profile?.role === "patient" ? "Bemor" : "Tibbiyot xodimi"}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "linear-gradient(180deg, #F5F7F4 0%, #EEF3F1 100%)" }}>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", lg: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, borderRight: "1px solid rgba(17,34,31,.08)", boxSizing: "border-box", background: "transparent" },
        }}
      >
        {sidebar}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { lg: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}
      >
        {sidebar}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, pb: { xs: 8.5, lg: 0 } }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: "rgba(255,255,255,.82)",
            borderBottom: "1px solid rgba(17,34,31,.08)",
            backdropFilter: "blur(18px)",
            color: "#11211F",
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 66, md: 72 }, px: { xs: 1.5, sm: 2.7 } }}>
            <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { lg: "none" }, mr: 0.5, color: "#11211F" }}>
              <MenuRounded />
            </IconButton>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#11211F" }} noWrap>
                {nav.find((item) => item.id === view)?.label}
              </Typography>
              <Typography variant="caption" sx={{ color: "#4F5E5B", display: { xs: "none", sm: "block" } }}>
                {isSuper ? "CareLink tizimi boshqaruvi" : "Klinik care coordination markazi"}
              </Typography>
            </Box>

            <TextField
              size="small"
              placeholder="Qidirish"
              InputProps={{
                startAdornment: <SearchRounded sx={{ color: "#60746F", mr: 1, fontSize: 18 }} />,
              }}
              sx={{
                width: { xs: 140, md: 220 },
                mr: 1.5,
                display: { xs: "none", md: "block" },
                "& .MuiOutlinedInput-root": { borderRadius: 999, background: "rgba(247,250,249,.9)", color: "#11211F" },
              }}
            />

            <Tooltip title={unread ? `${unread} ta yangi xabarnoma` : "Xabarnomalar"}>
              <IconButton onClick={(event) => setNotificationAnchor(event.currentTarget)} sx={{ mr: 0.75, color: "#11211F" }}>
                <Badge badgeContent={unread} color="error">
                  <NotificationsNoneRounded />
                </Badge>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={notificationAnchor}
              open={Boolean(notificationAnchor)}
              onClose={() => setNotificationAnchor(null)}
              PaperProps={{
                sx: {
                  background: "rgba(255,255,255,.96)",
                  border: "1px solid rgba(17,34,31,.08)",
                  mt: 1,
                  maxWidth: 380,
                  maxHeight: 400,
                  overflowY: "auto",
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={750}>
                  Bildirishnomalar
                </Typography>
              </Box>
              <Divider sx={{ borderColor: "rgba(17,34,31,.08)" }} />
              {notifications.length === 0 ? (
                <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
                  <Typography variant="caption" sx={{ color: "#6B7280" }}>
                    Hozircha yangi bildirishnomalar yo'q
                  </Typography>
                </Box>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <MenuItem
                    key={notif.id}
                    sx={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      width: "100%",
                      px: 2,
                      py: 1.2,
                      borderBottom: "1px solid rgba(17,34,31,.04)",
                      bgcolor: notif.is_read ? "transparent" : "rgba(15,110,92,.04)",
                      "&:hover": { bgcolor: "rgba(15,110,92,.08)" },
                    }}
                  >
                    <Typography variant="body2" fontWeight={notif.is_read ? 600 : 700} sx={{ color: "#1F2937" }}>
                      {notif.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6B7280", mt: 0.3 }}>
                      {notif.body}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#9CA3AF", mt: 0.5 }}>
                      {new Date(notif.created_at).toLocaleTimeString("uz-UZ")}
                    </Typography>
                  </MenuItem>
                ))
              )}
              {notifications.length > 5 && (
                <>
                  <Divider sx={{ borderColor: "rgba(17,34,31,.08)" }} />
                  <MenuItem sx={{ justifyContent: "center", py: 1, color: "#0F6E5C", fontWeight: 600 }}>
                    Barchasini ko'rish
                  </MenuItem>
                </>
              )}
            </Menu>

            <IconButton onClick={(event) => setAnchor(event.currentTarget)} sx={{ color: "#11211F" }}>
              <AccountCircleOutlined />
            </IconButton>

            <Menu
              anchorEl={anchor}
              open={Boolean(anchor)}
              onClose={() => setAnchor(null)}
              PaperProps={{ sx: { background: "rgba(255,255,255,.96)", border: "1px solid rgba(17,34,31,.08)", mt: 1 } }}
            >
              <Box sx={{ px: 2, py: 1.3, minWidth: 210 }}>
                <Typography variant="body2" fontWeight={750}>{profile?.full_name || "CareLink"}</Typography>
                <Typography variant="caption" sx={{ color: "#4F5E5B" }}>{isSuper ? "Super admin" : "Tibbiyot xodimi"}</Typography>
              </Box>
              <Divider sx={{ borderColor: "rgba(17,34,31,.08)" }} />
              <MenuItem onClick={handleLogout} sx={{ width: "100%", justifyContent: "flex-start", color: "#11211F" }}>
                <ListItemIcon sx={{ minWidth: 32 }}><LogoutRounded fontSize="small" sx={{ color: "#0F6E5C" }} /></ListItemIcon>
                Chiqish
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ maxWidth: 1520, mx: "auto", px: { xs: 1.5, sm: 2.4, lg: 3.3 }, py: { xs: 2.2, sm: 3 } }}>
          {notConfigured && (
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2.8, background: "rgba(15,110,92,.08)", color: "#123E36", border: "1px solid rgba(15,110,92,.14)" }}>
              Preview rejimi: Supabase kalitlari qo‘shilgach, bu demo ko‘rsatkichlar real klinika ma’lumotlari va RLS bilan almashinadi.
            </Alert>
          )}

          {view === "overview" && <Overview onOpenPatients={() => navigate("patients")} />}
          {view === "patients" && <Patients />}
          {view === "doctors" && <DoctorsOverview />}
          {view === "clinics" && <Clinics />}
          {view === "map" && <MapOverview />}
          {view === "appointments" && <AppointmentsOverview />}
          {view === "rooms" && <RoomsOverview />}
          {view === "emergency" && <EmergencyOverview />}
          {view === "discharges" && <Discharges />}
          {view === "followups" && <FollowUps />}
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: "block", lg: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: "1px solid rgba(17,34,31,.08)",
          background: "rgba(255,255,255,.88)",
          backdropFilter: "blur(14px)",
        }}
      >
        <BottomNavigation
          showLabels
          value={view}
          onChange={(_, value) => navigate(value as View)}
          sx={{ height: 68, background: "transparent", "& .MuiBottomNavigationAction-root": { color: "#5A6D68" }, "& .Mui-selected": { color: "#0F6E5C !important" } }}
        >
          <BottomNavigationAction label="Bosh sahifa" value="overview" icon={<DashboardRounded />} />
          <BottomNavigationAction label="Bemorlar" value="patients" icon={<PeopleAltRounded />} />
          <BottomNavigationAction label="Qabul" value="appointments" icon={<DescriptionRounded />} />
          <BottomNavigationAction label="SOS" value="emergency" icon={<ShieldRounded />} />
          <BottomNavigationAction label="Kuzatuvlar" value="followups" icon={<QueryStatsRounded />} />
        </BottomNavigation>
      </Box>

      <Snackbar
        open={Boolean(liveNotification)}
        autoHideDuration={5000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={liveNotification?.type === "alert" ? "warning" : "info"}
          icon={<FavoriteRounded />}
          action={<IconButton size="small" color="inherit"><CloseRounded fontSize="small" /></IconButton>}
          sx={{ borderRadius: 2.8, background: "rgba(255,255,255,.96)", border: "1px solid rgba(17,34,31,.08)", color: "#11211F" }}
        >
          <Typography variant="body2" fontWeight={750}>{liveNotification?.title}</Typography>
          {liveNotification?.body && <Typography variant="caption" sx={{ color: "#4F5E5B" }}>{liveNotification.body}</Typography>}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function Brand() {
  return (
    <Stack direction="row" spacing={1.1} alignItems="center">
      <Avatar sx={{ width: 38, height: 38, bgcolor: "linear-gradient(135deg, #0F6E5C, #1F5A73)", borderRadius: 2.5, boxShadow: "0 10px 20px rgba(15,110,92,.18)", color: "#F3FBF8" }}>
        <FavoriteRounded sx={{ fontSize: 21 }} />
      </Avatar>
      <Typography sx={{ color: "#11211F", fontSize: 20, fontWeight: 800, letterSpacing: "-.045em" }}>
        Care<span style={{ color: "#0F6E5C" }}>Link</span>
      </Typography>
    </Stack>
  );
}
