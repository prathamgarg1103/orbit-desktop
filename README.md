# Orbit Cursor Vision

Orbit is an original Windows cursor companion. It is not affiliated with or branded as Heyclicky.

When you enable **Cursor Vision**, Orbit becomes a small click-through orb near the pointer. Pause over an app control and it reads the accessible Windows UI Automation label, then explains what that element is for. With a configured OpenAI key, it also analyzes a small, one-time cursor-area image so it can understand unlabeled icons and custom UI. It has no chat window, does not block clicks, and does not drive the mouse or keyboard.

## Controls

- `Ctrl` + `Shift` + `Space` - turn Cursor Vision on or off.
- `Ctrl` + `Shift` + `O` - show or hide the overlay.

## Privacy model

Orbit only inspects elements after you explicitly turn Cursor Vision on. It hides the contents of password fields. Without an API key it reads Windows accessibility metadata only. With `OPENAI_API_KEY`, it sends the opted-in metadata and a temporary 480x320 cursor-area crop to the OpenAI Responses API for that hover only - never a continuous capture or a stored recording. Without a key it uses an offline local explanation.

## Run

```powershell
cd E:\projects\codex\orbit-desktop
npm install
npm start
```

For GPT-5.6 explanations, set a key in the same terminal before starting:

```powershell
$env:OPENAI_API_KEY = "your_api_key"
$env:OPENAI_MODEL = "gpt-5.6"
npm start
```

The API key stays in Electron's main process, not renderer code.

## Submission resources

- [Devpost copy and judge notes](SUBMISSION.md)
- [Under-three-minute demo script](DEMO_SCRIPT.md)
- [MIT license](LICENSE)

## Build a portable Windows executable

```powershell
npm run dist
```

The portable artifact is written to `dist\Orbit Cursor Vision 0.2.0.exe`. It includes the local Windows UI Automation worker used by Cursor Vision.
