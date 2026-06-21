#!/bin/bash
set -e

CI=true pnpm install --no-frozen-lockfile --ignore-scripts=false
pnpm --filter @workspace/db run push 2>/dev/null || true
