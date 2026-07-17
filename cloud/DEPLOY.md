# Deploy Diya Cloud

Diya Cloud can run on a small Linux VM with Docker. The provided production compose file places it behind Caddy, which obtains and renews HTTPS certificates automatically after your DNS record points at the VM.

## 1. Prepare the server

1. Create an `A`/`AAAA` DNS record such as `cloud.yourdomain.com` pointing to the server.
2. Install Docker Engine and Docker Compose on the VM.
3. Copy `cloud/.env.example` to `cloud/.env` and set:
   - `DIYA_ENCRYPTION_KEY` — a fresh 32-byte base64 key.
   - `DIYA_BOOTSTRAP_CODE` — a long temporary code used only to pair a desktop.
   - `OPENAI_API_KEY` — the server-side OpenAI project key.
   - `DIYA_DOMAIN` and `DIYA_PUBLIC_URL` — your HTTPS domain.
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

```bash
cd cloud/deploy
docker compose -f compose.production.yml --env-file ../.env up -d --build
docker compose -f compose.production.yml logs -f
```

After DNS resolves, verify `https://cloud.yourdomain.com/health`. Pair one desktop from Diya’s settings gear with the temporary bootstrap code, then rotate `DIYA_BOOTSTRAP_CODE` and redeploy. Each paired desktop gets its own revocable opaque token.

## 4. Operate safely

- Back up the `diya-cloud-data` Docker volume and the encryption key together; the database is not useful without the key.
- Never expose port 8787 publicly. Caddy is the public HTTPS edge.
- Rotate the bootstrap code after onboarding and rotate the encryption key only through a planned data migration.
- Use a managed database before running multiple Cloud replicas; this SQLite deployment is intentionally one-node.
