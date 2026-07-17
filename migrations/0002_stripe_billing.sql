-- Optional hosted Stripe billing state. Self-hosters can apply this safely
-- without configuring Stripe; no outbound billing calls occur without secrets.

create table if not exists health_api.billing_subscriptions (
  stripe_subscription_id text primary key,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  user_id text not null,
  organization_id text not null,
  tier text not null check (tier in ('standard', 'builder', 'growth')),
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_active_workspace_subscription_idx
  on health_api.billing_subscriptions (user_id, organization_id)
  where status in ('active', 'trialing', 'past_due', 'unpaid');
create index if not exists billing_customer_idx on health_api.billing_subscriptions (stripe_customer_id);

create table if not exists health_api.billing_webhook_events (
  stripe_event_id text primary key,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
