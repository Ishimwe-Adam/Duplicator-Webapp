import { useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/auth";

const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
    <rect width="44" height="44" rx="8" fill="#2645C8"/>
    <path d="M10 12h12c5.5 0 10 4.5 10 10s-4.5 10-10 10H10V12z" fill="white" fillOpacity="0.15"/>
    <path d="M13 15h8.5c3.5 0 6.5 3 6.5 7s-3 7-6.5 7H13V15z" fill="white"/>
    <path d="M16.5 18.5h4.5c2 0 3.5 1.5 3.5 3.5s-1.5 3.5-3.5 3.5H16.5V18.5z" fill="#2645C8"/>
    <rect x="26" y="6" width="9" height="11" rx="1.5" fill="white" transform="rotate(15 26 6)"/>
    <circle cx="38" cy="6" r="3" fill="#00C6FF"/>
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

function roleHome(role: string) {
  if (role === "super_admin" || role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/portal";
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { isDark, toggle, c } = useTheme();
  const { user } = useAuth();

  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/#services", label: "Services" },
    { href: "/products", label: "Products" },
    { href: "/#industries", label: "Industries" },
    { href: "/#quote", label: "Quote" },
    { href: "/#contact", label: "Contact" },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("/#")) {
      if (location === "/") {
        const id = href.replace("/#", "");
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = href;
      }
    }
  };

  return (
    <>
      {/* ── MOBILE FULLSCREEN NAV ────────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0,
        background: c.mobileNavBg,
        backdropFilter: "blur(24px)",
        zIndex: 999,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "48px 36px",
        transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform .4s cubic-bezier(.77,0,.175,1)"
      }}>
        <button
          onClick={() => setMobileOpen(false)}
          style={{ position: "absolute", top: 28, right: 28, background: "none", border: "none", color: c.textMuted, fontSize: 26, cursor: "pointer", lineHeight: 1 }}
        >✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <Logo />
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15, color: c.textPrimary, letterSpacing: "-.01em" }}>DUPLICATOR LTD.</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "rgba(0,198,255,.7)", letterSpacing: ".1em" }}>•PRINTING •BRANDING •SEWING</div>
          </div>
        </div>

        {navLinks.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            onClick={(e) => { e.preventDefault(); handleNavClick(l.href); }}
            style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 32,
              letterSpacing: "-.04em", lineHeight: 1.2,
              color: c.textSecondary, textDecoration: "none", display: "block",
              padding: "14px 0", borderBottom: `1px solid ${c.border}`,
              transition: "color .2s",
              opacity: 0, animation: mobileOpen ? `wordReveal .4s ${i * 0.06 + 0.1}s forwards` : "none"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#2645C8")}
            onMouseLeave={e => (e.currentTarget.style.color = c.textSecondary)}
          >{l.label}</a>
        ))}

        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
          {user ? (
            <a href={roleHome(user.role)}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "14px 28px", borderRadius: 10,
                background: "#2645C8", color: "#fff",
                fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 15,
                textDecoration: "none"
              }}>
              Dashboard →
            </a>
          ) : (
            <>
              <a href="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "14px 28px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.2)", background: "transparent",
                  color: "rgba(255,255,255,.85)",
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 15,
                  textDecoration: "none"
                }}>
                Log In
              </a>
              <a href="/signup"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "14px 28px", borderRadius: 10,
                  background: "#2645C8", color: "#fff",
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 15,
                  textDecoration: "none"
                }}>
                Sign Up
              </a>
            </>
          )}
          <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!" target="_blank" rel="noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "14px 28px", borderRadius: 10,
              background: "#25D366", color: "#fff",
              fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 15,
              textDecoration: "none"
            }}>
            <WaIcon /> Order via WhatsApp
          </a>
        </div>
      </div>

      {/* ── FLOATING PILL NAVBAR ─────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000,
        width: "calc(100% - 40px)", maxWidth: 1100,
        background: c.navBg,
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRadius: 999,
        border: `1px solid ${c.navBorder}`,
        padding: "10px 14px 10px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 8px 32px rgba(38,69,200,0.12), inset 0 1px 0 rgba(255,255,255,0.8)",
        transition: "background .3s, border-color .3s, box-shadow .3s"
      }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <Logo />
          <div style={{ lineHeight: 1.2 }} className="hide-mobile">
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: c.textPrimary, letterSpacing: "-.01em" }}>DUPLICATOR LTD.</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: "rgba(0,198,255,.8)", letterSpacing: ".1em" }}>•PRINTING •BRANDING •SEWING</div>
          </div>
        </a>

        {/* Nav links — center */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6 }} className="desktop-nav">
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              onClick={(e) => { if (l.href.startsWith("/#")) { e.preventDefault(); handleNavClick(l.href); } }}
              style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 13,
                color: c.navText, textDecoration: "none",
                padding: "6px 14px", borderRadius: 999,
                transition: "color .15s, background .15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.color = c.navTextHover; e.currentTarget.style.background = c.navTextHoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = c.navText; e.currentTarget.style.background = "transparent"; }}
            >{l.label}</a>
          ))}
        </nav>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, borderRadius: 999, cursor: "pointer",
              border: `1px solid ${c.navBorder}`,
              background: isDark ? "rgba(255,255,255,.07)" : "rgba(38,69,200,.08)",
              color: isDark ? "rgba(255,255,255,.75)" : "#2645C8",
              transition: "all .25s",
              flexShrink: 0
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,.14)" : "rgba(38,69,200,.16)";
              e.currentTarget.style.transform = "rotate(20deg) scale(1.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isDark ? "rgba(255,255,255,.07)" : "rgba(38,69,200,.08)";
              e.currentTarget.style.transform = "";
            }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Auth buttons — desktop */}
          {user ? (
            <a href={roleHome(user.role)}
              className="hide-mobile"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 999,
                background: "#2645C8", color: "#fff",
                fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 13,
                textDecoration: "none", transition: "filter .15s",
                whiteSpace: "nowrap"
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
            >Dashboard →</a>
          ) : (
            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <a href="/login"
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "8px 16px", borderRadius: 999,
                  border: `1px solid ${c.navBorder}`,
                  background: "transparent",
                  color: isDark ? "rgba(255,255,255,.8)" : "#2645C8",
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 13,
                  textDecoration: "none", transition: "background .15s, border-color .15s",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(255,255,255,.08)" : "rgba(38,69,200,.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >Log In</a>
              <a href="/signup"
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "9px 18px", borderRadius: 999,
                  background: "#2645C8", color: "#fff",
                  fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 13,
                  textDecoration: "none", transition: "filter .15s",
                  whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
              >Sign Up</a>
            </div>
          )}

          <button
            className="show-mobile"
            onClick={() => setMobileOpen(true)}
            style={{ display: "none", flexDirection: "column", gap: 4.5, cursor: "pointer", padding: "8px", background: isDark ? "rgba(255,255,255,.08)" : "rgba(38,69,200,.08)", border: `1px solid ${c.navBorder}`, borderRadius: 10 }}
          >
            <span style={{ width: 20, height: 1.5, background: c.textPrimary, borderRadius: 2, display: "block" }} />
            <span style={{ width: 20, height: 1.5, background: c.textPrimary, borderRadius: 2, display: "block" }} />
            <span style={{ width: 20, height: 1.5, background: c.textPrimary, borderRadius: 2, display: "block" }} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
