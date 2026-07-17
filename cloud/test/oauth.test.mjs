import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import http from "node:http";
import test from "node:test";
import { OrbitDatabase } from "../src/database.mjs";
import { activeConnection } from "../src/oauth.mjs";
import { createOrbitServer } from "../src/server.mjs";

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function json(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  return { status: response.status, body: await response.json() };
}

test("runs one-time Gmail and Notion OAuth callbacks without storing provider tokens in plaintext", async () => {
  const exchanges = [];
  const provider = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    exchanges.push({ path: request.url, body: Buffer.concat(chunks).toString("utf8"), authorization: request.headers.authorization || "" });
    response.writeHead(200, { "Content-Type": "application/json" });
    if (request.url === "/google/token" && !Buffer.concat(chunks).toString("utf8").includes("grant_type=refresh_token")) return response.end(JSON.stringify({ access_token: "google-access", refresh_token: "google-refresh", expires_in: 3600 }));
    if (request.url === "/notion/token") return response.end(JSON.stringify({ access_token: "notion-access" }));
    return response.end(JSON.stringify({ access_token: "google-refreshed", expires_in: 3600 }));
  });
  const providerUrl = await listen(provider);
  const database = new OrbitDatabase(":memory:");
  const config = {
    bootstrapCode: "test-pairing-code-with-enough-length",
    encryptionKey: randomBytes(32),
    openaiApiKey: "",
    responsesUrl: "http://unused.test/v1/responses",
    model: "gpt-5.6",
    requestLimit: 30,
    requestWindowMs: 600_000,
    allowedOrigins: new Set(),
    publicUrl: "http://127.0.0.1:8787",
    oauthStateTtlMs: 600_000,
    google: { clientId: "google-client", clientSecret: "google-secret", authorizeUrl: `${providerUrl}/google/authorize`, tokenUrl: `${providerUrl}/google/token`, redirectUri: "http://127.0.0.1:8787/oauth/gmail/callback" },
    notion: { clientId: "notion-client", clientSecret: "notion-secret", authorizeUrl: `${providerUrl}/notion/authorize`, tokenUrl: `${providerUrl}/notion/token`, redirectUri: "http://127.0.0.1:8787/oauth/notion/callback" }
  };
  const cloud = createOrbitServer({ config, database });
  const cloudUrl = await listen(cloud);
  try {
    const paired = await json(cloudUrl, "/v1/device-sessions", { method: "POST", body: JSON.stringify({ bootstrapCode: config.bootstrapCode }) });
    const auth = { Authorization: `Bearer ${paired.body.accessToken}` };
    const gmailStart = await json(cloudUrl, "/v1/oauth/gmail/start", { method: "POST", headers: auth, body: "{}" });
    const gmailUrl = new URL(gmailStart.body.authorizationUrl);
    assert.equal(gmailUrl.searchParams.get("scope"), "https://www.googleapis.com/auth/gmail.compose");
    assert.equal(gmailUrl.searchParams.get("code_challenge_method"), "S256");
    const gmailCallback = await fetch(`${cloudUrl}/oauth/gmail/callback?state=${encodeURIComponent(gmailUrl.searchParams.get("state"))}&code=google-code`);
    const gmailCallbackText = await gmailCallback.text();
    assert.equal(gmailCallback.status, 200, gmailCallbackText);
    assert.match(gmailCallbackText, /Gmail connected/);
    const replay = await fetch(`${cloudUrl}/oauth/gmail/callback?state=${encodeURIComponent(gmailUrl.searchParams.get("state"))}&code=google-code`);
    assert.equal(replay.status, 400);
    const notionStart = await json(cloudUrl, "/v1/oauth/notion/start", { method: "POST", headers: auth, body: "{}" });
    const notionUrl = new URL(notionStart.body.authorizationUrl);
    assert.equal(notionUrl.searchParams.get("owner"), "user");
    const notionCallback = await fetch(`${cloudUrl}/oauth/notion/callback?state=${encodeURIComponent(notionUrl.searchParams.get("state"))}&code=notion-code`);
    assert.equal(notionCallback.status, 200);
    const me = await json(cloudUrl, "/v1/me", { headers: auth });
    assert.deepEqual(me.body.connectors, { gmail: true, notion: true });
    const gmailStored = database.getConnection(paired.body.device.id, "gmail");
    const notionStored = database.getConnection(paired.body.device.id, "notion");
    assert.equal(gmailStored.accessToken.includes("google-access"), false);
    assert.equal(gmailStored.refreshToken.includes("google-refresh"), false);
    assert.equal(notionStored.accessToken.includes("notion-access"), false);
    database.updateConnectionMetadata(paired.body.device.id, "gmail", { connectionSource: "oauth", tokenExpiresAt: new Date(Date.now() - 1_000).toISOString() });
    const refreshed = await activeConnection({ provider: "gmail", deviceId: paired.body.device.id, config, database });
    assert.equal(refreshed.accessToken, "google-refreshed");
    assert.equal(exchanges.filter((entry) => entry.path === "/google/token").length, 2);
    assert.match(exchanges.find((entry) => entry.path === "/notion/token").authorization, /^Basic /);
  } finally {
    database.close();
    await close(cloud);
    await close(provider);
  }
});
