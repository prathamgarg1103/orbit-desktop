import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DiyaDatabase } from "../src/database.mjs";
import { runAdmin } from "../src/manage.mjs";
import { keyedHash, seal } from "../src/security.mjs";

function adminEnvironment(databasePath) {
  return {
    DIYA_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    DIYA_BOOTSTRAP_CODE: "operator-bootstrap-code-with-enough-length",
    DIYA_DATABASE_PATH: databasePath
  };
}

test("issues, lists, revokes, and safely converts waitlist requests into one-time invites", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "diya-cloud-admin-"));
  const environment = adminEnvironment(path.join(directory, "cloud.sqlite"));
  try {
    const created = runAdmin({
      args: ["invite", "create", "--label", "first beta user", "--uses", "1", "--expires-days", "7"],
      env: environment,
      write: () => {}
    });
    assert.match(created.code, /^diya_invite_/);
    assert.equal(created.invite.label, "first beta user");
    const listed = runAdmin({ args: ["invite", "list"], env: environment, write: () => {} });
    assert.equal(listed.invites.length, 1);
    assert.equal(Object.hasOwn(listed.invites[0], "code"), false);
    const revoked = runAdmin({ args: ["invite", "revoke", "--id", created.invite.id], env: environment, write: () => {} });
    assert.equal(revoked.revoked, true);
    assert.equal(runAdmin({ args: ["invite", "list"], env: environment, write: () => {} }).invites[0].revokedAt !== null, true);

    const database = new DiyaDatabase(environment.DIYA_DATABASE_PATH);
    const key = Buffer.from(environment.DIYA_ENCRYPTION_KEY, "base64");
    database.upsertWaitlistEntry({
      emailHash: keyedHash("hello@example.com", key),
      encryptedEmail: seal("hello@example.com", key),
      source: "launch-page"
    });
    database.upsertWaitlistEntry({
      emailHash: keyedHash("decline@example.com", key),
      encryptedEmail: seal("decline@example.com", key),
      source: "launch-page"
    });
    database.close();
    const waitlist = runAdmin({ args: ["waitlist", "list"], env: environment, write: () => {} }).waitlist;
    const hello = waitlist.find((entry) => entry.email === "hello@example.com");
    const declined = waitlist.find((entry) => entry.email === "decline@example.com");
    const markedDeclined = runAdmin({ args: ["waitlist", "set-status", "--id", declined.id, "--status", "declined"], env: environment, write: () => {} });
    assert.equal(markedDeclined.updated, true);
    assert.equal(runAdmin({ args: ["waitlist", "set-status", "--id", declined.id, "--status", "requested"], env: environment, write: () => {} }).updated, true);
    const converted = runAdmin({ args: ["waitlist", "invite", "--id", hello.id, "--label", "first waitlist beta", "--expires-days", "14"], env: environment, write: () => {} });
    assert.equal(converted.email, "hello@example.com");
    assert.match(converted.code, /^diya_invite_/);
    assert.equal(converted.invite.maxUses, 1);
    assert.equal(runAdmin({ args: ["waitlist", "list", "--status", "invited"], env: environment, write: () => {} }).waitlist.length, 1);
    assert.throws(() => runAdmin({ args: ["waitlist", "invite", "--id", hello.id], env: environment, write: () => {} }), /already received an invite/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
