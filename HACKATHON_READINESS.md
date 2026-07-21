# Diya hackathon readiness

## Current state

- Repository: pushed to GitHub on `main`.
- Desktop app: portable Windows build exists at `dist\Diya 0.11.0.exe`.
- Verification: `npm run check` passes, including the Cloud test suite.
- Public Cloud URL: `https://diya-cloud.vercel.app`.
- Submission docs: `SUBMISSION.md` and `DEMO_SCRIPT.md`.

## Ready to show

- Hotkey-activated screen capture flow.
- Small second cursor that follows the real pointer during an active session.
- Text-only hover context from Windows accessibility labels.
- Talk mode with typed or spoken questions.
- On-screen guide cursor, target ring, and step advancement.
- Approval-first Agent mode.
- Local Notion and Gmail connector demo paths.
- Diya Cloud source, schema, encryption model, pairing flow, limits, and deployment runbook.

## Not ready to claim yet

- The hosted Diya Cloud deployment is not production-green until Vercel has both `DIYA_DATABASE_URL` and `OPENAI_API_KEY`.
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

## Submission framing if time is tight

Submit Diya as a working Windows desktop prototype with a production Cloud foundation implemented. Be precise: the local app and code are demo-ready; the public Cloud URL becomes live after the two remaining secrets are configured.
