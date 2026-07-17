-- Cover device foreign keys so revocation and cascade cleanup stay fast as the
-- beta cohort grows. Existing composite indexes already cover connections and
-- usage_events; these two relations need a dedicated device lookup.
create index if not exists feedback_entries_by_device on public.feedback_entries(device_id);
create index if not exists oauth_states_by_device on public.oauth_states(device_id);
