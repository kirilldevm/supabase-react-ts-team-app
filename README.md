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
| Backend | Supabase Edge Functions (Deno + Hono + Zod) |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (PKCE flow) |
| Storage | Supabase Storage (private bucket) |
| Realtime | Supabase Realtime Presence |
| Hosting | Vercel (frontend) |

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
│   ├── vercel.json         # SPA rewrite rule for Vercel
│   └── .env.example
├── supabase/
│   ├── config.toml         # Local Supabase config
│   ├── migrations/         # SQL migrations (applied automatically)
│   └── functions/          # Edge Functions (Deno)
│       ├── _shared/        # Shared auth, DB, admin utilities
│       ├── onboarding/     # GET /onboarding, POST /onboarding/team, POST /onboarding/join
│       └── products/       # GET /products, POST /products, PATCH /products/:id, PATCH /products/:id/status
└── scripts/
    └── deploy-edge-functions.ps1
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
- GIN index + trigger for full-text search

After startup the CLI prints all local URLs and keys — keep them handy.

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

# Use the `anon key` printed by `npx supabase start`
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

> The anon key printed by `npx supabase start` (a JWT starting with `eyJ`) is used as the publishable key for local development.

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Start the dev server

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

> **PKCE OAuth note:** always use the **same origin** for the entire OAuth flow. Mixing `localhost` and `127.0.0.1` causes "PKCE verifier not found" because the code verifier is saved in `localStorage` which is origin-scoped.

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

Applies all migrations from `supabase/migrations/` to your hosted database.

### 4. Deploy Edge Functions

Use the provided PowerShell script. The `--use-api` flag bundles functions on Supabase's servers (required on Windows — local Docker path conversion strips the drive letter, causing deploy errors). The `--no-verify-jwt` flag lets the function handle its own auth instead of the gateway blocking requests before they reach the function.

```powershell
# Deploy all functions
.\scripts\deploy-edge-functions.ps1

# Deploy specific functions only
.\scripts\deploy-edge-functions.ps1 onboarding products
```

Or manually with `npx`:

```bash
npx supabase functions deploy onboarding --use-api --no-verify-jwt
npx supabase functions deploy products --use-api --no-verify-jwt
```

### 5. Configure frontend environment for production

In your Vercel project settings (or `frontend/.env.local` for a manual build):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Dashboard → Settings → API → "Publishable key"
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

### 6. Set up Auth redirect URLs

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: your production domain (e.g. `https://yourapp.vercel.app`)
- **Redirect URLs**: add all origins:
  - `https://yourapp.vercel.app/auth/callback`
  - `http://localhost:5173/auth/callback`
  - `http://127.0.0.1:5173/auth/callback`

In Supabase Dashboard → **Authentication → Sign In Methods → Advanced**:

- **Auth flow type**: set to **PKCE** (not Implicit)

### 7. Deploy to Vercel

The `frontend/vercel.json` already contains the SPA rewrite rule so all client-side routes (including `/auth/callback`) are served by `index.html`. Just connect the `frontend/` directory to Vercel and set the environment variables above.

---

## Google OAuth (Optional)

**Hosted project:**

1. [Google Cloud Console](https://console.cloud.google.com) → create an OAuth 2.0 client → set Authorized redirect URI to `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
2. Supabase Dashboard → Authentication → Providers → Google → enable + paste Client ID and Secret

**Local development:**

1. Add `http://127.0.0.1:54321/auth/v1/callback` as an Authorized redirect URI in Google Cloud Console
2. Copy `supabase/.env.example` → `supabase/.env` and fill in:
   ```env
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
   ```
3. In `supabase/config.toml` set `[auth.external.google] enabled = true`
4. Restart: `npx supabase stop && npx supabase start`

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

# Build the frontend
cd frontend && npm run build
```

---

## Edge Function Architecture

Each function uses **Hono** as an in-process router and **Zod** for request validation. CORS is handled at the `Deno.serve` wrapper level (not inside Hono) so that `OPTIONS` preflight requests are answered before any routing or auth logic runs.

```ts
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  const res = await app.fetch(req);
  // inject CORS headers into every response
  ...
});
```

### URL routing

Supabase strips `/functions/v1` from the incoming URL but **keeps the function name** as the first path segment. A request to `/functions/v1/products?page=1` arrives at the function as `/products?page=1`.

| External URL | Method | Handler |
|---|---|---|
| `/functions/v1/onboarding` | GET | Check onboarding status |
| `/functions/v1/onboarding/team` | POST | Create a new team |
| `/functions/v1/onboarding/join` | POST | Join a team by invite code |
| `/functions/v1/products` | GET | List products (search, filter, sort, paginate) |
| `/functions/v1/products` | POST | Create a product |
| `/functions/v1/products/:id` | PATCH | Update product fields |
| `/functions/v1/products/:id/status` | PATCH | Change product status |

### Shared utilities (`supabase/functions/_shared/`)

| File | Purpose |
|---|---|
| `auth.ts` | Create a Supabase client scoped to the request's JWT |
| `db.ts` | Fetch the calling user's `team_id` from `profiles` |
| `supabaseAdmin.ts` | Service-role client (bypasses RLS for trusted writes) |
| `httpJson.ts` | JSON response helpers |
| `cors.ts` | Legacy CORS headers (unused in current functions) |

### JWT verification

All functions are deployed with `--no-verify-jwt`. The Supabase gateway does **not** pre-check the token — instead, each function validates the bearer token itself via `createSupabaseForRequest`. This is necessary because the gateway would otherwise reject `OPTIONS` preflight requests (which carry no token) with a 401 before they reach the function.

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
- `search_vector` is a stored `TSVECTOR` (title weight A, description weight B) kept up to date by a trigger, indexed with GIN for fast prefix full-text search.
- Product images are stored in the private `product-images` bucket under `{team_id}/{uuid}.{ext}`. Frontend access requires a signed URL (1-hour expiry generated via `storage.createSignedUrls`).
