-- Diya Cloud stores only hashed device and invite credentials. Connector tokens,
-- waitlist addresses, and feedback remain application-encrypted before storage.
create table if not exists public.devices (
  id text primary key,
  name text not null,
  token_hash text not null unique,
  enrollment_invite_id text,
  created_at text not null,
  last_seen_at text not null,
  revoked_at text
);

create table if not exists public.connections (
  device_id text not null references public.devices(id) on delete cascade,
  provider text not null check (provider in ('gmail', 'notion')),
  encrypted_access_token text not null,
  encrypted_refresh_token text,
  metadata_json text not null default '{}',
  created_at text not null,
  updated_at text not null,
  primary key (device_id, provider)
);

create table if not exists public.usage_events (
  id text primary key,
  device_id text not null references public.devices(id) on delete cascade,
  kind text not null,
  model text,
  image_bytes integer not null default 0 check (image_bytes >= 0),
  created_at text not null
);

create table if not exists public.oauth_states (
  nonce text primary key,
  device_id text not null references public.devices(id) on delete cascade,
  provider text not null check (provider in ('gmail', 'notion')),
  encrypted_verifier text not null,
  expires_at bigint not null,
  created_at text not null
);

create table if not exists public.invites (
  id text primary key,
  label text not null,
  code_hash text not null unique,
  max_uses integer not null check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  expires_at text,
  created_at text not null,
  revoked_at text
);

create table if not exists public.waitlist_entries (
  id text primary key,
  email_hash text not null unique,
  encrypted_email text not null,
  source text not null,
  status text not null default 'requested' check (status in ('requested', 'invited', 'declined')),
  invite_id text,
  created_at text not null,
  updated_at text not null
);

create table if not exists public.feedback_entries (
  id text primary key,
  device_id text not null references public.devices(id) on delete cascade,
  category text not null check (category in ('bug', 'idea', 'general')),
  encrypted_message text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'resolved')),
  created_at text not null,
  updated_at text not null
);

create index if not exists usage_events_by_device_created on public.usage_events(device_id, created_at desc);
create index if not exists oauth_states_by_expiry on public.oauth_states(expires_at);
create index if not exists invites_by_created on public.invites(created_at desc);
create index if not exists devices_by_enrollment_invite on public.devices(enrollment_invite_id);
create index if not exists waitlist_entries_by_status_created on public.waitlist_entries(status, created_at desc);
create index if not exists waitlist_entries_by_invite on public.waitlist_entries(invite_id);
create index if not exists feedback_entries_by_status_created on public.feedback_entries(status, created_at desc);

-- Diya Cloud always accesses this database through a server-side transaction
-- pooler credential. Disable client-facing Data API access defensively.
alter table public.devices enable row level security;
alter table public.connections enable row level security;
alter table public.usage_events enable row level security;
alter table public.oauth_states enable row level security;
alter table public.invites enable row level security;
alter table public.waitlist_entries enable row level security;
alter table public.feedback_entries enable row level security;

revoke all on table public.devices, public.connections, public.usage_events,
  public.oauth_states, public.invites, public.waitlist_entries,
  public.feedback_entries from anon, authenticated;
