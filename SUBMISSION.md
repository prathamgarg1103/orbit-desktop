# Orbit Cursor Vision - Devpost submission kit

## Paste-ready entry

- **Name:** Orbit Cursor Vision
- **Tagline:** Hover any accessible control and understand it without leaving your flow.
- **Category:** Work & Productivity
- **Built with:** Codex, GPT-5.6, OpenAI Responses API, Electron, Windows UI Automation, JavaScript, HTML/CSS

## Description

Orbit Cursor Vision is a hover-first AI companion for the moments where a person is stuck inside an unfamiliar interface. Turn it on with `Ctrl` + `Shift` + `Space`, then pause the pointer over a control, label, dialog, or input. A small click-through orb follows the cursor, reads the Windows accessibility metadata beneath it, and explains the element in place. In live mode it pairs that metadata with a small, temporary cursor-area image, so it can also explain unlabeled icons and custom UI.

Orbit is deliberately not another chat window. It stays out of the work surface, never captures focus, and never asks the person to reconstruct a UI manually. Cursor Vision is off by default, password values are hidden, and Orbit never clicks, types, buys, or changes anything on the user's behalf.

With `OPENAI_API_KEY` configured, Orbit sends the opted-in metadata and one temporary 480x320 cursor-area crop to GPT-5.6 through the OpenAI Responses API for a concise explanation. The API key remains in Electron's main process. It does not continuously record the screen. Without an API key, the same hover interaction works with a local fallback explanation so a judge can test the core product immediately.

Orbit is an original name, visual system, and implementation inspired by the useful category of in-the-moment desktop assistants. It does not reuse Heyclicky's brand, copy, or code.

## Judge testing notes

1. Install Node.js 22+.
2. Run `npm install` and `npm start` from this directory, or use a locally built portable executable from `npm run dist`.
3. Press `Ctrl` + `Shift` + `Space`.
4. Hover an ordinary app control and pause briefly.
5. To test GPT-powered visual context, set `OPENAI_API_KEY` before starting the app.

## Required submission details to add yourself

- Public repository URL, or private repository shared with the required judges.
- Public under-three-minute demo video URL.
- Codex `/feedback` session ID from the build task.
- Your real individual/team and country eligibility fields.
