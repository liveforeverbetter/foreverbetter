#!/usr/bin/env npx tsx
/**
 * Local VCF coverage audit.
 *
 * Measures the variant surface available from bundled local VCF fixtures. This
 * is separate from external HG002 validation: it proves the pipeline has
 * WGS-scale local records to exercise SNP, indel, CNV, SV, repeat, and PRS
 * coverage without fabricating query VCFs.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as zlib from 'zlib';
import { fileURLToPath } from 'url';

type LocalVariantClass =
  | 'snv'
  | 'indel'
  | 'copy_number_variants'
  | 'large_indels'
  | 'rearrangements'
  | 'tandem_repeats';

interface VcfFixtureSummary {
  path: string;
  present: boolean;
  records: number;
  annotated_records: number;
  unique_rsids: number;
  classes: Partial<Record<LocalVariantClass, number>>;
}

export interface LocalVcfCoverageReport {
  generated_at: string;
  fixture_root: string;
  fixtures: VcfFixtureSummary[];
  summary: {
    configured_vcfs: number;
    present_vcfs: number;
    total_records: number;
    annotated_records: number;
    unique_rsids: number;
    classes_present: number;
    records_by_class: Partial<Record<LocalVariantClass, number>>;
    full_scale_vcfs_present: number;
    largest_vcf_records: number;
    curated_interpretation_rsids: number;
    curated_rsids_observed: number;
    prs_rsids: number;
    prs_rsids_observed: number;
    coverage_score: number;
  };
  thresholds: {
    total_records_min: number;
    annotated_rsids_min: number;
    classes_present_min: number;
    curated_overlap_min: number;
    prs_overlap_min: number;
  };
  passed: boolean;
}

const DEFAULT_FIXTURES = [
  'snps.vcf.annotated.vcf.gz',
  'indels.vcf.gz',
  'cnv.vcf.gz',
  'sv.vcf.gz',
  'sample-wgs-variant-classes.vcf',
  'sample-wgs-cnv-dosage.vcf',
  'sample-wgs-repeat-boundaries.vcf',
  'sample-wgs-sv-large-indel.vcf',
];

const DEFAULT_THRESHOLDS = {
  total_records_min: 1_000_000,
  annotated_rsids_min: 500_000,
  classes_present_min: 5,
  curated_overlap_min: 75,
  prs_overlap_min: 40,
};

function argValue(flag: string): string | undefined {
  const direct = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (direct) return direct.split('=').slice(1).join('=');
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function streamFor(filePath: string): NodeJS.ReadableStream {
  const stream = fs.createReadStream(filePath);
  return filePath.endsWith('.gz') ? stream.pipe(zlib.createGunzip()) : stream;
}

function classifyVariant(ref: string, alt: string, info: string): LocalVariantClass {
  if (/tandem|repeat|RU=|REPID=/i.test(info)) return 'tandem_repeats';
  if (/SVTYPE=CNV|<CNV>|CN=/i.test(info)) return 'copy_number_variants';
  if (/SVTYPE=BND|SVTYPE=INV|SVTYPE=TRA|CHR2=/i.test(info)) return 'rearrangements';
  if (/SVTYPE=DEL|SVTYPE=DUP|SVTYPE=INS|<DEL>|<DUP>|<INS>/i.test(info)) return 'large_indels';
  if (ref.length === 1 && alt.split(',').every(item => item.length === 1)) return 'snv';
  return 'indel';
}

function addClassCount(target: Partial<Record<LocalVariantClass, number>>, variantClass: LocalVariantClass, count = 1): void {
  target[variantClass] = (target[variantClass] ?? 0) + count;
}

function loadCuratedRsids(packageDir: string): Set<string> {
  const dir = path.join(packageDir, 'shared/interpretations');
  const rsids = new Set<string>();
  for (const file of fs.readdirSync(dir).filter(file => file.endsWith('.json'))) {
    const data = readJson<{ markers?: Record<string, unknown> }>(path.join(dir, file));
    for (const rsid of Object.keys(data.markers ?? {})) {
      if (rsid.startsWith('rs')) rsids.add(rsid);
    }
  }
  return rsids;
}

function loadPrsRsids(packageDir: string): Set<string> {
  const weightsPath = path.join(packageDir, 'shared/prs_weights.json');
  if (!fs.existsSync(weightsPath)) return new Set();
  const data = readJson<{ variants?: Array<{ rsid?: string }> }>(weightsPath);
  return new Set((data.variants ?? []).map(item => item.rsid).filter((rsid): rsid is string => Boolean(rsid?.startsWith('rs'))));
}

function percentScore(actual: number, target: number): number {
  if (target <= 0) return actual >= target ? 100 : 0;
  return Math.round(Math.max(0, Math.min(1, actual / target)) * 100);
}

async function summarizeFixture(
  filePath: string,
  allRsids: Set<string>,
  curatedRsids: Set<string>,
  observedCurated: Set<string>,
  prsRsids: Set<string>,
  observedPrs: Set<string>,
): Promise<VcfFixtureSummary> {
  if (!fs.existsSync(filePath)) {
    return {
      path: filePath,
      present: false,
      records: 0,
      annotated_records: 0,
      unique_rsids: 0,
      classes: {},
    };
  }

  const fixtureRsids = new Set<string>();
  const classes: Partial<Record<LocalVariantClass, number>> = {};
  let records = 0;
  let annotatedRecords = 0;
  const reader = readline.createInterface({ input: streamFor(filePath), crlfDelay: Infinity });

  for await (const line of reader) {
    if (!line || line.startsWith('#')) continue;
    records += 1;
    const [chrom, pos, id, ref = '', alt = '', qual, filter, info = ''] = line.split('\t');
    void chrom;
    void pos;
    void qual;
    void filter;
    addClassCount(classes, classifyVariant(ref, alt, info));
    if (id?.startsWith('rs')) {
      annotatedRecords += 1;
      fixtureRsids.add(id);
      allRsids.add(id);
      if (curatedRsids.has(id)) observedCurated.add(id);
      if (prsRsids.has(id)) observedPrs.add(id);
    }
  }

  return {
    path: filePath,
    present: true,
    records,
    annotated_records: annotatedRecords,
    unique_rsids: fixtureRsids.size,
    classes,
  };
}

export async function buildLocalVcfCoverageReport(options: {
  repoRoot: string;
  packageDir: string;
  fixtureRoot?: string;
  fixtures?: string[];
  thresholds?: LocalVcfCoverageReport['thresholds'];
}): Promise<LocalVcfCoverageReport> {
  const fixtureRoot = options.fixtureRoot ?? path.join(options.repoRoot, 'example-data');
  const fixtures = options.fixtures ?? DEFAULT_FIXTURES;
  const thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
  const curatedRsids = loadCuratedRsids(options.packageDir);
  const prsRsids = loadPrsRsids(options.packageDir);
  const allRsids = new Set<string>();
  const observedCurated = new Set<string>();
  const observedPrs = new Set<string>();
  const summaries: VcfFixtureSummary[] = [];

  for (const fixture of fixtures) {
    summaries.push(await summarizeFixture(path.join(fixtureRoot, fixture), allRsids, curatedRsids, observedCurated, prsRsids, observedPrs));
  }

  const recordsByClass: Partial<Record<LocalVariantClass, number>> = {};
  for (const summary of summaries) {
    for (const [variantClass, count] of Object.entries(summary.classes) as Array<[LocalVariantClass, number]>) {
      addClassCount(recordsByClass, variantClass, count);
    }
  }

  const totalRecords = summaries.reduce((sum, summary) => sum + summary.records, 0);
  const annotatedRecords = summaries.reduce((sum, summary) => sum + summary.annotated_records, 0);
  const classesPresent = Object.values(recordsByClass).filter(count => Number(count) > 0).length;
  const scores = [
    percentScore(totalRecords, thresholds.total_records_min),
    percentScore(allRsids.size, thresholds.annotated_rsids_min),
    percentScore(classesPresent, thresholds.classes_present_min),
    percentScore(observedCurated.size, thresholds.curated_overlap_min),
    percentScore(observedPrs.size, thresholds.prs_overlap_min),
  ];
  const coverageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  return {
    generated_at: new Date().toISOString(),
    fixture_root: fixtureRoot,
    fixtures: summaries,
    summary: {
      configured_vcfs: fixtures.length,
      present_vcfs: summaries.filter(summary => summary.present).length,
      total_records: totalRecords,
      annotated_records: annotatedRecords,
      unique_rsids: allRsids.size,
      classes_present: classesPresent,
      records_by_class: recordsByClass,
      full_scale_vcfs_present: summaries.filter(summary => summary.records >= 500_000).length,
      largest_vcf_records: Math.max(0, ...summaries.map(summary => summary.records)),
      curated_interpretation_rsids: curatedRsids.size,
      curated_rsids_observed: observedCurated.size,
      prs_rsids: prsRsids.size,
      prs_rsids_observed: observedPrs.size,
      coverage_score: coverageScore,
    },
    thresholds,
    passed: coverageScore >= 100,
  };
}

async function main(): Promise<void> {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const repoRoot = path.resolve(packageDir, '../..');
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/local-vcf-coverage.json'));
  const report = await buildLocalVcfCoverageReport({ repoRoot, packageDir });
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: report.passed ? 'pass' : 'needs_iteration',
    output: outPath,
    summary: report.summary,
  }, null, 2));
  if (process.argv.includes('--strict') && !report.passed) process.exit(1);
}

if (process.argv[1]?.endsWith('local_vcf_coverage.ts')) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
