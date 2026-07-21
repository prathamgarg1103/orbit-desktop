import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import diya from "../api/diya.js";

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("returns a safe configuration response when the Vercel function has not received its secrets", async () => {
  const names = ["DIYA_ENCRYPTION_KEY", "DIYA_BOOTSTRAP_CODE", "DIYA_DATABASE_URL"];
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  for (const name of names) delete process.env[name];
  const server = http.createServer(diya);
  const url = await listen(server);
  try {
    const homepage = await fetch(url);
    assert.equal(homepage.status, 200);
    const homepageText = await homepage.text();
    assert.match(homepageText, /A second cursor for when software gets <em>opaque/);
    assert.match(homepageText, /Diya\.0\.11\.1\.exe/);
    assert.match(homepageText, /The private beta list is being connected/);
    const privacy = await fetch(`${url}/privacy`);
    assert.equal(privacy.status, 200);
    assert.match(await privacy.text(), /Privacy at a glance/);
    const response = await fetch(`${url}/health`);
    const body = await response.json();
    assert.equal(response.status, 500);
    assert.equal(body.error.code, "configuration_error");
    assert.match(body.error.message, /DIYA_ENCRYPTION_KEY/);
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    await close(server);
  }
});
