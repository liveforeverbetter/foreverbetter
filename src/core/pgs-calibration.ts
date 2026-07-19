import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const PGS_SCORE_ALGORITHM = 'foreverbetter.position_allele.grch37.v1' as const;
export const MIN_PGS_CALIBRATION_POPULATION = 100;

export type PgsSuperPopulation = 'AFR' | 'AMR' | 'EAS' | 'EUR' | 'SAS';
export type PgsDirectionInterpretation = 'withheld' | 'higher_trait_value' | 'higher_liability';

export interface PgsPopulationSimilarity {
  most_similar_population: PgsSuperPopulation;
  low_confidence: boolean;
  method: 'pgsc_calc_random_forest' | 'pgsc_calc_mahalanobis';
  reference_panel: string;
  reference_release: string;
}

export interface PgsCalibrationDistribution {
  n: number;
  mean: number;
  standard_deviation: number;
  /** Sorted raw scores from unrelated reference samples. */
  scores: number[];
}

export interface PgsCalibrationScore {
  pgs_id: string;
  scoring_file_sha256: string;
  score_algorithm: typeof PGS_SCORE_ALGORITHM;
  genome_build: 'GRCh37';
  weighted_variant_count: number;
  populations: Partial<Record<PgsSuperPopulation, PgsCalibrationDistribution>>;
}

export interface PgsCalibrationRegistry {
  schema_version: '1.0';
  release: string;
  generated_at: string;
  reference_panel: {
    id: string;
    release: string;
    source_url: string;
    sha256: string;
    unrelated_samples: number;
  };
  generator: {
    name: string;
    version: string;
    command?: string;
  };
  scores: PgsCalibrationScore[];
}

export interface PgsCalibrationResult {
  state: 'reference_relative';
  percentile: number;
  z_score: number;
  population: PgsSuperPopulation;
  population_sample_size: number;
  method: 'empirical_percentile_MostSimilarPop';
  reference_panel: string;
  reference_release: string;
  population_assignment_method: PgsPopulationSimilarity['method'];
  direction_interpretation: PgsDirectionInterpretation;
}

export type PgsCalibrationDecision =
  | { calibrated: true; result: PgsCalibrationResult }
  | { calibrated: false; reason: string; reanalysis_recommended: true };

export async function loadPgsCalibrationRegistry(filePath: string): Promise<PgsCalibrationRegistry> {
  const raw = JSON.parse(await readFile(filePath, 'utf8')) as unknown;
  assertCalibrationRegistry(raw);
  return raw;
}

export function calibratePgsScore(input: {
  pgs_id: string;
  raw_score: number;
  scoring_file_sha256: string;
  genome_build: string;
  weighted_variant_count: number;
  coverage_pct: number;
  direction_interpretation: PgsDirectionInterpretation;
  similarity?: PgsPopulationSimilarity;
  registry?: PgsCalibrationRegistry;
}): PgsCalibrationDecision {
  if (input.coverage_pct < 95) return unavailable('Model coverage is below 95%; percentile calibration is withheld.');
  if (!input.registry) return unavailable('The pinned HGDP+1kGP calibration registry is not installed.');
  if (!input.similarity) return unavailable('No pgsc_calc population-similarity result is available for this genome.');
  if (input.similarity.low_confidence) return unavailable('The pgsc_calc MostSimilarPop assignment is low confidence.');
  if (input.similarity.reference_panel !== input.registry.reference_panel.id
    || input.similarity.reference_release !== input.registry.reference_panel.release) {
    return unavailable('Population assignment and score calibration use different reference-panel releases.');
  }
  const score = input.registry.scores.find(candidate => candidate.pgs_id === input.pgs_id);
  if (!score) return unavailable(`No compatible calibration distribution is available for ${input.pgs_id}.`);
  if (score.score_algorithm !== PGS_SCORE_ALGORITHM) return unavailable('The calibration score algorithm does not match the runtime scorer.');
  if (score.scoring_file_sha256 !== input.scoring_file_sha256) return unavailable('The calibration was generated from a different scoring-file checksum.');
  if (score.genome_build !== input.genome_build) return unavailable('The calibration and uploaded genome use different genome builds.');
  if (score.weighted_variant_count !== input.weighted_variant_count) return unavailable('The calibration and runtime scorer used different weighted-variant sets.');
  const distribution = score.populations[input.similarity.most_similar_population];
  if (!distribution || distribution.n < MIN_PGS_CALIBRATION_POPULATION) {
    return unavailable(`The ${input.similarity.most_similar_population} reference distribution has fewer than ${MIN_PGS_CALIBRATION_POPULATION} unrelated samples.`);
  }
  if (distribution.scores.length !== distribution.n || !isSorted(distribution.scores)) {
    return unavailable('The calibration distribution failed integrity checks.');
  }
  if (!(distribution.standard_deviation > 0)) return unavailable('The calibration distribution has no usable variance.');

  const percentile = empiricalPercentile(input.raw_score, distribution.scores);
  const zScore = (input.raw_score - distribution.mean) / distribution.standard_deviation;
  return {
    calibrated: true,
    result: {
      state: 'reference_relative',
      percentile: round(percentile, 2),
      z_score: round(zScore, 4),
      population: input.similarity.most_similar_population,
      population_sample_size: distribution.n,
      method: 'empirical_percentile_MostSimilarPop',
      reference_panel: input.registry.reference_panel.id,
      reference_release: input.registry.reference_panel.release,
      population_assignment_method: input.similarity.method,
      direction_interpretation: input.direction_interpretation,
    },
  };
}

/** Mid-rank empirical CDF: ties receive half of their shared rank interval. */
export function empiricalPercentile(value: number, sortedScores: number[]): number {
  if (sortedScores.length === 0) throw new Error('Cannot calculate a percentile from an empty distribution.');
  const lower = lowerBound(sortedScores, value);
  const upper = upperBound(sortedScores, value);
  return ((lower + (upper - lower) / 2) / sortedScores.length) * 100;
}

export function calibrationRegistryDigest(registry: PgsCalibrationRegistry): string {
  return createHash('sha256').update(JSON.stringify(registry)).digest('hex');
}

function assertCalibrationRegistry(value: unknown): asserts value is PgsCalibrationRegistry {
  if (!value || typeof value !== 'object') throw new Error('PGS calibration registry must be a JSON object.');
  const registry = value as Partial<PgsCalibrationRegistry>;
  if (registry.schema_version !== '1.0' || !registry.release || !registry.generated_at) {
    throw new Error('PGS calibration registry metadata is missing or unsupported.');
  }
  if (!registry.reference_panel?.id || !registry.reference_panel.release || !registry.reference_panel.sha256) {
    throw new Error('PGS calibration registry reference-panel provenance is incomplete.');
  }
  if (!registry.generator?.name || !registry.generator.version || !Array.isArray(registry.scores)) {
    throw new Error('PGS calibration registry generator metadata or scores are missing.');
  }
  for (const score of registry.scores) {
    if (!score.pgs_id || !score.scoring_file_sha256 || score.score_algorithm !== PGS_SCORE_ALGORITHM
      || score.genome_build !== 'GRCh37' || !Number.isInteger(score.weighted_variant_count) || score.weighted_variant_count <= 0) {
      throw new Error(`PGS calibration entry is invalid: ${score.pgs_id ?? 'unknown'}.`);
    }
    for (const [population, distribution] of Object.entries(score.populations)) {
      if (!['AFR', 'AMR', 'EAS', 'EUR', 'SAS'].includes(population) || !distribution
        || distribution.n !== distribution.scores.length || !isSorted(distribution.scores)
        || !Number.isFinite(distribution.mean) || !Number.isFinite(distribution.standard_deviation)) {
        throw new Error(`PGS calibration distribution is invalid: ${score.pgs_id}/${population}.`);
      }
    }
  }
}

function unavailable(reason: string): PgsCalibrationDecision {
  return { calibrated: false, reason, reanalysis_recommended: true };
}

function lowerBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle]! < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function upperBound(values: number[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (values[middle]! <= target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function isSorted(values: number[]): boolean {
  return values.every((value, index) => Number.isFinite(value) && (index === 0 || value >= values[index - 1]!));
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
