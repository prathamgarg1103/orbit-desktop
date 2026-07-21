# Diya beta support

Diya is currently a small Windows beta. Support is intentionally lightweight and focused on learning from real use.

## Before reporting

- Do not paste OpenAI keys, Supabase passwords, Gmail/Notion tokens, invite codes, or private screen content into GitHub issues.
- If a screenshot includes private information, crop or redact it first.
- If the issue involves a security concern, use `SECURITY.md` instead of a public issue.

## Where to report

- Reproducible bug or broken behavior: use the GitHub `Diya beta bug` issue template.
- Product learning from a beta session: use the `Diya beta learning` issue template.
- Public beta issue link: https://github.com/prathamgarg1103/orbit-desktop/issues/new/choose

## What to include

- Diya version, currently `0.11.1`.
- Windows version.
- App or workflow being tested.
- Whether Diya was using local OpenAI settings or paired Diya Cloud.
- The smallest steps that reproduce the issue.
- What you expected Diya to do.

## Current beta boundary

- Diya is Windows-only.
- Gmail support creates drafts; it does not send email.
- Cloud pairing is live only after `DIYA_DATABASE_URL` and `OPENAI_API_KEY` are configured in Vercel.
- Google and Notion OAuth public launch requires provider app configuration and review readiness.
