# Duplicator Ltd Website

A fully dark-themed marketing website for Duplicator Ltd, a Kigali-based printing, branding, and sewing company. Features a floating pill navbar, glassmorphism cards, cinematic dark navy background with blurred blue+white radial gradient orbs, and scroll-reveal animations.

## Run & Operate

- `pnpm --filter @workspace/duplicator-site run dev` — run the website (dev mode)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (duplicator-site artifact)
- API: Express 5 (api-server artifact)
- DB: PostgreSQL + Drizzle ORM
- Styling: inline React styles + CSS variables in index.css
- Font: Inter (via Google Fonts)

## Where things live

- `artifacts/duplicator-site/src/pages/HomePage.tsx` — main landing page (hero, services, products preview, stats, industries, contact)
- `artifacts/duplicator-site/src/pages/ProductsPage.tsx` — full product catalogue with category/subcategory filtering
- `artifacts/duplicator-site/src/components/Header.tsx` — floating pill navbar
- `artifacts/duplicator-site/src/components/Footer.tsx` — footer with links and contact info
- `artifacts/duplicator-site/src/components/WhatsAppFAB.tsx` — WhatsApp floating action button
- `artifacts/duplicator-site/src/index.css` — CSS variables, dark theme, glass utilities, scroll animations

## Architecture decisions

- Pure inline React styles (no Tailwind/CSS modules) — maintains visual precision for complex dark-glass effects
- CSS variables in index.css for theme tokens: `--ink` (#FFFFFF), `--grey` (rgba white 55%), `--blue` (#2645C8), `--electric` (#00C6FF), `--navy` (#04091A)
- Background: fixed `#04091A` with 4 radial gradient orbs (blue + white-blue blend) in body pseudo-element — hero/sections set `background: transparent` to show through
- Glassmorphism via `backdropFilter: blur(Xpx)` + `rgba(8-12, 16-24, 50-65, 0.5-0.75)` backgrounds + 1px `rgba(255,255,255,0.08)` borders
- RevealDiv scroll-reveal wrapper using IntersectionObserver in HomePage.tsx

## Product

- Home page: hero + services grid + how-it-works + stats bar + product previews + industries served + quote form + testimonials + contact
- Products page: full catalogue of 50+ products across 4 categories (Printing & Stationery, Large Format, Uniforms & Apparel, Corporate Gifts), with search, category nav, and subcategory filters
- WhatsApp integration: all CTAs deep-link to wa.me/250788355226 with pre-filled messages

## User preferences

- Dark "Limitless" theme: deep navy #04091A background, blurred blue+white radial gradient orbs, Inter font
- Floating pill navbar with glassmorphism blur
- Glassmorphism dark cards: backdrop-blur, rgba dark bg, white 8% borders
- Scroll-reveal animations on section entry
- Tight letter-spacing headings: -0.03em
- Content (products, services, contact info) stays unchanged

## Gotchas

- Hero and all page-level sections must have `background: transparent` (not a color) so the global radial gradient background shows through
- `var(--off-white)` is set to `transparent` in CSS to auto-darken any section that previously used a light off-white background
- ServiceCard uses `isDark` state (toggled on hover) to flip between dark-glass and blue-glass styles
- WhatsApp number: +250 788 355 226; email: duplicator10@gmail.com; location: Karuruma, Kigali

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
