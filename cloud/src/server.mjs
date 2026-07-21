import http from "node:http";
import { executeApprovedAction } from "./agent-actions.mjs";
import { HttpError, asHttpError } from "./errors.mjs";
import { launchPage, privacyPage, statusPage, PUBLIC_PAGE_CSP } from "./landing.mjs";
import { activeConnection, completeOAuth, oauthErrorPage, startOAuth } from "./oauth.mjs";
import { createScreenGuide } from "./screen-guide.mjs";
import { hash, issueAccessToken, keyedHash, safeEqual, seal } from "./security.mjs";

const MAX_JSON_BYTES = 14 * 1024 * 1024;
const PROVIDERS = new Set(["gmail", "notion"]);
const FEEDBACK_CATEGORIES = new Set(["bug", "idea", "general"]);

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

function sendPublicHtml(response, status, html) {
  response.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy": PUBLIC_PAGE_CSP,
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });
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

function normalizedEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Enter a valid email address.", "invalid_email");
  }
  return email;
}

function feedbackCategory(value) {
  const category = String(value || "general").trim().toLowerCase();
  if (!FEEDBACK_CATEGORIES.has(category)) throw new HttpError(400, "Feedback category must be bug, idea, or general.", "invalid_feedback_category");
  return category;
}

function checkOrigin(request, config) {
  const origin = request.headers.origin;
  if (origin && !config.allowedOrigins.has(origin)) throw new HttpError(403, "This origin is not allowed to call Diya Cloud.", "origin_not_allowed");
}

function requestUrl(request) {
  const url = new URL(request.url || "/", "http://diya.local");
  // Vercel rewrites public paths to one Node function. The marker is removed
  // before normal routing so the desktop and OAuth callback keep their public
  // URLs unchanged.
  const rewrittenPath = url.searchParams.get("diyaPath");
  if (rewrittenPath !== null) {
    url.pathname = `/${rewrittenPath.replace(/^\/+/, "")}`;
    url.searchParams.delete("diyaPath");
  }
  return url;
}

function bearerToken(request) {
  const header = String(request.headers.authorization || "");
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) throw new HttpError(401, "A desktop access token is required.", "authentication_required");
  return match[1];
}

async function authenticate(request, database) {
  const token = bearerToken(request);
  const device = await database.findDeviceByTokenHash(hash(token));
  if (!device || device.revokedAt) throw new HttpError(401, "This desktop access token is not valid.", "invalid_token");
  await database.touchDevice(device.id);
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
    if (entry.count > config.requestLimit) throw new HttpError(429, "Diya Cloud is receiving requests too quickly. Please try again shortly.", "rate_limited");
  };
}

function createPublicRateLimiter(config) {
  const entries = new Map();
  const limit = config.waitlistRequestLimit || 5;
  const windowMs = config.waitlistWindowMs || 15 * 60 * 1000;
  return (request) => {
    if (entries.size > 10_000) entries.clear();
    const forwardedFor = String(request.headers["x-forwarded-for"] || "");
    const key = (forwardedFor.split(",")[0] || request.socket.remoteAddress || "unknown").trim().slice(0, 200);
    const now = Date.now();
    const entry = entries.get(key) || { startedAt: now, count: 0 };
    if (now - entry.startedAt >= windowMs) { entry.startedAt = now; entry.count = 0; }
    entry.count += 1;
    entries.set(key, entry);
    if (entry.count > limit) throw new HttpError(429, "Please wait a few minutes before trying again.", "rate_limited");
  };
}

function billingPeriod() {
  const current = new Date();
  return new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1)).toISOString();
}

function quotaLimits(config) {
  return {
    screenGuide: config.screenGuideMonthlyLimit || 250,
    approvedAction: config.approvedActionMonthlyLimit || 25
  };
}

async function quotaUsage(database, deviceId, config, periodStart = billingPeriod()) {
  const limits = quotaLimits(config);
  const screenGuides = await database.usageCountSince(deviceId, "screen_guide", periodStart);
  const approvedActions = await database.usageCountSince(deviceId, "approved_action", periodStart);
  return {
    periodStart,
    screenGuides: { used: screenGuides, limit: limits.screenGuide, remaining: Math.max(0, limits.screenGuide - screenGuides) },
    approvedActions: { used: approvedActions, limit: limits.approvedAction, remaining: Math.max(0, limits.approvedAction - approvedActions) }
  };
}

async function reserveQuota(database, deviceId, kind, config) {
  const periodStart = billingPeriod();
  const limits = quotaLimits(config);
  const limit = kind === "screen_guide" ? limits.screenGuide : limits.approvedAction;
  const reservation = await database.reserveMonthlyUsage({ deviceId, kind, limit, periodStart, model: kind === "screen_guide" ? config.model : null });
  if (!reservation) {
    const label = kind === "screen_guide" ? "screen guidance" : "approved agent actions";
    throw new HttpError(429, `This device has used its monthly ${label} allowance. It resets at the start of the next UTC month.`, "monthly_quota_reached");
  }
  return reservation;
}

export function createDiyaHandler({ config, database }) {
  const limit = createRateLimiter(config);
  const limitPublic = createPublicRateLimiter(config);
  return async (request, response) => {
    try {
      const url = requestUrl(request);
      const path = url.pathname;
      if (request.method === "GET" && path === "/") return sendPublicHtml(response, 200, launchPage());
      if (request.method === "GET" && path === "/privacy") return sendPublicHtml(response, 200, privacyPage());
      if (request.method === "GET" && path === "/status") return sendPublicHtml(response, 200, statusPage());
      if (request.method === "POST" && path === "/v1/waitlist") {
        limitPublic(request);
        const email = normalizedEmail((await readJson(request)).email);
        await database.upsertWaitlistEntry({
          emailHash: keyedHash(email, config.encryptionKey),
          encryptedEmail: seal(email, config.encryptionKey),
          source: "launch-page"
        });
        return sendJson(response, 202, { accepted: true });
      }
      checkOrigin(request, config);
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
        return sendJson(response, 200, { ok: true, service: "diya-cloud", openaiConfigured: Boolean(config.openaiApiKey), now: new Date().toISOString() });
      }
      if (request.method === "POST" && path === "/v1/device-sessions") {
        const body = await readJson(request);
        const code = stringValue(body.enrollmentCode || body.inviteCode || body.bootstrapCode, "enrollmentCode", 500);
        const invited = safeEqual(code, config.bootstrapCode) ? null : await database.consumeInvite(hash(code));
        if (!safeEqual(code, config.bootstrapCode) && !invited) throw new HttpError(401, "The enrollment code is not valid.", "invalid_enrollment_code");
        const accessToken = issueAccessToken();
        const device = await database.createDevice({ name: String(body.deviceName || "Diya desktop").slice(0, 100), tokenHash: hash(accessToken), enrollmentInviteId: invited?.id || null });
        return sendJson(response, 201, { accessToken, device, enrollment: invited ? { source: "invite", label: invited.label } : { source: "bootstrap" } });
      }
      if (request.method === "GET" && path === "/v1/me") {
        const device = await authenticate(request, database);
        return sendJson(response, 200, { device: { id: device.id, name: device.name, createdAt: device.createdAt }, connectors: await database.connectorStatus(device.id) });
      }
      if (request.method === "DELETE" && path === "/v1/me/device") {
        const device = await authenticate(request, database);
        await database.revokeDevice(device.id);
        return sendJson(response, 200, { revoked: true });
      }
      if (request.method === "GET" && path === "/v1/usage") {
        const device = await authenticate(request, database);
        return sendJson(response, 200, { usage: await database.usageSummary(device.id), quota: await quotaUsage(database, device.id, config) });
      }
      if (request.method === "POST" && path === "/v1/feedback") {
        const device = await authenticate(request, database);
        limit(device.id);
        const body = await readJson(request);
        const message = stringValue(body.message, "feedback", 2_000);
        const feedback = await database.createFeedback({
          deviceId: device.id,
          category: feedbackCategory(body.category),
          encryptedMessage: seal(message, config.encryptionKey)
        });
        return sendJson(response, 202, { accepted: true, feedback });
      }
      const oauthStartMatch = /^\/v1\/oauth\/(gmail|notion)\/start$/.exec(path);
      if (oauthStartMatch && request.method === "POST") {
        const device = await authenticate(request, database);
        limit(device.id);
        return sendJson(response, 200, await startOAuth({ provider: oauthStartMatch[1], deviceId: device.id, config, database }));
      }
      if (request.method === "POST" && path === "/v1/screen-guides") {
        const device = await authenticate(request, database);
        limit(device.id);
        const body = await readJson(request);
        const requestText = stringValue(body.request, "request", 1_500);
        const mode = body.mode === "agent" ? "agent" : "coach";
        const reservation = await reserveQuota(database, device.id, "screen_guide", config);
        let result;
        try {
          result = await createScreenGuide({ config, request: requestText, mode, screenImage: body.screenImage, focus: body.focus, deviceId: device.id });
        } catch (error) {
          await database.cancelUsageReservation(reservation.id);
          throw error;
        }
        await database.completeUsageReservation(reservation.id, { model: config.model, imageBytes: result.imageBytes });
        return sendJson(response, 200, { mode, demo: false, text: result.text, steps: result.steps });
      }
      const connectorMatch = /^\/v1\/connectors\/(gmail|notion)$/.exec(path);
      if (connectorMatch && request.method === "PUT") {
        const device = await authenticate(request, database);
        const provider = connectorMatch[1];
        const body = await readJson(request);
        const accessToken = stringValue(body.accessToken, "accessToken", 10_000);
        const refreshToken = body.refreshToken ? stringValue(body.refreshToken, "refreshToken", 10_000) : "";
        const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
        await database.putConnection(device.id, provider, {
          accessToken: seal(accessToken, config.encryptionKey),
          refreshToken: refreshToken ? seal(refreshToken, config.encryptionKey) : "",
          metadata
        });
        return sendJson(response, 200, { connectors: await database.connectorStatus(device.id) });
      }
      if (connectorMatch && request.method === "PATCH") {
        const device = await authenticate(request, database);
        const body = await readJson(request);
        const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
        if (!await database.updateConnectionMetadata(device.id, connectorMatch[1], metadata)) throw new HttpError(409, "Connect this provider in the browser before saving its settings.", "connector_required");
        return sendJson(response, 200, { connectors: await database.connectorStatus(device.id) });
      }
      if (connectorMatch && request.method === "DELETE") {
        const device = await authenticate(request, database);
        await database.deleteConnection(device.id, connectorMatch[1]);
        return sendJson(response, 200, { connectors: await database.connectorStatus(device.id) });
      }
      if (request.method === "POST" && path === "/v1/actions/execute") {
        const device = await authenticate(request, database);
        limit(device.id);
        const body = await readJson(request);
        const action = body.action;
        const provider = action?.kind === "gmail_draft" ? "gmail" : action?.kind === "notion_create_page" ? "notion" : "";
        if (!PROVIDERS.has(provider)) throw new HttpError(400, "Diya does not support that approved action.", "unsupported_action");
        const reservation = await reserveQuota(database, device.id, "approved_action", config);
        let result;
        try {
          result = await executeApprovedAction({ action, connection: await activeConnection({ provider, deviceId: device.id, config, database }) });
        } catch (error) {
          await database.cancelUsageReservation(reservation.id);
          throw error;
        }
        await database.completeUsageReservation(reservation.id);
        return sendJson(response, 200, result);
      }
      throw new HttpError(404, "Diya Cloud could not find that endpoint.", "not_found");
    } catch (error) {
      const safe = asHttpError(error);
      return sendJson(response, safe.status, { error: { code: safe.code, message: safe.message } });
    }
  };
}

export function createDiyaServer(options) {
  return http.createServer(createDiyaHandler(options));
}
