import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import http from "node:http";
import test from "node:test";
import { DiyaDatabase } from "../src/database.mjs";
import { createDiyaServer } from "../src/server.mjs";

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  return { status: response.status, body: await response.json() };
}

test("pairs a desktop, encrypts connectors, and returns a private screen guide", async () => {
  const captured = [];
  const openai = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    captured.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ output_text: JSON.stringify({ response: "Use the highlighted button.", steps: [{ title: "Open settings", detail: "Start here.", x: 220, y: 540 }] }) }));
  });
  const openaiUrl = await listen(openai);
  const database = new DiyaDatabase(":memory:");
  const config = {
    bootstrapCode: "test-pairing-code-with-enough-length",
    encryptionKey: randomBytes(32),
    openaiApiKey: "sk-test",
    responsesUrl: `${openaiUrl}/v1/responses`,
    model: "gpt-5.6",
    requestLimit: 30,
    requestWindowMs: 600_000,
    allowedOrigins: new Set()
  };
  const cloud = createDiyaServer({ config, database });
  const cloudUrl = await listen(cloud);
  try {
    assert.equal((await request(cloudUrl, "/health")).body.ok, true);
    assert.equal((await request(cloudUrl, "/v1/device-sessions", { method: "POST", body: JSON.stringify({ bootstrapCode: "wrong" }) })).status, 401);
    const paired = await request(cloudUrl, "/v1/device-sessions", { method: "POST", body: JSON.stringify({ bootstrapCode: config.bootstrapCode, deviceName: "Test desktop" }) });
    assert.equal(paired.status, 201);
    const token = paired.body.accessToken;
    const auth = { Authorization: `Bearer ${token}` };
    const connected = await request(cloudUrl, "/v1/connectors/notion", { method: "PUT", headers: auth, body: JSON.stringify({ accessToken: "secret-notion-token", metadata: { parentPageId: "page-123" } }) });
    assert.equal(connected.body.connectors.notion, true);
    const stored = database.getConnection(paired.body.device.id, "notion");
    assert.equal(stored.accessToken.includes("secret-notion-token"), false);
    const guide = await request(cloudUrl, "/v1/screen-guides", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ request: "What should I click?", mode: "agent", focus: { x: 200, y: 500 }, screenImage: "data:image/jpeg;base64,aGVsbG8=" })
    });
    assert.equal(guide.status, 200);
    assert.equal(guide.body.steps[0].target.x, 220);
    assert.equal(captured.length, 1);
    assert.equal(captured[0].store, false);
    assert.equal(captured[0].input[0].content[1].detail, "original");
    assert.deepEqual(captured[0].tools, [{ type: "web_search" }]);
    assert.equal(typeof captured[0].text.format.schema, "object");
    const usage = await request(cloudUrl, "/v1/usage", { headers: auth });
    assert.equal(usage.body.usage.requests, 1);
    const revoked = await request(cloudUrl, "/v1/me/device", { method: "DELETE", headers: auth });
    assert.equal(revoked.body.revoked, true);
    assert.equal((await request(cloudUrl, "/v1/me", { headers: auth })).status, 401);
  } finally {
    database.close();
    await close(cloud);
    await close(openai);
  }
});
