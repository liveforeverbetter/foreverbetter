import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createHealthApiServer } from '../src/http.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => resolve(here, 'fixtures', name);

const server = createHealthApiServer();
let baseUrl = '';

before(async () => {
  await new Promise<void>(resolve => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('multimodal analysis combines biomarkers + wearables + genetics for one user', async () => {
  const userId = 'user_multimodal';

  const biomarkerCsv = await readFile(fixture('biomarkers-full-panel.csv'), 'utf8');
  const wearableCsv = await readFile(fixture('wearables-week.csv'), 'utf8');
  const vcfText = await readFile(fixture('genetic-sample.vcf'), 'utf8');

  const biomarkers = await post('/imports/file', {
    user_id: userId,
    category: 'biomarkers',
    filename: 'biomarkers-full-panel.csv',
    content_type: 'text/csv',
    text: biomarkerCsv,
  });
  const wearables = await post('/imports/file', {
    user_id: userId,
    category: 'wearables',
    filename: 'wearables-week.csv',
    content_type: 'text/csv',
    text: wearableCsv,
  });
  const genetics = await post('/imports/file', {
    user_id: userId,
    category: 'genetics',
    filename: 'genetic-sample.vcf',
    content_type: 'text/plain',
    text: vcfText,
  });

  assert.equal(biomarkers.source.category, 'biomarkers');
  assert.equal(wearables.source.category, 'wearables');
  assert.equal(genetics.source.category, 'genetics');

  const analysis = await post('/analyses', {
    user_id: userId,
    source_ids: [biomarkers.source.id, wearables.source.id, genetics.source.id],
    profile: { age: 42, sex: 'male' },
  });

  // 3 modalities present in the analysis raw references
  const categories = new Set<string>(
    analysis.raw_source_references.map((source: { category: string }) => source.category),
  );
  assert.equal(categories.size, 3);
  assert.ok(categories.has('biomarkers'));
  assert.ok(categories.has('wearables'));
  assert.ok(categories.has('genetics'));

  // Derived interpretations include at least one per modality
  const derivedCategories = new Set<string>(
    analysis.derived_interpretations.map((item: { category: string }) => item.category),
  );
  assert.ok(derivedCategories.has('biomarkers'), `biomarker findings missing; got ${[...derivedCategories]}`);
  assert.ok(derivedCategories.has('wearables'), `wearable findings missing; got ${[...derivedCategories]}`);
  assert.ok(derivedCategories.has('genetics'), `genetic finding missing; got ${[...derivedCategories]}`);

  // Every derived interpretation tags its source via provenance.source_ids + categories + source_type
  for (const derived of analysis.derived_interpretations) {
    assert.ok(Array.isArray(derived.provenance?.source_ids), 'provenance.source_ids missing');
    assert.ok(derived.provenance.source_ids.length > 0, 'provenance.source_ids empty');
    assert.ok(typeof derived.provenance.engine === 'string', 'provenance.engine missing');
    assert.ok(Array.isArray(derived.provenance.source_categories), 'provenance.source_categories missing');
    assert.ok(derived.provenance.source_categories.length > 0, 'provenance.source_categories empty');
    assert.ok(['direct', 'derived', 'combined', 'queued', 'setup_required', 'failed'].includes(derived.provenance.source_type),
      `unexpected source_type: ${derived.provenance.source_type}`);
  }

  // At least one finding should be a `direct` lab interpretation (raw lab value)
  const directLab = analysis.derived_interpretations.find(
    (d: { provenance: { source_type: string; source_categories: string[] } }) =>
      d.provenance.source_type === 'direct' && d.provenance.source_categories.includes('biomarkers'),
  );
  assert.ok(directLab, 'expected at least one direct biomarker interpretation');

  // Dashboard cards exist and surface at least the genetics queued/setup card first
  assert.ok(analysis.dashboard_spec.cards.length > 0);
  const cardCategories = new Set<string>(
    analysis.dashboard_spec.cards.map((card: { category: string }) => card.category),
  );
  assert.ok(cardCategories.has('genetics'));

  // Cross-modal query: any term should pull from biomarker findings + observations + derived
  const query = await post('/query', {
    user_id: userId,
    analysis_ids: [analysis.id],
    query: 'ApoB',
  });
  assert.ok(query.matches.length >= 1, 'expected at least one ApoB match in the query');
});

async function post(path: string, body: unknown): Promise<any> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  assert.ok(response.ok, text);
  return JSON.parse(text);
}
