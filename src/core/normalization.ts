import {
  parseBiomarkerCsv,
  parseBiomarkerJson,
  parseBiomarkerText,
  parseWearableCsv,
  parseWearableJson,
  type BiomarkerReading,
  type WearableReading,
} from './engines.js';
import {
  parseBehavioralCsv,
  parseBehavioralJson,
  parseBehavioralText,
  type BehavioralEntry,
} from './behavioral.js';
import { looksLikeFhir, parseBiomarkerFhir } from './fhir.js';
import { createId } from '../store.js';
import type { NormalizedObservation, ProviderId, RawSourceReference, SourceCategory } from '../types.js';

export interface FileImportInput {
  user_id: string;
  organization_id?: string;
  category: SourceCategory;
  filename?: string;
  content_type?: string;
  provider?: ProviderId | string;
  text?: string;
  data_base64?: string;
}

export function decodeImportText(input: FileImportInput): string {
  return decodeImportBuffer(input).toString('utf8');
}

export function decodeImportBuffer(input: FileImportInput): Buffer {
  if (typeof input.text === 'string') return Buffer.from(input.text, 'utf8');
  if (typeof input.data_base64 === 'string') return Buffer.from(input.data_base64, 'base64');
  throw new Error('Either text or data_base64 is required.');
}

export function buildSourceReference(input: FileImportInput, payload: string | Buffer): RawSourceReference {
  return {
    id: createId('src'),
    user_id: input.user_id,
    organization_id: input.organization_id,
    category: input.category,
    filename: input.filename,
    content_type: input.content_type,
    provider: input.provider,
    received_at: new Date().toISOString(),
    byte_length: Buffer.isBuffer(payload) ? payload.byteLength : Buffer.byteLength(payload),
    storage_mode: 'memory',
  };
}

export function normalizeImportedFile(source: RawSourceReference, text: string): NormalizedObservation[] {
  if (source.category === 'biomarkers') {
    return biomarkerReadings(text, source).map(readingToBiomarkerObservation(source));
  }
  if (source.category === 'wearables') {
    return wearableReadings(text, source).map(readingToWearableObservation(source));
  }
  if (source.category === 'genetics') {
    return [{
      id: createId('obs'),
      user_id: source.user_id,
      organization_id: source.organization_id,
      source_id: source.id,
      category: 'genetics',
      type: 'genetic_file_reference',
      name: source.filename ?? 'Genetic data file',
      provider: source.provider,
      raw: {
        content_type: source.content_type,
        byte_length: source.byte_length,
        note: 'Genetic payload retained as a raw source reference. Full VCF/WGS analysis should run through the local genomic pipeline or a configured worker.',
      },
    }];
  }
  const entries = behavioralEntries(text, source);
  if (entries.length === 0) {
    return [{
      id: createId('obs'),
      user_id: source.user_id,
      organization_id: source.organization_id,
      source_id: source.id,
      category: 'behavioral',
      type: 'behavioral_note',
      name: source.filename ?? 'Behavioral data',
      provider: source.provider,
      raw: { text },
    }];
  }
  return entries.map(entry => ({
    id: createId('obs'),
    user_id: source.user_id,
    organization_id: source.organization_id,
    source_id: source.id,
    category: 'behavioral' as const,
    type: behavioralObservationType(entry.kind),
    name: entry.name ?? entry.id,
    value: entry.value,
    unit: entry.unit,
    observed_at: entry.observed_at,
    provider: source.provider,
    raw: entry,
  }));
}

function behavioralEntries(text: string, source: RawSourceReference): BehavioralEntry[] {
  try {
    if (looksJson(source, text)) return parseBehavioralJson(text);
    if (looksCsv(source, text)) return parseBehavioralCsv(text);
    return parseBehavioralText(text);
  } catch {
    return [];
  }
}

function behavioralObservationType(kind: BehavioralEntry['kind']): string {
  if (kind === 'supplement') return 'supplement';
  if (kind === 'medication') return 'medication';
  if (kind === 'nutrition') return 'nutrition_metric';
  if (kind === 'symptom') return 'symptom';
  return 'behavioral_note';
}

function biomarkerReadings(text: string, source: RawSourceReference): BiomarkerReading[] {
  // PDF-extracted text is free-form (and may contain commas), so parse it as text
  // rather than letting the comma heuristic route it to the CSV parser.
  if (isPdfSource(source)) return parseBiomarkerText(text);
  if (looksLikeFhir(text)) return parseBiomarkerFhir(text);
  if (looksJson(source, text)) return parseBiomarkerJson(text);
  if (looksCsv(source, text)) return parseBiomarkerCsv(text);
  return parseBiomarkerText(text);
}

function isPdfSource(source: RawSourceReference): boolean {
  return source.content_type?.toLowerCase().includes('pdf') === true || source.filename?.toLowerCase().endsWith('.pdf') === true;
}

function wearableReadings(text: string, source: RawSourceReference): WearableReading[] {
  return looksJson(source, text) ? parseWearableJson(text) : parseWearableCsv(text);
}

function looksJson(source: RawSourceReference, text: string): boolean {
  return source.content_type?.includes('json') === true || /^\s*[\[{]/.test(text);
}

function looksCsv(source: RawSourceReference, text: string): boolean {
  // Accept ';' and tab as delimiters too: European exports use them because ','
  // is the decimal separator there.
  return source.content_type?.includes('csv') === true
    || /[,;\t]/.test(text)
    || source.filename?.endsWith('.csv') === true;
}

function readingToBiomarkerObservation(source: RawSourceReference) {
  return (reading: BiomarkerReading): NormalizedObservation => ({
    id: createId('obs'),
    user_id: source.user_id,
    organization_id: source.organization_id,
    source_id: source.id,
    category: 'biomarkers',
    type: 'lab_result',
    name: reading.id,
    value: reading.value,
    unit: reading.unit,
    observed_at: reading.collected_at,
    provider: source.provider,
    raw: reading,
  });
}

function readingToWearableObservation(source: RawSourceReference) {
  return (reading: WearableReading): NormalizedObservation => ({
    id: createId('obs'),
    user_id: source.user_id,
    organization_id: source.organization_id,
    source_id: source.id,
    category: 'wearables',
    type: 'wearable_metric',
    name: reading.id,
    value: reading.value,
    unit: reading.unit,
    observed_at: reading.observed_at ?? source.received_at,
    provider: source.provider,
    raw: reading,
  });
}
