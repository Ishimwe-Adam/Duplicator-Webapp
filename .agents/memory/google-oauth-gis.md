---
name: Google OAuth GIS approach
description: Why we use the raw GIS script instead of @react-oauth/google in this project
---

## Rule
Never install `@react-oauth/google` in the duplicator-site artifact. Use the raw Google Identity Services (GIS) script instead, loaded dynamically via a custom `GoogleSignInButton` component.

## Why
`@react-oauth/google` uses React hooks internally. In a pnpm monorepo with workspace isolation, it ends up with its own React instance separate from the app's. This causes an "Invalid hook call" / "Cannot read properties of null (reading 'useState')" crash on startup. The `GoogleOAuthProvider` wrapper also fails at the `html` root level, crashing the entire app.

## How to apply
- `GoogleSignInButton.tsx` at `artifacts/duplicator-site/src/components/GoogleSignInButton.tsx` loads `https://accounts.google.com/gsi/client` once via a shared `loadGis()` helper, then calls `google.accounts.id.initialize()` and `google.accounts.id.renderButton()`.
- The button only renders when `VITE_GOOGLE_CLIENT_ID` env var is set — gracefully hidden otherwise.
- Backend uses `google-auth-library` (`OAuth2Client.verifyIdToken`) at `POST /api/auth/google`. The `google-auth-library` package bundles cleanly with esbuild (not in externals list).
- Two env vars needed: `VITE_GOOGLE_CLIENT_ID` (frontend, Vite exposes it) and `GOOGLE_CLIENT_ID` (backend, same value).
