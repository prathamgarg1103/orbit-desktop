import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { loadConfig } from "../src/config.mjs";

const key = () => randomBytes(32).toString("base64");

test("prefers Diya configuration names and accepts legacy Orbit migration aliases", () => {
  const diya = loadConfig({
    DIYA_ENCRYPTION_KEY: key(),
    DIYA_BOOTSTRAP_CODE: "diya-bootstrap-code-with-enough-length",
    DIYA_HOST: "0.0.0.0",
    DIYA_PORT: "9898",
    DIYA_DATABASE_PATH: ":memory:",
    DIYA_MODEL: "gpt-5.6-mini"
  });
  assert.equal(diya.host, "0.0.0.0");
  assert.equal(diya.port, 9898);
  assert.equal(diya.databasePath, ":memory:");
  assert.equal(diya.model, "gpt-5.6-mini");

  const legacy = loadConfig({
    ORBIT_ENCRYPTION_KEY: key(),
    ORBIT_BOOTSTRAP_CODE: "legacy-bootstrap-code-with-enough-length",
    ORBIT_DATABASE_PATH: ":memory:"
  });
  assert.equal(legacy.databasePath, ":memory:");
  assert.equal(legacy.bootstrapCode, "legacy-bootstrap-code-with-enough-length");
});
