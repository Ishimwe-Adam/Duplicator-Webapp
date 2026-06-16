---
name: duplicator-site port config
description: Port setup for the Vite frontend and Express API server using the Replit artifact system.
---

This project uses the **Replit artifact system**. Each artifact has an `artifact.toml` under `.replit-artifact/` that defines port routing. The canvas preview and iframe use artifact workflows, NOT custom workflows.

- **Frontend (Vite)**: port **24468** — defined in `artifacts/duplicator-site/.replit-artifact/artifact.toml` as `localPort = 24468`. Artifact runner injects `PORT=24468`. Vite config must have `server.port = 24468`.
- **API Server (Express)**: port **8080** (dev) — defined in `artifacts/api-server/.replit-artifact/artifact.toml` as `localPort = 8080`. Artifact runner injects `PORT=8080`.
- **Vite proxy**: `/api` requests are proxied from port 24468 → port 8080 via `server.proxy` in `vite.config.ts`.

**Why:** The artifact router intercepts canvas preview traffic and routes `/` to port 24468 and `/api` to port 8080. Custom workflows on different ports won't appear in the canvas preview iframe.

**How to apply:**
- Always use artifact workflows (`artifacts/duplicator-site: web` and `artifacts/api-server: API Server`), not custom "Start application" / "API Server" workflows.
- Never create custom workflows that bind to ports 24468 or 8080 — they'll conflict.
- Keep `vite.config.ts` `server.port = 24468` and proxy `/api` to `http://localhost:8080`.
