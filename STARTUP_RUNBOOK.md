# Diya startup runbook

This runbook starts after the hackathon submission is uploaded. The goal is not to look like a large company; it is to run a controlled beta that proves whether Diya should become one.

## Operating principle

Diya wins only if people reach for it at the moment they are stuck inside real software. Do not optimize for generic chatbot usage. Optimize for: hotkey, screen context, second cursor, on-screen guidance, and approval-first agents.

## Launch gate

Do not invite external beta users until all of these pass:

```powershell
npm run check
npm run submission:check:cloud
```

Live Cloud must show:

```json
{ "ok": true, "openaiConfigured": true }
```

If `/health` lists missing environment variables, run:

```powershell
.\scripts\configure-vercel-production.ps1 -BuildSupabaseUrlFromPassword -IncludeOpenAIKey -Redeploy -Verify
```

## First 10 beta users

Pick users who are already wrestling with dense tools:

- music production: FL Studio, Ableton, plugins
- coding: Claude Code, VS Code, terminals, GitHub
- creative ops: Figma, Canva, Premiere, Blender
- work systems: Notion, Gmail, dashboards, admin portals

Avoid people who only want a general assistant. The first wedge is "help me inside the tool I am already using."

## Onboarding script

1. Ask what tool they often get stuck in.
2. Give them the Windows beta download and one invite code.
3. Tell them the privacy boundary in one sentence: "Diya only sees the screen after the hotkey; it does not watch in the background."
4. Ask them to perform one real task while Diya is active.
5. Ask for one feedback note from Settings immediately after the session.

Create invites from the Cloud operator environment:

```bash
npm run admin -- invite create --label "beta-001" --expires-days 14
```

For waitlist users:

```bash
npm run admin -- waitlist list --status requested
npm run admin -- waitlist invite --id <entry-id> --label "beta-001" --expires-days 14
```

## Daily operator loop

Run this once per day during beta:

```bash
npm run admin -- metrics overview
npm run admin -- feedback list --status new
```

Then sort every issue into one of four buckets:

- targeting: Diya points to the wrong place
- context: Diya misunderstands the screen
- trust: user is unsure what Diya saw or will do
- agent value: connected action is not useful enough

Only fix bugs that improve one of these four buckets.

## Metrics that matter

Track these manually for the first 10 users:

- activation: user pairs Cloud and completes one screen guide
- aha moment: user says Diya helped them continue without leaving the app
- trust: user can explain when Diya sees the screen
- repeat use: user uses Diya again without being prompted
- agent approval: user approves a Notion page or Gmail draft

Ignore vanity metrics until there is repeat use.

## Week-one decision rule

Continue toward a startup only if at least three of the first ten users independently ask to keep using Diya after their first session.

If not, narrow the product. Pick the strongest app category from the beta and make Diya excellent there before expanding.

## What not to build yet

- always-on screen monitoring
- email sending
- broad autonomous agents
- enterprise admin
- Mac support
- payment flow
- public OAuth launch before provider review requirements are understood

## Investor/founder one-liner

Diya is a screen-native AI companion for people stuck inside complex software: press a hotkey, ask out loud, and it points at the interface or prepares an approved agent action without watching in the background.
