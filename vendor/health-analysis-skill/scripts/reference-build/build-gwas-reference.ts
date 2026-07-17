#!/usr/bin/env npx tsx
/**
 * GWAS Catalog Reference Builder
 *
 * Downloads the NHGRI-EBI GWAS Catalog full associations file, filters to
 * genome-wide significant hits (p < 5e-8), and produces two reference files:
 *
 *   reference/gwas/gwas_associations.json.gz
 *     rsID → [{trait, gene, OR, p, N, effectAllele, domain, direction}]
 *     Used at runtime by gwas_engine.ts for interpretation.
 *
 * Run once to populate the reference directory:
 *   npx tsx scripts/reference-build/build-gwas-reference.ts
 *
 * The output file is committed to the repo (~3-5 MB compressed).
 * Users never need to re-run this unless the GWAS Catalog is updated.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as https from 'https';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GWAS_CATALOG_URL = 'https://ftp.ebi.ac.uk/pub/databases/gwas/releases/latest/gwas-catalog-associations_ontology-annotated-full.zip';
const GWAS_CATALOG_TSV_NAME = 'gwas-catalog-download-associations-alt-full.tsv';
const PVALUE_THRESHOLD = 5e-8;

// ── Domain classifier ────────────────────────────────────────────────────────

const DOMAIN_RULES: Array<{ keywords: string[]; domain: string }> = [
  { keywords: ['coronary', 'cardiac', 'heart', 'atrial', 'myocardial', 'stroke', 'blood pressure', 'hypertension', 'ldl', 'hdl', 'cholesterol', 'triglyceride', 'lipid', 'arterial', 'aortic', 'carotid', 'venous', 'thrombosis', 'fibrillation'], domain: 'cardiovascular' },
  { keywords: ['body mass', 'bmi', 'obesity', 'waist', 'adiposity', 'fat mass', 'type 2 diabetes', 'insulin', 'glucose', 'glycated', 'hba1c', 'metabolic', 'fatty liver', 'non-alcoholic', 'lean mass'], domain: 'metabolic' },
  { keywords: ['longevity', 'lifespan', 'aging', 'ageing', 'mortality', 'survival', 'telomere', 'centenarian', 'life expectancy'], domain: 'longevity' },
  { keywords: ['alzheimer', 'parkinson', 'dementia', 'cognitive', 'intelligence', 'educational attainment', 'neuroticism', 'schizophrenia', 'bipolar', 'depression', 'anxiety', 'brain', 'memory', 'processing speed', 'reaction time', 'white matter'], domain: 'brain_cognitive' },
  { keywords: ['muscle', 'exercise', 'athletic', 'physical activity', 'grip strength', 'lean body mass', 'vo2', 'endurance', 'sprint', 'power', 'fitness', 'bone mineral density', 'bone density'], domain: 'athletic_performance' },
  { keywords: ['sleep', 'chronotype', 'insomnia', 'circadian', 'morning person', 'evening person', 'sleep duration', 'daytime sleepiness', 'narcolepsy'], domain: 'sleep' },
  { keywords: ['rheumatoid', 'lupus', 'multiple sclerosis', 'crohn', 'inflammatory bowel', 'celiac', 'autoimmune', 'immune', 'asthma', 'allergy', 'c-reactive protein', 'interleukin', 'interferon', 'white blood cell', 'lymphocyte', 'neutrophil'], domain: 'immune' },
  { keywords: ['vitamin', 'iron', 'ferritin', 'folate', 'omega', 'calcium', 'magnesium', 'zinc', 'selenium', 'nutrient', 'diet', 'alcohol', 'caffeine', 'coffee', 'tea'], domain: 'nutrition' },
  { keywords: ['cancer', 'carcinoma', 'lymphoma', 'leukemia', 'melanoma', 'tumor', 'tumour', 'prostate', 'breast cancer', 'colon cancer', 'lung cancer'], domain: 'cancer_risk' },
];

function classifyDomain(trait: string): string {
  const t = trait.toLowerCase();
  for (const rule of DOMAIN_RULES) {
    if (rule.keywords.some(kw => t.includes(kw))) return rule.domain;
  }
  return 'other';
}

// ── P-value parser ───────────────────────────────────────────────────────────

function parsePValue(raw: string): number {
  const cleaned = raw.trim().replace(/\s/g, '');
  if (!cleaned || cleaned === 'NR' || cleaned === 'NA') return 1;
  // Handle "2E-8", "2e-8", "2x10-8", "2×10-8"
  const normalized = cleaned.replace(/[×x]10/, 'e').replace(/−/g, '-');
  const n = parseFloat(normalized);
  return isNaN(n) ? 1 : n;
}

function parseOR(raw: string): number | null {
  const cleaned = raw.trim();
  if (!cleaned || cleaned === 'NR' || cleaned === 'NA') return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseSampleSize(raw: string): number {
  if (!raw) return 0;
  // Extract the largest number from strings like "Up to 119,000 cases, 100,000 controls"
  const numbers = raw.replace(/,/g, '').match(/\d+/g);
  if (!numbers) return 0;
  return Math.max(...numbers.map(Number));
}

function parseEffectAllele(strongestSnp: string): string {
  // Format: "rs123456-A" or "rs123456-AG"
  const match = strongestSnp.match(/-([ACGT]+)$/);
  return match ? match[1] : '';
}

// ── Download helper ──────────────────────────────────────────────────────────

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const handleResponse = (res: any) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} downloading GWAS Catalog`));
        return;
      }
      let downloaded = 0;
      res.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (downloaded % (10 * 1024 * 1024) < chunk.length) {
          process.stdout.write(`\r   Downloaded: ${(downloaded / 1024 / 1024).toFixed(0)} MB`);
        }
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log(''); resolve(); });
    };
    https.get(url, handleResponse).on('error', reject);
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

export interface GWASAssociation {
  trait: string;
  gene: string;
  or: number | null;
  p: number;
  n: number;
  effectAllele: string;
  domain: string;
  direction: 'risk' | 'protective' | 'unknown';
}

async function main() {
  const refDir = path.resolve(__dirname, '../../../../reference/gwas');
  fs.mkdirSync(refDir, { recursive: true });

  const zipPath = path.join(refDir, 'gwas-catalog-associations.zip');
  const tsvPath = path.join(refDir, 'gwas-catalog-associations.tsv');
  const outPath = path.join(refDir, 'gwas_associations.json.gz');

  // ── Step 1: Download and extract (skip if TSV cached) ────────────────────
  if (fs.existsSync(tsvPath)) {
    const sizeMB = fs.statSync(tsvPath).size / 1024 / 1024;
    console.log(`✅ Using cached GWAS Catalog TSV (${sizeMB.toFixed(0)} MB): ${tsvPath}`);
  } else {
    if (!fs.existsSync(zipPath)) {
      console.log('⬇️  Downloading GWAS Catalog full associations ZIP (~65 MB)...');
      console.log(`   URL: ${GWAS_CATALOG_URL}`);
      await downloadFile(GWAS_CATALOG_URL, zipPath);
      const sizeMB = fs.statSync(zipPath).size / 1024 / 1024;
      console.log(`✅ Downloaded: ${sizeMB.toFixed(0)} MB`);
    } else {
      console.log(`✅ Using cached ZIP: ${zipPath}`);
    }
    console.log('📦 Extracting TSV from ZIP...');
    execSync(`unzip -p "${zipPath}" "${GWAS_CATALOG_TSV_NAME}" > "${tsvPath}"`, { shell: '/bin/bash' });
    const sizeMB = fs.statSync(tsvPath).size / 1024 / 1024;
    console.log(`✅ Extracted: ${sizeMB.toFixed(0)} MB TSV`);
  }

  // ── Step 2: Parse and filter ─────────────────────────────────────────────
  console.log('\n🔬 Parsing and filtering associations (p < 5×10⁻⁸)...');

  const associations = new Map<string, GWASAssociation[]>();
  let totalLines = 0;
  let passedFilter = 0;
  let skippedNoRsid = 0;
  let skippedPvalue = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(tsvPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let colSnps = -1, colStrongest = -1, colGene = -1, colPvalue = -1;
  let colOr = -1, colTrait = -1, colSampleSize = -1;

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (headers.length === 0) {
      headers = line.split('\t');
      // Locate columns by header name (defensive against column order changes)
      colSnps        = headers.findIndex(h => h.trim() === 'SNPS');
      colStrongest   = headers.findIndex(h => h.trim() === 'STRONGEST SNP-RISK ALLELE');
      colGene        = headers.findIndex(h => h.trim() === 'MAPPED_GENE');
      colPvalue      = headers.findIndex(h => h.trim() === 'P-VALUE');
      colOr          = headers.findIndex(h => h.trim() === 'OR or BETA');
      colTrait       = headers.findIndex(h => h.trim() === 'MAPPED_TRAIT');
      colSampleSize  = headers.findIndex(h => h.trim() === 'INITIAL SAMPLE SIZE');
      console.log(`   Header parsed: ${headers.length} columns`);
      continue;
    }

    totalLines++;
    if (totalLines % 50000 === 0) {
      process.stdout.write(`\r   Processed: ${totalLines.toLocaleString()} lines, ${passedFilter.toLocaleString()} passed`);
    }

    const cols = line.split('\t');

    // Extract rsID
    const rsidRaw = cols[colSnps]?.trim() ?? '';
    if (!rsidRaw.startsWith('rs')) { skippedNoRsid++; continue; }
    // Some entries have multiple SNPs — take the first rsID
    const rsid = rsidRaw.split(/[,;x ]/)[0].trim();
    if (!rsid.startsWith('rs')) { skippedNoRsid++; continue; }

    // Filter by p-value
    const pval = parsePValue(cols[colPvalue] ?? '');
    if (pval > PVALUE_THRESHOLD) { skippedPvalue++; continue; }

    const orRaw = parseOR(cols[colOr] ?? '');
    const trait = (cols[colTrait] ?? cols[7] ?? '').trim();
    const gene = (cols[colGene] ?? '').trim().split(',')[0].trim(); // first mapped gene
    const n = parseSampleSize(cols[colSampleSize] ?? '');
    const effectAllele = parseEffectAllele(cols[colStrongest] ?? '');
    const domain = classifyDomain(trait);

    let direction: 'risk' | 'protective' | 'unknown' = 'unknown';
    if (orRaw !== null) {
      direction = orRaw > 1 ? 'risk' : orRaw < 1 ? 'protective' : 'unknown';
    }

    const assoc: GWASAssociation = {
      trait,
      gene: gene || 'intergenic',
      or: orRaw,
      p: pval,
      n,
      effectAllele,
      domain,
      direction,
    };

    const existing = associations.get(rsid);
    if (existing) {
      // Deduplicate: skip if exact same trait already recorded
      if (!existing.some(a => a.trait === trait)) {
        existing.push(assoc);
      }
    } else {
      associations.set(rsid, [assoc]);
    }

    passedFilter++;
  }

  console.log(`\n\n   Total lines: ${totalLines.toLocaleString()}`);
  console.log(`   Skipped (no rsID): ${skippedNoRsid.toLocaleString()}`);
  console.log(`   Skipped (p ≥ 5e-8): ${skippedPvalue.toLocaleString()}`);
  console.log(`   Passed: ${passedFilter.toLocaleString()}`);
  console.log(`   Unique rsIDs: ${associations.size.toLocaleString()}`);

  // ── Step 3: Domain summary ────────────────────────────────────────────────
  const domainCounts: Record<string, number> = {};
  for (const assocs of associations.values()) {
    for (const a of assocs) {
      domainCounts[a.domain] = (domainCounts[a.domain] ?? 0) + 1;
    }
  }
  console.log('\n   Associations by domain:');
  for (const [domain, count] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${domain.padEnd(20)} ${count.toLocaleString()}`);
  }

  // ── Step 4: Write compressed JSON ────────────────────────────────────────
  console.log('\n💾 Writing compressed associations JSON...');
  const obj: Record<string, GWASAssociation[]> = {};
  for (const [rsid, assocs] of associations) {
    // Keep at most 10 associations per rsID (highest-confidence first by lowest p)
    obj[rsid] = assocs.sort((a, b) => a.p - b.p).slice(0, 10);
  }

  const json = JSON.stringify(obj);
  const compressed = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 });
  fs.writeFileSync(outPath, compressed);

  const outMB = compressed.length / 1024 / 1024;
  console.log(`✅ Written: ${outPath} (${outMB.toFixed(1)} MB compressed)`);
  console.log(`   Uncompressed: ${(json.length / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Unique rsIDs: ${associations.size.toLocaleString()}`);

  console.log('\n🎉 GWAS reference build complete.');
  console.log('   Commit reference/gwas/gwas_associations.json.gz to the repo.');
  console.log('   Delete reference/gwas/gwas-catalog-associations.tsv (it is not committed).');
}

main().catch(err => {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});
