# Edge Functions (test phase)

## Next step in the project

After `_shared` (CORS + auth), the usual flow is:

1. **Run Supabase locally** — `supabase start` (DB + Auth + Functions runtime).
2. **Serve functions** — `supabase functions serve` (from repo root; auto-loads env from local stack).
3. **Call from the browser or curl** — confirm CORS and JWT behavior before building “real” functions (teams, products, webhooks).

## Test functions

| Function       | Auth | Purpose                     |
| -------------- | ---- | --------------------------- |
| `hello`        | No   | JSON + CORS smoke test      |
| `hello-authed` | Yes  | Same + `getUserFromRequest` |

## Local commands (from repo root)

```bash
supabase start
supabase functions serve
```

URLs (default local): `http://127.0.0.1:54321/functions/v1/<name>`

### Public `hello`

```bash
curl -s http://127.0.0.1:54321/functions/v1/hello
```

### `hello-authed` (replace `YOUR_ACCESS_TOKEN`)

```bash
curl -s http://127.0.0.1:54321/functions/v1/hello-authed \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_ANON_KEY"
```

`apikey` is required by the local gateway; get both keys from `supabase status`.

## Deploy

```bash
supabase functions deploy hello
supabase functions deploy hello-authed
```
