/**
 * Shared Dashboard Data Types
 *
 * Canonical TypeScript schema for the dashboard JSON data contract
 * between the analyze-longevity pipeline and its HTML dashboard renderer.
 *
 * This file is intentionally skill-local so the analyze-longevity skill can be
 * installed and typechecked without depending on a sibling repo directory.
 */

// ── Findings summary ──

export interface Meta {
  data_source: string;
  /** Human-readable list of connected modalities, for example: "Genomics only" or "Genomics + biomarkers" */
  modality_summary?: string;
  coverage: string;
  pipeline_version: string;
  ref_db: string;
  generated_date: string;
  user_initials: string;
  /** Number of curated health markers in the interpretation database that were analyzed */
  curated_markers: number;
  /** Number of rare HIGH/MODERATE functional variants found via VEP (gnomAD AF < 0.01) */
  vep_rare_variants: number;
  /** Number of ClinVar pathogenic/likely pathogenic findings */
  clinvar_pathogenic: number;
  /** Number of CPIC actionable drug-gene interaction matches */
  cpic_actionable: number;
  /** Total trait-level findings after merging all data sources */
  total_trait_findings: number;
  /** Quiet technical details for report provenance and local-data transparency */
  analysis_quality?: {
    data_handling: string;
    analysis_scope: string;
    genome_build: string;
    vep_status: "included" | "skipped";
    vep_note: string;
    wgs_validation_coverage?: WgsValidationCoverage[];
    local_vcf_coverage?: LocalVcfCoverageSummary;
    total_variants: number;
    matched_markers: number;
    rsid_annotation_source?: string;
    rsid_annotation_note?: string;
    clinvar_not_diagnostic?: string;
    clinvar_vus_note?: string;
    prs_note: string;
  };
}

export interface LocalVcfCoverageSummary {
  total_records: number;
  annotated_records: number;
  unique_rsids: number;
  classes_present: number;
  records_by_class?: Partial<Record<string, number>>;
  curated_rsids_observed: number;
  curated_interpretation_rsids: number;
  prs_rsids_observed: number;
  prs_rsids: number;
  coverage_score: number;
}

export type WgsValidationStatus =
  | "externally_validated"
  | "pipeline_validated"
  | "pending_external_validation"
  | "not_available";

export interface WgsValidationCoverage {
  id: string;
  label: string;
  status: WgsValidationStatus;
  status_label: string;
  call_count: number;
  reportable_count: number;
  caller_available: boolean;
  caller_tools: string[];
  external_source?: string;
  external_status?: string;
  query_status?: string;
  local_difficulty?: "easy" | "medium" | "hard";
  recall?: number;
  precision?: number;
  note: string;
  next_step?: string;
}

// -- Multi-modal health data upload and action path --

export type HealthDataModality = "genomics" | "biomarkers" | "wearables";
export type ModalityStatus = "connected" | "recommended_next" | "optional" | "not_started";

export interface ModalityCard {
  id: HealthDataModality;
  title: string;
  status: ModalityStatus;
  status_label: string;
  desc: string;
  accepted_formats: string[];
  examples: string[];
  action: string;
}

export interface BiomarkerDomain {
  name: string;
  status: "missing" | "available" | "partial";
  markers: string[];
  why_it_matters: string;
}

export interface WearableDomain {
  name: string;
  status: "missing" | "available" | "partial";
  signals: string[];
  why_it_matters: string;
}

export type SignalStatus = "optimal" | "watch" | "needs_attention" | "missing";

export interface CrossModalAction {
  title: string;
  priority: "high" | "medium" | "low";
  source_modalities: HealthDataModality[];
  rationale: string;
  next_step: string;
  retest_window: string;
}

export interface BiomarkerFinding {
  id: string;
  name: string;
  domain: string;
  value: number;
  unit: string;
  display_value?: string;
  status: SignalStatus;
  status_label?: string;
  target_label?: string;
  direction?: "low" | "high" | "ok";
  priority_rank?: number;
  trend_delta?: number;
  trend_label?: string;
  score: number;
  interpretation: string;
  action: string;
  source_type?: "measured" | "derived";
  /** ISO date string when the underlying lab value was collected. */
  collected_at?: string;
}

export interface BiomarkerLabValue {
  id: string;
  name: string;
  domain: string;
  value: number;
  unit: string;
  display_value: string;
  status: SignalStatus;
  status_label?: string;
  target_label?: string;
  collected_at?: string;
  source_type: "measured";
}

export interface DerivedBiomarkerValue {
  id: string;
  name: string;
  domain: string;
  value: number;
  unit: string;
  display_value: string;
  status: SignalStatus;
  status_label?: string;
  target_label?: string;
  formula: string;
  inputs: string[];
  source_type: "derived";
}

export interface BiomarkerDomainScore {
  id: string;
  name: string;
  score: number;
  status: SignalStatus;
  measured: number;
  missing: string[];
  top_findings: string[];
  actions: string[];
}

export interface BiomarkerSystemScore {
  id: string;
  name: string;
  score: number;
  status: SignalStatus;
  marker_count: number;
  drivers: string[];
}

export interface BiomarkerBiologicalAge {
  model_version: string;
  score: number;
  status: SignalStatus;
  estimated_delta_years: number;
  inputs: string[];
  rationale: string;
}

export interface BiomarkerAnalysisSummary {
  score: number;
  status: SignalStatus;
  measured_count: number;
  total_supported: number;
  domains: BiomarkerDomainScore[];
  system_scores?: BiomarkerSystemScore[];
  biological_age?: BiomarkerBiologicalAge;
  lab_data?: BiomarkerLabValue[];
  derived_biomarkers?: DerivedBiomarkerValue[];
  findings: BiomarkerFinding[];
  missing_priority: string[];
  action_items: CrossModalAction[];
}

export interface WearableFinding {
  id: string;
  name: string;
  domain: string;
  value: number;
  unit: string;
  status: SignalStatus;
  status_label?: string;
  target_label?: string;
  direction?: "low" | "high" | "ok";
  priority_rank?: number;
  score: number;
  interpretation: string;
  action: string;
}

export interface WearableDomainScore {
  id: string;
  name: string;
  score: number;
  status: SignalStatus;
  measured: number;
  missing: string[];
  top_findings: string[];
  actions: string[];
}

export interface WearableAnalysisSummary {
  score: number;
  status: SignalStatus;
  measured_count: number;
  total_supported: number;
  domains: WearableDomainScore[];
  findings: WearableFinding[];
  missing_priority: string[];
  action_items: CrossModalAction[];
}

export interface UploadPathStep {
  label: string;
  title: string;
  body: string;
}

export interface MultiModalPlan {
  summary: string;
  current_state: string;
  next_best_upload: HealthDataModality;
  modalities: ModalityCard[];
  upload_path: UploadPathStep[];
  biomarker_domains: BiomarkerDomain[];
  wearable_domains: WearableDomain[];
  action_priorities?: CrossModalAction[];
}

// ── GLI hero ──

export interface Gli {
  score: number;
  percentile: number;
  rating: string;
  /** Maps to a CSS variable: optimal | neutral | moderate | critical */
  rating_color: "optimal" | "neutral" | "moderate" | "critical";
  /** Plain-English interpretation of what the score means */
  what_this_means?: string;
  /** Top 3 areas to focus on for improvement */
  focus_areas?: string[];
}

// ── Innate strengths (hero card right side, 0–2) ──

export interface InnateStrength {
  gene: string;
  name: string;
  score: number;
  desc: string;
  evidence: string;
  impact: string;
  confidence: string;
}

// ── Category (overview minicard + detail card in Categories tab) ──

export type StatusColor = "optimal" | "neutral" | "moderate" | "critical";

export interface CategorySubitem {
  name: string;
  status: string;
  status_color: StatusColor;
  detail: string;
}

export interface Category {
  id:
    | "vulnerability"
    | "pharmacology"
    | "hereditary"
    | "traits"
    | "wellness"
    | "ancestry";
  name: string;
  /** 0–100 */
  score: number;
  status: StatusColor;
  icon: string;
  total_markers: number;
  flagged: number;
  interactions?: number;
  status_label?: string;
  insights_count?: number;
  recommendations?: number;
  haplogroups?: number;
  desc: string;
  subitems: CategorySubitem[];
}

// ── Insights ──

export interface Insight {
  title: string;
  body: string;
  actions_count: number;
  actions_text?: string; // for insight 3 which has a different suffix pattern
}

// ── Action Plan ──

export type ActionPriority = "High Priority" | "Medium Priority";

export interface ActionItem {
  priority: ActionPriority;
  priority_class: "high" | "medium";
  title: string;
  gene_info: string;
  desc: string;
  steps: [string, string, string];
}

// ── Canonical PersonalizedActionPlan ──
// One contract consumed unchanged by pipeline JSON and the HTML renderer.

export type PlanModality = "genetics" | "biomarkers" | "wearables";

export interface PlanModalityCoverage {
  modality: PlanModality;
  status: "connected" | "not_provided";
  /** User-facing label such as "Blood test", "WHOOP", "Genetics". */
  label: string;
  signal_count: number;
}

export type PlanSafetyTier =
  | "self_directed"
  | "routine_review"
  | "prompt_review"
  | "medication_safety";

export type PlanReviewItemReason =
  | "conflict"
  | "missing_context"
  | "temporal_mismatch";

export interface PersonalizedActionEvidenceChip {
  /** Stable observation id (`{modality}:{signal_id}`) for traceability. */
  observation_id: string;
  source_label: string;
  label: string;
  value: string;
  target?: string;
  collected_at?: string;
  severity?: "good" | "warn" | "bad";
}

export interface PersonalizedActionRanking {
  urgency: number;
  evidence_quality: number;
  relevance: number;
  modifiability: number;
  retestability: number;
  corroboration: number;
  /** Human-readable one-line explanation of why this card ranks where it does. */
  explanation: string;
}

export interface PersonalizedAction {
  id: string;
  intervention_id: string;
  rule_id: string;
  rule_version: string;
  title: string;
  why_personal: string;
  source_modalities: PlanModality[];
  supporting_observation_ids: string[];
  evidence_chips: PersonalizedActionEvidenceChip[];
  steps: string[];
  expected_result: { metric: string; direction: string; label: string };
  review_window: string;
  comparability_requirements?: string[];
  safety: { tier: PlanSafetyTier; message: string };
  ranking: PersonalizedActionRanking;
}

export interface PlanReviewItem {
  id: string;
  reason: PlanReviewItemReason;
  title: string;
  explanation: string;
  needed_context?: string[];
  affected_observation_ids: string[];
}

export interface PlanMaintenanceAction {
  id: string;
  title: string;
  description: string;
  source_modalities: PlanModality[];
}

export interface NextContextSuggestion {
  missing_modality: PlanModality;
  why: string;
  suggested_actions_unlocked: string[];
}

export interface PersonalizedActionPlan {
  generated_at: string;
  coverage: PlanModalityCoverage[];
  /** One sentence summary of what the plan can and cannot say with the supplied data. */
  summary: string;
  /** 0-3 qualified priority actions. Never padded. */
  priorities: PersonalizedAction[];
  /** Conflicts, missing context, or temporal mismatch that withheld a rule. */
  review_items: PlanReviewItem[];
  /** Lightweight maintenance guidance when supported by current observations. */
  maintenance: PlanMaintenanceAction[];
  /** Optional non-blocking prompt for an additional modality. */
  next_context?: NextContextSuggestion;
}

// ── Protocols ──

export interface ProtocolPhase {
  label: string;
  check: string;
  done: boolean;
  desc: string;
}

export interface Protocol {
  id: string;
  tier: 1 | 2;
  tier_label: string;
  title: string;
  impact: string;
  difficulty: string;
  duration: string;
  progress_pct: number;
  evidence: string;
  phases: ProtocolPhase[];
}

// ── Ancestry ──

export interface AncestryRegion {
  region: string;
  pct: number;
}

export interface Ancestry {
  y_dna: string;
  y_dna_detail: string;
  mt_dna: string;
  mt_dna_detail: string;
  neanderthal_pct: number;
  neanderthal_percentile: number;
  composition: AncestryRegion[];
  map_regions: string[];
}

// ── ClinVar Variant Cards (Genetic Variants tab) ──

export type VariantCategory =
  | "genetic_conditions"
  | "drug_response"
  | "other_risks"
  | "rare_mutations"
  | "uncommon_mutations";

export type SignificanceColor = "red" | "orange" | "green" | "purple" | "blue";

export interface ClinVarVariantCard {
  gene: string;
  rsid: string;
  disease: string;
  clinicalSignificance: string;
  confidenceTier?: "pathogenic_likely_pathogenic" | "drug_response" | "risk_factor_protective" | "vus" | "benign" | "conflicting_classifications" | "other";
  confidenceLabel?: string;
  significanceColor: SignificanceColor;
  category: VariantCategory;
  zygosity: "Homozygous" | "Heterozygous";
  frequency: string;
  caddScore?: number;
  annotation: string;
  reviewStatus: string;
  inheritance?: string;
}

// ── Polygenic Risk Scores ──

export interface PRSScore {
  disease: string;
  score: number;
  riskLabel: string;
  percentile: number;
  description: string;
  variantsScored?: number;
  totalWeightedVariants?: number;
  coveragePct?: number;
  confidence?: "low" | "moderate" | "high";
  confidenceTier?: "prs";
  sourceType?: "curated_prs_weight" | "pgs_catalog_score";
  sourceId?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceRelease?: string;
  genomeBuild?: string;
  ancestry?: string;
  ancestryDisclosure?: string;
  buildDisclosure?: string;
  coverageDisclosure?: string;
}

// ── Genetic Variants Section ──

export interface GeneticVariantsSection {
  genetic_conditions: ClinVarVariantCard[];
  drug_response: ClinVarVariantCard[];
  other_risks: ClinVarVariantCard[];
  rare_mutations: ClinVarVariantCard[];
  uncommon_mutations: ClinVarVariantCard[];
}

// ── VEP Missense Enrichment (Longevity Genes) ──

export interface VEPMissenseCall {
  gene: string;
  consequence: string;
  proteinChange: string;
  siftScore: number;
  polyphenScore: number;
  caddScore: number;
  gnomadAF: number;
  impact: string;
  traitId: string;
  functionalSignificance: 'damaging' | 'possibly_damaging' | 'benign' | 'unknown';
  interpretation: string;
  action: string;
}

export interface VEPMissenseSection {
  summary: string;
  totalMissense: number;
  longevityGeneHits: number;
  damagingCalls: number;
  genesFound: string[];
  calls: VEPMissenseCall[];
}

// ── PRS Expanded (longevity + wellness traits) ──

export interface PRSWellnessScore {
  disease: string;
  displayName: string;
  score: number;
  riskLabel: string;
  percentile: number;
  description: string;
  category: 'longevity' | 'wellness' | 'disease_risk' | 'metabolic' | 'inflammation' | 'cognitive';
  variantsScored?: number;
  totalWeightedVariants?: number;
  coveragePct?: number;
  confidence?: "low" | "moderate" | "high";
  confidenceTier?: "prs";
  sourceType?: "curated_prs_weight" | "pgs_catalog_score";
  sourceId?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceRelease?: string;
  genomeBuild?: string;
  ancestry?: string;
  ancestryDisclosure?: string;
  buildDisclosure?: string;
  coverageDisclosure?: string;
}

export interface PRSExpandedSection {
  disease_risks: PRSWellnessScore[];
  longevity_traits: PRSWellnessScore[];
  wellness_traits: PRSWellnessScore[];
}

// ── Full dashboard data (the pipeline output) ──

export interface DashboardData {
  meta: Meta;
  /** Optional dashboard-ready path across genomics, blood biomarkers, and behavioral/wearable data. */
  multimodal_plan?: MultiModalPlan;
  biomarker_analysis?: BiomarkerAnalysisSummary;
  wearable_analysis?: WearableAnalysisSummary;
  gli: Gli;
  innate_strengths?: InnateStrength[];
  categories: Category[];
  insights?: Insight[];
  /**
   * Canonical personalized action plan. The HTML renderer and JSON consumers
   * should read this. The legacy `action_plan: ActionItem[]` field is retained
   * during dashboard migration but slated for removal.
   */
  personalized_action_plan?: PersonalizedActionPlan;
  action_plan?: ActionItem[];
  /** Full protocol cards shown in the Protocols tab */
  protocols?: Protocol[];
  /** Summary protocol cards shown in the Overview tab */
  overview_protocols?: Protocol[];
  ancestry?: Ancestry;
  /** Polygenic risk scores for common diseases */
  prs_scores?: PRSScore[];
  /** Expanded PRS scores including longevity & wellness traits */
  prs_expanded?: PRSExpandedSection;
  /** VEP missense findings in longevity genes */
  vep_missense?: VEPMissenseSection;
  /** Hallmark aging pathway scores */
  hallmark?: {
    hallmarks: Array<{
      hallmark_id: string;
      name: string;
      color: string;
      gene_count: number;
      genes: string[];
      burden: number;
      actionability: string;
      actions: string[];
    }>;
    total_genes_hit: number;
    hallmarks_affected: number;
    summary: string;
  };
  /** Organized ClinVar variant cards for the Genetic Variants tab */
  genetic_variants?: GeneticVariantsSection;
  /** GWAS Catalog trait associations grouped by domain */
  gwas_traits?: GWASTraitSection;
}

// ── GWAS Catalog trait associations ──

export type GWASNetSignal = 'favorable' | 'slightly_favorable' | 'typical' | 'slightly_elevated' | 'elevated';

export interface GWASHitCard {
  rsid: string;
  gene: string;
  trait: string;
  effectDirection: 'risk' | 'protective' | 'neutral' | 'unknown';
  copiesOfEffectAllele: 0 | 1 | 2;
  or: number | null;
  p: number;
  n: number;
  magnitudeLabel: 'modest' | 'moderate' | 'substantial';
  interpretation: string;
  confidenceTier?: "gwas_association";
  sourceType?: "gwas_catalog_association";
  sourceId?: string;
  sourceUrl?: string;
  sourceRelease?: string;
  genomeBuild?: string;
}

export interface GWASDomainCard {
  domain: string;
  label: string;
  hitCount: number;
  netSignal: GWASNetSignal;
  topHits: GWASHitCard[];
}

export interface GWASTraitSection {
  totalHits: number;
  totalRsidsScanned: number;
  referencePresent: boolean;
  sourceName?: string;
  sourceRelease?: string;
  genomeBuild?: string;
  ancestryDisclosure?: string;
  buildDisclosure?: string;
  coverageDisclosure?: string;
  domains: GWASDomainCard[];
}
