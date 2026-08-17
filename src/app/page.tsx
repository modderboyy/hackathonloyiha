"use client";

import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  Paper,
} from "@mui/material";
import {
  LocalHospital as HospitalIcon,
  NotificationsActive as NotifIcon,
  Favorite as HeartIcon,
  MedicalServices as MedicalIcon,
  Smartphone as SmartphoneIcon,
  Shield as ShieldIcon,
  Groups as GroupsIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import ThemeRegistry from "@/lib/theme";

const PRIMARY = "#1e3a8a";

export default function Home() {
  return (
    <ThemeRegistry>
      <LandingPage />
    </ThemeRegistry>
  );
}

function LandingPage() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* ===== Navbar ===== */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "white", borderBottom: "1px solid #e2e8f0" }}>
        <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: PRIMARY, width: 34, height: 34, fontWeight: 800, fontSize: 16 }}>C</Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800 }} color="text.primary">
              Care<span style={{ color: PRIMARY }}>Link</span>
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button component={Link} href="/login" color="inherit" sx={{ color: "text.primary" }}>
              Kirish
            </Button>
            <Button component={Link} href="/signup" variant="contained" sx={{ bgcolor: PRIMARY }}>
              Ro&lsquo;yxatdan o&lsquo;tish
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* ===== Hero ===== */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #172554 50%, #0f172a 100%)`,
          color: "white",
          py: { xs: 8, md: 12 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* dekorativ doiralar */}
        <Box sx={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", bottom: -120, left: -60, width: 400, height: 400, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)" }} />

        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                label="Raqamli tibbiy kuzatuv platformasi"
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#93c5fd", mb: 2, fontWeight: 600 }}
              />
              <Typography variant="h2" sx={{ lineHeight: 1.15, mb: 2, fontWeight: 800 }}>
                Statsionardan chiqqan bemor{" "}
                <span style={{ color: "#60a5fa" }}>kuzatuvsiz qolmaydi</span>
              </Typography>
              <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 400, mb: 4, maxWidth: 560 }}>
                Og&lsquo;ir bemor kasalxonadan chiqarilgach, hududiy oilaviy shifokorga avtomatik
                xabarnoma yo&lsquo;q edi — parvarish uzilardi. CareLink bu bo&lsquo;shliqni yopadi:
                bemor uyga qaytgach ham AI kuzatuvi va shifokor nazorati davom etadi.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  component={Link}
                  href="/signup"
                  variant="contained"
                  size="large"
                  sx={{ bgcolor: "#2563eb", px: 4, py: 1.5, fontWeight: 700, "&:hover": { bgcolor: "#3b82f6" } }}
                >
                  Boshlash — bepul
                </Button>
                <Button
                  component={Link}
                  href="/login"
                  variant="outlined"
                  size="large"
                  sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", px: 4, py: 1.5, "&:hover": { borderColor: "white" } }}
                >
                  Tizimga kirish
                </Button>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ mt: 4, color: "rgba(255,255,255,0.7)" }}>
                <Box><Typography variant="h6" sx={{ fontWeight: 800 }} color="white">100%</Typography><Typography variant="caption">uzluksiz kuzatuv</Typography></Box>
                <Box><Typography variant="h6" sx={{ fontWeight: 800 }} color="white">0%</Typography><Typography variant="caption">yo&lsquo;qolgan bemor</Typography></Box>
                <Box><Typography variant="h6" sx={{ fontWeight: 800 }} color="white">24/7</Typography><Typography variant="caption">AI monitoring</Typography></Box>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={0} sx={{ bgcolor: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4, p: 3 }}>
                <Typography variant="subtitle2" sx={{ color: "#93c5fd", mb: 2, letterSpacing: 1 }}>
                  KASALXONA → CARELINK → OILAVIY SHIFOKOR
                </Typography>
                {[
                  { n: 1, t: "Discharge", d: "Shifokor chiqarish va tavsiyalarni kiritadi", icon: <HospitalIcon /> },
                  { n: 2, t: "Avtomatik xabarnoma", d: "Hududiy shifokorga darhol yuboriladi", icon: <NotifIcon /> },
                  { n: 3, t: "AI kuzatuvi", d: "Bemor har soat tekshiriladi, holati kuzatiladi", icon: <HeartIcon /> },
                ].map((s) => (
                  <Box key={s.n} sx={{ display: "flex", gap: 2, alignItems: "flex-start", py: 1.5 }}>
                    <Avatar sx={{ bgcolor: "#2563eb", width: 34, height: 34, fontSize: 14, fontWeight: 700 }}>{s.n}</Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }} color="white">{s.t}</Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>{s.d}</Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ===== Muammo ===== */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Biz hal qiladigan muammo</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Statsionardan chiqqan og&lsquo;ir bemor uyga qaytgach, davomiy parvarish kim tomonidan kuzatiladi?
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 4 }}>
                <Avatar sx={{ bgcolor: "#fee2e2", color: "#dc2626", mb: 2, width: 48, height: 48 }}>
                  <HospitalIcon />
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Parvarish uzilishi</Typography>
                <Typography color="text.secondary">
                  O&lsquo;zbekistonning ko&lsquo;p kasalxonalarida bemor chiqarilganda hududiy oilaviy
                  shifokorga avtomatik xabarnoma tizimi yo&lsquo;q. Bemor uyga qaytgach, davomiy
                  parvarishlash uziladi va holatni kuzatish o&lsquo;z-o&lsquo;ziga qoladi.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 4 }}>
                <Avatar sx={{ bgcolor: "#dbeafe", color: PRIMARY, mb: 2, width: 48, height: 48 }}>
                  <SmartphoneIcon />
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Raqamli tafovut</Typography>
                <Typography color="text.secondary">
                  Ko&lsquo;p bemor smartfon yoki internetdan foydalana olmaydi. CareLink bemorning
                  o&lsquo;ziga bog&lsquo;liq emas — ma&lsquo;lumotni tibbiyot xodimi kiritadi, AI esa
                  bemorning o&lsquo;rniga kuzatuvni olib boradi.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* ===== Yechim / Xususiyatlar ===== */}
      <Box sx={{ bgcolor: "#f1f5f9", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>CareLink nima beradi?</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Bitta uzluksiz jarayon: raqamlashtirish → yo&lsquo;naltirish → kuzatuv → natija
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {[
              { icon: <MedicalIcon />, t: "Digital intake", d: "Shikoyat, ko'rsatkich va tashvislar xodim tomonidan raqamlashtiriladi.", c: "#2563eb" },
              { icon: <NotifIcon />, t: "Discharge coordination", d: "Chiqarishda avtomatik xabarnoma hududiy shifokorga yetkaziladi.", c: "#7c3aed" },
              { icon: <HeartIcon />, t: "AI follow-up", d: "Bemor har soat tekshiriladi, holati AI tomonidan kuzatiladi.", c: "#059669" },
            ].map((f) => (
              <Grid size={{ xs: 12, md: 4 }} key={f.t}>
                <Card sx={{ height: "100%", "&:hover": { boxShadow: 6, transform: "translateY(-4px)" }, transition: "all .2s" }}>
                  <CardContent sx={{ p: 4, textAlign: "center" }}>
                    <Avatar sx={{ bgcolor: `${f.c}15`, color: f.c, width: 56, height: 56, mx: "auto", mb: 2 }}>{f.icon}</Avatar>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>{f.t}</Typography>
                    <Typography color="text.secondary">{f.d}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ===== Qanday ishlaydi ===== */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Qanday ishlaydi?</Typography>
        </Box>
        <Grid container spacing={3}>
          {[
            { n: "1", t: "Bemor qabul qilinadi", d: "Tibbiyot xodimi bemorni tizimga kiritadi, tashxis va ko'rsatkichlarni qayd etadi.", icon: <GroupsIcon /> },
            { n: "2", t: "Chiqarish + dori-darmon", d: "Shifokor chiqarish, tavsiyalar va dori-darmonlarni (necha mahal, necha kun) kiritadi.", icon: <HospitalIcon /> },
            { n: "3", t: "AI kuzatuv", d: "Dori eslatmalari avtomatik, bemor har soat tekshiriladi, holati shifokorga yetkaziladi.", icon: <TimelineIcon /> },
          ].map((s, i) => (
            <Grid size={{ xs: 12, md: 4 }} key={s.n}>
              <Box sx={{ position: "relative", textAlign: "center" }}>
                <Avatar sx={{ bgcolor: PRIMARY, width: 56, height: 56, mx: "auto", mb: 2, fontSize: 22, fontWeight: 800 }}>{s.n}</Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{s.t}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>{s.d}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ===== Narxlar ===== */}
      <Box sx={{ bgcolor: "#f1f5f9", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Oddiy narxlar</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Ikki xil obuna — o&lsquo;zingizga mosini tanlang
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ maxWidth: 800, mx: "auto", justifyContent: "center" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 4, borderTop: `4px solid ${PRIMARY}`, height: "100%" }}>
                <Stack direction="row" sx={{ mb: 2, alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Individual</Typography>
                  <Chip label="B2C" size="small" sx={{ bgcolor: "#dbeafe", color: PRIMARY, fontWeight: 700 }} />
                </Stack>
                <Typography variant="h3" sx={{ fontWeight: 800 }} color="primary.main">$5<span style={{ fontSize: 18, color: "#64748b" }}> / oy</span></Typography>
                <Stack spacing={1} sx={{ my: 3 }}>
                  {["Har soatda AI tekshiruvi", "Push bildirishnomalar", "Dori-darmon eslatmalari", "24/7 AI chatbot"].map((f) => (
                    <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckIcon sx={{ color: "#10b981", fontSize: 18 }} />
                      <Typography variant="body2">{f}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Button component={Link} href="/signup" variant="contained" fullWidth sx={{ bgcolor: PRIMARY }}>Sotib olish</Button>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 4, borderTop: "4px solid #10b981", height: "100%" }}>
                <Stack direction="row" sx={{ mb: 2, alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Klinik</Typography>
                  <Chip label="B2B" size="small" sx={{ bgcolor: "#d1fae5", color: "#059669", fontWeight: 700 }} />
                </Stack>
                <Typography variant="h3" sx={{ fontWeight: 800 }} color="success.main">Bepul<span style={{ fontSize: 18, color: "#64748b" }}> *</span></Typography>
                <Stack spacing={1} sx={{ my: 3 }}>
                  {["Klinika to'laydi", "Dori va ma'lumotlar avtomatik sinxron", "Statsionar muddati davomida faol", "Shifokor tavsiyalari"].map((f) => (
                    <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckIcon sx={{ color: "#10b981", fontSize: 18 }} />
                      <Typography variant="body2">{f}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Button component={Link} href="/signup" variant="outlined" fullWidth sx={{ color: "#059669", borderColor: "#059669" }}>Klinik kodni kiritish</Button>
              </Card>
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 3 }}>
            * Klinik obuna klinika faol bo&lsquo;lganda ishlaydi — klinikangizdagi shifokor statsionar kod beradi.
          </Typography>
        </Container>
      </Box>

      {/* ===== CTA ===== */}
      <Box sx={{ background: `linear-gradient(135deg, ${PRIMARY}, #172554)`, py: { xs: 6, md: 8 }, textAlign: "center" }}>
        <Container maxWidth="md">
          <Typography variant="h4" color="white" sx={{ mb: 2, fontWeight: 800 }}>
            Bemor bosqichlar orasida yo&lsquo;qolib qolmasin
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mb: 4 }}>
            Bugun CareLink&lsquo;ga qo&lsquo;shiling — tibbiy kuzatuvning uzluksizligini ta&lsquo;minlang.
          </Typography>
          <Button component={Link} href="/signup" variant="contained" size="large" sx={{ bgcolor: "#2563eb", px: 5, py: 1.5, fontWeight: 700, "&:hover": { bgcolor: "#3b82f6" } }}>
            Bepul boshlash <ArrowIcon sx={{ ml: 1 }} />
          </Button>
        </Container>
      </Box>

      {/* ===== Footer ===== */}
      <Box sx={{ bgcolor: "#0f172a", color: "rgba(255,255,255,0.6)", py: 4, textAlign: "center" }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} CareLink — mavjud sog&lsquo;liqni saqlash tizimlari ustida ishlovchi care-coordination layer.
        </Typography>
      </Box>
    </Box>
  );
}
