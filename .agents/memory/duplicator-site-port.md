---
name: duplicator-site port config
description: The correct port for the duplicator-site Vite dev server, and why it matters.
---

The `artifacts/duplicator-site/.replit-artifact/artifact.toml` already existed with `localPort = 24468` and `PORT = "24468"`. The Replit artifact router intercepts all traffic to external port 80 and forwards paths to registered service ports. Since `"/"` routes to port 24468, Vite must bind to **24468** — not 5000 or 8081.

**Why:** Binding to any other port means the artifact router gets no response for "/" and returns 502. The artifact router is always running in this pnpm workspace and controls all preview traffic.

**How to apply:** In `artifacts/duplicator-site/vite.config.ts`, keep `server.port = 24468`. The workflow `waitForPort` should also be 24468. Never change this without first checking `artifact.toml`'s `localPort`.
