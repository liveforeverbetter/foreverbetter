/**
 * Renders the dashboard from existing pipeline output JSON.
 * Usage: npx tsx scripts/pipeline/render-dashboard.ts [output-json] [output-dir]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDashboardJSON, printDailyActionPlanCronPrompt } from './index.js';
import { injectTheme } from '../../shared/design/theme.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(__dirname, '../..');
const repoRoot = path.resolve(packageDir, '../..');

// Positional [output-json] [output-dir] stay supported; --design=<id|path> themes.
const positional = process.argv.slice(2).filter(a => !a.startsWith('--'));
const designArg = process.argv.slice(2).find(a => a.startsWith('--design='))?.split('=')[1];

const defaultSampleJson = fs.existsSync(path.join(packageDir, 'examples/sample-dashboard.json'))
  ? path.join(packageDir, 'examples/sample-dashboard.json')
  : path.join(repoRoot, 'output/test_user_dashboard.json');
const inputJson = positional[0] ?? defaultSampleJson;
const outputDir = positional[1] ?? path.join(packageDir, 'output');
const templatePath = path.resolve(__dirname, '../../templates/longevity-dashboard.html');

const raw = JSON.parse(fs.readFileSync(inputJson, 'utf-8'));
const template = injectTheme(fs.readFileSync(templatePath, 'utf-8'), designArg);

const dashboardJson = buildDashboardJSON(raw as any, {
  userId: raw.metadata?.user_id ?? 'user',
});

const html = template.replace('{{DASHBOARD_DATA_JSON}}', dashboardJson.replace(/</g, '\\u003c'));
const outPath = path.join(outputDir, 'index.html');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outPath, html, 'utf-8');

// Quick summary
const data = JSON.parse(dashboardJson);
console.log(`✓ Dashboard rendered → ${outPath}`);
console.log(`  Member:    ${data.member.name} (${data.member.initials})`);
console.log(`  GLI:       ${data.healthspan.gli}/100 (${data.healthspan.gliStatus})`);
console.log(`  Edges:     ${data.signature.edges.length} — ${data.signature.edges.map((e: any) => e.name).join(', ')}`);
console.log(`  Plan:      ${data.plan.priorities.length} priorities, ${data.plan.maintain.length} maintain items`);
console.log(`  Hallmarks: ${data.hallmarks.length}`);
console.log(`  Drug-gene: ${data.drugGene.length}`);
console.log(`  Polygenic: ${data.polygenic.length} PRS scores`);
printDailyActionPlanCronPrompt(outputDir);
