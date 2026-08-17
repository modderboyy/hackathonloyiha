"use client";

import { createTheme, ThemeProvider, responsiveFontSizes } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

let theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#155EEF",
      light: "#5B8CFF",
      dark: "#0B4ACB",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#0E9384",
      light: "#47BFAE",
      dark: "#087568",
    },
    success: { main: "#12B76A", light: "#ECFDF3", dark: "#027A48" },
    warning: { main: "#F79009", light: "#FFFAEB", dark: "#B54708" },
    error: { main: "#F04438", light: "#FEF3F2", dark: "#B42318" },
    info: { main: "#2E90FA", light: "#EFF8FF", dark: "#175CD3" },
    background: { default: "#F7F9FC", paper: "#FFFFFF" },
    text: { primary: "#101828", secondary: "#475467", disabled: "#98A2B3" },
    divider: "#EAECF0",
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontWeight: 750, letterSpacing: "-0.04em" },
    h2: { fontWeight: 750, letterSpacing: "-0.035em" },
    h3: { fontWeight: 740, letterSpacing: "-0.03em" },
    h4: { fontWeight: 720, letterSpacing: "-0.025em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.012em" },
    subtitle1: { fontWeight: 650 },
    button: { fontWeight: 700, letterSpacing: "0" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        html: { scrollBehavior: "smooth" },
        body: { margin: 0, backgroundColor: "#F7F9FC" },
        "::selection": { backgroundColor: "#CFE0FF", color: "#101828" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 40, textTransform: "none" },
        sizeLarge: { minHeight: 48, paddingLeft: 20, paddingRight: 20 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: "1px solid #EAECF0", boxShadow: "0 1px 2px rgba(16,24,40,.04)", borderRadius: 16 },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 16 } },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: "#FFFFFF" },
        notchedOutline: { borderColor: "#D0D5DD" },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 650, borderRadius: 8 } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { borderRadius: 8, fontSize: 12, fontWeight: 600 } },
    },
  },
});

theme = responsiveFontSizes(theme, { factor: 2.2 });

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
