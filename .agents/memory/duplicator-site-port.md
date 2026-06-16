---
name: duplicator-site port config
description: Port setup for the Vite frontend and Express API server using the Replit artifact system.
---

This project uses the **Replit artifact system**. Artifact configs live in `.replit-artifact/artifact.toml` under each artifact directory. The canvas preview and Replit webview both use the port defined there.

## Current working setup

- **Frontend (Vite)**: port **5000** — `artifacts/duplicator-site/.replit-artifact/artifact.toml` has `localPort = 5000` and `[services.env] PORT = "5000"`. `artifacts/duplicator-site/vite.config.ts` has `server.port = 5000`.
- **API Server (Express)**: port **8080** — `artifacts/api-server/.replit-artifact/artifact.toml` has `localPort = 8080`. Dev: `PORT=8080` injected by artifact runner.
- **Vite proxy**: `/api` → `http://localhost:8080` in `vite.config.ts` `server.proxy`.
- **Workflows**: `artifacts/duplicator-site: web` and `artifacts/api-server: API Server` — these are the artifact workflows, NOT custom "Start application" ones.

## Rules

**Why:** The Replit webview preview pane requires a workflow to serve on port 5000. The artifact router for the canvas preview uses `localPort` from `artifact.toml`. Both need to match — so use 5000 for both.

**How to apply:**
- Never create separate "Start application" custom workflows — they conflict with artifact workflows on the same port.
- To change the artifact port: write the new TOML to `.replit-artifact/artifact.edit.toml`, then call `verifyAndReplaceArtifactToml({tempFilePath, artifactTomlPath})` with absolute paths. Direct edits to `artifact.toml` are blocked.
- Always restart `artifacts/duplicator-site: web` after changing ports or vite config.
- Keep `strictPort: true` in vite config so startup fails loudly rather than binding to a random port.
