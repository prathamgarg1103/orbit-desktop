import http from "node:http";
import { executeApprovedAction } from "./agent-actions.mjs";
import { HttpError, asHttpError } from "./errors.mjs";
import { activeConnection, completeOAuth, oauthErrorPage, startOAuth } from "./oauth.mjs";
import { createScreenGuide } from "./screen-guide.mjs";
import { hash, issueAccessToken, safeEqual, seal } from "./security.mjs";

const MAX_JSON_BYTES = 14 * 1024 * 1024;
const PROVIDERS = new Set(["gmail", "notion"]);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer"
  });
  response.end(JSON.stringify(body));
}

function sendHtml(response, status, html) {
  response.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY" });
  response.end(html);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) throw new HttpError(413, "Request is too large.", "request_too_large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new HttpError(400, "Request body must be valid JSON.", "invalid_json"); }
}

function stringValue(value, label, maximum) {
  const text = String(value || "").trim();
  if (!text) throw new HttpError(400, `${label} is required.`, "invalid_request");
  if (text.length > maximum) throw new HttpError(400, `${label} is too long.`, "invalid_request");
  return text;
}

function checkOrigin(request, config) {
  const origin = request.headers.origin;
  if (origin && !config.allowedOrigins.has(origin)) throw new HttpError(403, "This origin is not allowed to call Orbit Cloud.", "origin_not_allowed");
}

function bearerToken(request) {
  const header = String(request.headers.authorization || "");
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new HttpError(401, "A desktop access token is required.", "authentication_required");
  return match[1];
}

function authenticate(request, database) {
  const token = bearerToken(request);
  const device = database.findDeviceByTokenHash(hash(token));
  if (!device || device.revokedAt) throw new HttpError(401, "This desktop access token is not valid.", "invalid_token");
  database.touchDevice(device.id);
  return device;
}

function createRateLimiter(config) {
  const entries = new Map();
  return (deviceId) => {
    const now = Date.now();
    const entry = entries.get(deviceId) || { startedAt: now, count: 0 };
    if (now - entry.startedAt >= config.requestWindowMs) { entry.startedAt = now; entry.count = 0; }
    entry.count += 1;
    entries.set(deviceId, entry);
    if (entry.count > config.requestLimit) throw new HttpError(429, "Orbit Cloud is receiving requests too quickly. Please try again shortly.", "rate_limited");
  };
}

export function createOrbitServer({ config, database }) {
  const limit = createRateLimiter(config);
  return http.createServer(async (request, response) => {
    try {
      checkOrigin(request, config);
      const url = new URL(request.url || "/", "http://orbit.local");
      const path = url.pathname;
      const callbackMatch = /^\/oauth\/(gmail|notion)\/callback$/.exec(path);
      if (callbackMatch && request.method === "GET") {
        if (url.searchParams.get("error")) return sendHtml(response, 400, oauthErrorPage(url.searchParams.get("error_description") || url.searchParams.get("error")));
        try {
          const code = stringValue(url.searchParams.get("code"), "authorization code", 4_000);
          const html = await completeOAuth({ provider: callbackMatch[1], state: url.searchParams.get("state"), code, config, database });
          return sendHtml(response, 200, html.html);
        } catch (error) {
          const safe = asHttpError(error);
          return sendHtml(response, safe.status, oauthErrorPage(safe.message));
        }
      }
      if (request.method === "GET" && path === "/health") {
        return sendJson(response, 200, { ok: true, service: "orbit-cloud", openaiConfigured: Boolean(config.openaiApiKey), now: new Date().toISOString() });
      }
      if (request.method === "POST" && path === "/v1/device-sessions") {
        const body = await readJson(request);
        const code = stringValue(body.bootstrapCode, "bootstrapCode", 500);
        if (!safeEqual(code, config.bootstrapCode)) throw new HttpError(401, "The pairing code is not valid.", "invalid_pairing_code");
        const accessToken = issueAccessToken();
        const device = database.createDevice({ name: String(body.deviceName || "Orbit desktop").slice(0, 100), tokenHash: hash(accessToken) });
        return sendJson(response, 201, { accessToken, device });
      }
      if (request.method === "GET" && path === "/v1/me") {
        const device = authenticate(request, database);
        return sendJson(response, 200, { device: { id: device.id, name: device.name, createdAt: device.createdAt }, connectors: database.connectorStatus(device.id) });
      }
      if (request.method === "GET" && path === "/v1/usage") {
        const device = authenticate(request, database);
        return sendJson(response, 200, { usage: database.usageSummary(device.id) });
      }
      const oauthStartMatch = /^\/v1\/oauth\/(gmail|notion)\/start$/.exec(path);
      if (oauthStartMatch && request.method === "POST") {
        const device = authenticate(request, database);
        limit(device.id);
        return sendJson(response, 200, startOAuth({ provider: oauthStartMatch[1], deviceId: device.id, config, database }));
      }
      if (request.method === "POST" && path === "/v1/screen-guides") {
        const device = authenticate(request, database);
        limit(device.id);
        const body = await readJson(request);
        const requestText = stringValue(body.request, "request", 1_500);
        const mode = body.mode === "agent" ? "agent" : "coach";
        const result = await createScreenGuide({ config, request: requestText, mode, screenImage: body.screenImage, focus: body.focus, deviceId: device.id });
        database.recordUsage(device.id, { kind: "screen_guide", model: config.model, imageBytes: result.imageBytes });
        return sendJson(response, 200, { mode, demo: false, text: result.text, steps: result.steps });
      }
      const connectorMatch = /^\/v1\/connectors\/(gmail|notion)$/.exec(path);
      if (connectorMatch && request.method === "PUT") {
        const device = authenticate(request, database);
        const provider = connectorMatch[1];
        const body = await readJson(request);
        const accessToken = stringValue(body.accessToken, "accessToken", 10_000);
        const refreshToken = body.refreshToken ? stringValue(body.refreshToken, "refreshToken", 10_000) : "";
        const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
        database.putConnection(device.id, provider, {
          accessToken: seal(accessToken, config.encryptionKey),
          refreshToken: refreshToken ? seal(refreshToken, config.encryptionKey) : "",
          metadata
        });
        return sendJson(response, 200, { connectors: database.connectorStatus(device.id) });
      }
      if (connectorMatch && request.method === "PATCH") {
        const device = authenticate(request, database);
        const body = await readJson(request);
        const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
        if (!database.updateConnectionMetadata(device.id, connectorMatch[1], metadata)) throw new HttpError(409, "Connect this provider in the browser before saving its settings.", "connector_required");
        return sendJson(response, 200, { connectors: database.connectorStatus(device.id) });
      }
      if (connectorMatch && request.method === "DELETE") {
        const device = authenticate(request, database);
        database.deleteConnection(device.id, connectorMatch[1]);
        return sendJson(response, 200, { connectors: database.connectorStatus(device.id) });
      }
      if (request.method === "POST" && path === "/v1/actions/execute") {
        const device = authenticate(request, database);
        limit(device.id);
        const body = await readJson(request);
        const action = body.action;
        const provider = action?.kind === "gmail_draft" ? "gmail" : action?.kind === "notion_create_page" ? "notion" : "";
        if (!PROVIDERS.has(provider)) throw new HttpError(400, "Orbit does not support that approved action.", "unsupported_action");
        const result = await executeApprovedAction({ action, connection: await activeConnection({ provider, deviceId: device.id, config, database }) });
        database.recordUsage(device.id, { kind: "approved_action" });
        return sendJson(response, 200, result);
      }
      throw new HttpError(404, "Orbit Cloud could not find that endpoint.", "not_found");
    } catch (error) {
      const safe = asHttpError(error);
      return sendJson(response, safe.status, { error: { code: safe.code, message: safe.message } });
    }
  });
}
