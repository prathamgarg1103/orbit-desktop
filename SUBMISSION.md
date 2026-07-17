# Orbit — submission kit

## Paste-ready entry

- **Name:** Orbit
- **Tagline:** A second cursor that sees your current screen, teaches the next step, and launches approval-first agents.
- **Category:** Work & Productivity
- **Built with:** Codex, GPT-5.6, OpenAI Responses API, OpenAI speech-to-text, Electron, Node.js, SQLite, JavaScript, HTML/CSS

## Description

Orbit is a cursor-native desktop companion for the instant a person gets stuck. In FL Studio, Claude Code, a browser, or another unfamiliar app, press `Ctrl` + `Shift` + `Space`. Orbit captures that current display once and appears as a small second cursor beside the real pointer. As the person moves, Orbit can identify the accessible control under the pointer, so the interaction stays grounded in the actual interface instead of a detached chat window.

In **Talk**, a person asks a question by voice or text. GPT-5.6 reasons over the explicit hotkey capture and returns a short response plus screen coordinates for the important next steps. Choosing **Guide me** draws a click-through target ring, guide cursor, and instruction bubble directly over the app; `Ctrl` + `Shift` + `G` advances through the steps.

**Agent** mode turns a request into an approval-first task. It can consult current public information when necessary, then proposes connected actions. With a test Notion connection, an approved agent can create a child page; with a scoped Gmail OAuth token, it can create a draft. It never sends email or takes an external action without a distinct approval click.

Privacy is a product feature: Orbit is inactive and invisible until the user presses the hotkey. The screen image exists only for that active session and is cleared on close. Hover inspection reads only the Windows text accessibility label while the companion is active; it is not a continuous image capture. The optional Orbit Cloud service keeps the product OpenAI key and connector tokens out of the desktop process, encrypts connector values at rest, records only aggregate usage counters, and sends one screen image to the API with response storage disabled.

Orbit is an original name, visual system, and implementation inspired by the screen-native assistant category, not an affiliated or branded Heyclicky clone.

## Judge testing notes

1. Run `npm install` and `npm start` in this directory, or use `dist\Orbit 0.6.0.exe` after building.
2. Place another application on screen and press `Ctrl` + `Shift` + `Space`.
3. Move the pointer over controls to see Orbit's compact hover context, then ask a Talk question and choose **Guide me**.
4. Press `Ctrl` + `Shift` + `G` to advance the guide. Press `Esc` to close it and clear the active session.
5. Switch to **Agent** and ask for a task. Use the settings gear to connect test Notion or Gmail credentials; actions require approval and Gmail only creates drafts.
6. For live visual reasoning and OpenAI transcription, use the in-app OpenAI connection before testing. The production-shaped alternative is [Orbit Cloud](cloud/README.md): pair the desktop with a one-time code so the server owns the product OpenAI key.

## Final submission fields to add yourself

- Public repository URL or the required private sharing arrangement.
- A public demo video URL under the event limit.
- The Codex feedback/session identifier from your build task, if the event asks for it.
- Actual team and eligibility fields.
