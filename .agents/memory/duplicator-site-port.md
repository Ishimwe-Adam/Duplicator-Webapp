---
name: duplicator-site port config
description: Port setup for the Vite frontend and Express API server in Replit workflow mode.
---

After migration to Replit, the project runs as two workflows:

- **Frontend (Vite)**: port **5000** — required for `webview` output type in Replit. Configured in `artifacts/duplicator-site/vite.config.ts` as `server.port = 5000`.
- **API Server (Express)**: port **3000** — console workflow, started via `PORT=3000 pnpm --filter @workspace/api-server run dev`.
- **Vite proxy**: `/api` requests are proxied from port 5000 → port 3000 via the `server.proxy` config in `vite.config.ts`.

**Why:** Replit's webview output type requires port 5000. The old port 24468 was from an artifact.toml setup that no longer applies. Vite proxies `/api` to the backend so cookies are same-origin.

**How to apply:** Keep Vite on port 5000, API on port 3000, and the proxy in place. The workflow named "Start application" serves the frontend; "API Server" serves the backend.
