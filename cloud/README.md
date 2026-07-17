# Orbit Cloud

Orbit Cloud is the server-side half of the Orbit startup foundation. It keeps the OpenAI project key and any future provider tokens out of the desktop process, pairs individual desktop installations with revocable opaque tokens, and persists only encrypted connector tokens plus minimal usage counters.

It intentionally does not store screen images, questions, model answers, raw provider tokens, or email/Notion content. A screen image is accepted for a single `/v1/screen-guides` request, forwarded to the Responses API with `store: false`, and discarded from process memory after the request completes.

## Run locally

```powershell
cd E:\projects\codex\orbit-desktop\cloud
Copy-Item .env.example .env
# Set the three required values in .env, then load them into your shell.
Get-Content .env | ForEach-Object { if ($_ -match '^([^#][^=]+)=(.*)$') { Set-Item -Path "Env:$($matches[1])" -Value $matches[2] } }
npm start
```

Node 22.13+ is required because the service uses the built-in SQLite driver. Put Orbit Cloud behind HTTPS in production; the desktop's Electron main process communicates directly with it, so browser CORS is disabled unless you explicitly set `ORBIT_ALLOWED_ORIGINS`.

## Pair a desktop

`POST /v1/device-sessions` accepts the server's short-lived `ORBIT_BOOTSTRAP_CODE` and returns a revocable desktop access token. Orbit's **Cloud** connection does this pairing from the app, so the raw device token never needs to be copied through the renderer. Rotate the bootstrap code after pairing.

## APIs

- `GET /health` — readiness without secrets.
- `POST /v1/device-sessions` — pair a desktop with a bootstrap code.
- `GET /v1/me` and `GET /v1/usage` — device status and aggregate counters.
- `POST /v1/screen-guides` — one hotkey-authorized image, structured visual guidance, no screen persistence.
- `PUT` / `DELETE /v1/connectors/gmail|notion` — encrypted server-side connector credentials.
- `POST /v1/oauth/gmail|notion/start` and `/oauth/:provider/callback` — browser OAuth handoff with signed, one-time state. Gmail uses PKCE and encrypted refresh tokens.
- `POST /v1/actions/execute` — executes a desktop-approved Gmail draft or Notion page using the server-stored connector.

OAuth is enabled only when a public HTTPS URL and the provider application credentials are configured. The desktop's **connect in browser** button then opens the real provider consent flow. See [production deployment](DEPLOY.md) for the exact redirect URLs and compliance boundary.

## Verify

```powershell
npm test
```
