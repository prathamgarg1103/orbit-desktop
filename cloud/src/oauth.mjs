import { createHash, randomBytes } from "node:crypto";
import { HttpError } from "./errors.mjs";
import { newId, seal, signState, unseal, verifyState } from "./security.mjs";

const GMAIL_COMPOSE_SCOPE = "https://www.googleapis.com/auth/gmail.compose";

function providerConfig(config, provider) {
  const settings = provider === "gmail" ? config.google : provider === "notion" ? config.notion : null;
  if (!settings) throw new HttpError(503, `${provider === "gmail" ? "Google Gmail" : "Notion"} OAuth is not configured on Diya Cloud yet.`, "oauth_not_configured");
  return settings;
}

function readMetadata(stored) {
  try { return JSON.parse(stored?.metadataJson || "{}"); } catch { return {}; }
}

function codeVerifier() {
  return randomBytes(48).toString("base64url");
}

function codeChallenge(verifier) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function redirectPage(title, detail, isError = false) {
  const color = isError ? "#c62f40" : "#155eef";
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f8fb;color:#152033;font:16px system-ui}.card{max-width:430px;background:#fff;border:1px solid #e5e9f0;border-radius:20px;padding:28px;box-shadow:0 18px 50px #26345118}h1{font-size:22px;margin:0 0 10px;color:${color}}p{line-height:1.5;margin:0;color:#526074}</style><main class="card"><h1>${escape(title)}</h1><p>${escape(detail)}</p></main></html>`;
}

async function exchangeGoogle(code, verifier, settings) {
  const body = new URLSearchParams({
    code,
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    redirect_uri: settings.redirectUri,
    grant_type: "authorization_code",
    code_verifier: verifier
  });
  const response = await fetch(settings.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(20_000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new HttpError(502, payload.error_description || payload.error || "Google could not complete the Gmail connection.", "oauth_exchange_failed");
  return { accessToken: payload.access_token, refreshToken: payload.refresh_token || "", expiresIn: Number(payload.expires_in) || 0 };
}

async function exchangeNotion(code, settings) {
  const response = await fetch(settings.tokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${settings.clientId}:${settings.clientSecret}`, "utf8").toString("base64")}`
    },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: settings.redirectUri }),
    signal: AbortSignal.timeout(20_000)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) throw new HttpError(502, payload.error || payload.message || "Notion could not complete the connection.", "oauth_exchange_failed");
  return { accessToken: payload.access_token, refreshToken: "", expiresIn: 0 };
}

export function startOAuth({ provider, deviceId, config, database }) {
  const settings = providerConfig(config, provider);
  const nonce = newId();
  const verifier = provider === "gmail" ? codeVerifier() : "notion-oauth";
  const expiresAt = Date.now() + config.oauthStateTtlMs;
  database.createOAuthState({ nonce, deviceId, provider, encryptedVerifier: seal(verifier, config.encryptionKey), expiresAt });
  const state = signState({ provider, deviceId, nonce, expiresAt }, config.encryptionKey);
  const url = new URL(settings.authorizeUrl);
  if (provider === "gmail") {
    url.search = new URLSearchParams({
      client_id: settings.clientId,
      redirect_uri: settings.redirectUri,
      response_type: "code",
      scope: GMAIL_COMPOSE_SCOPE,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      code_challenge: codeChallenge(verifier),
      code_challenge_method: "S256",
      state
    }).toString();
  } else {
    url.search = new URLSearchParams({
      owner: "user",
      client_id: settings.clientId,
      redirect_uri: settings.redirectUri,
      response_type: "code",
      state
    }).toString();
  }
  return { authorizationUrl: url.toString(), expiresAt };
}

export async function completeOAuth({ provider, state, code, config, database }) {
  let signed;
  try { signed = verifyState(state, config.encryptionKey); } catch (error) { throw new HttpError(400, error.message, "invalid_oauth_state"); }
  if (signed.provider !== provider) throw new HttpError(400, "OAuth provider mismatch.", "invalid_oauth_state");
  const pending = database.consumeOAuthState(signed.nonce);
  if (!pending || pending.provider !== provider || pending.deviceId !== signed.deviceId || pending.expiresAt < Date.now()) {
    throw new HttpError(400, "OAuth state has expired. Start the connection again.", "invalid_oauth_state");
  }
  const settings = providerConfig(config, provider);
  const verifier = unseal(pending.encryptedVerifier, config.encryptionKey);
  const token = provider === "gmail" ? await exchangeGoogle(code, verifier, settings) : await exchangeNotion(code, settings);
  const existing = database.getConnection(pending.deviceId, provider);
  const metadata = readMetadata(existing);
  if (provider === "gmail" && token.expiresIn) metadata.tokenExpiresAt = new Date(Date.now() + token.expiresIn * 1000).toISOString();
  metadata.connectionSource = "oauth";
  const refreshToken = token.refreshToken || (existing?.refreshToken ? unseal(existing.refreshToken, config.encryptionKey) : "");
  database.putConnection(pending.deviceId, provider, {
    accessToken: seal(token.accessToken, config.encryptionKey),
    refreshToken: refreshToken ? seal(refreshToken, config.encryptionKey) : "",
    metadata
  });
  return { html: redirectPage(`${provider === "gmail" ? "Gmail" : "Notion"} connected`, "You can close this tab and return to Diya. Actions will still require your approval in the desktop app.") };
}

export async function activeConnection({ provider, deviceId, config, database }) {
  const stored = database.getConnection(deviceId, provider);
  if (!stored) throw new HttpError(409, `Connect ${provider === "gmail" ? "Gmail" : "Notion"} in Diya Cloud before approving this action.`, "connector_required");
  const metadata = readMetadata(stored);
  let accessToken = unseal(stored.accessToken, config.encryptionKey);
  const refreshToken = stored.refreshToken ? unseal(stored.refreshToken, config.encryptionKey) : "";
  const expiresAt = Date.parse(metadata.tokenExpiresAt || "");
  if (provider === "gmail" && refreshToken && Number.isFinite(expiresAt) && expiresAt < Date.now() + 60_000) {
    const settings = providerConfig(config, "gmail");
    const body = new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" });
    const response = await fetch(settings.tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(20_000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) throw new HttpError(502, payload.error_description || payload.error || "Google could not refresh the Gmail connection.", "oauth_refresh_failed");
    accessToken = payload.access_token;
    metadata.tokenExpiresAt = new Date(Date.now() + (Number(payload.expires_in) || 3600) * 1000).toISOString();
    database.putConnection(deviceId, provider, { accessToken: seal(accessToken, config.encryptionKey), refreshToken: seal(refreshToken, config.encryptionKey), metadata });
  }
  return { accessToken, refreshToken, metadata };
}

export function oauthErrorPage(message) {
  return redirectPage("Connection was not completed", String(message || "Please return to Diya and try again."), true);
}
