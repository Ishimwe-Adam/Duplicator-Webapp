const Logo = () => (
  <svg width="36" height="36" viewBox="0 0 44 44" fill="none">
    <rect width="44" height="44" rx="6" fill="#2645C8"/>
    <path d="M10 12h12c5.5 0 10 4.5 10 10s-4.5 10-10 10H10V12z" fill="white" fillOpacity="0.15"/>
    <path d="M13 15h8.5c3.5 0 6.5 3 6.5 7s-3 7-6.5 7H13V15z" fill="white"/>
    <path d="M16.5 18.5h4.5c2 0 3.5 1.5 3.5 3.5s-1.5 3.5-3.5 3.5H16.5V18.5z" fill="#2645C8"/>
    <rect x="26" y="6" width="9" height="11" rx="1.5" fill="white" transform="rotate(15 26 6)"/>
    <circle cx="38" cy="6" r="3" fill="#00C6FF"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: "var(--ink)", padding: "80px 0 40px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 48, marginBottom: 64 }} className="footer-top-grid">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Logo />
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>DUPLICATOR LTD.</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(255,255,255,.3)", letterSpacing: ".12em", textTransform: "uppercase" }}>Kigali, Rwanda</div>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "rgba(255,255,255,.7)", lineHeight: 1.3, marginBottom: 16 }}>"Switch Your Brand ON."</p>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", lineHeight: 1.9 }}>
              <a href="tel:+250788978879" style={{ color: "rgba(255,255,255,.5)", textDecoration: "none", display: "block" }}>+250 788 978 879</a>
              <a href="https://wa.me/250788355226" style={{ color: "rgba(255,255,255,.5)", textDecoration: "none", display: "block" }}>+250 788 355 226 (WhatsApp)</a>
              <a href="mailto:duplicator10@gmail.com" style={{ color: "rgba(255,255,255,.5)", textDecoration: "none", display: "block" }}>duplicator10@gmail.com</a>
              <span>Karuruma, 4344+JVF, Kigali–Rwanda</span>
            </div>
          </div>

          {[
            {
              title: "Services",
              links: [
                { label: "Printing & Stationery", href: "/#services" },
                { label: "Large Format & Signage", href: "/#services" },
                { label: "Branding & Promotional", href: "/#services" },
                { label: "Sewing & Apparel", href: "/#services" },
                { label: "Corporate Gifts", href: "/#services" },
              ]
            },
            {
              title: "Company",
              links: [
                { label: "Home", href: "/" },
                { label: "Industries", href: "/#industries" },
                { label: "Get a Quote", href: "/#quote" },
                { label: "Contact Us", href: "/#contact" },
                { label: "WhatsApp Orders", href: "https://wa.me/250788355226" },
              ]
            },
            {
              title: "Order Now",
              links: [
                { label: "Get Price List", href: "https://wa.me/250788355226?text=I%20need%20a%20price%20list" },
                { label: "Place an Order", href: "https://wa.me/250788355226?text=I%20want%20to%20place%20an%20order" },
                { label: "Custom Quote", href: "https://wa.me/250788355226?text=I%20need%20a%20custom%20quote" },
                { label: "Urgent Order", href: "https://wa.me/250788355226?text=I%20have%20an%20urgent%20order" },
              ]
            }
          ].map(col => (
            <div key={col.title} className="footer-col">
              <h5 style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,.3)", marginBottom: 20 }}>{col.title}</h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <li key={l.label}>
                    <a href={l.href} style={{ fontSize: 14, color: "rgba(255,255,255,.5)", textDecoration: "none", transition: "color .2s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#00C6FF")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.5)")}
                    >{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "rgba(255,255,255,.25)", letterSpacing: ".06em" }}>
            © 2026 Duplicator Ltd. All rights reserved. · Kigali, Rwanda
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "IG", href: "https://instagram.com/duplicatorltd" },
              { label: "LI", href: "https://linkedin.com" },
              { label: "𝕏", href: "https://twitter.com/duplicatorltd" },
              { label: "WA", href: "https://wa.me/250788355226", green: true },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                style={{
                  width: 38, height: 38, border: s.green ? "none" : "1px solid rgba(255,255,255,.12)",
                  borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                  color: s.green ? "#fff" : "rgba(255,255,255,.5)", textDecoration: "none",
                  fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
                  background: s.green ? "#25D366" : "transparent", transition: "all .2s"
                }}
                onMouseEnter={e => { if (!s.green) { e.currentTarget.style.background = "#2645C8"; e.currentTarget.style.borderColor = "#2645C8"; e.currentTarget.style.color = "#fff"; } }}
                onMouseLeave={e => { if (!s.green) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "rgba(255,255,255,.5)"; } }}
              >{s.label}</a>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) { .footer-top-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 768px) { .footer-top-grid { grid-template-columns: 1fr !important; } .footer-col { display: none; } }
      `}</style>
    </footer>
  );
}
