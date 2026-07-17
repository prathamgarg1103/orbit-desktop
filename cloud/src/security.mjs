import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

export function now() {
  return new Date().toISOString();
}

export function newId() {
  return randomUUID();
}

export function issueAccessToken() {
  return `orb_live_${randomBytes(32).toString("base64url")}`;
}

export function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
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
