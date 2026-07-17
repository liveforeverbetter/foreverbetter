/**
 * Normalized observation types for the personalized action plan composer.
 *
 * Every observation carries enough provenance for the composer to qualify
 * rules, reject unsupported fusion, and explain which signals justified a
 * personalized action. Adapters convert existing modality engine outputs
 * into NormalizedObservation[] without changing the upstream analysis.
 */

export type ObservationModality = 'genetics' | 'biomarkers' | 'wearables';

export type ObservationSourceKind =
  | 'measured'           // direct lab value
  | 'derived'            // formula on measured values (e.g. HOMA-IR)
  | 'genotype'           // observed genetic variant (ClinVar / CPIC / catalogued rsID)
  | 'behavioral_aggregate'; // wearable window aggregate

export type ObservationStatus = 'optimal' | 'watch' | 'needs_attention' | 'unknown';

export type ObservationDirection = 'low' | 'high' | 'ok' | 'present' | 'absent';

export type ObservationReferenceBasis =
  | 'population_threshold'
  | 'personal_baseline'
  | 'rule_threshold'
  | 'genotype_known';

export interface ObservationProvenance {
  modality: ObservationModality;
  source_kind: ObservationSourceKind;
  /** User-facing source label such as "Blood test", "WHOOP", "Genetics". */
  source_label: string;
  collected_at?: string;
  /** Averaging window for behavioral/wearable aggregates. */
  window_days?: number;
  reference_basis?: ObservationReferenceBasis;
  /** Optional formula text for derived biomarkers (e.g. "glucose * insulin / 405"). */
  derivation?: string;
  /** Observation IDs that fed a derivation. */
  derived_from?: string[];
}

export type ObservationUncertainty = 'low' | 'moderate' | 'high';

export interface ObservationQuality {
  /** 0-1; for genetics this typically tracks variant call quality / ClinVar tier. */
  confidence: number;
  uncertainty?: ObservationUncertainty;
  /** Optional notes for downstream audit (e.g. "duplicate alias collapsed"). */
  notes?: string[];
}

export interface NormalizedObservation {
  /** Stable composite id: `${modality}:${signal_id}`. Unique within a single report. */
  id: string;
  /** Canonical signal id within the modality (e.g. 'apob', 'sleep_duration', 'mthfr_c677t'). */
  signal_id: string;
  /** Consumer-facing signal label. */
  signal_name: string;
  modality: ObservationModality;
  value: number | string;
  unit?: string;
  display_value?: string;
  status?: ObservationStatus;
  direction?: ObservationDirection;
  /** Friendly target band such as ">=7 hours" or "<=100 mg/dL". */
  target_label?: string;
  provenance: ObservationProvenance;
  quality: ObservationQuality;
  /**
   * Marks universal baseline guidance (e.g. "everyone should exercise") that is
   * NOT personal evidence. The composer must never present these as the
   * supporting evidence for a personalized action.
   */
  is_universal_baseline?: boolean;
}

export interface ModalityCoverage {
  modality: ObservationModality;
  status: 'connected' | 'not_provided';
  label: string;
  signal_count: number;
}

export function makeObservationId(modality: ObservationModality, signal_id: string): string {
  return `${modality}:${signal_id}`;
}
