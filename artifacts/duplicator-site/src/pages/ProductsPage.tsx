import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFAB from "@/components/WhatsAppFAB";

const WaIcon = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  desc: string;
  sku: string;
  emoji: string;
  subcategory: string;
  category: string;
  badge?: string;
  featured?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc: string;
  subcategories: string[];
}

// ── Data ──────────────────────────────────────────────────────────────────
const categories: Category[] = [
  {
    id: "duplicators",
    label: "Digital Duplicators",
    icon: "🖨️",
    color: "#2645C8",
    desc: "High-volume, low-cost duplication systems bridging copier and offset press.",
    subcategories: ["Entry-Level", "Mid-Range", "High-Volume Production"],
  },
  {
    id: "finishing",
    label: "Finishing & Cutting",
    icon: "✂️",
    color: "#1B2B8A",
    desc: "Automation tools that turn raw sheets into final professional products.",
    subcategories: ["Slitters & Creasers", "Digital Cutting Tables", "Die-Cutters"],
  },
  {
    id: "booklets",
    label: "Booklet Makers & Binding",
    icon: "📚",
    color: "#4A90E2",
    desc: "Systems that automate assembly of multi-page documents and publications.",
    subcategories: ["Booklet Making Systems", "Binding Machines", "Folding Systems"],
  },
  {
    id: "embellishment",
    label: "Print Embellishment",
    icon: "✨",
    color: "#F5C518",
    desc: "Add luxury textures and visual effects to printed materials.",
    subcategories: ["Sensory & UV Effects"],
  },
  {
    id: "consumables",
    label: "Consumables & Support",
    icon: "🔧",
    color: "#5A6478",
    desc: "Inks, masters, toner, parts, and software for continuous operation.",
    subcategories: ["Inks & Masters", "Toner & Parts", "Software"],
  },
  {
    id: "sewing",
    label: "Sewing & Apparel",
    icon: "🧵",
    color: "#7C3AED",
    desc: "Custom-sewn uniforms, branded apparel, and embroidery services for teams, events and corporate identity.",
    subcategories: ["Polo Shirts & T-Shirts", "Corporate Uniforms", "Workwear & Overalls", "Caps & Headwear", "Aprons & Accessories"],
  },
];

const products: Product[] = [
  // Digital Duplicators — Entry-Level
  { id: "dp-a200", name: "DP-A200", desc: "Compact duplicator for small offices and schools. Up to 130 ppm, ideal for cost-efficient short runs.", sku: "DUP-EL-001", emoji: "🖨️", subcategory: "Entry-Level", category: "duplicators", featured: true },
  { id: "dp-a100", name: "DP-A100", desc: "Ultra-compact entry model with simple one-button operation. Perfect for community organisations.", sku: "DUP-EL-002", emoji: "🖨️", subcategory: "Entry-Level", category: "duplicators" },
  // Digital Duplicators — Mid-Range
  { id: "dp-g300", name: "DP-G300", desc: "600 dpi resolution at 130 ppm. Mid-tier performance for medium organisations requiring sharper output.", sku: "DUP-MR-001", emoji: "🖨️", subcategory: "Mid-Range", category: "duplicators", featured: true },
  { id: "dp-g600", name: "DP-G600", desc: "Dual-drum mid-range system enabling two-colour printing in a single pass at competitive speed.", sku: "DUP-MR-002", emoji: "🖨️", subcategory: "Mid-Range", category: "duplicators" },
  // Digital Duplicators — High-Volume
  { id: "dp-x850", name: "DP-X850", desc: "Heavy-duty flagship. Up to 200 ppm, 600 dpi, built for non-stop production runs. The industry workhorse.", sku: "DUP-HV-001", emoji: "🏭", subcategory: "High-Volume Production", category: "duplicators", featured: true, badge: "Flagship" },
  { id: "dp-x600", name: "DP-X600", desc: "High-volume model at 170 ppm. Supports A3 format for newspapers, newsletters, and large booklets.", sku: "DUP-HV-002", emoji: "🏭", subcategory: "High-Volume Production", category: "duplicators" },

  // Finishing — Slitters & Creasers
  { id: "dc-618", name: "DC-618", desc: "Slitter, cutter, and creaser in a single automated pass. Handles business cards, flyers, and menus effortlessly.", sku: "FIN-SC-001", emoji: "✂️", subcategory: "Slitters & Creasers", category: "finishing", featured: true },
  { id: "dc-646", name: "DC-646", desc: "Higher throughput version of the DC range. Precision cutting with perforating and scoring modules.", sku: "FIN-SC-002", emoji: "✂️", subcategory: "Slitters & Creasers", category: "finishing" },
  { id: "dc-445", name: "DC-445", desc: "Compact slitter/cutter for lower volumes. Ideal for boutique print shops and marketing teams.", sku: "FIN-SC-003", emoji: "✂️", subcategory: "Slitters & Creasers", category: "finishing" },
  // Finishing — Digital Cutting
  { id: "pfi-blade-s", name: "PFi Blade S", desc: "Entry digital cutting table for short-run packaging and custom-shaped labels. No physical dies required.", sku: "FIN-DC-001", emoji: "🗃️", subcategory: "Digital Cutting Tables", category: "finishing", featured: true },
  { id: "pfi-blade-xl", name: "PFi Blade XL", desc: "Large-format digital cutting table. Handles up to A0 sheets for prototypes, displays, and bespoke packaging.", sku: "FIN-DC-002", emoji: "🗃️", subcategory: "Digital Cutting Tables", category: "finishing" },
  // Finishing — Die-Cutters
  { id: "dsm-1000", name: "DSM-1000", desc: "Precision die-cutter for high-end packaging, luxury card production, and bespoke event invitations.", sku: "FIN-DIE-001", emoji: "🔲", subcategory: "Die-Cutters", category: "finishing", badge: "Premium" },

  // Booklet Makers — Booklet Systems
  { id: "dbm-150", name: "DBM-150", desc: "Entry booklet maker with saddle stitching and folding. Perfect for programmes, brochures, and manuals.", sku: "BKL-BM-001", emoji: "📓", subcategory: "Booklet Making Systems", category: "booklets", featured: true },
  { id: "dbm-700", name: "DBM-700", desc: "High-speed saddle stitcher with square-spine finishing for a professional 'perfect bound' appearance.", sku: "BKL-BM-002", emoji: "📓", subcategory: "Booklet Making Systems", category: "booklets" },
  // Binding
  { id: "dpb-500", name: "DPB-500", desc: "Automated thermal/glue binding system for professional soft-cover books, reports, and training manuals.", sku: "BKL-BD-001", emoji: "📖", subcategory: "Binding Machines", category: "booklets", featured: true },
  { id: "dpb-200", name: "DPB-200", desc: "Compact perfect binder for lower volumes. Ideal for corporate reports, proposals, and annual documents.", sku: "BKL-BD-002", emoji: "📖", subcategory: "Binding Machines", category: "booklets" },
  // Folding
  { id: "df-600", name: "DF-600", desc: "High-speed folding machine for complex document folds. Handles letter, accordion, and Z-folds.", sku: "BKL-FL-001", emoji: "📄", subcategory: "Folding Systems", category: "booklets" },

  // Embellishment
  { id: "dusense-uv", name: "DuSense UV Coater", desc: "Add raised UV spot coating to business cards, book covers, and invitations. Creates stunning 3D tactile effects.", sku: "EMB-UV-001", emoji: "💎", subcategory: "Sensory & UV Effects", category: "embellishment", featured: true, badge: "Luxury" },
  { id: "dusense-foil", name: "DuSense Foil Module", desc: "Hot-foil stamping and cold foil lamination for gold, silver, and holographic effects on premium print.", sku: "EMB-FL-001", emoji: "✨", subcategory: "Sensory & UV Effects", category: "embellishment" },
  { id: "dusense-texture", name: "DuSense Texture Pack", desc: "Linen, canvas, and velvet texture overlays that add a premium hand-feel to any printed substrate.", sku: "EMB-TX-001", emoji: "🎨", subcategory: "Sensory & UV Effects", category: "embellishment" },

  // Consumables — Inks & Masters
  { id: "ink-black-hl", name: "High-Yield Black Ink Cartridge", desc: "Compatible with DP-Series duplicators. Yields up to 60,000 impressions per cartridge.", sku: "CON-INK-001", emoji: "🖋️", subcategory: "Inks & Masters", category: "consumables" },
  { id: "ink-color", name: "Colour Ink Set (CMYK)", desc: "Full 4-colour set for colour duplicator models. Fade-resistant, water-based formula.", sku: "CON-INK-002", emoji: "🎨", subcategory: "Inks & Masters", category: "consumables" },
  { id: "master-roll-std", name: "Standard Master Roll", desc: "Universal master roll for DP-Series duplicators. Produces sharply detailed stencil masters.", sku: "CON-MR-001", emoji: "📜", subcategory: "Inks & Masters", category: "consumables" },
  // Toner & Parts
  { id: "toner-bk", name: "Toner Cartridge — Black", desc: "Genuine replacement toner for integrated copier/printer systems. Engineered for consistent density.", sku: "CON-TN-001", emoji: "⬛", subcategory: "Toner & Parts", category: "consumables" },
  { id: "drum-unit", name: "Drum Unit", desc: "Replacement drum assembly. Restores print quality and extends machine lifespan significantly.", sku: "CON-DR-001", emoji: "🔩", subcategory: "Toner & Parts", category: "consumables" },
  // Software
  { id: "impostrip", name: "Ultimate Impostrip", desc: "Workflow automation for imposition and prepress. Reduces manual layout time by up to 80%.", sku: "CON-SW-001", emoji: "💻", subcategory: "Software", category: "consumables", featured: true, badge: "Software" },
  { id: "dupconnect", name: "DupConnect Print Driver", desc: "Network connectivity driver for seamless integration of duplicators with office print workflows.", sku: "CON-SW-002", emoji: "🌐", subcategory: "Software", category: "consumables" },

  // Sewing & Apparel — Polo Shirts & T-Shirts
  { id: "polo-std", name: "Corporate Polo Shirt", desc: "Premium piqué polo with embroidered or printed logo. Available in all sizes from XS–4XL. Minimum order: 10 pcs.", sku: "SEW-PL-001", emoji: "👕", subcategory: "Polo Shirts & T-Shirts", category: "sewing", featured: true },
  { id: "tshirt-crew", name: "Crew-Neck T-Shirt", desc: "100% cotton crew-neck tee. Custom screen-printed or DTG-printed design. Ideal for events and staff branding.", sku: "SEW-TS-001", emoji: "👕", subcategory: "Polo Shirts & T-Shirts", category: "sewing" },
  { id: "polo-dry-fit", name: "Dry-Fit Performance Polo", desc: "Moisture-wicking fabric for hospitality, sport and outdoor teams. Full-colour dye-sublimation printing.", sku: "SEW-PL-002", emoji: "👕", subcategory: "Polo Shirts & T-Shirts", category: "sewing" },
  { id: "tshirt-event", name: "Event T-Shirt (Bulk Pack)", desc: "High-volume event shirts. Minimum 50 pcs, competitive pricing per unit. Single or double-sided print.", sku: "SEW-TS-002", emoji: "👕", subcategory: "Polo Shirts & T-Shirts", category: "sewing", badge: "Bulk" },

  // Sewing & Apparel — Corporate Uniforms
  { id: "uniform-shirt", name: "Corporate Dress Shirt", desc: "Tailored long-sleeve or short-sleeve corporate shirt with embroidered logo on chest. Men's and women's cuts.", sku: "SEW-UN-001", emoji: "👔", subcategory: "Corporate Uniforms", category: "sewing", featured: true },
  { id: "uniform-suit", name: "Office Uniform Set", desc: "Complete uniform package: trousers, shirt, and optional blazer. Custom-fitted to your organisation's colour spec.", sku: "SEW-UN-002", emoji: "🧥", subcategory: "Corporate Uniforms", category: "sewing" },
  { id: "uniform-security", name: "Security & Guard Uniform", desc: "Heavy-duty security uniform with reinforced stitching, epaulette loops, and custom badge embroidery.", sku: "SEW-UN-003", emoji: "🦺", subcategory: "Corporate Uniforms", category: "sewing" },
  { id: "uniform-hospitality", name: "Hospitality Uniform", desc: "Hotel, restaurant, and service industry uniforms. Elegant cuts, stain-resistant fabric options, logo embroidery.", sku: "SEW-UN-004", emoji: "👔", subcategory: "Corporate Uniforms", category: "sewing" },

  // Sewing & Apparel — Workwear & Overalls
  { id: "overall-heavy", name: "Heavy-Duty Overall", desc: "Full-body industrial overall in durable poly-cotton blend. Reflective strips available. Custom logo printing.", sku: "SEW-OV-001", emoji: "🦺", subcategory: "Workwear & Overalls", category: "sewing", featured: true },
  { id: "coverall-flame", name: "Flame-Retardant Coverall", desc: "Safety coverall for industrial, chemical, and energy-sector workers. Meets international safety standards.", sku: "SEW-OV-002", emoji: "🦺", subcategory: "Workwear & Overalls", category: "sewing", badge: "Safety" },
  { id: "jacket-work", name: "Branded Work Jacket", desc: "Sleeveless or full-sleeve work jacket with logo patch, zipped pockets, and reinforced elbows.", sku: "SEW-OV-003", emoji: "🧥", subcategory: "Workwear & Overalls", category: "sewing" },

  // Sewing & Apparel — Caps & Headwear
  { id: "cap-baseball", name: "Branded Baseball Cap", desc: "6-panel structured cap with embroidered logo on front. Adjustable strap back. One size fits most.", sku: "SEW-CP-001", emoji: "🧢", subcategory: "Caps & Headwear", category: "sewing", featured: true },
  { id: "cap-bucket", name: "Bucket Hat", desc: "Unisex cotton bucket hat ideal for outdoor events, promotions, and NGO field teams. Custom embroidery.", sku: "SEW-CP-002", emoji: "🧢", subcategory: "Caps & Headwear", category: "sewing" },
  { id: "cap-beanie", name: "Branded Beanie / Knit Cap", desc: "Warm knit beanie with woven or embroidered logo patch. Ideal for corporate gifting and cold-weather staff gear.", sku: "SEW-CP-003", emoji: "🧢", subcategory: "Caps & Headwear", category: "sewing" },

  // Sewing & Apparel — Aprons & Accessories
  { id: "apron-kitchen", name: "Chef & Kitchen Apron", desc: "Full-length or half-apron for restaurants, catering and hotels. Custom embroidered logo and adjustable straps.", sku: "SEW-AP-001", emoji: "🧑‍🍳", subcategory: "Aprons & Accessories", category: "sewing", featured: true },
  { id: "apron-salon", name: "Salon & Spa Apron", desc: "Lightweight, water-resistant apron for beauty and wellness professionals. Clean logo finish, multiple colour options.", sku: "SEW-AP-002", emoji: "✂️", subcategory: "Aprons & Accessories", category: "sewing" },
  { id: "bib-promo", name: "Promotional Bib / Vest", desc: "High-visibility promotional bibs and race-day vests. Ideal for marathons, community events, and NGO campaigns.", sku: "SEW-AP-003", emoji: "🦺", subcategory: "Aprons & Accessories", category: "sewing" },
  { id: "bag-tote", name: "Custom Tote Bag", desc: "Non-woven or cotton tote bag with screen-printed or sublimated logo. Perfect for conference giveaways.", sku: "SEW-AP-004", emoji: "👜", subcategory: "Aprons & Accessories", category: "sewing" },
];

// ── Product Card ───────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const cat = categories.find(c => c.id === product.category);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 10, overflow: "hidden",
        border: `1.5px solid ${hovered ? (cat?.color || "#2645C8") : "#E8ECF2"}`,
        transition: "all .3s",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? `0 16px 40px ${cat?.color || "#2645C8"}1e` : "0 2px 8px rgba(0,0,0,.04)",
        display: "flex", flexDirection: "column"
      }}
    >
      {/* Image area */}
      <div style={{
        height: 160,
        background: `linear-gradient(135deg, ${cat?.color || "#2645C8"}18, ${cat?.color || "#2645C8"}08)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative"
      }}>
        <span style={{ fontSize: 52, opacity: .18 }}>{product.emoji}</span>
        <span style={{
          position: "absolute", top: 12, left: 12,
          fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em",
          padding: "4px 10px", background: cat?.color || "#2645C8", color: "#fff", borderRadius: 2
        }}>{product.subcategory}</span>
        {product.badge && (
          <span style={{
            position: "absolute", top: 12, right: 12,
            fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".08em",
            padding: "4px 10px", background: product.badge === "Luxury" ? "#F5C518" : product.badge === "Software" ? "#4A90E2" : "#00C6FF",
            color: product.badge === "Luxury" ? "#0D1117" : "#fff", borderRadius: 2, fontWeight: 700
          }}>{product.badge}</span>
        )}
        {product.featured && !product.badge && (
          <span style={{
            position: "absolute", top: 12, right: 12,
            fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".08em",
            padding: "4px 10px", background: "rgba(0,198,255,.15)", color: "#00C6FF",
            border: "1px solid rgba(0,198,255,.3)", borderRadius: 2
          }}>Featured</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "20px 20px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "rgba(0,0,0,.25)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>{product.sku}</div>
        <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#0D1117", marginBottom: 8, lineHeight: 1.2 }}>{product.name}</h4>
        <p style={{ fontSize: 13, color: "#5A6478", lineHeight: 1.6, marginBottom: 16, flex: 1 }}>{product.desc}</p>
        <a
          href={`https://wa.me/250788355226?text=Hi!%20I%27m%20interested%20in%20the%20${encodeURIComponent(product.name)}.%20Please%20send%20me%20pricing%20and%20availability.`}
          target="_blank" rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 16px", background: "#25D366", color: "#fff",
            borderRadius: 6, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12,
            textDecoration: "none", transition: "background .2s", letterSpacing: ".02em"
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
          onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
        >
          <WaIcon /> Enquire via WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── Category Section ───────────────────────────────────────────────────────
function CategorySection({ category, products: catProducts, activeSubcat, onSubcat }: {
  category: Category;
  products: Product[];
  activeSubcat: string | null;
  onSubcat: (s: string | null) => void;
}) {
  const displayed = activeSubcat
    ? catProducts.filter(p => p.subcategory === activeSubcat)
    : catProducts;

  return (
    <div style={{ marginBottom: 80 }} id={`cat-${category.id}`}>
      {/* Category header */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 32,
        padding: "28px 32px", background: `linear-gradient(135deg, ${category.color}0d, ${category.color}05)`,
        borderRadius: 12, border: `1px solid ${category.color}22`
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 12, flexShrink: 0,
          background: `${category.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28
        }}>{category.icon}</div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(20px,3vw,28px)", color: "#0D1117", marginBottom: 6 }}>{category.label}</h2>
          <p style={{ fontSize: 14, color: "#5A6478", lineHeight: 1.6, maxWidth: 560, marginBottom: 16 }}>{category.desc}</p>
          {/* Subcategory pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button onClick={() => onSubcat(null)}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em",
                padding: "6px 14px", borderRadius: 100, border: `1.5px solid ${!activeSubcat ? category.color : "#E8ECF2"}`,
                background: !activeSubcat ? category.color : "transparent",
                color: !activeSubcat ? "#fff" : "#5A6478", cursor: "pointer", transition: "all .2s"
              }}>All ({catProducts.length})</button>
            {category.subcategories.map(sub => {
              const count = catProducts.filter(p => p.subcategory === sub).length;
              if (!count) return null;
              const active = activeSubcat === sub;
              return (
                <button key={sub} onClick={() => onSubcat(active ? null : sub)}
                  style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em",
                    padding: "6px 14px", borderRadius: 100, border: `1.5px solid ${active ? category.color : "#E8ECF2"}`,
                    background: active ? category.color : "transparent",
                    color: active ? "#fff" : "#5A6478", cursor: "pointer", transition: "all .2s"
                  }}
                >{sub} ({count})</button>
              );
            })}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, color: category.color, lineHeight: 1 }}>{catProducts.length}</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#5A6478", textTransform: "uppercase", letterSpacing: ".1em" }}>Products</div>
        </div>
      </div>

      {/* Products grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
        {displayed.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [subcatFilters, setSubcatFilters] = useState<Record<string, string | null>>({});

  const setSubcat = (catId: string, sub: string | null) => {
    setSubcatFilters(prev => ({ ...prev, [catId]: sub }));
  };

  const totalCount = products.length;

  const filteredBySearch = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const visibleCategories = activeCategory
    ? categories.filter(c => c.id === activeCategory)
    : categories;

  return (
    <div style={{ background: "#F7F8FC", minHeight: "100vh" }}>
      <Header />

      {/* Page Hero */}
      <div style={{ background: "var(--ink)", paddingTop: 120, paddingBottom: 80, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(38,69,200,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(38,69,200,.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div style={{ position: "absolute", right: "-5%", top: 0, bottom: 0, width: "40%", background: "linear-gradient(135deg, #1B2B8A, #2645C8)", clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0% 100%)", opacity: .6 }} />
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", padding: "6px 14px", borderRadius: 100, border: "1px solid rgba(0,198,255,.3)", background: "rgba(0,198,255,.1)", color: "#00C6FF", marginBottom: 20 }}>
            Product Catalogue
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(40px,7vw,80px)", color: "#fff", lineHeight: .95, marginBottom: 20 }}>
            Industrial Print &<br /><span style={{ color: "#00C6FF" }}>Finishing Solutions.</span>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.6)", maxWidth: 540, marginBottom: 40, lineHeight: 1.7 }}>
            {totalCount} products across 5 specialist categories — from high-volume digital duplicators to precision finishing and luxury embellishment.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <a href="https://wa.me/250788355226?text=Hi!%20Please%20send%20me%20your%20full%20price%20list." target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#25D366", color: "#fff", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", transition: "background .2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
              onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
            ><WaIcon size={16} /> Get Full Price List</a>
            <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!%20I%20need%20a%20demo." target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,.4)", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.1)"; e.currentTarget.style.borderColor = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,.4)"; }}
            >Request a Demo →</a>
          </div>
        </div>
      </div>

      {/* Category stats bar */}
      <div style={{ background: "var(--blue)", padding: "0" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", display: "flex", overflowX: "auto", gap: 0 }}>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat.id).length;
            const active = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(active ? null : cat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "16px 24px",
                  background: active ? "rgba(255,255,255,.15)" : "transparent",
                  border: "none", borderBottom: active ? "3px solid #00C6FF" : "3px solid transparent",
                  color: active ? "#fff" : "rgba(255,255,255,.65)",
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap"
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,.65)"; }}
              >
                <span>{cat.icon}</span> {cat.label}
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, background: active ? "#00C6FF" : "rgba(255,255,255,.2)", color: active ? "#0D1117" : "#fff", padding: "2px 8px", borderRadius: 100 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "60px 24px" }}>
        {/* Search + controls bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#5A6478" }}>🔍</span>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products, model numbers, features..."
              style={{
                width: "100%", padding: "12px 16px 12px 42px",
                background: "#fff", border: "1.5px solid #E8ECF2", borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#0D1117", outline: "none",
                transition: "border .2s"
              }}
              onFocus={e => (e.target.style.borderColor = "#2645C8")}
              onBlur={e => (e.target.style.borderColor = "#E8ECF2")}
            />
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#5A6478", textTransform: "uppercase", letterSpacing: ".1em" }}>
            {filteredBySearch ? `${filteredBySearch.length} results` : `${totalCount} products`}
          </div>
          {(activeCategory || searchQuery) && (
            <button onClick={() => { setActiveCategory(null); setSearchQuery(""); }}
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--blue)", background: "rgba(38,69,200,.08)", border: "1px solid rgba(38,69,200,.2)", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>
              Clear Filters ×
            </button>
          )}
        </div>

        {/* Search results */}
        {filteredBySearch ? (
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "#0D1117", marginBottom: 24 }}>
              Search results for "<span style={{ color: "var(--blue)" }}>{searchQuery}</span>"
            </div>
            {filteredBySearch.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: "#0D1117", marginBottom: 8 }}>No products found</h3>
                <p style={{ color: "#5A6478", fontSize: 15, marginBottom: 24 }}>Try a different search term or browse by category above.</p>
                <a href="https://wa.me/250788355226?text=Hi!%20I%27m%20looking%20for%20a%20product%20but%20can%27t%20find%20it." target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#25D366", color: "#fff", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, textDecoration: "none" }}>
                  <WaIcon size={16} /> Ask on WhatsApp
                </a>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                {filteredBySearch.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        ) : (
          /* Category sections */
          visibleCategories.map(cat => (
            <CategorySection
              key={cat.id}
              category={cat}
              products={products.filter(p => p.category === cat.id)}
              activeSubcat={subcatFilters[cat.id] || null}
              onSubcat={(sub) => setSubcat(cat.id, sub)}
            />
          ))
        )}

        {/* CTA Banner */}
        <div style={{ marginTop: 40, background: "linear-gradient(135deg, var(--navy), var(--blue))", borderRadius: 16, padding: "48px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 32 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#00C6FF", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 8 }}>Ready to Order?</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px,4vw,40px)", color: "#fff", lineHeight: 1.1, marginBottom: 10 }}>Let's build your next<br />print project together.</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", maxWidth: 440 }}>Get a free quote within hours. No commitment, no hidden costs. Just great print at great prices.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!%20I%20need%20a%20quote%20for%20a%20project." target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 32px", background: "#25D366", color: "#fff", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none", whiteSpace: "nowrap", transition: "background .2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
              onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
            ><WaIcon size={18} /> Get a Free Quote</a>
            <a href="/#quote"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 32px", background: "rgba(255,255,255,.08)", color: "#fff", border: "1px solid rgba(255,255,255,.2)", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              Use the Quote Form →
            </a>
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
