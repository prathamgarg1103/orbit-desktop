# Diya beta outreach kit

Use this only after `npm run submission:check:cloud` passes. Keep the beta small and personal; the goal is learning, not scale.

## Who to invite first

Invite people who already get stuck inside complex tools and can test on Windows:

- producers using FL Studio, Ableton, or plugin-heavy workflows
- developers using Claude Code, VS Code, GitHub, terminals, or dashboards
- operators using Notion, Gmail, CRMs, internal admin tools, or data portals
- creators using Figma, Blender, Premiere, Canva, or dense web tools

Do not invite people who only want "another AI chat." Diya's wedge is screen-native help inside the current tool.

## Short DM

```text
hey — I built Diya, a small AI cursor for when you get stuck inside an app.

You press a hotkey, it sees that screen once, and you can ask out loud. It can point at the interface or prepare a Notion/Gmail action, but it asks before doing anything.

I’m testing it with a tiny Windows beta. Would you try it in one tool you actually use and tell me where it breaks?
```

## Invite email

```text
Subject: Diya beta invite

Hey <name>,

Here is your Diya beta invite.

Download:
https://github.com/prathamgarg1103/orbit-desktop/releases/download/v0.11.1/Diya.0.11.1.exe

Cloud URL:
https://diya-cloud.vercel.app

Invite code:
<invite-code>

Try it in one real tool where you usually get stuck. Press Ctrl + Shift + Space, move your cursor over the confusing part, then ask Diya what to do.

Privacy boundary: Diya only captures the screen after the hotkey. It does not watch in the background.

After trying it, please send one feedback note from Settings: what worked, what confused you, and whether you would use it again.
```

## First-session script

Ask these before they start:

1. What app should Diya help with today?
2. What task are you trying to finish?
3. Where do you usually get stuck?

Ask these after the first session:

1. Did Diya help you continue without leaving the app?
2. Did the second cursor feel helpful, distracting, or confusing?
3. Did you understand when Diya could see your screen?
4. Would you use it again this week without me reminding you?
5. What one thing should I fix first?

## Follow-up after 24 hours

```text
Quick check — did you reach for Diya again after the first test?

If yes: what were you doing?
If no: what stopped you — forgot it existed, didn’t trust it, bad answer, wrong pointer, or not useful enough?
```

## Feedback buckets

When feedback comes in, tag it manually:

- `targeting`: coordinates or pointer felt wrong
- `context`: Diya misunderstood the screen
- `trust`: user was unsure what Diya saw or would do
- `workflow`: user did not know when to invoke it
- `agent`: Notion/Gmail action was not valuable or clear
- `voice`: speech input failed or felt awkward

## Success signal

A beta user counts as a strong signal only if they use Diya again without being prompted or ask to keep using it after the first session.
