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
  tagline: string;
  desc: string;
  specs: string[];
  subcategory: string;
  category: string;
  badge?: string;
  featured?: boolean;
}

interface Category {
  id: string;
  label: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  accentLight: string;
  desc: string;
  capability?: string;
  subcategories: string[];
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconStationery = () => (
  <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
    <rect x="6" y="8" width="28" height="26" rx="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 16h16M12 21h16M12 26h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="14" y="4" width="12" height="6" rx="2" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IconMarketing = () => (
  <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
    <path d="M8 10h24v24H8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M8 10l6-6h18v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 18h12M14 23h12M14 28h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconLargeFormat = () => (
  <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
    <rect x="4" y="12" width="32" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M14 30v4M26 30v4M10 34h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="14" cy="21" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 26l4-6 4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconApparel = () => (
  <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
    <path d="M14 6l-8 8 5 2v18h18V16l5-2-8-8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 6c0 3.31 2.69 6 6 6s6-2.69 6-6" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IconGifts = () => (
  <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
    <rect x="6" y="18" width="28" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
    <rect x="4" y="13" width="32" height="6" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 13V34" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 13c0 0-4-8 0-8s0 8 0 8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M20 13c0 0 4-8 0-8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

// ── Data ──────────────────────────────────────────────────────────────────
const categories: Category[] = [
  {
    id: "stationery",
    label: "Corporate Stationery",
    tagline: "Your first impression, perfected.",
    icon: <IconStationery />,
    color: "#1B2B8A",
    accentLight: "#E8ECF9",
    desc: "Professionally designed and precision-printed corporate identity materials. From business cards to full branded stationery suites — crafted to reflect the authority and credibility your organisation deserves.",
    capability: "Offset & digital printing · Spot UV · Foil stamping · Die-cutting (in-house CNC)",
    subcategories: ["Business Cards", "Letterheads & Compliment Slips", "Envelopes & Folders", "Notepads & Memo Pads"],
  },
  {
    id: "marketing",
    label: "Marketing Collateral",
    tagline: "Print that moves people to act.",
    icon: <IconMarketing />,
    color: "#2645C8",
    accentLight: "#EBF0FF",
    desc: "High-impact marketing materials that communicate your message clearly and leave a lasting impression. Designed in-house by our creative team and printed to international standards — from single flyers to thousands of bound catalogues.",
    capability: "Full-colour digital & offset · Saddle-stitching · Perfect binding · Folding & creasing",
    subcategories: ["Brochures & Flyers", "Booklets & Catalogues", "Presentation Folders", "Posters & Calendars"],
  },
  {
    id: "largeformat",
    label: "Large Format Branding",
    tagline: "Command attention at every scale.",
    icon: <IconLargeFormat />,
    color: "#0A7EC2",
    accentLight: "#E5F4FB",
    desc: "From a single pull-up banner to full vehicle wraps and outdoor signage systems, our large format division delivers bold, weather-resistant visuals. Finished on premium substrates with in-house Laser/CNC cutting for pixel-precise results.",
    capability: "UV-curable wide format printing · Laser/CNC cutting (in-house) · Vinyl application · Aluminium composite fabrication",
    subcategories: ["Pull-Up & Display Banners", "Outdoor & Indoor Signage", "Vehicle Graphics & Wraps", "Exhibition Displays & Backdrops"],
  },
  {
    id: "apparel",
    label: "Custom Apparel & Textiles",
    tagline: "Manufactured in our own sewing factory.",
    icon: <IconApparel />,
    color: "#6D28D9",
    accentLight: "#F0EBFF",
    desc: "Unlike most print shops, Duplicator Ltd operates its own fully equipped sewing factory in Kigali. We don't outsource a single stitch. From medical scrubs to corporate blazers and branded event wear — everything is cut, sewn, embroidered, and quality-checked under one roof.",
    capability: "In-house sewing factory · Industrial embroidery · Screen & sublimation printing · Custom pattern cutting",
    subcategories: ["Corporate & Office Uniforms", "Medical & Hospital Scrubs", "Workwear & Safety Gear", "Event T-Shirts & Polo Shirts", "Caps & Headwear"],
  },
  {
    id: "gifts",
    label: "Corporate Gifts & Recognition",
    tagline: "Strengthen relationships. Reward excellence.",
    icon: <IconGifts />,
    color: "#B45309",
    accentLight: "#FEF3E2",
    desc: "Curated, premium branded gifts that reinforce your corporate identity and leave a meaningful impression. Whether equipping a boardroom, rewarding a team, or launching a campaign — we source, brand, and deliver high-quality items that represent your organisation with distinction.",
    capability: "Custom engraving · Laser etching · Full-colour branding · Gift packaging & fulfillment",
    subcategories: ["Awards & Trophies", "Branded Pens & Writing Sets", "Premium Notebooks", "Branded Tech Accessories", "Executive Gift Sets"],
  },
];

const products: Product[] = [
  // ── CORPORATE STATIONERY ──────────────────────────────────────────────────
  // Business Cards
  {
    id: "bc-standard", name: "Standard Business Card", tagline: "Sharp, professional, memorable.",
    desc: "350gsm premium matte or gloss coated card stock. Full-colour double-sided printing. Delivered in boxes of 100, 250, or 500.",
    specs: ["350gsm coated stock", "Standard 85×54mm", "Single or double-sided", "Matte / Gloss laminate"],
    subcategory: "Business Cards", category: "stationery", featured: true,
  },
  {
    id: "bc-spotUV", name: "Spot-UV Business Card", tagline: "Raise your card. Raise your brand.",
    desc: "Premium card stock with selectively applied UV gloss coating — a tactile, eye-catching finish that sets you apart in any handshake. Ideal for executives and professionals who mean business.",
    specs: ["400gsm soft-touch base", "Raised spot UV coating", "Double-sided print", "In-house CNC die-cutting available"],
    subcategory: "Business Cards", category: "stationery", badge: "Premium",
  },
  {
    id: "bc-foil", name: "Foil-Stamped Business Card", tagline: "Gold, silver, or rose gold brilliance.",
    desc: "Metallic foil stamping applied directly to your logo or key text. A first-class finish that communicates confidence, prestige, and attention to detail.",
    specs: ["Gold / Silver / Rose Gold foil", "400gsm luxury board", "Die-cutting available", "Minimum 100 cards"],
    subcategory: "Business Cards", category: "stationery", badge: "Luxury",
  },
  {
    id: "bc-shaped", name: "Custom-Shape Business Card", tagline: "When your brand doesn't fit in a rectangle.",
    desc: "Your card, your shape. Our in-house Laser/CNC cutting system accurately cuts any outline — rounded corners, notches, circles, or completely custom silhouettes.",
    specs: ["Any shape or cutout", "In-house CNC precision cutting", "350gsm+ stock", "Full-colour both sides"],
    subcategory: "Business Cards", category: "stationery",
  },
  // Letterheads & Compliment Slips
  {
    id: "lh-standard", name: "Branded Letterhead", tagline: "Authority in every correspondence.",
    desc: "A4 letterhead printed on 100gsm premium bond paper with your logo, brand colours, and contact details. Supplied flat or as pads. Minimum 250 sheets.",
    specs: ["100gsm premium bond", "A4 single-sided", "Pantone colour matching available", "Minimum 250 sheets"],
    subcategory: "Letterheads & Compliment Slips", category: "stationery", featured: true,
  },
  {
    id: "cs-slip", name: "Compliment Slip", tagline: "Small card. Big impression.",
    desc: "DL-size (⅓ A4) branded compliment slips — perfect for accompanying deliveries, invoices, or handwritten notes. Printed on matching letterhead stock for a cohesive identity.",
    specs: ["99×210mm (DL format)", "100gsm bond paper", "Matches letterhead design", "Supplied as pads or flat"],
    subcategory: "Letterheads & Compliment Slips", category: "stationery",
  },
  // Envelopes & Folders
  {
    id: "env-dl", name: "Branded DL Envelope", tagline: "Seal it with your identity.",
    desc: "Fully branded DL envelopes printed with your return address, logo, and brand colours. Gummed or self-seal. Ideal for corporate mailings and client communications.",
    specs: ["DL (110×220mm)", "Gummed or self-seal", "Full-colour outer print", "Minimum 250 envelopes"],
    subcategory: "Envelopes & Folders", category: "stationery",
  },
  {
    id: "pf-a4", name: "A4 Presentation Folder", tagline: "Present with precision and polish.",
    desc: "Sturdy A4 card folder with twin interior pockets and a business card slot. Laminated cover. Ideal for proposals, tender documents, and client packs.",
    specs: ["A4 with twin inner pockets", "350gsm gloss/matte laminate", "Business card slot", "Custom print both sides"],
    subcategory: "Envelopes & Folders", category: "stationery", featured: true,
  },
  // Notepads & Memo Pads
  {
    id: "np-a5", name: "A5 Branded Notepad", tagline: "Keep your brand on every desk.",
    desc: "50-sheet A5 notepads with branded header on every page. Glued top-binding on a solid backing board. A practical, visible promotional item for offices, hotels, and events.",
    specs: ["A5 (148×210mm)", "50 sheets per pad", "Branded header every page", "Board backing"],
    subcategory: "Notepads & Memo Pads", category: "stationery", featured: true,
  },
  {
    id: "np-sticky", name: "Branded Sticky Notes", tagline: "Reminders with your logo attached.",
    desc: "Custom-printed sticky note pads (75×75mm). Individually printed sheets with your logo, slogan, or full colour design. Supplied in blocks of 50 or 100 sheets.",
    specs: ["75×75mm standard size", "50 or 100 sheets per block", "Full-colour print", "Custom shape available"],
    subcategory: "Notepads & Memo Pads", category: "stationery",
  },

  // ── MARKETING COLLATERAL ──────────────────────────────────────────────────
  // Brochures & Flyers
  {
    id: "fl-a5", name: "A5 Flyer", tagline: "Your message. Millions of hands.",
    desc: "The most cost-effective tool for events, promotions, and campaigns. Printed on 150gsm or 170gsm coated stock, double-sided full colour. Minimum 500.",
    specs: ["A5 (148×210mm)", "150gsm or 170gsm coated", "Double-sided full colour", "Min. 500 / volume pricing"],
    subcategory: "Brochures & Flyers", category: "marketing", featured: true,
  },
  {
    id: "br-bifold", name: "Bi-Fold Brochure", tagline: "Four panels of pure persuasion.",
    desc: "A4 folded to DL or A5 — a versatile format for company profiles, service menus, and product overviews. Designed and printed entirely in-house for fast turnaround.",
    specs: ["A4 folded to A5 or DL", "170gsm gloss/silk coated", "Full-colour inside & out", "In-house design available"],
    subcategory: "Brochures & Flyers", category: "marketing",
  },
  {
    id: "br-trifold", name: "Tri-Fold Brochure", tagline: "Six panels. One compelling story.",
    desc: "The classic format for product catalogues, hotel directories, and company introductions. Scored and folded with machine precision for a crisp, professional result.",
    specs: ["A4 folded to DL (6 panels)", "170gsm silk or gloss", "Machine-scored fold lines", "Full-colour print"],
    subcategory: "Brochures & Flyers", category: "marketing",
  },
  // Booklets & Catalogues
  {
    id: "bk-saddle", name: "Saddle-Stitched Booklet", tagline: "From 8 to 48 pages — bound tight.",
    desc: "Cost-efficient booklet production for programmes, price lists, product catalogues, school journals, and annual reports. Staple-bound at the spine with a heavier cover stock.",
    specs: ["A4 or A5 format", "8–48 pages + cover", "170gsm cover / 90gsm text", "High-volume pricing available"],
    subcategory: "Booklets & Catalogues", category: "marketing", featured: true,
  },
  {
    id: "bk-perfect", name: "Perfect-Bound Catalogue", tagline: "The prestige of a published book.",
    desc: "Glue-bound softcover catalogue for companies that need to communicate quality at depth. Ideal for product catalogues, annual reports, and brand bibles. 40+ pages.",
    specs: ["A4 or custom size", "40–300+ pages", "Gloss or matte laminated cover", "Minimum 50 copies"],
    subcategory: "Booklets & Catalogues", category: "marketing", badge: "Premium",
  },
  // Presentation Folders
  {
    id: "pf-corporate", name: "Corporate Proposal Kit", tagline: "Win tenders. Close deals.",
    desc: "A complete proposal package: A4 presentation folder, branded letterhead, and tabbed inserts. Designed, printed, and assembled by our team — ready to present.",
    specs: ["A4 presentation folder", "Letterhead pack included", "Tab-dividers optional", "Box-packaged for delivery"],
    subcategory: "Presentation Folders", category: "marketing", badge: "Bundle",
  },
  // Posters & Calendars
  {
    id: "po-a1", name: "A1 / A2 Poster", tagline: "Scale up your visibility.",
    desc: "Vibrant full-colour posters printed on 200gsm coated stock. Ideal for event promotion, in-store displays, and notice boards. Same-day production available for urgent orders.",
    specs: ["A1 (841×594mm) or A2", "200gsm coated / premium paper", "Double-sided available", "Same-day on select sizes"],
    subcategory: "Posters & Calendars", category: "marketing", featured: true,
  },
  {
    id: "cal-wall", name: "Branded Wall Calendar", tagline: "12 months of brand visibility.",
    desc: "A3 or A4 wall calendars with a full branded header and custom photos, themes, or product imagery per month. Spiral or wiro-bound. An annual gift your clients will keep all year.",
    specs: ["A3 or A4 format", "13 sheets (cover + 12 months)", "Wiro or spiral bound", "Custom imagery per month"],
    subcategory: "Posters & Calendars", category: "marketing",
  },

  // ── LARGE FORMAT BRANDING ─────────────────────────────────────────────────
  // Pull-Up & Display Banners
  {
    id: "lf-pullup", name: "Pull-Up Roll Banner", tagline: "Set up in 30 seconds. Stand out for hours.",
    desc: "Premium 85cm or 100cm wide retractable roller banner. Printed on high-opacity satin banner media. Includes aluminium cassette, padded carry bag, and support foot.",
    specs: ["85cm or 100cm width", "2m or 2.4m height options", "Premium satin banner media", "Aluminium cassette + bag"],
    subcategory: "Pull-Up & Display Banners", category: "largeformat", featured: true,
  },
  {
    id: "lf-xbanner", name: "X-Frame Banner Stand", tagline: "Lightweight. Striking. Portable.",
    desc: "Collapsible X-frame banner stand ideal for indoor promotions, exhibitions, and pop-up activations. Printed graphic included — lightweight enough for any sales representative to carry.",
    specs: ["60×160cm standard size", "Lightweight aluminium frame", "Full-colour graphic included", "Easy graphic swap"],
    subcategory: "Pull-Up & Display Banners", category: "largeformat",
  },
  {
    id: "lf-teardrop", name: "Teardrop & Feather Flag", tagline: "Movement that draws the eye.",
    desc: "Polyester flags that catch wind and create dynamic movement. Ideal for forecourts, showrooms, and outdoor events. Printed in full sublimation colour.",
    specs: ["Teardrop or feather profile", "Polyester dye sublimation", "Ground spike or cross base", "Outdoor weather-resistant"],
    subcategory: "Pull-Up & Display Banners", category: "largeformat",
  },
  // Outdoor & Indoor Signage
  {
    id: "lf-sign-acm", name: "Aluminium Composite Signage", tagline: "Built to last. Impossible to ignore.",
    desc: "Rigid aluminium composite (ACM/dibond) signs for shop fronts, offices, and outdoor applications. UV-printed, precision-cut with our in-house CNC router. Suitable for installation indoors and out.",
    specs: ["3mm or 5mm aluminium composite", "UV-curable print (fade-resistant)", "In-house CNC precision cut", "Drilling/mounting holes included"],
    subcategory: "Outdoor & Indoor Signage", category: "largeformat", featured: true,
  },
  {
    id: "lf-sign-foam", name: "PVC Foam Board Signage", tagline: "Indoor signage, professionally done.",
    desc: "Lightweight 5mm PVC foam board signage for reception areas, display stands, and internal wayfinding. Crisp full-colour UV print, clean CNC-cut edges.",
    specs: ["5mm or 10mm PVC foam", "UV direct print", "Laser/CNC cut finish", "Wall-mount ready"],
    subcategory: "Outdoor & Indoor Signage", category: "largeformat",
  },
  {
    id: "lf-fascia", name: "Shop Fascia & Hoarding", tagline: "Own the street before they enter.",
    desc: "Large-scale shop front fascia boards and building hoardings. From design to installation — our team manages the full process. Available in ACM, flex face, and illuminated options.",
    specs: ["Custom size to specification", "ACM, flex face, or backlit", "Design + production + install", "Structural consultation available"],
    subcategory: "Outdoor & Indoor Signage", category: "largeformat", badge: "Turnkey",
  },
  // Vehicle Graphics & Wraps
  {
    id: "lf-vehicle-full", name: "Full Vehicle Wrap", tagline: "Turn every journey into a brand activation.",
    desc: "360° coverage of your fleet vehicle in premium cast vinyl. Our designers create a wrap that conforms to every curve of the bodywork. Applied by our in-house vehicle graphics specialists.",
    specs: ["Premium cast vinyl (7-year rated)", "360° full coverage", "Professional in-house application", "Design service included"],
    subcategory: "Vehicle Graphics & Wraps", category: "largeformat", featured: true, badge: "Premium",
  },
  {
    id: "lf-vehicle-partial", name: "Partial Vehicle Branding", tagline: "Maximise impact. Minimise spend.",
    desc: "Rear-glass graphics, door panels, bonnet decals, and fleet numbering. The most cost-efficient way to brand a fleet. Removable without residue.",
    specs: ["Partial wrap or spot graphics", "Removable premium vinyl", "Rear, door or bonnet panels", "Fleet discounts available"],
    subcategory: "Vehicle Graphics & Wraps", category: "largeformat",
  },
  // Exhibition Displays & Backdrops
  {
    id: "lf-backdrop", name: "Fabric Photo Backdrop", tagline: "The backdrop that makes every photo count.",
    desc: "Step-and-repeat and full-colour fabric backdrops for events, press conferences, award ceremonies, and product launches. Printed on wrinkle-resistant stretch fabric, tension-frame included.",
    specs: ["2m×2m to 5m×3m available", "Wrinkle-resistant stretch fabric", "Aluminium tension frame", "Machine-washable print"],
    subcategory: "Exhibition Displays & Backdrops", category: "largeformat", featured: true,
  },
  {
    id: "lf-popup", name: "Pop-Up Exhibition Display", tagline: "Your exhibition stand. Packed in a bag.",
    desc: "Magnetic spine pop-up display frame with fabric or printed graphic panels. Complete stand assembled in under 5 minutes. Includes wheeled carry case.",
    specs: ["2m or 3m wide formats", "Magnetic snap-together frame", "Fabric or printed graphic", "Wheeled carry case included"],
    subcategory: "Exhibition Displays & Backdrops", category: "largeformat",
  },

  // ── CUSTOM APPAREL & TEXTILES ─────────────────────────────────────────────
  // Corporate & Office Uniforms
  {
    id: "ap-corpshirt", name: "Corporate Dress Shirt", tagline: "Tailored. Branded. Consistent.",
    desc: "Long or short sleeve corporate shirts in your organisation's brand colours, with embroidered logo at chest. Produced entirely in our Kigali sewing factory. Men's and women's cuts. Minimum 10 pieces.",
    specs: ["100% cotton or poly-cotton blend", "Embroidered logo (in-house)", "Men's & women's cuts", "XS–4XL sizes"],
    subcategory: "Corporate & Office Uniforms", category: "apparel", featured: true,
  },
  {
    id: "ap-uniform-set", name: "Full Corporate Uniform Set", tagline: "Head-to-toe brand consistency.",
    desc: "Complete uniform solution: trousers or skirt, shirt, and optional blazer or vest. Pattern-cut and sewn to your specifications in our factory. Ideal for banks, hotels, offices, and NGOs.",
    specs: ["Pattern-cut & manufactured in-house", "Optional blazer/vest included", "Branded buttons or tags", "Custom sizing available"],
    subcategory: "Corporate & Office Uniforms", category: "apparel",
  },
  {
    id: "ap-polo", name: "Branded Polo Shirt", tagline: "Smart casual. Fully branded.",
    desc: "Premium piqué cotton polo shirts with embroidered or printed logo. Available as standard, dry-fit, or performance fabric. The most versatile uniform item for any industry.",
    specs: ["Piqué cotton or dry-fit fabric", "Embroidery or screen print", "Full colour range", "Min. 10 pieces per colour"],
    subcategory: "Corporate & Office Uniforms", category: "apparel",
  },
  // Medical & Hospital Scrubs
  {
    id: "ap-scrubs", name: "Medical Scrubs Set", tagline: "Designed for the frontline. Sewn with care.",
    desc: "V-neck scrub top and drawstring trousers, manufactured in our sewing factory from durable, easy-care poly-cotton blend. Supplied with embroidered department name, logo, or staff initials.",
    specs: ["Poly-cotton easy-care fabric", "V-neck top + drawstring trousers", "Embroidered name/department", "XS–5XL inclusive sizing"],
    subcategory: "Medical & Hospital Scrubs", category: "apparel", featured: true, badge: "Healthcare",
  },
  {
    id: "ap-lab-coat", name: "Branded Lab Coat", tagline: "Professional. Hygienic. On-brand.",
    desc: "White or coloured lab coats for hospitals, clinics, laboratories, and pharmaceutical staff. Knee-length with button closure, two front pockets, and embroidered logo on chest.",
    specs: ["65/35 poly-cotton blend", "Knee-length with button front", "Two front pockets", "Logo embroidery included"],
    subcategory: "Medical & Hospital Scrubs", category: "apparel",
  },
  // Workwear & Safety Gear
  {
    id: "ap-overall", name: "Heavy-Duty Coverall / Overall", tagline: "Built tough. Branded smart.",
    desc: "Full-body industrial overalls in durable poly-cotton blend. Reflective safety strips, reinforced knee panels, and multiple utility pockets. Logo printed or embroidered.",
    specs: ["Poly-cotton heavy-duty fabric", "Reflective safety strips available", "Reinforced knees & elbows", "Custom logo: print or embroidery"],
    subcategory: "Workwear & Safety Gear", category: "apparel", featured: true,
  },
  {
    id: "ap-hiviz", name: "Hi-Vis Safety Vest", tagline: "Be seen. Stay safe.",
    desc: "Day/night high-visibility vest with reflective tape to EN ISO 20471 standards. Printed with company name, department, or role. Ideal for construction, logistics, and field teams.",
    specs: ["Day/night hi-visibility yellow/orange", "EN ISO 20471 class 2 spec", "Printed company name/logo", "One size fits most / adjustable"],
    subcategory: "Workwear & Safety Gear", category: "apparel",
  },
  // Event T-Shirts & Polo Shirts
  {
    id: "ap-tshirt", name: "Event T-Shirt", tagline: "Your brand, worn by thousands.",
    desc: "180gsm or 190gsm 100% cotton crew-neck t-shirts. Screen-printed or DTG-printed front and back design. Minimum 50 pieces. Ideal for marathons, conferences, school events, and brand activations.",
    specs: ["180–190gsm 100% cotton", "Screen print or DTG print", "Single or double-sided", "Min. 50 / bulk pricing"],
    subcategory: "Event T-Shirts & Polo Shirts", category: "apparel", featured: true,
  },
  {
    id: "ap-tshirt-sublimation", name: "Sublimation All-Over Print Tee", tagline: "Full fabric. Full colour. Full impact.",
    desc: "Dye-sublimation printed polyester t-shirt — colour saturates the entire fabric for a striking, photographic-quality design. Ideal for sports teams, activations, and performance wear.",
    specs: ["100% polyester base", "Full-surface sublimation print", "Vivid, fade-resistant colour", "Custom sizing & patterns"],
    subcategory: "Event T-Shirts & Polo Shirts", category: "apparel",
  },
  // Caps & Headwear
  {
    id: "ap-cap", name: "6-Panel Structured Cap", tagline: "Worn every day. Seen everywhere.",
    desc: "Classic 6-panel baseball cap with embroidered logo on the front panel. Adjustable strap back. Available in 20+ colour options. Minimum 25 caps.",
    specs: ["6-panel structured crown", "Embroidered front logo", "Adjustable strap back", "20+ colour options, min. 25"],
    subcategory: "Caps & Headwear", category: "apparel", featured: true,
  },
  {
    id: "ap-bucket", name: "Bucket Hat", tagline: "Outdoor style. On-brand anywhere.",
    desc: "Unisex cotton bucket hat with sewn-in brim and adjustable chin cord. Embroidered or printed logo. Popular for outdoor events, NGO fieldwork, school promotions, and tourist merchandise.",
    specs: ["100% cotton twill", "Embroidered or printed logo", "Adjustable chin cord", "One size / custom sizing"],
    subcategory: "Caps & Headwear", category: "apparel",
  },

  // ── CORPORATE GIFTS & RECOGNITION ────────────────────────────────────────
  // Awards & Trophies
  {
    id: "gi-crystal", name: "Crystal Glass Award", tagline: "Recognition that reflects brilliance.",
    desc: "Optically clear crystal glass award block with laser-engraved personalised text, logo, and decorative motif. Presented on a gloss base. Each piece is individually quality-checked and gift-boxed.",
    specs: ["Optical-quality crystal glass", "Laser-engraved personalisation", "Gloss or chrome base", "Individual gift-boxing"],
    subcategory: "Awards & Trophies", category: "gifts", featured: true, badge: "Premium",
  },
  {
    id: "gi-acrylic", name: "Acrylic Plaque Award", tagline: "Modern recognition. Lasting memory.",
    desc: "Edge-lit or standard acrylic award plaques. CNC-cut to shape with laser-engraved logo, name, and citation. Available in clear, frosted, gold-tinted, and jet black acrylic.",
    specs: ["5mm or 8mm acrylic sheet", "Laser engraved text + logo", "CNC-cut custom shape", "Frosted, clear, black, or gold"],
    subcategory: "Awards & Trophies", category: "gifts",
  },
  {
    id: "gi-trophy", name: "Classic Trophy & Medals", tagline: "For those who deserve to be remembered.",
    desc: "Resin, zinc alloy, or custom-cast trophies for sports, academic, and corporate events. Custom medals engraved or printed with event branding. Available in gold, silver, and bronze finish.",
    specs: ["Resin or zinc alloy cast", "Gold / silver / bronze finish", "Custom ribbon for medals", "Branded base plaque included"],
    subcategory: "Awards & Trophies", category: "gifts",
  },
  // Branded Pens & Writing Sets
  {
    id: "gi-pen-exec", name: "Executive Pen Set", tagline: "Sign deals. Leave an impression.",
    desc: "Ballpoint or rollerball metal pen with laser-engraved brand name or logo. Supplied in a premium magnetic-close gift box. A sophisticated corporate gift for clients, partners, and senior staff.",
    specs: ["Metal barrel construction", "Laser engraving (name or logo)", "Magnetic gift box", "Ballpoint or rollerball refill"],
    subcategory: "Branded Pens & Writing Sets", category: "gifts", featured: true,
  },
  {
    id: "gi-pen-bulk", name: "Promotional Pen (Bulk)", tagline: "Your brand in every hand.",
    desc: "High-quality plastic ballpoint pens with full-colour screen-printed logo and contact details. Cost-effective for conferences, exhibitions, and promotional giveaways. Minimum 100 pens.",
    specs: ["Smooth-writing ballpoint", "Screen-printed logo + URL", "Wide colour barrel range", "Min. 100 / bulk price tiers"],
    subcategory: "Branded Pens & Writing Sets", category: "gifts",
  },
  // Premium Notebooks
  {
    id: "gi-notebook-a5", name: "Premium A5 Hardcover Notebook", tagline: "Where your brand meets daily life.",
    desc: "Lined A5 hardcover notebook with full-colour PU leather or linen-textured cover, embossed or debossed logo, and 192 ruled pages on 90gsm cream paper. Elastic band and ribbon bookmark included.",
    specs: ["A5 (148×210mm) hardcover", "192 pages, 90gsm cream paper", "PU leather or linen cover", "Elastic closure + ribbon bookmark"],
    subcategory: "Premium Notebooks", category: "gifts", featured: true, badge: "Premium",
  },
  {
    id: "gi-notebook-softcover", name: "Branded Softcover Notebook", tagline: "Sleek. Lightweight. Professional.",
    desc: "A5 softcover Kraft or full-colour printed notebook with 80gsm lined or dotted pages. A practical and stylish gift for workshops, conferences, and staff welcome packs.",
    specs: ["A5 softcover format", "80gsm lined or dotted pages", "Custom printed cover", "80 or 120 pages"],
    subcategory: "Premium Notebooks", category: "gifts",
  },
  // Branded Tech Accessories
  {
    id: "gi-usb", name: "Custom Branded USB Drive", tagline: "Give them something useful.",
    desc: "USB 2.0 or 3.0 flash drives in credit-card, swivel, or wooden form factors, laser engraved with your logo. Pre-loaded with your digital catalogue, presentation, or media files on request.",
    specs: ["4GB / 8GB / 16GB / 32GB", "USB 2.0 or 3.0", "Laser engraved logo", "Pre-loading service available"],
    subcategory: "Branded Tech Accessories", category: "gifts", featured: true,
  },
  {
    id: "gi-powerbank", name: "Branded Power Bank", tagline: "Keep them charged. Keep your brand visible.",
    desc: "5,000mAh or 10,000mAh slim power bank with printed or debossed logo. Dual USB output. Packaged in a branded gift box. A premium gift that's used every day.",
    specs: ["5,000 or 10,000mAh capacity", "Dual USB + USB-C output", "Printed or debossed logo", "Branded gift box packaging"],
    subcategory: "Branded Tech Accessories", category: "gifts",
  },
  // Executive Gift Sets
  {
    id: "gi-gift-set", name: "Executive Corporate Gift Set", tagline: "Curated. Branded. Delivered.",
    desc: "A fully curated corporate gift set combining pen, notebook, USB drive, and a branded item of your choice — packaged in a rigid gift box with tissue lining and a custom message card. Perfect for client appreciation, onboarding kits, and VIP events.",
    specs: ["Pen + notebook + USB standard set", "Rigid gift box with tissue", "Custom message card included", "Fully branded by our team"],
    subcategory: "Executive Gift Sets", category: "gifts", featured: true, badge: "Bundle",
  },
  {
    id: "gi-welcome-kit", name: "Employee Onboarding Kit", tagline: "Start every career on the right note.",
    desc: "Welcome packs for new employees: branded notebook, pen, lanyard, branded tote bag, and team welcome letter. Everything produced in-house and packaged for a first-class first impression.",
    specs: ["Notebook + pen + lanyard + tote", "Full in-house production", "Custom welcome letter/card", "Bulk pricing from 10 kits"],
    subcategory: "Executive Gift Sets", category: "gifts",
  },
];

// ── Product Card ───────────────────────────────────────────────────────────
function ProductCard({ product, catColor }: { product: Product; catColor: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 12, overflow: "hidden",
        border: `1.5px solid ${hovered ? catColor : "#E8ECF2"}`,
        transition: "all .3s",
        transform: hovered ? "translateY(-5px)" : "none",
        boxShadow: hovered ? `0 20px 48px ${catColor}22` : "0 2px 10px rgba(0,0,0,.05)",
        display: "flex", flexDirection: "column"
      }}
    >
      {/* Top colour band */}
      <div style={{
        height: 6,
        background: `linear-gradient(90deg, ${catColor}, ${catColor}88)`
      }} />

      {/* Body */}
      <div style={{ padding: "24px 22px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Badges row */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em",
            padding: "3px 10px", borderRadius: 2, background: `${catColor}14`, color: catColor, fontWeight: 700
          }}>{product.subcategory}</span>
          {product.badge && (
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em",
              padding: "3px 10px", borderRadius: 2, fontWeight: 700,
              background: product.badge === "Premium" || product.badge === "Luxury" ? "#F5C518" : product.badge === "Healthcare" ? "#059669" : product.badge === "Bundle" ? "#2645C8" : catColor,
              color: product.badge === "Premium" || product.badge === "Luxury" ? "#0D1117" : "#fff"
            }}>{product.badge}</span>
          )}
          {product.featured && !product.badge && (
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em",
              padding: "3px 10px", borderRadius: 2, background: "rgba(0,198,255,.1)", color: "#007FAA", border: "1px solid rgba(0,198,255,.25)"
            }}>Popular</span>
          )}
        </div>

        <h4 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "#0D1117", marginBottom: 4, lineHeight: 1.2 }}>{product.name}</h4>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 13, color: catColor, marginBottom: 10, fontStyle: "italic" }}>{product.tagline}</p>
        <p style={{ fontSize: 13, color: "#5A6478", lineHeight: 1.65, marginBottom: 16, flex: 1 }}>{product.desc}</p>

        {/* Specs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 18 }}>
          {product.specs.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: catColor, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#374151" }}>{s}</span>
            </div>
          ))}
        </div>

        <a
          href={`https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!%20I%27m%20interested%20in%20${encodeURIComponent(product.name)}.%20Please%20send%20me%20pricing%20and%20availability.`}
          target="_blank" rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "11px 16px", background: "#25D366", color: "#fff",
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
  category: Category; products: Product[]; activeSubcat: string | null; onSubcat: (s: string | null) => void;
}) {
  const displayed = activeSubcat
    ? catProducts.filter(p => p.subcategory === activeSubcat)
    : catProducts;

  return (
    <div style={{ marginBottom: 96 }} id={`cat-${category.id}`}>
      {/* Category header */}
      <div style={{
        background: `linear-gradient(135deg, ${category.color}0a, ${category.color}04)`,
        borderRadius: 16, border: `1px solid ${category.color}20`,
        padding: "36px 40px", marginBottom: 32
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14, flexShrink: 0,
            background: `${category.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
            color: category.color
          }}>
            {category.icon}
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", color: category.color, marginBottom: 6 }}>
              {catProducts.length} product{catProducts.length !== 1 ? "s" : ""}
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px,3vw,30px)", color: "#0D1117", marginBottom: 6, lineHeight: 1.15 }}>{category.label}</h2>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: category.color, marginBottom: 12, fontStyle: "italic" }}>{category.tagline}</p>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, maxWidth: 620, marginBottom: 16 }}>{category.desc}</p>
            {category.capability && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5A6478", fontFamily: "'Space Mono', monospace" }}>
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: category.color }} />
                <span style={{ textTransform: "uppercase", letterSpacing: ".06em" }}><strong style={{ color: category.color }}>Capabilities:</strong> {category.capability}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subcategory filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${category.color}18` }}>
          <button onClick={() => onSubcat(null)}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em",
              padding: "7px 16px", borderRadius: 100, border: `1.5px solid ${!activeSubcat ? category.color : "#E8ECF2"}`,
              background: !activeSubcat ? category.color : "transparent",
              color: !activeSubcat ? "#fff" : "#5A6478", cursor: "pointer", transition: "all .2s"
            }}>All</button>
          {category.subcategories.map(sub => {
            const count = catProducts.filter(p => p.subcategory === sub).length;
            if (!count) return null;
            const active = activeSubcat === sub;
            return (
              <button key={sub} onClick={() => onSubcat(active ? null : sub)}
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em",
                  padding: "7px 16px", borderRadius: 100, border: `1.5px solid ${active ? category.color : "#E8ECF2"}`,
                  background: active ? category.color : "transparent",
                  color: active ? "#fff" : "#5A6478", cursor: "pointer", transition: "all .2s"
                }}
              >{sub} ({count})</button>
            );
          })}
        </div>
      </div>

      {/* Products grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 22 }}>
        {displayed.map(p => <ProductCard key={p.id} product={p} catColor={category.color} />)}
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

  const filteredBySearch = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const visibleCategories = activeCategory
    ? categories.filter(c => c.id === activeCategory)
    : categories;

  return (
    <div style={{ background: "#F7F8FC", minHeight: "100vh" }}>
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{ background: "var(--ink)", paddingTop: 120, paddingBottom: 96, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(38,69,200,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(38,69,200,.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div style={{ position: "absolute", right: "-4%", top: 0, bottom: 0, width: "42%", background: "linear-gradient(135deg, #1B2B8A, #2645C8)", clipPath: "polygon(18% 0, 100% 0, 100% 100%, 0% 100%)", opacity: .55 }} />
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Space Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", padding: "6px 16px", borderRadius: 100, border: "1px solid rgba(0,198,255,.3)", background: "rgba(0,198,255,.08)", color: "#00C6FF", marginBottom: 24 }}>
            Products & Services — Duplicator Ltd
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(38px,6vw,72px)", color: "#fff", lineHeight: .96, marginBottom: 24 }}>
            More Than a Printer.<br /><span style={{ color: "#00C6FF" }}>We Are Manufacturers.</span>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,.65)", maxWidth: 580, marginBottom: 16, lineHeight: 1.75 }}>
            For over 15 years, Duplicator Ltd has delivered end-to-end branding, print, and manufacturing solutions for Rwanda's leading organisations. From graphic design to final delivery — everything under one roof.
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.4)", maxWidth: 520, marginBottom: 44, lineHeight: 1.65, fontFamily: "'Space Mono', monospace", letterSpacing: ".02em" }}>
            In-house capabilities: Graphic Design · Offset & Digital Print · Laser/CNC Cutting · Sewing Factory · Large Format · Distribution
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!%20Please%20send%20me%20your%20full%20product%20and%20services%20brochure." target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 30px", background: "#25D366", color: "#fff", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", transition: "background .2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
              onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
            ><WaIcon size={16} /> Request a Quotation</a>
            <a href="/duplicator-catalogue.pdf" download="Duplicator-Ltd-Catalogue.pdf"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 30px", background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,.35)", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: "none", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.08)"; e.currentTarget.style.borderColor = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,.35)"; }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Catalogue
            </a>
          </div>
        </div>
      </div>

      {/* ── Trust / Differentiator Bar ────────────────────────────────── */}
      <div style={{ background: "#0D1117", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", display: "flex", flexWrap: "wrap" }}>
          {[
            { icon: "✦", stat: "15+", label: "Years of Experience" },
            { icon: "✦", stat: "In-House", label: "Laser & CNC Cutting" },
            { icon: "✦", stat: "Own", label: "Sewing Factory, Kigali" },
            { icon: "✦", stat: "End-to-End", label: "Design to Delivery" },
            { icon: "✦", stat: "500+", label: "Active Client Organisations" },
          ].map((item, i) => (
            <div key={i} style={{ flex: "1 1 180px", padding: "22px 20px", borderRight: i < 4 ? "1px solid rgba(255,255,255,.05)" : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "#00C6FF" }}>{item.stat}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.4)", textAlign: "center" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Category Nav Bar ─────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8ECF2", position: "sticky", top: 70, zIndex: 100 }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", display: "flex", overflowX: "auto", gap: 0 }}>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat.id).length;
            const active = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(active ? null : cat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "16px 22px",
                  background: "transparent", border: "none",
                  borderBottom: active ? `3px solid ${cat.color}` : "3px solid transparent",
                  color: active ? cat.color : "#374151",
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", transition: "all .2s", whiteSpace: "nowrap", flexShrink: 0
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = cat.color; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#374151"; }}
              >
                {cat.label}
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10,
                  background: active ? cat.color : "#F0F2F8",
                  color: active ? "#fff" : "#5A6478",
                  padding: "2px 8px", borderRadius: 100, transition: "all .2s"
                }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "60px 24px" }}>

        {/* Search bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 56, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" width="16" height="16" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products, finishes, or item types..."
              style={{
                width: "100%", padding: "13px 16px 13px 42px",
                background: "#fff", border: "1.5px solid #E8ECF2", borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#0D1117", outline: "none",
                transition: "border .2s", boxSizing: "border-box"
              }}
              onFocus={e => (e.target.style.borderColor = "#2645C8")}
              onBlur={e => (e.target.style.borderColor = "#E8ECF2")}
            />
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: ".1em" }}>
            {filteredBySearch ? `${filteredBySearch.length} results` : `${products.length} products`}
          </div>
          {(activeCategory || searchQuery) && (
            <button onClick={() => { setActiveCategory(null); setSearchQuery(""); }}
              style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#2645C8", background: "rgba(38,69,200,.07)", border: "1px solid rgba(38,69,200,.18)", padding: "9px 18px", borderRadius: 6, cursor: "pointer" }}>
              Clear ×
            </button>
          )}
        </div>

        {/* Search results */}
        {filteredBySearch ? (
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "#0D1117", marginBottom: 28 }}>
              Search results for "<span style={{ color: "#2645C8" }}>{searchQuery}</span>"
            </div>
            {filteredBySearch.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 24px" }}>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#0D1117", marginBottom: 10 }}>No products found</div>
                <p style={{ color: "#5A6478", fontSize: 15, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>Try different keywords or browse categories above. If you need something specific, ask us directly on WhatsApp.</p>
                <a href="https://wa.me/250788355226?text=Hi!%20I%27m%20looking%20for%20a%20specific%20product%20and%20couldn%27t%20find%20it." target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#25D366", color: "#fff", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, textDecoration: "none" }}>
                  <WaIcon size={16} /> Ask on WhatsApp
                </a>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 22 }}>
                {filteredBySearch.map(p => {
                  const cat = categories.find(c => c.id === p.category);
                  return <ProductCard key={p.id} product={p} catColor={cat?.color || "#2645C8"} />;
                })}
              </div>
            )}
          </div>
        ) : (
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

        {/* ── End CTA ──────────────────────────────────────────────── */}
        <div style={{
          marginTop: 24, background: "linear-gradient(135deg, #0D1117 0%, #1B2B8A 60%, #2645C8 100%)",
          borderRadius: 18, padding: "clamp(36px,5vw,60px) clamp(28px,5vw,60px)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 36
        }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#00C6FF", textTransform: "uppercase", letterSpacing: ".16em", marginBottom: 12 }}>Ready to get started?</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px,4vw,40px)", color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>
              Tell us what you need.<br />We'll handle the rest.
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", lineHeight: 1.75 }}>
              From a single business card to a 500-unit uniform order — Duplicator Ltd manages your entire project in-house. Free consultation, fast turnaround, and competitive pricing guaranteed.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            <a href="https://wa.me/250788355226?text=Hi%20Duplicator%20Ltd!%20I'd%20like%20to%20discuss%20a%20project." target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "17px 34px", background: "#25D366", color: "#fff", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none", whiteSpace: "nowrap", transition: "background .2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#128C7E")}
              onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
            ><WaIcon size={18} /> Get a Free Quote</a>
            <a href="/#quote"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "15px 34px", background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.8)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, textDecoration: "none", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "rgba(255,255,255,.8)"; }}
            >Use the Quote Form →</a>
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
