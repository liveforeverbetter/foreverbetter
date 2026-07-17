#!/usr/bin/env npx tsx
/**
 * Whole-genome variant-class normalization.
 *
 * This module does not call variants from reads. It normalizes caller outputs
 * from Manta/GATK-SV/gCNV/ExpansionHunter/VEP-style VCFs into a shared schema
 * so the rest of the pipeline can interpret CNVs, large indels, rearrangements,
 * tandem repeats, and rare small variants consistently.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export type WgsVariantClass =
  | 'rare_small_variants'
  | 'copy_number_variants'
  | 'large_indels'
  | 'tandem_repeats'
  | 'rearrangements';

export type WgsReportability = 'wellness_context' | 'clinician_review' | 'research_only';

export interface NormalizedWgsCall {
  id: string;
  class: WgsVariantClass;
  chrom: string;
  start: number;
  end?: number;
  type: string;
  genes: string[];
  length?: number;
  genotype?: string;
  quality?: number;
  source: string;
  evidence: string[];
  interpretation: string;
  reportability: WgsReportability;
}

export interface WgsVariantClassSummary {
  generated_at: string;
  input_path: string;
  source: string;
  classes_supported: WgsVariantClass[];
  class_counts: Record<WgsVariantClass, number>;
  reportable_count: number;
  calls: NormalizedWgsCall[];
  limitations: string[];
}

interface DosageRegion {
  id: string;
  gene: string;
  chrom: string;
  start: number;
  end: number;
  sensitive_to: string[];
  evidence: string;
  reportability: WgsReportability;
}

interface RepeatLocus {
  id: string;
  gene: string;
  chrom: string;
  start: number;
  end: number;
  repeat_unit: string;
  normal_max: number;
  intermediate_min: number;
  pathogenic_min: number;
  condition: string;
  reportability: WgsReportability;
}

interface StructuralGene {
  gene: string;
  chrom: string;
  start: number;
  end: number;
  reason: string;
}

interface InterpretationCatalog {
  dosage_sensitive_regions: DosageRegion[];
  repeat_loci: RepeatLocus[];
  structural_genes: StructuralGene[];
}

type InfoMap = Record<string, string | true>;

const VARIANT_CLASSES: WgsVariantClass[] = [
  'rare_small_variants',
  'copy_number_variants',
  'large_indels',
  'tandem_repeats',
  'rearrangements',
];

function argValue(flag: string): string | undefined {
  const direct = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (direct) return direct.split('=').slice(1).join('=');
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalizeChrom(value: string): string {
  return value.replace(/^chr/i, '');
}

function parseInfo(info: string): InfoMap {
  const map: InfoMap = {};
  for (const part of info.split(';').filter(Boolean)) {
    const [key, rawValue] = part.split('=');
    map[key] = rawValue == null ? true : rawValue;
  }
  return map;
}

function stringInfo(info: InfoMap, key: string): string | undefined {
  const value = info[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function numberInfo(info: InfoMap, key: string): number | undefined {
  const raw = stringInfo(info, key);
  if (!raw) return undefined;
  const first = raw.split(',')[0];
  const parsed = Number(first);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function genesFrom(info: InfoMap): string[] {
  const raw = stringInfo(info, 'GENE') ?? stringInfo(info, 'SYMBOL') ?? stringInfo(info, 'GENES');
  if (!raw) return [];
  return Array.from(new Set(raw.split(/[,&|]/).map(item => item.trim()).filter(Boolean)));
}

function overlaps(chrom: string, start: number, end: number, region: { chrom: string; start: number; end: number }): boolean {
  return normalizeChrom(chrom) === normalizeChrom(region.chrom) && start <= region.end && end >= region.start;
}

function classifyCall(ref: string, alt: string, info: InfoMap, start: number, end: number): WgsVariantClass | undefined {
  const svType = stringInfo(info, 'SVTYPE')?.toUpperCase();
  const svLen = Math.abs(numberInfo(info, 'SVLEN') ?? (end - start + 1));
  if (svType === 'STR' || stringInfo(info, 'REPID') || stringInfo(info, 'RU') || stringInfo(info, 'REPCN')) return 'tandem_repeats';
  if (svType === 'CNV' || svType === 'DEL' || svType === 'DUP') return 'copy_number_variants';
  if (svType === 'INV' || svType === 'BND' || svType === 'TRA' || alt.includes('[') || alt.includes(']')) return 'rearrangements';
  if (svType === 'INS' || svType === 'INDEL' || svLen >= 50 || Math.abs(ref.length - alt.length) >= 50) return 'large_indels';
  const impact = stringInfo(info, 'IMPACT')?.toUpperCase();
  const af = numberInfo(info, 'AF') ?? numberInfo(info, 'gnomAD_AF');
  const clinSig = stringInfo(info, 'CLNSIG')?.toLowerCase() ?? '';
  if ((impact === 'HIGH' || impact === 'MODERATE' || clinSig.includes('pathogenic')) && (af == null || af < 0.01)) {
    return 'rare_small_variants';
  }
  return undefined;
}

function callType(alt: string, info: InfoMap): string {
  const svType = stringInfo(info, 'SVTYPE');
  if (svType) return svType.toUpperCase();
  if (alt.length > 30) return 'INS';
  return alt.includes('<') ? alt.replace(/[<>]/g, '') : 'SNV';
}

function annotateCall(call: Omit<NormalizedWgsCall, 'evidence' | 'interpretation' | 'reportability'>, info: InfoMap, catalog: InterpretationCatalog): Pick<NormalizedWgsCall, 'evidence' | 'interpretation' | 'reportability'> {
  const evidence: string[] = [];
  let reportability: WgsReportability = call.class === 'rare_small_variants' ? 'clinician_review' : 'research_only';

  if (call.class === 'copy_number_variants') {
    const copySignal = call.type === 'DUP' ? 'copy_number_gain' : 'copy_number_loss';
    for (const region of catalog.dosage_sensitive_regions) {
      if (!call.end || !overlaps(call.chrom, call.start, call.end, region)) continue;
      evidence.push(`${region.id}: ${region.evidence}`);
      if (region.sensitive_to.includes(copySignal)) reportability = region.reportability;
    }
  }

  if (call.class === 'tandem_repeats') {
    const repeatId = stringInfo(info, 'REPID');
    const repeatCount = numberInfo(info, 'REPCN');
    const locus = catalog.repeat_loci.find(item => item.id === repeatId || call.genes.includes(item.gene));
    if (locus) {
      evidence.push(`${locus.id}: ${locus.condition}; normal <=${locus.normal_max}, pathogenic >=${locus.pathogenic_min} ${locus.repeat_unit} repeats.`);
      if (repeatCount != null && repeatCount >= locus.pathogenic_min) reportability = locus.reportability;
      else if (repeatCount != null && repeatCount >= locus.intermediate_min) reportability = 'clinician_review';
    }
  }

  if (call.class === 'rearrangements' || call.class === 'large_indels') {
    for (const region of catalog.structural_genes) {
      if (!call.end || !overlaps(call.chrom, call.start, call.end, region)) continue;
      evidence.push(`${region.gene}: ${region.reason}`);
      reportability = 'clinician_review';
    }
  }

  const clinSig = stringInfo(info, 'CLNSIG');
  const impact = stringInfo(info, 'IMPACT');
  if (clinSig) evidence.push(`ClinVar-style significance: ${clinSig}.`);
  if (impact) evidence.push(`Predicted consequence impact: ${impact}.`);
  if (call.class === 'rare_small_variants' && (clinSig?.toLowerCase().includes('pathogenic') || impact === 'HIGH')) reportability = 'clinician_review';

  const interpretation = evidence.length > 0
    ? `${call.type} ${call.class.replace(/_/g, ' ')} call intersects ${call.genes.join(', ') || 'a reportable locus'} and needs ${reportability === 'clinician_review' ? 'clinician review' : 'research-only review'}.`
    : `${call.type} ${call.class.replace(/_/g, ' ')} call normalized; no local reportable catalog match found.`;

  return { evidence, interpretation, reportability };
}

export function readWgsInterpretationCatalog(catalogPath: string): InterpretationCatalog {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as InterpretationCatalog;
}

export function parseWgsVariantClassVcf(vcfText: string, catalog: InterpretationCatalog, source = 'caller-vcf'): NormalizedWgsCall[] {
  const calls: NormalizedWgsCall[] = [];
  for (const line of vcfText.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    const columns = line.split('\t');
    if (columns.length < 8) continue;
    const [chromRaw, posRaw, rawId, ref, alt, qualRaw, , infoRaw, , sample] = columns;
    const start = Number(posRaw);
    if (!Number.isFinite(start)) continue;
    const info = parseInfo(infoRaw);
    const end = numberInfo(info, 'END') ?? start + Math.abs(numberInfo(info, 'SVLEN') ?? 0);
    const variantClass = classifyCall(ref, alt, info, start, end);
    if (!variantClass) continue;
    const type = callType(alt, info);
    const genes = genesFrom(info);
    const normalizedBase = {
      id: rawId && rawId !== '.' ? rawId : `${normalizeChrom(chromRaw)}:${start}:${ref}:${alt}`,
      class: variantClass,
      chrom: normalizeChrom(chromRaw),
      start,
      end,
      type,
      genes,
      length: Math.abs(numberInfo(info, 'SVLEN') ?? (end - start + 1)),
      genotype: sample,
      quality: Number.isFinite(Number(qualRaw)) ? Number(qualRaw) : undefined,
      source,
    };
    const annotation = annotateCall(normalizedBase, info, catalog);
    calls.push({ ...normalizedBase, ...annotation });
  }
  return calls;
}

export function summarizeWgsVariantClasses(inputPath: string, catalogPath: string): WgsVariantClassSummary {
  const catalog = readWgsInterpretationCatalog(catalogPath);
  const calls = parseWgsVariantClassVcf(fs.readFileSync(inputPath, 'utf8'), catalog, path.basename(inputPath));
  const classCounts = Object.fromEntries(VARIANT_CLASSES.map(item => [item, 0])) as Record<WgsVariantClass, number>;
  for (const call of calls) classCounts[call.class] += 1;
  return {
    generated_at: new Date().toISOString(),
    input_path: inputPath,
    source: path.basename(inputPath),
    classes_supported: VARIANT_CLASSES,
    class_counts: classCounts,
    reportable_count: calls.filter(call => call.reportability !== 'research_only').length,
    calls,
    limitations: [
      'This normalizes caller outputs; it does not replace read-level calling from FASTQ/BAM/CRAM.',
      'Clinical interpretation requires validated caller settings, genome-build checks, and clinician review.',
      'Repeat and structural variant sensitivity depends on sequencing technology, coverage, and caller-specific filters.'
    ],
  };
}

function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const repoDir = path.resolve(packageDir, '../..');
  const input = path.resolve(argValue('--input') ?? path.join(repoDir, 'example-data/sample-wgs-variant-classes.vcf'));
  const catalog = path.resolve(argValue('--catalog') ?? path.join(packageDir, 'references/wgs-interpretation-catalog.json'));
  const out = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/wgs-variant-class-summary.json'));
  const summary = summarizeWgsVariantClasses(input, catalog);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: 'ok',
    input,
    output: out,
    class_counts: summary.class_counts,
    reportable_count: summary.reportable_count,
  }, null, 2));
}

if (process.argv[1]?.endsWith('wgs_variant_class_engine.ts')) {
  main();
}
