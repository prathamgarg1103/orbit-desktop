# Diya security policy

Diya is a beta desktop companion and Cloud service. Please treat security reports carefully because the product can touch screen context and optional connector credentials.

## Supported version

| Version | Supported |
| --- | --- |
| 0.11.1 beta | Yes |

## Please do not disclose publicly

Do not post any of the following in a public issue:

- OpenAI API keys
- Supabase database passwords or connection strings
- Vercel environment values
- Gmail or Notion tokens
- Diya Cloud invite codes or desktop access tokens
- screenshots containing private user data

## Reporting a security issue

For now, open a GitHub issue only with a minimal, non-sensitive summary and mark it as a security concern. Do not include exploit details, credentials, private screenshots, or tokens in the first message.

If private security reporting is later enabled on the repository, use that channel instead. Before a broad public launch, Diya should add a dedicated security contact and private disclosure process.

## Security boundaries in the current beta

- Screen capture starts only after the hotkey and is cleared when the active session closes.
- Diya Cloud sends screen images to the OpenAI API with response storage disabled and does not persist images, prompts, or model answers.
- Local credentials use Electron `safeStorage`.
- Cloud connector tokens, waitlist emails, and feedback notes are encrypted at rest.
- Gmail actions create drafts only.
- Connected actions require explicit desktop approval.

## Operator rule

Never ask beta users to send secrets through chat, issues, email, screenshots, or support messages. Secrets belong only in OS credential storage, local ignored env files, Vercel environment variables, or provider dashboards.
