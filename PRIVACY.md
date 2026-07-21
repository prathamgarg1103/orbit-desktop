# Diya privacy and data handling

Diya is built around explicit context. It should help inside the tool you are using without quietly watching your screen.

## Screen context

- Diya captures a screen only after the user presses `Ctrl` + `Shift` + `Space`.
- The desktop hides Diya before capture so the companion is not included in the screenshot.
- The active screen image is kept for the current session and cleared when Diya is closed.
- Diya does not run a background screenshot stream.
- Diya Cloud forwards a screen image only for the active guide request, asks the OpenAI API not to store the response, and does not persist the image, prompt, or model answer.

## Pointer and hover context

- While Diya is active, the small second cursor follows beside the user's real cursor.
- Hover context is text-only and comes from Windows accessibility labels.
- Hover inspection runs only during an active Diya session.

## Voice

- Push-to-talk audio is used to transcribe the user's current request.
- Live OpenAI transcription requires a configured OpenAI key.
- Browser speech recognition may be used as a local fallback when available.

## Local connector credentials

- Local connector credentials are stored with Electron `safeStorage`, which uses the operating system's encrypted credential service.
- Credentials are not placed in renderer code, source control, or submission bundles.

## Diya Cloud

When paired, Diya Cloud keeps product secrets and connector tokens out of the desktop process.

- Device sessions use revocable opaque access tokens.
- Gmail and Notion tokens are encrypted at rest.
- Waitlist emails are encrypted at rest and also keyed-hashed to prevent duplicate rows without exposing an email index.
- Feedback notes are encrypted at rest and never include a screen image by design.
- Usage tracking is aggregate: request counts, guide/action counters, invite status, device activity, and feedback workflow state.

## Connected actions

- Diya asks for explicit approval before a connected action.
- Gmail support creates drafts; it does not send email.
- Notion support creates a page only after approval.

## Current beta limits

- The public site and Windows beta are live.
- The paired Cloud API is not production-green until Vercel has `DIYA_DATABASE_URL` and `OPENAI_API_KEY`.
- Google and Notion OAuth public launch readiness still requires provider app configuration, redirect URLs, support contact details, and any provider review requirements.

## Operator rule

Do not ask users to paste secrets into chat, issues, or support messages. Secrets belong in local ignored env files, OS credential storage, Vercel environment variables, or the relevant provider dashboard.
