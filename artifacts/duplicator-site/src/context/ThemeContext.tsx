import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

export interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;
  bgCard: string;
  bgCardHover: string;
  bgSection: string;
  bgSectionAlt: string;
  bgSectionDeep: string;
  bgStats: string;
  border: string;
  borderHover: string;
  navBg: string;
  navBorder: string;
  navText: string;
  navTextHover: string;
  navTextHoverBg: string;
  footerBg: string;
  footerBorder: string;
  inputBg: string;
  inputBorder: string;
  mobileNavBg: string;
  ctaBg: string;
  ctaText: string;
  contactCardBg: string;
  hoursCardBg: string;
  serviceCardBg: string;
  serviceCardHoverBg: string;
  sectionLabelColor: string;
  decorLine: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  heroOverlayRight: string;
}

function makeColors(t: Theme): ThemeColors {
  const d = t === "dark";
  return {
    textPrimary:        d ? "#ffffff"                 : "#04091A",
    textSecondary:      d ? "rgba(255,255,255,.65)"   : "rgba(4,9,26,.76)",
    textMuted:          d ? "rgba(255,255,255,.45)"   : "rgba(4,9,26,.58)",
    textFaint:          d ? "rgba(255,255,255,.25)"   : "rgba(4,9,26,.40)",
    bgCard:             d ? "rgba(8,16,50,0.55)"      : "rgba(255,255,255,0.78)",
    bgCardHover:        d ? "rgba(22,48,140,0.75)"    : "rgba(235,244,255,0.92)",
    bgSection:          d ? "rgba(6,14,44,0.75)"      : "rgba(230,242,255,0.72)",
    bgSectionAlt:       d ? "rgba(6,14,44,0.65)"      : "rgba(235,245,255,0.65)",
    bgSectionDeep:      d ? "rgba(12,24,72,0.80)"     : "rgba(220,238,255,0.80)",
    bgStats:            d ? "rgba(38,69,200,0.75)"    : "rgba(38,69,200,0.88)",
    border:             d ? "rgba(255,255,255,.08)"   : "rgba(38,69,200,.16)",
    borderHover:        d ? "rgba(255,255,255,.22)"   : "rgba(0,198,255,.42)",
    navBg:              d ? "rgba(4,9,26,0.72)"       : "rgba(255,255,255,0.84)",
    navBorder:          d ? "rgba(255,255,255,0.1)"   : "rgba(74,144,226,0.22)",
    navText:            d ? "rgba(255,255,255,.65)"   : "rgba(4,9,26,.76)",
    navTextHover:       d ? "#ffffff"                 : "#04091A",
    navTextHoverBg:     d ? "rgba(255,255,255,.07)"   : "rgba(38,69,200,.07)",
    footerBg:           d ? "rgba(4,9,26,0.92)"       : "rgba(248,252,255,0.96)",
    footerBorder:       d ? "rgba(255,255,255,.06)"   : "rgba(0,198,255,.14)",
    inputBg:            d ? "rgba(255,255,255,.04)"   : "rgba(255,255,255,0.9)",
    inputBorder:        d ? "rgba(255,255,255,.12)"   : "rgba(38,69,200,.26)",
    mobileNavBg:        d ? "rgba(4,9,26,0.97)"       : "rgba(248,252,255,0.98)",
    ctaBg:              d ? "#ffffff"                 : "#2645C8",
    ctaText:            d ? "#04091A"                 : "#ffffff",
    contactCardBg:      d ? "rgba(10,20,55,0.5)"      : "rgba(255,255,255,0.8)",
    hoursCardBg:        d ? "#04091A"                 : "rgba(255,255,255,0.9)",
    serviceCardBg:      d ? "rgba(8,16,50,0.55)"      : "rgba(255,255,255,0.72)",
    serviceCardHoverBg: d ? "rgba(22,48,140,0.75)"    : "rgba(235,244,255,0.95)",
    sectionLabelColor:  d ? "var(--blue)"             : "#2645C8",
    decorLine:          d ? "#00C6FF"                 : "#2645C8",
    scrollbarTrack:     d ? "#04091A"                 : "#EFF6FF",
    scrollbarThumb:     d ? "rgba(38,69,200,0.6)"     : "rgba(38,69,200,0.45)",
    heroOverlayRight:   d ? "linear-gradient(135deg, var(--navy) 0%, var(--blue) 40%, var(--light-blue) 100%)"
                          : "linear-gradient(135deg, #C7DEFF 0%, #7FB3F5 40%, #2645C8 100%)",
  };
}

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  isDark: boolean;
  c: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
  isDark: true,
  c: makeColors("dark"),
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem("duplicator-theme") as Theme) || "dark"; }
    catch { return "dark"; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("duplicator-theme", theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === "dark", c: makeColors(theme) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
