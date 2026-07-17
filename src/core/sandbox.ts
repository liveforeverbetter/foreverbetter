import { runHealthAnalysis } from './analysis.js';
import { buildActionPlan } from './action-plan.js';
import { buildSourceReference, normalizeImportedFile } from './normalization.js';
import type { RawSourceReference } from '../types.js';

const BIOMARKERS = `marker,value,unit,collected_at
ApoB,124,mg/dL,2026-07-01
HbA1c,5.8,%,2026-07-01
hs-CRP,3.4,mg/L,2026-07-01
Vitamin D,29,ng/mL,2026-07-01`;

const WEARABLES = `metric,value,unit
sleep_duration,6.2,hours
hrv,31,ms
resting_heart_rate,64,bpm
recovery_score,52,%`;

export function buildSyntheticHero(userId: string, organizationId: string, contractVersion: string) {
  const biomarkerSource = source(userId, organizationId, 'biomarkers', 'synthetic-labs.csv', BIOMARKERS);
  const wearableSource = source(userId, organizationId, 'wearables', 'synthetic-wearable.csv', WEARABLES);
  const sources = [biomarkerSource, wearableSource];
  const observations = [
    ...normalizeImportedFile(biomarkerSource, BIOMARKERS),
    ...normalizeImportedFile(wearableSource, WEARABLES),
  ];
  const analysis = runHealthAnalysis(
    userId,
    sources,
    observations,
    { age: 39, sex: 'male' },
    organizationId,
  );
  const actionPlan = buildActionPlan(analysis);
  const coverage = (['genetics', 'biomarkers', 'wearables', 'behavioral'] as const).map(modality => ({
    modality,
    status: sources.some(item => item.category === modality) ? 'connected' : 'not_provided',
    signal_count: observations.filter(item => item.category === modality).length,
  }));

  return {
    synthetic: true,
    persisted: false,
    contract_version: contractVersion,
    generated_at: new Date().toISOString(),
    user_id: userId,
    organization_id: organizationId,
    coverage,
    analysis,
    action_plan: actionPlan,
    dashboard_spec: analysis.dashboard_spec,
    safety: {
      boundary: 'Educational wellness context only. Prescription dose changes and exact supplement dosing are not included.',
      supplement_doses_included: false,
    },
  };
}

function source(
  userId: string,
  organizationId: string,
  category: 'biomarkers' | 'wearables',
  filename: string,
  text: string,
): RawSourceReference {
  return buildSourceReference({
    user_id: userId,
    organization_id: organizationId,
    category,
    filename,
    content_type: 'text/csv',
    provider: 'foreverbetter_synthetic',
    text,
  }, text);
}
