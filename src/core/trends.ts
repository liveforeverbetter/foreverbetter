import { markerDirectionality, resolveMarkerDefinition, scoreMarkerValue, type MarkerDefinition, type MarkerDirection } from './engines.js';
import type { NormalizedObservation, RawSourceReference, SourceCategory } from '../types.js';

const TREND_MODALITIES = new Set<SourceCategory>(['biomarkers', 'wearables']);
const STABLE_THRESHOLD = 0.02; // <2% movement versus the prior reading reads as stable
const DAY_MS = 24 * 60 * 60 * 1000;

export type TrendDirection = 'improving' | 'worsening' | 'stable' | 'baseline';

export interface TrendPoint {
  value: number;
  observed_at: string;
  source_id: string;
}

export interface MarkerTrend {
  marker: string;
  name: string;
  modality: SourceCategory;
  domain?: string;
  unit?: string;
  direction_basis: MarkerDirection;
  trend: TrendDirection;
  first: number;
  previous?: number;
  latest: number;
  delta?: number;
  delta_from_first: number;
  pct_change?: number;
  latest_status?: string;
  latest_score?: number;
  optimal_min?: number;
  optimal_max?: number;
  points: TrendPoint[];
}

export interface TrendsOptions {
  markers?: string[];
  modality?: SourceCategory;
  windowDays?: number;
}

export interface TrendsResult {
  user_id: string;
  organization_id?: string;
  generated_at: string;
  window_days?: number;
  marker_count: number;
  improving: number;
  worsening: number;
  stable: number;
  markers: MarkerTrend[];
}

// Build a per-marker longitudinal view across every upload. Timestamps come from
// the observation's own observed_at when present, otherwise the upload time of its
// source (each upload is one time point). Direction ("improving"/"worsening") is
// decided by the same optimal-range catalog the analysis engine uses.
export function buildHealthTrends(input: {
  userId: string;
  organizationId?: string;
  observations: NormalizedObservation[];
  sources: RawSourceReference[];
  options?: TrendsOptions;
}): TrendsResult {
  const options = input.options ?? {};
  const receivedAt = new Map(input.sources.map(source => [source.id, source.received_at]));
  const markerFilter = options.markers && options.markers.length > 0
    ? new Set(options.markers.map(marker => marker.toLowerCase()))
    : undefined;
  const cutoff = options.windowDays && options.windowDays > 0 ? Date.now() - options.windowDays * DAY_MS : undefined;

  const groups = new Map<string, NormalizedObservation[]>();
  for (const observation of input.observations) {
    if (observation.value == null || !Number.isFinite(observation.value)) continue;
    if (!TREND_MODALITIES.has(observation.category)) continue;
    if (options.modality && observation.category !== options.modality) continue;
    if (markerFilter && !markerFilter.has(observation.name.toLowerCase())) continue;
    const list = groups.get(observation.name) ?? [];
    list.push(observation);
    groups.set(observation.name, list);
  }

  const markers: MarkerTrend[] = [];
  for (const [markerId, group] of groups) {
    const points: TrendPoint[] = group
      .map(observation => ({
        value: observation.value as number,
        observed_at: observation.observed_at ?? receivedAt.get(observation.source_id) ?? '',
        source_id: observation.source_id,
      }))
      .filter(point => point.observed_at !== '')
      .filter(point => cutoff == null || Date.parse(point.observed_at) >= cutoff)
      .sort((a, b) => a.observed_at.localeCompare(b.observed_at));
    if (points.length === 0) continue;

    const def = resolveMarkerDefinition(markerId);
    const unit = firstUnit(group) ?? def?.unit;
    const first = points[0]!.value;
    const latest = points[points.length - 1]!.value;
    const previous = points.length >= 2 ? points[points.length - 2]!.value : undefined;
    const direction = def ? markerDirectionality(def) : 'unknown';
    const scored = def ? scoreMarkerValue(latest, def) : undefined;
    markers.push({
      marker: markerId,
      name: def?.name ?? markerId,
      modality: group[0]!.category,
      domain: def?.domain,
      unit,
      direction_basis: direction,
      trend: classifyTrend(latest, previous, def, direction),
      first,
      previous,
      latest,
      delta: previous == null ? undefined : round(latest - previous),
      delta_from_first: round(latest - first),
      pct_change: previous == null || previous === 0 ? undefined : round(((latest - previous) / Math.abs(previous)) * 100),
      latest_status: scored?.status,
      latest_score: scored?.score,
      optimal_min: def?.optimal_min,
      optimal_max: def?.optimal_max,
      points,
    });
  }

  markers.sort((a, b) => trendRank(a.trend) - trendRank(b.trend) || a.name.localeCompare(b.name));
  return {
    user_id: input.userId,
    organization_id: input.organizationId,
    generated_at: new Date().toISOString(),
    window_days: options.windowDays,
    marker_count: markers.length,
    improving: markers.filter(marker => marker.trend === 'improving').length,
    worsening: markers.filter(marker => marker.trend === 'worsening').length,
    stable: markers.filter(marker => marker.trend === 'stable').length,
    markers,
  };
}

function classifyTrend(latest: number, previous: number | undefined, def: MarkerDefinition | undefined, direction: MarkerDirection): TrendDirection {
  if (previous == null) return 'baseline';
  const change = latest - previous;
  const relative = previous === 0 ? Math.abs(change) : Math.abs(change / previous);
  if (relative < STABLE_THRESHOLD) return 'stable';
  if (direction === 'lower_is_better') return change < 0 ? 'improving' : 'worsening';
  if (direction === 'higher_is_better') return change > 0 ? 'improving' : 'worsening';
  if (direction === 'range' && def) {
    const midpoint = ((def.optimal_min ?? latest) + (def.optimal_max ?? latest)) / 2;
    const wasDistance = Math.abs(previous - midpoint);
    const nowDistance = Math.abs(latest - midpoint);
    if (nowDistance === wasDistance) return 'stable';
    return nowDistance < wasDistance ? 'improving' : 'worsening';
  }
  return 'stable';
}

function trendRank(trend: TrendDirection): number {
  switch (trend) {
    case 'worsening': return 0;
    case 'stable': return 1;
    case 'improving': return 2;
    default: return 3;
  }
}

function firstUnit(group: NormalizedObservation[]): string | undefined {
  return group.find(observation => observation.unit)?.unit;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
