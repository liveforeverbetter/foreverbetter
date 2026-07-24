#!/usr/bin/env npx tsx
/**
 * Build the curated genetics trait catalog from the local extraction output
 * (extracted-report-data/, produced by extract-pdf-data.ts).
 *
 * Emits data/genetics/curated-traits.json containing only non-copyrightable
 * FACTS: analyzed genes, rsIDs, heritability %, risk-loci counts, health-domain
 * mapping, primary-study citations, and (for single-variant reports) the
 * gene/rsID/genotype panel. Verbatim source prose (description, technical
 * report) is intentionally NOT copied; consumer-facing descriptions are authored
 * separately. No third-party lab is referenced anywhere in the output.
 *
 * Usage: npx tsx scripts/build-curated-catalog.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'extracted-report-data', 'reports');
const OUT = path.join(ROOT, 'data', 'genetics', 'curated-traits.json');
const DESCRIPTIONS_FILE = path.join(ROOT, 'data', 'genetics', 'trait-descriptions.json');

// Hand-authored consumer copy (our own words), merged in by trait_id.
function authoredDescriptions(): Record<string, { consumer_value?: string; description?: string }> {
  try {
    return JSON.parse(fs.readFileSync(DESCRIPTIONS_FILE, 'utf8')).descriptions ?? {};
  } catch {
    return {};
  }
}

// Health-domain taxonomy (Phase 1b). A trait maps to one domain by keyword; the
// source category is a fallback signal.
type Domain =
  | 'cardiovascular' | 'metabolic' | 'cognitive_mood' | 'longevity_aging'
  | 'nutrition_response' | 'sleep_circadian' | 'immunity_inflammation'
  | 'physical_performance' | 'sensory_traits' | 'pharmacogenomics' | 'hereditary';

const DOMAIN_RULES: Array<[RegExp, Domain]> = [
  [/heart|cardiac|blood pressure|hypertension|coronary|atrial|qt |cholesterol|lipid|apolipo|triglycer|ldl|hdl|stroke|vascular|coagulation|factor v/i, 'cardiovascular'],
  [/glucose|diabet|insulin|metaboli|obesity|adipos|bmi|body fat|body mass|weight|urate|phosphate|calcium|creatinine|albumin|bilirubin|liver|hepatic|alt |ast |ggt|alkaline/i, 'metabolic'],
  [/cognit|memory|intelligence|reasoning|neuroticism|personality|mood|depress|anxiety|loneliness|friendship|agility|mental/i, 'cognitive_mood'],
  [/aging|ageing|longevity|telomere|epigenetic|facial aging|life expectancy|senescen/i, 'longevity_aging'],
  [/vitamin|omega|caffeine|alcohol|antioxidant|nutrient|folate|homocystein|iron|carotene|beta-carotene|sweets|bitter|taste|intoleran|lactose|histamine|allerg/i, 'nutrition_response'],
  [/sleep|insomnia|circadian|chronotype|morning|snoring/i, 'sleep_circadian'],
  [/immun|inflammat|c-reactive|crp|eosinophil|lymphocyte|monocyte|neutrophil|white blood|leukocyte|hla|infection|hiv|malaria/i, 'immunity_inflammation'],
  [/muscle|strength|endurance|vo2|fitness|walking|grip|exercise|performance|power|tendin|athlet|metabolic rate|physical activity|lung|pulmonary|fev|fvc/i, 'physical_performance'],
  [/hair|eye|skin|earlobe|earwax|freckle|corneal|iris|tooth|teeth|smell|odor|sneeze|itch|asparagus|red hair|baldness|height|birth weight|nasion|photic/i, 'sensory_traits'],
];

// Accurate consumer framing for domains whose specific result is
// genotype-dependent (computed per user), so we do not need per-trait prose.
const DOMAIN_GENERIC_COPY: Partial<Record<Domain, string>> = {
  pharmacogenomics: 'How your genetics may affect your response to this medication. Genotype-guided dosing (CPIC guidance) can lower side effects or improve effectiveness, but never change a medication on your own; share this with the prescriber who manages it.',
  hereditary: 'A carrier and condition screening result: it flags genes worth discussing with a clinician, not a diagnosis. Carrier status often means no symptoms for you but can matter for family planning, and any actionable result should be confirmed with clinical testing.',
};

function domainFor(traitName: string, sourceCategory: string): Domain {
  if (sourceCategory === 'pharmacology') return 'pharmacogenomics';
  if (sourceCategory === 'hereditary') return 'hereditary';
  for (const [re, domain] of DOMAIN_RULES) if (re.test(traitName)) return domain;
  return 'physical_performance';
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

// Parse the "≈ 32%" heritability figure the technical report states, and the
// risk-loci count. Both are facts stated in the source.
function heritabilityPct(report: any): number | null {
  const hay = `${report.prs_info?.risk_interpretation ?? ''} ${report.technical_report ?? ''}`;
  const m = hay.match(/genetic component[^%]*?(\d{1,3})\s*%/i)
    ?? hay.match(/heritabilit[^%]*?(\d{1,3})\s*%/i);
  return m ? Number(m[1]) : null;
}

function riskLoci(report: any): number | null {
  if (report.prs_info?.num_risk_loci != null) return report.prs_info.num_risk_loci;
  const m = String(report.raw_text ?? '').match(/Number\s+of\s+risk\s+loci\s*\n+\s*(\d+)/i);
  return m ? Number(m[1]) : null;
}

interface CuratedTrait {
  trait_id: string;
  display_name: string;
  domain: Domain;
  source_category: string;
  report_type: 'polygenic' | 'single_variant' | 'pharmacogenomic';
  genes: string[];
  rsids: string[];
  heritability_pct: number | null;
  risk_loci: number | null;
  // Single-variant / pharmacogenomic panels: the analyzed markers (facts).
  variants: Array<{ rsid: string; gene: string; genotype?: string }>;
  references: string[];
  // Consumer prose is authored separately (never copied verbatim).
  consumer_value?: string;
  needs_consumer_copy: boolean;
}

function readReports(): any[] {
  const out: any[] = [];
  for (const cat of fs.readdirSync(REPORTS_DIR)) {
    const dir = path.join(REPORTS_DIR, cat);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      out.push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
    }
  }
  return out;
}

function build(): void {
  const reports = readReports().filter(r => r.parsed_successfully);
  const authored = authoredDescriptions();
  const traits: Record<string, CuratedTrait> = {};

  for (const r of reports) {
    const id = r.trait_name_slug || slug(r.trait_name);
    const genes = Array.from(new Set([
      ...(r.prs_info?.genes_analyzed ?? []),
      ...(r.snp_results ?? []).map((s: any) => s.gene),
      ...(r.pharma_results?.snps ?? []).map((s: any) => s.gene),
      ...(r.hereditary_results?.gene_results ?? []).map((s: any) => s.gene),
    ].filter((g: string) => g && /^[A-Z][A-Z0-9-]{1,9}$/.test(g))));
    const variants = [
      ...(r.snp_results ?? []),
      ...(r.pharma_results?.snps ?? []),
      ...(r.hereditary_results?.gene_results ?? []),
    ]
      .filter((s: any) => s.rsid)
      .map((s: any) => ({ rsid: s.rsid, gene: s.gene ?? '', genotype: s.genotype || undefined }));
    const rsids = Array.from(new Set([...(r.all_rsids ?? []), ...variants.map(v => v.rsid)]));
    const reportType: CuratedTrait['report_type'] =
      r.source_category === 'Pharmacology' ? 'pharmacogenomic'
        : variants.length > 0 ? 'single_variant' : 'polygenic';

    traits[id] = {
      trait_id: id,
      display_name: r.trait_name,
      domain: domainFor(r.trait_name, r.internal_category),
      source_category: r.internal_category,
      report_type: reportType,
      genes,
      rsids,
      heritability_pct: heritabilityPct(r),
      risk_loci: riskLoci(r),
      variants,
      references: (r.bibliography ?? []).slice(0, 8),
      ...(consumerValueFor(id, domainFor(r.trait_name, r.internal_category)) ? { consumer_value: consumerValueFor(id, domainFor(r.trait_name, r.internal_category)) } : {}),
      needs_consumer_copy: !consumerValueFor(id, domainFor(r.trait_name, r.internal_category)),
    };
  }

  function consumerValueFor(traitId: string, domain: Domain): string | undefined {
    // Hand-authored trait copy wins; pharmacogenomics/hereditary use an accurate
    // domain framing because their specific action is genotype-dependent and
    // computed per user at analysis time.
    return authored[traitId]?.consumer_value ?? DOMAIN_GENERIC_COPY[domain];
  }

  const byDomain: Record<string, number> = {};
  for (const t of Object.values(traits)) byDomain[t.domain] = (byDomain[t.domain] ?? 0) + 1;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    schema_version: '1.0',
    version: '1.0.0',
    updated: new Date().toISOString().slice(0, 10),
    note: 'Curated genetics trait catalog. Structured facts only (genes, rsIDs, heritability, loci, citations, domain). Consumer prose authored separately.',
    total_traits: Object.keys(traits).length,
    by_domain: byDomain,
    traits,
  }, null, 2));

  console.log(`Wrote ${Object.keys(traits).length} traits to ${path.relative(ROOT, OUT)}`);
  console.log('By domain:', JSON.stringify(byDomain));
  const withHeritability = Object.values(traits).filter(t => t.heritability_pct != null).length;
  const withRsids = Object.values(traits).filter(t => t.rsids.length > 0).length;
  console.log(`heritability captured: ${withHeritability} | with rsIDs: ${withRsids}`);
}

build();
