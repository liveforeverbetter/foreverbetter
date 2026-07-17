/**
 * Observation adapters.
 *
 * Convert existing modality-engine outputs into NormalizedObservation[] so
 * the composer can reason over them uniformly. Adapters never change the
 * analysis behaviour of the upstream engines — they only translate.
 *
 * Genetic adapters only emit observations for explicitly catalogued
 * genotypes (e.g. MTHFR C677T, CYP2C19 *2). Universal baseline guidance
 * never becomes a personalized observation; it is excluded so a rule
 * cannot fire on "everyone should sleep 7-9 hours" as if it were
 * personal evidence.
 */

import type {
  BiomarkerAnalysisSummary,
  BiomarkerFinding,
  WearableAnalysisSummary,
} from '../../shared/dashboard-types.js';
import type {
  NormalizedObservation,
  ObservationProvenance,
  ObservationStatus,
  ObservationDirection,
} from './observation_types.js';
import { makeObservationId } from './observation_types.js';

function mapBiomarkerStatus(status: BiomarkerFinding['status']): ObservationStatus {
  if (status === 'optimal') return 'optimal';
  if (status === 'watch') return 'watch';
  if (status === 'needs_attention') return 'needs_attention';
  return 'unknown';
}

function mapBiomarkerDirection(direction: BiomarkerFinding['direction']): ObservationDirection | undefined {
  if (!direction) return undefined;
  if (direction === 'low' || direction === 'high' || direction === 'ok') return direction;
  return undefined;
}

function biomarkerProvenance(finding: BiomarkerFinding, collectedAt?: string): ObservationProvenance {
  const sourceKind = finding.source_type === 'derived' ? 'derived' : 'measured';
  return {
    modality: 'biomarkers',
    source_kind: sourceKind,
    source_label: 'Blood test',
    collected_at: collectedAt,
    reference_basis: 'population_threshold',
  };
}

export interface BiomarkerAdapterOptions {
  /** Used when the finding does not carry its own collected_at (currently the type does not). */
  defaultCollectedAt?: string;
}

export function biomarkerObservationsFromAnalysis(
  analysis: BiomarkerAnalysisSummary | undefined,
  options: BiomarkerAdapterOptions = {},
): NormalizedObservation[] {
  if (!analysis) return [];
  const collectedAt = options.defaultCollectedAt;
  const observations: NormalizedObservation[] = [];

  for (const finding of analysis.findings ?? []) {
    if (!finding.id) continue;
    const provenance: ObservationProvenance = biomarkerProvenance(finding, collectedAt);
    // If this is a derived biomarker, surface the formula and inputs so the
    // composer can decline to fuse it where direct evidence is required.
    const derived = analysis.derived_biomarkers?.find(entry => entry.id === finding.id);
    if (derived) {
      provenance.derivation = derived.formula;
      provenance.derived_from = derived.inputs;
    }
    observations.push({
      id: makeObservationId('biomarkers', finding.id),
      signal_id: finding.id,
      signal_name: finding.name,
      modality: 'biomarkers',
      value: finding.value,
      unit: finding.unit,
      display_value: finding.display_value,
      status: mapBiomarkerStatus(finding.status),
      direction: mapBiomarkerDirection(finding.direction),
      target_label: finding.target_label,
      provenance,
      quality: {
        confidence: finding.status === 'optimal' ? 0.9 : 0.85,
      },
    });
  }
  return observations;
}

function wearableProvenance(windowDays?: number): ObservationProvenance {
  return {
    modality: 'wearables',
    source_kind: 'behavioral_aggregate',
    source_label: 'Wearable',
    window_days: windowDays,
    reference_basis: 'population_threshold',
  };
}

export interface WearableAdapterOptions {
  defaultWindowDays?: number;
}

export function wearableObservationsFromAnalysis(
  analysis: WearableAnalysisSummary | undefined,
  options: WearableAdapterOptions = {},
): NormalizedObservation[] {
  if (!analysis) return [];
  const observations: NormalizedObservation[] = [];

  for (const finding of analysis.findings ?? []) {
    if (!finding.id) continue;
    observations.push({
      id: makeObservationId('wearables', finding.id),
      signal_id: finding.id,
      signal_name: finding.name,
      modality: 'wearables',
      value: finding.value,
      unit: finding.unit,
      status: mapBiomarkerStatus(finding.status as BiomarkerFinding['status']),
      direction: finding.direction === 'ok' || finding.direction === 'low' || finding.direction === 'high'
        ? finding.direction
        : undefined,
      target_label: finding.target_label,
      provenance: wearableProvenance(options.defaultWindowDays),
      quality: {
        confidence: finding.status === 'optimal' ? 0.85 : 0.8,
        uncertainty: options.defaultWindowDays && options.defaultWindowDays < 7 ? 'moderate' : 'low',
      },
    });
  }
  return observations;
}

// ── Genetic adapters ────────────────────────────────────────────────────────
// Only known, catalogued genotypes become observations. Universal baseline
// guidance is never emitted as observation evidence.

const MTHFR_RSIDS = new Set(['rs1801133']); // C677T
const CYP2C19_LOF_RSIDS = new Set(['rs4244285', 'rs4986893', 'rs28399504']); // *2, *3, *4

/** Loose variant shape — the genetics adapter only needs gene/rsid/zygosity. */
export interface GeneticVariantLike {
  gene: string;
  rsid: string;
  zygosity?: string;
}

export interface GeneticInputView {
  variant_cards?: {
    genetic_conditions?: GeneticVariantLike[];
    drug_response?: GeneticVariantLike[];
    other_risks?: GeneticVariantLike[];
    rare_mutations?: GeneticVariantLike[];
    uncommon_mutations?: GeneticVariantLike[];
  };
}

function geneticsProvenance(sourceLabel: string): ObservationProvenance {
  return {
    modality: 'genetics',
    source_kind: 'genotype',
    source_label: sourceLabel,
    reference_basis: 'genotype_known',
  };
}

function allVariants(view: GeneticInputView): GeneticVariantLike[] {
  const v = view.variant_cards;
  if (!v) return [];
  return [
    ...(v.genetic_conditions ?? []),
    ...(v.drug_response ?? []),
    ...(v.other_risks ?? []),
    ...(v.rare_mutations ?? []),
    ...(v.uncommon_mutations ?? []),
  ];
}

export function geneticObservationsFromGenomicOutput(
  input: GeneticInputView | undefined,
): NormalizedObservation[] {
  if (!input) return [];
  const observations: NormalizedObservation[] = [];
  const variants = allVariants(input);

  // MTHFR C677T
  const mthfr = variants.find(v => v.rsid && MTHFR_RSIDS.has(v.rsid.toLowerCase()));
  if (mthfr) {
    const value = mthfr.zygosity === 'Homozygous' ? 'homozygous' : 'heterozygous';
    observations.push({
      id: makeObservationId('genetics', 'mthfr_c677t'),
      signal_id: 'mthfr_c677t',
      signal_name: 'MTHFR C677T',
      modality: 'genetics',
      value,
      display_value: mthfr.zygosity === 'Homozygous' ? 'Two copies (TT)' : 'One copy (CT)',
      provenance: geneticsProvenance('Genetics (ClinVar)'),
      quality: { confidence: 0.9 },
    });
  }

  // CYP2C19 metabolizer phenotype (conservative: any catalogued LoF allele → at least intermediate)
  const cyp2c19Variants = variants.filter(v => (v.gene || '').toUpperCase().startsWith('CYP2C19'));
  const catalogued = cyp2c19Variants.filter(v => v.rsid && CYP2C19_LOF_RSIDS.has(v.rsid.toLowerCase()));
  if (catalogued.length > 0) {
    const homozygous = catalogued.some(v => v.zygosity === 'Homozygous');
    const phenotype = homozygous ? 'poor_metabolizer' : 'intermediate_metabolizer';
    observations.push({
      id: makeObservationId('genetics', 'cyp2c19_metabolizer'),
      signal_id: 'cyp2c19_metabolizer',
      signal_name: 'CYP2C19 metabolizer phenotype',
      modality: 'genetics',
      value: phenotype,
      display_value: phenotype === 'poor_metabolizer' ? 'Poor metabolizer' : 'Intermediate metabolizer',
      provenance: geneticsProvenance('Genetics (CPIC)'),
      quality: { confidence: 0.85 },
    });
  }

  return observations;
}

/**
 * Convenience helper that runs all three adapters and concatenates results.
 */
export interface CombineAdaptersInput {
  biomarkers?: BiomarkerAnalysisSummary;
  wearables?: WearableAnalysisSummary;
  genetics?: GeneticInputView;
  biomarkerOptions?: BiomarkerAdapterOptions;
  wearableOptions?: WearableAdapterOptions;
}

export function buildNormalizedObservations(input: CombineAdaptersInput): NormalizedObservation[] {
  return [
    ...biomarkerObservationsFromAnalysis(input.biomarkers, input.biomarkerOptions),
    ...wearableObservationsFromAnalysis(input.wearables, input.wearableOptions),
    ...geneticObservationsFromGenomicOutput(input.genetics),
  ];
}
