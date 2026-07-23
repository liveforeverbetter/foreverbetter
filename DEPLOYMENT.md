# Hosted Fly deployment

The hosted topology intentionally separates fast API work from full-genome
analysis:

- FRA: the HTTP API and wearable worker, without a reference volume.
- AMS: one 4 GB, on-demand WGS Machine with the single encrypted 40 GB
  `dbsnp_refs` volume mounted at `/data/reference`.

The API persists a genetics job before requesting the WGS Machine. If the AMS
Machine is stopped, the dispatcher starts it; if it is already running, it is
left alone. It refreshes the stopped Machine to the current API image before
starting it. A capacity failure keeps the job durable and queued rather than
failing the API request.

## Ordinary release

Do not use a broad `fly deploy` against the hosted app: the isolated WGS volume
is intentionally not represented in `fly.toml`, and a broad deploy can treat it
as drift. Instead, run the checked managed release flow:

```bash
# Inspect the expected topology first (no changes).
npm run deploy:fly -- --app fb-health-api

# Build once, update only FRA API/wearable Machines, then verify /ready.
npm run deploy:fly -- --app fb-health-api --execute
```

The release command requires exactly one `dbsnp_refs` volume in AMS and one
Machine attached to it. It updates the FRA API and wearable worker only. The
next queued genetic job updates and starts the AMS worker automatically, so a
release never interrupts an active WGS run.

## Initial WGS worker bootstrap

Bootstrap is an operator-only step. Restore the known-good dbSNP snapshot into
the worker region, then create the WGS Machine by cloning an existing
app-managed worker configuration and attaching that restored volume. Cloning is
important: it retains the app's durable-storage secret references. A raw
Machines API creation can mount the reference but will not have the S3 payload
credentials needed to read an uploaded WGS file.

After creation, set these deployment secrets and update the FRA API Machine so
they take effect:

- `WGS_DISPATCH_ENABLED=true`
- `WGS_WORKER_APP=<app>`
- `WGS_WORKER_MACHINE_ID=<AMS machine id>`
- `FLY_MACHINE_API_TOKEN=<app-scoped deploy token>`

Use a staged secret update if Fly refuses a broad rollout because of the
intentionally external WGS volume, then run the managed release command to
apply it to the FRA Machines. Do not copy or create a second reference volume
for routine releases.

## Post-release checks

1. `curl -fsS https://fb-health-api.fly.dev/ready`
2. `fly volumes list --app fb-health-api` shows one encrypted `dbsnp_refs`
   volume in AMS, attached only to the WGS Machine.
3. `fly machines list --app fb-health-api` shows FRA API/wearable Machines and
   the separate AMS WGS Machine.
4. Queue a durable genetics analysis and confirm it moves from `queued` to
   `running`; wearable ingestion should remain available throughout.
