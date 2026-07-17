/**
 * Protocol Migration Script
 * Converts old longevity-protocol.json format to new pipeline dashboard format.
 *
 * Usage:
 *   npx tsx scripts/ingestion/migrate-protocol.ts <old-protocol.json> [output-dir]
 *
 * Example:
 *   npx tsx scripts/ingestion/migrate-protocol.ts ../../example-data/longevity-protocol.json ./output
 *
 * Output:
 *   - {output-dir}/{user-id}_dashboard.json   (new schema)
 *   - {output-dir}/index.html                 (rendered dashboard)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { runPipelineFromProtocol, savePipelineOutput, transformToDashboardData } from '../pipeline/index.js';
import { renderDashboard } from '../../src/renderer/render.js';
import type { DashboardData } from '../../shared/dashboard-types.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function main() {
  const protocolPath = process.argv[2];
  const outputDir = process.argv[3] || './output';

  if (!protocolPath) {
    console.log(`
🧬 Protocol Migration Script
Converts old longevity-protocol.json → new pipeline dashboard format.

Usage:
  npx tsx scripts/ingestion/migrate-protocol.ts <old-protocol.json> [output-dir]

Example:
  npx tsx scripts/ingestion/migrate-protocol.ts ../../example-data/longevity-protocol.json ./output
`);
    process.exit(1);
  }

  if (!fs.existsSync(protocolPath)) {
    console.error(`❌ Protocol file not found: ${protocolPath}`);
    process.exit(1);
  }

  console.log('🔄 Migrating protocol...');
  console.log(`   Source: ${protocolPath}`);
  console.log(`   Output: ${outputDir}`);

  // Parse old format
  const protocolRaw = fs.readFileSync(protocolPath, 'utf-8');
  let protocol: any;
  try {
    protocol = JSON.parse(protocolRaw);
  } catch (err: any) {
    console.error(`❌ Failed to parse protocol JSON: ${err.message}`);
    process.exit(1);
  }

  // Extract user ID from filename
  const basename = path.basename(protocolPath, path.extname(protocolPath));
  const userIdMatch = basename.match(/user[_\-]?(\w+)/i);
  const userId = userIdMatch ? userIdMatch[1] : 'migrated';

  try {
    // Run full pipeline from old protocol
    console.log('📊 Transforming to new schema...');
    const output = runPipelineFromProtocol(protocol, userId);

    // Save new-format JSON
    const jsonPath = savePipelineOutput(output, userId, outputDir);

    // Render HTML dashboard
    console.log('🎨 Rendering dashboard...');
    const templatePath = path.resolve(scriptDir, '../../templates/longevity-dashboard.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const dashboardData = transformToDashboardData(output);
    const html = renderDashboard(template, dashboardData);

    const htmlPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(htmlPath, html, 'utf-8');

    console.log('');
    console.log('✅ Migration complete!');
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   GLI:  ${output.gli} (${output.gli_rating})`);
    console.log(`   Traits: ${output.metadata.trait_count}`);
    console.log(`   Insights: ${output.metadata.insight_count}`);
    console.log(`   Protocols: ${output.metadata.protocol_count}`);
  } catch (err: any) {
    console.error(`❌ Migration failed: ${err.message}`);
    process.exit(1);
  }
}

main();
