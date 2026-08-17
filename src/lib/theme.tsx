"use client";

import { createTheme, ThemeProvider, responsiveFontSizes } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

let theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#0F6E5C",
      light: "#DDF3EC",
      dark: "#0A524A",
      contrastText: "#F3FBF8",
    },
    secondary: {
      main: "#1F5A73",
      light: "#E5F2F7",
      dark: "#193E52",
      contrastText: "#F5FBFF",
    },
    success: { main: "#1FA777", light: "#EAFBF3", dark: "#0E7E5F" },
    warning: { main: "#D9872F", light: "#FFF4E4", dark: "#B86416" },
    error: { main: "#C74B49", light: "#FDEDED", dark: "#9F3636" },
    info: { main: "#136C83", light: "#EAF7FA", dark: "#0E4D5F" },
    background: { default: "#F5F7F4", paper: "#FFFFFF" },
    text: { primary: "#11211F", secondary: "#4F5E5B", disabled: "#8A978F" },
    divider: "rgba(17, 34, 31, 0.08)",
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.06em" },
    h2: { fontWeight: 700, letterSpacing: "-0.05em" },
    h3: { fontWeight: 700, letterSpacing: "-0.045em" },
    h4: { fontWeight: 700, letterSpacing: "-0.04em" },
    h5: { fontWeight: 680, letterSpacing: "-0.03em" },
    h6: { fontWeight: 680, letterSpacing: "-0.02em" },
    subtitle1: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 700, letterSpacing: "0" },
    allVariants: {
      color: "#11211F",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        html: { scrollBehavior: "smooth" },
        body: {
          margin: 0,
          background: "linear-gradient(180deg, #F5F7F4 0%, #EEF3F1 100%)",
          color: "#11211F",
          fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
        },
        "::selection": { backgroundColor: "rgba(15, 110, 92, 0.18)", color: "#11211F" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 12, minHeight: 40, textTransform: "none", fontWeight: 700 },
        sizeLarge: { minHeight: 48, paddingLeft: 20, paddingRight: 20 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(17, 34, 31, 0.08)",
          borderRadius: 22,
          background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,250,0.96))",
          boxShadow: "0 14px 32px rgba(17, 34, 31, 0.05)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 22 } },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,.9)",
          color: "#11211F",
          "& fieldset": { borderColor: "rgba(17, 34, 31, 0.12)" },
          "&:hover fieldset": { borderColor: "rgba(15, 110, 92, 0.42)" },
          "&.Mui-focused fieldset": { borderColor: "#0F6E5C" },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 650, borderRadius: 999, border: "1px solid rgba(17, 34, 31, 0.08)" } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { borderRadius: 10, fontSize: 12, fontWeight: 600, backgroundColor: "rgba(17, 34, 31, 0.96)" } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: "#F7FBF9", borderColor: "rgba(17, 34, 31, 0.08)" } },
    },
  },
});

theme = responsiveFontSizes(theme, { factor: 1.8 });

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
