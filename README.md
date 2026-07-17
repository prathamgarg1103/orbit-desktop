# Diya

Diya is an original Windows desktop companion for getting unstuck inside any app. It is inspired by the screen-native assistant category, but uses its own name, visual system, copy, and implementation.

Press `Ctrl` + `Shift` + `Space` from FL Studio, Claude Code, a browser, or any other desktop tool. Diya captures that display once, then appears only as a small second cursor beside your real one. It is click-through and never leaves a chat card floating on your screen. Press the same hotkey again when you want the ask panel; Diya keeps the active screen and pointer context for a concise response plus coordinate-aware next steps that it can draw directly on the current screen.

## What works

- **Cursor-native companion:** Diya is absent until the hotkey. While a session is active, only its small click-through second cursor follows beside the real pointer and reads the text-only Windows accessibility label under it. The controls appear only after a second hotkey.
- **Talk:** Ask a spoken or typed question about the hotkey-authorized screen. Connect OpenAI directly for the hackathon build, or pair Diya Cloud so the desktop never holds the product API key. Either path returns a structured answer with up to four screen targets.
- **Guide on screen:** Choose **Guide me** to show a temporary, click-through guide cursor, target ring, and instruction bubble. Press `Ctrl` + `Shift` + `G` for the next step.
- **Agents:** Describe a task naturally, or begin a voice request with `Diya agent`. Agent mode can use current public web information when needed, then proposes any Gmail or Notion action for explicit approval.
- **Notion and Gmail:** Paste a Notion integration token with an allowed parent page, or a scoped Gmail OAuth access token, in the in-app settings. With Cloud connected, those credentials are encrypted server-side instead of being retained in the desktop. Approved agents create a Notion child page or Gmail draft; Diya never sends email.
- **Voice:** With OpenAI connected, Diya records push-to-talk audio and transcribes it with `gpt-4o-mini-transcribe`. Chromium speech recognition is used as a local fallback when available.

## Privacy boundary

Diya does not watch or record the screen in the background. It captures the display only after the hotkey, hides itself before capture, and clears that in-memory image when the session is closed. The text-only hover label is queried only while the companion is active; it is not a screenshot stream. `Esc` dismisses the guide first, then Diya and its screen context.

Connector credentials are stored through Electron `safeStorage`, using the operating system's encrypted credential service. They are not placed in renderer code or source control.

## Diya Cloud: the startup path

The `cloud` service is a separately deployable Node + SQLite API for the production product. Its root URL is also Diya's public launch page, with an encrypted, rate-limited early-access form and privacy summary. An operator can turn a requested email into one revocable desktop invite with a single Cloud command, then the user pairs Diya in the Connections gear using that code. Enrolled beta users can send an explicit private feedback note from Settings; it is encrypted, never includes a screen capture, and is visible only to a Cloud operator. If that device was enrolled from the waitlist, its feedback entry includes the original beta email only in the operator console, so you can follow up. Diya Cloud holds the OpenAI project key, encrypts Gmail/Notion tokens at rest, supports aggregate per-device usage, rate limits requests, monthly per-device guide/action caps, and executes only desktop-approved actions. Paired users see their remaining monthly beta allowance inside Settings. The operator CLI also has a content-free cohort overview for tracking waitlist, invite, device, engagement, and feedback counts, plus a deployment preflight for validating the production contract before launch. It never persists screen images, requests, responses, or action content. With a production HTTPS URL and provider credentials, the Gmail and Notion chips can open browser-based OAuth instead of asking the customer to paste tokens.

Disconnecting **Cloud** in Diya revokes that desktop's server-side device token before clearing it locally.

See [Diya Cloud setup](cloud/README.md) and the [deployment runbook](cloud/DEPLOY.md). Production deployment still needs your HTTPS domain plus Google and Notion OAuth application credentials; the code is ready, but those real callback registrations cannot be invented locally.

## Run from source

```powershell
cd <your-clone>
npm install
npm start
```

Use the gear button in Diya to connect OpenAI without a terminal. Developers can instead set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` before launching. The hotkey, cursor companion, local demonstration response, on-screen guide, hover inspection, and approval UI can be tested without a key; live visual reasoning and OpenAI transcription need one.

## Controls

- `Ctrl` + `Shift` + `Space` — capture the current display and activate Diya's small second cursor; press it again to open the ask panel.
- `Ctrl` + `Shift` + `G` — advance to the next on-screen guide step.
- `Esc` — dismiss the guide, then Diya and its in-memory screen context.
- **Voice button** — start and stop a spoken request.

## Package a portable Windows app

```powershell
npm run check
npm run dist
```

The portable artifact is written to `dist\Diya 0.11.0.exe`.

## Submission material

- [Devpost submission copy](SUBMISSION.md)
- [Under-three-minute demo script](DEMO_SCRIPT.md)
- [MIT license](LICENSE)
