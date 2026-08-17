"use client";

import Link from "next/link";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  ArrowForwardRounded,
  CheckCircleRounded,
  CircleRounded,
  CrisisAlertRounded,
  DarkModeOutlined,
  FavoriteRounded,
  HealthAndSafetyRounded,
  LocalHospitalRounded,
  MedicationRounded,
  MonitorHeartRounded,
  NotificationsActiveRounded,
  ShieldRounded,
  SmartphoneRounded,
  VolunteerActivismRounded,
} from "@mui/icons-material";
import ThemeRegistry from "@/lib/theme";

const navy = "#11211F";
const teal = "#0F6E5C";

export default function Home() {
  return (
    <ThemeRegistry>
      <LandingPage />
    </ThemeRegistry>
  );
}

function Brand() {
  return (
    <Stack direction="row" alignItems="center" spacing={1.1}>
      <Avatar
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.5,
          bgcolor: "linear-gradient(135deg, #0F6E5C, #1F5A73)",
          color: "#F3FBF8",
          boxShadow: "0 12px 22px rgba(15,110,92,.18)",
        }}
      >
        <FavoriteRounded sx={{ fontSize: 20 }} />
      </Avatar>
      <Typography sx={{ color: navy, fontSize: 20, lineHeight: 1, fontWeight: 800, letterSpacing: "-.045em" }}>
        Care<span style={{ color: teal }}>Link</span>
      </Typography>
    </Stack>
  );
}

function LandingPage() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box sx={{ overflow: "hidden", bgcolor: "#F5F7F4" }}>
      <AppBar elevation={0} position="sticky" sx={{ bgcolor: "rgba(255,255,255,.82)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(17,34,31,.08)" }}>
        <Toolbar sx={{ minHeight: { xs: 68, md: 76 }, maxWidth: 1240, width: "100%", mx: "auto", px: { xs: 2, sm: 3 } }}>
          <Brand />
          {!compact && (
            <Stack direction="row" spacing={3.5} sx={{ ml: 7, flex: 1 }}>
              <Typography component="a" href="#yechim" variant="body2" sx={navLinkSx}>Yechim</Typography>
              <Typography component="a" href="#jarayon" variant="body2" sx={navLinkSx}>Qanday ishlaydi</Typography>
              <Typography component="a" href="#obuna" variant="body2" sx={navLinkSx}>Obunalar</Typography>
            </Stack>
          )}
          <Box sx={{ ml: "auto", display: "flex", gap: { xs: 0.5, sm: 1.25 }, alignItems: "center" }}>
            {!compact && (
              <Button component={Link} href="/login" color="inherit" sx={{ color: "#4F5E5B" }}>
                Kirish
              </Button>
            )}
            <Button
              component={Link}
              href="/signup"
              variant="contained"
              size={compact ? "small" : "medium"}
              sx={{ bgcolor: teal, px: { xs: 1.5, sm: 2.25 }, "&:hover": { bgcolor: "#0B5C4E" } }}
            >
              Boshlash
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="section" sx={{ position: "relative", overflow: "hidden", background: "linear-gradient(125deg, #F5F7F4 0%, #EAF4F1 45%, #EAF7F8 100%)", color: navy }}>
        <Box className="soft-grid" sx={{ position: "absolute", inset: 0, opacity: 0.42 }} />
        <Box className="hero-orb" sx={{ position: "absolute", right: "8%", top: 90, width: 200, height: 200, border: "1px solid rgba(15,110,92,.1)", borderRadius: "50%", background: "rgba(15,110,92,.05)" }} />
        <Box className="hero-orb hero-orb--slow" sx={{ position: "absolute", left: "-3%", bottom: -110, width: 300, height: 300, border: "42px solid rgba(15,110,92,.05)", borderRadius: "50%" }} />

        <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 8, md: 12.5 }, px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 6, md: 5 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip icon={<ShieldRounded sx={{ color: teal }} />} label="Statsionardan uyga — uzluksiz parvarish" sx={{ color: teal, bgcolor: "rgba(15,110,92,.08)", border: "1px solid rgba(15,110,92,.12)", mb: 3 }} />
              <Typography component="h1" sx={{ maxWidth: 760, color: navy, fontSize: { xs: "2.5rem", sm: "3.45rem", md: "4.15rem" }, lineHeight: { xs: 1.08, md: 1.04 }, fontWeight: 800, letterSpacing: "-.055em" }}>
                Bemor uyga qaytganda,
                <Box component="span" sx={{ display: "block", color: teal }}>parvarish ham davom etadi.</Box>
              </Typography>
              <Typography sx={{ mt: 3, maxWidth: 630, fontSize: { xs: 16, md: 19 }, lineHeight: 1.65, color: "#4F5E5B" }}>
                Og‘ir bemor statsionardan chiqarilgach kuzatuvsiz qolmasin. CareLink klinika, bemor va tibbiyot xodimini bitta ishonchli oqimda bog‘laydi.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
                <Button component={Link} href="/signup" variant="contained" size="large" endIcon={<ArrowForwardRounded />} sx={{ bgcolor: teal, color: "#F3FBF8", "&:hover": { bgcolor: "#0B5C4E" } }}>
                  Bemor sifatida boshlash
                </Button>
                <Button component={Link} href="/login" variant="outlined" size="large" sx={{ borderColor: "rgba(17,34,31,.16)", color: navy, "&:hover": { borderColor: teal, bgcolor: "rgba(15,110,92,.04)" } }}>
                  Klinikaga kirish
                </Button>
              </Stack>
              <Stack direction="row" spacing={{ xs: 2.2, sm: 4 }} divider={<Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(17,34,31,.1)" }} />} sx={{ mt: 5 }}>
                <HeroMetric value="24/7" label="AI kuzatuv" />
                <HeroMetric value="$5" label="individual / oy" />
                <HeroMetric value="0" label="uzilgan care yo‘li" />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <HeroProductPreview />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 6, md: 10 } }}>
        <Grid container spacing={2.2}>
          {[
            { icon: <CrisisAlertRounded />, title: "Muammo", text: "Bemor chiqarilgach, davomiy parvarish uziladi va holatni kuzatish o‘z-o‘ziga qoladi.", tone: "#C74B49", bg: "#FDEDED" },
            { icon: <NotificationsActiveRounded />, title: "Bog‘lanish", text: "Chiqarish bilan bir vaqtda bemor, dori rejasi va kuzatuv vazifalari sinxronlanadi.", tone: "#136C83", bg: "#EAF7FA" },
            { icon: <VolunteerActivismRounded />, title: "Natija", text: "Tibbiyot xodimi holatni ko‘radi, bemor esa eslatmalar va AI yordamni oladi.", tone: "#1FA777", bg: "#EAFBF3" },
          ].map((item) => (
            <Grid size={{ xs: 12, md: 4 }} key={item.title}>
              <Card sx={{ height: "100%", border: "1px solid rgba(17,34,31,.08)", transition: "transform .25s ease, box-shadow .25s ease", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 18px 28px rgba(17,34,31,.08)" } }}>
                <CardContent sx={{ p: 3.2 }}>
                  <Avatar sx={{ bgcolor: item.bg, color: item.tone, width: 48, height: 48, borderRadius: 3, mb: 2 }}>{item.icon}</Avatar>
                  <Typography variant="h6">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{item.text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box id="yechim" component="section" sx={{ bgcolor: "#F8FBF9", borderTop: "1px solid rgba(17,34,31,.08)", borderBottom: "1px solid rgba(17,34,31,.08)" }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 7, md: 11 } }}>
          <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <SectionEyebrow icon={<HealthAndSafetyRounded />}>Bitta care yo‘li</SectionEyebrow>
              <Typography variant="h2" sx={{ mt: 1.75, fontSize: { xs: 31, md: 44 }, color: navy }}>Qog‘oz chiqarish varaqasi emas, amalda ishlaydigan kuzatuv.</Typography>
              <Typography color="text.secondary" sx={{ mt: 2, lineHeight: 1.75, fontSize: 16 }}>Shifokor chiqarish vaqtida tashxis, davolash yakuni, tavsiya va dori jadvalini bir marta kiritadi. Bemor ilovasida hammasi avtomatik paydo bo‘ladi.</Typography>
              <Stack spacing={1.6} sx={{ mt: 3.25 }}>
                {[
                  "Klinikaga tegishli bemorlar — himoyalangan ro‘yxat",
                  "Soatlik yoki kunlik dori eslatmalari",
                  "AI uchun klinik tashxis va tavsiya konteksti",
                  "Kuzatuv natijasi real vaqt rejimida",
                ].map((item) => <FeatureLine key={item}>{item}</FeatureLine>)}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <CareFlowPanel />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container id="jarayon" maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 7, md: 11 } }}>
        <Box sx={{ textAlign: "center", maxWidth: 720, mx: "auto" }}>
          <SectionEyebrow centered icon={<MonitorHeartRounded />}>Uzluksiz monitoring</SectionEyebrow>
          <Typography variant="h2" sx={{ mt: 1.75, fontSize: { xs: 31, md: 44 }, color: navy }}>Uch qadamda parvarish uzilmaydi</Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>Klinikadagi ma’lumot bemor smartfonidagi tushunarli harakatlarga aylanadi.</Typography>
        </Box>
        <Grid container spacing={2.25} sx={{ mt: { xs: 4, md: 6 } }}>
          {[
            { number: "01", icon: <LocalHospitalRounded />, title: "Chiqarish rejasini yarating", text: "Tashxis, xulosa, tavsiya hamda dori jadvalini bemor profilida saqlang.", color: "#0F6E5C" },
            { number: "02", icon: <SmartphoneRounded />, title: "Bemor kod bilan ulanadi", text: "Faol klinika kodi bemorga bepul klinik obunani va barcha ma’lumotlarni beradi.", color: "#136C83" },
            { number: "03", icon: <MonitorHeartRounded />, title: "Kuzating va yordam bering", text: "Eslatmalar, AI check-in va kuzatuv natijalari tibbiyot xodimi ko‘rinishida.", color: "#1FA777" },
          ].map((step) => (
            <Grid key={step.number} size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 3.2, height: "100%", border: "1px solid rgba(17,34,31,.08)", borderRadius: 4, position: "relative", overflow: "hidden", bgcolor: "#fff" }}>
                <Typography sx={{ color: "rgba(17,34,31,.12)", fontSize: 42, lineHeight: 1, fontWeight: 800, letterSpacing: "-.06em", position: "absolute", top: 22, right: 24 }}>{step.number}</Typography>
                <Avatar sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: `${step.color}18`, color: step.color }}>{step.icon}</Avatar>
                <Typography variant="h6" sx={{ mt: 3, pr: 5 }}>{step.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{step.text}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box id="obuna" component="section" sx={{ bgcolor: "#11211F", color: "#fff", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, opacity: .2 }} className="soft-grid" />
        <Container maxWidth="lg" sx={{ position: "relative", px: { xs: 2, sm: 3 }, py: { xs: 7, md: 10 } }}>
          <Box sx={{ textAlign: "center", maxWidth: 690, mx: "auto" }}>
            <Chip label="SHAFFOF OBUNALAR" sx={{ bgcolor: "rgba(255,255,255,.08)", color: "#EAF7FA", border: "1px solid rgba(255,255,255,.1)" }} />
            <Typography variant="h2" sx={{ mt: 2, color: "#fff", fontSize: { xs: 31, md: 44 } }}>Kimga qulay bo‘lsa, o‘sha yo‘l.</Typography>
            <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,.72)", lineHeight: 1.7 }}>Bemor mustaqil ulanishi yoki klinika tomonidan davomiy parvarishga qo‘shilishi mumkin.</Typography>
          </Box>
          <Grid container spacing={2.5} justifyContent="center" sx={{ mt: 5 }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <SubscriptionCard title="Individual" tag="Bemor uchun" price="$5" subtitle="oyiga" icon={<FavoriteRounded />} color="#84ADFF" action="Individual obunani boshlash" href="/signup" features={["24/7 AI sog‘liq yordamchisi", "Dori va o‘lchov eslatmalari", "Shaxsiy sog‘liq ko‘rsatkichlari", "Istalgan klinikadan mustaqil"]} />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <SubscriptionCard featured title="Klinik kod orqali" tag="Klinika tomonidan" price="Bepul" subtitle="faol klinika obunasi bilan" icon={<LocalHospitalRounded />} color="#6CE9A6" action="Kodni faollashtirish" href="/signup" features={["Chiqarish rejasi avtomatik sinxron", "Klinika bergan maxsus kod", "Dori jadvali reminders’ga tushadi", "Klinika obunasi faol bo‘lsa ishlaydi"]} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 7, md: 10 } }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5.5 }, overflow: "hidden", position: "relative", border: "1px solid rgba(15,110,92,.12)", background: "linear-gradient(130deg, rgba(232,244,240,.9), #ffffff 56%, rgba(234,251,243,.9))" }}>
          <Box sx={{ position: "absolute", right: -70, top: -90, width: 260, height: 260, borderRadius: "50%", bgcolor: "rgba(15,110,92,.06)" }} />
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={3} sx={{ position: "relative" }}>
            <Box maxWidth={630}>
              <Typography variant="h3" sx={{ color: navy, fontSize: { xs: 28, md: 38 } }}>Bemor bosqichlar orasida yo‘qolib qolmasin.</Typography>
              <Typography color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>CareLink bilan klinikadan uyga qaytish — parvarishning yakuni emas, keyingi ishonchli bosqichi.</Typography>
            </Box>
            <Button component={Link} href="/signup" variant="contained" size="large" endIcon={<ArrowForwardRounded />} sx={{ flexShrink: 0, bgcolor: teal }}>CareLink’ni boshlash</Button>
          </Stack>
        </Paper>
      </Container>

      <Box component="footer" sx={{ borderTop: "1px solid rgba(17,34,31,.08)", py: 3.25 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
          <Brand />
          <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} CareLink · O‘zbekiston uchun uzluksiz care coordination.</Typography>
          <Tooltip title="CareLink light interface"><IconButton size="small" sx={{ color: "#4F5E5B" }}><DarkModeOutlined fontSize="small" /></IconButton></Tooltip>
        </Container>
      </Box>
    </Box>
  );
}

const navLinkSx = { color: "#475467", textDecoration: "none", cursor: "pointer", fontWeight: 650, "&:hover": { color: teal } };

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, lineHeight: 1, color: navy }}>{value}</Typography>
      <Typography variant="caption" sx={{ mt: 0.5, color: "#4F5E5B" }}>{label}</Typography>
    </Box>
  );
}

function HeroProductPreview() {
  return (
    <Box sx={{ maxWidth: 440, mx: "auto", position: "relative" }}>
      <Paper elevation={0} sx={{ overflow: "hidden", borderRadius: 5, p: { xs: 1.25, md: 1.75 }, bgcolor: "rgba(255,255,255,.94)", border: "1px solid rgba(17,34,31,.08)", boxShadow: "0 28px 70px rgba(17,34,31,.12)", transform: { md: "rotate(2deg)" } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pt: 0.5, pb: 1.5 }}>
          <Brand />
          <Chip size="small" label="LIVE" icon={<CircleRounded sx={{ fontSize: "8px !important", color: "#12B76A !important" }} />} sx={{ color: "#027A48", bgcolor: "#ECFDF3" }} />
        </Stack>
        <Box sx={{ borderRadius: 3, bgcolor: "#F7F9FC", p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="text.secondary">BEMOR HOLATI</Typography>
              <Typography sx={{ mt: 0.25, color: navy, fontWeight: 800 }}>Aziza Mirzayeva</Typography>
            </Box>
            <Avatar sx={{ bgcolor: "#D1FADF", color: "#027A48" }}><CheckCircleRounded /></Avatar>
          </Stack>
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2.5, bgcolor: "#fff", border: "1px solid rgba(17,34,31,.08)" }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Avatar sx={{ width: 34, height: 34, bgcolor: "#EFFAF7", color: teal }}><MedicationRounded fontSize="small" /></Avatar>
              <Box flex={1}>
                <Typography variant="body2" fontWeight={750}>Bisoprolol · 5 mg</Typography>
                <Typography variant="caption" color="text.secondary">Har kuni · 08:00 va 20:00</Typography>
              </Box>
              <Chip label="Bugun" size="small" color="success" />
            </Stack>
          </Box>
          <Box sx={{ mt: 2.25, p: 2, borderRadius: 3, bgcolor: "#fff", border: "1px solid rgba(17,34,31,.08)" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">KUZATUV</Typography>
              <Typography variant="body2" fontWeight={800} color="success.main">Norma</Typography>
            </Stack>
            <Stack spacing={1.1} sx={{ mt: 1.5 }}>
              <MetricRow label="Yurak ritmi" value="72 bpm" tone="#0F6E5C" />
              <MetricRow label="Qon bosimi" value="118/76" tone="#136C83" />
              <MetricRow label="Dori to‘g‘ri qabul" value="96%" tone="#1FA777" />
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" sx={{ color: tone, fontWeight: 700 }}>{value}</Typography>
      </Stack>
      <Box sx={{ mt: 0.55, height: 6, borderRadius: 999, bgcolor: "#EDF2F1", overflow: "hidden" }}>
        <Box sx={{ width: "76%", height: "100%", borderRadius: 999, bgcolor: tone }} />
      </Box>
    </Box>
  );
}

function CareFlowPanel() {
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 4, border: "1px solid rgba(17,34,31,.08)", background: "linear-gradient(180deg, #FFFFFF 0%, #F6FAF8 100%)" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 2 }}>
        <Typography variant="h6" sx={{ color: navy }}>Bemor ekotizimi</Typography>
        <Chip label="Online" size="small" sx={{ bgcolor: "#EAFBF3", color: "#1FA777" }} />
      </Stack>
      <Box sx={{ display: "grid", gap: 1.25 }}>
        {[
          { title: "Bemorning tashxisi", value: "Euglycemia + post-op monitoring", tone: "#0F6E5C" },
          { title: "Dori rejasi", value: "3 ta dori • 1 ta eslatma", tone: "#136C83" },
          { title: "Kuzatuv", value: "43% yanada oshgan uyda kelib-tushish darajasi", tone: "#1FA777" },
        ].map((item) => (
          <Box key={item.title} sx={{ border: "1px solid rgba(17,34,31,.08)", borderRadius: 3, p: 1.7, background: "#fff" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.25}>
              <Box>
                <Typography variant="caption" color="text.secondary">{item.title}</Typography>
                <Typography variant="body2" sx={{ mt: 0.4, fontWeight: 700 }}>{item.value}</Typography>
              </Box>
              <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: item.tone }} />
            </Stack>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function SubscriptionCard({ title, tag, price, subtitle, icon, color, action, href, features, featured }: { title: string; tag: string; price: string; subtitle: string; icon: React.ReactNode; color: string; action: string; href: string; features: string[]; featured?: boolean }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: featured ? "1px solid rgba(108,233,166,.45)" : "1px solid rgba(255,255,255,.1)", background: featured ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.04)", color: "#fff", height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Chip label={tag} size="small" sx={{ bgcolor: "rgba(255,255,255,.08)", color: "#DCEBFF", border: "1px solid rgba(255,255,255,.09)" }} />
        <Avatar sx={{ bgcolor: `${color}20`, color, borderRadius: 2.5 }}>{icon}</Avatar>
      </Stack>
      <Typography variant="h5" sx={{ mt: 2, fontWeight: 700 }}>{title}</Typography>
      <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mt: 1.5 }}>
        <Typography sx={{ fontSize: { xs: 28, md: 36 }, fontWeight: 800, letterSpacing: "-.05em", color: "#fff" }}>{price}</Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,.72)" }}>{subtitle}</Typography>
      </Stack>
      <Stack spacing={1.2} sx={{ mt: 2.5 }}>
        {features.map((feature) => (
          <Stack key={feature} direction="row" spacing={1.1} alignItems="center">
            <CheckCircleRounded sx={{ color, fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,.82)" }}>{feature}</Typography>
          </Stack>
        ))}
      </Stack>
      <Button component={Link} href={href} variant="contained" fullWidth sx={{ mt: 3, bgcolor: "#fff", color: navy, "&:hover": { bgcolor: "#EEF4FF" } }}>{action}</Button>
    </Paper>
  );
}

function SectionEyebrow({ children, icon, centered = false }: { children: React.ReactNode; icon?: React.ReactNode; centered?: boolean }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent={centered ? "center" : "flex-start"}>
      {icon && <Box sx={{ color: teal }}>{icon}</Box>}
      <Typography variant="overline" sx={{ color: teal, fontWeight: 800, letterSpacing: ".12em" }}>{children}</Typography>
    </Stack>
  );
}

function FeatureLine({ children }: { children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.3} alignItems="center">
      <CheckCircleRounded sx={{ color: "#1FA777", fontSize: 20 }} />
      <Typography variant="body2" color="text.secondary">{children}</Typography>
    </Stack>
  );
}
