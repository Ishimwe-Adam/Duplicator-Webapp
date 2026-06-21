---
name: pnpm v11 supply-chain post-merge fix
description: Why pnpm must not be listed as a workspace dependency and how to fix post-merge setup failures caused by it.
---

## Rule
Never add `pnpm` as a direct dependency (in `package.json` `dependencies` or `devDependencies`). Remove it immediately if found.

## Why
When pnpm v11 is listed as a workspace dependency, the post-merge runner (which installs with pnpm v10 system binary) creates a lockfile that pnpm v11's stricter supply-chain policy then rejects with "Lockfile failed supply-chain policy check". pnpm v11 deletes `node_modules` before failing, leaving the workspace broken.

The supply-chain check cannot be bypassed via `.npmrc` alone (`verify-deps-before-run=false`, `trust-policy=no-downgrade` are insufficient).

## How to apply
- If post-merge fails with "Lockfile failed supply-chain policy check": check `package.json` for `pnpm` in dependencies and remove it.
- After removing, run `CI=true pnpm install --no-frozen-lockfile` to prune pnpm v11 from the lockfile.
- Verify with `grep "pnpm@11" pnpm-lock.yaml` — should return 0 matches.
- Post-merge script should use: `CI=true pnpm install --no-frozen-lockfile`
- `.npmrc` should have: `confirm-module-purge=false`, `frozen-lockfile=false`, `verify-deps-before-run=false`
