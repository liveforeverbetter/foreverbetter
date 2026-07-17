import { createId } from '../store.js';
import type { RawSourceReference } from '../types.js';
import {
  ANCESTRY_INFORMATIVE_MARKERS,
  BENFORD_SMOOTHING,
  MATERNAL_HAPLOGROUP_SNPS,
  PATERNAL_HAPLOGROUP_SNPS,
  POPULATION_REGISTRY,
  type AncestryAnalysisInput,
  type AncestryAnalysisResult,
  type AncestryBreakdown,
  type AncestryQuality,
  type HaplogroupResult,
} from './ancestry-reference.js';

export type { AncestryAnalysisInput, AncestryAnalysisResult, AncestryBreakdown, AncestryQuality, HaplogroupResult } from './ancestry-reference.js';

const GROUPED_DISPLAY = [
  { code: 'AFR', region: 'Sub-Saharan African', color: '#E8A838' },
  { code: 'EUR', region: 'European', color: '#4A90D9' },
  { code: 'EAS', region: 'East Asian', color: '#D94A4A' },
  { code: 'SAS', region: 'South Asian', color: '#7B3FA3' },
  { code: 'AMR', region: 'Native American / Latino', color: '#4ABF8A' },
];

const SUB_REGION_ROLLUP: Record<string, string[]> = {
  'West African': ['YRI', 'GWD', 'MSL', 'ESN'],
  'East African': ['LWK'],
  'African Diaspora': ['ASW', 'ACB'],
  'Northwestern European': ['CEU', 'GBR'],
  'Finnish': ['FIN'],
  'Southern European': ['TSI', 'IBS'],
  'Chinese': ['CHB', 'CHS'],
  'Japanese/Korean': ['JPT'],
  'Southeast Asian': ['CDX', 'KHV'],
  'Northern South Asian': ['GIH', 'PJL'],
  'Eastern South Asian': ['BEB'],
  'Southern South Asian': ['STU', 'ITU'],
  'Mexican/Central American': ['MXL'],
  'Caribbean Latino': ['PUR'],
  'South American Latino': ['CLM', 'PEL'],
};

export function runAncestryAnalysis(
  input: AncestryAnalysisInput,
  source: RawSourceReference,
  payload: Buffer | undefined,
): AncestryAnalysisResult {
  const generatedAt = new Date().toISOString();
  const referencePanel = input.reference_panel ?? '1000_genomes_phase3';

  if (!payload) {
    return emptyResult(input, source, referencePanel, generatedAt, 'No genetic payload accessible.');
  }

  const text = payload.toString('utf8');
  const variantCounts = countVariants(text);
  const userGenotypes = extractUserGenotypes(text);
  const userAlleles = extractUserAlleles(text);
  const chrYVariants = countYChromosomeVariants(text);

  const populationScores: Record<string, number> = {};
  let totalMatches = 0;

  for (const marker of ANCESTRY_INFORMATIVE_MARKERS) {
    const genotype = userGenotypes[marker.rsid.toLowerCase()];
    if (!genotype) {
      const alleles = userAlleles[marker.rsid.toLowerCase()];
      if (!alleles) continue;
      totalMatches += 1;
      for (const [popCode, freqs] of Object.entries(marker.populations)) {
        const prob = allelesLikelihood(alleles, freqs.ref_freq, freqs.alt_freq);
        populationScores[popCode] = (populationScores[popCode] ?? 0) + Math.log(Math.max(prob, BENFORD_SMOOTHING));
      }
      continue;
    }
    totalMatches += 1;
    for (const [popCode, freqs] of Object.entries(marker.populations)) {
      const prob = genotypeLikelihood(genotype, freqs.ref_freq, freqs.alt_freq);
      populationScores[popCode] = (populationScores[popCode] ?? 0) + Math.log(Math.max(prob, BENFORD_SMOOTHING));
    }
  }

  const compatible = variantCounts.autosomal >= 10_000 && totalMatches >= 3;
  const matchedProportion = totalMatches / ANCESTRY_INFORMATIVE_MARKERS.length;
  const confidence = totalMatches >= 35 ? 'high' : totalMatches >= 15 ? 'medium' : totalMatches >= 3 ? 'low' : 'fail';

  const detailedAncestry = computeDetailedAncestry(populationScores, totalMatches, confidence);
  const resolution = input.resolution ?? 'continental';
  const ancestry = resolution === 'continental'
    ? detailedAncestry.filter(item => !item.sub_region)
    : detailedAncestry;
  const maternalHg = inferHaplogroup(userGenotypes, userAlleles, MATERNAL_HAPLOGROUP_SNPS, 'maternal');
  const paternalHg = chrYVariants > 0 ? inferHaplogroup(userGenotypes, userAlleles, PATERNAL_HAPLOGROUP_SNPS, 'paternal') : undefined;

  const coveredPops = Object.keys(populationScores).filter(k => populationScores[k] > -Infinity).length;

  return {
    schema_version: '1.0',
    id: createId('ancestry'),
    user_id: input.user_id,
    organization_id: input.organization_id,
    source_id: source.id,
    status: totalMatches > 0 ? (confidence === 'high' || confidence === 'medium' ? 'complete' : 'low_confidence') : 'setup_required',
    reference_panel: referencePanel,
    proportion_unit: 'percent',
    method: { id: 'curated_aim_maximum_likelihood', version: '1.0', execution: 'synchronous' },
    resolution,
    summary: buildSummary(totalMatches, confidence, ancestry, compatible),
    ancestry,
    haplogroups: { maternal: maternalHg, paternal: paternalHg },
    geographic_map: buildGeoMap(ancestry),
    chromosome_breakdown: buildChromosomeBreakdown(userGenotypes, userAlleles, ancestry),
    quality: {
      variant_count: variantCounts.total,
      autosomal_variant_count: variantCounts.autosomal,
      rsid_count: variantCounts.rsid,
      marker_count: ANCESTRY_INFORMATIVE_MARKERS.length,
      matched_markers: totalMatches,
      matched_proportion: Math.round(matchedProportion * 10000) / 100,
      covered_populations: coveredPops,
      compatible_for_projection: compatible,
      data_source_note: totalMatches > 0 ? `${totalMatches} of ${ANCESTRY_INFORMATIVE_MARKERS.length} ancestry-informative markers matched` : 'No markers matched',
      notes: buildQualityNotes(variantCounts, totalMatches, compatible, chrYVariants),
    },
    methodology: {
      algorithm: 'Maximum-likelihood population allele frequency comparison using curated ancestry-informative markers from 1000 Genomes Phase 3. Log-likelihood ratios are exponentiated and normalized to proportional ancestry estimates.',
      reference_panel: '1000 Genomes Phase 3',
      reference_populations: '26 populations across 5 super-populations: YRI, LWK, GWD, MSL, ESN, ASW, ACB (AFR); CEU, GBR, FIN, TSI, IBS (EUR); CHB, CHS, JPT, CDX, KHV (EAS); GIH, PJL, BEB, STU, ITU (SAS); MXL, PUR, CLM, PEL (AMR)',
      marker_source: `${ANCESTRY_INFORMATIVE_MARKERS.length} published ancestry-informative markers curated from 1000 Genomes Phase 3, HGDP, and published AIM panels with population-specific allele frequencies.`,
      limitations: [
        'Uses a curated panel of published ancestry-informative markers; not a full PCA or ADMIXTURE run.',
        'Sub-continental resolution is estimated from super-population proportions; fine-scale ancestry requires larger panels.',
        'Genetic ancestry is not the same as identity, ethnicity, nationality, or culture.',
        'Admixed individuals tend to receive proportional estimates rather than single-population assignments.',
        'Reference populations may not perfectly represent all human genetic diversity.',
        'This endpoint is for wellness/educational context and should not drive medical, legal, or identity decisions.',
      ],
    },
    generated_at: generatedAt,
  };
}

function computeDetailedAncestry(scores: Record<string, number>, totalMatches: number, confidence: string): AncestryBreakdown[] {
  if (totalMatches === 0) return [];

  const minScore = Math.min(...Object.values(scores).filter(v => Number.isFinite(v)));
  if (!Number.isFinite(minScore)) return [];

  const exponentiated = Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [k, Math.exp(v - minScore)]),
  );
  const total = Object.values(exponentiated).reduce((a, b) => a + b, 0);
  if (total <= 0) return [];

  const popProportions = Object.fromEntries(
    Object.entries(exponentiated).map(([k, v]) => [k, v / total]),
  );

  const regionProportions = GROUPED_DISPLAY.map(group => {
    const popCodes = Object.keys(POPULATION_REGISTRY).filter(code => {
      const info = POPULATION_REGISTRY[code];
      switch (group.code) {
        case 'AFR': return ['YRI', 'LWK', 'GWD', 'MSL', 'ESN', 'ASW', 'ACB'].includes(code);
        case 'EUR': return ['CEU', 'GBR', 'FIN', 'TSI', 'IBS'].includes(code);
        case 'EAS': return ['CHB', 'CHS', 'JPT', 'CDX', 'KHV'].includes(code);
        case 'SAS': return ['GIH', 'PJL', 'BEB', 'STU', 'ITU'].includes(code);
        case 'AMR': return ['MXL', 'PUR', 'CLM', 'PEL'].includes(code);
        default: return false;
      }
    });
    const proportion = popCodes.reduce((sum, code) => sum + (popProportions[code] ?? 0), 0);
    const info = popCodes.find(c => popProportions[c] > 0) ? POPULATION_REGISTRY[popCodes.find(c => popProportions[c] > 0)!] : undefined;
    return {
      region: group.region,
      proportion: Math.round(proportion * 10000) / 100,
      coordinates: popCodes.length > 0 ? { lat: info?.lat ?? 0, lon: info?.lon ?? 0 } : undefined,
    };
  }).filter(r => r.proportion >= 0.05).sort((a, b) => b.proportion - a.proportion);

  const result: AncestryBreakdown[] = [];
  const traceThreshold = 0.5;

  for (const region of regionProportions) {
    const subRegions = computeSubRegionBreakdown(popProportions, region.region);
    const totalProp = Math.round(region.proportion * 100) / 100;

    if (totalProp < traceThreshold && totalProp > 0) {
      result.push({
        region: region.region,
        proportion: totalProp,
        confidence: 'trace',
        coordinates: region.coordinates,
        countries: getCountriesForRegion(region.region),
      });
      continue;
    }

    if (subRegions.length <= 1) {
      result.push({
        region: region.region,
        proportion: totalProp,
        confidence: confidenceForProportion(totalProp, confidence) as 'high' | 'medium' | 'low',
        range: confidenceRange(totalProp, confidence),
        coordinates: region.coordinates,
        countries: getCountriesForRegion(region.region),
      });
      continue;
    }

    result.push({
      region: region.region,
      proportion: totalProp,
      confidence: confidenceForProportion(totalProp, confidence) as 'high' | 'medium' | 'low',
      range: confidenceRange(totalProp, confidence),
      coordinates: region.coordinates,
      countries: getCountriesForRegion(region.region),
    });

    for (const sub of subRegions) {
      // Internal likelihoods are fractions; the public ancestry contract uses
      // percentage points throughout.
      const subProportionPercent = sub.proportion * 100;
      if (subProportionPercent >= traceThreshold) {
        result.push({
          region: `  ${sub.name}`,
          sub_region: region.region,
          proportion: Math.round(subProportionPercent * 100) / 100,
          confidence: confidenceForProportion(subProportionPercent, confidence) as 'high' | 'medium' | 'low',
          coordinates: sub.coordinates,
          countries: sub.countries,
          population: sub.label,
        });
      }
    }
  }

  applyRangeToTraceResults(result, confidence);
  return result;
}

function computeSubRegionBreakdown(popProportions: Record<string, number>, region: string): Array<{
  name: string;
  proportion: number;
  coordinates?: { lat: number; lon: number };
  countries?: string[];
  label?: string;
}> {
  const result: Array<{ name: string; proportion: number; coordinates?: { lat: number; lon: number }; countries?: string[]; label?: string }> = [];

  for (const [subRegion, codes] of Object.entries(SUB_REGION_ROLLUP)) {
    let belongs = false;
    for (const code of codes) {
      const info = POPULATION_REGISTRY[code];
      if (!info) continue;
      if (info.region === region) {
        belongs = true;
        break;
      }
    }
    if (!belongs) continue;

    const proportion = codes.reduce((sum, code) => sum + (popProportions[code] ?? 0), 0);
    if (proportion <= 0) continue;

    const primaryCode = codes.find(c => (popProportions[c] ?? 0) > 0);
    const info = primaryCode ? POPULATION_REGISTRY[primaryCode] : undefined;

    result.push({
      name: subRegion,
      proportion,
      coordinates: info ? { lat: info.lat, lon: info.lon } : undefined,
      countries: codes.flatMap(c => POPULATION_REGISTRY[c]?.countries ?? []).filter((v, i, a) => a.indexOf(v) === i),
      label: info?.label,
    });
  }

  return result.filter(s => s.proportion >= 0.01).sort((a, b) => b.proportion - a.proportion);
}

function buildSummary(totalMatches: number, confidence: string, ancestry: AncestryBreakdown[], compatible: boolean): string {
  if (totalMatches === 0) {
    return 'No ancestry-informative markers were found in the uploaded data. Upload WGS VCF or SNP-array raw data with rsID annotations for ancestry inference.';
  }
  const top = ancestry.filter(a => a.confidence !== 'trace' && !a.region.startsWith('  ')).slice(0, 3);
  const parts = top.map(a => `${a.proportion}% ${a.region}`);
  const traceCount = ancestry.filter(a => a.confidence === 'trace').length;
  const pc = totalMatches >= 35 ? 'high' : totalMatches >= 15 ? 'moderate' : 'limited';
  let summary = `Genetic ancestry estimated with ${pc} confidence from ${totalMatches} ancestry-informative markers. Primary ancestry: ${parts.join(', ')}.`;
  if (traceCount > 0) summary += ` ${traceCount} trace ancestry result(s) detected.`;
  if (!compatible && totalMatches > 0) summary += ' Uploading WGS or dense SNP-array data would increase marker coverage and confidence.';
  return summary;
}

function buildGeoMap(ancestry: AncestryBreakdown[]): AncestryAnalysisResult['geographic_map'] {
  const regions = ancestry
    .filter(a => a.confidence !== 'trace' && !a.region.startsWith('  ') && a.coordinates)
    .map(a => ({
      name: a.region,
      proportion: a.proportion,
      coordinates: a.coordinates ? [{ lat: a.coordinates.lat, lon: a.coordinates.lon, weight: a.proportion / 100 }] : [],
    }));
  return { regions };
}

function buildChromosomeBreakdown(
  genotypes: Record<string, string>,
  alleles: Record<string, string>,
  globalAncestry: AncestryBreakdown[],
): AncestryAnalysisResult['chromosome_breakdown'] {
  if (Object.keys(genotypes).length < 10 && Object.keys(alleles).length < 10) return undefined;

  const autosomalMarkers = ANCESTRY_INFORMATIVE_MARKERS.filter(m => m.chromosome !== 'MT' && m.chromosome !== 'Y');
  if (autosomalMarkers.length < 5) return undefined;

  const chromBreakdown: Record<string, Record<string, number>> = {};
  for (const marker of autosomalMarkers) {
    const gt = genotypes[marker.rsid.toLowerCase()];
    const al = alleles[marker.rsid.toLowerCase()];
    if (!gt && !al) continue;

    const chrom = marker.chromosome;
    if (!chromBreakdown[chrom]) chromBreakdown[chrom] = {};

    const scores: Record<string, number> = {};
    for (const [popCode, freqs] of Object.entries(marker.populations)) {
      const prob = gt
        ? genotypeLikelihood(gt, freqs.ref_freq, freqs.alt_freq)
        : allelesLikelihood(al!, freqs.ref_freq, freqs.alt_freq);
      scores[popCode] = Math.max(prob, BENFORD_SMOOTHING);
    }

    const minScore = Math.min(...Object.values(scores).filter(Number.isFinite));
    const exp = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Math.exp(v - minScore)]));
    const total = Object.values(exp).reduce((a, b) => a + b, 0);
    if (total <= 0) continue;

    for (const [popCode, val] of Object.entries(exp)) {
      const info = POPULATION_REGISTRY[popCode];
      if (!info) continue;
      const region = info.region;
      chromBreakdown[chrom][region] = (chromBreakdown[chrom][region] ?? 0) + val / total;
    }
  }

  const result: AncestryAnalysisResult['chromosome_breakdown'] = [];
  for (const [chrom, regions] of Object.entries(chromBreakdown)) {
    const total = Object.values(regions).reduce((a, b) => a + b, 0);
    if (total <= 0) continue;
    const normalized = Object.fromEntries(
      Object.entries(regions).map(([k, v]) => [k, Math.round(v / total * 10000) / 100]),
    );
    result.push({ chromosome: `chr${chrom}`, proportions: normalized });
  }
  return result.slice(0, 22);
}

function inferHaplogroup(
  genotypes: Record<string, string>,
  alleles: Record<string, string>,
  snps: typeof MATERNAL_HAPLOGROUP_SNPS,
  type: 'maternal' | 'paternal',
): HaplogroupResult | undefined {
  let bestMatch: (typeof snps)[0] | undefined;
  let bestScore = 0;

  for (const snp of snps) {
    const gt = genotypes[snp.rsid.toLowerCase()];
    const al = alleles[snp.rsid.toLowerCase()];
    let matched = false;
    if (gt) {
      if (gt === '1/1') matched = true;
      else if (gt === '0/1' && snp.derived !== snp.ancestral) matched = true;
    }
    if (!matched && al) {
      if (al === snp.derived) matched = true;
    }
    if (!matched) continue;
    const score = snp.haplogroup.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = snp;
    }
  }

  if (!bestMatch) return undefined;

  return {
    haplogroup: bestMatch.haplogroup,
    confidence: bestScore > 3 ? 'high' : bestScore > 1 ? 'medium' : 'low',
    description: bestMatch.description,
    geographic_origin: bestMatch.origin,
    age_estimate: bestMatch.age,
    defining_markers: [bestMatch.rsid],
  };
}

interface VariantCounts { total: number; autosomal: number; rsid: number; }

function countVariants(text: string): VariantCounts {
  let total = 0;
  let autosomal = 0;
  let rsid = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const columns = line.split(/\t|,/);
    if (columns.length < 2) continue;
    total += 1;
    const chrom = normalizeChromosome(columns[0]);
    if (chrom != null && chrom >= 1 && chrom <= 22) autosomal += 1;
    for (const col of [columns[2], columns[0]]) {
      if (col && /^rs\d+$/i.test(col)) { rsid += 1; break; }
    }
  }
  return { total, autosomal, rsid };
}

function countYChromosomeVariants(text: string): number {
  let count = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const columns = line.split(/\t/);
    if (columns.length < 2) continue;
    const chrom = columns[0].toUpperCase().replace(/^CHR/i, '');
    if (chrom === 'Y' || chrom === 'NC_000024') count += 1;
  }
  return count;
}

function extractUserGenotypes(text: string): Record<string, string> {
  const genotypes: Record<string, string> = {};
  const knownRsids = new Set(ANCESTRY_INFORMATIVE_MARKERS.map(m => m.rsid.toLowerCase()));
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const columns = line.split(/\t|,/);
    if (columns.length < 2) continue;
    let rsid: string | undefined;
    for (const col of [columns[2], columns[0], columns[1], columns[3], columns[4]].filter(Boolean)) {
      if (col && /^rs\d+$/i.test(col)) { rsid = col.toLowerCase(); break; }
    }
    if (!rsid || !knownRsids.has(rsid)) continue;
    if (genotypes[rsid]) continue;

    const sampleCol = columns.length > 10 ? columns[10] : columns.length > 9 ? columns[9] : undefined;
    if (!sampleCol) continue;
    const formatCol = columns.length > 8 ? columns[8] : undefined;
    const formatFields = formatCol?.split(':');
    const sampleFields = sampleCol.split(':');
    const gtIdx = formatFields?.indexOf('GT') ?? 0;
    if (gtIdx < 0 || !sampleFields[gtIdx]) continue;
    const gt = sampleFields[gtIdx];

    if (gt === '0|0' || gt === '0/0') genotypes[rsid] = '0/0';
    else if (gt === '0|1' || gt === '1|0' || gt === '0/1' || gt === '1/0') genotypes[rsid] = '0/1';
    else if (gt === '1|1' || gt === '1/1') genotypes[rsid] = '1/1';
    else if (gt === '0') genotypes[rsid] = '0/0';
    else if (gt === '1') genotypes[rsid] = '0/1';
    else if (gt === '2') genotypes[rsid] = '1/1';
  }
  return genotypes;
}

function extractUserAlleles(text: string): Record<string, string> {
  const alleles: Record<string, string> = {};
  const knownRsids = new Set(ANCESTRY_INFORMATIVE_MARKERS.map(m => m.rsid.toLowerCase()));
  const haploRsids = new Set(MATERNAL_HAPLOGROUP_SNPS.concat(PATERNAL_HAPLOGROUP_SNPS).map(m => m.rsid.toLowerCase()));
  const relevant = new Set([...knownRsids, ...haploRsids]);

  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const columns = line.split(/\t|,/);
    if (columns.length < 5) continue;
    let rsid: string | undefined;
    for (const col of [columns[2], columns[0], columns[1], columns[3], columns[4]].filter(Boolean)) {
      if (col && /^rs\d+$/i.test(col)) { rsid = col.toLowerCase(); break; }
    }
    if (!rsid || !relevant.has(rsid)) continue;
    if (alleles[rsid]) continue;
    const sampleCol = columns.length > 10 ? columns[10] : columns.length > 9 ? columns[9] : undefined;
    const column4 = columns.length > 4 ? columns[4] : undefined;
    if (sampleCol) {
      const alleles_val = sampleCol.split(':')[0];
      if (alleles_val === '0') alleles[rsid] = columns[3];
      else if (alleles_val === '1' || alleles_val === '2') alleles[rsid] = column4 ?? columns[4];
    }
  }
  return alleles;
}

function genotypeLikelihood(gt: string, refFreq: number, altFreq: number): number {
  switch (gt) {
    case '0/0': return refFreq * refFreq;
    case '0/1': return 2 * refFreq * altFreq;
    case '1/1': return altFreq * altFreq;
    default: return BENFORD_SMOOTHING;
  }
}

function allelesLikelihood(allele: string, refFreq: number, altFreq: number): number {
  if (allele.length === 1) {
    if (allele === 'A' || allele === 'C' || allele === 'G' || allele === 'T') {
      return Math.max(refFreq, altFreq);
    }
  }
  return BENFORD_SMOOTHING;
}

function confidenceForProportion(proportion: number, globalConfidence: string): string {
  if (globalConfidence === 'high') return proportion > 5 ? 'high' : proportion > 1 ? 'medium' : 'low';
  if (globalConfidence === 'medium') return proportion > 5 ? 'medium' : 'low';
  return 'low';
}

function confidenceRange(proportion: number, globalConfidence: string): { low: number; high: number } {
  const margin = globalConfidence === 'high' ? 0.05 : globalConfidence === 'medium' ? 0.10 : 0.15;
  const scaled = margin * (proportion / 100);
  return {
    low: Math.max(0, Math.round((proportion - proportion * scaled) * 100) / 100),
    high: Math.min(100, Math.round((proportion + proportion * scaled) * 100) / 100),
  };
}

function applyRangeToTraceResults(ancestry: AncestryBreakdown[], confidence: string): void {
  for (const item of ancestry) {
    if (item.confidence === 'trace') {
      const margin = confidence === 'high' ? 0.1 : 0.3;
      item.range = { low: 0, high: 1.0 };
    }
  }
}

function getCountriesForRegion(region: string): string[] {
  const all: string[] = [];
  for (const [code, info] of Object.entries(POPULATION_REGISTRY)) {
    if (info.region === region) all.push(...info.countries);
  }
  return [...new Set(all)].slice(0, 5);
}

function buildQualityNotes(counts: VariantCounts, matched: number, compatible: boolean, chrY: number): string[] {
  const notes: string[] = [];
  if (counts.total === 0) notes.push('No variant rows detected in the genetic payload.');
  if (counts.rsid === 0) notes.push('No rsID annotations found. dbSNP annotation is highly recommended for ancestry inference.');
  if (matched === 0) notes.push('None of the ancestry-informative markers matched. Upload data with rsID annotations.');
  if (matched > 0 && matched < 10) notes.push(`Only ${matched} of ${ANCESTRY_INFORMATIVE_MARKERS.length} ancestry markers matched. Results are low confidence.`);
  if (compatible && matched >= 20) notes.push(`Good marker coverage: ${matched} ancestry markers. Continental ancestry is reliably estimated.`);
  if (matched >= 30) notes.push('High marker density enables confident continental and sub-continental ancestry inference.');
  if (chrY > 0) notes.push(`Y-chromosome data detected (${chrY} variants); paternal haplogroup inference available.`);
  if (chrY === 0 && matched > 0) notes.push('No Y-chromosome variants detected; paternal haplogroup inference not available (common for female donors or SNP arrays).');
  return notes;
}

function emptyResult(input: AncestryAnalysisInput, source: RawSourceReference, referencePanel: string, generatedAt: string, summary: string): AncestryAnalysisResult {
  return {
    schema_version: '1.0',
    id: createId('ancestry'),
    user_id: input.user_id,
    organization_id: input.organization_id,
    source_id: source.id,
    status: 'setup_required',
    reference_panel: referencePanel,
    proportion_unit: 'percent',
    method: { id: 'curated_aim_maximum_likelihood', version: '1.0', execution: 'synchronous' },
    resolution: input.resolution ?? 'continental',
    summary,
    ancestry: [],
    haplogroups: {},
    quality: {
      variant_count: 0, autosomal_variant_count: 0, rsid_count: 0,
      marker_count: ANCESTRY_INFORMATIVE_MARKERS.length,
      matched_markers: 0, matched_proportion: 0, covered_populations: 0,
      compatible_for_projection: false,
      data_source_note: 'No genetic payload accessible.',
      notes: ['Upload genetic data (VCF/SNP raw text) via /genetics/uploads direct storage (or /imports/file for small text exports) with rsID annotations, finalize it, then call /genetics/ancestry.'],
    },
    methodology: {
      algorithm: 'Maximum-likelihood allele frequency comparison.',
      reference_panel: referencePanel,
      reference_populations: '26 populations from 1000 Genomes Phase 3',
      marker_source: `${ANCESTRY_INFORMATIVE_MARKERS.length} ancestry-informative markers`,
      limitations: ['Requires rsID-annotated genetic data.', 'This endpoint is for wellness/educational context.'],
    },
    generated_at: generatedAt,
  };
}

function normalizeChromosome(value: string): number | undefined {
  const cleaned = value.replace(/^chr/i, '').replace(/^NC_0+/, '').split('.')[0];
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
}
