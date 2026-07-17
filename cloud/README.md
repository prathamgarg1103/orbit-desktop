# Diya Cloud

Diya Cloud is the server-side half of the Diya startup foundation. It keeps the OpenAI project key and any future provider tokens out of the desktop process, pairs individual desktop installations with revocable opaque tokens, and persists only encrypted connector tokens plus minimal usage counters.

It intentionally does not store screen images, questions, model answers, raw provider tokens, or Gmail/Notion content. A screen image is accepted for a single `/v1/screen-guides` request, forwarded to the Responses API with `store: false`, and discarded from process memory after the request completes. A visitor who deliberately requests early access has their email encrypted at rest; it is used only for beta follow-up. An enrolled user can deliberately submit a short feedback note; it is also encrypted at rest and never includes a screen image.

## Run locally

```powershell
cd <your-clone>\cloud
Copy-Item .env.example .env
# Set the three required values in .env, then load them into your shell.
Get-Content .env | ForEach-Object { if ($_ -match '^([^#][^=]+)=(.*)$') { Set-Item -Path "Env:$($matches[1])" -Value $matches[2] } }
npm start
```

Node 22.13+ is required because the service uses the built-in SQLite driver. Put Diya Cloud behind HTTPS in production; the desktop's Electron main process communicates directly with it, so browser CORS is disabled unless you explicitly set `DIYA_ALLOWED_ORIGINS`. Existing `ORBIT_*` server variables remain accepted during a transition, but new deployments should use `DIYA_*`.

Before inviting anyone, run the secret-safe deployment preflight after loading your real environment:

```powershell
npm run preflight
```

It validates the configuration contract, database migrations, server-side OpenAI key presence, public HTTPS URL/domain alignment, and optional OAuth configuration. It never prints secret values or contacts third-party services.

## Enroll an early-access desktop

Create a one-time, revocable invite on the server:

```bash
npm run admin -- invite create --label "first beta user" --expires-days 30
```

The command prints the invite code once and Diya Cloud retains only its hash. Send that code privately to the person, then have them enter it under **Cloud** in Diya alongside your Cloud URL. `POST /v1/device-sessions` accepts the invite as `enrollmentCode` and returns a revocable desktop access token. The legacy `bootstrapCode` request field and `DIYA_BOOTSTRAP_CODE` remain available for an operator's own first pairing, not for a public cohort.

```bash
npm run admin -- invite list
npm run admin -- invite revoke --id <invite-id>
```

## Launch page and beta waitlist

The deployed Cloud URL also serves Diya's public launch page at `/` and a concise privacy page at `/privacy`. Its built-in form posts to `/v1/waitlist`; no third-party form service receives the email. Each request is rate limited, normalized, encrypted at rest, and keyed-hashed to prevent duplicate rows without exposing an email index.

Only an operator with the Cloud encryption key can reveal the email through the local server CLI. To onboard a request, use the dedicated handoff command: it atomically marks the request invited and produces exactly one revocable enrollment code.

```bash
npm run admin -- waitlist list --status requested
npm run admin -- waitlist invite --id <entry-id> --label "first beta user" --expires-days 30
```

The command returns the decrypted email and raw code only once for the operator to send privately. A second invite for the same request is rejected. Mark an unqualified request as declined, or restore it to requested, with `waitlist set-status --id <entry-id> --status declined|requested`.

## Beta feedback

After pairing Diya Cloud, a beta user can open **Settings** and deliberately send a short bug report, product idea, or general note. This request authenticates with the desktop's revocable device token, contains no screenshot or prompt content, and is encrypted at rest before it is stored. When that desktop was enrolled through a waitlist invite, the operator review lists the beta email alongside the feedback so you can follow up; other devices remain identified only by device ID. Review it only from the Cloud host:

```bash
npm run admin -- feedback list --status new
npm run admin -- feedback set-status --id <feedback-id> --status reviewed
```

## Beta metrics

Use the operator-only overview to assess the funnel without reading user content or exposing PII:

```bash
npm run admin -- metrics overview
```

It returns aggregate waitlist states, pending/consumed/revoked invites, enrolled and recently active devices, all-time and seven-day guide/action counts, plus feedback workflow counts. It returns no emails, screen images, prompts, model responses, or feedback text.

## APIs

- `GET /` and `GET /privacy` - public Diya launch and privacy pages.
- `POST /v1/waitlist` - accepts a rate-limited, encrypted beta request.

- `GET /health` — readiness without secrets.
- `POST /v1/device-sessions` — enroll a desktop with a one-time invite or operator bootstrap code.
- `GET /v1/me` and `GET /v1/usage` — device status and aggregate counters.
- `POST /v1/feedback` — an explicit, encrypted beta note from a paired desktop; no screen content is attached.
- `DELETE /v1/me/device` — revokes the current desktop token; Diya calls this when Cloud is disconnected.
- `POST /v1/screen-guides` — one hotkey-authorized image, structured visual guidance, no screen persistence.
- `PUT` / `DELETE /v1/connectors/gmail|notion` — encrypted server-side connector credentials.
- `POST /v1/oauth/gmail|notion/start` and `/oauth/:provider/callback` — browser OAuth handoff with signed, one-time state. Gmail uses PKCE and encrypted refresh tokens.
- `POST /v1/actions/execute` — executes a desktop-approved Gmail draft or Notion page using the server-stored connector.

OAuth is enabled only when a public HTTPS URL and the provider application credentials are configured. The desktop's **connect in browser** button then opens the real provider consent flow. See [production deployment](DEPLOY.md) for the exact redirect URLs and compliance boundary.

## Verify

```powershell
npm test
```
