import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { newId, now } from "./security.mjs";

const PROVIDERS = new Set(["gmail", "notion"]);

export class OrbitDatabase {
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
      CREATE INDEX IF NOT EXISTS usage_events_by_device_created ON usage_events(device_id, created_at DESC);
    `);
  }

  createDevice({ name, tokenHash }) {
    const device = { id: newId(), name: String(name).slice(0, 100) || "Orbit desktop", tokenHash, createdAt: now() };
    this.db.prepare("INSERT INTO devices (id, name, token_hash, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)")
      .run(device.id, device.name, device.tokenHash, device.createdAt, device.createdAt);
    return { id: device.id, name: device.name, createdAt: device.createdAt };
  }

  findDeviceByTokenHash(tokenHash) {
    return this.db.prepare("SELECT id, name, created_at AS createdAt, last_seen_at AS lastSeenAt, revoked_at AS revokedAt FROM devices WHERE token_hash = ?").get(tokenHash);
  }

  touchDevice(id) {
    this.db.prepare("UPDATE devices SET last_seen_at = ? WHERE id = ?").run(now(), id);
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

  connectorStatus(deviceId) {
    const connected = new Set(this.db.prepare("SELECT provider FROM connections WHERE device_id = ?").all(deviceId).map((row) => row.provider));
    return { gmail: connected.has("gmail"), notion: connected.has("notion") };
  }

  recordUsage(deviceId, { kind, model = null, imageBytes = 0 }) {
    this.db.prepare("INSERT INTO usage_events (id, device_id, kind, model, image_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(newId(), deviceId, String(kind).slice(0, 60), model ? String(model).slice(0, 100) : null, Math.max(0, Number(imageBytes) || 0), now());
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
