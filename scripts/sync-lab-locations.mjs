#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const DEFAULT_OUTPUT = 'data/lab-locations/lab-locations.json';
const SYNLAB_GEOJSON_URL = 'https://www.synlab.com/lablocator?type=26';
const QUEST_SITEMAP_INDEX_URL = 'https://locations.questdiagnostics.com/sitemap.xml';
const USER_AGENT = 'health-api-lab-location-sync/1.0';

const args = parseArgs(process.argv.slice(2));
const provider = args.provider ?? 'all';
const outputPath = resolve(args.output ?? DEFAULT_OUTPUT);
const limit = args.limit == null ? undefined : Number(args.limit);
const concurrency = Number(args.concurrency ?? '4');
const writeDb = Boolean(args.db ?? args.postgres);

const records = args.input
  ? await readRecordsFromFile(resolve(String(args.input)))
  : await fetchProviderRecords();

if (!args.input) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({
    generated_at: new Date().toISOString(),
    sources: {
      synlab: SYNLAB_GEOJSON_URL,
      quest: QUEST_SITEMAP_INDEX_URL,
    },
    count: records.length,
    records,
  }, null, 2)}\n`);
  console.error(`wrote ${records.length} normalized locations to ${outputPath}`);
}

if (writeDb) {
  await upsertPostgres(records);
}

function parseArgs(values) {
  const parsed = {};
  for (const value of values) {
    if (!value.startsWith('--')) continue;
    const [key, raw] = value.slice(2).split('=', 2);
    parsed[key.replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = raw ?? true;
  }
  return parsed;
}

async function fetchProviderRecords() {
  const records = [];
  if (provider === 'all' || provider === 'synlab') {
    const synlab = await fetchSynlabLocations();
    records.push(...applyLimit(synlab, limit));
    console.error(`synlab: ${synlab.length} locations discovered`);
  }

  if (provider === 'all' || provider === 'quest') {
    const quest = await fetchQuestLocations({ limit, concurrency });
    records.push(...quest);
    console.error(`quest: ${quest.length} locations discovered`);
  }
  return records;
}

async function readRecordsFromFile(filePath) {
  const parsed = JSON.parse(await readFile(filePath, 'utf8'));
  const records = Array.isArray(parsed) ? parsed : parsed.records;
  if (!Array.isArray(records)) throw new Error(`No records array found in ${filePath}`);
  console.error(`read ${records.length} normalized locations from ${filePath}`);
  return records;
}

async function fetchSynlabLocations() {
  const geojson = await fetchJson(SYNLAB_GEOJSON_URL);
  const features = Array.isArray(geojson.features) ? geojson.features : [];
  return features.map(feature => {
    const properties = feature.properties ?? {};
    const [longitude, latitude] = Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates
      : [undefined, undefined];
    const providerLocationId = String(properties.uid ?? properties.pathsegment ?? '');
    return compactRecord({
      id: `synlab:${providerLocationId}`,
      provider: 'synlab',
      provider_location_id: providerLocationId,
      name: String(properties.marketingname || properties.labname || 'SYNLAB location'),
      address_line_1: stringOrUndefined(properties.address),
      city: stringOrUndefined(properties.city),
      postal_code: stringOrUndefined(properties.zip),
      country: stringOrUndefined(properties.country),
      latitude: numberOrUndefined(latitude),
      longitude: numberOrUndefined(longitude),
      phone: stringOrUndefined(properties.phone),
      email: stringOrUndefined(properties.email),
      source_url: properties.pathsegment ? `https://www.synlab.com/lab/${properties.pathsegment}` : 'https://www.synlab.com/lablocator',
      opening_hours: normalizeStringArray(properties.openhours),
      is_active: properties.closed !== true,
      raw: feature,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }).filter(record => record.provider_location_id);
}

async function fetchQuestLocations({ limit, concurrency }) {
  const sitemapUrls = await fetchQuestSitemapUrls();
  const detailUrls = [];
  for (const sitemapUrl of sitemapUrls) {
    const sitemap = await fetchText(sitemapUrl);
    detailUrls.push(...extractXmlTagValues(sitemap, 'loc').filter(url => (
      url.startsWith('https://locations.questdiagnostics.com/')
      && !url.endsWith('/404.html')
    )));
  }
  const uniqueUrls = Array.from(new Set(detailUrls));
  const selectedUrls = applyLimit(uniqueUrls, limit);
  console.error(`quest: ${uniqueUrls.length} sitemap detail URLs discovered; fetching ${selectedUrls.length}`);
  const results = await mapWithConcurrency(selectedUrls, Math.max(1, concurrency), async (url, index) => {
    if (index > 0 && index % 100 === 0) console.error(`quest: fetched ${index}/${selectedUrls.length}`);
    try {
      return await fetchQuestDetail(url);
    } catch (error) {
      console.error(`quest: skipped ${url}: ${error.message}`);
      return undefined;
    }
  });
  return results.filter(Boolean);
}

async function fetchQuestSitemapUrls() {
  const indexXml = await fetchText(QUEST_SITEMAP_INDEX_URL);
  return extractXmlTagValues(indexXml, 'loc').filter(url => url.endsWith('.xml'));
}

async function fetchQuestDetail(url) {
  const html = await fetchText(url);
  const jsonLdBlocks = extractJsonLd(html);
  const business = firstJsonLdObject(jsonLdBlocks, item => hasAddress(item) && item.name);
  const credentialSubject = firstJsonLdObject(jsonLdBlocks, item => hasAddress(item.credentialSubject))?.credentialSubject;
  const source = credentialSubject ?? business;
  if (!source || !hasAddress(source)) throw new Error('missing address JSON-LD');

  const address = source.address;
  const providerLocationId = new URL(url).pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  const services = extractQuestServices(business);
  return compactRecord({
    id: `quest:${providerLocationId}`,
    provider: 'quest',
    provider_location_id: providerLocationId,
    name: String(source.name ?? business?.name ?? 'Quest Diagnostics'),
    address_line_1: stringOrUndefined(address.streetAddress),
    city: stringOrUndefined(address.addressLocality),
    region: stringOrUndefined(address.addressRegion),
    postal_code: stringOrUndefined(address.postalCode),
    country: stringOrUndefined(address.addressCountry),
    latitude: numberOrUndefined(source.geo?.latitude),
    longitude: numberOrUndefined(source.geo?.longitude),
    phone: stringOrUndefined(source.telephone ?? business?.telephone),
    booking_url: 'https://appointment.questdiagnostics.com/as-home',
    source_url: url,
    services,
    opening_hours: normalizeOpeningHours(source.openingHours ?? business?.openingHours ?? source.openingHoursSpecification),
    source_last_modified: stringOrUndefined(source.asOf),
    is_active: true,
    raw: { url, business, credentialSubject },
    synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

function extractJsonLd(html) {
  return Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
    .map(match => htmlDecode(match[1].trim()))
    .map(block => {
      try {
        return JSON.parse(block);
      } catch {
        return undefined;
      }
    })
    .filter(Boolean);
}

function firstJsonLdObject(blocks, predicate) {
  for (const block of blocks.flatMap(flattenJsonLd)) {
    if (predicate(block)) return block;
  }
  return undefined;
}

function flattenJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!value || typeof value !== 'object') return [];
  return [value, ...flattenJsonLd(value['@graph'])];
}

function hasAddress(value) {
  return Boolean(value?.address?.streetAddress && value?.address?.postalCode);
}

function extractQuestServices(business) {
  const items = business?.hasOfferCatalog?.itemListElement;
  if (!Array.isArray(items)) return [];
  return items.map(item => String(item.name ?? item['@id'] ?? '')).filter(Boolean);
}

function normalizeOpeningHours(value) {
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'string') return item;
      const day = String(item.dayOfWeek ?? '').split('/').pop();
      const opens = item.opens ? String(item.opens) : '';
      const closes = item.closes ? String(item.closes) : '';
      return [day, opens && closes ? `${opens}-${closes}` : undefined].filter(Boolean).join(' ');
    }).filter(Boolean);
  }
  return normalizeStringArray(value);
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).filter(Boolean);
}

async function upsertPostgres(rows) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required with --db');
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({ connectionString });
  try {
    for (const row of rows) {
      await pool.query(
        `insert into health_api.lab_locations
          (id, provider, provider_location_id, name, address_line_1, address_line_2, city, region, postal_code, country,
           latitude, longitude, phone, email, booking_url, source_url, services, opening_hours, is_active, raw, source_last_modified, synced_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::text[],$18::text[],$19,$20::jsonb,$21::timestamptz, now(), now())
         on conflict (provider, provider_location_id) do update set
           name=excluded.name, address_line_1=excluded.address_line_1, address_line_2=excluded.address_line_2,
           city=excluded.city, region=excluded.region, postal_code=excluded.postal_code, country=excluded.country,
           latitude=excluded.latitude, longitude=excluded.longitude, phone=excluded.phone, email=excluded.email,
           booking_url=excluded.booking_url, source_url=excluded.source_url, services=excluded.services,
           opening_hours=excluded.opening_hours, is_active=excluded.is_active, raw=excluded.raw,
           source_last_modified=excluded.source_last_modified, synced_at=now(), updated_at=now()`,
        [
          row.id, row.provider, row.provider_location_id, row.name, row.address_line_1 ?? null, row.address_line_2 ?? null,
          row.city ?? null, row.region ?? null, row.postal_code ?? null, row.country ?? null,
          row.latitude ?? null, row.longitude ?? null, row.phone ?? null, row.email ?? null, row.booking_url ?? null,
          row.source_url ?? null, Array.isArray(row.services) ? row.services : [], Array.isArray(row.opening_hours) ? row.opening_hours : [],
          row.is_active ?? true, JSON.stringify(row.raw ?? {}), row.source_last_modified ?? null,
        ],
      );
    }
    console.error(`postgres: upserted ${rows.length}`);
  } finally {
    await pool.end();
  }
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

async function fetchText(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, {
      headers: { accept: '*/*', 'user-agent': USER_AGENT },
      signal: AbortSignal.timeout(30000),
    });
    if (response.ok) return response.text();
    if (attempt === 3) throw new Error(`${url} returned ${response.status}`);
    await sleep(500 * attempt);
  }
  throw new Error(`${url} failed`);
}

function extractXmlTagValues(xml, tag) {
  const re = new RegExp(`<${tag}>([^<]+)<\\/${tag}>`, 'gi');
  return Array.from(xml.matchAll(re), match => htmlDecode(match[1]));
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const output = new Array(values.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

function chunks(values, size) {
  const output = [];
  for (let i = 0; i < values.length; i += size) output.push(values.slice(i, i + size));
  return output;
}

function applyLimit(values, maybeLimit) {
  return maybeLimit == null || Number.isNaN(maybeLimit) ? values : values.slice(0, maybeLimit);
}

function compactRecord(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

function stringOrUndefined(value) {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text.length === 0 ? undefined : text;
}

function numberOrUndefined(value) {
  if (value == null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function htmlDecode(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
