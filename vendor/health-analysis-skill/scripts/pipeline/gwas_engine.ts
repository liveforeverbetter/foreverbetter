/**
 * GWAS Engine
 *
 * Interprets a user's genome against GWAS Catalog associations.
 * For each rsID in the user's genotype map that has a genome-wide significant
 * association (p < 5×10⁻⁸), generates an interpretation and groups by domain.
 *
 * Reference: reference/gwas/gwas_associations.json.gz
 * Built by: scripts/reference-build/build-gwas-reference.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { fileURLToPath } from 'url';
import { findWellnessGWASAssociations, readWellnessManifest, type SourceProvenance } from './wellness_reference.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Types ────────────────────────────────────────────────────────────────────

export interface GWASAssociation {
  trait: string;
  gene: string;
  or: number | null;
  p: number;
  n: number;
  effectAllele: string;
  domain: string;
  direction: 'risk' | 'protective' | 'unknown';
  source_type?: 'gwas_catalog_association';
  source_id?: string;
  source_url?: string;
  source_release?: string;
  confidenceTier?: 'gwas_association';
  provenance?: SourceProvenance[];
}

export interface GWASHit {
  rsid: string;
  genotype: string;
  copiesOfEffectAllele: 0 | 1 | 2;
  effectDirection: 'risk' | 'protective' | 'neutral' | 'unknown';
  trait: string;
  gene: string;
  domain: string;
  or: number | null;
  p: number;
  n: number;
  effectAllele: string;
  interpretation: string;
  magnitudeLabel: 'modest' | 'moderate' | 'substantial';
  confidenceTier?: 'gwas_association';
  sourceType?: 'gwas_catalog_association';
  sourceId?: string;
  sourceUrl?: string;
  sourceRelease?: string;
  genomeBuild?: string;
  ancestryDisclosure?: string;
  buildDisclosure?: string;
  provenance?: SourceProvenance[];
}

export interface GWASDomainSummary {
  domain: string;
  label: string;
  hits: GWASHit[];
  /** Net effect across all hits in the domain */
  netSignal: 'favorable' | 'slightly_favorable' | 'typical' | 'slightly_elevated' | 'elevated';
  hitCount: number;
  topHit: GWASHit | null;
}

export interface GWASResult {
  domains: GWASDomainSummary[];
  totalHits: number;
  totalRsidsScanned: number;
  referencePresent: boolean;
  referencePath?: string;
  sourceName?: string;
  sourceRelease?: string;
  genomeBuild?: string;
  ancestryDisclosure?: string;
  buildDisclosure?: string;
  coverageDisclosure?: string;
}

// ── Domain display labels ────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<string, string> = {
  cardiovascular:      'Cardiovascular',
  metabolic:           'Metabolic',
  longevity:           'Longevity',
  brain_cognitive:     'Brain & Cognitive',
  athletic_performance: 'Athletic Performance',
  sleep:               'Sleep',
  immune:              'Immune',
  nutrition:           'Nutrition',
  cancer_risk:         'Cancer Risk',
  other:               'Other Traits',
};

const DOMAIN_ORDER = [
  'longevity', 'cardiovascular', 'metabolic', 'brain_cognitive',
  'athletic_performance', 'immune', 'sleep', 'nutrition', 'cancer_risk', 'other',
];

// ── Reference loader (singleton cache) ──────────────────────────────────────

let _associations: Map<string, GWASAssociation[]> | null = null;

function loadAssociations(refDir: string): Map<string, GWASAssociation[]> {
  if (_associations) return _associations;

  const refPath = findWellnessGWASAssociations() ?? path.join(refDir, 'gwas/gwas_associations.json.gz');
  if (!fs.existsSync(refPath)) {
    return new Map();
  }

  const raw = fs.readFileSync(refPath);
  const json = refPath.endsWith('.gz') ? zlib.gunzipSync(raw).toString('utf8') : raw.toString('utf8');
  const obj = JSON.parse(json) as Record<string, GWASAssociation[]>;
  _associations = new Map(Object.entries(obj));
  return _associations;
}

// ── Genotype helpers ─────────────────────────────────────────────────────────

function countEffectAlleleCopies(genotype: string, effectAllele: string): 0 | 1 | 2 {
  if (!genotype || !effectAllele || effectAllele.length !== 1) return 0;
  const ea = effectAllele.toUpperCase();
  const alleles = genotype.toUpperCase().split('');
  const count = alleles.filter(a => a === ea).length;
  return Math.min(count, 2) as 0 | 1 | 2;
}

// ── Interpretation generator ─────────────────────────────────────────────────

function magnitudeLabel(or: number | null): 'modest' | 'moderate' | 'substantial' {
  if (or === null) return 'modest';
  const deviation = Math.abs(or - 1);
  if (deviation < 0.15) return 'modest';
  if (deviation < 0.40) return 'moderate';
  return 'substantial';
}

function formatP(p: number): string {
  if (p <= 0) return '< 1×10⁻³⁰⁰';
  const exp = Math.floor(Math.log10(p));
  const mantissa = p / Math.pow(10, exp);
  return `${mantissa.toFixed(1)}×10${superscript(exp)}`;
}

function superscript(n: number): string {
  const sup: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  return String(n).split('').map(c => sup[c] ?? c).join('');
}

function formatN(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

const DOMAIN_ACTIONABLE_CONTEXT: Record<string, string> = {
  cardiovascular:      'Cardiovascular variants are addressable through diet, exercise, lipid monitoring, and stress reduction.',
  metabolic:           'Metabolic variants respond well to diet quality, resistance training, sleep optimization, and glucose monitoring.',
  longevity:           'Longevity-associated variants inform supplementation strategy and lifestyle pacing for healthspan extension.',
  brain_cognitive:     'Cognitive variants are modified by sleep quality, omega-3 intake, exercise, and learning load.',
  athletic_performance: 'Performance variants guide training modality selection — power vs. endurance programming.',
  sleep:               'Sleep variants inform chronotype alignment and sleep hygiene priority.',
  immune:              'Immune variants guide anti-inflammatory diet, gut health, and stress management.',
  nutrition:           'Nutritional variants determine individual micronutrient needs and dietary sensitivities.',
  cancer_risk:         'Cancer-risk variants inform screening frequency and preventive lifestyle choices.',
  other:               'This trait association is documented in the GWAS Catalog at genome-wide significance.',
};

function generateInterpretation(
  rsid: string,
  gene: string,
  trait: string,
  domain: string,
  or: number | null,
  p: number,
  n: number,
  effectAllele: string,
  copies: 0 | 1 | 2,
  direction: 'risk' | 'protective' | 'unknown',
): string {
  const pStr = p > 0 ? formatP(p) : '< 5×10⁻⁸';
  const nStr = n > 0 ? `, N=${formatN(n)}` : '';
  const geneStr = gene && gene !== 'intergenic' ? ` (${gene})` : '';

  if (copies === 0) {
    const opposite = direction === 'risk' ? 'protective' : direction === 'protective' ? 'risk-increasing' : '';
    const oppositeStr = opposite ? ` — the ${opposite} genotype for this trait` : '';
    return `No copies of the ${trait} effect allele at ${rsid}${geneStr}${oppositeStr}. p=${pStr}${nStr}.`;
  }

  const copyWord = copies === 1 ? 'one copy' : 'two copies';
  const mag = magnitudeLabel(or);
  const orStr = or !== null ? ` (OR ${or.toFixed(2)})` : '';

  if (direction === 'protective') {
    const genotypeSummary = copies === 2 ? 'homozygous protective' : 'heterozygous protective';
    return `Carries ${copyWord} of the ${trait}-protective allele at ${rsid}${geneStr} — ${genotypeSummary}, ${mag} benefit${orStr}. p=${pStr}${nStr}. ${DOMAIN_ACTIONABLE_CONTEXT[domain] ?? ''}`;
  }

  if (direction === 'risk') {
    const genotypeSummary = copies === 2 ? 'homozygous risk' : 'heterozygous carrier';
    return `Carries ${copyWord} of the ${trait} risk allele at ${rsid}${geneStr} — ${genotypeSummary}, ${mag} effect${orStr}. p=${pStr}${nStr}. ${DOMAIN_ACTIONABLE_CONTEXT[domain] ?? ''}`;
  }

  return `Carries ${copyWord} of the effect allele at ${rsid}${geneStr} for ${trait}${orStr}. p=${pStr}${nStr}.`;
}

// ── Net signal calculator ────────────────────────────────────────────────────

function computeNetSignal(hits: GWASHit[]): GWASDomainSummary['netSignal'] {
  if (hits.length === 0) return 'typical';

  // Weight by copies and direction
  let score = 0;
  let weight = 0;
  for (const hit of hits) {
    const w = hit.copiesOfEffectAllele;
    if (w === 0) continue;
    const sign = hit.effectDirection === 'protective' ? -1 : hit.effectDirection === 'risk' ? 1 : 0;
    score += sign * w;
    weight += w;
  }

  if (weight === 0) return 'typical';
  const normalized = score / weight;

  if (normalized <= -0.6) return 'favorable';
  if (normalized <= -0.2) return 'slightly_favorable';
  if (normalized <= 0.2)  return 'typical';
  if (normalized <= 0.6)  return 'slightly_elevated';
  return 'elevated';
}

// ── Main export ──────────────────────────────────────────────────────────────

export function computeGWASHits(
  allGenotypes: Map<string, string>,
  refDir: string,
): GWASResult {
  const associations = loadAssociations(refDir);
  const manifest = readWellnessManifest();
  const disclosures = manifest?.disclosures;
  const gwasSource = manifest?.sources.find(source => source.source_id === 'gwas_catalog');

  if (associations.size === 0) {
    return { domains: [], totalHits: 0, totalRsidsScanned: allGenotypes.size, referencePresent: false };
  }

  const hitsByDomain = new Map<string, GWASHit[]>();
  let totalHits = 0;

  for (const [rsid, genotype] of allGenotypes) {
    const assocList = associations.get(rsid);
    if (!assocList || assocList.length === 0) continue;

    for (const assoc of assocList) {
      const copies = countEffectAlleleCopies(genotype, assoc.effectAllele);

      // Only report when user carries at least one copy of effect allele,
      // or zero copies of a risk allele (which is noteworthy — protective genotype)
      const isNotable = copies > 0 || assoc.direction === 'risk';
      if (!isNotable) continue;

      const effectDirection: GWASHit['effectDirection'] =
        copies === 0 ? (assoc.direction === 'risk' ? 'protective' : 'neutral') :
        assoc.direction === 'risk' ? 'risk' :
        assoc.direction === 'protective' ? 'protective' : 'unknown';

      const hit: GWASHit = {
        rsid,
        genotype,
        copiesOfEffectAllele: copies,
        effectDirection,
        trait: assoc.trait,
        gene: assoc.gene,
        domain: assoc.domain,
        or: assoc.or,
        p: assoc.p,
        n: assoc.n,
        effectAllele: assoc.effectAllele,
        magnitudeLabel: magnitudeLabel(assoc.or),
        confidenceTier: assoc.confidenceTier ?? 'gwas_association',
        sourceType: assoc.source_type ?? 'gwas_catalog_association',
        sourceId: assoc.source_id ?? 'gwas_catalog',
        sourceUrl: assoc.source_url ?? gwasSource?.source_url,
        sourceRelease: assoc.source_release ?? gwasSource?.release,
        genomeBuild: gwasSource?.genome_build,
        ancestryDisclosure: disclosures?.ancestry,
        buildDisclosure: disclosures?.genome_build,
        provenance: assoc.provenance ?? (gwasSource ? [gwasSource] : undefined),
        interpretation: generateInterpretation(
          rsid, assoc.gene, assoc.trait, assoc.domain,
          assoc.or, assoc.p, assoc.n, assoc.effectAllele,
          copies, assoc.direction,
        ),
      };

      const existing = hitsByDomain.get(assoc.domain) ?? [];
      existing.push(hit);
      hitsByDomain.set(assoc.domain, existing);
      totalHits++;
    }
  }

  // Sort each domain's hits: protective first, then by descending OR magnitude
  for (const hits of hitsByDomain.values()) {
    hits.sort((a, b) => {
      if (a.effectDirection === 'protective' && b.effectDirection !== 'protective') return -1;
      if (b.effectDirection === 'protective' && a.effectDirection !== 'protective') return 1;
      const aOr = a.or !== null ? Math.abs(a.or - 1) : 0;
      const bOr = b.or !== null ? Math.abs(b.or - 1) : 0;
      return bOr - aOr;
    });
  }

  // Build domain summaries in canonical order
  const domains: GWASDomainSummary[] = [];
  for (const domainId of DOMAIN_ORDER) {
    const hits = hitsByDomain.get(domainId);
    if (!hits || hits.length === 0) continue;
    domains.push({
      domain: domainId,
      label: DOMAIN_LABELS[domainId] ?? domainId,
      hits,
      netSignal: computeNetSignal(hits),
      hitCount: hits.length,
      topHit: hits[0] ?? null,
    });
  }

  // Append any domains not in canonical order (future-proofing)
  for (const [domainId, hits] of hitsByDomain) {
    if (!DOMAIN_ORDER.includes(domainId)) {
      domains.push({
        domain: domainId,
        label: DOMAIN_LABELS[domainId] ?? domainId,
        hits,
        netSignal: computeNetSignal(hits),
        hitCount: hits.length,
        topHit: hits[0] ?? null,
      });
    }
  }

  return {
    domains,
    totalHits,
    totalRsidsScanned: allGenotypes.size,
    referencePresent: true,
    referencePath: findWellnessGWASAssociations(),
    sourceName: gwasSource?.source_name ?? 'GWAS Catalog',
    sourceRelease: gwasSource?.release,
    genomeBuild: gwasSource?.genome_build,
    ancestryDisclosure: disclosures?.ancestry,
    buildDisclosure: disclosures?.genome_build,
    coverageDisclosure: disclosures?.coverage,
  };
}

/** Returns the reference directory path for this install. */
export function getGWASRefDir(): string {
  return path.resolve(__dirname, '../../../../reference');
}
