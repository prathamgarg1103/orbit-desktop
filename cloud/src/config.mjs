import path from "node:path";
import { HttpError } from "./errors.mjs";

function environmentValue(env, name) {
  const legacyName = name.startsWith("DIYA_") ? `ORBIT_${name.slice("DIYA_".length)}` : "";
  return env[name] ?? (legacyName ? env[legacyName] : undefined);
}

function required(env, name) {
  const value = String(environmentValue(env, name) || "").trim();
  if (!value) throw new HttpError(500, `${name} must be configured before Diya Cloud starts.`, "configuration_error");
  return value;
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function normalizedPublicUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  let url;
  try { url = new URL(text); } catch { throw new HttpError(500, "DIYA_PUBLIC_URL must be a valid URL.", "configuration_error"); }
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new HttpError(500, "DIYA_PUBLIC_URL must use HTTPS outside local development.", "configuration_error");
  }
  return url.origin;
}

function oauthProvider(env, publicUrl, prefix, defaults) {
  const clientId = String(env[`${prefix}_OAUTH_CLIENT_ID`] || "").trim();
  const clientSecret = String(env[`${prefix}_OAUTH_CLIENT_SECRET`] || "").trim();
  if (!clientId && !clientSecret) return null;
  if (!publicUrl || !clientId || !clientSecret) {
    throw new HttpError(500, `${prefix} OAuth needs DIYA_PUBLIC_URL, ${prefix}_OAUTH_CLIENT_ID, and ${prefix}_OAUTH_CLIENT_SECRET.`, "configuration_error");
  }
  return {
    clientId,
    clientSecret,
    authorizeUrl: String(env[`${prefix}_OAUTH_AUTHORIZE_URL`] || defaults.authorizeUrl).trim(),
    tokenUrl: String(env[`${prefix}_OAUTH_TOKEN_URL`] || defaults.tokenUrl).trim(),
    redirectUri: `${publicUrl}/oauth/${defaults.provider}/callback`
  };
}

export function loadConfig(env = process.env) {
  const encryptionKey = Buffer.from(required(env, "DIYA_ENCRYPTION_KEY"), "base64");
  if (encryptionKey.length !== 32) {
    throw new HttpError(500, "DIYA_ENCRYPTION_KEY must decode to exactly 32 bytes.", "configuration_error");
  }

  const bootstrapCode = required(env, "DIYA_BOOTSTRAP_CODE");
  if (bootstrapCode.length < 16) {
    throw new HttpError(500, "DIYA_BOOTSTRAP_CODE must be at least 16 characters.", "configuration_error");
  }

  const databasePath = String(environmentValue(env, "DIYA_DATABASE_PATH") || "./data/diya-cloud.sqlite").trim();
  const model = String(environmentValue(env, "DIYA_MODEL") || "gpt-5.6").trim();
  const publicUrl = normalizedPublicUrl(environmentValue(env, "DIYA_PUBLIC_URL"));
  return Object.freeze({
    host: String(environmentValue(env, "DIYA_HOST") || "127.0.0.1").trim(),
    port: boundedInt(environmentValue(env, "DIYA_PORT"), 8787, 1, 65535),
    databasePath: databasePath === ":memory:" ? databasePath : path.resolve(process.cwd(), databasePath),
    encryptionKey,
    bootstrapCode,
    openaiApiKey: String(env.OPENAI_API_KEY || "").trim(),
    responsesUrl: String(environmentValue(env, "DIYA_RESPONSES_URL") || "https://api.openai.com/v1/responses").replace(/\/+$/, ""),
    model,
    requestLimit: boundedInt(environmentValue(env, "DIYA_REQUEST_LIMIT"), 30, 1, 500),
    requestWindowMs: boundedInt(environmentValue(env, "DIYA_REQUEST_WINDOW_MS"), 10 * 60 * 1000, 10_000, 3_600_000),
    screenGuideMonthlyLimit: boundedInt(environmentValue(env, "DIYA_MONTHLY_SCREEN_GUIDE_LIMIT"), 250, 1, 10_000),
    approvedActionMonthlyLimit: boundedInt(environmentValue(env, "DIYA_MONTHLY_APPROVED_ACTION_LIMIT"), 25, 1, 10_000),
    waitlistRequestLimit: boundedInt(environmentValue(env, "DIYA_WAITLIST_REQUEST_LIMIT"), 5, 1, 50),
    waitlistWindowMs: boundedInt(environmentValue(env, "DIYA_WAITLIST_WINDOW_MS"), 15 * 60 * 1000, 10_000, 3_600_000),
    allowedOrigins: new Set(String(environmentValue(env, "DIYA_ALLOWED_ORIGINS") || "").split(",").map((item) => item.trim()).filter(Boolean)),
    publicUrl,
    oauthStateTtlMs: boundedInt(environmentValue(env, "DIYA_OAUTH_STATE_TTL_MS"), 10 * 60 * 1000, 60_000, 60 * 60 * 1000),
    google: oauthProvider(env, publicUrl, "GOOGLE", { provider: "gmail", authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth", tokenUrl: "https://oauth2.googleapis.com/token" }),
    notion: oauthProvider(env, publicUrl, "NOTION", { provider: "notion", authorizeUrl: "https://api.notion.com/v1/oauth/authorize", tokenUrl: "https://api.notion.com/v1/oauth/token" })
  });
}
