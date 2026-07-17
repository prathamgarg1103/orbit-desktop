# Orbit

Orbit is an original, hotkey-activated desktop companion for getting unstuck in any app. It is a feature-level homage to the useful category Heyclicky demonstrates; it does not reuse Heyclicky's name, artwork, copy, or code.

Press `Ctrl` + `Shift` + `Space` from FL Studio, Claude Code, a browser, or any other desktop tool. Orbit captures the current display once, opens a temporary companion, and lets you either Talk about what is on screen or start an Agent task.

## What works

- **Talk:** Ask a spoken or typed question about the display. With the in-app OpenAI connection, Orbit sends that single hotkey-authorized image to the Responses API and returns spoken, numbered guidance.
- **Show me on screen:** Choose this after an answer and Orbit draws a temporary, click-through callout layer with the steps. Nothing follows the cursor while you work.
- **Agents:** Describe a task normally or begin a voice request with “Orbit agent.” The agent makes a plan and waits for an explicit approval before an external effect.
- **Notion:** In the UI, paste a Notion integration token and an allowed parent-page ID. An approved agent can create a child page there.
- **Gmail:** In the UI, paste a scoped Gmail OAuth access token. An approved agent can create a Gmail draft; it never sends email.
- **Voice:** With a configured OpenAI key, the Speak button records push-to-talk audio and transcribes it with `gpt-4o-mini-transcribe`. Without one, Chromium speech recognition is used when available.

## Privacy model

Orbit never captures the desktop in the background or keeps a floating pointer overlay. It captures only after the global hotkey, hides itself before the capture, and holds the resulting image only while that Orbit session is open. `Esc` or the close button dismisses the session and clears the in-memory image. The annotation layer is created only when you choose **Show me on screen** and is click-through.

Connector credentials are stored through Electron `safeStorage`, which uses the operating system's encrypted credential service. The app does not put them in renderer code or source control.

## Run from source

```powershell
cd E:\projects\codex\orbit-desktop
npm install
npm start
```

Use the **OpenAI · connect** chip inside Orbit to store an API key through your operating system's encrypted credential service — no terminal is required. Developers may instead set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` before launching. The basic hotkey, local demonstration response, temporary drawing overlay, connector setup, and approval UI can all be inspected without a key; live screen reasoning and OpenAI transcription need one.

## Controls

- `Ctrl` + `Shift` + `Space` — capture the current display and open Orbit.
- `Esc` — dismiss an on-screen guide first, then dismiss Orbit and clear the screen context.
- **Speak** — press to begin voice input; press again to stop recording when live transcription is configured.

## Build a portable Windows app

```powershell
npm run check
npm run dist
```

The portable artifact is written to `dist\Orbit 0.3.0.exe`.

## Submission material

- [Devpost submission copy](SUBMISSION.md)
- [Under-three-minute demo script](DEMO_SCRIPT.md)
- [MIT license](LICENSE)
