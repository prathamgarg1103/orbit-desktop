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

`POST /v1/device-sessions` accepts the server's short-lived `ORBIT_BOOTSTRAP_CODE` and returns a revocable desktop access token. Store the resulting endpoint and token in Orbit's **Cloud** connection. Rotate the bootstrap code after pairing.

## APIs

- `GET /health` — readiness without secrets.
- `POST /v1/device-sessions` — pair a desktop with a bootstrap code.
- `GET /v1/me` and `GET /v1/usage` — device status and aggregate counters.
- `POST /v1/screen-guides` — one hotkey-authorized image, structured visual guidance, no screen persistence.
- `PUT` / `DELETE /v1/connectors/gmail|notion` — encrypted server-side connector credentials.
- `POST /v1/actions/execute` — executes a desktop-approved Gmail draft or Notion page using the server-stored connector.

OAuth redirect handlers are deliberately not enabled until Google and Notion application credentials plus production callback URLs are set. The encrypted connector endpoints make the desktop-to-server boundary functional today; OAuth is the next deployment configuration step, not a fake button.

## Verify

```powershell
npm test
```
