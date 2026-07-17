-- Consolidated initial schema for the self-hosted Postgres store.
--
-- This reproduces the health_api schema (identical table/column/index shapes to
-- the prior hosted deployment) so a data-only dump from the old database
-- restores cleanly. It deliberately omits row-level security, the auth.* / and
-- storage.* helpers, and PostgREST role grants: this store connects as an
-- application role and enforces tenant isolation in every query (the
-- *ForUser / *ForUserAndOrganization store methods), so RLS is not the control
-- here. Job claiming is done in the application with FOR UPDATE SKIP LOCKED
-- rather than security-definer functions.

create schema if not exists health_api;

create table if not exists health_api.sources (
  id text primary key,
  user_id text not null,
  organization_id text not null,
  category text not null,
  provider text,
  filename text,
  content_type text,
  byte_length integer not null default 0,
  checksum_sha256 text,
  provenance jsonb not null default '{}'::jsonb,
  payload_object_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists health_api.observations (
  id text primary key,
  source_id text not null references health_api.sources(id) on delete cascade,
  user_id text not null,
  organization_id text not null,
  type text not null,
  marker text,
  value jsonb,
  unit text,
  observed_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists health_api.analyses (
  id text primary key,
  user_id text not null,
  organization_id text not null,
  source_ids text[] not null default array[]::text[],
  result jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists health_api.dashboard_specs (
  id text primary key,
  analysis_id text not null references health_api.analyses(id) on delete cascade,
  user_id text not null,
  organization_id text not null,
  spec jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists health_api.idempotency_keys (
  key text not null,
  method text not null,
  route text not null,
  subject text not null,
  status integer not null,
  body jsonb not null,
  created_at timestamptz not null default now(),
  primary key (subject, method, route, key)
);

create table if not exists health_api.genetic_analysis_jobs (
  id text primary key,
  user_id text not null,
  organization_id text not null,
  analysis_id text not null references health_api.analyses(id) on delete cascade,
  source_id text not null references health_api.sources(id) on delete cascade,
  annotation_depth text not null default 'compact' check (annotation_depth in ('compact', 'full_dbsnp')),
  status text not null default 'queued' check (status in ('queued', 'running', 'complete', 'failed')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  priority integer not null default 0,
  worker_id text,
  locked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists health_api.external_accounts (
  id text primary key,
  user_id text not null,
  organization_id text not null,
  provider text not null,
  external_user_id text not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'errored')),
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organization_id, provider, external_user_id)
);

create table if not exists health_api.connector_sync_jobs (
  id text primary key,
  user_id text not null,
  organization_id text not null,
  provider text not null,
  external_account_id text references health_api.external_accounts(id) on delete set null,
  scheduled_for timestamptz not null default now(),
  status text not null default 'queued' check (status in ('queued', 'running', 'complete', 'failed')),
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  priority integer not null default 0,
  worker_id text,
  locked_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  result jsonb,
  request jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists health_api.provider_tokens (
  id text primary key,
  external_account_id text not null references health_api.external_accounts(id) on delete cascade,
  user_id text not null,
  organization_id text not null,
  provider text not null,
  provider_external_user_id text not null,
  access_token_encrypted text,
  refresh_token_encrypted text,
  scope text,
  token_type text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_external_user_id)
);

create table if not exists health_api.webhook_events (
  id text primary key,
  type text not null,
  user_id text,
  organization_id text,
  subject_id text,
  request_id text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists health_api.goals (
  id text primary key,
  user_id text not null,
  organization_id text not null,
  title text not null,
  metric text,
  target_value double precision,
  target_unit text,
  target_direction text check (target_direction is null or target_direction in ('decrease', 'increase', 'maintain')),
  due_date text,
  status text not null default 'active' check (status in ('active', 'achieved', 'archived')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists health_api.lab_locations (
  id text primary key,
  provider text not null check (provider in ('quest', 'synlab')),
  provider_location_id text not null,
  name text not null,
  address_line_1 text,
  address_line_2 text,
  city text,
  region text,
  postal_code text,
  country text,
  latitude numeric,
  longitude numeric,
  phone text,
  email text,
  booking_url text,
  source_url text,
  services text[] not null default array[]::text[],
  opening_hours text[] not null default array[]::text[],
  is_active boolean not null default true,
  raw jsonb not null default '{}'::jsonb,
  source_last_modified timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_location_id)
);

-- Self-contained OTP for the dashboard magic-code login. Replaces the prior
-- hosted-auth email path. Codes are stored hashed; plaintext is only ever sent
-- to the user via the configured EMAIL_DRIVER.
create table if not exists health_api.auth_otp_codes (
  id text primary key,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sources_user_org_idx on health_api.sources(user_id, organization_id);
create index if not exists sources_not_deleted_user_org_idx on health_api.sources(user_id, organization_id) where deleted_at is null;
create index if not exists observations_user_org_idx on health_api.observations(user_id, organization_id);
create index if not exists observations_source_idx on health_api.observations(source_id);
create index if not exists observations_not_deleted_user_org_idx on health_api.observations(user_id, organization_id) where deleted_at is null;
create index if not exists analyses_user_org_idx on health_api.analyses(user_id, organization_id);
create index if not exists analyses_not_deleted_user_org_idx on health_api.analyses(user_id, organization_id) where deleted_at is null;
create index if not exists dashboard_specs_user_org_idx on health_api.dashboard_specs(user_id, organization_id);
create index if not exists dashboard_specs_analysis_idx on health_api.dashboard_specs(analysis_id);
create index if not exists dashboard_specs_not_deleted_user_org_idx on health_api.dashboard_specs(user_id, organization_id) where deleted_at is null;
create index if not exists idempotency_keys_created_at_idx on health_api.idempotency_keys(created_at);
create index if not exists genetic_jobs_status_priority_idx on health_api.genetic_analysis_jobs(status, priority desc, created_at);
create index if not exists genetic_jobs_user_org_idx on health_api.genetic_analysis_jobs(user_id, organization_id);
create index if not exists genetic_jobs_analysis_idx on health_api.genetic_analysis_jobs(analysis_id);
create index if not exists external_accounts_user_org_idx on health_api.external_accounts(user_id, organization_id);
create index if not exists external_accounts_provider_idx on health_api.external_accounts(provider);
create index if not exists connector_sync_jobs_due_idx on health_api.connector_sync_jobs(status, scheduled_for, priority desc);
create index if not exists connector_sync_jobs_user_org_idx on health_api.connector_sync_jobs(user_id, organization_id);
create index if not exists provider_tokens_account_idx on health_api.provider_tokens(external_account_id);
create index if not exists provider_tokens_lookup_idx on health_api.provider_tokens(provider, provider_external_user_id);
create index if not exists webhook_events_user_org_idx on health_api.webhook_events(user_id, organization_id, created_at desc);
create index if not exists webhook_events_type_idx on health_api.webhook_events(type, created_at desc);
create index if not exists goals_user_org_idx on health_api.goals(user_id, organization_id, created_at desc) where deleted_at is null;
create index if not exists lab_locations_provider_active_idx on health_api.lab_locations(provider, is_active);
create index if not exists lab_locations_provider_postal_idx on health_api.lab_locations(provider, postal_code);
create index if not exists lab_locations_provider_city_idx on health_api.lab_locations(provider, lower(city));
create index if not exists lab_locations_provider_country_idx on health_api.lab_locations(provider, country);
create index if not exists lab_locations_coordinates_idx on health_api.lab_locations(provider, latitude, longitude) where latitude is not null and longitude is not null;
create index if not exists auth_otp_codes_email_idx on health_api.auth_otp_codes(email, expires_at desc);
