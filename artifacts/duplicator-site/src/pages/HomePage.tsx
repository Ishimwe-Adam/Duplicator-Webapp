import { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";

const WaIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);

  return { count, ref };
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const { count, ref } = useCounter(target);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function RevealDiv({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(30px)",
      transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
      ...style
    }}>
      {children}
    </div>
  );
}

// Service card — inverted = starts dark, hovers to white
function ServiceCard({ num, title, desc, items, icon, inverted = false }: {
  num: string; title: string; desc: string; items: string[]; icon: React.ReactNode; inverted?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const isDark = inverted ? !hovered : hovered;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isDark ? "rgba(22,48,140,0.75)" : "rgba(8,16,50,0.55)",
        padding: "40px 36px",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "background .3s"
      }}
    >
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
        background: "linear-gradient(90deg, var(--blue), var(--electric))",
        transform: isDark ? "scaleX(1)" : "scaleX(0)",
        transition: "transform .3s",
        transformOrigin: "left"
      }} />
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: isDark ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.2)", letterSpacing: ".1em", marginBottom: 8, transition: "color .3s" }}>{num}</div>
      <div style={{
        width: 52, height: 52, background: isDark ? "var(--electric)" : "rgba(255,255,255,.06)",
        borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24, transition: "background .3s, color .3s",
        color: isDark ? "#fff" : "#00C6FF"
      }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 20, color: isDark ? "#fff" : "var(--ink)", marginBottom: 12, transition: "color .3s" }}>{title}</h3>
      <p style={{ fontSize: 14, color: isDark ? "rgba(255,255,255,.6)" : "var(--grey)", lineHeight: 1.65, marginBottom: 20, transition: "color .3s" }}>{desc}</p>
      <ul style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map(item => (
          <li key={item} style={{
            fontFamily: "'Inter', sans-serif", fontSize: 10, padding: "4px 10px",
            background: isDark ? "rgba(255,255,255,.08)" : "var(--light-grey)",
            borderRadius: 3, color: isDark ? "rgba(255,255,255,.5)" : "var(--grey)",
            textTransform: "uppercase", letterSpacing: ".06em", transition: "color .3s, background .3s"
          }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const services = [
  {
    num: "01 / 05",
    title: "Printing & Stationery",
    desc: "Crisp, colour-accurate printing for every touchpoint — from business cards to full document packages.",
    items: ["Business Cards", "Letterheads", "Brochures", "Flyers", "Envelopes", "Notebooks"],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>,
    inverted: false
  },
  {
    num: "02 / 05",
    title: "Large Format & Signage",
    desc: "Make a big statement. Our large-format output commands attention at any distance.",
    items: ["PVC Banners", "Roll-Up Stands", "Billboards", "Posters", "Backlit", "Wall Graphics"],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>,
    inverted: true   // starts dark, hovers to white
  },
  {
    num: "03 / 05",
    title: "Branding & Promotional",
    desc: "Turn everyday items into brand ambassadors with personalised corporate merchandise.",
    items: ["Branded Pens", "Mugs", "Umbrellas", "Bags", "Caps", "USB Drives"],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    inverted: false
  },
  {
    num: "04 / 05",
    title: "Sewing & Apparel",
    desc: "Custom-sewn uniforms and branded apparel that unify your team and elevate your brand presence.",
    items: ["Polo Shirts", "T-Shirts", "Overalls", "Aprons", "Bibs", "Embroidery"],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M3 22v-9l9-9 9 9v9"/><path d="M9 22V12h6v10"/></svg>,
    inverted: true   // starts dark, hovers to white
  },
  {
    num: "05 / 05",
    title: "Corporate Gifts & Awards",
    desc: "Reward excellence with premium branded trophies, plaques, and corporate gift packages.",
    items: ["Trophies", "Plaques", "Gift Sets", "Certificates", "Custom Boxes"],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    inverted: false
  }
];

const industries = [
  { icon: "🏦", name: "Banking & Finance" },
  { icon: "🏥", name: "Healthcare" },
  { icon: "🏫", name: "Education" },
  { icon: "🏛️", name: "Government" },
  { icon: "🌍", name: "NGOs & Nonprofits" },
  { icon: "🏨", name: "Hospitality" },
  { icon: "📦", name: "Retail & FMCG" },
  { icon: "🏗️", name: "Construction" },
  { icon: "⛽", name: "Energy & Mining" },
  { icon: "✈️", name: "Aviation & Logistics" },
  { icon: "🎓", name: "Universities" },
  { icon: "🌐", name: "Tech Startups" },
];

const testimonials = [
  { text: "Duplicator Ltd produced 500 polo shirts for our NGO in under a week. The embroidery quality was exceptional and the turnaround blew us away.", name: "Alice Uwimana", role: "Programme Director, UNHCR Rwanda", initials: "AU" },
  { text: "We've used them for all our event banners, letterheads and branded mugs for 3 years. Consistent quality every time, no excuses.", name: "Jean-Baptiste Nziza", role: "Marketing Manager, Bank of Kigali", initials: "JN" },
  { text: "Fast, professional and very good value. Our trade show stand looked amazing thanks to their large-format prints.", name: "Sarah Kagabo", role: "CEO, Innovate Rwanda", initials: "SK" },
];

const products = [
  { cat: "printing", emoji: "🃏", title: "Business Cards", desc: "Premium full-colour cards. Single or double-sided, gloss or matte, standard or custom sizes.", sku: "SKU-PRT-001", msg: "Business%20Cards" },
  { cat: "signage", emoji: "🎌", title: "PVC Banners", desc: "Durable, weather-resistant PVC banners for outdoor events, storefronts and exhibitions.", sku: "SKU-SGN-002", msg: "PVC%20Banners" },
  { cat: "sewing", emoji: "👕", title: "Corporate Polo Shirts", desc: "Custom-sewn polo shirts with embroidered or printed logos. Perfect for teams and events.", sku: "SKU-SEW-001", msg: "Corporate%20Polo%20Shirts" },
  { cat: "signage", emoji: "📋", title: "Roll-Up Banners", desc: "Professional retractable roll-up stands for exhibitions, receptions, and presentations.", sku: "SKU-SGN-004", msg: "Roll-Up%20Banners" },
  { cat: "branding", emoji: "🎁", title: "Branded Mugs & Drinkware", desc: "Ceramic mugs, travel flasks, and glassware printed with your brand for gifting and office use.", sku: "SKU-BRD-003", msg: "Branded%20Mugs" },
  { cat: "gifts", emoji: "🏆", title: "Trophies & Award Plaques", desc: "Engraved trophies, acrylic plaques and crystal awards for corporate recognition events.", sku: "SKU-GFT-001", msg: "Trophies%20and%20Awards" },
  { cat: "printing", emoji: "📰", title: "Letterheads & Stationery", desc: "Official company letterheads, envelopes, compliment slips and full stationery packages.", sku: "SKU-PRT-003", msg: "Letterheads" },
  { cat: "sewing", emoji: "🦺", title: "Staff Uniforms & Overalls", desc: "Custom-cut and sewn uniforms for hospitality, healthcare, security and industrial teams.", sku: "SKU-SEW-003", msg: "Staff%20Uniforms" },
];

const cats = ["all", "printing", "signage", "branding", "sewing", "gifts"];
const catLabels: Record<string, string> = { all: "All Products", printing: "Printing", signage: "Signage", branding: "Branding", sewing: "Sewing", gifts: "Corporate Gifts" };

export default function HomePage() {
  const [activeCat, setActiveCat] = useState("all");

  const filtered = activeCat === "all" ? products : products.filter(p => p.cat === activeCat);

  const marqueeItems = ["Business Cards", "PVC Banners", "Corporate Uniforms", "Roll-Up Stands", "Branded Gifts", "Embroidery", "Signage", "Stationery", "Custom Apparel", "Letterheads", "Posters", "Vehicle Branding", "Trophies"];

  return (
    <div style={{ background: "transparent" }}>
      <Header />

      {/* HERO */}
      <section id="home" style={{ position: "relative", minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{
            position: "absolute", right: "-5%", top: 0, bottom: 0, width: "55%",
            background: "linear-gradient(135deg, var(--navy) 0%, var(--blue) 40%, var(--light-blue) 100%)",
            clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0% 100%)", opacity: .9
          }} />
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(38,69,200,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(38,69,200,.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
          <div style={{
            position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)",
            fontFamily: "'Inter', sans-serif", fontSize: "clamp(300px,35vw,520px)", lineHeight: 1,
            color: "rgba(255,255,255,.04)", pointerEvents: "none", userSelect: "none"
          }}>D</div>
        </div>

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1320, margin: "0 auto", padding: "120px 24px 80px", width: "100%" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em",
            padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(0,198,255,.3)",
            background: "rgba(0,198,255,.1)", color: "#00C6FF", marginBottom: 24,
            opacity: 0, animation: "wordReveal .8s .1s forwards"
          }}>🇷🇼 Kigali · Rwanda · Est. 2008+</div>

          <h1 style={{ fontFamily: "'Inter', sans-serif", lineHeight: .95, fontSize: "clamp(64px,9vw,118px)", color: "#fff", marginBottom: 32 }}>
            <span style={{ display: "block", opacity: 0, transform: "translateY(20px)", animation: "wordReveal .6s .1s forwards" }}>Switch Your</span>
            <span style={{ display: "block", opacity: 0, transform: "translateY(20px)", animation: "wordReveal .6s .25s forwards" }}>Brand</span>
            <span style={{ display: "block", color: "#00C6FF", opacity: 0, transform: "translateY(20px)", animation: "wordReveal .6s .4s forwards" }}>ON.</span>
          </h1>

          <p style={{ fontSize: 18, color: "rgba(255,255,255,.65)", maxWidth: 480, marginBottom: 40, lineHeight: 1.7, opacity: 0, animation: "wordReveal .8s .55s forwards" }}>
            Premium printing, branding and sewing solutions for businesses that demand to be noticed. Serving Rwanda and East Africa.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 64, opacity: 0, animation: "wordReveal .8s .7s forwards" }}>
            <a href="#quote" onClick={e => { e.preventDefault(); document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px",
                borderRadius: 4, background: "#00C6FF", color: "var(--ink)",
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: ".05em",
                textDecoration: "none", transition: "all .25s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#00C6FF"; e.currentTarget.style.transform = ""; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
              Get a Free Quote
            </a>
            <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!" target="_blank" rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px",
                borderRadius: 4, background: "#25D366", color: "#fff",
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: ".05em",
                textDecoration: "none", transition: "all .25s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#128C7E"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#25D366"; e.currentTarget.style.transform = ""; }}
            >
              <WaIcon /> Chat on WhatsApp
            </a>
            <a href="#services" onClick={e => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px",
                borderRadius: 4, background: "transparent", color: "#fff",
                border: "1.5px solid rgba(255,255,255,.4)",
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: ".05em",
                textDecoration: "none", transition: "all .25s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; e.currentTarget.style.borderColor = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,.4)"; }}
            >Explore Services →</a>
            <a href="/duplicator-catalogue.pdf" download="Duplicator-Ltd-Official-Catalogue.pdf"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px",
                borderRadius: 4, background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.85)",
                border: "1.5px solid rgba(255,255,255,.2)",
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: ".05em",
                textDecoration: "none", transition: "all .25s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.15)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.color = "rgba(255,255,255,.85)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Catalogue
            </a>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 40, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 40 }}>
            {[{ target: 15, suffix: "+", label: "Years in Business" }, { target: 500, suffix: "+", label: "Happy Clients" }, { target: 5000, suffix: "+", label: "Orders Completed" }, { target: 12, suffix: "", label: "Product Categories" }].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(28px,4vw,40px)", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                  <Counter target={s.target} /><span style={{ color: "#00C6FF" }}>{s.suffix}</span>
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "rgba(255,255,255,.4)", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating badges */}
        <div style={{ position: "absolute", right: "6%", bottom: "15%", display: "flex", flexDirection: "column", gap: 12, zIndex: 3 }} className="hero-badges">
          {[
            { icon: "💬", text: "WhatsApp Orders Available", color: "#25D366" },
            { icon: "⭐", text: "15+ Years · Kigali, Rwanda", color: "#F5C518" },
            { icon: "⚡", text: "Fast Turnaround Guaranteed", color: "#00C6FF" },
          ].map((b, i) => (
            <div key={b.text} style={{
              background: "rgba(255,255,255,.08)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "14px 18px",
              color: "#fff", display: "flex", alignItems: "center", gap: 10, fontSize: 13, whiteSpace: "nowrap",
              animation: `floatBadge 3s ease-in-out ${i * 1}s infinite`
            }}>
              <span>{b.icon}</span> {b.text}
            </div>
          ))}
        </div>

        <style>{`.hero-badges { @media (max-width: 1024px) { display: none !important; } }`}</style>
      </section>

      {/* MARQUEE */}
      <div style={{ background: "var(--blue)", padding: "16px 0", overflow: "hidden" }}>
        <div style={{ display: "flex", width: "max-content", animation: "marquee 28s linear infinite" }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 32, padding: "0 32px", whiteSpace: "nowrap", fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,.9)", textTransform: "uppercase" }}>
              {marqueeItems.map((item, j) => (
                <span key={j} style={{ display: "flex", alignItems: "center", gap: 32 }}>
                  <span style={{ width: 6, height: 6, background: "#00C6FF", borderRadius: "50%", display: "inline-block" }} />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <section id="services" style={{ background: "transparent", padding: "100px 0", position: "relative" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24, marginBottom: 0 }}>
            <RevealDiv>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--blue)", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ width: 32, height: 2, background: "#00C6FF", display: "inline-block" }} /> What We Do
              </div>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(36px,5vw,58px)", lineHeight: 1.05, color: "var(--ink)" }}>
                We Don't Just Print.<br />We Build <span style={{ color: "var(--blue)" }}>Brands.</span>
              </h2>
            </RevealDiv>
            <RevealDiv delay={0.2}>
              <p style={{ fontSize: 17, color: "var(--grey)", maxWidth: 520, marginTop: 16 }}>From a single business card to a full corporate rebrand — we deliver quality that speaks before you say a word.</p>
            </RevealDiv>
          </div>

          <RevealDiv delay={0.1} style={{ marginTop: 64 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(8px)" }}>
              {services.map(s => (
                <ServiceCard key={s.title} {...s} />
              ))}
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: "rgba(6,14,44,0.75)", color: "#fff", padding: "100px 0", position: "relative", overflow: "hidden", backdropFilter: "blur(8px)" }}>
        <div style={{ position: "absolute", left: -80, top: "50%", transform: "translateY(-50%)", fontFamily: "'Inter', sans-serif", fontSize: 600, lineHeight: 1, color: "rgba(255,255,255,.02)", pointerEvents: "none", userSelect: "none" }}>D</div>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>
          <RevealDiv style={{ textAlign: "center", marginBottom: 0 }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "#00C6FF", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ width: 32, height: 2, background: "#00C6FF", display: "inline-block" }} /> How It Works <span style={{ width: 32, height: 2, background: "#00C6FF", display: "inline-block" }} />
            </div>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(36px,5vw,58px)", color: "#fff", textAlign: "center" }}>
              From Idea to <span style={{ color: "#00C6FF" }}>Delivered.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,.5)", maxWidth: 480, margin: "16px auto 0", fontSize: 16 }}>Four simple steps from your first message to finished product in your hands.</p>
          </RevealDiv>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0, marginTop: 64, position: "relative" }}>
            <div style={{ position: "absolute", top: 36, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, var(--blue), var(--electric), var(--blue), transparent)" }} />
            {[
              { num: "01", title: "Contact Us", desc: "Reach out via WhatsApp, phone, or email. Tell us what you need — product, quantity, deadline." },
              { num: "02", title: "Get Your Quote", desc: "We send a clear, itemised quote with pricing and timeline. No hidden fees, no surprises." },
              { num: "03", title: "Approve & Produce", desc: "You approve the design proof and we begin production. Quality checked at every stage." },
              { num: "04", title: "Receive & Brand On", desc: "Collection from Karuruma or delivery arranged. Your brand is switched ON and ready to go." },
            ].map((step, i) => (
              <RevealDiv key={step.num} delay={i * 0.1} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 24px", position: "relative", zIndex: 1 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, background: "var(--ink)", position: "relative" }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 22, color: "#00C6FF" }}>{step.num}</span>
                </div>
                <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 10 }}>{step.title}</h4>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", lineHeight: 1.65 }}>{step.desc}</p>
              </RevealDiv>
            ))}
          </div>

          <RevealDiv style={{ textAlign: "center", marginTop: 56 }}>
            <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!%20I%20want%20to%20place%20an%20order." target="_blank" rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 36px",
                background: "#25D366", color: "#fff", borderRadius: 4,
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none",
                transition: "background .2s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
              onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
            >
              <WaIcon size={18} /> Start Your Order Now
            </a>
          </RevealDiv>
        </div>
      </section>

      {/* STATS */}
      <div style={{ background: "rgba(38,69,200,0.75)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "80px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48 }}>
            {[{ target: 15, suffix: "+", label: "Years Experience" }, { target: 500, suffix: "+", label: "Business Clients" }, { target: 5000, suffix: "+", label: "Orders Delivered" }, { target: 12, suffix: "", label: "Product Categories" }].map(s => (
              <RevealDiv key={s.label} style={{ textAlign: "center", color: "#fff" }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(48px,7vw,80px)", lineHeight: 1, color: "#fff" }}>
                  <Counter target={s.target} /><span style={{ color: "#00C6FF", fontSize: ".7em" }}>{s.suffix}</span>
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,.6)", marginTop: 8 }}>{s.label}</div>
                <div style={{ width: 40, height: 3, background: "#00C6FF", borderRadius: 2, margin: "12px auto 0" }} />
              </RevealDiv>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <section id="products" style={{ background: "transparent", padding: "100px 0" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
            <RevealDiv>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--blue)", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ width: 32, height: 2, background: "#00C6FF", display: "inline-block" }} /> Product Catalogue
              </div>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(36px,5vw,58px)", lineHeight: 1.05, color: "var(--ink)" }}>
                Everything Your<br />Brand <span style={{ color: "var(--blue)" }}>Needs.</span>
              </h2>
            </RevealDiv>
            <RevealDiv delay={0.2}>
              <a href="https://wa.me/250788355226?text=Hi!%20Please%20send%20me%20your%20full%20price%20list." target="_blank" rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px",
                  background: "#25D366", color: "#fff", borderRadius: 4,
                  fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none",
                  transition: "background .2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
                onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
              >
                <WaIcon /> View Full Price List
              </a>
            </RevealDiv>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "40px 0" }}>
            {cats.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                style={{
                  fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em",
                  padding: "10px 20px", borderRadius: 3,
                  border: `1.5px solid ${activeCat === cat ? "var(--blue)" : "var(--light-grey)"}`,
                  background: activeCat === cat ? "var(--blue)" : "transparent",
                  color: activeCat === cat ? "#fff" : "var(--grey)",
                  cursor: "pointer", transition: "all .2s"
                }}
              >{catLabels[cat]}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {filtered.map((p, i) => (
              <RevealDiv key={p.title} delay={i * 0.05}>
                <ProductCard {...p} />
              </RevealDiv>
            ))}
          </div>

          {/* See all products CTA */}
          <RevealDiv style={{ marginTop: 32, textAlign: "center" }}>
            <a href="/products"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px",
                background: "var(--navy)", color: "#fff", borderRadius: 4,
                fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none",
                transition: "background .2s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--blue)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--navy)")}
            >
              Browse Full Product Catalogue →
            </a>
          </RevealDiv>

          {/* Bulk CTA */}
          <RevealDiv delay={0.1} style={{ marginTop: 48 }}>
            <div style={{ background: "linear-gradient(135deg, var(--navy), var(--blue))", borderRadius: 12, padding: "40px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#00C6FF", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 8 }}>Bulk Orders</div>
                <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(22px,3vw,32px)", color: "#fff", marginBottom: 8 }}>Need 100+ Units?</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)" }}>We specialise in large corporate orders. Better pricing, priority production.</p>
              </div>
              <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!%20I%20have%20a%20large%20bulk%20order%20requirement." target="_blank" rel="noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 32px", whiteSpace: "nowrap",
                  background: "#25D366", color: "#fff", borderRadius: 4,
                  fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none",
                  transition: "background .2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
                onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
              >
                <WaIcon size={18} /> Bulk Order Enquiry
              </a>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* INDUSTRIES */}
      <section id="industries" style={{ background: "transparent", padding: "100px 0" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
          <RevealDiv style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ width: 32, height: 2, background: "#00C6FF", display: "inline-block" }} /> Industries We Serve
            </div>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(36px,5vw,58px)", lineHeight: 1.05, color: "var(--ink)", textAlign: "center" }}>
              Trusted Across <span style={{ color: "var(--blue)" }}>Every Sector.</span>
            </h2>
            <p style={{ fontSize: 17, color: "var(--grey)", maxWidth: 520, margin: "16px auto 0", textAlign: "center" }}>From government to startups — if you have a brand, we make it visible.</p>
          </RevealDiv>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginTop: 56 }}>
            {industries.map((ind, i) => (
              <IndustryCard key={ind.name} icon={ind.icon} name={ind.name} delay={i * 0.04} />
            ))}
          </div>
        </div>
      </section>

      {/* GET QUOTE */}
      <section id="quote" style={{ background: "rgba(12,24,72,0.8)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "100px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,198,255,.12) 0%, transparent 70%)" }} />
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }} className="gq-grid">
            <RevealDiv>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "#00C6FF", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ width: 32, height: 2, background: "#00C6FF", display: "inline-block" }} /> Get a Quote
              </div>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(36px,5vw,56px)", color: "#fff", lineHeight: 1.1, marginBottom: 20 }}>
                Let's Talk About Your Project
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,.55)", lineHeight: 1.7, marginBottom: 36 }}>
                Tell us what you need and we'll send a clear, itemised quote within hours. WhatsApp or form — your choice.
              </p>
              <div style={{ background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.2)", borderRadius: 10, padding: 28, marginBottom: 24 }}>
                <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <WaIcon size={20} /> Fastest: WhatsApp Us
                </h4>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", marginBottom: 20 }}>
                  Send your brief directly and get a quote in minutes.
                </p>
                <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!%20I%20need%20a%20quote." target="_blank" rel="noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px",
                    background: "#25D366", color: "#fff", borderRadius: 4,
                    fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none"
                  }}
                >
                  <WaIcon /> +250 788 355 226
                </a>
              </div>
              <ul style={{ listStyle: "none", marginBottom: 24 }}>
                {["Describe the product, quantity and deadline", "Share your logo or artwork file", "Specify size, material or special finishes", "We'll follow up same day"].map(tip => (
                  <li key={tip} style={{ fontSize: 13, color: "rgba(255,255,255,.65)", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#00C6FF", fontWeight: 700 }}>→</span> {tip}
                  </li>
                ))}
              </ul>
            </RevealDiv>

            <RevealDiv delay={0.2}>
              <QuoteForm />
            </RevealDiv>
          </div>
        </div>
        <style>{`@media (max-width: 1024px) { .gq-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: "rgba(6,14,44,0.65)", backdropFilter: "blur(8px)", padding: "100px 0" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
          <RevealDiv style={{ textAlign: "center", marginBottom: 0 }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "#00C6FF", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ width: 32, height: 2, background: "#00C6FF", display: "inline-block" }} /> Client Stories
            </div>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(36px,5vw,58px)", color: "#fff" }}>
              What Clients <span style={{ color: "#00C6FF" }}>Say.</span>
            </h2>
          </RevealDiv>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24, marginTop: 56 }}>
            {testimonials.map((t, i) => (
              <RevealDiv key={t.name} delay={i * 0.1}>
                <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 32, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 16, right: 20, fontFamily: "'Inter', sans-serif", fontSize: 80, color: "rgba(38,69,200,.2)", lineHeight: 1 }}>"</div>
                  <div style={{ color: "#F5C518", fontSize: 12, marginBottom: 16, letterSpacing: 2 }}>★★★★★</div>
                  <p style={{ fontSize: 15, color: "rgba(255,255,255,.7)", lineHeight: 1.75, marginBottom: 24, position: "relative", zIndex: 1 }}>{t.text}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 14, color: "#fff" }}>{t.initials}</div>
                    <div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>{t.name}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: ".06em" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background: "transparent", padding: "100px 0" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }} className="contact-grid">
            <RevealDiv>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--blue)", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ width: 32, height: 2, background: "#00C6FF", display: "inline-block" }} /> Find Us
              </div>
              <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: "clamp(36px,5vw,58px)", lineHeight: 1.05, color: "var(--ink)", marginBottom: 16 }}>
                Visit or <span style={{ color: "var(--blue)" }}>Get in Touch.</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 36 }}>
                {[
                  { icon: "📞", label: "Call Us", value: "+250 788 978 879", href: "tel:+250788978879", green: false },
                  { icon: "💬", label: "WhatsApp", value: "+250 788 355 226", href: "https://wa.me/250788355226", green: true },
                  { icon: "📞", label: "Secondary Line", value: "+250 785 177 044", href: "tel:+250785177044", green: false },
                  { icon: "✉️", label: "Email", value: "duplicator10@gmail.com", href: "mailto:duplicator10@gmail.com", green: false },
                  { icon: "📍", label: "Location", value: "Karuruma, Kigali–Rwanda", href: null, green: false },
                ].map(c => (
                  <ContactCard key={c.label} {...c} />
                ))}
              </div>
              <div style={{ background: "var(--navy)", borderRadius: 12, padding: 28, marginTop: 24, color: "#fff" }}>
                <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 16, color: "#fff" }}>Business Hours</h4>
                {[
                  { day: "MON – FRI", time: "8:00 AM – 6:00 PM" },
                  { day: "SATURDAY", time: "9:00 AM – 2:00 PM" },
                  { day: "SUNDAY", time: "Closed" },
                ].map(h => (
                  <div key={h.day} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)", fontSize: 13 }}>
                    <span style={{ color: "rgba(255,255,255,.5)", fontFamily: "'Inter', sans-serif", fontSize: 11 }}>{h.day}</span>
                    <span style={{ color: h.time === "Closed" ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.85)", fontWeight: 500 }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </RevealDiv>
            <RevealDiv delay={0.2}>
              <div style={{ background: "rgba(10,20,55,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ height: 320, background: "linear-gradient(135deg, rgba(12,24,72,0.95), rgba(38,69,200,0.5))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{ fontSize: 48, opacity: .5 }}>📍</div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff" }}>Karuruma, Kigali</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, textAlign: "center", color: "rgba(255,255,255,.55)", letterSpacing: ".06em", lineHeight: 1.8 }}>4344+JVF, Karuruma<br />Kigali, Rwanda · P.O. Box 6332</p>
                </div>
                <div style={{ padding: 20, display: "flex", gap: 12 }}>
                  <a href="https://maps.google.com/?q=Karuruma,Kigali,Rwanda" target="_blank" rel="noreferrer"
                    style={{ flex: 1, padding: 12, textAlign: "center", borderRadius: 6, background: "var(--blue)", color: "#fff", textDecoration: "none", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13 }}>
                    📍 Get Directions
                  </a>
                  <a href="https://wa.me/250788355226?text=Hi!%20I%27d%20like%20to%20visit." target="_blank" rel="noreferrer"
                    style={{ flex: 1, padding: 12, textAlign: "center", borderRadius: 6, background: "#25D366", color: "#fff", textDecoration: "none", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13 }}>
                    💬 Chat First
                  </a>
                </div>
              </div>
              <div style={{ marginTop: 24, background: "rgba(10,20,55,0.5)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", color: "rgba(255,255,255,.4)", marginBottom: 16 }}>Follow Us</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "📸 Instagram", href: "https://instagram.com/duplicatorltd" },
                    { label: "💼 LinkedIn", href: "https://linkedin.com" },
                    { label: "𝕏 Twitter/X", href: "https://twitter.com/duplicatorltd" },
                  ].map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", border: "1.5px solid var(--light-grey)", borderRadius: 6, textDecoration: "none", color: "var(--ink)", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13, transition: "all .2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#2645C8"; e.currentTarget.style.color = "#2645C8"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--light-grey)"; e.currentTarget.style.color = "var(--ink)"; }}
                    >{s.label}</a>
                  ))}
                </div>
              </div>
            </RevealDiv>
          </div>
        </div>
        <style>{`@media (max-width: 1024px) { .contact-grid { grid-template-columns: 1fr !important; } }`}</style>
      </section>

      {/* Mobile bottom nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(13,17,23,.97)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,.07)", zIndex: 800, display: "none" }} className="mobile-bottom">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", paddingBottom: 8 }}>

          {/* HOME — house with peaked roof + door */}
          <a href="/#home" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px 6px", textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#00C6FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <path d="M3 12L12 4l9 8"/>
              <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, textTransform: "uppercase", letterSpacing: ".08em", color: "#00C6FF" }}>HOME</span>
          </a>

          {/* PRODUCTS — flat-top hexagon */}
          <a href="/products" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px 6px", textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <polygon points="12,3 19.8,7.5 19.8,16.5 12,21 4.2,16.5 4.2,7.5"/>
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.45)" }}>PRODUCTS</span>
          </a>

          {/* ORDER — elevated green WhatsApp button */}
          <a href="https://wa.me/250788355226?text=Hi!" target="_blank" rel="noreferrer"
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none", marginTop: -22, paddingBottom: 6 }}>
            <span style={{
              width: 58, height: 58, borderRadius: 16,
              background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 -4px 24px rgba(37,211,102,.45)"
            }}>
              <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, textTransform: "uppercase", letterSpacing: ".08em", color: "#25D366" }}>ORDER</span>
          </a>

          {/* QUOTE — clipboard with oval clip tab */}
          <a href="/#quote" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px 6px", textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <rect x="8" y="2" width="8" height="4" rx="2"/>
              <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.45)" }}>QUOTE</span>
          </a>

          {/* FIND US — teardrop map pin with inner circle */}
          <a href="/#contact" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px 6px", textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <path d="M12 22s7-6.5 7-12A7 7 0 005 10c0 5.5 7 12 7 12z"/>
              <circle cx="12" cy="10" r="2.5"/>
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 8, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.45)" }}>FIND US</span>
          </a>

        </div>
      </nav>
      <style>{`@media (max-width: 768px) { .mobile-bottom { display: block !important; } body { padding-bottom: 72px; } }`}</style>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}

function ProductCard({ emoji, title, desc, sku, msg, cat }: { emoji: string; title: string; desc: string; sku: string; msg: string; cat: string; }) {
  const [hovered, setHovered] = useState(false);
  const catLabel = { printing: "Printing", signage: "Signage", branding: "Branding", sewing: "Sewing", gifts: "Corporate Gifts" }[cat] || cat;
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "rgba(15,28,80,0.75)" : "rgba(10,20,55,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, overflow: "hidden", border: `1px solid ${hovered ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.08)"}`, transition: "all .3s cubic-bezier(.4,0,.2,1)", transform: hovered ? "translateY(-4px)" : "none", boxShadow: hovered ? "0 24px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.1)" : "0 4px 24px rgba(0,0,0,.2)" }}>
      <div style={{ height: 200, background: "linear-gradient(135deg, rgba(15,28,80,0.95), rgba(38,69,200,0.4))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontSize: 72, opacity: .12 }}>{emoji}</span>
        <span style={{ position: "absolute", top: 12, left: 12, fontFamily: "'Inter', sans-serif", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", padding: "4px 12px", background: "rgba(38,69,200,0.8)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,.9)", borderRadius: 999, border: "1px solid rgba(255,255,255,.15)" }}>{catLabel}</span>
      </div>
      <div style={{ padding: 24 }}>
        <h4 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 17, color: "var(--ink)", marginBottom: 8 }}>{title}</h4>
        <p style={{ fontSize: 13, color: "var(--grey)", lineHeight: 1.6, marginBottom: 20 }}>{desc}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "rgba(255,255,255,.25)", textTransform: "uppercase", letterSpacing: ".06em" }}>{sku}</span>
          <a href={`https://wa.me/250788355226?text=Hi!%20I'm%20interested%20in%20${msg}.%20Please%20quote%20me.`} target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "#25D366", color: "#fff", borderRadius: 4, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, textDecoration: "none", transition: "background .2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
            onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Order via WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function IndustryCard({ icon, name, delay }: { icon: string; name: string; delay: number; }) {
  const [hovered, setHovered] = useState(false);
  return (
    <RevealDiv delay={delay}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ background: hovered ? "rgba(38,69,200,0.35)" : "rgba(10,20,55,0.5)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${hovered ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.08)"}`, borderRadius: 16, padding: "28px 20px", textAlign: "center", transition: "all .3s", cursor: "default", transform: hovered ? "translateY(-4px)" : "none", boxShadow: hovered ? "0 16px 40px rgba(0,0,0,.3)" : "none" }}>
        <div style={{ fontSize: 32, marginBottom: 12, color: hovered ? "#00C6FF" : "rgba(0,198,255,0.7)", transition: "color .3s" }}>{icon}</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: hovered ? "#fff" : "rgba(255,255,255,.8)", transition: "color .3s" }}>{name}</div>
      </div>
    </RevealDiv>
  );
}

function ContactCard({ icon, label, value, href, green }: { icon: string; label: string; value: string; href: string | null; green: boolean; }) {
  const [hovered, setHovered] = useState(false);
  const content = (
    <>
      <div style={{ width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: green ? "rgba(37,211,102,.15)" : "rgba(38,69,200,.2)", border: `1px solid ${green ? "rgba(37,211,102,.25)" : "rgba(38,69,200,.35)"}`, fontSize: 20 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--grey)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{value}</div>
      </div>
    </>
  );
  const style: React.CSSProperties = {
    background: hovered ? "rgba(15,30,80,0.75)" : "rgba(10,20,55,0.5)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${hovered ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.08)"}`,
    borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16,
    textDecoration: "none", transition: "all .25s",
    boxShadow: hovered ? "0 12px 32px rgba(0,0,0,.3)" : "none"
  };
  return href ? (
    <a href={href} target={href.startsWith("https") ? "_blank" : undefined} rel="noreferrer" style={style}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {content}
    </a>
  ) : (
    <div style={style} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>{content}</div>
  );
}

function QuoteForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cat, setCat] = useState("");
  const [products, setProducts] = useState("");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    const msg = `Hi Duplicator Ltd!\n\n📋 QUOTE REQUEST\n\n👤 Name: ${name||"[Name not provided]"}\n📞 Phone: ${phone||"[Phone not provided]"}\n📦 Category: ${cat||"[Not selected]"}\n\n📝 Products Needed:\n${products||"[Not specified]"}\n\n🔢 Quantity: ${qty||"[Not specified]"}\n\n📌 Notes: ${notes}\n\nPlease send me a quote. Thank you!`;
    window.open(`https://wa.me/250788355226?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 6, padding: "13px 16px", color: "#fff", fontFamily: "'Inter', sans-serif",
    fontSize: 14, outline: "none", transition: "border .2s"
  };

  return (
    <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 40 }}>
      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 28 }}>Request a Quote</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="form-row-grid">
        <div>
          <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Your Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = "#00C6FF")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.12)")} />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Phone / WhatsApp</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250 7XX XXX XXX" type="tel" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = "#00C6FF")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.12)")} />
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .form-row-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Category</label>
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...inputStyle, appearance: "none" }}
          onFocus={e => (e.target.style.borderColor = "#00C6FF")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.12)")}>
          <option value="">Select a service category</option>
          <option>Printing & Stationery</option>
          <option>Large Format & Signage</option>
          <option>Branding & Promotional</option>
          <option>Sewing & Apparel</option>
          <option>Corporate Gifts & Awards</option>
        </select>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Products Needed</label>
        <textarea value={products} onChange={e => setProducts(e.target.value)} placeholder="Describe what you need..." rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
          onFocus={e => (e.target.style.borderColor = "#00C6FF")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.12)")} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Quantity</label>
        <input value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 500 pieces" style={inputStyle}
          onFocus={e => (e.target.style.borderColor = "#00C6FF")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.12)")} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>Additional Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Deadline, special requirements, artwork details..." rows={2}
          style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
          onFocus={e => (e.target.style.borderColor = "#00C6FF")} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.12)")} />
      </div>
      <button onClick={submit} style={{ width: "100%", padding: 16, background: "#00C6FF", color: "var(--ink)", border: "none", borderRadius: 6, fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: ".05em", cursor: "pointer", transition: "all .2s", marginTop: 8 }}
        onMouseEnter={e => { e.currentTarget.style.background = "#fff"; (e.currentTarget.style as any).color = "var(--navy)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#00C6FF"; e.currentTarget.style.color = "var(--ink)"; }}>
        Send Quote Request via WhatsApp →
      </button>
    </div>
  );
}
