-- Defense in depth: these tables are not part of a browser-facing Data API.
-- Explicit restrictive policies keep the no-access rule in force even if a
-- future role grant is made accidentally.
create policy "deny browser access" on public.devices as restrictive for all to anon, authenticated using (false) with check (false);
create policy "deny browser access" on public.connections as restrictive for all to anon, authenticated using (false) with check (false);
create policy "deny browser access" on public.usage_events as restrictive for all to anon, authenticated using (false) with check (false);
create policy "deny browser access" on public.oauth_states as restrictive for all to anon, authenticated using (false) with check (false);
create policy "deny browser access" on public.invites as restrictive for all to anon, authenticated using (false) with check (false);
create policy "deny browser access" on public.waitlist_entries as restrictive for all to anon, authenticated using (false) with check (false);
create policy "deny browser access" on public.feedback_entries as restrictive for all to anon, authenticated using (false) with check (false);
