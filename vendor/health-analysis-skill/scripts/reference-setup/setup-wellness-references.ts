#!/usr/bin/env npx tsx
/**
 * Build compact wellness references from GWAS Catalog + PGS Catalog.
 *
 * Raw downloads are cached under reference/wellness/raw and ignored by git.
 * Runtime outputs are compact gzipped JSON files under reference/wellness.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import * as readline from 'readline';
import * as zlib from 'zlib';
import { execFileSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { getDefaultWellnessDisclosures, WELLNESS_REFERENCE_VERSION, type SourceProvenance } from '../pipeline/wellness_reference.js';

type Direction = 'risk' | 'protective' | 'unknown';

interface GWASAssociation {
  trait: string;
  gene: string;
  or: number | null;
  p: number;
  n: number;
  effectAllele: string;
  domain: string;
  direction: Direction;
  source_type: 'gwas_catalog_association';
  source_id: 'gwas_catalog';
  source_url: string;
  source_release: string;
  confidenceTier: 'gwas_association';
  provenance: SourceProvenance[];
}

interface PGSWeight {
  rsid: string;
  effect_allele: string;
  effect_weight: number;
  disease: string;
  citation: string;
  pgs_id: string;
  pgs_name: string;
  reported_trait: string;
  mapped_trait: string;
  genome_build: string;
  ancestry_distribution: string;
  source_type: 'pgs_catalog_score';
  source_url: string;
  source_release: string;
  confidenceTier: 'prs';
  provenance: SourceProvenance[];
}

interface PGSMetadataRow {
  id: string;
  name: string;
  reportedTrait: string;
  mappedTraits: string;
  originalBuild: string;
  variants: number;
  pgpId: string;
  pmid: string;
  doi: string;
  ancestrySource: string;
  ancestryTraining: string;
  ancestryEvaluation: string;
  ftpLink: string;
  releaseDate: string;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '../..');
const referenceDir = path.join(packageDir, 'reference/wellness');
const rawDir = path.join(referenceDir, 'raw');
const outputGwas = path.join(referenceDir, 'gwas_wellness_associations.json.gz');
const outputPgs = path.join(referenceDir, 'pgs_wellness_weights.json.gz');
const outputManifest = path.join(referenceDir, 'wellness-reference.manifest.json');

const GWAS_URL = 'https://ftp.ebi.ac.uk/pub/databases/gwas/releases/latest/gwas-catalog-associations_ontology-annotated-full.zip';
const GWAS_TSV_IN_ZIP = 'gwas-catalog-download-associations-alt-full.tsv';
const PGS_METADATA_URL = 'https://ftp.ebi.ac.uk/pub/databases/spot/pgs/metadata/pgs_all_metadata.tar.gz';
const GWAS_P_THRESHOLD = 5e-8;

const args = new Set(process.argv.slice(2));
const skipDownload = args.has('--skip-download');
const keepRaw = args.has('--keep-raw');
const force = args.has('--force');
const maxScores = Number(process.argv.find(arg => arg.startsWith('--max-scores='))?.split('=')[1] ?? 24);
const maxVariantsPerScore = Number(process.argv.find(arg => arg.startsWith('--max-variants-per-score='))?.split('=')[1] ?? 25000);

const DOMAIN_RULES: Array<{ keywords: string[]; domain: string }> = [
  { keywords: ['longevity', 'lifespan', 'aging', 'ageing', 'mortality', 'survival', 'telomere', 'centenarian', 'epigenetic age', 'biological age'], domain: 'longevity' },
  { keywords: ['muscle', 'exercise', 'athletic', 'physical activity', 'grip strength', 'lean body mass', 'vo2', 'fitness', 'bone mineral density', 'bone density'], domain: 'athletic_performance' },
  { keywords: ['sleep', 'chronotype', 'insomnia', 'circadian', 'morning person', 'evening person', 'sleep duration', 'daytime sleepiness'], domain: 'sleep' },
  { keywords: ['coronary', 'cardiac', 'heart', 'blood pressure', 'hypertension', 'ldl', 'hdl', 'cholesterol', 'triglyceride', 'lipid', 'aortic', 'carotid'], domain: 'cardiovascular' },
  { keywords: ['body mass', 'bmi', 'obesity', 'waist', 'adiposity', 'fat mass', 'type 2 diabetes', 'insulin', 'glucose', 'hba1c', 'metabolic', 'lean mass'], domain: 'metabolic' },
  { keywords: ['c-reactive protein', 'interleukin', 'il-6', 'immune', 'inflammation', 'asthma', 'allergy', 'white blood cell', 'lymphocyte', 'neutrophil'], domain: 'immune' },
  { keywords: ['vitamin', 'iron', 'ferritin', 'folate', 'omega', 'calcium', 'magnesium', 'zinc', 'selenium', 'nutrient', 'diet', 'alcohol', 'caffeine', 'coffee'], domain: 'nutrition' },
  { keywords: ['alzheimer', 'parkinson', 'dementia', 'cognitive', 'intelligence', 'neuroticism', 'depression', 'anxiety', 'memory', 'processing speed', 'reaction time'], domain: 'brain_cognitive' },
];

const PGS_TRAIT_RULES: Array<{ id: string; keywords: string[] }> = [
  { id: 'telomere_length', keywords: ['telomere length'] },
  { id: 'epigenetic_age_grimage', keywords: ['epigenetic age', 'biological age', 'grim age', 'grimage'] },
  { id: 'vo2max', keywords: ['vo2', 'cardiorespiratory fitness', 'fitness'] },
  { id: 'grip_strength', keywords: ['grip strength', 'hand grip'] },
  { id: 'bone_density', keywords: ['bone mineral density', 'bone density'] },
  { id: 'sleep_duration', keywords: ['sleep duration'] },
  { id: 'chronotype_morningness', keywords: ['chronotype', 'morningness', 'morning person'] },
  { id: 'hdl_cholesterol', keywords: ['hdl cholesterol', 'high density lipoprotein'] },
  { id: 'ldl_cholesterol', keywords: ['ldl cholesterol', 'low density lipoprotein'] },
  { id: 'triglycerides', keywords: ['triglyceride'] },
  { id: 'systolic_bp', keywords: ['systolic blood pressure', 'blood pressure'] },
  { id: 'crp_inflammation', keywords: ['c-reactive protein', 'crp'] },
  { id: 'il6_inflammation', keywords: ['interleukin-6', 'il-6'] },
  { id: 'igf1_levels', keywords: ['igf-1', 'insulin-like growth factor'] },
  { id: 'lean_body_mass', keywords: ['lean body mass', 'fat-free mass'] },
  { id: 'vitamin_d', keywords: ['vitamin d', '25-hydroxyvitamin d'] },
  { id: 'homocysteine', keywords: ['homocysteine'] },
  { id: 'reaction_time', keywords: ['reaction time'] },
  { id: 'cognitive_performance', keywords: ['cognitive performance', 'cognitive ability'] },
  { id: 'neuroticism', keywords: ['neuroticism'] },
  { id: 'alcohol_consumption', keywords: ['alcohol consumption', 'drinks per week'] },
  { id: 'caffeine_metabolism', keywords: ['caffeine', 'coffee consumption'] },
  { id: 'coronary_artery_disease', keywords: ['coronary artery disease'] },
  { id: 'type_2_diabetes', keywords: ['type 2 diabetes'] },
  { id: 'alzheimers_disease', keywords: ['alzheimer'] },
];

function ensureDirs(): void {
  fs.mkdirSync(referenceDir, { recursive: true });
  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(path.join(rawDir, '.gitignore'), '*\n!.gitignore\n');
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const request = https.get(url, response => {
      if ((response.statusCode ?? 0) >= 300 && (response.statusCode ?? 0) < 400 && response.headers.location) {
        file.close();
        fs.rmSync(destPath, { force: true });
        downloadFile(new URL(response.headers.location, url).toString(), destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.rmSync(destPath, { force: true });
        reject(new Error(`HTTP ${response.statusCode} downloading ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    });
    request.on('error', err => {
      file.close();
      fs.rmSync(destPath, { force: true });
      reject(err);
    });
  });
}

async function downloadIfNeeded(url: string, destPath: string): Promise<void> {
  if (skipDownload || (fs.existsSync(destPath) && !force)) return;
  console.log(`Downloading ${url}`);
  await downloadFile(url, destPath);
}

function sha256(filePath: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parsePValue(raw: string): number {
  const normalized = (raw ?? '').trim().replace(/\s/g, '').replace(/[×x]10/, 'e').replace(/−/g, '-');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 1;
}

function parseNumber(raw: string): number {
  const parsed = Number.parseFloat((raw ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSampleSize(raw: string): number {
  const matches = (raw ?? '').replace(/,/g, '').match(/\d+/g);
  return matches ? Math.max(...matches.map(Number)) : 0;
}

function parseEffectAllele(strongestSnp: string): string {
  return strongestSnp.match(/-([ACGT])$/i)?.[1]?.toUpperCase() ?? '';
}

function classifyDomain(trait: string): string | undefined {
  const t = trait.toLowerCase();
  return DOMAIN_RULES.find(rule => rule.keywords.some(keyword => t.includes(keyword)))?.domain;
}

function traitIdForPGS(row: PGSMetadataRow): string | undefined {
  const text = `${row.reportedTrait} ${row.mappedTraits}`.toLowerCase();
  return PGS_TRAIT_RULES.find(rule => rule.keywords.some(keyword => text.includes(keyword)))?.id;
}

async function buildGWAS(): Promise<{ records: number; rsids: number; source: SourceProvenance; file: string }> {
  const zipPath = path.join(rawDir, 'gwas-catalog-associations_ontology-annotated-full.zip');
  const tsvPath = path.join(rawDir, 'gwas-catalog-associations.tsv');
  await downloadIfNeeded(GWAS_URL, zipPath);

  if (!fs.existsSync(tsvPath) || force) {
    console.log('Extracting GWAS Catalog TSV');
    const fd = fs.openSync(tsvPath, 'w');
    try {
      const result = spawnSync('unzip', ['-p', zipPath, GWAS_TSV_IN_ZIP], { stdio: ['ignore', fd, 'inherit'] });
      if (result.status !== 0) throw new Error(`unzip failed with status ${result.status}`);
    } finally {
      fs.closeSync(fd);
    }
  }

  const source: SourceProvenance = {
    source_id: 'gwas_catalog',
    source_name: 'NHGRI-EBI GWAS Catalog',
    source_type: 'gwas_catalog',
    source_url: GWAS_URL,
    release: fs.statSync(zipPath).mtime.toISOString().slice(0, 10),
    retrieved_at: new Date().toISOString(),
    genome_build: 'mixed; rsID association layer',
    limitation: 'GWAS associations are population-level and not diagnostic; effect sizes depend on discovery cohort ancestry and phenotype definitions.',
  };

  const rl = readline.createInterface({ input: fs.createReadStream(tsvPath, 'utf8'), crlfDelay: Infinity });
  const associations: Record<string, GWASAssociation[]> = {};
  let headers: string[] = [];
  let records = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    if (headers.length === 0) {
      headers = line.split('\t');
      continue;
    }
    const cols = line.split('\t');
    const get = (name: string) => cols[headers.indexOf(name)] ?? '';
    const rsidRaw = get('SNPS').trim();
    const rsid = rsidRaw.split(/[,;x ]/).find(part => part.startsWith('rs')) ?? '';
    if (!rsid) continue;
    const p = parsePValue(get('P-VALUE'));
    if (p > GWAS_P_THRESHOLD) continue;
    const trait = get('MAPPED_TRAIT').trim() || get('DISEASE/TRAIT').trim();
    const domain = classifyDomain(trait);
    if (!domain) continue;
    const or = parseNumber(get('OR or BETA')) || null;
    const effectAllele = parseEffectAllele(get('STRONGEST SNP-RISK ALLELE'));
    const assoc: GWASAssociation = {
      trait,
      gene: (get('MAPPED_GENE').split(',')[0] || 'intergenic').trim(),
      or,
      p,
      n: parseSampleSize(get('INITIAL SAMPLE SIZE')),
      effectAllele,
      domain,
      direction: or == null ? 'unknown' : or > 1 ? 'risk' : or < 1 ? 'protective' : 'unknown',
      source_type: 'gwas_catalog_association',
      source_id: 'gwas_catalog',
      source_url: GWAS_URL,
      source_release: source.release ?? '',
      confidenceTier: 'gwas_association',
      provenance: [source],
    };
    associations[rsid] = associations[rsid] ?? [];
    if (!associations[rsid].some(existing => existing.trait === assoc.trait && existing.gene === assoc.gene)) {
      associations[rsid].push(assoc);
      records++;
    }
  }

  fs.writeFileSync(outputGwas, zlib.gzipSync(JSON.stringify(associations)));
  return { records, rsids: Object.keys(associations).length, source, file: outputGwas };
}

function extractMetadataCsv(tarPath: string): string {
  const csv = execFileSync('tar', ['-xOzf', tarPath, 'pgs_all_metadata_scores.csv'], { maxBuffer: 256 * 1024 * 1024 });
  return csv.toString('utf8');
}

function parsePGSMetadata(csvText: string): PGSMetadataRow[] {
  const lines = csvText.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const idx = (name: string) => headers.indexOf(name);
  return lines.slice(1).map(line => {
    const cols = parseCsvLine(line);
    return {
      id: cols[idx('Polygenic Score (PGS) ID')],
      name: cols[idx('PGS Name')],
      reportedTrait: cols[idx('Reported Trait')],
      mappedTraits: cols[idx('Mapped Trait(s) (EFO label)')],
      originalBuild: cols[idx('Original Genome Build')],
      variants: parseSampleSize(cols[idx('Number of Variants')]),
      pgpId: cols[idx('PGS Publication (PGP) ID')],
      pmid: cols[idx('Publication (PMID)')],
      doi: cols[idx('Publication (doi)')],
      ancestrySource: cols[idx('Ancestry Distribution (%) - Source of Variant Associations (GWAS)')],
      ancestryTraining: cols[idx('Ancestry Distribution (%) - Score Development/Training')],
      ancestryEvaluation: cols[idx('Ancestry Distribution (%) - PGS Evaluation')],
      ftpLink: cols[idx('FTP link')],
      releaseDate: cols[idx('Release Date')],
    };
  }).filter(row => row.id && row.ftpLink);
}

function selectPGSScores(rows: PGSMetadataRow[]): Array<PGSMetadataRow & { traitId: string }> {
  const byTrait = new Map<string, Array<PGSMetadataRow & { traitId: string }>>();
  for (const row of rows) {
    const traitId = traitIdForPGS(row);
    if (!traitId) continue;
    if (row.variants <= 0 || row.variants > maxVariantsPerScore) continue;
    const withTrait = { ...row, traitId };
    byTrait.set(traitId, [...(byTrait.get(traitId) ?? []), withTrait]);
  }
  const selected: Array<PGSMetadataRow & { traitId: string }> = [];
  for (const candidates of byTrait.values()) {
    candidates.sort((a, b) => {
      const aEval = a.ancestryEvaluation ? 1 : 0;
      const bEval = b.ancestryEvaluation ? 1 : 0;
      if (aEval !== bEval) return bEval - aEval;
      return b.variants - a.variants;
    });
    selected.push(candidates[0]);
  }
  return selected
    .sort((a, b) => a.traitId.localeCompare(b.traitId))
    .slice(0, maxScores);
}

function harmonizedUrl(row: PGSMetadataRow): string {
  const base = row.ftpLink.replace(/\/ScoringFiles\/[^/]+$/, '/ScoringFiles/Harmonized/');
  return `${base}${row.id}_hmPOS_GRCh37.txt.gz`;
}

async function downloadPGSScore(row: PGSMetadataRow): Promise<string> {
  const url = harmonizedUrl(row);
  const dest = path.join(rawDir, `${row.id}_hmPOS_GRCh37.txt.gz`);
  await downloadIfNeeded(url, dest);
  if (!skipDownload) {
    const md5Url = `${url}.md5`;
    const md5Path = `${dest}.md5`;
    try {
      await downloadIfNeeded(md5Url, md5Path);
      const expected = fs.readFileSync(md5Path, 'utf8').trim().split(/\s+/)[0];
      const actual = crypto.createHash('md5').update(fs.readFileSync(dest)).digest('hex');
      if (expected && expected !== actual) throw new Error(`MD5 mismatch for ${row.id}: expected ${expected}, got ${actual}`);
    } catch (err: any) {
      console.warn(`   MD5 check skipped for ${row.id}: ${err.message}`);
    }
  }
  return dest;
}

function parsePGSWeights(filePath: string, row: PGSMetadataRow & { traitId: string }, source: SourceProvenance): PGSWeight[] {
  const text = zlib.gunzipSync(fs.readFileSync(filePath)).toString('utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headerIndex = lines.findIndex(line => !line.startsWith('#'));
  if (headerIndex < 0) return [];
  const headers = lines[headerIndex].split('\t');
  const idx = (name: string) => headers.indexOf(name);
  const rsidIdx = idx('rsID');
  const hmRsidIdx = idx('hm_rsID');
  const alleleIdx = idx('effect_allele');
  const weightIdx = idx('effect_weight');
  const weights: PGSWeight[] = [];
  const citation = row.doi ? `${row.id}; doi:${row.doi}` : row.pmid ? `${row.id}; PMID:${row.pmid}` : row.id;

  for (const line of lines.slice(headerIndex + 1)) {
    const cols = line.split('\t');
    const rsid = (cols[rsidIdx] || cols[hmRsidIdx] || '').trim();
    const effectAllele = (cols[alleleIdx] || '').trim().toUpperCase();
    const weight = Number.parseFloat(cols[weightIdx] || '');
    if (!rsid.startsWith('rs') || !effectAllele || !Number.isFinite(weight)) continue;
    weights.push({
      rsid,
      effect_allele: effectAllele,
      effect_weight: weight,
      disease: row.traitId,
      citation,
      pgs_id: row.id,
      pgs_name: row.name,
      reported_trait: row.reportedTrait,
      mapped_trait: row.mappedTraits,
      genome_build: 'GRCh37 harmonized',
      ancestry_distribution: [row.ancestrySource, row.ancestryTraining, row.ancestryEvaluation].filter(Boolean).join(' | ') || 'Not reported',
      source_type: 'pgs_catalog_score',
      source_url: harmonizedUrl(row),
      source_release: row.releaseDate,
      confidenceTier: 'prs',
      provenance: [source],
    });
  }
  return weights;
}

async function buildPGS(): Promise<{ records: number; scores: number; skippedCoordinateOnly: number; source: SourceProvenance; file: string }> {
  const metadataPath = path.join(rawDir, 'pgs_all_metadata.tar.gz');
  await downloadIfNeeded(PGS_METADATA_URL, metadataPath);
  const metadata = parsePGSMetadata(extractMetadataCsv(metadataPath));
  const selected = selectPGSScores(metadata);
  const source: SourceProvenance = {
    source_id: 'pgs_catalog',
    source_name: 'PGS Catalog',
    source_type: 'pgs_catalog',
    source_url: PGS_METADATA_URL,
    release: fs.statSync(metadataPath).mtime.toISOString().slice(0, 10),
    retrieved_at: new Date().toISOString(),
    genome_build: 'GRCh37 harmonized scoring files where available',
    limitation: 'PGS scores depend on ancestry, genome build harmonization, imputation/coverage, and original model validation.',
  };
  const weights: PGSWeight[] = [];
  let scoresWithRsids = 0;
  let skippedCoordinateOnly = 0;
  for (const row of selected) {
    try {
      const filePath = await downloadPGSScore(row);
      const parsed = parsePGSWeights(filePath, row, source);
      weights.push(...parsed);
      if (parsed.length > 0) scoresWithRsids++;
      else skippedCoordinateOnly++;
      console.log(`   PGS ${row.id} ${row.traitId}: ${parsed.length.toLocaleString()} variants`);
    } catch (err: any) {
      console.warn(`   PGS ${row.id} skipped: ${err.message}`);
    }
  }

  const registry = {
    description: 'Compact PGS Catalog wellness/longevity weights generated by reference:wellness.',
    updated: new Date().toISOString().slice(0, 10),
    diseases: [...new Set(weights.map(weight => weight.disease))],
    variants: weights,
  };
  fs.writeFileSync(outputPgs, zlib.gzipSync(JSON.stringify(registry)));
  return { records: weights.length, scores: scoresWithRsids, skippedCoordinateOnly, source, file: outputPgs };
}

function bytes(filePath: string): number {
  return fs.statSync(filePath).size;
}

async function main(): Promise<void> {
  ensureDirs();
  const gwas = await buildGWAS();
  const pgs = await buildPGS();
  const files = [outputGwas, outputPgs].map(filePath => ({
    path: path.relative(referenceDir, filePath),
    bytes: bytes(filePath),
    records: filePath === outputGwas ? gwas.records : pgs.records,
    sha256: sha256(filePath),
  }));
  const manifest = {
    version: WELLNESS_REFERENCE_VERSION,
    generated_at: new Date().toISOString(),
    sources: [gwas.source, pgs.source],
    files,
    counts: {
      gwas_associations: gwas.records,
      gwas_rsids: gwas.rsids,
      pgs_scores_selected: pgs.scores,
      pgs_scores_skipped_coordinate_only: pgs.skippedCoordinateOnly,
      pgs_variants: pgs.records,
    },
    disclosures: getDefaultWellnessDisclosures(),
    repo_policy: {
      commit_compact_outputs_if_under_1gb: true,
      keep_raw_downloads_local: true,
      raw_cache: path.relative(referenceDir, rawDir),
    },
  };
  fs.writeFileSync(outputManifest, `${JSON.stringify(manifest, null, 2)}\n`);
  if (!keepRaw) {
    console.log(`Raw cache retained at ${rawDir} and ignored by git.`);
  }
  console.log(JSON.stringify({
    status: 'pass',
    reference_dir: referenceDir,
    gwas_associations: gwas.records,
    gwas_rsids: gwas.rsids,
    pgs_scores_selected: pgs.scores,
    pgs_scores_skipped_coordinate_only: pgs.skippedCoordinateOnly,
    pgs_variants: pgs.records,
    compact_bytes: files.reduce((sum, file) => sum + file.bytes, 0) + bytes(outputManifest),
    files,
  }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
