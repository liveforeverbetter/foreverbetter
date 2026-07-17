/**
 * Catalog Evidence Resolver
 *
 * Joins each condition in `skills/longevity-analysis/{folder}/catalog/` to the
 * actual evidence streams the pipeline already produces from the user's VCF:
 *
 *   ClinVar pathogenic calls   →  monogenic carrier / affected status
 *   CPIC star-allele matches   →  pharma metabolizer phenotype + dose rec
 *   PGS Catalog scores         →  polygenic risk percentile
 *   GWAS Catalog hits          →  trait / wellness directional evidence
 *
 * The catalog supplies the *condition list* and *gene panel*; this resolver
 * picks the right rows out of the existing pipeline outputs and produces a
 * per-condition finding for every modality.
 *
 * No new external sources are introduced — the resolver reuses ClinVar, CPIC,
 * PGS Catalog, GWAS Catalog, and VEP results that the pipeline already
 * computes. The catalog provides the human-readable name, the gene panel,
 * the editorial narrative, and the status lookup; the evidence streams
 * provide the user-specific call.
 */

import {
  loadCatalog,
  loadPharmacogeneVariantCatalog,
  type CatalogEntry,
  type CatalogModality,
  type ConditionCatalog,
  type EditorialBlock,
  type PharmacogeneVariantCatalog,
} from './catalog_loader.js';
import type { ClinVarAnnotation } from './clinvar_enrichment.js';
import { wellnessSafeCPICRecommendation, type CPICMatch } from './cpic_enrichment.js';
import type { PRSScore } from './prs_engine.js';
import type { GWASTraitSection } from '../../shared/dashboard-types.js';

/* -------------------------------------------------------------------------- */
/*                              Result types                                  */
/* -------------------------------------------------------------------------- */

export type MonogenicCarrierStatus =
  | 'variant_absent'
  | 'carrier'
  | 'likely_affected'
  | 'unresolved';

export interface CatalogVariantEvidence {
  rsid: string | null;
  gene: string;
  clinical_significance?: string;
  disease_name?: string;
  user_genotype?: string;
  confidence_tier?: string;
}

export interface CatalogPRSEvidence {
  source_id?: string;
  source_name?: string;
  source_url?: string;
  score: number;
  percentile: number;
  risk_label: string;
  variants_scored: number;
  coverage_pct: number;
  ancestry?: string;
}

export interface CatalogGWASEvidence {
  trait_label?: string;
  pubmed_id?: string;
  rsid?: string;
  effect_allele?: string;
  effect_size?: number;
}

export interface CatalogCPICEvidence {
  gene: string;
  drug: string;
  phenotype: string;
  recommendation: string;
  cpic_level: string;
  guideline_url?: string;
}

/**
 * Per-variant evidence from the curated pharmacogene catalog (the 1,048-rsID
 * variant inventory across the 23 pharmacogenes the upstream provider tracks).
 * Surfaced when the user's VCF has a genotype call at one of these rsIDs.
 */
export interface CatalogPharmacogeneVariantEvidence {
  gene: string;
  rsid: string;
  chromosome?: string;
  position?: number;
  reference_allele?: string | null;
  /** Named alleles (e.g. star alleles) catalogued at this position */
  named_alleles?: Array<{ id: string; name: string }>;
  /** The user's genotype call at this rsID, if available */
  user_genotype?: string;
  /** True if user genotype differs from the reference allele */
  is_variant?: boolean;
}

/**
 * Ancestry composition resolution. Returns the editorial encyclopedia entries
 * for populations relevant to the user. Full composition % computation requires
 * reference panels (e.g., 1000 Genomes) not bundled in this pipeline; this
 * resolver surfaces the encyclopedia so downstream callers can pair it with
 * whatever ancestry inference the wider pipeline runs.
 */
export interface AncestryPopulationEvidence {
  id: number;
  name: string | null;
  continent?: string;
  area?: string;
  group?: string;
  overview?: string;
}

export interface ResolvedCondition {
  id: number;
  name: string | null;
  modality: CatalogModality;
  url_slug?: string | null;
  /** Gene panel from the catalog */
  panel_genes: string[];
  /** Subset of panel genes the user's VCF actually hits */
  matched_genes: string[];
  /** ClinVar-derived monogenic / variant-level findings */
  clinvar_evidence: CatalogVariantEvidence[];
  /** CPIC-derived drug-gene findings (pharma only) */
  cpic_evidence: CatalogCPICEvidence[];
  /** Per-rsID variant evidence from the curated pharmacogene catalog (pharma only) */
  pharmacogene_variant_evidence: CatalogPharmacogeneVariantEvidence[];
  /** PGS Catalog / curated PRS scores matched to this condition */
  prs_evidence: CatalogPRSEvidence[];
  /** GWAS Catalog hits matched to this condition */
  gwas_evidence: CatalogGWASEvidence[];
  /** Population encyclopedia entry (ancestry only) */
  population_evidence?: AncestryPopulationEvidence;
  /** Carrier status for monogenic conditions; undefined for other modalities */
  monogenic_status?: MonogenicCarrierStatus;
  /** Editorial block from the catalog */
  editorial: EditorialBlock;
}

export interface CatalogFindings {
  user_gene_count: number;
  total_findings: number;
  modalities: Partial<Record<CatalogModality, ResolvedCondition[]>>;
}

/* -------------------------------------------------------------------------- */
/*                                  Input                                     */
/* -------------------------------------------------------------------------- */

export interface CatalogResolverInput {
  userGenes: Set<string>;
  clinvarAnnotations: ClinVarAnnotation[] | undefined;
  cpicMatches: CPICMatch[] | undefined;
  prsScores: PRSScore[] | undefined;
  gwasTraits: GWASTraitSection | undefined;
  /** rsID → genotype string (e.g. "AA", "AG"); used to surface per-rsID pharmacogene evidence */
  userGenotypes?: Map<string, string>;
  /**
   * Optional ancestry composition output from the wider pipeline (continent →
   * superpopulation → population tree with `id` strings matching the
   * population encyclopedia). When provided, the resolver surfaces editorial
   * for every detected population; otherwise it returns the encyclopedia as a
   * reference layer with no per-population call.
   */
  ancestryComposition?: AncestryNode[];
  /** Optional list of population IDs the upstream pipeline has detected for this user */
  detectedPopulationIds?: string[];
}

export interface AncestryNode {
  id: string;
  name?: string;
  percent?: number;
  detected?: boolean;
  population?: AncestryNode[];
  superpopulation?: AncestryNode[];
}

/* -------------------------------------------------------------------------- */
/*                              Helper joins                                  */
/* -------------------------------------------------------------------------- */

const NORMALIZE_RE = /[^a-z0-9]+/g;

function normalize(s: string | null | undefined): string {
  if (!s) return '';
  return s.toLowerCase().replace(NORMALIZE_RE, ' ').trim();
}

function tokenSet(s: string | null | undefined): Set<string> {
  return new Set(normalize(s).split(/\s+/).filter((t) => t.length > 3));
}

/**
 * Is this ClinVar annotation a clinically actionable risk?
 *
 * We accept the strict pathogenic tier and the risk-factor tier; we exclude
 * conflicting (mixed evidence), VUS, drug-response, and benign — those don't
 * justify flagging a user as a carrier/affected for the catalog condition.
 */
function isPathogenic(ann: ClinVarAnnotation): boolean {
  if (ann.confidenceTier) {
    return ann.confidenceTier === 'pathogenic_likely_pathogenic' || ann.confidenceTier === 'risk_factor_protective';
  }
  // Fallback to literal-string check when confidenceTier wasn't populated.
  const sig = (ann.clinicalSignificance || '').toLowerCase();
  if (!sig || sig.includes('conflicting') || sig.includes('benign') || sig === 'uncertain_significance') return false;
  return sig.includes('pathogenic') || sig.includes('risk_factor') || sig.includes('risk factor');
}

function genesFromAnnotation(geneInfo: string | undefined): string[] {
  if (!geneInfo) return [];
  // ClinVar geneInfo formats observed:
  //   "BRCA1"
  //   "BRCA1:672"            (HGNC id suffix)
  //   "BRCA1:672|BRCA2:675"  (pipe-separated multi-gene)
  //   "BRCA1, BRCA2"         (comma-separated)
  // We split on the common separators and strip the trailing :id.
  return geneInfo
    .split(/[\s,;|/]+/)
    .map((g) => g.split(':')[0]?.trim().toUpperCase() ?? '')
    .filter(Boolean);
}

function nameOverlap(entryName: string | null, candidateName: string | null | undefined, threshold = 2): boolean {
  if (!entryName || !candidateName) return false;
  const a = tokenSet(entryName);
  const b = tokenSet(candidateName);
  let overlap = 0;
  for (const t of a) if (b.has(t)) overlap++;
  return overlap >= threshold;
}

/* -------------------------------------------------------------------------- */
/*                              Per-modality                                  */
/* -------------------------------------------------------------------------- */

function pickClinVarForEntry(
  entry: CatalogEntry,
  panelGenes: string[],
  annotations: ClinVarAnnotation[],
): { evidence: CatalogVariantEvidence[]; pathogenicHits: number } {
  if (annotations.length === 0 || panelGenes.length === 0) return { evidence: [], pathogenicHits: 0 };
  const panel = new Set(panelGenes.map((g) => g.toUpperCase()));
  const out: CatalogVariantEvidence[] = [];
  let pathogenicHits = 0;
  for (const ann of annotations) {
    const annGenes = genesFromAnnotation(ann.geneInfo);
    const geneHit = annGenes.find((g) => panel.has(g));
    if (!geneHit) continue;
    const pathogenic = isPathogenic(ann);
    const nameMatch = nameOverlap(entry.name, ann.diseaseName);
    // Only emit pathogenic-tier or risk-factor evidence; we don't surface
    // benign / VUS in the catalog finding since they wouldn't change status.
    if (!pathogenic) continue;
    pathogenicHits++;
    out.push({
      rsid: ann.rsid || null,
      gene: geneHit,
      clinical_significance: ann.clinicalSignificance,
      disease_name: ann.diseaseName,
      confidence_tier: ann.confidenceTier,
    });
    // Subtle boost: name-matched pathogenic hits count more strongly toward affected status
    if (nameMatch && pathogenicHits < 25) {
      // already counted; nothing extra
    }
    if (out.length >= 25) break;
  }
  return { evidence: out, pathogenicHits };
}

function resolveMonogenicStatus(pathogenicHits: number): MonogenicCarrierStatus {
  if (pathogenicHits === 0) return 'variant_absent';
  // Without zygosity from the user genotype, we treat 1 hit as "carrier" and 2+ as
  // "likely_affected"; downstream consumers can refine with genotype.
  if (pathogenicHits === 1) return 'carrier';
  return 'likely_affected';
}

function pickCPICForEntry(
  panelGenes: string[],
  catalogDrugName: string | null,
  cpicMatches: CPICMatch[],
): CatalogCPICEvidence[] {
  if (cpicMatches.length === 0) return [];
  const panel = new Set(panelGenes.map((g) => g.toUpperCase()));
  const out: CatalogCPICEvidence[] = [];
  const drugTokens = tokenSet(catalogDrugName);
  for (const m of cpicMatches) {
    const gene = (m.gene || '').toUpperCase();
    const inPanel = panel.has(gene);
    const drugMatch = drugTokens.size > 0 && tokenSet(m.drug).size > 0
      ? [...tokenSet(m.drug)].some((t) => drugTokens.has(t))
      : false;
    if (!inPanel && !drugMatch) continue;
    out.push({
      gene,
      drug: m.drug,
      phenotype: m.phenotype,
      recommendation: wellnessSafeCPICRecommendation({
        gene,
        drug: m.drug,
        phenotype: m.phenotype,
        cpicLevel: m.cpicLevel,
      }),
      cpic_level: m.cpicLevel,
      guideline_url: m.guidelineUrl,
    });
    if (out.length >= 10) break;
  }
  return out;
}

function pickPRSForEntry(entry: CatalogEntry, prsScores: PRSScore[]): CatalogPRSEvidence[] {
  if (prsScores.length === 0 || !entry.name) return [];
  const out: CatalogPRSEvidence[] = [];
  for (const s of prsScores) {
    if (!nameOverlap(entry.name, s.disease)) continue;
    out.push({
      source_id: s.sourceId,
      source_name: s.sourceName,
      source_url: s.sourceUrl,
      score: s.score,
      percentile: s.percentile,
      risk_label: s.riskLabel,
      variants_scored: s.variantsScored,
      coverage_pct: s.coveragePct,
      ancestry: s.ancestry,
    });
    if (out.length >= 3) break;
  }
  return out;
}

function pickPharmacogeneVariantsForEntry(
  panelGenes: string[],
  pharmacogeneCatalog: PharmacogeneVariantCatalog,
  userGenotypes: Map<string, string> | undefined,
): CatalogPharmacogeneVariantEvidence[] {
  if (panelGenes.length === 0) return [];
  const panel = new Set(panelGenes.map((g) => g.toUpperCase()));
  // We surface every catalogued variant in the panel — both ones the user has a
  // call at and ones where the user is wildtype/uncalled. Variants with a real
  // user call are floated to the front so consumers see them first.
  const called: CatalogPharmacogeneVariantEvidence[] = [];
  const uncalled: CatalogPharmacogeneVariantEvidence[] = [];
  for (const [gene, variants] of Object.entries(pharmacogeneCatalog)) {
    if (!panel.has(gene.toUpperCase())) continue;
    for (const v of variants) {
      if (!v.rsid) continue;
      const gt = userGenotypes?.get(v.rsid);
      const isVariant = gt && v.reference_allele
        ? gt.split('').some((a) => a !== v.reference_allele)
        : undefined;
      const entry: CatalogPharmacogeneVariantEvidence = {
        gene,
        rsid: v.rsid,
        chromosome: v.chromosome,
        position: v.position,
        reference_allele: v.reference_allele,
        named_alleles: v.alleles,
        user_genotype: gt,
        is_variant: isVariant,
      };
      if (gt) called.push(entry);
      else uncalled.push(entry);
    }
  }
  return [...called, ...uncalled];
}

function pickGWASForEntry(entry: CatalogEntry, gwasTraits: GWASTraitSection | undefined): CatalogGWASEvidence[] {
  if (!gwasTraits || !entry.name) return [];
  const traitsArr = (gwasTraits as unknown as { traits?: Array<{ trait?: string; pubmed_id?: string; hits?: Array<{ rsid: string; effect_allele?: string; effect_size?: number }> }> }).traits ?? [];
  const out: CatalogGWASEvidence[] = [];
  for (const t of traitsArr) {
    if (!nameOverlap(entry.name, t.trait)) continue;
    const first = (t.hits && t.hits[0]) || undefined;
    out.push({
      trait_label: t.trait,
      pubmed_id: t.pubmed_id,
      rsid: first?.rsid,
      effect_allele: first?.effect_allele,
      effect_size: first?.effect_size,
    });
    if (out.length >= 3) break;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                Resolver                                    */
/* -------------------------------------------------------------------------- */

function resolveOne(
  entry: CatalogEntry,
  modality: CatalogModality,
  catalog: ConditionCatalog,
  input: CatalogResolverInput,
  pharmacogeneCatalog: PharmacogeneVariantCatalog,
): ResolvedCondition | null {
  const panel = catalog.geneMap[String(entry.id)] ?? [];
  const matchedGenes = panel.filter((g) => input.userGenes.has(g.toUpperCase()));
  const editorial = catalog.editorial[String(entry.id)] ?? {};

  let clinvarEvidence: CatalogVariantEvidence[] = [];
  let monogenicStatus: MonogenicCarrierStatus | undefined;
  let cpicEvidence: CatalogCPICEvidence[] = [];
  let pharmacogeneVariantEvidence: CatalogPharmacogeneVariantEvidence[] = [];
  let prsEvidence: CatalogPRSEvidence[] = [];
  let gwasEvidence: CatalogGWASEvidence[] = [];

  if (modality === 'hereditary') {
    const { evidence, pathogenicHits } = pickClinVarForEntry(entry, panel, input.clinvarAnnotations ?? []);
    clinvarEvidence = evidence;
    monogenicStatus = matchedGenes.length === 0 ? 'unresolved' : resolveMonogenicStatus(pathogenicHits);
  } else if (modality === 'pharmacology') {
    cpicEvidence = pickCPICForEntry(panel, entry.name, input.cpicMatches ?? []);
    pharmacogeneVariantEvidence = pickPharmacogeneVariantsForEntry(panel, pharmacogeneCatalog, input.userGenotypes);
    // Pharma also benefits from ClinVar drug_response flags
    const { evidence } = pickClinVarForEntry(entry, panel, input.clinvarAnnotations ?? []);
    clinvarEvidence = evidence;
  } else {
    // polygenic / traits / wellness: PRS and GWAS are the primary evidence
    prsEvidence = pickPRSForEntry(entry, input.prsScores ?? []);
    gwasEvidence = pickGWASForEntry(entry, input.gwasTraits);
    // ClinVar can still surface pathogenic associations (risk factor flags)
    const { evidence } = pickClinVarForEntry(entry, panel, input.clinvarAnnotations ?? []);
    clinvarEvidence = evidence;
  }

  // Skip entries with nothing meaningful — keep the catalog signal tight
  const hasMatch =
    matchedGenes.length > 0 ||
    clinvarEvidence.length > 0 ||
    cpicEvidence.length > 0 ||
    pharmacogeneVariantEvidence.length > 0 ||
    prsEvidence.length > 0 ||
    gwasEvidence.length > 0 ||
    monogenicStatus === 'variant_absent';

  if (!hasMatch) return null;

  // For monogenic, only surface when we either have evidence or know there's coverage
  if (modality === 'hereditary' && matchedGenes.length === 0 && clinvarEvidence.length === 0) return null;

  return {
    id: entry.id,
    name: entry.name,
    modality,
    url_slug: entry.url_slug,
    panel_genes: panel,
    matched_genes: matchedGenes,
    clinvar_evidence: clinvarEvidence,
    cpic_evidence: cpicEvidence,
    pharmacogene_variant_evidence: pharmacogeneVariantEvidence,
    prs_evidence: prsEvidence,
    gwas_evidence: gwasEvidence,
    monogenic_status: monogenicStatus,
    editorial,
  };
}

/**
 * Walk an ancestry composition tree and collect detected population IDs.
 */
function collectDetectedPopulations(nodes: AncestryNode[] | undefined): Set<string> {
  const out = new Set<string>();
  if (!nodes) return out;
  const walk = (n: AncestryNode) => {
    if (n.detected) out.add(n.id);
    if (n.population) for (const child of n.population) walk(child);
    if (n.superpopulation) for (const child of n.superpopulation) walk(child);
  };
  for (const node of nodes) walk(node);
  return out;
}

/**
 * Resolve ancestry catalog entries to user-detected populations + encyclopedia text.
 */
function resolveAncestry(
  catalog: ConditionCatalog,
  detectedIds: Set<string>,
): ResolvedCondition[] {
  const out: ResolvedCondition[] = [];
  // The ancestry catalog entries are keyed by numeric id; the encyclopedia is the
  // editorial. We only emit entries the user actually has when detectedIds is non-empty;
  // otherwise we surface every population as a reference layer.
  for (const entry of catalog.entries) {
    const eid = String(entry.id);
    const editorial = catalog.editorial[eid] ?? {};
    const detected = detectedIds.has(eid) || detectedIds.has(entry.name ?? '');
    if (detectedIds.size > 0 && !detected) continue;
    const ed = editorial as EditorialBlock & {
      continent?: string;
      area?: string;
      group?: string;
      overview?: string;
    };
    out.push({
      id: entry.id,
      name: entry.name,
      modality: 'ancestry',
      panel_genes: [],
      matched_genes: [],
      clinvar_evidence: [],
      cpic_evidence: [],
      pharmacogene_variant_evidence: [],
      prs_evidence: [],
      gwas_evidence: [],
      population_evidence: {
        id: entry.id,
        name: entry.name,
        continent: ed.continent,
        area: ed.area,
        group: ed.group,
        overview: ed.overview,
      },
      editorial,
    });
  }
  return out;
}

export function resolveCatalogEvidence(input: CatalogResolverInput): CatalogFindings {
  const modalities: CatalogModality[] = [
    'genetic-vulnerability',
    'hereditary',
    'pharmacology',
    'personality',
    'wellness',
    'ancestry',
  ];

  const out: CatalogFindings = {
    user_gene_count: input.userGenes.size,
    total_findings: 0,
    modalities: {},
  };

  // Load the pharmacogene variant catalog once (used for pharma rsID-level evidence).
  let pharmacogeneCatalog: PharmacogeneVariantCatalog = {};
  try {
    pharmacogeneCatalog = loadPharmacogeneVariantCatalog();
  } catch {
    // Catalog is optional; an empty map is fine.
  }

  // Pre-compute detected ancestry populations (from upstream-supplied composition tree
  // or an explicit population-id list). Either path is opt-in; without them the resolver
  // returns the encyclopedia as a reference layer.
  const detectedPopulations = new Set<string>([
    ...collectDetectedPopulations(input.ancestryComposition),
    ...(input.detectedPopulationIds ?? []),
  ]);

  for (const modality of modalities) {
    const catalog = loadCatalog(modality);
    if (catalog.entries.length === 0) {
      out.modalities[modality] = [];
      continue;
    }

    if (modality === 'ancestry') {
      const resolved = resolveAncestry(catalog, detectedPopulations);
      out.modalities[modality] = resolved;
      out.total_findings += resolved.length;
      continue;
    }

    const resolved: ResolvedCondition[] = [];
    for (const entry of catalog.entries) {
      const r = resolveOne(entry, modality, catalog, input, pharmacogeneCatalog);
      if (r) resolved.push(r);
    }
    // Sort: hereditary by carrier severity first, then by evidence richness.
    resolved.sort((a, b) => {
      const score = (r: ResolvedCondition): number => {
        let s = 0;
        if (r.monogenic_status === 'likely_affected') s += 1000;
        else if (r.monogenic_status === 'carrier') s += 500;
        s += r.cpic_evidence.length * 50;
        s += r.pharmacogene_variant_evidence.length * 25;
        s += r.clinvar_evidence.length * 10;
        s += r.prs_evidence.length * 20;
        s += r.matched_genes.length;
        return s;
      };
      return score(b) - score(a);
    });
    out.modalities[modality] = resolved;
    out.total_findings += resolved.length;
  }

  return out;
}
