import type { EngineFinding } from './engines.js';

// Behavioral / lifestyle data is a first-class modality: structured supplements
// and medications, daily nutrition, and subjective symptom/mood signals. Keeping
// it structured (not free text) lets it be scored, trended, and cross-referenced
// against genetics (e.g. medications against pharmacogenomic context).

export type BehavioralKind = 'supplement' | 'medication' | 'nutrition' | 'symptom' | 'note';

export interface BehavioralEntry {
  kind: BehavioralKind;
  id: string;
  name?: string;
  value?: number;
  unit?: string;
  dose?: string;
  timing?: string;
  note?: string;
  observed_at?: string;
}

interface BehavioralDefinition {
  id: string;
  aliases: string[];
  name: string;
  domain: string;
  unit: string;
  optimal_min?: number;
  optimal_max?: number;
  critical_low?: number;
  critical_high?: number;
  action_low?: string;
  action_high?: string;
}

// Daily nutrition targets and subjective 1-10 wellness scales. Directionality is
// inferred from which bounds are set (see scoreBehavioral).
const NUTRITION: BehavioralDefinition[] = [
  { id: 'protein_g', aliases: ['protein', 'protein grams'], name: 'Protein', domain: 'nutrition', unit: 'g/day', optimal_min: 100, critical_low: 50, action_low: 'Raise daily protein toward 1.6 g/kg bodyweight, spread across meals, to protect lean mass.' },
  { id: 'fiber_g', aliases: ['fiber', 'fibre'], name: 'Fiber', domain: 'nutrition', unit: 'g/day', optimal_min: 25, critical_low: 15, action_low: 'Add legumes, vegetables, and whole grains to reach 25-35 g/day for metabolic and gut health.' },
  { id: 'added_sugar_g', aliases: ['added sugar', 'sugar'], name: 'Added sugar', domain: 'nutrition', unit: 'g/day', optimal_max: 25, critical_high: 50, action_high: 'Reduce added sugar and refined carbohydrate; it drives glucose variability and triglycerides.' },
  { id: 'sodium_mg', aliases: ['sodium', 'salt'], name: 'Sodium', domain: 'nutrition', unit: 'mg/day', optimal_max: 2300, critical_high: 3500, action_high: 'Lower processed-food sodium if blood pressure is a focus.' },
  { id: 'vegetable_servings', aliases: ['vegetables', 'veg servings', 'veg'], name: 'Vegetable servings', domain: 'nutrition', unit: 'servings/day', optimal_min: 4, critical_low: 2, action_low: 'Build toward 4-6 servings of varied vegetables per day.' },
  { id: 'water_l', aliases: ['water', 'hydration'], name: 'Water', domain: 'nutrition', unit: 'L/day', optimal_min: 2, critical_low: 1, action_low: 'Aim for roughly 2-3 L/day, adjusted for climate and training.' },
  { id: 'alcohol_units_week', aliases: ['alcohol', 'alcohol units', 'drinks per week'], name: 'Alcohol', domain: 'nutrition', unit: 'units/week', optimal_max: 5, critical_high: 14, action_high: 'Reduce weekly alcohol; it degrades sleep, HRV, glucose control, and liver markers.' },
];

const SUBJECTIVE: BehavioralDefinition[] = [
  { id: 'energy_level', aliases: ['energy'], name: 'Energy', domain: 'wellbeing', unit: '1-10', optimal_min: 6, critical_low: 3, action_low: 'Persistent low energy warrants reviewing sleep, iron/thyroid labs, training load, and stress.' },
  { id: 'mood', aliases: ['mood score'], name: 'Mood', domain: 'wellbeing', unit: '1-10', optimal_min: 6, critical_low: 3, action_low: 'Persistent low mood is worth discussing with a clinician; review sleep, activity, and social context.' },
  { id: 'stress_level', aliases: ['stress'], name: 'Stress', domain: 'wellbeing', unit: '1-10', optimal_max: 4, critical_high: 7, action_high: 'Elevated stress degrades HRV, sleep, and glucose; prioritize recovery, daylight, and load management.' },
  { id: 'sleep_quality', aliases: ['sleep quality'], name: 'Sleep quality', domain: 'wellbeing', unit: '1-10', optimal_min: 6, critical_low: 3, action_low: 'Low subjective sleep quality should be paired with wearable sleep metrics and a consistent schedule.' },
];

const NUTRITION_LOOKUP = behavioralLookup(NUTRITION);
const SUBJECTIVE_LOOKUP = behavioralLookup(SUBJECTIVE);
const SCORED_LOOKUP = new Map([...NUTRITION_LOOKUP, ...SUBJECTIVE_LOOKUP]);

// Common drugs with CPIC/pharmacogenomic relevance. A medication match becomes a
// prompt to consider genetic context - it never advises a medication change.
const PHARMACOGENOMIC_DRUGS: Record<string, string[]> = {
  clopidogrel: ['CYP2C19'],
  warfarin: ['CYP2C9', 'VKORC1'],
  simvastatin: ['SLCO1B1'],
  atorvastatin: ['SLCO1B1'],
  rosuvastatin: ['SLCO1B1', 'ABCG2'],
  codeine: ['CYP2D6'],
  tramadol: ['CYP2D6'],
  omeprazole: ['CYP2C19'],
  esomeprazole: ['CYP2C19'],
  citalopram: ['CYP2C19'],
  escitalopram: ['CYP2C19'],
  sertraline: ['CYP2C19'],
  fluoxetine: ['CYP2D6'],
  metoprolol: ['CYP2D6'],
  allopurinol: ['HLA-B'],
  azathioprine: ['TPMT', 'NUDT15'],
  amitriptyline: ['CYP2D6', 'CYP2C19'],
  ibuprofen: ['CYP2C9'],
};

export function parseBehavioralJson(text: string): BehavioralEntry[] {
  const parsed = JSON.parse(text) as unknown;
  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { entries?: unknown })?.entries)
      ? (parsed as { entries: unknown[] }).entries
      : Array.isArray((parsed as { readings?: unknown })?.readings)
        ? (parsed as { readings: unknown[] }).readings
        : [parsed];
  return rows.flatMap(row => entriesFromObject(objectRecord(row)));
}

export function parseBehavioralCsv(text: string): BehavioralEntry[] {
  const rows = parseCsv(text);
  return rows.flatMap(row => entriesFromObject(row));
}

export function parseBehavioralText(text: string): BehavioralEntry[] {
  const entries: BehavioralEntry[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const labelled = line.match(/^(supplement|medication|med|drug|symptom|nutrition)\s*[:\-]\s*(.+)$/i);
    if (labelled) {
      const kind = normalizeKind(labelled[1]!);
      entries.push(buildEntry(kind, labelled[2]!.trim()));
      continue;
    }
    // Otherwise, try to match a scored nutrition/subjective marker with a value.
    const scored = matchScoredLine(line);
    if (scored) entries.push(scored);
    else entries.push({ kind: 'note', id: `note_${entries.length}`, note: line });
  }
  return entries;
}

export function analyzeBehavioral(entries: BehavioralEntry[]): {
  findings: EngineFinding[];
  inventory: {
    supplements: Array<{ name: string; dose?: string; timing?: string }>;
    medications: Array<{ name: string; dose?: string; timing?: string; pharmacogenes?: string[] }>;
    notes: string[];
  };
} {
  const findings: EngineFinding[] = [];
  for (const entry of entries) {
    if (entry.kind !== 'nutrition' && entry.kind !== 'symptom') continue;
    const def = SCORED_LOOKUP.get(normalizeId(entry.id)) ?? (entry.name ? SCORED_LOOKUP.get(normalizeId(entry.name)) : undefined);
    if (!def || entry.value == null || !Number.isFinite(entry.value)) continue;
    findings.push(scoreBehavioral(entry.value, def));
  }

  const supplements = entries.filter(entry => entry.kind === 'supplement').map(entry => ({
    name: entry.name ?? entry.id,
    dose: entry.dose,
    timing: entry.timing,
  }));
  const medications = entries.filter(entry => entry.kind === 'medication').map(entry => {
    const pharmacogenes = PHARMACOGENOMIC_DRUGS[normalizeId(entry.name ?? entry.id).replace(/_/g, '')]
      ?? PHARMACOGENOMIC_DRUGS[(entry.name ?? entry.id).toLowerCase().trim()];
    return { name: entry.name ?? entry.id, dose: entry.dose, timing: entry.timing, pharmacogenes };
  });
  const notes = entries.filter(entry => entry.kind === 'note' && entry.note).map(entry => entry.note!);

  if (supplements.length > 0) {
    findings.push(inventoryFinding('supplement_inventory', 'Supplement stack', 'nutrition',
      `${supplements.length} supplement${supplements.length === 1 ? '' : 's'} logged: ${supplements.map(s => s.name).join(', ')}.`,
      'Review supplement timing and interactions with lab results; deprioritize anything without a measured target it moves.'));
  }
  if (medications.length > 0) {
    const flagged = medications.filter(med => med.pharmacogenes && med.pharmacogenes.length > 0);
    const summary = `${medications.length} medication${medications.length === 1 ? '' : 's'} logged${flagged.length ? `; ${flagged.length} with pharmacogenomic relevance (${flagged.map(m => m.name).join(', ')})` : ''}.`;
    findings.push(inventoryFinding('medication_inventory', 'Medication list', 'medication', summary,
      flagged.length
        ? 'Some medications have known gene-drug interactions (CPIC). If genetic data is available, review response/dosing context with a clinician or pharmacist. Never change medication from a dashboard alone.'
        : 'Keep the medication list current so analyses and any genetic pharmacology context stay accurate.'));
  }

  return { findings, inventory: { supplements, medications, notes } };
}

function scoreBehavioral(value: number, def: BehavioralDefinition): EngineFinding {
  const scored = scoreAgainstRange(value, def);
  return {
    id: def.id,
    name: def.name,
    status: scored.status,
    score: scored.score,
    value,
    source_type: 'direct',
    domain: def.domain,
    unit: def.unit,
    optimal_min: def.optimal_min,
    optimal_max: def.optimal_max,
    direction: scored.direction,
    interpretation: scored.status === 'optimal'
      ? `${def.name} is inside the current wellness target at ${value} ${def.unit}.`
      : `${def.name} is ${scored.direction} versus the current wellness target at ${value} ${def.unit}.`,
    action: scored.status === 'optimal'
      ? `Maintain the current baseline and compare ${def.name} against future trends.`
      : (scored.direction === 'low' && def.action_low) ? def.action_low
        : (scored.direction === 'high' && def.action_high) ? def.action_high
          : `Review ${def.name} with related signals before changing the plan.`,
  };
}

function inventoryFinding(id: string, name: string, domain: string, summary: string, action: string): EngineFinding {
  return { id, name, status: 'optimal', score: 90, source_type: 'direct', domain, interpretation: summary, action };
}

function scoreAgainstRange(value: number, def: BehavioralDefinition): { status: EngineFinding['status']; score: number; direction: 'low' | 'high' | 'ok' } {
  if (def.critical_low != null && value < def.critical_low) return { status: 'needs_attention', score: 25, direction: 'low' };
  if (def.critical_high != null && value > def.critical_high) return { status: 'needs_attention', score: 25, direction: 'high' };
  if (def.optimal_min != null && value < def.optimal_min) return { status: 'watch', score: 55, direction: 'low' };
  if (def.optimal_max != null && value > def.optimal_max) return { status: 'watch', score: 55, direction: 'high' };
  return { status: 'optimal', score: 90, direction: 'ok' };
}

function entriesFromObject(row: Record<string, string>): BehavioralEntry[] {
  const rawKind = firstDefined(row, ['kind', 'type', 'category']);
  const name = firstDefined(row, ['name', 'marker', 'metric', 'supplement', 'medication', 'symptom']);
  const value = numberFrom(firstDefined(row, ['value', 'amount', 'result', 'score']));
  const dose = firstDefined(row, ['dose', 'dosage']);
  const timing = firstDefined(row, ['timing', 'time']);
  const observedAt = firstDefined(row, ['observed_at', 'date']);

  if (rawKind) {
    const kind = normalizeKind(rawKind);
    const entry = buildEntry(kind, name ?? '', { value, dose, timing, observedAt });
    return [entry];
  }

  // No explicit kind: treat any recognized scored marker columns as nutrition/symptom entries.
  return Object.entries(row).flatMap(([key, cell]) => {
    const def = SCORED_LOOKUP.get(normalizeId(key));
    const numeric = numberFrom(cell);
    if (!def || numeric == null) return [];
    return [{ kind: def.domain === 'nutrition' ? 'nutrition' as const : 'symptom' as const, id: def.id, name: def.name, value: numeric, unit: def.unit, observed_at: observedAt }];
  });
}

function buildEntry(kind: BehavioralKind, text: string, extra?: { value?: number; dose?: string; timing?: string; observedAt?: string }): BehavioralEntry {
  if (kind === 'supplement' || kind === 'medication') {
    const parsed = parseSupplementText(text);
    return {
      kind,
      id: normalizeId(parsed.name || text) || `${kind}_${Math.random().toString(36).slice(2, 8)}`,
      name: parsed.name || text,
      dose: extra?.dose ?? parsed.dose,
      timing: extra?.timing ?? parsed.timing,
      observed_at: extra?.observedAt,
    };
  }
  if (kind === 'note') return { kind, id: `note_${Math.random().toString(36).slice(2, 8)}`, note: text };
  // nutrition / symptom
  const def = SCORED_LOOKUP.get(normalizeId(text)) ?? matchScoredName(text);
  const id = def?.id ?? normalizeId(text);
  return { kind, id, name: def?.name ?? text, value: extra?.value, unit: def?.unit, observed_at: extra?.observedAt };
}

function matchScoredLine(line: string): BehavioralEntry | undefined {
  for (const def of [...NUTRITION, ...SUBJECTIVE]) {
    for (const label of [def.name, def.id, ...def.aliases].sort((a, b) => b.length - a.length)) {
      const match = line.match(new RegExp(`\\b${escapeRegex(label)}\\b\\s*[:\\-]?\\s*(-?\\d+(?:\\.\\d+)?)`, 'i'));
      if (match) {
        return { kind: def.domain === 'nutrition' ? 'nutrition' : 'symptom', id: def.id, name: def.name, value: Number(match[1]), unit: def.unit };
      }
    }
  }
  return undefined;
}

function matchScoredName(text: string): BehavioralDefinition | undefined {
  return SCORED_LOOKUP.get(normalizeId(text));
}

function parseSupplementText(text: string): { name: string; dose?: string; timing?: string } {
  // e.g. "Vitamin D3 4000 IU morning" -> name, dose, timing
  const doseMatch = text.match(/(\d+(?:\.\d+)?\s*(?:mg|mcg|ug|g|iu|ml)\b)/i);
  const timingMatch = text.match(/\b(morning|evening|night|am|pm|with food|before bed|daily|weekly)\b/i);
  let name = text;
  if (doseMatch) name = name.replace(doseMatch[0], '').trim();
  if (timingMatch) name = name.replace(timingMatch[0], '').trim();
  name = name.replace(/[,-]+$/, '').trim();
  return { name, dose: doseMatch?.[0]?.trim(), timing: timingMatch?.[0]?.trim() };
}

function normalizeKind(value: string): BehavioralKind {
  const key = value.toLowerCase().trim();
  if (key.startsWith('supp')) return 'supplement';
  if (key.startsWith('med') || key === 'drug') return 'medication';
  if (key.startsWith('symp') || key === 'mood' || key === 'energy' || key === 'stress') return 'symptom';
  if (key.startsWith('nutri') || key === 'diet' || key === 'food') return 'nutrition';
  return 'note';
}

function behavioralLookup(definitions: BehavioralDefinition[]): Map<string, BehavioralDefinition> {
  const lookup = new Map<string, BehavioralDefinition>();
  for (const def of definitions) {
    for (const label of [def.id, def.name, ...def.aliases]) lookup.set(normalizeId(label), def);
  }
  return lookup;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0]!.split(',').map(cell => normalizeId(cell.trim()));
  return lines.slice(1).map(line => {
    const cells = line.split(',').map(cell => cell.trim());
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function objectRecord(value: unknown): Record<string, string> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [normalizeId(key), String(item ?? '')]));
}

function firstDefined(row: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[normalizeId(key)];
    if (value != null && value !== '') return value;
  }
  return undefined;
}

function numberFrom(value: string | undefined): number | undefined {
  if (value == null || value === '') return undefined;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeId(id: string): string {
  return id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
