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

test("issues, lists, and revokes a one-time invite without retaining its raw code", () => {
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
    database.close();
    const waitlist = runAdmin({ args: ["waitlist", "list"], env: environment, write: () => {} });
    assert.equal(waitlist.waitlist[0].email, "hello@example.com");
    const updated = runAdmin({ args: ["waitlist", "set-status", "--id", waitlist.waitlist[0].id, "--status", "invited"], env: environment, write: () => {} });
    assert.equal(updated.updated, true);
    assert.equal(runAdmin({ args: ["waitlist", "list", "--status", "invited"], env: environment, write: () => {} }).waitlist.length, 1);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
