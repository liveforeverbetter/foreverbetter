/**
 * ClinVar Enrichment Engine
 *
 * Cross-references VCF variants against the ClinVar database for clinical significance.
 * Uses a pre-built pipe-separated index (built once from the ClinVar VCF) for instant lookups.
 *
 * Index format: rsID|clinicalSignificance|diseaseName|geneInfo|reviewStatus
 *
 * Build the index once:
 *   python3 build_clinvar_index.py
 * Or: the index is built automatically if not found.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { findClinVarInterpretationIndex } from './clinvar_reference.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Types
// ============================================================================

export interface ClinVarAnnotation {
  rsid: string;
  clinicalSignificance: string;
  diseaseName: string;
  geneInfo: string;
  reviewStatus: string;
  confidenceTier?: ClinVarConfidenceTier;
  evidenceTier?: 1 | 2 | 3;
  isRare?: boolean;
  gnomadAF?: number;
  populationFrequency?: string; // "Rare (<1%)", "Uncommon (1-5%)", "Common (>5%)"
  isACMG?: boolean;
  acmgCondition?: string;
  acmgRecommendation?: string;
}

export type VariantCategory =
  | "genetic_conditions"
  | "drug_response"
  | "other_risks"
  | "rare_mutations"
  | "uncommon_mutations";

export type ClinVarConfidenceTier =
  | "pathogenic_likely_pathogenic"
  | "drug_response"
  | "risk_factor_protective"
  | "vus"
  | "benign"
  | "conflicting_classifications"
  | "other";

export interface ClinVarEnrichmentResult {
  annotations: ClinVarAnnotation[];
  totalQueried: number;
  totalFound: number;
  pathogenicCount: number;
  uncertainCount: number;
  drugResponseCount: number;
}

export interface RareVariantFilter {
  mafThreshold: number; // default 0.01 (1%)
  gnomadPopulation?: string; // 'global' | 'afr' | 'amr' | 'eas' | 'eur' | 'sas'
}

// ============================================================================
// ACMG Secondary Findings Gene Set (ACMG SF v3.2)
// ============================================================================

export const ACMG_SF_GENES = new Set([
  'BRCA1', 'BRCA2', 'TP53', 'STK11', 'MLH1', 'MSH2', 'MSH6', 'PMS2',
  'APC', 'MUTYH', 'BMPR1A', 'SMAD4', 'PTEN', 'RET', 'VHL',
  'SDHB', 'SDHC', 'SDHD', 'RB1', 'LDLR', 'APOB', 'PCSK9',
  'MYH7', 'MYBPC3', 'TNNT2', 'TNNI3', 'TPM1', 'MYL2', 'MYL3',
  'ACTC1', 'PRKAG2', 'GLA', 'LMNA', 'RYR2', 'PKP2', 'DSP',
  'DSC2', 'DSG2', 'TMEM43', 'KCNQ1', 'KCNH2', 'SCN5A',
  'COL3A1', 'FBN1', 'TGFBR1', 'TGFBR2', 'SMAD3', 'ACTA2',
  'MYH11', 'ATP7B', 'OTC', 'RYR1', 'CACNA1S',
]);

// ============================================================================
// Recessive Disease Gene Set
//
// Heterozygous pathogenic variants in these genes typically indicate CARRIER
// STATUS, not disease risk. Homozygous/compound heterozygous = disease.
// Used to properly classify ClinVar findings for more accurate reporting.
// ============================================================================

export const RECESSIVE_DISEASE_GENES = new Set([
  // Metabolic
  'CFTR',      // Cystic fibrosis (AR)
  'PAH',       // Phenylketonuria (AR)
  'HBB',       // Sickle cell / beta-thalassemia (AR)
  'GBA',       // Gaucher disease (AR)
  'GAA',       // Pompe disease (AR)
  'GALT',      // Galactosemia (AR)
  'SERPINA1',  // Alpha-1 antitrypsin deficiency (AR — PiZZ)
  'HFE',       // Hereditary hemochromatosis (AR — C282Y/C282Y)
  'ATP7B',     // Wilson disease (AR)
  'SMN1',      // Spinal muscular atrophy (AR)
  'HBA1',      // Alpha-thalassemia (AR)
  'HBA2',      // Alpha-thalassemia (AR)
  'ASS1',      // Citrullinemia type I (AR)
  'ASL',       // Argininosuccinic aciduria (AR)
  'BCKDHA',    // Maple syrup urine disease type 1A (AR)
  'BCKDHB',    // MSUD type 1B (AR)
  'MUT',       // Methylmalonic acidemia (AR)
  'MMACHC',    // Cobalamin C disease (AR)
  'NPC1',      // Niemann-Pick type C (AR)
  'SMPD1',     // Niemann-Pick A/B (AR)
  'GUSB',      // Mucopolysaccharidosis VII (AR)
  'IDUA',      // MPS I / Hurler (AR)
  'IDS',       // MPS II / Hunter (XLR)
  'GNS',       // MPS IIID (AR)
  'GLB1',      // GM1 gangliosidosis (AR)
  'HEXA',      // Tay-Sachs (AR)
  'HEXB',      // Sandhoff disease (AR)
  'CBS',       // Homocystinuria (AR)
  'MTHFR',     // Severe MTHFR deficiency (AR) — note: common variants are risk factors, not recessive

  // Neurological / Neuromuscular
  'SMN2',      // SMA modifier (AR)
  'DMD',       // Duchenne/Becker muscular dystrophy (XLR)
  'CAPN3',     // LGMD2A (AR)
  'FKRP',      // LGMD2I (AR)
  'SGCA',      // LGMD2D (AR)
  'SGCB',      // LGMD2E (AR)
  'SGCG',      // LGMD2C (AR)
  'SGCD',      // LGMD2F (AR)
  'DYSF',      // LGMD2B / Miyoshi myopathy (AR)
  'ANO5',      // LGMD2L (AR)
  'POMT1',     // Walker-Warburg syndrome (AR)
  'FRG1',      // FSHD (AD — but complex)
  'SPG11',     // Hereditary spastic paraplegia (AR)
  'SPG7',      // HSP (AR)
  'ALS2',      // ALS2 / juvenile ALS (AR)

  // Hearing loss
  'GJB2',      // Connexin 26 — most common AR hearing loss
  'GJB6',      // Connexin 30 — AR hearing loss
  'SLC26A4',   // Pendred syndrome (AR)
  'MYO7A',     // Usher syndrome type 1B (AR)
  'USH2A',     // Usher syndrome type 2A (AR)
  'CDH23',     // Usher syndrome type 1D (AR)
  'OTOF',      // Auditory neuropathy (AR)
  'TMC1',      // DFNA/DFNB hearing loss (AR/AD)
  'MYO15A',    // DFNB3 hearing loss (AR)
  'STRC',      // DFNB16 hearing loss (AR)

  // Vision
  'ABCA4',     // Stargardt disease (AR)
  'RPE65',     // Leber congenital amaurosis (AR)
  'USH2A',     // Usher syndrome/retinitis pigmentosa (AR)
  'EYS',       // Retinitis pigmentosa (AR)
  'RPGR',      // Retinitis pigmentosa (XLR)
  'CNGA1',     // Retinitis pigmentosa (AR)
  'CNGB1',     // Retinitis pigmentosa (AR)
  'PDE6A',     // Retinitis pigmentosa (AR)
  'PDE6B',     // Retinitis pigmentosa (AR)
  'RHO',       // Retinitis pigmentosa (AD/AR)

  // Hematologic
  'F5',        // Factor V (AR — deficiency; note: FVL is AD risk)
  'F7',        // Factor VII deficiency (AR)
  'F8',        // Hemophilia A (XLR)
  'F9',        // Hemophilia B (XLR)
  'VWF',       // Von Willebrand disease (AD/AR)

  // Immunodeficiency
  'ADA',       // ADA-SCID (AR)
  'IL2RG',     // X-SCID (XLR)
  'RAG1',      // SCID (AR)
  'RAG2',      // SCID (AR)
  'BTK',       // X-linked agammaglobulinemia (XLR)
  'WAS',       // Wiskott-Aldrich syndrome (XLR)
  'CYBB',      // Chronic granulomatous disease (XLR)
  'CYBA',      // CGD (AR)

  // Other
  'PKHD1',     // ARPKD (AR)
  'PKD1',      // ADPKD (AD — but included for reference)
  'NPHS1',     // Congenital nephrotic syndrome (AR)
  'NPHS2',     // Steroid-resistant nephrotic syndrome (AR)
  'AGXT',      // Primary hyperoxaluria type 1 (AR)
  'FANCC',     // Fanconi anemia (AR)
  'FANCA',     // Fanconi anemia (AR)
  'BLM',       // Bloom syndrome (AR)
  'WRN',       // Werner syndrome (AR)
  'ATM',       // Ataxia-telangiectasia (AR — note: heterozygous = cancer risk)
  'NBN',       // Nijmegen breakage syndrome (AR)
  'MRE11',     // AT-like disorder (AR)
  'ALDH2',     // Alcohol dehydrogenase (AR — dominant negative)
]);

/**
 * Determine if a gene typically causes disease in an autosomal recessive pattern.
 */
export function isRecessiveDiseaseGene(gene: string): boolean {
  return RECESSIVE_DISEASE_GENES.has(gene.toUpperCase());
}

export const ACMG_GENE_INFO: Record<string, { condition: string; recommendation: string }> = {
  BRCA1: { condition: 'Hereditary Breast and Ovarian Cancer', recommendation: 'Enhanced breast cancer screening (MRI + mammogram). Consider prophylactic surgery. Consult genetic counselor.' },
  BRCA2: { condition: 'Hereditary Breast and Ovarian Cancer', recommendation: 'Enhanced breast cancer screening. Consider prophylactic surgery. Male breast cancer and prostate cancer risk. Consult genetic counselor.' },
  TP53: { condition: 'Li-Fraumeni Syndrome', recommendation: 'Comprehensive cancer surveillance protocol. Avoid radiation when possible. Consult oncologist and genetic counselor.' },
  STK11: { condition: 'Peutz-Jeghers Syndrome', recommendation: 'GI surveillance starting at age 8. Regular cancer screening. Consult gastroenterologist and genetic counselor.' },
  MLH1: { condition: 'Lynch Syndrome', recommendation: 'Colonoscopy every 1-2 years starting age 20-25. Consider prophylactic hysterectomy. Consult genetic counselor.' },
  MSH2: { condition: 'Lynch Syndrome', recommendation: 'Colonoscopy every 1-2 years starting age 20-25. Consider prophylactic surgery. Consult genetic counselor.' },
  MSH6: { condition: 'Lynch Syndrome', recommendation: 'Colonoscopy every 1-2 years starting age 30. Endometrial cancer surveillance. Consult genetic counselor.' },
  PMS2: { condition: 'Lynch Syndrome', recommendation: 'Colonoscopy every 1-2 years starting age 30. Moderate cancer risk increase. Consult genetic counselor.' },
  APC: { condition: 'Familial Adenomatous Polyposis', recommendation: 'Annual colonoscopy starting age 10-12. Prophylactic colectomy usually required. Consult gastroenterologist.' },
  MUTYH: { condition: 'MUTYH-Associated Polyposis', recommendation: 'Colonoscopy every 1-2 years starting age 25-30. Consult gastroenterologist.' },
  BMPR1A: { condition: 'Juvenile Polyposis Syndrome', recommendation: 'GI surveillance starting in adolescence. Consult gastroenterologist.' },
  SMAD4: { condition: 'Juvenile Polyposis / HHT', recommendation: 'GI surveillance. Screen for hereditary hemorrhagic telangiectasia. Consult specialist.' },
  PTEN: { condition: 'PTEN Hamartoma Tumor Syndrome', recommendation: 'Comprehensive cancer surveillance. Thyroid ultrasound, breast MRI. Consult genetic counselor.' },
  RET: { condition: 'Multiple Endocrine Neoplasia Type 2', recommendation: 'Prophylactic thyroidectomy recommended in childhood. Consult endocrinologist and genetic counselor.' },
  VHL: { condition: 'Von Hippel-Lindau Syndrome', recommendation: 'Annual surveillance for renal, CNS, and retinal tumors starting in childhood. Consult specialist.' },
  SDHB: { condition: 'Hereditary Paraganglioma-Pheochromocytoma', recommendation: 'Regular imaging and metanephrine screening. High metastatic risk. Consult endocrinologist.' },
  SDHC: { condition: 'Hereditary Paraganglioma-Pheochromocytoma', recommendation: 'Regular surveillance for head/neck paragangliomas. Consult specialist.' },
  SDHD: { condition: 'Hereditary Paraganglioma-Pheochromocytoma', recommendation: 'Regular surveillance. Parent-of-origin effects (paternal transmission). Consult specialist.' },
  RB1: { condition: 'Retinoblastoma', recommendation: 'Specialized ophthalmic surveillance starting at birth. Consult ophthalmologist and oncologist.' },
  LDLR: { condition: 'Familial Hypercholesterolemia', recommendation: 'Aggressive lipid-lowering therapy. Screen family members. Consult lipidologist or cardiologist.' },
  APOB: { condition: 'Familial Hypercholesterolemia', recommendation: 'Aggressive lipid management. Consider PCSK9 inhibitor if statins insufficient. Consult cardiologist.' },
  PCSK9: { condition: 'Familial Hypercholesterolemia', recommendation: 'Gain-of-function: aggressive lipid-lowering. Loss-of-function is protective. Consult cardiologist.' },
  MYH7: { condition: 'Hypertrophic Cardiomyopathy', recommendation: 'Regular echocardiogram. Avoid competitive athletics. Consult cardiologist.' },
  MYBPC3: { condition: 'Hypertrophic Cardiomyopathy', recommendation: 'Regular cardiac imaging. Family screening. Consult cardiologist.' },
  TNNT2: { condition: 'Hypertrophic Cardiomyopathy', recommendation: 'Cardiac surveillance. Higher risk of sudden cardiac death. Consult cardiologist.' },
  TNNI3: { condition: 'Hypertrophic / Restrictive Cardiomyopathy', recommendation: 'Regular cardiac evaluation. Consult cardiologist.' },
  TPM1: { condition: 'Hypertrophic Cardiomyopathy', recommendation: 'Regular cardiac imaging. Consult cardiologist.' },
  MYL2: { condition: 'Hypertrophic Cardiomyopathy', recommendation: 'Cardiac surveillance. Typically later onset. Consult cardiologist.' },
  MYL3: { condition: 'Hypertrophic Cardiomyopathy', recommendation: 'Cardiac surveillance. Consult cardiologist.' },
  ACTC1: { condition: 'Hypertrophic Cardiomyopathy', recommendation: 'Cardiac evaluation. Consult cardiologist.' },
  PRKAG2: { condition: 'PRKAG2 Cardiomyopathy', recommendation: 'Cardiac surveillance. WPW syndrome screening. Consult cardiologist.' },
  GLA: { condition: 'Fabry Disease', recommendation: 'Enzyme replacement therapy available. Renal and cardiac surveillance. Consult metabolic specialist.' },
  LMNA: { condition: 'Laminopathies (Dilated Cardiomyopathy)', recommendation: 'Regular cardiac evaluation. High arrhythmia risk — consider ICD. Consult cardiologist.' },
  RYR2: { condition: 'Catecholaminergic Polymorphic VT', recommendation: 'Beta-blocker therapy. Avoid strenuous exercise. Consider ICD. Consult electrophysiologist.' },
  PKP2: { condition: 'Arrhythmogenic Right Ventricular Cardiomyopathy', recommendation: 'Regular cardiac imaging. Exercise restriction. Consider ICD. Consult electrophysiologist.' },
  DSP: { condition: 'Arrhythmogenic Cardiomyopathy', recommendation: 'Cardiac surveillance. Risk of both right and left ventricular involvement. Consult cardiologist.' },
  DSC2: { condition: 'Arrhythmogenic Right Ventricular Cardiomyopathy', recommendation: 'Regular cardiac evaluation. Consult electrophysiologist.' },
  DSG2: { condition: 'Arrhythmogenic Right Ventricular Cardiomyopathy', recommendation: 'Regular cardiac evaluation. Consult electrophysiologist.' },
  TMEM43: { condition: 'Arrhythmogenic Cardiomyopathy (LMNA-like)', recommendation: 'Regular cardiac evaluation. High arrhythmia risk. Consult cardiologist.' },
  KCNQ1: { condition: 'Long QT Syndrome Type 1', recommendation: 'Beta-blocker therapy. Avoid QT-prolonging drugs. Consult electrophysiologist.' },
  KCNH2: { condition: 'Long QT Syndrome Type 2', recommendation: 'Beta-blocker therapy. Avoid QT-prolonging drugs. Electrolyte management. Consult electrophysiologist.' },
  SCN5A: { condition: 'Long QT Syndrome Type 3 / Brugada', recommendation: 'Cardiac evaluation. Avoid sodium channel blockers. Fever management for Brugada. Consult electrophysiologist.' },
  COL3A1: { condition: 'Vascular Ehlers-Danlos Syndrome', recommendation: 'Vascular surveillance. Avoid contact sports and elective surgery when possible. Consult geneticist.' },
  FBN1: { condition: 'Marfan Syndrome', recommendation: 'Regular echocardiogram. Aortic root surveillance. Beta-blocker or ARB therapy. Consult cardiologist.' },
  TGFBR1: { condition: 'Loeys-Dietz Syndrome', recommendation: 'Aggressive aortic surveillance. Lower surgical thresholds. Consult cardiologist.' },
  TGFBR2: { condition: 'Loeys-Dietz Syndrome', recommendation: 'Aggressive aortic surveillance. Lower surgical thresholds. Consult cardiologist.' },
  SMAD3: { condition: 'Loeys-Dietz / Aneurysm Syndrome', recommendation: 'Vascular surveillance. Early-onset osteoarthritis. Consult cardiologist.' },
  ACTA2: { condition: 'Familial Thoracic Aortic Aneurysm', recommendation: 'Aortic surveillance. Risk of early coronary artery disease and stroke. Consult cardiologist.' },
  MYH11: { condition: 'Familial Thoracic Aortic Aneurysm', recommendation: 'Regular aortic imaging. Consult cardiologist.' },
  ATP7B: { condition: 'Wilson Disease', recommendation: 'Copper chelation therapy. Liver and neurological surveillance. Consult hepatologist.' },
  OTC: { condition: 'Ornithine Transcarbamylase Deficiency', recommendation: 'Protein restriction. Ammonia level monitoring. Consult metabolic specialist.' },
  RYR1: { condition: 'Malignant Hyperthermia Susceptibility', recommendation: 'CRITICAL: Avoid succinylcholine and volatile anesthetics. Inform all anesthesiologists before any surgery.' },
  CACNA1S: { condition: 'Malignant Hyperthermia Susceptibility', recommendation: 'CRITICAL: Avoid triggering anesthetics. Inform all anesthesiologists before any surgery.' },
};

const PATHOGENIC = new Set([
  'Pathogenic', 'Likely_pathogenic', 'Pathogenic/Likely_pathogenic',
]);

function categorizeSignificance(clnsig: string): 'pathogenic' | 'benign' | 'uncertain' | 'drug_response' | 'protective' | 'risk_factor' | 'other' {
  const sig = clnsig.trim();
  if (PATHOGENIC.has(sig)) return 'pathogenic';
  if (sig.includes('Benign')) return 'benign';
  if (sig.includes('Uncertain_significance')) return 'uncertain';
  if (sig.includes('drug_response')) return 'drug_response';
  if (sig.includes('protective')) return 'protective';
  if (sig.includes('risk_factor')) return 'risk_factor';
  return 'other';
}

export function getClinVarConfidenceTier(clnsig: string): ClinVarConfidenceTier {
  const sig = clnsig.toLowerCase();
  if (sig.includes('conflicting')) return 'conflicting_classifications';
  if (sig.includes('drug_response') || sig.includes('drug response')) return 'drug_response';
  if (sig.includes('pathogenic')) return 'pathogenic_likely_pathogenic';
  if (sig.includes('risk_factor') || sig.includes('risk factor') || sig.includes('protective')) return 'risk_factor_protective';
  if (sig.includes('uncertain')) return 'vus';
  if (sig.includes('benign')) return 'benign';
  return 'other';
}

// ============================================================================
// Evidence Tier Assignment
// ============================================================================

/**
 * Get evidence tier for a ClinVar annotation based on clinical significance.
 * Tier 1: Pathogenic or drug response with reviewed status
 * Tier 2: Risk factor or protective
 * Tier 3: Uncertain significance
 */
function getClinVarEvidenceTier(annotation: ClinVarAnnotation): 1 | 2 | 3 {
  const category = categorizeSignificance(annotation.clinicalSignificance);
  switch (category) {
    case 'pathogenic':
    case 'drug_response':
      return 1;
    case 'risk_factor':
    case 'protective':
      return 2;
    case 'uncertain':
    default:
      return 3;
  }
}

/**
 * Flag variants in ACMG SF genes and enrich with condition/recommendation info.
 */
function enrichACMG(annotation: ClinVarAnnotation): void {
  const gene = annotation.geneInfo.split(':')[0] || annotation.geneInfo.split('|')[0] || '';
  if (gene && ACMG_SF_GENES.has(gene)) {
    annotation.isACMG = true;
    const info = ACMG_GENE_INFO[gene];
    if (info) {
      annotation.acmgCondition = info.condition;
      annotation.acmgRecommendation = info.recommendation;
    }
  }
}

/**
 * Filter for rare variants (MAF < threshold) using gnomAD AF data.
 * Default threshold: 0.01 (1%)
 */
export function isRare(gnomadAF: number | undefined, threshold: number = 0.01): boolean {
  return gnomadAF !== undefined && gnomadAF > 0 && gnomadAF < threshold;
}

// ============================================================================
// Core Functions
// ============================================================================

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Look up ClinVar annotations for a set of rsIDs using exact first-column matching.
 * Supports both the historical plain-text index and the packaged gzip index.
 * This avoids loading the full 344MB text index into Node memory and avoids
 * prefix false positives such as rs1801133 matching rs1801133286.
 */
function lookupClinVarByIndex(rsids: string[], indexPath: string): Map<string, ClinVarAnnotation> {
  const result = new Map<string, ClinVarAnnotation>();

  if (!fs.existsSync(indexPath)) {
    console.warn(`   ⚠️  ClinVar index not found at: ${indexPath}`);
    return result;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clinvar-lookup-'));
  const rsidFile = path.join(tempDir, 'lookup_rsids.txt');
  const normalizedRsids = Array.from(new Set(rsids.map(rsid => rsid.startsWith('rs') ? rsid : `rs${rsid}`)));
  fs.writeFileSync(rsidFile, normalizedRsids.join('\n'));

  try {
    const awk = `awk -F'|' 'NR==FNR { ids[$1]=1; next } ($1 in ids)' ${shellQuote(rsidFile)} -`;
    const command = indexPath.endsWith('.gz')
      ? `gzip -dc ${shellQuote(indexPath)} | ${awk}`
      : `cat ${shellQuote(indexPath)} | ${awk}`;
    const output = execFileSync('/bin/bash', ['-lc', command], {
      encoding: 'utf8',
      maxBuffer: 200 * 1024 * 1024, // 200MB — ClinVar matches are typically <10MB even with 2M+ rsIDs
    });

    for (const line of output.trim().split('\n')) {
      if (line.trim() === '') continue;
      const parts = line.split('|');
      if (parts.length < 3) continue;

      const rsid = parts[0].trim();
      const annotation: ClinVarAnnotation = {
        rsid,
        clinicalSignificance: parts[1] || 'not_provided',
        diseaseName: parts[2] || 'not_specified',
        geneInfo: parts[3] || 'unknown',
        reviewStatus: parts[4] || 'no_assertion',
        confidenceTier: getClinVarConfidenceTier(parts[1] || 'not_provided'),
      };

      // Keep most pathogenic annotation per rsID
      const existing = result.get(rsid);
      if (existing) {
        const existingCat = categorizeSignificance(existing.clinicalSignificance);
        const newCat = categorizeSignificance(annotation.clinicalSignificance);
        const priority: Record<string, number> = { pathogenic: 3, drug_response: 3, risk_factor: 2, protective: 2, uncertain: 1, benign: 0, other: 0 };
        if ((priority[newCat] || 0) > (priority[existingCat] || 0)) {
          result.set(rsid, annotation);
        }
      } else {
        result.set(rsid, annotation);
      }
    }
  } catch (err: any) {
    if (err.status !== 1) {
      console.warn(`   ClinVar lookup warning: ${err.message}`);
    }
  }

  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}

  return result;
}

/**
 * Query ClinVar for a set of rsIDs using the pre-built index.
 * Instant lookups — O(1) per rsID.
 */
export function queryClinVarForRSIDs(
  rsids: string[],
  clinvarIndexPath?: string
): ClinVarEnrichmentResult {
  const resolvedIndex = clinvarIndexPath || findClinVarInterpretationIndex();

  // Try pre-computed matches file first (fast!)
  const matchesPath = !resolvedIndex ? path.join(__dirname, '../../../../example-data/') : '';
  const preComputedPath = path.join(matchesPath, 'clinvar_matches.json');

  if (!resolvedIndex && fs.existsSync(preComputedPath)) {
    console.log(`🔍 Loading pre-computed ClinVar matches...`);
    const matches: ClinVarAnnotation[] = JSON.parse(fs.readFileSync(preComputedPath, 'utf-8'));
    const annotationMap = new Map(matches.map(m => [m.rsid, m]));

    let pathogenicCount = 0;
    let uncertainCount = 0;
    let drugResponseCount = 0;
    const found: ClinVarAnnotation[] = [];

    for (const rsid of rsids) {
      const annotation = annotationMap.get(rsid) || annotationMap.get(`rs${rsid}`);
      if (!annotation) continue;
      found.push(annotation);
      const category = categorizeSignificance(annotation.clinicalSignificance);
      if (category === 'pathogenic') pathogenicCount++;
      if (category === 'uncertain') uncertainCount++;
      if (category === 'drug_response') drugResponseCount++;
    }

    // Enrich with evidence tier, ACMG flags, and frequency (pre-computed path)
    for (const ann of found) {
      ann.confidenceTier = getClinVarConfidenceTier(ann.clinicalSignificance);
      ann.evidenceTier = getClinVarEvidenceTier(ann);
      enrichACMG(ann);
      enrichFrequency(ann);
    }

    console.log(`   Found: ${found.length} matches (${pathogenicCount} pathogenic, ${uncertainCount} uncertain, ${drugResponseCount} drug response)`);

    return {
      annotations: found,
      totalQueried: rsids.length,
      totalFound: found.length,
      pathogenicCount,
      uncertainCount,
      drugResponseCount,
    };
  }

  // Fallback: text-based lookup
  console.log(`🔍 Querying ClinVar text index for ${rsids.length} rsIDs...`);
  const annotations = lookupClinVarByIndex(rsids, resolvedIndex || path.join(
    __dirname, '../../../../reference/clinvar/clinvar_index.txt'
  ));

  if (rsids.length === 0) {
    return {
      annotations: [],
      totalQueried: 0,
      totalFound: 0,
      pathogenicCount: 0,
      uncertainCount: 0,
      drugResponseCount: 0,
    };
  }

  const annotationList: ClinVarAnnotation[] = [];
  let pathogenicCount = 0;
  let uncertainCount = 0;
  let drugResponseCount = 0;

  for (const rsid of rsids) {
    const annotation = annotations.get(rsid) || annotations.get(`rs${rsid}`);
    if (!annotation) continue;

    annotationList.push(annotation);

    const category = categorizeSignificance(annotation.clinicalSignificance);
    if (category === 'pathogenic') pathogenicCount++;
    if (category === 'uncertain') uncertainCount++;
    if (category === 'drug_response') drugResponseCount++;
  }

  // Enrich with evidence tier and ACMG flags (index lookup path)
  for (const ann of annotationList) {
    ann.confidenceTier = getClinVarConfidenceTier(ann.clinicalSignificance);
    ann.evidenceTier = getClinVarEvidenceTier(ann);
    enrichACMG(ann);
    enrichFrequency(ann);
  }

  console.log(`   Found: ${annotationList.length} annotations (${pathogenicCount} pathogenic, ${uncertainCount} uncertain, ${drugResponseCount} drug response)`);

  return {
    annotations: annotationList,
    totalQueried: rsids.length,
    totalFound: annotationList.length,
    pathogenicCount,
    uncertainCount,
    drugResponseCount,
  };
}

/**
 * Generate ClinVar-enriched alerts from annotations
 */
export function generateClinVarAlerts(
  annotations: ClinVarAnnotation[]
): Array<{
  itemName: string;
  tag: string;
  evidence: string;
  action: string;
  gene: string;
  rsid: string;
}> {
  const alerts: Array<{ itemName: string; tag: string; evidence: string; action: string; gene: string; rsid: string }> = [];

  for (const ann of annotations) {
    const category = categorizeSignificance(ann.clinicalSignificance);
    const gene = ann.geneInfo.split(':')[0] || ann.geneInfo.split('|')[0] || 'Unknown';
    const disease = ann.diseaseName.replace(/_/g, ' ');

    let tag: string;
    let action: string;

    // Build ACMG-specific action text if applicable
    let acmgSuffix = '';
    if (ann.isACMG && ann.acmgCondition) {
      acmgSuffix = ` [ACMG Secondary Finding: ${ann.acmgCondition}. This is NOT a clinical diagnosis. Confirmatory clinical testing required. ${ann.acmgRecommendation || 'Consult a genetic counselor.'}]`;
    }

    // Rare variant flag
    let rarePrefix = '';
    if (ann.isRare && category === 'pathogenic') {
      rarePrefix = 'RARE PATHOGENIC VARIANT: ';
    }

    switch (category) {
      case 'pathogenic':
        tag = '⚠️ Medical Alert';
        action = `${rarePrefix}ClinVar ${ann.clinicalSignificance} for ${disease}. Consult with genetic counselor.${acmgSuffix}`;
        break;
      case 'drug_response':
        tag = '⚠️ Medical Alert';
        action = 'Pharmacogenomic variant. Review medication list with physician.';
        break;
      case 'protective':
        tag = '🟢 Superpower';
        action = `Protective variant for ${disease}`;
        break;
      case 'risk_factor':
        tag = '🛑 Risk Mitigation';
        action = `Risk factor for ${disease}. Discuss screening with physician.`;
        break;
      case 'uncertain':
        tag = 'ℹ️ Dietary Rule';
        action = `Variant of uncertain significance for ${disease}. Monitor for clinical updates.`;
        break;
      default:
        continue;
    }

    alerts.push({
      itemName: gene,
      tag,
      evidence: `${ann.clinicalSignificance} — ${disease}`,
      action,
      gene,
      rsid: ann.rsid,
    });
  }

  return alerts;
}

// ============================================================================
// Frequency enrichment
// ============================================================================

/**
 * Assign a human-readable population frequency label based on gnomAD AF.
 */
export function enrichFrequency(annotation: ClinVarAnnotation): void {
  if (annotation.populationFrequency) return; // already set
  const af = annotation.gnomadAF;
  if (af !== undefined && af > 0) {
    if (af < 0.01) {
      annotation.populationFrequency = "Rare (<1%)";
      annotation.isRare = true;
    } else if (af < 0.05) {
      annotation.populationFrequency = "Uncommon (1-5%)";
    } else {
      annotation.populationFrequency = "Common (>5%)";
    }
  } else if (annotation.isRare) {
    annotation.populationFrequency = "Rare (<1%)";
  } else {
    annotation.populationFrequency = "Common (>5%)";
  }
}

// ============================================================================
// Consumer variant annotation generation
// ============================================================================

/**
 * Generate a consumer-facing annotation paragraph for a ClinVar variant.
 *
 * Pattern: `[clinical importance], [classification] — [plain language explanation]`
 *
 * Clinical importance tiers:
 *   "High clinical importance" = Pathogenic/Likely pathogenic + ACMG gene
 *   "Moderate clinical importance" = Pathogenic/Likely pathogenic (non-ACMG) or drug response with strong evidence
 *   "Low clinical importance" = Uncertain significance or benign with functional evidence
 *   "Population" = Benign, common polymorphism
 *
 * Zygosity-aware language: "One copy" / "Two copies" / carrier status interpretation
 * Frequency-aware language: "Rare (fewer than 1 in 100 people)" / "Uncommon (1-5% of population)"
 */
export function generateVariantAnnotation(
  annotation: ClinVarAnnotation,
  zygosity: "Homozygous" | "Heterozygous" = "Heterozygous",
  caddScore?: number
): string {
  const gene = annotation.geneInfo.split(":")[0] || annotation.geneInfo.split("|")[0] || "";
  const disease = annotation.diseaseName.replace(/_/g, " ").replace(/not_specified|not provided/i, "").trim();
  const significance = categorizeSignificance(annotation.clinicalSignificance);
  const freq = annotation.populationFrequency || "Unknown";
  const reviewed = annotation.reviewStatus.includes("expert") || annotation.reviewStatus.includes("practice");

  // Build clinical importance prefix
  let importance: string;
  if ((significance === "pathogenic" || significance === "drug_response") && annotation.isACMG) {
    importance = "High clinical importance";
  } else if (significance === "pathogenic" || significance === "drug_response") {
    importance = "Moderate clinical importance";
  } else if (significance === "uncertain" || significance === "risk_factor") {
    importance = "Low clinical importance";
  } else if (significance === "protective") {
    importance = "Protective finding";
  } else {
    importance = "Population";
  }

  // Build classification string
  const classification = annotation.clinicalSignificance.replace(/_/g, " ").replace(/Pathogenic\/Likely_pathogenic/g, "Pathogenic/Likely Pathogenic");

  // Build plain-language explanation
  let explanation = "";

  // Zygosity-aware language
  if (zygosity === "Homozygous") {
    explanation += `You have two copies of this ${gene} variant. `;
  } else {
    explanation += `You have one copy of this ${gene} variant. `;
  }

  // Add disease context
  if (disease) {
    if (significance === "pathogenic") {
      explanation += `This variant is associated with ${disease}. `;
    } else if (significance === "drug_response") {
      explanation += `This variant may affect how your body responds to ${disease || "certain medications"}. `;
    } else if (significance === "risk_factor") {
      explanation += `This variant is a risk factor for ${disease}. `;
    } else if (significance === "protective") {
      explanation += `This variant appears to be protective against ${disease}. `;
    } else if (significance === "uncertain") {
      explanation += `The clinical significance of this variant for ${disease} is currently uncertain. `;
    } else {
      explanation += `This variant is a common polymorphism not associated with ${disease}. `;
    }
  } else {
    if (significance === "pathogenic") {
      explanation += `This variant has been classified as pathogenic. `;
    } else if (significance === "drug_response") {
      explanation += `This variant may affect how your body responds to certain medications. `;
    } else if (significance === "uncertain") {
      explanation += `The clinical significance of this variant is currently uncertain. `;
    } else {
      explanation += `This is a common genetic variant. `;
    }
  }

  // Add frequency context
  if (freq === "Rare (<1%)") {
    explanation += "This variant is rare (found in fewer than 1 in 100 people).";
  } else if (freq === "Uncommon (1-5%)") {
    explanation += "This variant is uncommon (found in 1-5% of the population).";
  } else {
    explanation += "This variant is common in the general population.";
  }

  // Add CADD score if available
  if (caddScore !== undefined && caddScore > 0) {
    const caddLabel = caddScore >= 20 ? "likely damaging" : caddScore >= 10 ? "possibly damaging" : "likely benign";
    explanation += ` The CADD score is ${caddScore.toFixed(1)}, which is ${caddLabel}.`;
  }

  // Add review status note
  if (reviewed) {
    explanation += " This classification has been reviewed by an expert panel.";
  } else if (annotation.reviewStatus.includes("criteria") || annotation.reviewStatus.includes("multiple")) {
    explanation += " This classification is supported by multiple submitters.";
  }

  // Add ACMG note if applicable
  if (annotation.isACMG && annotation.acmgCondition) {
    explanation += ` This gene is on the ACMG secondary findings list for ${annotation.acmgCondition}.`;
  }

  return `${importance}, ${classification} — ${explanation}`;
}

// ============================================================================
// Variant category assignment for dashboard tab
// ============================================================================

/**
 * Categorize a ClinVar variant into one of 5 tab categories matching Dante Labs.
 *
 * Priority order (first match wins):
 *   1. "genetic_conditions" — Expert reviewed + disease-associated + not drug response
 *   2. "drug_response" — clinicalSignificance contains "drug_response"
 *   3. "other_risks" — Pathogenic/Likely pathogenic, not reviewed by expert panel
 *   4. "rare_mutations" — Frequency < 1% (isRare flag)
 *   5. "uncommon_mutations" — Frequency 1-5%
 */
export function categorizeVariantForTab(annotation: ClinVarAnnotation): VariantCategory {
  const significance = categorizeSignificance(annotation.clinicalSignificance);
  const reviewed = annotation.reviewStatus.includes("expert") || annotation.reviewStatus.includes("practice");
  const freq = annotation.populationFrequency || "";

  // 1. Genetic Conditions: expert reviewed + disease-associated + not drug response
  if (reviewed && significance !== "drug_response" && significance !== "benign") {
    return "genetic_conditions";
  }

  // 2. Drug Response
  if (significance === "drug_response") {
    return "drug_response";
  }

  // 3. Other Risks: pathogenic but not expert reviewed
  if (significance === "pathogenic" || significance === "risk_factor") {
    return "other_risks";
  }

  // 4. Rare mutations: frequency < 1%
  if (freq === "Rare (<1%)") {
    return "rare_mutations";
  }

  // 5. Uncommon mutations: frequency 1-5%
  if (freq === "Uncommon (1-5%)") {
    return "uncommon_mutations";
  }

  // Default: benign/uncertain go to uncommon if not yet categorized
  // Protective variants go to genetic conditions if reviewed, otherwise other risks
  if (significance === "protective") {
    return reviewed ? "genetic_conditions" : "other_risks";
  }

  // Uncertain with isRare flag
  if (significance === "uncertain" && annotation.isRare) {
    return "rare_mutations";
  }

  // Everything else: uncommon or genetic conditions based on review status
  return reviewed ? "genetic_conditions" : "uncommon_mutations";
}
