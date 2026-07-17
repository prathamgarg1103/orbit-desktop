import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { newId, now } from "./security.mjs";

const PROVIDERS = new Set(["gmail", "notion"]);

export class DiyaDatabase {
  constructor(databasePath) {
    if (databasePath !== ":memory:") fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.db = new DatabaseSync(databasePath);
    this.db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.migrate();
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        enrollment_invite_id TEXT,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        revoked_at TEXT
      );
      CREATE TABLE IF NOT EXISTS connections (
        device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        encrypted_access_token TEXT NOT NULL,
        encrypted_refresh_token TEXT,
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (device_id, provider)
      );
      CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        kind TEXT NOT NULL,
        model TEXT,
        image_bytes INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS oauth_states (
        nonce TEXT PRIMARY KEY,
        device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        encrypted_verifier TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS invites (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        code_hash TEXT NOT NULL UNIQUE,
        max_uses INTEGER NOT NULL,
        uses INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT,
        created_at TEXT NOT NULL,
        revoked_at TEXT
      );
      CREATE TABLE IF NOT EXISTS waitlist_entries (
        id TEXT PRIMARY KEY,
        email_hash TEXT NOT NULL UNIQUE,
        encrypted_email TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'requested',
        invite_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS feedback_entries (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        encrypted_message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS usage_events_by_device_created ON usage_events(device_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS oauth_states_by_expiry ON oauth_states(expires_at);
      CREATE INDEX IF NOT EXISTS invites_by_created ON invites(created_at DESC);
      CREATE INDEX IF NOT EXISTS waitlist_entries_by_status_created ON waitlist_entries(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS feedback_entries_by_status_created ON feedback_entries(status, created_at DESC);
    `);
    this.ensureColumn("devices", "enrollment_invite_id", "TEXT");
    this.ensureColumn("waitlist_entries", "invite_id", "TEXT");
    this.db.exec("CREATE INDEX IF NOT EXISTS devices_by_enrollment_invite ON devices(enrollment_invite_id); CREATE INDEX IF NOT EXISTS waitlist_entries_by_invite ON waitlist_entries(invite_id);");
  }

  ensureColumn(table, column, definition) {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((entry) => entry.name === column)) this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }

  createDevice({ name, tokenHash, enrollmentInviteId = null }) {
    const device = { id: newId(), name: String(name).slice(0, 100) || "Diya desktop", tokenHash, enrollmentInviteId: enrollmentInviteId ? String(enrollmentInviteId) : null, createdAt: now() };
    this.db.prepare("INSERT INTO devices (id, name, token_hash, enrollment_invite_id, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(device.id, device.name, device.tokenHash, device.enrollmentInviteId, device.createdAt, device.createdAt);
    return { id: device.id, name: device.name, createdAt: device.createdAt };
  }

  findDeviceByTokenHash(tokenHash) {
    return this.db.prepare("SELECT id, name, created_at AS createdAt, last_seen_at AS lastSeenAt, revoked_at AS revokedAt FROM devices WHERE token_hash = ?").get(tokenHash);
  }

  touchDevice(id) {
    this.db.prepare("UPDATE devices SET last_seen_at = ? WHERE id = ?").run(now(), id);
  }

  revokeDevice(id) {
    const result = this.db.prepare("UPDATE devices SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL").run(now(), id);
    this.db.prepare("DELETE FROM oauth_states WHERE device_id = ?").run(id);
    return result.changes > 0;
  }

  putConnection(deviceId, provider, values) {
    if (!PROVIDERS.has(provider)) throw new Error("Unsupported connector provider.");
    const metadata = JSON.stringify(values.metadata || {}).slice(0, 8_000);
    const timestamp = now();
    this.db.prepare(`
      INSERT INTO connections (device_id, provider, encrypted_access_token, encrypted_refresh_token, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id, provider) DO UPDATE SET
        encrypted_access_token = excluded.encrypted_access_token,
        encrypted_refresh_token = excluded.encrypted_refresh_token,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at
    `).run(deviceId, provider, values.accessToken, values.refreshToken || null, metadata, timestamp, timestamp);
  }

  getConnection(deviceId, provider) {
    return this.db.prepare("SELECT provider, encrypted_access_token AS accessToken, encrypted_refresh_token AS refreshToken, metadata_json AS metadataJson FROM connections WHERE device_id = ? AND provider = ?")
      .get(deviceId, provider);
  }

  deleteConnection(deviceId, provider) {
    return this.db.prepare("DELETE FROM connections WHERE device_id = ? AND provider = ?").run(deviceId, provider).changes > 0;
  }

  updateConnectionMetadata(deviceId, provider, metadata) {
    if (!PROVIDERS.has(provider)) throw new Error("Unsupported connector provider.");
    const result = this.db.prepare("UPDATE connections SET metadata_json = ?, updated_at = ? WHERE device_id = ? AND provider = ?")
      .run(JSON.stringify(metadata || {}).slice(0, 8_000), now(), deviceId, provider);
    return result.changes > 0;
  }

  createOAuthState({ nonce, deviceId, provider, encryptedVerifier, expiresAt }) {
    this.db.prepare("DELETE FROM oauth_states WHERE expires_at < ?").run(Date.now());
    this.db.prepare("INSERT INTO oauth_states (nonce, device_id, provider, encrypted_verifier, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(nonce, deviceId, provider, encryptedVerifier, expiresAt, now());
  }

  consumeOAuthState(nonce) {
    return this.db.prepare("DELETE FROM oauth_states WHERE nonce = ? RETURNING nonce, device_id AS deviceId, provider, encrypted_verifier AS encryptedVerifier, expires_at AS expiresAt").get(nonce);
  }

  createInvite({ label, codeHash, maxUses = 1, expiresAt = null }) {
    const expiration = expiresAt ? new Date(expiresAt) : null;
    if (expiration && Number.isNaN(expiration.getTime())) throw new Error("Invite expiration must be a valid date.");
    const invite = {
      id: newId(),
      label: String(label || "early access").trim().slice(0, 120) || "early access",
      codeHash: String(codeHash),
      maxUses: Math.max(1, Math.min(1_000, Number.parseInt(maxUses, 10) || 1)),
      expiresAt: expiration ? expiration.toISOString() : null,
      createdAt: now()
    };
    this.db.prepare("INSERT INTO invites (id, label, code_hash, max_uses, uses, expires_at, created_at) VALUES (?, ?, ?, ?, 0, ?, ?)")
      .run(invite.id, invite.label, invite.codeHash, invite.maxUses, invite.expiresAt, invite.createdAt);
    return { id: invite.id, label: invite.label, maxUses: invite.maxUses, uses: 0, expiresAt: invite.expiresAt, createdAt: invite.createdAt, revokedAt: null };
  }

  consumeInvite(codeHash) {
    const timestamp = now();
    return this.db.prepare(`
      UPDATE invites
      SET uses = uses + 1
      WHERE code_hash = ?
        AND revoked_at IS NULL
        AND uses < max_uses
        AND (expires_at IS NULL OR expires_at > ?)
      RETURNING id, label, max_uses AS maxUses, uses, expires_at AS expiresAt, created_at AS createdAt
    `).get(String(codeHash), timestamp) || null;
  }

  listInvites() {
    return this.db.prepare(`
      SELECT id, label, max_uses AS maxUses, uses, expires_at AS expiresAt, created_at AS createdAt, revoked_at AS revokedAt
      FROM invites ORDER BY created_at DESC
    `).all();
  }

  revokeInvite(id) {
    return this.db.prepare("UPDATE invites SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL").run(now(), String(id)).changes > 0;
  }

  createWaitlistInvite({ waitlistId, label, codeHash, expiresAt = null }) {
    const expiration = expiresAt ? new Date(expiresAt) : null;
    if (expiration && Number.isNaN(expiration.getTime())) throw new Error("Invite expiration must be a valid date.");
    const invite = {
      id: newId(),
      label: String(label || "waitlist beta").trim().slice(0, 120) || "waitlist beta",
      codeHash: String(codeHash),
      maxUses: 1,
      expiresAt: expiration ? expiration.toISOString() : null,
      createdAt: now()
    };
    let transactionOpen = false;
    try {
      this.db.exec("BEGIN IMMEDIATE");
      transactionOpen = true;
      const entry = this.db.prepare(`
        SELECT id, encrypted_email AS encryptedEmail, source, status, created_at AS createdAt, updated_at AS updatedAt
        FROM waitlist_entries WHERE id = ?
      `).get(String(waitlistId));
      if (!entry) throw new Error("This waitlist entry no longer exists.");
      if (entry.status === "declined") throw new Error("This waitlist entry was declined and cannot be invited.");
      if (entry.status === "invited") throw new Error("This waitlist entry has already received an invite.");
      this.db.prepare("INSERT INTO invites (id, label, code_hash, max_uses, uses, expires_at, created_at) VALUES (?, ?, ?, ?, 0, ?, ?)")
        .run(invite.id, invite.label, invite.codeHash, invite.maxUses, invite.expiresAt, invite.createdAt);
      this.db.prepare("UPDATE waitlist_entries SET status = 'invited', invite_id = ?, updated_at = ? WHERE id = ?").run(invite.id, invite.createdAt, entry.id);
      this.db.exec("COMMIT");
      transactionOpen = false;
      return {
        entry: { ...entry, status: "invited", updatedAt: invite.createdAt },
        invite: { id: invite.id, label: invite.label, maxUses: 1, uses: 0, expiresAt: invite.expiresAt, createdAt: invite.createdAt, revokedAt: null }
      };
    } catch (error) {
      if (transactionOpen) this.db.exec("ROLLBACK");
      throw error;
    }
  }

  upsertWaitlistEntry({ emailHash, encryptedEmail, source = "launch-page" }) {
    const timestamp = now();
    return this.db.prepare(`
      INSERT INTO waitlist_entries (id, email_hash, encrypted_email, source, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'requested', ?, ?)
      ON CONFLICT(email_hash) DO UPDATE SET
        encrypted_email = excluded.encrypted_email,
        source = excluded.source,
        updated_at = excluded.updated_at
      RETURNING id, source, status, created_at AS createdAt, updated_at AS updatedAt
    `).get(newId(), String(emailHash), String(encryptedEmail), String(source).slice(0, 60), timestamp, timestamp);
  }

  listWaitlistEntries(status = "") {
    const filter = String(status || "").trim();
    return filter
      ? this.db.prepare("SELECT id, encrypted_email AS encryptedEmail, source, status, created_at AS createdAt, updated_at AS updatedAt FROM waitlist_entries WHERE status = ? ORDER BY created_at DESC").all(filter)
      : this.db.prepare("SELECT id, encrypted_email AS encryptedEmail, source, status, created_at AS createdAt, updated_at AS updatedAt FROM waitlist_entries ORDER BY created_at DESC").all();
  }

  updateWaitlistStatus(id, status) {
    const nextStatus = String(status);
    if (nextStatus === "declined") {
      return this.db.prepare("UPDATE waitlist_entries SET status = ?, updated_at = ? WHERE id = ? AND status = 'requested'").run(nextStatus, now(), String(id)).changes > 0;
    }
    if (nextStatus === "requested") {
      return this.db.prepare("UPDATE waitlist_entries SET status = ?, updated_at = ? WHERE id = ? AND status = 'declined'").run(nextStatus, now(), String(id)).changes > 0;
    }
    throw new Error("Waitlist status must be requested or declined.");
  }

  createFeedback({ deviceId, category, encryptedMessage }) {
    const timestamp = now();
    const feedback = {
      id: newId(),
      deviceId: String(deviceId),
      category: String(category || "general").slice(0, 30),
      encryptedMessage: String(encryptedMessage),
      createdAt: timestamp
    };
    this.db.prepare("INSERT INTO feedback_entries (id, device_id, category, encrypted_message, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'new', ?, ?)")
      .run(feedback.id, feedback.deviceId, feedback.category, feedback.encryptedMessage, feedback.createdAt, feedback.createdAt);
    return { id: feedback.id, category: feedback.category, status: "new", createdAt: feedback.createdAt, updatedAt: feedback.createdAt };
  }

  listFeedbackEntries(status = "") {
    const filter = String(status || "").trim();
    return filter
      ? this.db.prepare(`
        SELECT feedback.id, feedback.device_id AS deviceId, feedback.category, feedback.encrypted_message AS encryptedMessage, feedback.status, feedback.created_at AS createdAt, feedback.updated_at AS updatedAt,
          devices.enrollment_invite_id AS enrollmentInviteId, waitlist.encrypted_email AS encryptedEmail
        FROM feedback_entries AS feedback
        JOIN devices ON devices.id = feedback.device_id
        LEFT JOIN waitlist_entries AS waitlist ON waitlist.invite_id = devices.enrollment_invite_id
        WHERE feedback.status = ? ORDER BY feedback.created_at DESC
      `).all(filter)
      : this.db.prepare(`
        SELECT feedback.id, feedback.device_id AS deviceId, feedback.category, feedback.encrypted_message AS encryptedMessage, feedback.status, feedback.created_at AS createdAt, feedback.updated_at AS updatedAt,
          devices.enrollment_invite_id AS enrollmentInviteId, waitlist.encrypted_email AS encryptedEmail
        FROM feedback_entries AS feedback
        JOIN devices ON devices.id = feedback.device_id
        LEFT JOIN waitlist_entries AS waitlist ON waitlist.invite_id = devices.enrollment_invite_id
        ORDER BY feedback.created_at DESC
      `).all();
  }

  updateFeedbackStatus(id, status) {
    return this.db.prepare("UPDATE feedback_entries SET status = ?, updated_at = ? WHERE id = ?").run(String(status), now(), String(id)).changes > 0;
  }

  operatorMetrics() {
    const asOf = now();
    const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const count = (row, key) => Number(row?.[key] || 0);
    const waitlist = this.db.prepare(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN status = 'requested' THEN 1 ELSE 0 END) AS requested,
        SUM(CASE WHEN status = 'invited' THEN 1 ELSE 0 END) AS invited,
        SUM(CASE WHEN status = 'declined' THEN 1 ELSE 0 END) AS declined
      FROM waitlist_entries
    `).get();
    const invites = this.db.prepare(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN revoked_at IS NULL AND uses = 0 AND (expires_at IS NULL OR expires_at > ?) THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN uses > 0 THEN 1 ELSE 0 END) AS consumed,
        SUM(CASE WHEN revoked_at IS NOT NULL THEN 1 ELSE 0 END) AS revoked,
        SUM(CASE WHEN revoked_at IS NULL AND uses = 0 AND expires_at IS NOT NULL AND expires_at <= ? THEN 1 ELSE 0 END) AS expired
      FROM invites
    `).get(asOf, asOf);
    const devices = this.db.prepare(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN revoked_at IS NULL THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN revoked_at IS NULL AND last_seen_at >= ? THEN 1 ELSE 0 END) AS activeLast7Days,
        SUM(CASE WHEN revoked_at IS NOT NULL THEN 1 ELSE 0 END) AS revoked
      FROM devices
    `).get(activeSince);
    const engagement = this.db.prepare(`
      SELECT
        SUM(CASE WHEN kind = 'screen_guide' THEN 1 ELSE 0 END) AS screenGuides,
        SUM(CASE WHEN kind = 'approved_action' THEN 1 ELSE 0 END) AS approvedActions,
        SUM(CASE WHEN kind = 'screen_guide' AND created_at >= ? THEN 1 ELSE 0 END) AS screenGuidesLast7Days,
        SUM(CASE WHEN kind = 'approved_action' AND created_at >= ? THEN 1 ELSE 0 END) AS approvedActionsLast7Days
      FROM usage_events
    `).get(activeSince, activeSince);
    const feedback = this.db.prepare(`
      SELECT COUNT(*) AS total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
      FROM feedback_entries
    `).get();
    return {
      asOf,
      activeSince,
      waitlist: { total: count(waitlist, "total"), requested: count(waitlist, "requested"), invited: count(waitlist, "invited"), declined: count(waitlist, "declined") },
      invites: { total: count(invites, "total"), pending: count(invites, "pending"), consumed: count(invites, "consumed"), revoked: count(invites, "revoked"), expired: count(invites, "expired") },
      devices: { total: count(devices, "total"), active: count(devices, "active"), activeLast7Days: count(devices, "activeLast7Days"), revoked: count(devices, "revoked") },
      engagement: { screenGuides: count(engagement, "screenGuides"), approvedActions: count(engagement, "approvedActions"), screenGuidesLast7Days: count(engagement, "screenGuidesLast7Days"), approvedActionsLast7Days: count(engagement, "approvedActionsLast7Days") },
      feedback: { total: count(feedback, "total"), new: count(feedback, "new"), reviewed: count(feedback, "reviewed"), resolved: count(feedback, "resolved") }
    };
  }

  connectorStatus(deviceId) {
    const connected = new Set(this.db.prepare("SELECT provider FROM connections WHERE device_id = ?").all(deviceId).map((row) => row.provider));
    return { gmail: connected.has("gmail"), notion: connected.has("notion") };
  }

  recordUsage(deviceId, { kind, model = null, imageBytes = 0 }) {
    this.db.prepare("INSERT INTO usage_events (id, device_id, kind, model, image_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(newId(), deviceId, String(kind).slice(0, 60), model ? String(model).slice(0, 100) : null, Math.max(0, Number(imageBytes) || 0), now());
  }

  reserveMonthlyUsage({ deviceId, kind, limit, periodStart, model = null }) {
    const reservation = {
      id: newId(),
      deviceId: String(deviceId),
      kind: String(kind).slice(0, 60),
      limit: Math.max(1, Number.parseInt(limit, 10) || 1),
      periodStart: String(periodStart),
      model: model ? String(model).slice(0, 100) : null,
      createdAt: now()
    };
    let transactionOpen = false;
    try {
      this.db.exec("BEGIN IMMEDIATE");
      transactionOpen = true;
      const used = Number(this.db.prepare("SELECT COUNT(*) AS count FROM usage_events WHERE device_id = ? AND kind = ? AND created_at >= ?").get(reservation.deviceId, reservation.kind, reservation.periodStart).count || 0);
      if (used >= reservation.limit) {
        this.db.exec("COMMIT");
        transactionOpen = false;
        return null;
      }
      this.db.prepare("INSERT INTO usage_events (id, device_id, kind, model, image_bytes, created_at) VALUES (?, ?, ?, ?, 0, ?)")
        .run(reservation.id, reservation.deviceId, reservation.kind, reservation.model, reservation.createdAt);
      this.db.exec("COMMIT");
      transactionOpen = false;
      return { id: reservation.id, kind: reservation.kind, createdAt: reservation.createdAt };
    } catch (error) {
      if (transactionOpen) this.db.exec("ROLLBACK");
      throw error;
    }
  }

  completeUsageReservation(id, { model = null, imageBytes = 0 } = {}) {
    return this.db.prepare("UPDATE usage_events SET model = COALESCE(?, model), image_bytes = ? WHERE id = ?")
      .run(model ? String(model).slice(0, 100) : null, Math.max(0, Number(imageBytes) || 0), String(id)).changes > 0;
  }

  cancelUsageReservation(id) {
    return this.db.prepare("DELETE FROM usage_events WHERE id = ?").run(String(id)).changes > 0;
  }

  usageCountSince(deviceId, kind, periodStart) {
    const row = this.db.prepare("SELECT COUNT(*) AS count FROM usage_events WHERE device_id = ? AND kind = ? AND created_at >= ?")
      .get(String(deviceId), String(kind), String(periodStart));
    return Number(row.count || 0);
  }

  usageSummary(deviceId) {
    const row = this.db.prepare(`
      SELECT COUNT(*) AS requests, COALESCE(SUM(image_bytes), 0) AS imageBytes, MAX(created_at) AS lastRequestAt
      FROM usage_events WHERE device_id = ?
    `).get(deviceId);
    return { requests: Number(row.requests || 0), imageBytes: Number(row.imageBytes || 0), lastRequestAt: row.lastRequestAt || null };
  }

  close() {
    this.db.close();
  }
}
