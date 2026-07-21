# Diya beta launch plan

This plan starts after the hackathon submission is uploaded. Its job is to turn the working Diya prototype into a small, controlled beta without pretending the product is broader than it is.

## Current launch posture

- Desktop prototype: ready for a local Windows demo.
- Public site: live at `https://diya-cloud.vercel.app`.
- GitHub release: `v0.11.1` with the Windows app and hackathon bundle.
- Cloud API: implemented, but not production-green until `DIYA_DATABASE_URL` and `OPENAI_API_KEY` are configured in Vercel.
- Product promise to keep: Diya is a small second cursor that sees the current screen only after the hotkey, teaches the next step in-place, and runs connected agents only after approval.

## Week 0: finish the production spine

1. Add the Supabase transaction pooler URL to Vercel as `DIYA_DATABASE_URL`.
2. Add the OpenAI project key to Vercel as `OPENAI_API_KEY`.
3. Redeploy Diya Cloud.
4. Verify:
   - `npm run submission:check:cloud`
   - `https://diya-cloud.vercel.app/health` returns `ok: true` and `openaiConfigured: true`
   - one desktop pairs with a one-time code
   - one screen guide returns real model output
   - one approved Notion page or Gmail draft action works with test credentials
5. Turn the landing page waitlist from "being connected" into a working beta request form.

## Week 1: private beta with 5 users

- Invite only people who can test inside real tools: FL Studio, code editors, Notion, Gmail, browser admin tools, design tools, or dense school/work software.
- Keep monthly limits conservative: 250 screen guides and 25 approved actions per device.
- Ask every user to try one "I am stuck" moment and one "Diya agent" moment.
- Review feedback daily with `npm run admin -- feedback list --status new` from a properly configured Cloud operator environment.
- Track only aggregate usage: waitlist count, invites consumed, active devices, guide requests, approved actions, and feedback count.

## Week 2: make it feel reliable

- Fix any guide target issues where Diya points near the right place but not exactly enough.
- Improve the small second cursor only if users notice it as distracting or unclear.
- Add one-click log export for local debugging, with no screenshots or prompts included by default.
- Decide whether voice is reliable enough to lead the demo, or whether typed Talk should remain the primary path.
- Add explicit "screen captured once" state in the desktop UI if users are unsure when Diya sees context.

## Week 3: agent usefulness

- Narrow agents to two dependable jobs:
  - create a Notion page from the current task context
  - create a Gmail draft from the current task context
- Keep sending email out of scope.
- Add a review screen that shows what tool will be touched, what content will be written, and which account is connected.
- Measure approved action completion rate, not just clicks.

## Week 4: startup decision

Use the first beta to answer these questions:

- Do users reach for Diya at the moment they are stuck, or only when prompted?
- Is the second cursor easier to understand than a chat window?
- Do users trust hotkey-only screen context?
- Which app category creates the strongest "I need this" reaction?
- Are agents valuable, or is guided learning the real wedge?

Continue only if at least three beta users independently ask to keep using Diya after the test week.

## Do not claim yet

- Always-on screen understanding.
- Fully autonomous agents.
- Gmail sending.
- Enterprise compliance.
- Mac support.
- Production OAuth readiness until Google and Notion app reviews, redirect URLs, support contacts, and data-policy pages are complete.

## Submission links

- Public site: `https://diya-cloud.vercel.app`
- Release: `https://github.com/prathamgarg1103/orbit-desktop/releases/tag/v0.11.1`
- Windows app: `https://github.com/prathamgarg1103/orbit-desktop/releases/download/v0.11.1/Diya.0.11.1.exe`
- Submission bundle: `https://github.com/prathamgarg1103/orbit-desktop/releases/download/v0.11.1/Diya-hackathon-submission.zip`
