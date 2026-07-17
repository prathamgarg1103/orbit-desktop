import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

export function now() {
  return new Date().toISOString();
}

export function newId() {
  return randomUUID();
}

export function issueAccessToken() {
  return `diya_live_${randomBytes(32).toString("base64url")}`;
}

export function issueInviteCode() {
  return `diya_invite_${randomBytes(18).toString("base64url")}`;
}

export function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function signState(payload, key) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", key).update("diya-oauth-state-v1").update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyState(value, key) {
  const [encoded, signature] = String(value || "").split(".");
  if (!encoded || !signature) throw new Error("Invalid OAuth state.");
  const expected = createHmac("sha256", key).update("diya-oauth-state-v1").update(encoded).digest("base64url");
  if (!safeEqual(signature, expected)) throw new Error("Invalid OAuth state.");
  let payload;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); } catch { throw new Error("Invalid OAuth state."); }
  if (!payload?.provider || !payload?.deviceId || !Number.isFinite(payload?.expiresAt) || payload.expiresAt < Date.now()) {
    throw new Error("OAuth state has expired. Start the connection again.");
  }
  return payload;
}

export function seal(plaintext, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function unseal(payload, key) {
  const [version, ivText, tagText, ciphertextText] = String(payload || "").split(".");
  if (version !== "v1" || !ivText || !tagText || !ciphertextText) throw new Error("Invalid encrypted connector value.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivText, "base64url"));
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
}
