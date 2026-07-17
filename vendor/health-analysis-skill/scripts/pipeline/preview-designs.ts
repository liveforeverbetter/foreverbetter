#!/usr/bin/env node
/**
 * Render each design to a PNG for onboarding and marketing.
 *
 *   npm run design:preview                       # sample data
 *   npm run design:preview -- --json=out.json    # your own run
 *
 * Writes docs/design-previews/<id>.png. Playwright is optional and imported
 * dynamically; install it only when you want to regenerate the images:
 *   npm i -D playwright && npx playwright install chromium
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { renderDesignDashboard, DESIGN_IDS, type DashboardData } from '../../shared/design/render-designs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../../docs/design-previews');

const SAMPLE: DashboardData = {
  score: 74,
  summary: 'Built from your blood test and wearable. Metabolic markers are the signal to work on; sleep and recovery are steady.',
  coverage: [
    { modality: 'biomarkers', label: 'Blood test', signal_count: 42, status: 'connected' },
    { modality: 'wearables', label: 'Wearable', signal_count: 27, status: 'connected' },
  ],
  cards: [
    { title: 'ApoB', score: 55, status: 'needs_attention', summary: 'Above the optimal range for cardiovascular risk.' },
    { title: 'HbA1c', score: 68, status: 'watch', summary: 'Trending toward the upper range.' },
    { title: 'Sleep', score: 82, status: 'optimal', summary: 'Consistent duration and timing.' },
    { title: 'HRV', score: 71, status: 'good', summary: 'Recovery capacity is solid.' },
    { title: 'Resting HR', score: 78, status: 'good', summary: 'Low and stable.' },
    { title: 'Vitamin D', score: 48, status: 'low', summary: 'Below the target range.' },
    { title: 'Triglycerides', score: 60, status: 'watch', summary: 'Borderline.' },
    { title: 'Activity', score: 65, status: 'watch', summary: 'Below your movement floor.' },
  ],
  priorities: [
    { title: 'Lower ApoB', why: 'Your strongest cardiovascular signal this cycle.' },
    { title: 'Tighten glucose control', why: 'HbA1c and triglycerides are drifting together.' },
    { title: 'Hold your sleep and recovery', why: 'Already optimal; protect it.' },
  ],
  disclaimer: 'Educational longevity analysis. Not a diagnosis or medical advice.',
};

async function main() {
  mkdirSync(outDir, { recursive: true });
  let chromium: any;
  try {
    // Optional dependency, imported dynamically so it isn't required to build/run.
    // @ts-ignore - playwright is an optional devDependency for preview generation
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('[preview] Playwright is not installed. Install it to regenerate images:');
    console.error('  npm i -D playwright && npx playwright install chromium');
    // Still write the HTML so the images can be produced another way.
    for (const id of DESIGN_IDS) writeFileSync(path.join(outDir, `${id}.html`), renderDesignDashboard(SAMPLE, id));
    console.error(`[preview] Wrote HTML to ${path.relative(process.cwd(), outDir)}/ instead.`);
    process.exit(0);
  }
  const browser = await chromium.launch();
  for (const id of DESIGN_IDS) {
    const html = renderDesignDashboard(SAMPLE, id);
    const page = await browser.newPage({ viewport: { width: 1120, height: 1400 }, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // let ring/gauge/orb motion settle
    await page.screenshot({ path: path.join(outDir, `${id}.png`), fullPage: true });
    await page.close();
    console.log(`[preview] ${id}.png`);
  }
  await browser.close();
}

main().catch(error => { console.error('[preview] FAILED:', error.message); process.exit(1); });
