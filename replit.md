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

- `artifacts/duplicator-site/src/pages/HomePage.tsx` — main landing page
- `artifacts/duplicator-site/src/pages/ProductsPage.tsx` — full catalogue with FRW pricing per card
- `artifacts/duplicator-site/src/pages/LoginPage.tsx` / `SignupPage.tsx` — branded auth screens
- `artifacts/duplicator-site/src/pages/dashboards/{Admin,Staff,Client}Dashboard.tsx` — role homes (admin shared by admin + super_admin)
- `artifacts/duplicator-site/src/context/AuthContext.tsx` — wraps generated `useGetCurrentUser`/`useLogin`/`useRegister`/`useLogout` hooks; exposes `useAuth()`
- `artifacts/duplicator-site/src/components/ProtectedRoute.tsx` — auth + role guard with role-home redirect
- `artifacts/duplicator-site/src/components/DashboardLayout.tsx` — sticky sidebar (role-aware nav) + topbar (theme toggle, collapse, sign out)
- `artifacts/duplicator-site/src/components/AuthShell.tsx`, `DashboardKpi.tsx` — shared building blocks
- `artifacts/duplicator-site/src/lib/format.ts` — `formatFRW()`
- `artifacts/api-server/src/routes/auth.ts` — `/api/auth/{register,login,logout,me}`; atomic SQL CASE for failed-login lockout
- `artifacts/api-server/src/lib/{auth,password}.ts` — scrypt hashing + 7-day session cookies (`duplicator_session`)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — `requireAuth` + `requireRole(...)`
- `lib/db/src/schema/{users,sessions}.ts` — Drizzle schema (role enum: super_admin/admin/staff/client)
- `lib/api-spec/openapi.yaml` — contract; regenerate with `pnpm --filter @workspace/api-spec run codegen`
- `scripts/src/seed.ts` — idempotent demo-user seeder (`pnpm --filter @workspace/scripts run seed`)
- `artifacts/duplicator-site/src/index.css` — CSS variables, dark theme, glass utilities, scroll animations

## Architecture decisions

- Pure inline React styles (no Tailwind/CSS modules) — maintains visual precision for complex dark-glass effects
- CSS variables in index.css for theme tokens: `--ink` (#FFFFFF), `--grey` (rgba white 55%), `--blue` (#2645C8), `--electric` (#00C6FF), `--navy` (#04091A)
- Background: fixed `#04091A` with 4 radial gradient orbs (blue + white-blue blend) in body pseudo-element — hero/sections set `background: transparent` to show through
- Glassmorphism via `backdropFilter: blur(Xpx)` + `rgba(8-12, 16-24, 50-65, 0.5-0.75)` backgrounds + 1px `rgba(255,255,255,0.08)` borders
- RevealDiv scroll-reveal wrapper using IntersectionObserver in HomePage.tsx

## Product

- Public site: home, products (now with FRW starting prices per card + "Request Quote" CTA that funnels to /login)
- Auth: `/login`, `/signup` (branded glass shell)
- Dashboards (cookie-protected, role-gated):
  - `/admin` — super_admin + admin (revenue, orders, invoices, tasks, CRM, analytics shells)
  - `/staff` — staff (tasks, assigned orders, messages shells)
  - `/portal` — client (orders, invoices, spending shells)
- WhatsApp integration: homepage CTAs + global FAB retained; product-card "Enquire via WhatsApp" buttons replaced by "Request Quote".

## Demo accounts (seeded)

- `admin@duplicator.rw` / `Admin@2026` — super_admin
- `manager@duplicator.rw` / `Manager@2026` — admin
- `staff@duplicator.rw` / `Staff@2026` — staff
- `client@example.com` / `Client@2026` — client

## Phase status

- **Phase 1 ✅** — Auth foundation (DB + API + UI), role-based dashboard shells, FRW pricing on Products, code-reviewed and hardened (atomic lockout, complete subcategory price coverage).
- **Phase 2 (next)** — Orders module (create/list/track, status timeline).
- Later phases — Invoices+PDF, Tasks/Kanban, CRM, Messaging (Socket.io), Analytics, Admin panel, Quotes+AI assist, MoMo/Airtel payments.

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
- **API client codegen quirks**: Orval emits Zod values as `RegisterBody` / `LoginBody` (NOT `RegisterInput`); response types like `AuthResponse` / `AuthUser` are TS-only — cast, don't `.parse()`. Pass per-request fetch options under `request: {...}`, not `fetch: {...}`. `useGetCurrentUser({ query: { queryKey: getGetCurrentUserQueryKey(), ... } })` — `queryKey` is required when overriding query options.
- **Auth lockout**: failed-attempt increment is one atomic SQL `UPDATE ... CASE` statement so concurrent bad logins can't clobber each other.
- **Product pricing map**: keys in `PRICE_BY_SUBCATEGORY` MUST exactly match `Product.subcategory` strings — silent fallback price is intentionally distinct ("request quote" unit).
- **Cookies are same-origin** (frontend `/`, api `/api` via shared proxy), but AuthContext explicitly passes `credentials: "include"` for clarity.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
