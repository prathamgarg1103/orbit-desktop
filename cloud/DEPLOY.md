# Deploy Diya Cloud

Diya Cloud supports a managed **Vercel + Supabase** deployment for the public beta and a self-managed Docker deployment for a single-node VM. The managed path is the recommended default.

## Vercel + Supabase (recommended)

1. Choose a dedicated Supabase project and apply the repository migration:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

2. Import the GitHub repository into Vercel and set its **Root Directory** to `cloud`. Vercel uses [`cloud/vercel.json`](vercel.json) to send `/`, `/privacy`, `/health`, OAuth callbacks, and every `/v1/*` request to the Node function.
3. In Vercel's Production environment variables, set:
   - `DIYA_ENCRYPTION_KEY` — fresh 32-byte base64 value.
   - `DIYA_BOOTSTRAP_CODE` — long temporary code for your own first device only.
   - `OPENAI_API_KEY` — server-side OpenAI project key.
   - `DIYA_DATABASE_URL` — Supabase **Transaction pooler** URL, including `?sslmode=require`.
   - `DIYA_PUBLIC_URL` and `DIYA_DOMAIN` — the Vercel production URL hostname, or your custom HTTPS domain.
   - `DIYA_MONTHLY_SCREEN_GUIDE_LIMIT` and `DIYA_MONTHLY_APPROVED_ACTION_LIMIT` — per-device UTC-month spend caps.
4. Deploy to production and verify `/health`, `/`, `/privacy`, and a one-time desktop pairing. Add Google and Notion provider values only after their redirect URLs are registered.

The Cloud API never uses a Supabase browser key or service-role key. It connects only from the Vercel Node function through the password-bearing database URL; keep this value server-only. The schema enables RLS and revokes browser Data API access.

## Docker VM (self-managed alternative)

## 1. Prepare the server

1. Create an `A`/`AAAA` DNS record such as `cloud.yourdomain.com` pointing to the server.
2. Install Docker Engine and Docker Compose on the VM.
3. Copy `cloud/.env.example` to `cloud/.env` and set:
   - `DIYA_ENCRYPTION_KEY` — a fresh 32-byte base64 key.
   - `DIYA_BOOTSTRAP_CODE` — a long temporary code used only to pair a desktop.
   - `OPENAI_API_KEY` — the server-side OpenAI project key.
   - `DIYA_DOMAIN` and `DIYA_PUBLIC_URL` — your HTTPS domain.
   - `DIYA_MONTHLY_SCREEN_GUIDE_LIMIT` and `DIYA_MONTHLY_APPROVED_ACTION_LIMIT` — the per-device UTC-month beta caps that protect your OpenAI and connector spend.
4. Keep `.env` on the server. It is intentionally ignored by Git.

## 2. Register OAuth redirect URLs

Create a Google **web application** OAuth client and register:

`https://cloud.yourdomain.com/oauth/gmail/callback`

Diya requests only `https://www.googleapis.com/auth/gmail.compose`, which Google classifies as a restricted scope. Before a public rollout, complete the applicable consent-screen, verification, and data-policy requirements. Diya only creates drafts; it does not send mail.

Create a Notion **public connection** and register:

`https://cloud.yourdomain.com/oauth/notion/callback`

Choose the intended Notion installation scope in the Creator dashboard. Notion’s page picker grants access to selected pages; afterward, add the chosen parent page ID in Diya’s Notion settings so the agent knows where to create pages.

Put the four provider values in `.env` as `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `NOTION_OAUTH_CLIENT_ID`, and `NOTION_OAUTH_CLIENT_SECRET`.

## 3. Launch

Run the deployment preflight first. It uses the same container environment and persistent database volume as Cloud, but does not make a network request or print secrets:

```bash
cd cloud/deploy
docker compose -f compose.production.yml --env-file ../.env run --rm cloud node src/preflight.mjs
```

Fix every required failed check before continuing. Gmail and Notion OAuth may remain `not configured` if they are not part of the first beta.

Then launch the stack:

```bash
docker compose -f compose.production.yml --env-file ../.env up -d --build
docker compose -f compose.production.yml logs -f
```

After DNS resolves, verify `https://cloud.yourdomain.com/health`. The same public URL serves Diya's launch page at `/`, its privacy summary at `/privacy`, and the built-in waitlist form at `/v1/waitlist`; no external form provider is required. Use the operator bootstrap code only for your own first pairing, then issue each beta user a dedicated code:

```bash
docker compose -f compose.production.yml exec -T cloud node src/manage.mjs invite create --label "beta user" --expires-days 30
```

Share the printed code privately. It is one-time by default, stored only as a hash, and can be revoked with `invite revoke --id <invite-id>`. Each enrolled desktop gets its own revocable opaque token.

Review beta requests only from the server where the encryption key is available, then turn an accepted request into its one-time desktop enrollment code in the same workflow:

```bash
docker compose -f compose.production.yml exec -T cloud node src/manage.mjs waitlist list --status requested
docker compose -f compose.production.yml exec -T cloud node src/manage.mjs waitlist invite --id <entry-id> --label "beta user" --expires-days 30
```

Copy the printed code to the matching email address. It is one-use, expires after the chosen period, and is rejected if the same waitlist record is invited again.

Review intentionally submitted beta feedback on that same server. Each note is encrypted at rest and has no screen image attached. For a device enrolled through a waitlist invite, the result also includes that beta email for operator follow-up:

```bash
docker compose -f compose.production.yml exec -T cloud node src/manage.mjs feedback list --status new
docker compose -f compose.production.yml exec -T cloud node src/manage.mjs feedback set-status --id <feedback-id> --status reviewed
```

For a content-free daily beta snapshot, run:

```bash
docker compose -f compose.production.yml exec -T cloud node src/manage.mjs metrics overview
```

Use it to spot invite drop-off, active-device growth, guide/action engagement, and unreplied feedback without exporting customer data.

## 4. Operate safely

- Back up the `diya-cloud-data` Docker volume and the encryption key together; the database is not useful without the key.
- Never expose port 8787 publicly. Caddy is the public HTTPS edge.
- Keep the bootstrap code for operator recovery only; enroll people with individual invite codes and revoke an invite if it is exposed. Rotate the encryption key only through a planned data migration.
- Use a managed database before running multiple Cloud replicas; this SQLite deployment is intentionally one-node.
