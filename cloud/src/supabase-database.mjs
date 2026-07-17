import postgres from "postgres";
import { newId, now } from "./security.mjs";

const PROVIDERS = new Set(["gmail", "notion"]);

function first(rows) {
  return rows[0] || null;
}

function changed(result) {
  return Number(result?.count || 0) > 0;
}

function count(row, key) {
  return Number(row?.[key] || 0);
}

export class SupabaseDatabase {
  constructor(databaseUrl) {
    if (!databaseUrl) throw new Error("DIYA_DATABASE_URL is required for Supabase Postgres.");
    // Supavisor transaction mode is designed for serverless requests and does
    // not support prepared statements, so keep this client deliberately small.
    this.sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 10, idle_timeout: 20 });
  }

  async healthCheck() {
    await this.sql`select id from public.devices limit 1`;
  }

  async createDevice({ name, tokenHash, enrollmentInviteId = null }) {
    const device = {
      id: newId(),
      name: String(name).slice(0, 100) || "Diya desktop",
      tokenHash: String(tokenHash),
      enrollmentInviteId: enrollmentInviteId ? String(enrollmentInviteId) : null,
      createdAt: now()
    };
    await this.sql`
      insert into public.devices (id, name, token_hash, enrollment_invite_id, created_at, last_seen_at)
      values (${device.id}, ${device.name}, ${device.tokenHash}, ${device.enrollmentInviteId}, ${device.createdAt}, ${device.createdAt})
    `;
    return { id: device.id, name: device.name, createdAt: device.createdAt };
  }

  async findDeviceByTokenHash(tokenHash) {
    return first(await this.sql`
      select id, name, created_at as "createdAt", last_seen_at as "lastSeenAt", revoked_at as "revokedAt"
      from public.devices where token_hash = ${String(tokenHash)}
    `);
  }

  async touchDevice(id) {
    await this.sql`update public.devices set last_seen_at = ${now()} where id = ${String(id)}`;
  }

  async revokeDevice(id) {
    return this.sql.begin(async (sql) => {
      const result = await sql`update public.devices set revoked_at = ${now()} where id = ${String(id)} and revoked_at is null`;
      await sql`delete from public.oauth_states where device_id = ${String(id)}`;
      return changed(result);
    });
  }

  async putConnection(deviceId, provider, values) {
    if (!PROVIDERS.has(provider)) throw new Error("Unsupported connector provider.");
    const timestamp = now();
    const metadata = JSON.stringify(values.metadata || {}).slice(0, 8_000);
    await this.sql`
      insert into public.connections (
        device_id, provider, encrypted_access_token, encrypted_refresh_token, metadata_json, created_at, updated_at
      ) values (
        ${String(deviceId)}, ${provider}, ${String(values.accessToken)}, ${values.refreshToken ? String(values.refreshToken) : null}, ${metadata}, ${timestamp}, ${timestamp}
      ) on conflict (device_id, provider) do update set
        encrypted_access_token = excluded.encrypted_access_token,
        encrypted_refresh_token = excluded.encrypted_refresh_token,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at
    `;
  }

  async getConnection(deviceId, provider) {
    return first(await this.sql`
      select provider, encrypted_access_token as "accessToken", encrypted_refresh_token as "refreshToken", metadata_json as "metadataJson"
      from public.connections where device_id = ${String(deviceId)} and provider = ${String(provider)}
    `);
  }

  async deleteConnection(deviceId, provider) {
    return changed(await this.sql`delete from public.connections where device_id = ${String(deviceId)} and provider = ${String(provider)}`);
  }

  async updateConnectionMetadata(deviceId, provider, metadata) {
    if (!PROVIDERS.has(provider)) throw new Error("Unsupported connector provider.");
    return changed(await this.sql`
      update public.connections set metadata_json = ${JSON.stringify(metadata || {}).slice(0, 8_000)}, updated_at = ${now()}
      where device_id = ${String(deviceId)} and provider = ${String(provider)}
    `);
  }

  async createOAuthState({ nonce, deviceId, provider, encryptedVerifier, expiresAt }) {
    await this.sql.begin(async (sql) => {
      await sql`delete from public.oauth_states where expires_at < ${Date.now()}`;
      await sql`
        insert into public.oauth_states (nonce, device_id, provider, encrypted_verifier, expires_at, created_at)
        values (${String(nonce)}, ${String(deviceId)}, ${String(provider)}, ${String(encryptedVerifier)}, ${Number(expiresAt)}, ${now()})
      `;
    });
  }

  async consumeOAuthState(nonce) {
    return first(await this.sql`
      delete from public.oauth_states where nonce = ${String(nonce)}
      returning nonce, device_id as "deviceId", provider, encrypted_verifier as "encryptedVerifier", expires_at as "expiresAt"
    `);
  }

  async createInvite({ label, codeHash, maxUses = 1, expiresAt = null }) {
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
    await this.sql`
      insert into public.invites (id, label, code_hash, max_uses, uses, expires_at, created_at)
      values (${invite.id}, ${invite.label}, ${invite.codeHash}, ${invite.maxUses}, 0, ${invite.expiresAt}, ${invite.createdAt})
    `;
    return { id: invite.id, label: invite.label, maxUses: invite.maxUses, uses: 0, expiresAt: invite.expiresAt, createdAt: invite.createdAt, revokedAt: null };
  }

  async consumeInvite(codeHash) {
    return first(await this.sql`
      update public.invites set uses = uses + 1
      where code_hash = ${String(codeHash)}
        and revoked_at is null
        and uses < max_uses
        and (expires_at is null or expires_at > ${now()})
      returning id, label, max_uses as "maxUses", uses, expires_at as "expiresAt", created_at as "createdAt"
    `);
  }

  async listInvites() {
    return this.sql`
      select id, label, max_uses as "maxUses", uses, expires_at as "expiresAt", created_at as "createdAt", revoked_at as "revokedAt"
      from public.invites order by created_at desc
    `;
  }

  async revokeInvite(id) {
    return changed(await this.sql`update public.invites set revoked_at = ${now()} where id = ${String(id)} and revoked_at is null`);
  }

  async createWaitlistInvite({ waitlistId, label, codeHash, expiresAt = null }) {
    const expiration = expiresAt ? new Date(expiresAt) : null;
    if (expiration && Number.isNaN(expiration.getTime())) throw new Error("Invite expiration must be a valid date.");
    const invite = {
      id: newId(),
      label: String(label || "waitlist beta").trim().slice(0, 120) || "waitlist beta",
      codeHash: String(codeHash),
      expiresAt: expiration ? expiration.toISOString() : null,
      createdAt: now()
    };
    return this.sql.begin(async (sql) => {
      const entry = first(await sql`
        select id, encrypted_email as "encryptedEmail", source, status, created_at as "createdAt", updated_at as "updatedAt"
        from public.waitlist_entries where id = ${String(waitlistId)} for update
      `);
      if (!entry) throw new Error("This waitlist entry no longer exists.");
      if (entry.status === "declined") throw new Error("This waitlist entry was declined and cannot be invited.");
      if (entry.status === "invited") throw new Error("This waitlist entry has already received an invite.");
      await sql`
        insert into public.invites (id, label, code_hash, max_uses, uses, expires_at, created_at)
        values (${invite.id}, ${invite.label}, ${invite.codeHash}, 1, 0, ${invite.expiresAt}, ${invite.createdAt})
      `;
      await sql`update public.waitlist_entries set status = 'invited', invite_id = ${invite.id}, updated_at = ${invite.createdAt} where id = ${entry.id}`;
      return {
        entry: { ...entry, status: "invited", updatedAt: invite.createdAt },
        invite: { id: invite.id, label: invite.label, maxUses: 1, uses: 0, expiresAt: invite.expiresAt, createdAt: invite.createdAt, revokedAt: null }
      };
    });
  }

  async upsertWaitlistEntry({ emailHash, encryptedEmail, source = "launch-page" }) {
    const timestamp = now();
    return first(await this.sql`
      insert into public.waitlist_entries (id, email_hash, encrypted_email, source, status, created_at, updated_at)
      values (${newId()}, ${String(emailHash)}, ${String(encryptedEmail)}, ${String(source).slice(0, 60)}, 'requested', ${timestamp}, ${timestamp})
      on conflict (email_hash) do update set
        encrypted_email = excluded.encrypted_email,
        source = excluded.source,
        updated_at = excluded.updated_at
      returning id, source, status, created_at as "createdAt", updated_at as "updatedAt"
    `);
  }

  async listWaitlistEntries(status = "") {
    const filter = String(status || "").trim();
    return filter
      ? this.sql`
          select id, encrypted_email as "encryptedEmail", source, status, created_at as "createdAt", updated_at as "updatedAt"
          from public.waitlist_entries where status = ${filter} order by created_at desc
        `
      : this.sql`
          select id, encrypted_email as "encryptedEmail", source, status, created_at as "createdAt", updated_at as "updatedAt"
          from public.waitlist_entries order by created_at desc
        `;
  }

  async updateWaitlistStatus(id, status) {
    const nextStatus = String(status);
    if (nextStatus === "declined") {
      return changed(await this.sql`
        update public.waitlist_entries set status = ${nextStatus}, updated_at = ${now()}
        where id = ${String(id)} and status = 'requested'
      `);
    }
    if (nextStatus === "requested") {
      return changed(await this.sql`
        update public.waitlist_entries set status = ${nextStatus}, updated_at = ${now()}
        where id = ${String(id)} and status = 'declined'
      `);
    }
    throw new Error("Waitlist status must be requested or declined.");
  }

  async createFeedback({ deviceId, category, encryptedMessage }) {
    const timestamp = now();
    const feedback = {
      id: newId(),
      deviceId: String(deviceId),
      category: String(category || "general").slice(0, 30),
      encryptedMessage: String(encryptedMessage),
      createdAt: timestamp
    };
    await this.sql`
      insert into public.feedback_entries (id, device_id, category, encrypted_message, status, created_at, updated_at)
      values (${feedback.id}, ${feedback.deviceId}, ${feedback.category}, ${feedback.encryptedMessage}, 'new', ${feedback.createdAt}, ${feedback.createdAt})
    `;
    return { id: feedback.id, category: feedback.category, status: "new", createdAt: feedback.createdAt, updatedAt: feedback.createdAt };
  }

  async listFeedbackEntries(status = "") {
    const filter = String(status || "").trim();
    const base = `
      select feedback.id, feedback.device_id as "deviceId", feedback.category, feedback.encrypted_message as "encryptedMessage",
        feedback.status, feedback.created_at as "createdAt", feedback.updated_at as "updatedAt",
        devices.enrollment_invite_id as "enrollmentInviteId", waitlist.encrypted_email as "encryptedEmail"
      from public.feedback_entries as feedback
      join public.devices as devices on devices.id = feedback.device_id
      left join public.waitlist_entries as waitlist on waitlist.invite_id = devices.enrollment_invite_id
    `;
    return filter
      ? this.sql.unsafe(`${base} where feedback.status = $1 order by feedback.created_at desc`, [filter])
      : this.sql.unsafe(`${base} order by feedback.created_at desc`);
  }

  async updateFeedbackStatus(id, status) {
    return changed(await this.sql`
      update public.feedback_entries set status = ${String(status)}, updated_at = ${now()} where id = ${String(id)}
    `);
  }

  async operatorMetrics() {
    const asOf = now();
    const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const waitlist = first(await this.sql`
      select count(*)::int as total,
        count(*) filter (where status = 'requested')::int as requested,
        count(*) filter (where status = 'invited')::int as invited,
        count(*) filter (where status = 'declined')::int as declined
      from public.waitlist_entries
    `);
    const invites = first(await this.sql`
      select count(*)::int as total,
        count(*) filter (where revoked_at is null and uses = 0 and (expires_at is null or expires_at > ${asOf}))::int as pending,
        count(*) filter (where uses > 0)::int as consumed,
        count(*) filter (where revoked_at is not null)::int as revoked,
        count(*) filter (where revoked_at is null and uses = 0 and expires_at is not null and expires_at <= ${asOf})::int as expired
      from public.invites
    `);
    const devices = first(await this.sql`
      select count(*)::int as total,
        count(*) filter (where revoked_at is null)::int as active,
        count(*) filter (where revoked_at is null and last_seen_at >= ${activeSince})::int as "activeLast7Days",
        count(*) filter (where revoked_at is not null)::int as revoked
      from public.devices
    `);
    const engagement = first(await this.sql`
      select
        count(*) filter (where kind = 'screen_guide')::int as "screenGuides",
        count(*) filter (where kind = 'approved_action')::int as "approvedActions",
        count(*) filter (where kind = 'screen_guide' and created_at >= ${activeSince})::int as "screenGuidesLast7Days",
        count(*) filter (where kind = 'approved_action' and created_at >= ${activeSince})::int as "approvedActionsLast7Days"
      from public.usage_events
    `);
    const feedback = first(await this.sql`
      select count(*)::int as total,
        count(*) filter (where status = 'new')::int as new,
        count(*) filter (where status = 'reviewed')::int as reviewed,
        count(*) filter (where status = 'resolved')::int as resolved
      from public.feedback_entries
    `);
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

  async connectorStatus(deviceId) {
    const connected = new Set((await this.sql`select provider from public.connections where device_id = ${String(deviceId)}`).map((row) => row.provider));
    return { gmail: connected.has("gmail"), notion: connected.has("notion") };
  }

  async recordUsage(deviceId, { kind, model = null, imageBytes = 0 }) {
    await this.sql`
      insert into public.usage_events (id, device_id, kind, model, image_bytes, created_at)
      values (${newId()}, ${String(deviceId)}, ${String(kind).slice(0, 60)}, ${model ? String(model).slice(0, 100) : null}, ${Math.max(0, Number(imageBytes) || 0)}, ${now()})
    `;
  }

  async reserveMonthlyUsage({ deviceId, kind, limit, periodStart, model = null }) {
    const reservation = {
      id: newId(),
      deviceId: String(deviceId),
      kind: String(kind).slice(0, 60),
      limit: Math.max(1, Number.parseInt(limit, 10) || 1),
      periodStart: String(periodStart),
      model: model ? String(model).slice(0, 100) : null,
      createdAt: now()
    };
    return this.sql.begin(async (sql) => {
      await sql`select pg_advisory_xact_lock(hashtext(${`${reservation.deviceId}:${reservation.kind}:${reservation.periodStart}`}))`;
      const used = first(await sql`
        select count(*)::int as count from public.usage_events
        where device_id = ${reservation.deviceId} and kind = ${reservation.kind} and created_at >= ${reservation.periodStart}
      `);
      if (count(used, "count") >= reservation.limit) return null;
      await sql`
        insert into public.usage_events (id, device_id, kind, model, image_bytes, created_at)
        values (${reservation.id}, ${reservation.deviceId}, ${reservation.kind}, ${reservation.model}, 0, ${reservation.createdAt})
      `;
      return { id: reservation.id, kind: reservation.kind, createdAt: reservation.createdAt };
    });
  }

  async completeUsageReservation(id, { model = null, imageBytes = 0 } = {}) {
    return changed(await this.sql`
      update public.usage_events
      set model = coalesce(${model ? String(model).slice(0, 100) : null}, model), image_bytes = ${Math.max(0, Number(imageBytes) || 0)}
      where id = ${String(id)}
    `);
  }

  async cancelUsageReservation(id) {
    return changed(await this.sql`delete from public.usage_events where id = ${String(id)}`);
  }

  async usageCountSince(deviceId, kind, periodStart) {
    const row = first(await this.sql`
      select count(*)::int as count from public.usage_events
      where device_id = ${String(deviceId)} and kind = ${String(kind)} and created_at >= ${String(periodStart)}
    `);
    return count(row, "count");
  }

  async usageSummary(deviceId) {
    const row = first(await this.sql`
      select count(*)::int as requests, coalesce(sum(image_bytes), 0)::int as "imageBytes", max(created_at) as "lastRequestAt"
      from public.usage_events where device_id = ${String(deviceId)}
    `);
    return { requests: count(row, "requests"), imageBytes: count(row, "imageBytes"), lastRequestAt: row?.lastRequestAt || null };
  }

  async close() {
    await this.sql.end({ timeout: 5 });
  }
}
