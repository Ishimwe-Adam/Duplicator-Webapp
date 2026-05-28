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
- `artifacts/api-server/src/routes/orders.ts` — `/api/orders` role-scoped CRUD + atomic status transitions
- `artifacts/api-server/src/routes/invoices.ts` — `/api/invoices` role-scoped (clients see own, admins manage, staff blocked) + atomic status precondition + `/api/invoices/:id/pdf` pdfkit stream + `POST /:id/payments` transactional payment recorder
- `lib/db/src/schema/payments.ts` — payments table (bigint amount, method enum [momo/airtel/bank_transfer/cash/other], reference/notes/paidAt) + `PAYMENT_METHOD_LABEL`
- `artifacts/duplicator-site/src/pages/invoices/RecordPaymentModal.tsx` — admin payment modal
- `artifacts/duplicator-site/src/lib/payments.ts` — payment method labels (frontend mirror)
- `lib/db/src/schema/invoices.ts` — invoices schema + `formatInvoiceNumber()` + `nextAllowedInvoiceStatuses()` + `computeInvoiceTotals()` + `isInvoiceOverdue()`
- `artifacts/duplicator-site/src/pages/invoices/{InvoicesListPage,InvoiceDetailPage,CreateInvoiceModal}.tsx` — invoices UI
- `artifacts/duplicator-site/src/lib/invoices.ts` — status labels/tones + frontend transition mirror + `pdfUrlFor()`
- `artifacts/duplicator-site/src/pages/orders/{OrdersListPage,OrderDetailPage,NewOrderModal}.tsx` — orders UI
- `artifacts/duplicator-site/src/lib/orders.ts` — status labels/tones, frontend transition mirror (server is authoritative)
- `lib/db/src/schema/orders.ts` — orders schema + `formatOrderNumber()` + `nextAllowedOrderStatuses()`
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
- **Phase 2 ✅** — Orders module: `orders` + `order_status_events` tables, `/api/orders` (list/create/get/patch status) with role-scoped queries, `/{admin,staff,portal}/orders` pages + detail view with timeline + create modal. Code-reviewed and hardened: server-side workflow enforcement via `nextAllowedOrderStatuses`, atomic status update with precondition (`WHERE id=? AND status=?`) returning 409 on concurrent transitions, `subtotal_amount` as bigint to prevent int32 overflow.
- **Phase 3 ✅** — Invoices module: `invoices` table (bigint money, jsonb items snapshot, status enum [draft/sent/paid/void]), `/api/invoices` (list/create/get/patch status) admin-only mutations, staff blocked entirely, clients scoped to own. PDF generation via pdfkit at `GET /api/invoices/:id/pdf` (same-origin cookie auth, `Cache-Control: private, no-store`). Frontend: `/{admin,portal}/invoices` list + detail with PDF download, admin create-from-order modal w/ VAT %. Code-reviewed and hardened: invoice creation wrapped in `db.transaction` with `SELECT ... FOR UPDATE` on the order row (prevents race vs. concurrent order cancel/reassign), atomic status UPDATE WHERE id=? AND status=? returning 409 on lost race.
- **Phase 4 ✅** — Manual payment recording: `payments` table (bigint amount, method enum, reference, paidAt), `POST /api/invoices/:id/payments` admin-only inside `db.transaction` w/ `SELECT … FOR UPDATE` on invoice + SUM-inside-tx balance check (race-safe vs. concurrent payments), rejects overpay/paid/void invoices. On full settlement auto-flips invoice to `status='paid'`, sets `paidAt`, backfills `sentAt` if invoice skipped sent. `InvoiceSummary` + `InvoiceDetail` now carry `amountPaid` + `balanceDue`; detail also exposes `payments[]` with `recordedBy`. Frontend: balance column on lists, Payments section + `RecordPaymentModal` (FRW input + method dropdown + reference + date) on detail. Code-reviewed: PASS.
- **Phase 5 (next)** — Tasks/Kanban or CRM or Messaging (Socket.io).
- Later phases — Analytics, Quotes + AI assist, real MoMo/Airtel Collect API integration.

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
- **Invoice PDF endpoint is NOT in the OpenAPI spec** — it streams binary, so the frontend uses a plain `<a href="/api/invoices/:id/pdf" target="_blank">` (same-origin cookie auth carries through). Don't try to generate hooks for it.
- **pdfkit bundling**: `pdfkit` + its fontkit dep chain (`fontkit`, `brotli`, `linebreak`, `unicode-properties`, `unicode-trie`, `restructure`, `tiny-inflate`, `dfa`) are in `artifacts/api-server/build.mjs` externals — they use dynamic requires + path traversal for font files and break esbuild bundling otherwise.
- **Invoice create is transactional** with `SELECT ... FOR UPDATE` on the order row, so order status / clientId can't change between the read and the insert. The status PATCH uses the same atomic-precondition pattern as orders (`WHERE id=? AND status=?` → 409 on race).
- **Payment recording is transactional** with `SELECT ... FOR UPDATE` on the invoice + SUM(payments) inside the same tx — prevents two concurrent payments from both spending the same outstanding balance. Fully-paid invoices auto-flip to `status='paid'` *bypassing* `nextAllowedInvoiceStatuses` (a draft can go straight to paid for cash sales); `sentAt` is backfilled to `now()` in that case so the timeline stays monotonic.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
