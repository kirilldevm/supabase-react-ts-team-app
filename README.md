# Team Product App

A full-stack team collaboration app built with React, Supabase, and Edge Functions. Teams can sign up, invite members, and collaboratively manage a product catalogue with image uploads, full-text search, filtering, and real-time presence.

## Features

- **Auth** — email/password sign-up with email verification, Google OAuth, forgot/reset password
- **Teams** — create a team or join one via an 8-char invite code; one team per user
- **Products** — create, edit (draft only), activate, soft-delete; image upload to private Storage
- **Table** — pagination, full-text prefix search, filter by status/creator, sort by date
- **Realtime** — live online/offline status for team members via Supabase Presence
- **Cron** — auto-purge products with `deleted` status older than 2 weeks

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Routing | React Router v7 |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| UI | Base UI + Shadcn components |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth |
| Storage | Supabase Storage (private bucket) |
| Realtime | Supabase Realtime Presence |

---

## Prerequisites

- **Node.js** ≥ 18
- **Docker Desktop** — required for local Supabase containers
- **Supabase CLI** — installed locally via npm (use `npx supabase`, not a global `supabase` command)

> **Windows note:** the Supabase CLI binary may not be on your `PATH`. Always prefix commands with `npx`:
> ```bash
> npx supabase --version   # ✅
> supabase --version       # ❌ may not work
> ```

---

## Project Structure

```
.
├── frontend/               # React SPA
│   ├── src/
│   │   ├── app/            # Routes, layouts
│   │   ├── components/     # UI + feature components
│   │   ├── configs/        # Pages & query-key constants
│   │   ├── hooks/          # TanStack Query hooks
│   │   ├── schemas/        # Zod validation schemas
│   │   ├── services/       # Supabase client calls
│   │   └── types/          # Shared TypeScript types
│   └── .env.example
├── supabase/
│   ├── config.toml         # Local Supabase config
│   ├── migrations/         # SQL migrations (applied automatically)
│   ├── functions/          # Edge Functions (Deno)
│   │   ├── _shared/        # Shared auth, CORS, DB utilities
│   │   ├── onboarding/
│   │   ├── products-create/
│   │   ├── products-fetch/
│   │   ├── products-update/
│   │   └── products-update-status/
│   └── .env.example
├── scripts/
│   └── deploy-edge-functions.ps1
└── GOOGLE-OAUTH.md         # Google OAuth troubleshooting guide
```

---

## Local Development Setup

### 1. Start local Supabase

```bash
npx supabase start
```

This spins up PostgreSQL, Auth, Storage, Realtime, Studio, and Inbucket in Docker. All migrations in `supabase/migrations/` are applied automatically, including:
- Database schema (`teams`, `profiles`, `products` tables, RLS policies)
- Private `product-images` storage bucket with team-scoped policies
- Cron job to purge old deleted products
- GIN index for full-text search

After startup, the CLI prints all local URLs and keys — keep them handy.

| Service | URL |
|---|---|
| API | `http://127.0.0.1:54321` |
| Studio | `http://127.0.0.1:54323` |
| Email testing (Inbucket) | `http://127.0.0.1:54324` |
| Database | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

> **Inbucket** intercepts all emails sent locally (sign-up confirmation, password reset). Open it in the browser to read them — no real emails are sent.

### 2. Configure frontend environment

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321

# Use the `anon key` printed by `npx supabase start` as the publishable key
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

> The local anon key printed by `npx supabase start` (a JWT starting with `eyJ`) is used as the publishable key for local development. All Edge Functions have `verify_jwt = false` in `config.toml` and perform their own token verification inside the function body.

### 3. Install frontend dependencies

```bash
# from the frontend/ directory
npm install
```

### 4. Start the dev server

```bash
npm run dev
```

The app is available at `http://localhost:5173` (or `http://127.0.0.1:5173`).

> **PKCE OAuth note:** always use the **same origin** (`localhost` vs `127.0.0.1`) for the entire OAuth flow. Mixing them causes "PKCE verifier not found" because the code verifier is saved in `localStorage` which is origin-scoped.

---

## Hosted (Production) Setup

### 1. Create a Supabase project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.

### 2. Link the CLI to your project

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Push migrations

```bash
npx supabase db push
```

This applies all migrations from `supabase/migrations/` to your hosted database, including the schema, RLS policies, storage bucket, cron job, and search index.

### 4. Deploy Edge Functions

On Windows, use the provided PowerShell script which adds the required `--use-api` flag (bypasses Docker path issues):

```powershell
# Deploy all functions
.\scripts\deploy-edge-functions.ps1

# Deploy specific functions
.\scripts\deploy-edge-functions.ps1 onboarding products-create products-fetch
```

Or deploy manually with `npx supabase`:

```bash
npx supabase functions deploy onboarding --use-api
npx supabase functions deploy products-create --use-api
npx supabase functions deploy products-fetch --use-api
npx supabase functions deploy products-update --use-api
npx supabase functions deploy products-update-status --use-api
```

> **`--use-api` flag:** bundles the function on Supabase's servers instead of locally. Required on Windows because Docker's path conversion strips the drive letter (`E:` → `` empty string), causing a "no such file" error at deploy time.

### 5. Configure frontend environment for production

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Dashboard → Settings → API → "Publishable key"
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 6. Set up Auth redirect URLs

In your Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: your production domain (e.g. `https://yourapp.com`)
- **Redirect URLs**: add your dev origins:
  - `http://localhost:5173/auth/callback`
  - `http://127.0.0.1:5173/auth/callback`
  - `https://yourapp.com/auth/callback`

---

## Google OAuth (Optional)

See [GOOGLE-OAUTH.md](./GOOGLE-OAUTH.md) for the full setup guide.

**Quick summary:**
- **Hosted project**: Dashboard → Authentication → Providers → Google → enable + paste credentials
- **Local**: copy `supabase/.env.example` → `supabase/.env`, fill in `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, set `[auth.external.google] enabled = true` in `config.toml`, then restart with `npx supabase stop && npx supabase start`

---

## Useful Commands

```bash
# Check local Supabase status and print all keys/URLs
npx supabase status

# Stop local containers
npx supabase stop

# Reset local database (re-runs all migrations from scratch)
npx supabase db reset

# Create a new migration file
npx supabase migration new <name>

# Generate TypeScript types from local DB schema
npx supabase gen types typescript --local > frontend/src/types/database.types.ts

# Run the frontend dev server
cd frontend && npm run dev

# Build the frontend
cd frontend && npm run build
```

---

## Edge Function Architecture

All backend logic runs in Supabase Edge Functions (Deno). Shared utilities live in `supabase/functions/_shared/`:

| File | Purpose |
|---|---|
| `auth.ts` | Extract and verify the user JWT from the request |
| `cors.ts` | CORS preflight response helper |
| `db.ts` | Get the calling user's `team_id` from `profiles` |
| `httpJson.ts` | Parse JSON body, send JSON responses |
| `supabaseAdmin.ts` | Service-role client (bypasses RLS for trusted operations) |

All functions have `verify_jwt = false` in `config.toml` — the gateway does **not** check the token. Instead, `getUserFromRequest()` in `_shared/auth.ts` validates the bearer token manually, so the function can return a clean error response rather than a raw 401.

---

## Database Schema Overview

```
auth.users          ← managed by Supabase Auth
      │
      ▼
public.profiles     user_id (FK) | team_id (FK) | email | joined_at
      │
      ▼
public.teams        id | name | invite_code | created_at
      │
      ▼
public.products     id | team_id | title | description | image_url
                    status (draft|active|deleted) | created_by
                    created_at | updated_at | deleted_at | search_vector
```

- **RLS** is enabled on all tables — users only see/modify data belonging to their team.
- `search_vector` is a stored `TSVECTOR` generated from `title` (weight A) and `description` (weight B), indexed with GIN for fast prefix full-text search.
- Product images are stored in the private `product-images` Storage bucket under the path `{team_id}/{uuid}.{ext}`. Access requires a signed URL (1-hour expiry).
