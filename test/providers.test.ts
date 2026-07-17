import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findProviders, parseModalities } from '../src/core/providers.js';

test('parseModalities validates and filters the enum', () => {
  assert.deepEqual(parseModalities('genetics,wearables'), ['genetics', 'wearables']);
  assert.deepEqual(parseModalities('genetics, bogus, biomarkers'), ['genetics', 'biomarkers']);
  assert.equal(parseModalities('nonsense'), undefined);
  assert.equal(parseModalities(null), undefined);
});

test('returns all modalities by default', async () => {
  const res = await findProviders({});
  assert.deepEqual(res.query.modalities, ['genetics', 'biomarkers', 'wearables']);
  assert.ok(Array.isArray(res.genetics) && res.genetics!.length > 0, 'WGS providers present');
  assert.ok(Array.isArray(res.wearables) && res.wearables!.some(w => w.id === 'whoop'));
  assert.ok(res.biomarkers);
});

test('scopes to requested modalities only', async () => {
  const res = await findProviders({ modalities: ['genetics'] });
  assert.ok(res.genetics);
  assert.equal(res.wearables, undefined);
  assert.equal(res.biomarkers, undefined);
});

test('filters genetics providers by type', async () => {
  const res = await findProviders({ modalities: ['genetics'], type: 'wgs' });
  assert.ok(res.genetics!.length > 0);
  assert.ok(res.genetics!.every(p => p.type === 'wgs'));
});

test('biomarkers without a location returns a hint, not a locator call', async () => {
  const res = await findProviders({ modalities: ['biomarkers'] });
  assert.deepEqual(res.biomarkers!.supported_providers, ['quest', 'synlab']);
  assert.equal(res.biomarkers!.locations.length, 0);
  assert.match(res.biomarkers!.note ?? '', /postal_code|city|lat/i);
});
