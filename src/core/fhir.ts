import { resolveMarkerDefinition, type BiomarkerReading } from './engines.js';

// Minimal FHIR R4 ingestion for lab results. Accepts a Bundle, a DiagnosticReport
// with contained/embedded Observations, or a single Observation, and maps each
// Observation to a normalized biomarker reading. LOINC codes are matched first;
// otherwise the code text/display falls back to the marker alias catalog. Units
// carried on valueQuantity flow into the engine's unit-conversion layer.

const LOINC_TO_MARKER: Record<string, string> = {
  '1884-6': 'apob',
  '2089-1': 'ldl_c',
  '18262-6': 'ldl_c',
  '2085-9': 'hdl_c',
  '2571-8': 'triglycerides',
  '2093-3': 'total_cholesterol',
  '43396-1': 'non_hdl_c',
  '10835-7': 'apoa1',
  '2345-7': 'fasting_glucose',
  '1558-6': 'fasting_glucose',
  '4548-4': 'hba1c',
  '17856-6': 'hba1c',
  '20437-0': 'fasting_insulin',
  '1988-5': 'hs_crp',
  '30522-7': 'hs_crp',
  '13457-7': 'ldl_c',
  '2276-4': 'ferritin',
  '1863-0': 'folate',
  '2284-8': 'folate',
  '2132-9': 'b12',
  '62292-8': 'vitamin_d',
  '1989-3': 'vitamin_d',
  '14879-1': 'homocysteine',
  '3084-1': 'uric_acid',
  '19123-9': 'magnesium',
  '3016-3': 'tsh',
  '3024-7': 'free_t4',
  '3051-0': 'free_t3',
  '2986-8': 'total_testosterone',
  '2991-8': 'free_testosterone',
  '2243-4': 'estradiol',
  '13967-5': 'shbg',
  '2191-5': 'dhea_s',
  '2143-6': 'cortisol_morning',
  '2484-4': 'igf_1',
  '2160-0': 'creatinine',
  '48642-3': 'egfr',
  '33914-3': 'egfr',
  '1742-6': 'alt',
  '1920-8': 'ast',
  '2324-2': 'ggt',
  '6768-6': 'alp',
  '1975-2': 'bilirubin_total',
  '1751-7': 'albumin',
  '3094-0': 'bun',
  '718-7': 'hemoglobin',
  '4544-3': 'hematocrit',
  '6690-2': 'wbc',
  '777-3': 'platelets',
  '788-0': 'rdw',
  '787-2': 'mcv',
  '2857-1': 'psa',
};

export function looksLikeFhir(text: string): boolean {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('{')) return false;
  return /"resourceType"\s*:\s*"(Bundle|Observation|DiagnosticReport)"/.test(trimmed);
}

export function parseBiomarkerFhir(text: string): BiomarkerReading[] {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch {
    return [];
  }
  const observations = collectObservations(root);
  const readings: BiomarkerReading[] = [];
  for (const observation of observations) {
    readings.push(...readingsFromObservation(observation));
  }
  return dedupe(readings);
}

function collectObservations(root: unknown): Record<string, unknown>[] {
  const record = obj(root);
  const type = str(record.resourceType);
  if (type === 'Observation') return [record];
  if (type === 'Bundle') {
    const entries = Array.isArray(record.entry) ? record.entry : [];
    return entries
      .map(entry => obj(obj(entry).resource))
      .filter(resource => str(resource.resourceType) === 'Observation');
  }
  if (type === 'DiagnosticReport') {
    const contained = Array.isArray(record.contained) ? record.contained : [];
    return contained.map(obj).filter(resource => str(resource.resourceType) === 'Observation');
  }
  return [];
}

function readingsFromObservation(observation: Record<string, unknown>): BiomarkerReading[] {
  const collectedAt = str(observation.effectiveDateTime) ?? str(obj(observation.effectivePeriod).start);
  const markerId = markerForCode(obj(observation.code));

  // Simple value.
  const quantity = obj(observation.valueQuantity);
  const value = num(quantity.value);
  if (markerId && value != null) {
    return [{ id: markerId, value, unit: str(quantity.unit) ?? str(quantity.code), collected_at: collectedAt }];
  }

  // Components (e.g. panels or blood pressure) each carry their own code + value.
  const components = Array.isArray(observation.component) ? observation.component : [];
  const readings: BiomarkerReading[] = [];
  for (const component of components) {
    const comp = obj(component);
    const compMarker = markerForCode(obj(comp.code));
    const compQuantity = obj(comp.valueQuantity);
    const compValue = num(compQuantity.value);
    if (compMarker && compValue != null) {
      readings.push({ id: compMarker, value: compValue, unit: str(compQuantity.unit) ?? str(compQuantity.code), collected_at: collectedAt });
    }
  }
  return readings;
}

function markerForCode(code: Record<string, unknown>): string | undefined {
  const codings = Array.isArray(code.coding) ? code.coding : [];
  for (const coding of codings) {
    const c = obj(coding);
    const system = str(c.system) ?? '';
    const codeValue = str(c.code);
    if (codeValue && /loinc/i.test(system) && LOINC_TO_MARKER[codeValue]) return LOINC_TO_MARKER[codeValue];
    if (codeValue && LOINC_TO_MARKER[codeValue]) return LOINC_TO_MARKER[codeValue];
    const display = str(c.display);
    if (display) {
      const def = resolveMarkerDefinition(display);
      if (def) return def.id;
    }
  }
  const text = str(code.text);
  if (text) {
    const def = resolveMarkerDefinition(text);
    if (def) return def.id;
  }
  return undefined;
}

function dedupe(readings: BiomarkerReading[]): BiomarkerReading[] {
  return Array.from(new Map(readings.map(reading => [reading.id, reading])).values());
}

function obj(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
