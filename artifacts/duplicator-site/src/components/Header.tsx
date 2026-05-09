import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

const WaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const Logo = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect width="44" height="44" rx="6" fill="#2645C8"/>
    <path d="M10 12h12c5.5 0 10 4.5 10 10s-4.5 10-10 10H10V12z" fill="white" fillOpacity="0.15"/>
    <path d="M13 15h8.5c3.5 0 6.5 3 6.5 7s-3 7-6.5 7H13V15z" fill="white"/>
    <path d="M16.5 18.5h4.5c2 0 3.5 1.5 3.5 3.5s-1.5 3.5-3.5 3.5H16.5V18.5z" fill="#2645C8"/>
    <rect x="26" y="6" width="9" height="11" rx="1.5" fill="white" transform="rotate(15 26 6)"/>
    <circle cx="38" cy="6" r="3" fill="#00C6FF"/>
  </svg>
);

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
      {/* MOBILE NAV */}
      <div
        style={{
          position: "fixed", inset: 0, background: "var(--ink)", zIndex: 999,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "48px 32px",
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform .4s cubic-bezier(.77,0,.175,1)"
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          style={{ position: "absolute", top: 28, right: 28, background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer" }}
        >✕</button>
        {navLinks.map(l => (
          <a
            key={l.href}
            href={l.href}
            onClick={(e) => { e.preventDefault(); handleNavClick(l.href); }}
            style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36,
              color: "rgba(255,255,255,.8)", textDecoration: "none", display: "block",
              padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,.06)",
              transition: "color .2s"
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00C6FF")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.8)")}
          >{l.label}</a>
        ))}
        <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!" target="_blank" rel="noreferrer"
          style={{
            marginTop: 40, display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 28px", borderRadius: 4, background: "#25D366", color: "#fff",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none"
          }}>
          <WaIcon /> Order via WhatsApp
        </a>
      </div>

      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        transition: "background .3s, backdrop-filter .3s, box-shadow .3s",
        background: scrolled ? "rgba(13,17,23,.82)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(255,255,255,.06)" : "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 72, maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <Logo />
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: ".06em" }}>DUPLICATOR LTD.</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#00C6FF", letterSpacing: ".12em" }}>•PRINTING •BRANDING •SEWING</div>
            </div>
          </a>

          <nav style={{ display: "flex", alignItems: "center", gap: 32 }} className="desktop-nav">
            {navLinks.map(l => (
              <a key={l.href} href={l.href}
                onClick={(e) => { if (l.href.startsWith("/#")) { e.preventDefault(); handleNavClick(l.href); } }}
                style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 13,
                  color: "rgba(255,255,255,.75)", textDecoration: "none", letterSpacing: ".04em",
                  transition: "color .2s", position: "relative"
                }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.75)")}
              >{l.label}</a>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!" target="_blank" rel="noreferrer"
              className="hide-mobile"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 4, background: "#25D366", color: "#fff",
                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, textDecoration: "none",
                transition: "background .2s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
              onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
            >
              <WaIcon /> Order via WhatsApp
            </a>
            <button
              className="show-mobile"
              onClick={() => setMobileOpen(true)}
              style={{ display: "none", flexDirection: "column", gap: 5, cursor: "pointer", padding: 4, background: "none", border: "none" }}
            >
              <span style={{ width: 24, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
              <span style={{ width: 24, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
              <span style={{ width: 24, height: 2, background: "#fff", borderRadius: 2, display: "block" }} />
            </button>
          </div>
        </div>
      </header>

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
