# Edge Functions (test phase)

## Next step in the project

After `_shared` (CORS + auth), the usual flow is:

1. **Run Supabase locally** — `supabase start` (DB + Auth + Functions runtime).
2. **Serve functions** — `supabase functions serve` (from repo root; second terminal).
3. **Call with curl or PowerShell** — confirm CORS and JWT behavior before building “real” functions.

## Functions

| Function       | Auth | Purpose                                      |
| -------------- | ---- | -------------------------------------------- |
| `hello`        | No\* | JSON + CORS smoke test                       |
| `hello-authed` | Yes  | Same + `getUserFromRequest`                  |
| `onboarding`   | Yes  | Create team or join by invite (service role) |

### `onboarding`

Requires **user JWT** + **`SUPABASE_SERVICE_ROLE_KEY`** in the function env (set automatically with `supabase start` + `functions serve`).

- **GET** — `{ needsOnboarding, team: { id, name, invite_code } | null }`
- **POST** — body either `{ "action": "create_team", "teamName": "My Squad" }` or `{ "action": "join_team", "inviteCode": "ABCD1234" }`

```bash
# After sign-in, use the user's access_token from the client session
curl -sS "http://127.0.0.1:54321/functions/v1/onboarding" \
  -H "Authorization: Bearer USER_ACCESS_TOKEN" \
  -H "apikey: $ANON_KEY"
```

Why Edge Function (not only RLS)? Joining by **invite code** needs to **look up a team** before you have a `profiles` row; RLS hides other teams, so this handler uses the **service role** for that lookup and inserts.

\*`verify_jwt = false` for `hello` in `supabase/config.toml`, but **Kong still expects API keys** (see below).

## Why it “does not respond” (hangs in browser or curl)

### 1. Opening the URL in the browser only

The address bar sends **no** `Authorization` / `apikey` headers. Local Kong still forwards to the Edge worker, but the request often **waits until timeout** (looks like “no response”).

**Use curl or your app** with headers (see below).

### 2. Git Bash on Windows + project on `E:` (or other drives)

With `--debug`, the runtime may resolve your file as `file:///Programming/...` (**drive letter missing**). The worker then never boots correctly → **hang or empty response**.

**Fix:** run `supabase functions serve` from **PowerShell** or **Command Prompt**:

```powershell
cd E:\Programming\trainee\supabase-react-ts-team-app
npx supabase functions serve
```

Optional in Git Bash (try if you must stay in Bash):

```bash
export MSYS2_ARG_CONV_EXCL="*"
npx supabase functions serve
```

### 3. `supabase functions serve` not running

`/functions/v1/*` is handled by the Edge runtime that **`functions serve`** starts. If it’s not running, calls can stall.

---

## Local commands

Terminal A:

```bash
supabase start
```

Terminal B (prefer **PowerShell** on Windows):

```bash
npx supabase functions serve
```

### Quick test (PowerShell)

From repo root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-hello.ps1
```

### Quick test (Bash — load keys from CLI)

```bash
source <(npx supabase status -o env | sed 's/^/export /')
curl -sS --max-time 30 "http://127.0.0.1:54321/functions/v1/hello" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "apikey: $ANON_KEY"
```

Use the **`ANON_KEY`** line from `supabase status -o env` (JWT-shaped `eyJ...` is fine).

### `hello-authed`

Use a real **user access token** from sign-in, plus the same `apikey`:

```bash
curl -sS "http://127.0.0.1:54321/functions/v1/hello-authed" \
  -H "Authorization: Bearer YOUR_USER_ACCESS_TOKEN" \
  -H "apikey: $ANON_KEY"
```

---

## `InvalidWorkerCreation` / `No such file or directory`

On **Windows + Docker**, avoid relying on host **`node_modules`** inside the Edge image. This repo uses **`deno.json` `imports`** → `npm:@supabase/supabase-js@…` so the bundler can pull deps without bad mount paths.

Also: **serve from PowerShell** (path / drive issues above).

---

## Deploy

```bash
supabase functions deploy hello
supabase functions deploy hello-authed
```
