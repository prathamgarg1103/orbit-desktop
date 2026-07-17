# Orbit — submission kit

## Paste-ready entry

- **Name:** Orbit
- **Tagline:** Press a hotkey, ask about any app, and get a guide drawn on the screen.
- **Category:** Work & Productivity
- **Built with:** Codex, GPT-5.6, OpenAI Responses API, OpenAI speech-to-text, Electron, JavaScript, HTML/CSS

## Description

Orbit is an in-the-moment desktop companion for the exact instant a person gets stuck. In FL Studio, Claude Code, a browser, or any unfamiliar app, press `Ctrl` + `Shift` + `Space`. Orbit captures that current display once, opens a small temporary conversation, and lets the person ask a question naturally by voice or text. It can then draw a concise, click-through guide on top of the screen to point out the next steps.

Orbit has two intentionally different modes. **Talk** is a conversation about the current screen: it explains what is visible and gives short, practical steps. **Agents** turns a natural-language task into an approval-first plan. After an in-app connection, an approved Notion agent can create a page and an approved Gmail agent can create a draft. Gmail is deliberately draft-only; no agent sends mail or performs an external action without a separate approval click.

The privacy boundary is central to the product. Orbit is absent while the person works. It does not continuously watch the screen and it does not use a cursor-following overlay. The display is captured only after the hotkey, Orbit hides itself before that capture, and the image stays in memory only for the open Orbit session. The “Show me on screen” layer appears only on explicit request and does not receive clicks.

With an in-app OpenAI connection, Orbit sends the explicit hotkey capture to GPT-5.6 through the Responses API and transcribes push-to-talk voice with `gpt-4o-mini-transcribe`. Keys stay in the Electron main process and are saved through the operating system's encrypted credential store.

Orbit is an original name, visual system, and implementation inspired by the product category, not an affiliated or branded Heyclicky clone.

## Judge testing notes

1. Run `npm install` and `npm start` in this directory, or use `dist\Orbit 0.3.0.exe` after building.
2. Press `Ctrl` + `Shift` + `Space` while another application is visible.
3. In **Talk**, ask what to do next. Choose **Show me on screen** to see the temporary guidance layer.
4. In **Agents**, describe a task. Connect Notion or Gmail from the in-app chips to exercise the approval UI. Use test credentials and a test parent page; Gmail actions create drafts only.
5. For live visual reasoning and OpenAI transcription, use the in-app **OpenAI · connect** chip before testing.

## Final submission fields to add yourself

- Public repository URL or the required private sharing arrangement.
- A public demo video URL under the event limit.
- The Codex feedback/session identifier from your build task, if the event asks for it.
- Actual team and eligibility fields.
