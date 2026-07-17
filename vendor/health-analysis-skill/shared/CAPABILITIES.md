# Capabilities: local pipeline vs cloud API

The skill runs two ways with the same canonical output. This map keeps the two
in sync and shows what each mode uniquely offers.

| Capability | Local pipeline | Cloud API endpoint |
| --- | --- | --- |
| Ingest genetics (VCF/WGS/SNP) | ✅ on-device parse + annotate | `POST /imports/file` (category `genetics`) |
| Ingest biomarkers | ✅ parser (CSV/JSON/text/PDF) | `POST /imports/file` (category `biomarkers`) |
| Ingest wearables (file) | ✅ WHOOP/Oura/Apple/Garmin exports | `POST /imports/file` (category `wearables`) |
| Connect wearable by OAuth | ❌ needs a server | `POST /connections/wearables/start` + `/callback` + `/sync` |
| Run analysis | ✅ composer | `POST /analyses`, `/biomarkers/analyze`, `/wearables/analyze`, `/genetics/analyze` |
| Evidence-graded action plan | ✅ | `GET /analyses/{id}/action-plan` |
| Prioritized recommendations | ✅ | `GET /analyses/{id}/recommendations` |
| Dashboard spec | ✅ rendered HTML | `GET /dashboard-specs/{id}` |
| Genetic ancestry | ✅ AIM engine | `POST /genetics/ancestry` |
| PRS / ClinVar / CPIC (deep genomics) | ✅ on-device (privacy) | partial (via `genetics/analyze`) |
| Consolidated health context | plan summary | `POST /users/{id}/health-context` |
| Trends over time | ❌ single run | `POST /users/{id}/trends` |
| Retest reminders | ❌ | `GET /users/{id}/retest-reminders` |
| Goals | ❌ | `POST/GET /users/{id}/goals` |
| Design systems (theming) | ✅ bundled `design/systems.json` | `GET /design/systems` |
| Provider discovery | ✅ bundled `providers.json` | `GET /providers?modality=...` |
| Agent tools (MCP) | this skill is the tool | MCP at `POST /mcp` |

## When to use which

- **Local**: privacy-sensitive genomics, offline, free, one-off analysis of
  files the user already has. Deepest genomic compute stays on the machine.
- **Cloud**: connect a wearable by login instead of export, keep history, get
  retest reminders and trends, or serve a hosted dashboard. Requires a key from
  `${HEALTH_API_URL}/dashboard`.
- **Hybrid**: run genomics locally for privacy, then push the derived
  observations to the cloud for tracking. Same canonical shapes make this clean.

The cloud client that implements the right column is `cloud-client.ts`.
