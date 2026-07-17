import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectDeployment } from "../src/preflight.mjs";

function environment(databasePath) {
  return {
    DIYA_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    DIYA_BOOTSTRAP_CODE: "deployment-bootstrap-code-with-enough-length",
    DIYA_DATABASE_PATH: databasePath,
    OPENAI_API_KEY: "sk-test-never-print-this-value",
    DIYA_PUBLIC_URL: "https://cloud.example.com",
    DIYA_DOMAIN: "cloud.example.com"
  };
}

test("reports a migration-validated production environment without exposing secrets", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "diya-preflight-"));
  try {
    const result = await inspectDeployment({ env: environment(path.join(directory, "cloud.sqlite")) });
    assert.equal(result.ready, true);
    assert.equal(result.environment.publicUrl, "https://cloud.example.com");
    assert.equal(result.optional.gmailOAuth, "not configured");
    assert.equal(result.checks.every((item) => item.passed), true);
    assert.equal(JSON.stringify(result).includes("sk-test-never-print-this-value"), false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("blocks launch when the model key or public domain contract is incomplete", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "diya-preflight-invalid-"));
  try {
    const env = environment(path.join(directory, "cloud.sqlite"));
    delete env.OPENAI_API_KEY;
    env.DIYA_DOMAIN = "other.example.com";
    const result = await inspectDeployment({ env });
    assert.equal(result.ready, false);
    assert.equal(result.checks.find((item) => item.name === "OpenAI project key").passed, false);
    assert.equal(result.checks.find((item) => item.name === "domain alignment").passed, false);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
