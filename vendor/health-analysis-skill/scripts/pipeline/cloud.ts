#!/usr/bin/env node
/**
 * Cloud run path. Uploads local files to a compatible hosted health API, runs
 * an analysis, and writes the same canonical outputs the local pipeline does
 * (action plan JSON + a themed dashboard). Wearable OAuth and stored history are
 * cloud-only; this entry handles the file-upload + analysis + action-plan flow.
 *
 *   export HEALTH_API_URL=...   # hosted API base (defaults to the reference instance)
 *   export HEALTH_API_KEY=...   # from ${HEALTH_API_URL}/dashboard
 *   npm run cloud -- --biomarkers=/abs/labs.csv --user=user_001 --design=clinical-modern --out=./output
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { HealthApiClient, type CloudAnalysis, type Modality } from '../../shared/cloud-client.js';
import { renderDesignDashboard } from '../../shared/design/render-designs.js';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a.startsWith('--')) out[a.slice(2)] = 'true';
  }
  return out;
}

const CONTENT_TYPE: Record<string, string> = { '.csv': 'text/csv', '.json': 'application/json', '.vcf': 'text/plain', '.txt': 'text/plain' };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const userId = args.user ?? 'user_local';
  const orgId = args.org;
  const outDir = args.out ?? './output';
  const design = args.design ?? 'clinical-modern';

  const client = new HealthApiClient();
  try {
    client.requireKey();
  } catch (error) {
    console.error(`[cloud] ${(error as Error).message}`);
    console.error(`[cloud] Sign in and create a key at: ${client.dashboardUrl}`);
    process.exit(1);
  }

  const modalityFiles: Array<[Modality, string]> = [];
  for (const modality of ['genetics', 'biomarkers', 'wearables', 'behavioral'] as Modality[]) {
    if (args[modality]) modalityFiles.push([modality, args[modality]]);
  }
  if (modalityFiles.length === 0) {
    console.error('[cloud] Provide at least one of --genetics --biomarkers --wearables --behavioral (absolute path).');
    process.exit(2);
  }

  const sourceIds: string[] = [];
  for (const [modality, filePath] of modalityFiles) {
    const text = readFileSync(filePath, 'utf8');
    const uploaded = await client.uploadFile({
      user_id: userId, organization_id: orgId, category: modality,
      filename: basename(filePath), content_type: CONTENT_TYPE[extname(filePath).toLowerCase()] ?? 'text/plain', text,
    });
    console.log(`[cloud] uploaded ${modality}: ${uploaded.source?.id}`);
    if (uploaded.source?.id) sourceIds.push(uploaded.source.id);
  }

  const analysis = await client.createAnalysis({
    user_id: userId, organization_id: orgId, source_ids: sourceIds,
    profile: { age: args.age ? Number(args.age) : undefined, sex: args.sex as 'male' | 'female' | undefined },
  });
  console.log(`[cloud] analysis: ${analysis.id}`);

  const [actionPlan, dashboardSpec] = await Promise.all([
    client.getActionPlan(analysis.id),
    client.getDashboardSpec(analysis.id),
  ]);

  mkdirSync(outDir, { recursive: true });
  const actionPlanPath = join(outDir, `${userId}_action_plan.json`);
  const dashboardSpecPath = join(outDir, `${userId}_dashboard_spec.json`);
  writeFileSync(actionPlanPath, JSON.stringify(actionPlan, null, 2));
  writeFileSync(dashboardSpecPath, JSON.stringify(dashboardSpec, null, 2));

  const coverage = coverageFromAnalysis(analysis);
  const sourceModalities = coverage.filter(item => item.status === 'connected').map(item => item.modality);
  const priorities = actionPlan.interventions.slice(0, 3).map(item => ({
    title: item.name,
    why: item.rationale || item.detail,
    source_modalities: sourceModalities,
    safety: {
      tier: 'routine_review',
      tier_label: 'Review context',
      message: 'Use this wellness guidance with the source context shown. Discuss persistent or concerning findings with a clinician.',
    },
  }));

  const html = renderDesignDashboard({
    score: analysis.healthspan_score,
    summary: actionPlan.summary,
    coverage,
    cards: dashboardSpec.cards.map(c => ({ title: c.title, category: c.category, score: c.score, status: c.status, summary: c.summary, action: c.action })),
    priorities,
    disclaimer: actionPlan.disclaimer,
  }, design);
  const dashboardPath = join(outDir, 'index.html');
  writeFileSync(dashboardPath, html);

  console.log(`[cloud] dashboard: ${dashboardPath} (design: ${design})`);
  console.log(`[cloud] action plan: ${actionPlanPath}`);
  console.log(`[cloud] dashboard spec: ${dashboardSpecPath}`);
}

function coverageFromAnalysis(analysis: CloudAnalysis) {
  const modalities: Modality[] = ['genetics', 'biomarkers', 'wearables', 'behavioral'];
  return modalities.map(modality => ({
    modality,
    label: modality === 'biomarkers' ? 'Blood test' : modality[0].toUpperCase() + modality.slice(1),
    signal_count: analysis.normalized_observations.filter(observation => observation.category === modality).length,
    status: analysis.raw_source_references.some(source => source.category === modality) ? 'connected' : 'not_provided',
  }));
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[cloud] FAILED:', message);
  process.exit(1);
});
