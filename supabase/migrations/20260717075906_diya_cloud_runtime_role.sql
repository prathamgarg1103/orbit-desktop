-- This non-login role documents Diya's server-only table access separately
-- from browser roles. Supabase's shared transaction pooler uses the
-- project-specific postgres identity on this tier.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'diya_cloud_app') then
    create role diya_cloud_app noinherit nologin nocreatedb nocreaterole nosuperuser;
  end if;
end;
$$;

grant usage on schema public to diya_cloud_app;
grant select, insert, update, delete on all tables in schema public to diya_cloud_app;
grant usage, select on all sequences in schema public to diya_cloud_app;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to diya_cloud_app;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to diya_cloud_app;

create policy "Diya Cloud server access" on public.devices
  for all to diya_cloud_app using (true) with check (true);
create policy "Diya Cloud server access" on public.connections
  for all to diya_cloud_app using (true) with check (true);
create policy "Diya Cloud server access" on public.usage_events
  for all to diya_cloud_app using (true) with check (true);
create policy "Diya Cloud server access" on public.oauth_states
  for all to diya_cloud_app using (true) with check (true);
create policy "Diya Cloud server access" on public.invites
  for all to diya_cloud_app using (true) with check (true);
create policy "Diya Cloud server access" on public.waitlist_entries
  for all to diya_cloud_app using (true) with check (true);
create policy "Diya Cloud server access" on public.feedback_entries
  for all to diya_cloud_app using (true) with check (true);
