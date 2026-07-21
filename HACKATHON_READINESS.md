# Diya hackathon readiness

## Current state

- Repository: pushed to GitHub on `main`.
- Desktop app: portable Windows build exists at `dist\Diya 0.11.1.exe`.
- Verification: `npm run check` passes, including the Cloud test suite.
- Readiness check: `npm run submission:check`.
- Submission bundle: `npm run submission:bundle`.
- Public Cloud URL: `https://diya-cloud.vercel.app`.
- Release URL: `https://github.com/prathamgarg1103/orbit-desktop/releases/tag/v0.11.1`.
- Windows beta download: `https://github.com/prathamgarg1103/orbit-desktop/releases/download/v0.11.1/Diya.0.11.1.exe`.
- Submission docs: `SUBMISSION.md` and `DEMO_SCRIPT.md`.
- Beta plan: `BETA_LAUNCH_PLAN.md`.
- Privacy policy: `PRIVACY.md`.
- Release notes: `RELEASE_NOTES_v0.11.1.md`.
- Public landing page: live at `https://diya-cloud.vercel.app`.

## Ready to show

- Hotkey-activated screen capture flow.
- Small second cursor that follows the real pointer during an active session.
- Text-only hover context from Windows accessibility labels.
- Talk mode with typed or spoken questions.
- On-screen guide cursor, target ring, and step advancement.
- Approval-first Agent mode.
- Local Notion and Gmail connector demo paths.
- Diya Cloud source, schema, encryption model, pairing flow, limits, and deployment runbook.
- Public Diya landing and privacy pages on Vercel.
- Public landing page download links to the `v0.11.1` Windows beta and release notes.
- Repo privacy/data-handling policy for beta users and judges.

## Not ready to claim yet

- The hosted Diya Cloud API is not production-green until Vercel has both `DIYA_DATABASE_URL` and `OPENAI_API_KEY`.
- The OpenAI key cannot be created or saved by Codex until the secure local destination confirmation is approved in the app.
- Supabase's database password cannot be retrieved by Codex. Set `DIYA_DATABASE_URL` in Vercel from the Supabase dashboard transaction pooler string.

## Final go-live checklist

1. In Supabase, copy the transaction pooler connection string for project `vjhwyqujehvzvweyjnmr`.
2. In Vercel project `diya-cloud`, add it as Production env var `DIYA_DATABASE_URL`.
3. Approve the OpenAI local-save confirmation for `cloud/.env`.
4. Let Codex create the encrypted OpenAI key, save it locally, and add it to Vercel as `OPENAI_API_KEY`.
5. Redeploy Diya Cloud.
6. Verify `https://diya-cloud.vercel.app/health` returns `ok: true` and `openaiConfigured: true`.
7. Record the demo video and submit `SUBMISSION.md` copy with the repo, app artifact, and live URL.

Shortcut for step 2 after you have the Supabase URL:

```powershell
.\scripts\configure-vercel-production.ps1 -Redeploy
```

## Submission framing if time is tight

Submit Diya as a working Windows desktop prototype with a live public site and a production Cloud foundation implemented. Be precise: the local app and public site are demo-ready; paired Cloud API features become live after the two remaining secrets are configured.

Use `npm run submission:check` before submitting. It exits successfully when the local demo package is ready and prints the live Cloud status. Use `npm run submission:check:cloud` only when the submission must require a fully green hosted Cloud.

Use `npm run submission:bundle` to create `dist\submission\Diya-hackathon-submission.zip` with the app, submission copy, demo script, readiness notes, README, license, and a manifest.

After submitting, use `BETA_LAUNCH_PLAN.md` as the first private-beta operating plan.
