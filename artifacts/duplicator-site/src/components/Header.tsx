import { useState, useEffect } from "react";
import { useLocation } from "wouter";

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

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

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
        background: "rgba(4, 9, 26, 0.97)",
        backdropFilter: "blur(24px)",
        zIndex: 999,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "48px 36px",
        transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform .4s cubic-bezier(.77,0,.175,1)"
      }}>
        <button
          onClick={() => setMobileOpen(false)}
          style={{ position: "absolute", top: 28, right: 28, background: "none", border: "none", color: "rgba(255,255,255,.6)", fontSize: 26, cursor: "pointer", lineHeight: 1 }}
        >✕</button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
          <Logo />
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-.01em" }}>DUPLICATOR LTD.</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "rgba(0,198,255,.7)", letterSpacing: ".1em" }}>•PRINTING •BRANDING •SEWING</div>
          </div>
        </div>

        {navLinks.map((l, i) => (
          <a
            key={l.href}
            href={l.href}
            onClick={(e) => { e.preventDefault(); handleNavClick(l.href); }}
            style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 32,
              letterSpacing: "-.04em", lineHeight: 1.2,
              color: "rgba(255,255,255,.75)", textDecoration: "none", display: "block",
              padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.06)",
              transition: "color .2s",
              opacity: 0, animation: mobileOpen ? `wordReveal .4s ${i * 0.06 + 0.1}s forwards` : "none"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00C6FF")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.75)")}
          >{l.label}</a>
        ))}

        <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!" target="_blank" rel="noreferrer"
          style={{
            marginTop: 36, display: "inline-flex", alignItems: "center", gap: 10,
            padding: "14px 28px", borderRadius: 10,
            background: "#25D366", color: "#fff",
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15,
            textDecoration: "none", width: "fit-content"
          }}>
          <WaIcon /> Order via WhatsApp
        </a>
      </div>

      {/* ── FLOATING PILL NAVBAR ─────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)",
        zIndex: 1000,
        width: "calc(100% - 40px)", maxWidth: 1100,
        background: "rgba(4, 9, 26, 0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "10px 14px 10px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)"
      }}>
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <Logo />
          <div style={{ lineHeight: 1.2 }} className="hide-mobile">
            <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "-.01em" }}>DUPLICATOR LTD.</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, color: "rgba(0,198,255,.7)", letterSpacing: ".1em" }}>•PRINTING •BRANDING •SEWING</div>
          </div>
        </a>

        {/* Nav links — center */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6 }} className="desktop-nav">
          {navLinks.map(l => (
            <a key={l.href} href={l.href}
              onClick={(e) => { if (l.href.startsWith("/#")) { e.preventDefault(); handleNavClick(l.href); } }}
              style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 13,
                color: "rgba(255,255,255,.65)", textDecoration: "none",
                padding: "6px 14px", borderRadius: 999,
                transition: "color .15s, background .15s"
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,.65)"; e.currentTarget.style.background = "transparent"; }}
            >{l.label}</a>
          ))}
        </nav>

        {/* CTA — right */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!" target="_blank" rel="noreferrer"
            className="hide-mobile"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 18px", borderRadius: 999,
              background: "#fff", color: "#000",
              fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
              textDecoration: "none", transition: "transform .15s, filter .15s",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.filter = "brightness(1.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.filter = ""; }}
          >
            <WaIcon /> Order via WhatsApp
          </a>

          <button
            className="show-mobile"
            onClick={() => setMobileOpen(true)}
            style={{ display: "none", flexDirection: "column", gap: 4.5, cursor: "pointer", padding: "8px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10 }}
          >
            <span style={{ width: 20, height: 1.5, background: "#fff", borderRadius: 2, display: "block" }} />
            <span style={{ width: 20, height: 1.5, background: "#fff", borderRadius: 2, display: "block" }} />
            <span style={{ width: 20, height: 1.5, background: "#fff", borderRadius: 2, display: "block" }} />
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
