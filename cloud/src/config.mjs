import path from "node:path";
import { HttpError } from "./errors.mjs";

function required(env, name) {
  const value = String(env[name] || "").trim();
  if (!value) throw new HttpError(500, `${name} must be configured before Orbit Cloud starts.`, "configuration_error");
  return value;
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

export function loadConfig(env = process.env) {
  const encryptionKey = Buffer.from(required(env, "ORBIT_ENCRYPTION_KEY"), "base64");
  if (encryptionKey.length !== 32) {
    throw new HttpError(500, "ORBIT_ENCRYPTION_KEY must decode to exactly 32 bytes.", "configuration_error");
  }

  const bootstrapCode = required(env, "ORBIT_BOOTSTRAP_CODE");
  if (bootstrapCode.length < 16) {
    throw new HttpError(500, "ORBIT_BOOTSTRAP_CODE must be at least 16 characters.", "configuration_error");
  }

  const databasePath = String(env.ORBIT_DATABASE_PATH || "./data/orbit-cloud.sqlite").trim();
  const model = String(env.ORBIT_MODEL || "gpt-5.6").trim();
  return Object.freeze({
    host: String(env.ORBIT_HOST || "127.0.0.1").trim(),
    port: boundedInt(env.ORBIT_PORT, 8787, 1, 65535),
    databasePath: databasePath === ":memory:" ? databasePath : path.resolve(process.cwd(), databasePath),
    encryptionKey,
    bootstrapCode,
    openaiApiKey: String(env.OPENAI_API_KEY || "").trim(),
    responsesUrl: String(env.ORBIT_RESPONSES_URL || "https://api.openai.com/v1/responses").replace(/\/+$/, ""),
    model,
    requestLimit: boundedInt(env.ORBIT_REQUEST_LIMIT, 30, 1, 500),
    requestWindowMs: boundedInt(env.ORBIT_REQUEST_WINDOW_MS, 10 * 60 * 1000, 10_000, 3_600_000),
    allowedOrigins: new Set(String(env.ORBIT_ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean))
  });
}
