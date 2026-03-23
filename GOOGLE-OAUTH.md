# Google OAuth with Supabase

## Error: `Unsupported provider: provider is not enabled`

That message comes from **Supabase Auth (GoTrue)** on the instance your app calls (`VITE_SUPABASE_URL`). Google is **off** there—not from your React code.

### A) Hosted project (`https://xxxxx.supabase.co`)

1. **Dashboard → Authentication → Providers → Google**
2. Turn **Enable Sign in with Google** **ON**.
3. **Client IDs** must end with **`...googleusercontent.com`** (not `.cc` or other typos).
4. Click **Save** (scroll down if needed; unsaved changes leave Google disabled).
5. **Authentication → URL configuration**
   - **Site URL**: e.g. `http://localhost:5173` for Vite dev.
   - **Redirect URLs**: add exactly:
     - `http://localhost:5173/auth/callback`
     - `http://127.0.0.1:5173/auth/callback`
6. Confirm **`.env`** uses the **same** project:
   - `VITE_SUPABASE_URL=https://<your-ref>.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable/anon key for that project>`

### B) Local Supabase (`http://127.0.0.1:54321`)

Dashboard settings **do not** apply. Enable Google in **`supabase/config.toml`**:

1. Copy `supabase/.env.example` → `supabase/.env` and set:
   - `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`
   - `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`
2. Set `[auth.external.google] enabled = true` in `config.toml`.
3. `supabase stop && supabase start`

Google Cloud **Authorized redirect URI** for local:

`http://127.0.0.1:54321/auth/v1/callback`

(Hosted uses `https://<ref>.supabase.co/auth/v1/callback` — add **both** in Google Cloud if you use both.)

### Google Cloud: app in "Testing"

Under **OAuth consent screen → Audience**, add your Gmail under **Test users**, or Google will block sign-in for non-test accounts (different error than "provider not enabled", but easy to hit).

### This repo's SPA

- OAuth uses `redirectTo: <origin>/auth/callback` and the **`/auth/callback`** route exchanges the `code` (PKCE) for a session.
- Hosted **Redirect URLs** must include that full URL (see above).
- **Same origin for the whole flow:** always open the app as `http://localhost:5173` **or** always `http://127.0.0.1:5173`. Mixing them uses different `localStorage`, so the PKCE verifier saved when you click “Google” is missing when you land on `/auth/callback` → *“PKCE code verifier not found in storage”*.
- The app uses `@supabase/supabase-js` `createClient` + `localStorage` (not `@supabase/ssr`’s cookie client) so PKCE survives the redirect in a Vite SPA.
- **`createClient()` is a singleton** — every screen must reuse that one instance. Multiple `createSupabaseClient()` calls caused “Multiple GoTrueClient instances” and **PKCE verifier not found** because OAuth started on one instance and the callback used another.
