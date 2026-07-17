# Genomic Analysis Pipeline

This is the architecture reference for `SKILL.md`. Keep detailed step notes here so the skill entrypoint stays concise.

For the best-available WGS interpretation checklist, including rsID annotation, VEP, CNV/SV/repeat interpretation, raw-read caller escalation, GIAB validation, and dashboard disclosure requirements, read `references/wgs-process.md`.

## Current Flow

```text
VCF/WGS or SNP array
  -> parse-vcf.ts
     -> optional rsID annotation with bundled ClinVar GRCh37 rsID subset or full dbSNP
     -> optional VEP functional annotation
     -> interpretation DB, ClinVar, CPIC, genotype map
  -> pipeline/index.ts
     -> mapProtocolToTraits()
     -> mapClinVarToTraits()
     -> mapCPICToTraits()
     -> mapVEPToTraits()
     -> mergeTraitScores()
     -> enrichTraits()
     -> computePRS()
     -> computeHallmarkScores()
     -> compute priorities, insights, protocols, GLI
  -> optional health_data_import.ts
     -> biomarker CSV/JSON/plain-text lab export
     -> WHOOP-style daily CSV/API JSON export
     -> biomarker_engine.ts + wearable_engine.ts
     -> multimodal_engine.ts
  -> transformToDashboardData()
  -> renderDashboard()
  -> {user_id}_dashboard.json + index.html
```

## Entry Points

Run from `skills/longevity-analysis` unless a command says otherwise.

| Command | Purpose |
|---|---|
| `npm run sample:report` | Render the local sample dashboard from `../../output/test_user_dashboard.json` plus biomarker and WHOOP fixtures. |
| `npm run evaluate` | Release-style weighted score across genomic coverage, multimodal coverage, website claims, consumer-WGS-platform coverage, actionability, and static UI/UX. |
| `npm run audit:pipeline` | Internal diagnostic JSON/Markdown report for every major processing, visualization, sample-data, and skill-hygiene step, plus internal-only quality scores for genetics, biomarkers, wearables, and dashboard UX. |
| `npm test` | Focused unit coverage for pipeline engines and importers. |
| `npm run test:renderer` | Renderer smoke test and optional-section checks. |
| `npm run catalog:build` | Builds the compact VCF-first interpretation catalog from repo-contained interpretation, PRS, WGS class, and knowledge-graph sources. |
| `npm run interpretation:depth` | Builds the internal compact-source depth report across curated markers, ClinVar target genes, CPIC rules, PRS weights, and WGS class slices. |
| `npm run reference:doctor` | Checks optional heavyweight reference presence, expected filenames/sizes, local tool availability, and setup actions from `references/optional-reference-manifest.json` without downloading anything. |
| `npm run reference:setup` | Writes a dry-run JSON and shell command plan for optional ClinVar, dbSNP, VEP, caller-tool, and GIAB setup. Downloads require explicit `--download`. |
| `npm run reference:wellness` | Downloads GWAS Catalog + PGS Catalog source files into ignored local cache and rebuilds compact committed wellness references for GWAS/PGS interpretation. |
| `npm run setup:rsids` | Downloads current NCBI ClinVar GRCh37, verifies MD5, and rebuilds the bundled lean rsID annotation TSV plus compressed interpretation index. |
| `npm run doctor:vcf -- <vcf>` | Counts variants, rsID coverage, WGS likelihood, and warns when rsID density is too low for strong interpretation. |
| `npm run annotate:vcf -- <input.vcf.gz> <output.annotated.vcf.gz>` | Adds ClinVar-derived rsIDs with `bcftools annotate`. This is ClinVar-only recovery, not full dbSNP annotation. |
| `npm run reference:fixtures` | Validates tiny rsID, ClinVar, WGS class, and GIAB-style fixture records without large references. |
| `npm run cnv:validate` | Validates the compact CNV/SV/repeat evidence schema and provenance fixture. |
| `npm run wgs:truthsets` | Local-only preflight for external WGS validation. Writes expected GIAB truth VCF/BED/index, query VCF/index, metrics, and benchmark-tool readiness to `output/wgs-external-truthset-setup.json`. |
| `npm run wgs:truthsets -- --check-remote` | Adds remote HTTP metadata for downloadable truth artifacts without downloading file bodies. |
| `npm run wgs:truthsets -- --download --max-mb=500` | Downloads configured truth VCF/BED/index artifacts when exact URLs are known and each artifact is within the size guard. Does not create query VCFs, query indexes, or metrics. |
| `npm run wgs:truthsets -- --download --force` | Downloads configured truth artifacts even when remote size metadata is unavailable or over the configured guard. |
| `npm run wgs:query-readiness` | Quantifies whether each external WGS truthset can generate a local HG002 query VCF from real BAM/CRAM, reference, caller-specific inputs, and installed caller tools. Also emits per-truthset setup, caller, postprocess, and validation run plans. |
| `npm run wgs:external-validation` | Fail-closed preflight for external WGS precision/recall. |
| `npm run wgs:external-validation -- --run` | Run Truvari/hap.py once truth artifacts, HG002 query VCFs, and benchmark tools are present. |
| `npx tsx scripts/pipeline/index.ts --genetics=<vcf> --biomarkers=<csv> --wearables=<json> --user=<id> --out=<dir>` | Full local pipeline. Genetics is optional — any non-empty combination of the three modality flags drives the canonical PersonalizedActionPlan composer. Positional arguments are rejected with a fix-hint error. |
| `npx tsx scripts/pipeline/index.ts --doctor --biomarkers=<csv> --wearables=<json>` | Unified preflight for any combination of inputs. Reports problem + cause + fix + example without running the analysis. |

For an ordered WGS completion checklist, use `references/wgs-process.md`.

When installed as the public `analyze-longevity` skill, run the same commands from the implementation directory, for example `~/.codex/skills/analyze-longevity/skills/longevity-analysis`.

## Step Outputs To Watch

| Step | Primary output | Quantitative checks |
|---|---|---|
| VCF ingestion | annotated variant count, genotype map | WGS-scale count, explicit reduced-coverage behavior, VEP included/skipped status |
| Interpretation DB | matched marker set | curated marker count, category coverage |
| Trait mapping | merged trait list | trait count, duplicate trait IDs, evidence-tier/confidence retention |
| ClinVar/CPIC/VEP/PRS | enrichment metadata and variant cards | variant-card count, ClinVar confidence tiers, CPIC count, PRS supported/scored count, VEP disclosure |
| Interpretation depth | `output/interpretation-depth-report.json` | source-family count, ClinVar target genes, CPIC rules, PGS variants, default large-DB policy |
| Graph enrichment | enriched traits | mechanism/action presence, fallback nodes for unmatched traits |
| Priority/insight/protocol | action plan and protocols | priority count, duplicate priority IDs, insight count, duplicate titles, protocol count |
| Biomarkers | `biomarker_analysis` embedded JSON | measured count, domain coverage, missing-priority map |
| Wearables | `wearable_analysis` embedded JSON | measured count, domain coverage, WHOOP field mapping |
| Fusion | `multimodal_plan` embedded JSON | source modality provenance, next upload, cross-modal action count |
| Rendering | self-contained HTML | no unreplaced tokens, parseable embedded JSON, section order, no blank generated cards |
| Skill hygiene | `SKILL.md` and reference docs | no duplicated engine rows, concise skill body, current command references |

## Local Difficulty

The consumer dashboard and sample report are easy to run locally: Node dependencies plus `npm run sample:report` are enough for the integrated genomics/biomarker/wearable dashboard.

The default product assumption is VCF-first. Most users should provide a WGS VCF/VCF.GZ from a sequencing provider or a 23andMe/Ancestry-style SNP-array export. Raw-read caller stacks are not required for this default path. They are only needed when the user provides FASTQ/BAM/CRAM, when a provider VCF omits CNV/SV/repeat records needed for a report section, or when the pipeline is regenerating query VCFs for external GIAB-style validation.

For WGS VCFs, run `npm run doctor:vcf -- <vcf>` first. If rsID density is low, run `npm run annotate:vcf -- <vcf> <output.annotated.vcf.gz>`. The bundled default reference is a ClinVar-derived GRCh37 rsID subset, so the dashboard must disclose that it is not full dbSNP annotation and that VUS findings are not medical action triggers.

Run `npm run catalog:build` to regenerate the repo-contained compact interpretation catalog at `output/compact-interpretation-catalog.json`. The catalog records:

- VCF and SNP-array inputs as the expected default.
- Raw-read callers as optional escalation, not a local dependency.
- Curated rsID markers, ClinVar gene-review templates, CPIC drug-gene rules, PRS traits, WGS class-readiness entries, and knowledge-graph topics.
- Optional external sources such as ClinVar, CPIC, PGS Catalog, GWAS Catalog, and Open Targets Genetics without vendoring large raw archives. The compact `reference/wellness/` GWAS/PGS outputs are committed because they are small runtime indexes; `reference/wellness/raw/` remains ignored.
- A size budget so the repo stays small while generated local caches can live outside git.

Run `npm run interpretation:depth` to regenerate `output/interpretation-depth-report.json`. This is an internal-only benchmark, not a user-facing score. It verifies that the compact local slices cover enough source families and interpretation depth while keeping the default product path repo-contained. Current targets include at least 5 compact source families, 150 ClinVar target-gene templates, 10 CPIC gene-drug rules, 180 selected PGS variants, and no large database requirement for normal VCF/23andMe dashboard generation.

Current readiness should be read quantitatively from `output/wgs-query-readiness.json` and `output/wgs-local-setup-plan.sh`:

| Area | Current local state | Difficulty |
|---|---|---|
| Sample consumer dashboard | Uses existing sample genomics, biomarkers, and WHOOP-shaped fixtures | Easy |
| Compact interpretation catalog | `npm run catalog:build` compiles repo-contained VCF-first interpretations and source policy | Easy |
| Interpretation depth report | `npm run interpretation:depth` checks ClinVar/CPIC/PGS/WGS local slices without downloading large archives | Easy |
| Local VCF fixture coverage | `npm run vcf:coverage` measures bundled SNP, indel, CNV, SV, repeat, curated-marker, and PRS overlap across local VCFs | Easy |
| Truth artifact setup | GIAB truth VCF/BED/index artifacts are configured and can be preflighted/downloaded | Medium |
| Query VCF generation | Requires HG002 BAM/CRAM, matching reference, caller-specific inputs, and caller runtimes | Hard |
| Caller runtime fallback | `npm run wgs:query-readiness` emits caller container plans where a concrete image exists; GATK-SV still requires Cromwell/WDL runtime setup | Medium/hard |
| Query post-processing | Requires `bcftools`, `bgzip`, and `tabix`; these are checked separately from callers | Easy/medium |
| External benchmark execution | Native Truvari/hap.py are preferred; Docker fallback commands are emitted when Docker is present | Medium |
| Full WGS validation pass | Requires real query VCFs, indexes, benchmark tools/containers, and passing precision/recall metrics | Hard |

GIAB means Genome in a Bottle, a NIST-led public reference-genome project. In this repo, GIAB is used only as an external truthset source for advanced WGS validation: the local caller stack generates HG002 query VCFs, then benchmark tools compare those calls with trusted GIAB truth VCF/BED files for precision and recall.

Full WGS external validation is the hard local path. It is not required for normal VCF/23andMe dashboard generation. It needs:

- External truth artifacts, currently GIAB-style VCF/BED files plus VCF indexes under `external-truthsets/giab/`.
- Matching HG002 query VCFs and indexes produced by the local caller pipeline. These are intentionally not downloadable or fabricated by the setup command.
- Benchmark tools such as Truvari and hap.py, or pinned Docker images referenced by `npm run wgs:query-readiness`.
- For raw-read caller coverage, caller runtimes such as GATK/GATK-SV or equivalent CNV/SV/repeat/small-variant callers.
- A real HG002 BAM/CRAM, matching reference FASTA, and caller-specific inputs such as repeat catalogs, CNV intervals, and cohort model paths.

Local VCF coverage is the lightweight coverage path. Run `npm run vcf:coverage` to regenerate `output/local-vcf-coverage.json`. The current local fixture target is:

- At least 1,000,000 total local VCF records.
- At least 500,000 unique rsIDs.
- At least 5 variant classes across SNP, indel, CNV, SV/rearrangement, and repeat-style fixtures.
- At least 75 observed curated interpretation rsIDs.
- At least 40 observed PRS rsIDs.

`npm run sample:report` regenerates this local coverage summary and embeds the summary in the generated dashboard payload under `quality.local_vcf_coverage`.

Use `npm run wgs:truthsets` first. It is a zero-download preflight that tells you exactly what truth/query/metrics artifacts are missing. Use `npm run wgs:query-readiness` next to see whether the local machine can actually generate the missing HG002 query VCFs and to inspect the generated run plans. The readiness output includes an internal `setup_plan` object, a `local_run_assessment` object, and an executable setup script at `output/wgs-local-setup-plan.sh`.

The setup script is intentionally phase-based:

- `./output/wgs-local-setup-plan.sh summary` prints the quantified difficulty, estimated setup/runtime ranges, missing inputs, and native setup hints.
- `./output/wgs-local-setup-plan.sh check-inputs` fails closed until all required local paths exist.
- `./output/wgs-local-setup-plan.sh pull-containers` pulls pinned caller and benchmark containers where runnable images exist.
- `./output/wgs-local-setup-plan.sh print-plan` prints the caller, postprocess, and validation commands without launching a WGS run.

Use `npm run wgs:truthsets -- --check-remote` to estimate download size before fetching anything. Use `npm run wgs:external-validation` after that to confirm whether the configured truthsets are runnable. Only use `--download` or `--run` when the workstation is ready for larger files and bioinformatics tool dependencies.

## Evaluation Artifacts

`npm run audit:pipeline` writes:

- `output/pipeline-audit.json`
- `output/pipeline-audit.md`

The audit is intentionally more diagnostic than `npm run evaluate`. Use it when the dashboard passes the release gate but still feels redundant, visually fragile, or hard to reason about.

The `internal_quality` section is for model/agent iteration only. Do not render those scores in the consumer dashboard. Use the lowest category and its `next_actions` as the next goal-loop target.

## Condition Catalog Layer

`skills/longevity-analysis/{folder}/catalog/` is the condition-centric companion to the variant-centric files in `shared/interpretations/`. For each of the six consumer modalities it ships a curated set of conditions with their gene panels and clinical narrative, ready for the VCF pipeline to surface alongside the user's actual variant calls.

| Modality folder | catalog entries | editorial entries | gene panels |
|---|---:|---:|---:|
| `genetic-vulnerability/catalog/` (polygenic) | 101 | 101 | 101 |
| `hereditary/catalog/` (monogenic / carrier) | 204 | 204 | 204 |
| `pharmacology/catalog/` | 80 | 80 | 23 pharmacogenes + variant catalog |
| `personality/catalog/` (personal traits) | 78 | 78 | 78 |
| `wellness/catalog/` | 44 | 44 | 44 |
| `ancestry/catalog/` | 136 populations | — | — |

Each `catalog/` folder contains:

- `catalog.json` — id / name / slug for every condition the modality surfaces
- `editorial.json` — clinical narrative blocks per condition (description, symptoms, prevention, causes, dose, technical_description, technical_citations)
- `gene_map.json` — gene panel per condition (id → [HGNC gene symbols])
- `status_lookup.json` — id → human-readable status label (where applicable)
- `README.md` — schema notes and consumption example

Pharmacology additionally ships `pharmacogene_variant_catalog.json` (per-gene variant catalog with rsIDs, GRCh38 positions, and named star alleles) plus `pharmacogene_list.json` covering 23 genes (ABCG2, CYP2B6, CYP2C9, CYP2C19, CYP2D6, CYP3A4, CYP3A5, CYP4F2, DPYD, G6PD, HLA-A, HLA-B, IFNL3, MT-RNR1, NAT2, NUDT15, RYR1, SLCO1B1, TPMT, UGT1A1, VKORC1, CACNA1S, CFTR).

Ancestry contains `population_encyclopedia.json` (continent / area / group / overview for 136 populations) and `user_snapshot.json` as a reference example of the composition tree + haplogroup shape the pipeline emits.

### Surfacing in VCF analysis

Two surface layers are wired into the pipeline orchestrator and run automatically whenever `runPipelineFromVCF()` produces a `DashboardOutput`.

**Layer 1 — gene-level matches** (`scripts/pipeline/catalog_loader.ts`):
Cheap intersection of the user's HGNC gene set with each modality's gene panels. Always populated. Exposed at `DashboardOutput.metadata.condition_catalog_matches`.

```ts
import { loadCatalog, surfaceForGenes } from './catalog_loader.js';
const monogenic = loadCatalog('hereditary');
const matches = surfaceForGenes(monogenic, userGeneSet);
// matches[i] = { id, name, editorial, matched_genes, all_genes, match_ratio }
```

**Layer 2 — evidence-resolved findings** (`scripts/pipeline/catalog_evidence_resolver.ts`):
Joins each catalog condition to the actual evidence streams the pipeline already computes from the VCF. Exposed at `DashboardOutput.metadata.condition_catalog_findings`.

| Modality | Evidence source | Output |
|---|---|---|
| Hereditary | ClinVar `confidenceTier === 'pathogenic_likely_pathogenic'` calls in the panel genes | `monogenic_status: variant_absent / carrier / likely_affected` + pathogenic variants |
| Pharmacology | CPIC star-allele matches whose gene is in the panel (or whose drug name overlaps the catalog entry) | metabolizer phenotype + dose recommendation + CPIC level + guideline URL |
| Genetic-vulnerability (polygenic) | PGS Catalog scores whose disease name overlaps the catalog entry | percentile + risk label + PGS source ID + coverage % |
| Personality / Wellness | PGS Catalog + GWAS Catalog hits whose trait name overlaps the catalog entry | percentile + GWAS top hit rsID + effect size |
| Ancestry | (use the existing haplogroup pipeline) | — |

```ts
import { resolveCatalogEvidence } from './catalog_evidence_resolver.js';

const findings = resolveCatalogEvidence({
  userGenes: userGeneSet,
  clinvarAnnotations: result.clinvarAnnotations,
  cpicMatches,
  prsScores,
  gwasTraits,
});
// findings.modalities.hereditary[i].monogenic_status   → "carrier"
// findings.modalities.hereditary[i].clinvar_evidence   → [{ rsid, gene, sig, disease }]
// findings.modalities.pharmacology[i].cpic_evidence    → [{ gene, drug, phenotype, recommendation }]
// findings.modalities['genetic-vulnerability'][i].prs_evidence → [{ source_id, percentile, risk_label }]
```

The resolver introduces no new external dependencies — every evidence stream it joins was already computed by the existing pipeline (`clinvar_enrichment.ts`, `cpic_enrichment.ts`, `prs_engine.ts`, `gwas_engine.ts`). The catalog supplies the *condition list* and *gene panel*; the existing engines supply the *user-specific call*; the resolver is the join.

## Current Known Limits

- Direct PDF table extraction is not implemented; plain-text lab exports and normalized CSV/JSON already exercise the biomarker path.
- Authenticated wearable API sync is not implemented; WHOOP-shaped JSON and daily CSV already exercise the wearable path.
- VEP is optional. When unavailable, the dashboard must explicitly say rare coding-impact interpretation is limited.
- ClinVar pathogenic/likely-pathogenic findings are educational flags and require clinical confirmation before medical action.
