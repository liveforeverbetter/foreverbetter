-- Durable first-value allowance for the managed cloud. This table is not used
-- by self-hosted deployments unless BILLING_ENABLED is explicitly configured.

create table if not exists health_api.hosted_introductory_usage (
  user_id text not null,
  organization_id text not null,
  requests_used integer not null default 0 check (requests_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);
