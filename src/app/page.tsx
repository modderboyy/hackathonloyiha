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
  LockRounded,
  MedicationRounded,
  MonitorHeartRounded,
  NotificationsActiveRounded,
  ShieldRounded,
  SmartphoneRounded,
  VolunteerActivismRounded,
} from "@mui/icons-material";
import ThemeRegistry from "@/lib/theme";

const navy = "#0B1F4A";
const blue = "#155EEF";

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
      <Avatar sx={{ width: 36, height: 36, bgcolor: blue, borderRadius: "12px", boxShadow: "0 8px 18px rgba(21,94,239,.28)" }}>
        <FavoriteRounded sx={{ fontSize: 20 }} />
      </Avatar>
      <Typography sx={{ color: navy, fontSize: 20, lineHeight: 1, fontWeight: 800, letterSpacing: "-.045em" }}>
        Care<span style={{ color: blue }}>Link</span>
      </Typography>
    </Stack>
  );
}

function LandingPage() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box sx={{ overflow: "hidden", bgcolor: "#fff" }}>
      <AppBar elevation={0} position="sticky" sx={{ bgcolor: "rgba(255,255,255,.88)", backdropFilter: "blur(18px)", borderBottom: "1px solid #EAECF0" }}>
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
            {!compact && <Button component={Link} href="/login" color="inherit" sx={{ color: "#344054" }}>Kirish</Button>}
            <Button component={Link} href="/signup" variant="contained" size={compact ? "small" : "medium"} sx={{ bgcolor: blue, px: { xs: 1.5, sm: 2.25 }, "&:hover": { bgcolor: "#004EEB" } }}>
              Boshlash
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="section" sx={{ position: "relative", overflow: "hidden", background: `radial-gradient(circle at 80% 18%, rgba(72,134,255,.36), transparent 29%), radial-gradient(circle at 10% 96%, rgba(72,191,174,.16), transparent 30%), linear-gradient(125deg, ${navy} 0%, #0E317A 52%, #155EEF 140%)`, color: "white" }}>
        <Box className="soft-grid" sx={{ position: "absolute", inset: 0, opacity: 0.32 }} />
        <Box className="hero-orb" sx={{ position: "absolute", right: "6%", top: 88, width: 190, height: 190, border: "1px solid rgba(255,255,255,.16)", borderRadius: "50%" }} />
        <Box className="hero-orb hero-orb--slow" sx={{ position: "absolute", left: "-3%", bottom: -95, width: 280, height: 280, border: "42px solid rgba(255,255,255,.05)", borderRadius: "50%" }} />

        <Container maxWidth="lg" sx={{ position: "relative", py: { xs: 8, md: 12.5 }, px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 6, md: 5 }} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip icon={<ShieldRounded sx={{ color: "#B2CCFF !important" }} />} label="Statsionardan uyga — uzluksiz parvarish" sx={{ color: "#DCE8FF", bgcolor: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.16)", mb: 3 }} />
              <Typography component="h1" sx={{ maxWidth: 760, color: "#fff", fontSize: { xs: "2.5rem", sm: "3.45rem", md: "4.15rem" }, lineHeight: { xs: 1.08, md: 1.04 }, fontWeight: 780, letterSpacing: "-.055em" }}>
                Bemor uyga qaytganda,
                <Box component="span" sx={{ display: "block", color: "#9BC0FF" }}>parvarish ham davom etadi.</Box>
              </Typography>
              <Typography sx={{ mt: 3, maxWidth: 630, fontSize: { xs: 16, md: 19 }, lineHeight: 1.65, color: "rgba(240,246,255,.82)" }}>
                Og‘ir bemor statsionardan chiqarilgach kuzatuvsiz qolmasin. CareLink klinika, bemor va tibbiyot xodimini bitta xavfsiz oqimda bog‘laydi.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
                <Button component={Link} href="/signup" variant="contained" size="large" endIcon={<ArrowForwardRounded />} sx={{ bgcolor: "#fff", color: navy, "&:hover": { bgcolor: "#EEF4FF" } }}>
                  Bemor sifatida boshlash
                </Button>
                <Button component={Link} href="/login" variant="outlined" size="large" sx={{ borderColor: "rgba(255,255,255,.35)", color: "#fff", "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,.08)" } }}>
                  Klinikaga kirish
                </Button>
              </Stack>
              <Stack direction="row" spacing={{ xs: 2.2, sm: 4 }} divider={<Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(255,255,255,.18)" }} />} sx={{ mt: 5 }}>
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
            { icon: <CrisisAlertRounded />, title: "Muammo", text: "Bemor chiqarilgach, davomiy parvarish uziladi va holatni kuzatish o‘z-o‘ziga qoladi.", tone: "#F04438", bg: "#FEF3F2" },
            { icon: <NotificationsActiveRounded />, title: "Bog‘lanish", text: "Chiqarish bilan bir vaqtda bemor, dori rejasi va kuzatuv vazifalari sinxronlanadi.", tone: "#155EEF", bg: "#EFF4FF" },
            { icon: <VolunteerActivismRounded />, title: "Natija", text: "Tibbiyot xodimi holatni ko‘radi, bemor esa eslatmalar va AI yordamni oladi.", tone: "#0E9384", bg: "#ECFDF3" },
          ].map((item) => (
            <Grid size={{ xs: 12, md: 4 }} key={item.title}>
              <Card sx={{ height: "100%", border: "1px solid #EAECF0", transition: "transform .25s ease, box-shadow .25s ease", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 16px 28px rgba(16,24,40,.10)" } }}>
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

      <Box id="yechim" component="section" sx={{ bgcolor: "#F8FAFC", borderTop: "1px solid #EAECF0", borderBottom: "1px solid #EAECF0" }}>
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
            { number: "01", icon: <LocalHospitalRounded />, title: "Chiqarish rejasini yarating", text: "Tashxis, xulosa, tavsiya hamda dori jadvalini bemor profilida saqlang.", color: "#155EEF" },
            { number: "02", icon: <SmartphoneRounded />, title: "Bemor kod bilan ulanadi", text: "Faol klinika kodi bemorga bepul klinik obunani va barcha ma’lumotlarni beradi.", color: "#7A5AF8" },
            { number: "03", icon: <MonitorHeartRounded />, title: "Kuzating va yordam bering", text: "Eslatmalar, AI check-in va kuzatuv natijalari tibbiyot xodimi ko‘rinishida.", color: "#0E9384" },
          ].map((step) => (
            <Grid key={step.number} size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 3.2, height: "100%", border: "1px solid #EAECF0", borderRadius: 4, position: "relative", overflow: "hidden", bgcolor: "#fff" }}>
                <Typography sx={{ color: "#D0D5DD", fontSize: 42, lineHeight: 1, fontWeight: 800, letterSpacing: "-.06em", position: "absolute", top: 22, right: 24 }}>{step.number}</Typography>
                <Avatar sx={{ width: 50, height: 50, borderRadius: 3, bgcolor: `${step.color}12`, color: step.color }}>{step.icon}</Avatar>
                <Typography variant="h6" sx={{ mt: 3, pr: 5 }}>{step.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{step.text}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box id="obuna" component="section" sx={{ bgcolor: navy, color: "#fff", position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0, opacity: .32 }} className="soft-grid" />
        <Container maxWidth="lg" sx={{ position: "relative", px: { xs: 2, sm: 3 }, py: { xs: 7, md: 10 } }}>
          <Box sx={{ textAlign: "center", maxWidth: 690, mx: "auto" }}>
            <Chip label="SHAFFOF OBUNALAR" sx={{ bgcolor: "rgba(255,255,255,.1)", color: "#C7D7FE", border: "1px solid rgba(255,255,255,.14)" }} />
            <Typography variant="h2" sx={{ mt: 2, color: "#fff", fontSize: { xs: 31, md: 44 } }}>Kimga qulay bo‘lsa, o‘sha yo‘l.</Typography>
            <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,.7)", lineHeight: 1.7 }}>Bemor mustaqil ulanishi yoki klinika tomonidan davomiy parvarishga qo‘shilishi mumkin.</Typography>
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
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5.5 }, overflow: "hidden", position: "relative", border: "1px solid #D1E0FF", background: "linear-gradient(130deg, #EFF4FF, #fff 56%, #ECFDF3)" }}>
          <Box sx={{ position: "absolute", right: -70, top: -90, width: 260, height: 260, borderRadius: "50%", bgcolor: "rgba(21,94,239,.08)" }} />
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={3} sx={{ position: "relative" }}>
            <Box maxWidth={630}>
              <Typography variant="h3" sx={{ color: navy, fontSize: { xs: 28, md: 38 } }}>Bemor bosqichlar orasida yo‘qolib qolmasin.</Typography>
              <Typography color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>CareLink bilan klinikadan uyga qaytish — parvarishning yakuni emas, keyingi ishonchli bosqichi.</Typography>
            </Box>
            <Button component={Link} href="/signup" variant="contained" size="large" endIcon={<ArrowForwardRounded />} sx={{ flexShrink: 0, bgcolor: blue }}>CareLink’ni boshlash</Button>
          </Stack>
        </Paper>
      </Container>

      <Box component="footer" sx={{ borderTop: "1px solid #EAECF0", py: 3.25 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5, justifyContent: "space-between" }}>
          <Brand />
          <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} CareLink · O‘zbekiston uchun uzluksiz care coordination.</Typography>
          <Tooltip title="CareLink light interface"><IconButton size="small" sx={{ color: "#667085" }}><DarkModeOutlined fontSize="small" /></IconButton></Tooltip>
        </Container>
      </Box>
    </Box>
  );
}

const navLinkSx = { color: "#475467", textDecoration: "none", cursor: "pointer", fontWeight: 650, "&:hover": { color: blue } };

function HeroMetric({ value, label }: { value: string; label: string }) {
  return <Box><Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, lineHeight: 1 }}>{value}</Typography><Typography variant="caption" sx={{ mt: .5, color: "rgba(255,255,255,.62)" }}>{label}</Typography></Box>;
}

function HeroProductPreview() {
  return (
    <Box sx={{ maxWidth: 440, mx: "auto", position: "relative" }}>
      <Paper elevation={0} sx={{ overflow: "hidden", borderRadius: 5, p: { xs: 1.25, md: 1.75 }, bgcolor: "rgba(255,255,255,.94)", border: "1px solid rgba(255,255,255,.32)", boxShadow: "0 28px 70px rgba(2,15,48,.32)", transform: { md: "rotate(2deg)" } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pt: .5, pb: 1.5 }}>
          <Brand />
          <Chip size="small" label="LIVE" icon={<CircleRounded sx={{ fontSize: "8px !important", color: "#12B76A !important" }} />} sx={{ color: "#027A48", bgcolor: "#ECFDF3" }} />
        </Stack>
        <Box sx={{ borderRadius: 3, bgcolor: "#F7F9FC", p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box><Typography variant="caption" color="text.secondary">BEMOR HOLATI</Typography><Typography sx={{ mt: .25, color: navy, fontWeight: 800 }}>Aziza Mirzayeva</Typography></Box>
            <Avatar sx={{ bgcolor: "#D1FADF", color: "#027A48" }}><CheckCircleRounded /></Avatar>
          </Stack>
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2.5, bgcolor: "#fff", border: "1px solid #EAECF0" }}>
            <Stack direction="row" spacing={1.25} alignItems="center"><Avatar sx={{ width: 34, height: 34, bgcolor: "#EFF4FF", color: blue }}><MedicationRounded fontSize="small" /></Avatar><Box flex={1}><Typography variant="body2" fontWeight={750}>Bisoprolol · 5 mg</Typography><Typography variant="caption" color="text.secondary">Har kuni · 08:00 va 20:00</Typography></Box><Chip label="Bugun" size="small" color="success" /></Stack>
          </Box>
          <Box sx={{ mt: 1.25, p: 1.5, borderRadius: 2.5, bgcolor: "#EFF4FF" }}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start"><NotificationsActiveRounded sx={{ color: blue, mt: .15 }} fontSize="small" /><Box><Typography variant="body2" fontWeight={750} color={navy}>AI tekshiruv javobi</Typography><Typography variant="caption" color="text.secondary">“Bugun o‘zingizni qanday his qilyapsiz?”</Typography></Box></Stack>
          </Box>
        </Box>
      </Paper>
      <Paper elevation={0} sx={{ position: "absolute", zIndex: -1, right: -28, bottom: -26, width: 185, p: 2, borderRadius: 3, bgcolor: "#0E9384", color: "#fff", boxShadow: "0 18px 36px rgba(0,0,0,.18)" }}>
        <MonitorHeartRounded /><Typography fontWeight={750} sx={{ mt: .75 }}>Kuzatuv faol</Typography><Typography variant="caption" sx={{ opacity: .78 }}>Klinika va bemor bir oqimda</Typography>
      </Paper>
    </Box>
  );
}

function SectionEyebrow({ children, icon, centered = false }: { children: React.ReactNode; icon: React.ReactNode; centered?: boolean }) {
  return <Stack direction="row" justifyContent={centered ? "center" : "flex-start"} alignItems="center" spacing={.8}><Box sx={{ display: "grid", placeItems: "center", color: blue }}>{icon}</Box><Typography sx={{ color: blue, fontSize: 12, textTransform: "uppercase", fontWeight: 800, letterSpacing: ".09em" }}>{children}</Typography></Stack>;
}

function FeatureLine({ children }: { children: React.ReactNode }) {
  return <Stack direction="row" spacing={1.15} alignItems="center"><CheckCircleRounded sx={{ color: "#12B76A", fontSize: 20 }} /><Typography variant="body2" sx={{ fontWeight: 650, color: "#344054" }}>{children}</Typography></Stack>;
}

function CareFlowPanel() {
  const rows = [
    { icon: <LocalHospitalRounded />, title: "Chiqarish", value: "Tashxis va tavsiyalar saqlandi", color: "#155EEF", dot: "#155EEF" },
    { icon: <MedicationRounded />, title: "Dori jadvali", value: "2 mahal · 30 kun · auto-sync", color: "#7A5AF8", dot: "#7A5AF8" },
    { icon: <SmartphoneRounded />, title: "Bemor ilovasi", value: "Eslatma va AI kontekstga tayyor", color: "#0E9384", dot: "#0E9384" },
  ];
  return <Paper elevation={0} sx={{ p: { xs: 2, sm: 3.25 }, border: "1px solid #D0D5DD", bgcolor: "#fff", position: "relative", overflow: "hidden" }}>
    <Box sx={{ position: "absolute", inset: "auto -100px -100px auto", width: 260, height: 260, bgcolor: "#EFF4FF", borderRadius: "50%" }} />
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: "relative", pb: 2, borderBottom: "1px solid #EAECF0" }}><Box><Typography variant="caption" color="text.secondary" fontWeight={750}>CLINICAL CARE TIMELINE</Typography><Typography variant="h6" sx={{ mt: .3, color: navy }}>Hammasi bitta bemor profilida</Typography></Box><LockRounded sx={{ color: "#12B76A" }} /></Stack>
    <Stack spacing={1.25} sx={{ position: "relative", mt: 2 }}>
      {rows.map((row, index) => <Stack key={row.title} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, borderRadius: 2.5, bgcolor: index === 1 ? "#FAFAFF" : "#fff", border: "1px solid #EAECF0" }}><Avatar sx={{ bgcolor: `${row.color}13`, color: row.color, width: 38, height: 38, borderRadius: 2 }}>{row.icon}</Avatar><Box flex={1}><Typography variant="body2" fontWeight={750}>{row.title}</Typography><Typography variant="caption" color="text.secondary">{row.value}</Typography></Box><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: row.dot, boxShadow: `0 0 0 4px ${row.color}18` }} /></Stack>)}
    </Stack>
    <Box sx={{ position: "relative", mt: 2, p: 1.5, borderRadius: 2.5, bgcolor: "#ECFDF3", color: "#027A48" }}><Stack direction="row" spacing={1} alignItems="center"><ShieldRounded fontSize="small" /><Typography variant="caption" fontWeight={750}>Ma’lumot bemorning ruxsatli profilida va klinika hududida himoyalangan.</Typography></Stack></Box>
  </Paper>;
}

function SubscriptionCard({ title, tag, price, subtitle, icon, color, action, href, features, featured = false }: { title: string; tag: string; price: string; subtitle: string; icon: React.ReactNode; color: string; action: string; href: string; features: string[]; featured?: boolean }) {
  return <Card sx={{ height: "100%", p: 1, border: featured ? "2px solid #6CE9A6" : "1px solid rgba(255,255,255,.18)", bgcolor: featured ? "#fff" : "rgba(255,255,255,.06)", color: featured ? navy : "#fff", boxShadow: featured ? "0 22px 44px rgba(0,0,0,.22)" : "none" }}><CardContent sx={{ p: { xs: 2.25, sm: 3 } }}><Stack direction="row" justifyContent="space-between" alignItems="center"><Avatar sx={{ bgcolor: `${color}22`, color, borderRadius: 2.5 }}>{icon}</Avatar><Chip size="small" label={tag} sx={{ color: featured ? "#027A48" : color, bgcolor: featured ? "#ECFDF3" : "rgba(255,255,255,.08)" }} /></Stack><Typography variant="h5" sx={{ mt: 2.5 }}>{title}</Typography><Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 1 }}><Typography sx={{ fontSize: 37, lineHeight: 1, fontWeight: 800, letterSpacing: "-.05em", color: featured ? blue : "#fff" }}>{price}</Typography><Typography variant="body2" sx={{ color: featured ? "#667085" : "rgba(255,255,255,.62)" }}>{subtitle}</Typography></Stack><Divider sx={{ my: 2.5, borderColor: featured ? "#EAECF0" : "rgba(255,255,255,.14)" }} /><Stack spacing={1.25}>{features.map((item) => <Stack key={item} direction="row" spacing={1} alignItems="flex-start"><CheckCircleRounded sx={{ mt: .1, color: featured ? "#12B76A" : color, fontSize: 18 }} /><Typography variant="body2" sx={{ color: featured ? "#344054" : "rgba(255,255,255,.82)" }}>{item}</Typography></Stack>)}</Stack><Button component={Link} href={href} fullWidth variant={featured ? "contained" : "outlined"} sx={{ mt: 3, bgcolor: featured ? blue : "transparent", color: featured ? "#fff" : "#fff", borderColor: featured ? blue : "rgba(255,255,255,.42)", "&:hover": { bgcolor: featured ? "#004EEB" : "rgba(255,255,255,.08)", borderColor: "#fff" } }}>{action}</Button></CardContent></Card>;
}
