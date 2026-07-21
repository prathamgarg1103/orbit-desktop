# Diya evidence-gated product roadmap

This roadmap keeps Diya from becoming a pile of assistant features. Every stage must earn the next one through beta evidence.

## North star

Diya should help a person continue inside the app where they are stuck, without moving the work into a separate chat window.

## Stage 0: submission-ready prototype

Status: current.

What must remain true:

- one hotkey starts screen context
- Diya appears as a small second cursor, not a persistent floating panel
- help is drawn over the current tool
- connected actions require approval
- Gmail creates drafts only
- no background screen watching claim

Do not expand scope before hosted Cloud pairing is green.

## Stage 1: first 10-user beta

Goal: prove that people reach for Diya during real stuck moments.

Build only:

- fixes for wrong target coordinates
- fixes for misunderstood screen context
- clearer "Diya sees this screen once" trust UI
- smoother Cloud pairing and invite flow
- one reliable feedback path

Evidence required to move on:

- 10 invited Windows testers
- at least 7 complete one screen-guide session
- at least 3 use Diya again without being prompted
- at least 3 can correctly explain when Diya sees the screen

If repeat use is weak, narrow to the strongest workflow category before adding more integrations.

## Stage 2: wedge workflow

Goal: make Diya excellent for one category instead of vaguely useful for all software.

Candidate wedges:

- developer tools: Claude Code, VS Code, GitHub, terminals
- creator tools: FL Studio, Figma, Blender, Premiere
- work ops: Notion, Gmail, dashboards, admin portals

Pick the wedge with the strongest beta signal:

- fastest aha moment
- most repeat use
- clearest willingness to keep Diya installed
- least privacy anxiety

Build only:

- better prompts and target heuristics for that wedge
- examples and demo script for that wedge
- one dependable approved agent action inside that workflow

## Stage 3: agent reliability

Goal: make approved actions feel useful enough to trust.

Build only after screen guidance has repeat use.

Allowed actions:

- create Notion page
- create Gmail draft
- prepare structured task plan

Not allowed yet:

- sending email
- deleting or modifying existing user content
- hidden background automation
- broad "do anything" agent mode

Evidence required:

- at least 5 approved actions completed by beta users
- no user reports surprise about what Diya changed
- users can preview action content before approval

## Stage 4: public beta readiness

Goal: turn the private beta into a controlled public beta.

Required before public beta:

- hosted Cloud health is green
- OAuth provider setup and review requirements are understood
- support and security docs are linked
- privacy page accurately matches implementation
- monthly usage limits protect model spend
- issue templates and feedback flow are active
- one repeat-use wedge is proven

Still do not build:

- payments
- enterprise admin
- Mac app
- public marketplace integrations

## Stage 5: business model test

Only test pricing after repeat use exists.

Possible first pricing test:

- free: limited screen guides per month
- paid beta: higher guide limit plus approved agent actions

Do not charge for generic AI chat. Charge only if Diya saves time inside real software.

## Kill or narrow conditions

Narrow the product if:

- people like the demo but do not use it again
- users trust Talk but not agents
- pointer guidance is useful only in one app category
- privacy anxiety blocks adoption

Pause the startup path if:

- fewer than 3 of first 10 beta users ask to keep using it
- Cloud pairing is too hard for testers
- Diya repeatedly points at wrong controls in the chosen wedge

## Next immediate product milestone

Get hosted Cloud pairing fully green, invite 10 Windows testers, and collect the first 10 beta learning issues.
