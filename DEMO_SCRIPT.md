# Orbit Cursor Vision demo script (under three minutes)

## 0:00-0:20 - The problem

Show an unfamiliar toolbar control or settings panel.

Voiceover: "When I am stuck in an interface, getting help means finding a chat, taking a screenshot, and explaining what I can see. Orbit meets me at the exact element I am trying to understand."

## 0:20-0:55 - The interaction

Start Orbit. Press `Ctrl` + `Shift` + `Space`. Hover harmless controls in File Explorer or a browser, pausing briefly on each.

Voiceover: "Orbit is not another floating chat window. It is a click-through companion that follows the cursor. When I intentionally turn Cursor Vision on, I pause over a control and get an explanation in place. My mouse still works normally underneath it."

## 0:55-1:25 - Context without manual setup

Hover a button, navigation item, and text field. Do not show passwords or sensitive information.

Voiceover: "I do not have to attach a screenshot or manually describe every button. Orbit reads Windows accessibility metadata beneath the pointer. In live mode it also uses one small, temporary image around the cursor for icons and custom UI. Password contents are hidden, and the feature is off until I choose the hotkey."

## 1:25-1:55 - GPT-5.6 and the fallback

Show a concise live explanation with `OPENAI_API_KEY` configured, then point to the local fallback in code.

Voiceover: "GPT-5.6 turns the opted-in metadata and local visual context into a brief explanation of the control's purpose. The key stays in Electron's main process. Without a key, the core hover experience still works in offline mode for a judge."

## 1:55-2:25 - Codex build

Show `main.cjs`, `uia-worker.ps1`, and the README.

Voiceover: "I built Orbit with Codex. Codex helped create the transparent Electron overlay, safe process boundary, Windows UI Automation bridge, cursor-area vision, and GPT-5.6 Responses API path."

## 2:25-2:45 - Close

Turn Cursor Vision off and return to the underlying app.

Voiceover: "Orbit makes interface help available at the moment of confusion without replacing the interface or taking control of the computer."
