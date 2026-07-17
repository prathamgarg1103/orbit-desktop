import { HttpError } from "./errors.mjs";

function sanitizeText(value, length) {
  return String(value || "").replace(/\0/g, "").trim().slice(0, length);
}

function gmailRaw(action) {
  const lines = [
    `To: ${sanitizeText(action.to, 320)}`,
    `Subject: ${sanitizeText(action.subject, 160)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    sanitizeText(action.body, 8_000)
  ];
  return Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
}

async function createNotionPage(action, accessToken, metadata) {
  const parentPageId = sanitizeText(metadata?.parentPageId, 128);
  if (!parentPageId) throw new HttpError(409, "The connected Notion workspace needs a parent page ID.", "notion_parent_required");
  const title = sanitizeText(action.title, 120) || "Orbit agent note";
  const content = sanitizeText(action.content, 6_000) || "Orbit agent brief";
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Notion-Version": "2026-03-11", "Content-Type": "application/json" },
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: { title: { title: [{ text: { content: title } }] } },
      children: content.split(/\n{2,}/).filter(Boolean).slice(0, 20).map((paragraph) => ({ object: "block", type: "paragraph", paragraph: { rich_text: [{ type: "text", text: { content: paragraph.slice(0, 1_800) } }] } }))
    }),
    signal: AbortSignal.timeout(20_000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, body.message || `Notion returned ${response.status}.`, "notion_error");
  return { message: "Notion page created.", url: body.url || "" };
}

async function createGmailDraft(action, accessToken) {
  const recipient = sanitizeText(action.to, 320);
  if (!/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/i.test(recipient)) throw new HttpError(400, "The Gmail draft needs a valid recipient email address.", "invalid_recipient");
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { raw: gmailRaw({ ...action, to: recipient }) } }),
    signal: AbortSignal.timeout(20_000)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new HttpError(502, body.error?.message || `Gmail returned ${response.status}.`, "gmail_error");
  return { message: `Draft created for ${recipient}. Orbit did not send it.`, url: "" };
}

export async function executeApprovedAction({ action, connection }) {
  if (action?.kind === "notion_create_page") return createNotionPage(action, connection.accessToken, connection.metadata);
  if (action?.kind === "gmail_draft") return createGmailDraft(action, connection.accessToken);
  throw new HttpError(400, "Orbit does not support that approved action.", "unsupported_action");
}
