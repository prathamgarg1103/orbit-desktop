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
    DIYA_DATABASE_URL: "postgresql://postgres.project:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require",
    DIYA_MODEL: "gpt-5.6-mini",
    DIYA_MONTHLY_SCREEN_GUIDE_LIMIT: "75",
    DIYA_MONTHLY_APPROVED_ACTION_LIMIT: "12"
  });
  assert.equal(diya.host, "0.0.0.0");
  assert.equal(diya.port, 9898);
  assert.equal(diya.databasePath, ":memory:");
  assert.match(diya.databaseUrl, /^postgresql:\/\//);
  assert.equal(diya.model, "gpt-5.6-mini");
  assert.equal(diya.screenGuideMonthlyLimit, 75);
  assert.equal(diya.approvedActionMonthlyLimit, 12);

  const legacy = loadConfig({
    ORBIT_ENCRYPTION_KEY: key(),
    ORBIT_BOOTSTRAP_CODE: "legacy-bootstrap-code-with-enough-length",
    ORBIT_DATABASE_PATH: ":memory:"
  });
  assert.equal(legacy.databasePath, ":memory:");
  assert.equal(legacy.bootstrapCode, "legacy-bootstrap-code-with-enough-length");
});

test("rejects a non-Postgres managed database URL", () => {
  assert.throws(() => loadConfig({
    DIYA_ENCRYPTION_KEY: key(),
    DIYA_BOOTSTRAP_CODE: "diya-bootstrap-code-with-enough-length",
    DIYA_DATABASE_URL: "https://database.example.com"
  }), /DIYA_DATABASE_URL/);
});
