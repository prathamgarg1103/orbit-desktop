# Orbit

Orbit is an original Windows desktop companion for getting unstuck inside any app. It is inspired by the screen-native assistant category, but uses its own name, visual system, copy, and implementation.

Press `Ctrl` + `Shift` + `Space` from FL Studio, Claude Code, a browser, or any other desktop tool. Orbit captures that display once, then appears as a small second cursor beside your real one. As you move, it can identify the accessible control under the pointer. Ask by voice or text and it gives a concise response plus coordinate-aware next steps that it can draw directly on the current screen.

## What works

- **Cursor-native companion:** Orbit is absent until the hotkey. While a session is active, its compact companion follows beside the real pointer and reads the text-only Windows accessibility label under it.
- **Talk:** Ask a spoken or typed question about the hotkey-authorized screen. Connect OpenAI directly for the hackathon build, or pair Orbit Cloud so the desktop never holds the product API key. Either path returns a structured answer with up to four screen targets.
- **Guide on screen:** Choose **Guide me** to show a temporary, click-through guide cursor, target ring, and instruction bubble. Press `Ctrl` + `Shift` + `G` for the next step.
- **Agents:** Describe a task naturally, or begin a voice request with `Orbit agent`. Agent mode can use current public web information when needed, then proposes any Gmail or Notion action for explicit approval.
- **Notion and Gmail:** Paste a Notion integration token with an allowed parent page, or a scoped Gmail OAuth access token, in the in-app settings. With Cloud connected, those credentials are encrypted server-side instead of being retained in the desktop. Approved agents create a Notion child page or Gmail draft; Orbit never sends email.
- **Voice:** With OpenAI connected, Orbit records push-to-talk audio and transcribes it with `gpt-4o-mini-transcribe`. Chromium speech recognition is used as a local fallback when available.

## Privacy boundary

Orbit does not watch or record the screen in the background. It captures the display only after the hotkey, hides itself before capture, and clears that in-memory image when the session is closed. The text-only hover label is queried only while the companion is active; it is not a screenshot stream. `Esc` dismisses the guide first, then Orbit and its screen context.

Connector credentials are stored through Electron `safeStorage`, using the operating system's encrypted credential service. They are not placed in renderer code or source control.

## Orbit Cloud: the startup path

The `cloud` service is a separately deployable Node + SQLite API for the production product. Pair the desktop in the Connections gear using a server URL and one-time bootstrap code; it receives a revocable device token, then sends hotkey screen-guide requests to the server. Cloud holds the OpenAI project key, encrypts Gmail/Notion tokens at rest, supports aggregate per-device usage, rate limits requests, and executes only desktop-approved actions. It never persists screen images, requests, responses, or action content.

See [Orbit Cloud setup](cloud/README.md). Production deployment still needs your HTTPS domain plus Google and Notion OAuth application credentials; their redirect flows cannot be honestly enabled before those real credentials and callback URLs exist.

## Run from source

```powershell
cd E:\projects\codex\orbit-desktop
npm install
npm start
```

Use the gear button in Orbit to connect OpenAI without a terminal. Developers can instead set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` before launching. The hotkey, cursor companion, local demonstration response, on-screen guide, hover inspection, and approval UI can be tested without a key; live visual reasoning and OpenAI transcription need one.

## Controls

- `Ctrl` + `Shift` + `Space` — capture the current display and activate Orbit.
- `Ctrl` + `Shift` + `G` — advance to the next on-screen guide step.
- `Esc` — dismiss the guide, then Orbit and its in-memory screen context.
- **Voice button** — start and stop a spoken request.

## Package a portable Windows app

```powershell
npm run check
npm run dist
```

The portable artifact is written to `dist\Orbit 0.5.0.exe`.

## Submission material

- [Devpost submission copy](SUBMISSION.md)
- [Under-three-minute demo script](DEMO_SCRIPT.md)
- [MIT license](LICENSE)
