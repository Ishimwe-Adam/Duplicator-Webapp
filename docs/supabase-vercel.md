# Supabase and Vercel Setup

## 1. Create the Supabase project

1. Create a new Supabase project.
2. Open `Project Settings -> Database`.
3. Copy the transaction pooler connection string.
4. Set `DATABASE_URL` from that string.

## 2. Configure local environment

1. Copy `.env.example` to `.env`.
2. Set `PORT=3000`.
3. Set `DATABASE_URL` to your Supabase Postgres connection string.
4. Set `VITE_API_BASE_URL=http://localhost:3000`.

## 3. Install dependencies

```bash
pnpm install
```

## 4. Push the schema to Supabase

```bash
pnpm db:push
```

## 5. Seed demo users

```bash
pnpm seed
```

Demo accounts created by the seed script:

- `admin@duplicator.rw` / `Admin@2026`
- `manager@duplicator.rw` / `Manager@2026`
- `staff@duplicator.rw` / `Staff@2026`
- `client@example.com` / `Client@2026`

## 6. Run locally

Start the API:

```bash
PORT=3000 DATABASE_URL=... pnpm --filter @workspace/api-server dev
```

Start the frontend in a second terminal:

```bash
VITE_API_BASE_URL=http://localhost:3000 pnpm --filter @workspace/duplicator-site dev
```

## 7. Deploy to Vercel

1. Import the repository into Vercel.
2. Keep the project root at the repository root.
3. Vercel reads `vercel.json` and builds `artifacts/duplicator-site`.
4. Add these environment variables in Vercel:
   - `DATABASE_URL`
   - `NODE_ENV=production`
   - `LOG_LEVEL=info`
5. Leave `VITE_API_BASE_URL` empty so the frontend uses the same deployment origin.

## 8. Important notes

- API routes are served by the Vercel function at `api/[...route].ts`.
- SPA routes fall back to `index.html` through `vercel.json`.
- The frontend now uses the generated API client instead of the in-repo mock client.
