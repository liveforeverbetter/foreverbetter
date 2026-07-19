import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createGunzip } from 'node:zlib';
import * as readline from 'node:readline';
import { MIN_PGS_CALIBRATION_POPULATION, PGS_SCORE_ALGORITHM, type PgsCalibrationRegistry, type PgsSuperPopulation } from './pgs-calibration.js';

const POPULATIONS = new Set<PgsSuperPopulation>(['AFR', 'AMR', 'EAS', 'EUR', 'SAS']);

interface ScoreManifest {
  scores: Array<{ pgs_id: string; sha256: string; genome_build: string; variants: number }>;
}

export interface BuildPgsCalibrationOptions {
  scoreRowsPath: string;
  scoreManifestPath: string;
  release: string;
  generatedAt?: string;
  referencePanel: PgsCalibrationRegistry['reference_panel'];
  generator: PgsCalibrationRegistry['generator'];
}

/**
 * Build the compact, de-identified runtime registry from reference score rows.
 * The input must be produced with the exact runtime scoring algorithm and have:
 * sample_id, super_population, pgs_id, score, score_algorithm, genome_build,
 * weighted_variant_count, scoring_file_sha256.
 */
export async function buildPgsCalibrationRegistry(options: BuildPgsCalibrationOptions): Promise<PgsCalibrationRegistry> {
  const manifest = JSON.parse(await readFile(options.scoreManifestPath, 'utf8')) as ScoreManifest;
  const definitions = new Map(manifest.scores.map(score => [score.pgs_id, score]));
  const values = new Map<string, Map<PgsSuperPopulation, Map<string, number>>>();
  const samplePopulations = new Map<string, Map<string, PgsSuperPopulation>>();

  const input = createReadStream(options.scoreRowsPath);
  const stream = options.scoreRowsPath.endsWith('.gz') ? input.pipe(createGunzip()) : input;
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let headers: string[] | undefined;
  let rowNumber = 0;
  for await (const line of lines) {
    rowNumber++;
    if (!line.trim() || line.startsWith('#')) continue;
    if (!headers) {
      headers = line.trim().split(/\t| +/);
      assertHeaders(headers);
      continue;
    }
    const columns = line.trim().split(/\t| +/);
    const get = (name: string) => columns[headers!.indexOf(name)] ?? '';
    const pgsId = get('pgs_id');
    const definition = definitions.get(pgsId);
    if (!definition) throw new Error(`Reference row ${rowNumber} names an unbundled score: ${pgsId}.`);
    const population = get('super_population') as PgsSuperPopulation;
    if (!POPULATIONS.has(population)) throw new Error(`Reference row ${rowNumber} has unsupported super_population: ${population}.`);
    if (get('score_algorithm') !== PGS_SCORE_ALGORITHM) throw new Error(`Reference row ${rowNumber} was produced by a different score algorithm.`);
    if (get('genome_build') !== definition.genome_build || get('scoring_file_sha256') !== definition.sha256
      || Number(get('weighted_variant_count')) !== definition.variants) {
      throw new Error(`Reference row ${rowNumber} does not match the pinned ${pgsId} model/build/variant contract.`);
    }
    const score = Number(get('score'));
    if (!Number.isFinite(score)) throw new Error(`Reference row ${rowNumber} has a non-finite score.`);
    const sampleId = get('sample_id');
    if (!sampleId) throw new Error(`Reference row ${rowNumber} has no sample_id.`);
    const assignedPopulations = samplePopulations.get(pgsId) ?? new Map<string, PgsSuperPopulation>();
    const existingPopulation = assignedPopulations.get(sampleId);
    if (existingPopulation && existingPopulation !== population) {
      throw new Error(`Reference sample ${sampleId} appears in both ${existingPopulation} and ${population} for ${pgsId}.`);
    }
    assignedPopulations.set(sampleId, population);
    samplePopulations.set(pgsId, assignedPopulations);
    const populations = values.get(pgsId) ?? new Map<PgsSuperPopulation, Map<string, number>>();
    const samples = populations.get(population) ?? new Map<string, number>();
    if (samples.has(sampleId)) throw new Error(`Duplicate reference score for ${pgsId}/${population}/${sampleId}.`);
    samples.set(sampleId, score);
    populations.set(population, samples);
    values.set(pgsId, populations);
  }
  if (!headers) throw new Error('Reference score file is empty.');

  const scores = manifest.scores.map(definition => {
    const populations = values.get(definition.pgs_id);
    if (!populations) throw new Error(`Reference score file has no rows for ${definition.pgs_id}.`);
    const distributions: Record<string, { n: number; mean: number; standard_deviation: number; scores: number[] }> = {};
    for (const population of POPULATIONS) {
      const sorted = [...(populations.get(population)?.values() ?? [])].sort((a, b) => a - b);
      if (sorted.length < MIN_PGS_CALIBRATION_POPULATION) {
        throw new Error(`${definition.pgs_id}/${population} has ${sorted.length} unrelated samples; at least ${MIN_PGS_CALIBRATION_POPULATION} are required.`);
      }
      const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
      const variance = sorted.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (sorted.length - 1);
      if (!(variance > 0)) throw new Error(`${definition.pgs_id}/${population} has no usable score variance.`);
      distributions[population] = {
        n: sorted.length,
        mean: round(mean, 10),
        standard_deviation: round(Math.sqrt(variance), 10),
        scores: sorted.map(value => round(value, 10)),
      };
    }
    const populationTotal = Object.values(distributions).reduce((sum, distribution) => sum + distribution.n, 0);
    if (populationTotal !== options.referencePanel.unrelated_samples) {
      throw new Error(`${definition.pgs_id} has ${populationTotal} reference samples, but reference_panel.unrelated_samples is ${options.referencePanel.unrelated_samples}.`);
    }
    return {
      pgs_id: definition.pgs_id,
      scoring_file_sha256: definition.sha256,
      score_algorithm: PGS_SCORE_ALGORITHM,
      genome_build: definition.genome_build as 'GRCh37',
      weighted_variant_count: definition.variants,
      populations: distributions,
    };
  });

  return {
    schema_version: '1.0',
    release: options.release,
    generated_at: options.generatedAt ?? new Date().toISOString(),
    reference_panel: options.referencePanel,
    generator: options.generator,
    scores,
  };
}

function assertHeaders(headers: string[]): void {
  const required = ['sample_id', 'super_population', 'pgs_id', 'score', 'score_algorithm', 'genome_build', 'weighted_variant_count', 'scoring_file_sha256'];
  const missing = required.filter(header => !headers.includes(header));
  if (missing.length > 0) throw new Error(`Reference score file is missing columns: ${missing.join(', ')}.`);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
