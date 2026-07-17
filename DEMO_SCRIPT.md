# Diya demo script (under three minutes)

## 0:00–0:20 — The problem

Show FL Studio, Claude Code, or another dense tool.

Voiceover: “When I get stuck in an app, I normally stop, screenshot it, open another chat, and explain the context. Diya gives me help while I am still in the tool.”

## 0:20–0:55 — The second cursor

Show a normal app, press `Ctrl` + `Shift` + `Space`, and move the real pointer over a few controls.

Voiceover: “Diya is invisible while I work. I press one hotkey and it captures this moment only. Then it becomes a small second cursor beside my pointer. It reads the accessible label of what I am pointing at, so I can simply ask about the part of the app that has me stuck.”

## 0:55–1:25 — Talk and guiding

Ask a relevant question with the voice button or type it. Click **Guide me** and advance with `Ctrl` + `Shift` + `G`.

Voiceover: “Talk is the conversation. GPT-5.6 uses the one hotkey-authorized screen image and returns the next steps. If words are not enough, Diya points at the real interface with a guide cursor, target ring, and step-by-step callouts.”

## 1:25–1:55 — Agents and voice

Switch to **Agent**. Say or type: “Diya agent, create a Notion page called launch ideas with these notes.” Show the plan and explicit approval button.

Voiceover: “Agents are tasks. I can spawn one with my voice. Diya may use current public information when the task needs it, but any connected action waits for my approval.”

## 1:55–2:25 — Cloud, connectors, and safety

Open the settings gear. Show the Diya Cloud pairing fields, then the Notion or Gmail setup and, with safe test credentials, approve a Notion page or Gmail draft.

Voiceover: “For the hackathon build, I can connect directly. For the startup path, I pair this desktop with Diya Cloud: the server holds the product OpenAI key and encrypted connector tokens, while this app only receives a revocable device token. Notion creates a page only after approval, and Gmail creates a draft rather than sending mail.”

## 2:25–2:45 — Privacy and implementation

Press `Esc`, then show `main.cjs`, `uia-worker.ps1`, and `guidance.js`.

Voiceover: “Diya does not continuously record my screen. The image exists only for the active hotkey session; the small hover label is text-only and only runs while Diya is active. I built it with Codex, Electron, Node and SQLite, GPT-5.6, OpenAI’s Responses API, and OpenAI speech-to-text.”
