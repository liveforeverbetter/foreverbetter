<h1 align="center">ForeverBetter Wellness API</h1>

<p align="center">
  <strong>One self-hostable developer platform for biomarkers, wearables, genetics, wellness context, dashboards, and wellness-aware agents.</strong>
</p>

<p align="center">
  Ingest wellness data, normalize it into one provenance-rich model, run analysis locally or in workers,<br />
  and return action plans, ancestry, trends, health context, and renderer-neutral dashboard contracts.
</p>

<p align="center">
  <a href="https://foreverbetter.xyz"><strong>Website</strong></a> ·
  <a href="https://api.foreverbetter.xyz/dashboard"><strong>Developer dashboard</strong></a> ·
  <a href="https://foreverbetter.mintlify.app/api-reference/introduction"><strong>Documentation</strong></a> ·
  <a href="https://api.foreverbetter.xyz/openapi.json"><strong>OpenAPI</strong></a> ·
  <a href="#run-it-yourself"><strong>Self-host</strong></a>
</p>

<p align="center">
  <a href="https://api.foreverbetter.xyz/ready"><img alt="API status" src="https://img.shields.io/badge/API-live-36b37e?style=flat-square" /></a>
  <a href="https://api.foreverbetter.xyz/openapi.json"><img alt="OpenAPI 3.1" src="https://img.shields.io/badge/REST-OpenAPI_3.1-111111?style=flat-square" /></a>
  <a href="https://foreverbetter.mintlify.app/connect-your-agent"><img alt="MCP compatible" src="https://img.shields.io/badge/agents-MCP_compatible-7c5cff?style=flat-square" /></a>
  <a href="LICENSE"><img alt="AGPL 3.0 license" src="https://img.shields.io/badge/license-AGPL--3.0-256e5b?style=flat-square" /></a>
</p>

## What can you build?

### Turn wellness data into a custom dashboard and action plan

Upload biomarkers and wearable observations, run a multimodal analysis, request a ranked action plan, and render the same versioned dashboard contract in your own product language.

<p align="center">
  <a href="assets/demos/multimodal-dashboard.mp4">
    <img src="assets/demos/multimodal-dashboard.gif" alt="Real local biomarker and wearable imports rendered as a healthspan dossier in the ForeverBetter design system" width="760" />
  </a>
</p>

<p align="center"><a href="assets/demos/multimodal-dashboard.mp4"><strong>Watch the full-quality dashboard flow</strong></a></p>

### Deliver a daily priority plan in chat

Give a scheduled agent a scoped key. It reads the latest health context and the ranked action plan, then posts the day's brief wherever your runtime delivers messages: Telegram, WhatsApp, Slack, or your own app.

<p align="center">
  <a href="assets/demos/agent-daily-brief.mp4">
    <img src="assets/demos/agent-daily-brief.gif" alt="An agent delivering the daily priority plan in a chat conversation, styled with the Aperture design system" width="760" />
  </a>
</p>

<p align="center"><a href="assets/demos/agent-daily-brief.mp4"><strong>Watch the full-quality chat delivery flow</strong></a></p>

### Map ancestry from a VCF

Accept WGS VCF/VCF.GZ or supported SNP-array data and return continental or regional ancestry, coverage, confidence, reference-panel metadata, and method disclosure.

<p align="center">
  <a href="assets/demos/ancestry-from-vcf.mp4">
    <img src="assets/demos/ancestry-from-vcf.gif" alt="Real VCF import and provenance-aware regional ancestry result rendered as an editorial dossier" width="760" />
  </a>
</p>

<p align="center"><a href="assets/demos/ancestry-from-vcf.mp4"><strong>Watch the full-quality ancestry flow</strong></a></p>

### Sync Google Health Connect readings directly

Use the stable mobile SDK envelope to send user-authorized Android readings directly into ForeverBetter. The API preserves observation timestamps, ownership, source IDs, and provider provenance.

<p align="center">
  <a href="assets/demos/wearable-mobile-sync.mp4">
    <img src="assets/demos/wearable-mobile-sync.gif" alt="Health Connect mobile readings normalized and stored through the SDK sync endpoint, styled with the Aperture design system" width="760" />
  </a>
</p>

<p align="center"><a href="assets/demos/wearable-mobile-sync.mp4"><strong>Watch the full-quality mobile sync flow</strong></a></p>

### Give apps and agents one complete developer surface

Combine REST, MCP, scoped API keys, provider connections, webhook events, design-system contracts, Stripe subscriptions, and x402 pay-per-request access without coupling your product to an internal connector implementation.

<p align="center">
  <a href="assets/demos/wearable-data-console.mp4">
    <img src="assets/demos/wearable-data-console.gif" alt="ForeverBetter developer console with modalities, agents, payments, and design contracts in the Meridian design system" width="760" />
  </a>
</p>

<p align="center"><a href="assets/demos/wearable-data-console.mp4"><strong>Watch the full-quality developer surface</strong></a></p>

The media is reproducible. Run `npm run build && npm run demos:record` to boot a temporary in-memory API, execute real endpoint calls, record all five flows with Playwright, and encode MP4 and GIF assets with FFmpeg. Every scene is styled from the design tokens the running API returns on `GET /design/systems`, so the recordings always match the shipped design contracts.

## Agent quickstart

The fastest onboarding is agent-led. Paste this into Claude, or into any agent that can call an HTTP API or speak MCP:

```text
Help me analyze and connect my longevity data.
Read https://api.foreverbetter.xyz/SKILL.md and follow its onboarding instructions.
```

The skill file is the agent operating contract. Install it as a skill or paste it as a prompt; either way the agent runs the whole onboarding:

1. It reads the skill, then discovers the live surface with `GET /capabilities` and the agent manifest at `/.well-known/health-agent.json`.
2. It starts `POST /agent-login/start` and hands you a sign-in URL. You approve the named agent in your browser, and the API returns a scoped personal key once, directly to the waiting agent. No OTP, API key, or OAuth code ever passes through chat.
3. It connects the data you already have, runs the analysis, and delivers the outcome you asked for: an action plan, a custom dashboard, an ancestry breakdown, or a recurring daily brief like the chat flow above.

With the key in hand, the same API attaches to Claude over MCP:

```bash
claude mcp add --transport http foreverbetter \
  https://api.foreverbetter.xyz/mcp \
  --header "Authorization: Bearer <api key>"
```

[Connect your agent](https://foreverbetter.mintlify.app/connect-your-agent) covers the same skill in local pipeline mode and against a self-hosted deployment.

## Start building on the hosted API

### 1. Inspect the live platform

Discovery endpoints are public and reflect the configuration of the running deployment:

```bash
curl -s https://api.foreverbetter.xyz/capabilities | jq .
curl -s https://api.foreverbetter.xyz/design/systems | jq .
curl -s https://api.foreverbetter.xyz/.well-known/health-agent.json | jq .
```

### 2. Create a developer key

Open the [developer dashboard](https://api.foreverbetter.xyz/dashboard), sign in with the code sent to your email, and create a personal workspace key. An agent can instead start the explicit approval flow at `POST /agent-login/start`. Agent-login keys are shown once and do not include billing or account-deletion permissions.

```bash
export FB_API=https://api.foreverbetter.xyz
export FB_KEY="your-api-key"
export USER_ID="your-user-id"
export ORGANIZATION_ID="your-workspace-id"
```

### 3. Upload biomarkers

```bash
SOURCE_ID=$(curl -s "$FB_API/imports/file" \
  -H "authorization: Bearer $FB_KEY" \
  -H "content-type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "organization_id": "'"$ORGANIZATION_ID"'",
    "category": "biomarkers",
    "filename": "labs.csv",
    "text": "marker,value,unit\nGlucose,92,mg/dL\nInsulin,7,uIU/mL\nTriglycerides,110,mg/dL\nHDL,55,mg/dL"
  }' | jq -r '.source.id')
```

### 4. Analyze and render

```bash
ANALYSIS_ID=$(curl -s "$FB_API/biomarkers/derive" \
  -H "authorization: Bearer $FB_KEY" \
  -H "content-type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "organization_id": "'"$ORGANIZATION_ID"'",
    "source_ids": ["'"$SOURCE_ID"'"]
  }' | jq -r '.id')

curl -s "$FB_API/analyses/$ANALYSIS_ID/action-plan" \
  -H "authorization: Bearer $FB_KEY" | jq .

curl -s "$FB_API/dashboard-specs/$ANALYSIS_ID" \
  -H "authorization: Bearer $FB_KEY" | jq .
```

## One pipeline across every modality

```mermaid
flowchart LR
    A[Files and connected sources] --> B[Owned source records]
    B --> C[Normalized observations]
    C --> D[Direct and derived interpretations]
    D --> E[Modality or multimodal analysis]
    E --> F[Action plans]
    E --> G[Dashboard specs]
    E --> H[Bounded health context]
    H --> I[Apps and AI agents]

    J[Biomarkers] --> A
    K[Wearables] --> A
    L[Genetics] --> A
    M[Goals and lifestyle] --> A
```

| Primitive | What it represents |
| --- | --- |
| **Source** | An owned raw upload or provider sync with storage mode, timestamp, and provenance. |
| **Observation** | A normalized lab value, wearable metric, supplement, symptom, or other direct reading. |
| **Interpretation** | A scored status, derived metric, genetic result, or combined finding. |
| **Analysis** | A modality-specific or multimodal run over one or more source IDs. |
| **Dashboard spec** | Versioned, renderer-neutral JSON for cards, sections, quality, freshness, coverage, and provenance. |
| **Action plan** | Ranked actions tied back to findings, evidence boundaries, and cadence. |

One modality is still useful. Responses report what is present, what is missing, and which results are direct, derived, combined, queued, failed, or waiting for setup.

## Supported capabilities

| Modality | Inputs and connections | Outputs |
| --- | --- | --- |
| **Biomarkers** | CSV, JSON, plain text, and supported lab PDFs | Direct values, unit-aware ranges, derived biomarkers, interpretations, trends, and action priorities |
| **Wearables** | WHOOP OAuth, Oura OAuth, Google Health Connect mobile bridge, and normalized file import | Sleep, HRV, heart rate, readiness, activity, SpO2, energy, body composition, and other normalized observations |
| **Genetics** | Private VCF/VCF.GZ direct upload and supported SNP-array exports | Wellness interpretation, ancestry, haplogroups, pharmacogenomic context, job status, and reference metadata |
| **Health context** | Goals, symptoms, medications, supplements, lifestyle, user notes, and existing analyses | Bounded cross-modality context for products and agents |
| **Provider discovery** | Modality, provider type, and region filters | Lab locator handoffs, wearable capabilities, and genetic testing or WGS provider records |

Use `GET /capabilities` as the runtime source of truth. Full dbSNP analysis is an advanced worker mode that requires a persistent 30 to 40 GB reference cache per genome build. The API reports `available` or `requires_setup` instead of pretending it is configured.

## Built for bounded agents

ForeverBetter exposes the same health contract through REST and 21 MCP tools. Agent identities carry user, organization, scope, and optional endpoint grants. The browser approval flow names the requesting agent, keeps the polling secret out of the URL, requires explicit approve or deny, and returns the API key only once.

Examples of bounded agent questions:

```text
What changed since my last biomarker panel?
Which recovery signals are trending down this week?
Which findings are direct measurements and which are derived?
Show the source and timestamp behind this dashboard card.
Build me a custom action plan & dashboard.
Add to OpenClaw or Hermes Agent to ping me on a daily basis with my dashboard and top priorities for the day.
Export everything this agent is allowed to access for this user.
```

For daily delivery, the agent should use a user-approved scoped key, read the latest health context and action plan, generate or reuse a private dashboard link, and schedule the notification in the user's OpenClaw or Hermes environment. ForeverBetter supplies the data contract and bounded credentials. The agent runtime owns the schedule and delivery channel.

Start with [Connect your agent](https://foreverbetter.mintlify.app/connect-your-agent), inspect the [agent manifest](https://api.foreverbetter.xyz/.well-known/health-agent.json), or call `POST /mcp` with `tools/list`.

## Design systems are API features

`GET /design/systems` is a public catalog of three curated, production-ready wellness-product design contracts. Each includes colors, typography, spacing, radii, elevation, motion, signature components, responsive behavior, full modality sections, action-plan structure, data-capture requirements, layout identity, and a ready-to-paste `DESIGN.md`.

| ID | Structure | Best for |
| --- | --- | --- |
| `foreverbetter` | Editorial healthspan dossier | Full multimodal longevity reports |
| `aperture` | Calm daily health overview | Consumer coaching, health pillars, and source-aware records |
| `meridian` | Healthspan performance workspace | Agent-built wearable dashboards |

```bash
curl -s "$FB_API/design/systems/aperture" | jq .
curl -s "$FB_API/design/systems/meridian/implementation" > meridian-dashboard.json
```

The Meridian implementation endpoint returns the exact production HTML, CSS, JavaScript, asset map, checksums, selectors, and API bindings. ForeverBetter and Aperture return reproducible token and layout contracts so a client can build a distinct UI without losing modalities, provenance, or action-plan fields. The README videos above are rendered from these same contracts.

## API structure

The source of truth is [`src/endpoints.ts`](src/endpoints.ts), which defines 48 endpoint capabilities and their required scopes. The HTTP layer also exposes public auth, discovery, dashboard, provider-webhook, health, version, OpenAPI, MCP, and payment-discovery routes. Core REST routes accept a `/v1/` alias, while the mobile SDK keeps its stable `/api/v1/` path.

| Area | Representative endpoints |
| --- | --- |
| Discover | `GET /capabilities`, `GET /providers`, `GET /pricing`, `GET /design/systems` |
| Authenticate | `POST /auth/otp/start`, `POST /auth/otp/verify`, `POST /agent-login/start`, `POST /api-keys` |
| Import | `POST /imports/file`, `POST /genetics/uploads`, `POST /genetics/uploads/{id}/complete`, mobile SDK sync |
| Connect | Wearable start, callback, status, WHOOP/Oura sync and refresh, provider webhooks |
| Analyze | Biomarker, wearable, genetics, ancestry, multimodal analysis, rerun, and job status |
| Act | Recommendations, action plans, goals, trends, and retest reminders |
| Render | Dashboard specs, private snapshot links, design systems, and the Meridian implementation contract |
| Query | Unified health context, grounded query, REST, and MCP |
| Govern | Export, deletion, webhook events, API keys, billing status, and admin readiness |

Machine-readable surfaces:

- OpenAPI 3.1: `GET /openapi.json`
- endpoint catalog: `GET /endpoints`
- agent discovery: `GET /.well-known/health-agent.json`
- x402 discovery: `GET /.well-known/x402.json`
- MCP: `POST /mcp`
- public readiness: `GET /ready`
- authenticated diagnostics: `GET /ready/details` with `health:admin`

## Payment options

Stripe subscriptions and x402 pay-per-use payments are available.

## Run it yourself

### Prerequisites

- Docker Engine with Docker Compose v2
- `openssl` for generating secrets
- 2 GB or more of disk for the base image and additional storage for Postgres and uploaded payloads
- a domain and TLS reverse proxy for any internet-facing deployment
- additional persistent storage for full dbSNP mode

### Local Docker Compose

```bash
git clone https://github.com/liveforeverbetter/foreverbetter-api.git
cd foreverbetter-api
cp .env.example .env
```

Edit `.env` and replace every `change-me` value. Generate independent secrets:

```bash
openssl rand -hex 32   # POSTGRES_PASSWORD
openssl rand -hex 32   # API_KEY_JWT_SECRET
openssl rand -hex 32   # SERVICE_ACCOUNT_JWT_SECRET
openssl rand -hex 32   # AUDIT_IP_HASH_SALT
```

The production example defaults email login off. Start the stack and mint the first operator key:

```bash
docker compose up -d
curl http://localhost:8787/ready

docker compose exec api node scripts/mint-api-key.mjs \
  --out - --user you --org your-org --scope "health:admin"
```

The minimal stack starts PostgreSQL, the API, the genetics worker, and the wearable worker. Raw payloads use the shared Docker volume by default. The API container applies migrations on boot.

Optional local-only profiles:

```bash
# Local SMTP inbox. Set EMAIL_DRIVER=smtp, SMTP_HOST=mailpit, SMTP_PORT=1025.
docker compose --profile mail up -d
# UI is loopback-only at http://127.0.0.1:8025

# Local S3-compatible storage. Set unique S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY first.
docker compose --profile s3 up -d
# MinIO API and console are loopback-only by default.
```

Do not expose Mailpit or the MinIO console to the internet. Compose requires an explicit PostgreSQL password and explicit MinIO credentials. Local secret files should be mode `0600`.

For a database outside Compose, set `DATABASE_SSL=require`. Certificate verification is on. If the database uses a private CA, set `DATABASE_SSL_CA` to its PEM text with newlines encoded as `\n`.

### Run from source without Docker

For a disposable local process with no database:

```bash
npm ci
npm run build
STORE_MODE=memory AUTH_MODE=disabled EMAIL_DRIVER=none NODE_ENV=development npm start
```

For production from source, use PostgreSQL 16, durable payload storage, `AUTH_MODE=service_account` or `oidc`, verified TLS, and separate API and worker processes:

```bash
npm ci
npm run build
npm run migrate
npm start
node dist/workers/wearables-worker.js
node dist/workers/genetics-worker.js
```

The Docker image includes `bcftools`, `tabix`, and the pinned TypeScript runtime needed by the bundled genetics pipeline.

[`SELF_HOSTING.md`](SELF_HOSTING.md) covers storage drivers, email sign-in, wearable credentials, backups, and upgrades.

## Development and verification

```bash
npm ci
git config core.hooksPath .githooks
npm run typecheck
npm run build
npm test
npm run skill:verify
npm run package:verify
npm audit --omit=dev
docker compose config --quiet
npm run demos:record
```

PostgreSQL store tests run when `TEST_DATABASE_URL` is set. The scheduled readiness workflow runs the build, tests, skill verification, package verification, docs validation, dependency audit, and Compose validation. GitHub Actions are pinned to reviewed full commit SHAs.

## License

AGPL-3.0-only. See [`LICENSE`](LICENSE).

---

<p align="center">
  <strong>Build wellness products around the whole person, with source boundaries that agents and users can inspect.</strong>
</p>

<p align="center">
  <a href="https://api.foreverbetter.xyz/dashboard">Create a developer key</a> ·
  <a href="#run-it-yourself">Run it locally</a> ·
  <a href="https://api.foreverbetter.xyz/openapi.json">Download OpenAPI</a>
</p>

<sub>ForeverBetter provides wellness and educational infrastructure. It is not medical advice and is not intended for diagnosis, treatment, or emergencies.</sub>
