import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
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
    const feedbackDatabase = new DiyaDatabase(environment.DIYA_DATABASE_PATH);
    const feedbackDevice = feedbackDatabase.createDevice({ name: "Beta feedback desktop", tokenHash: "feedback-token-hash", enrollmentInviteId: converted.invite.id });
    feedbackDatabase.createFeedback({
      deviceId: feedbackDevice.id,
      category: "bug",
      encryptedMessage: seal("The hover label did not update in one app.", key)
    });
    feedbackDatabase.close();
    const feedback = runAdmin({ args: ["feedback", "list"], env: environment, write: () => {} }).feedback;
    assert.equal(feedback[0].message, "The hover label did not update in one app.");
    assert.equal(feedback[0].email, "hello@example.com");
    assert.equal(runAdmin({ args: ["feedback", "set-status", "--id", feedback[0].id, "--status", "reviewed"], env: environment, write: () => {} }).updated, true);
    assert.equal(runAdmin({ args: ["feedback", "list", "--status", "reviewed"], env: environment, write: () => {} }).feedback.length, 1);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("migrates deployed devices and waitlist rows for invite-linked feedback", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "diya-cloud-migration-"));
  const databasePath = path.join(directory, "cloud.sqlite");
  try {
    const legacy = new DatabaseSync(databasePath);
    legacy.exec(`
      CREATE TABLE devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        revoked_at TEXT
      );
      CREATE TABLE waitlist_entries (
        id TEXT PRIMARY KEY,
        email_hash TEXT NOT NULL UNIQUE,
        encrypted_email TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'requested',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      INSERT INTO devices VALUES ('device-1', 'existing desktop', 'hash-1', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL);
      INSERT INTO waitlist_entries VALUES ('waitlist-1', 'email-hash', 'encrypted-email', 'launch-page', 'requested', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
    `);
    legacy.close();
    const migrated = new DiyaDatabase(databasePath);
    const deviceColumns = migrated.db.prepare("PRAGMA table_info(devices)").all().map((column) => column.name);
    const waitlistColumns = migrated.db.prepare("PRAGMA table_info(waitlist_entries)").all().map((column) => column.name);
    assert.ok(deviceColumns.includes("enrollment_invite_id"));
    assert.ok(waitlistColumns.includes("invite_id"));
    assert.equal(migrated.db.prepare("SELECT name FROM devices WHERE id = 'device-1'").get().name, "existing desktop");
    assert.equal(migrated.db.prepare("SELECT status FROM waitlist_entries WHERE id = 'waitlist-1'").get().status, "requested");
    migrated.close();
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
