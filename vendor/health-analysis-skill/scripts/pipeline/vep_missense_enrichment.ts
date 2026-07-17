/**
 * VEP Missense Enrichment — Longevity Gene Focus
 *
 * Annotates missense variants in longevity/wellness pathway genes using
 * VEP functional predictions (SIFT, PolyPhen, CADD, gnomAD AF) and maps
 * them to trait scores. Complements the rare-variant VEP filter by
 * capturing common missense variants with functional impact in genes
 * relevant to healthspan and longevity.
 *
 * Runs after VEP annotation in the main pipeline. Consumes VEP results
 * and outputs trait scores that merge into the existing trait pipeline.
 */

import type { VEPAnnotation } from './vep_annotation.js';

// ============================================================================
// Types
// ============================================================================

export interface MissenseCall {
  rsid: string;
  gene: string;
  consequence: string;
  proteinChange: string;
  siftScore: number;
  polyphenScore: number;
  caddScore: number;
  gnomadAF: number;
  impact: string;
  traitId: string;
  functionalSignificance: 'damaging' | 'possibly_damaging' | 'benign' | 'unknown';
}

export interface MissenseEnrichmentResult {
  calls: MissenseCall[];
  totalMissense: number;
  longevityGeneHits: number;
  damagingCalls: number;
  genesFound: string[];
}

// ============================================================================
// Longevity & Wellness Pathway Genes
//
// Curated from:
//   - GenAge database (307 aging-associated genes)
//   - Hallmarks of Aging (Lopez-Otin 2023)
//   - DrugAge/ Geroprotectors database
//   - Clinical longevity biomarker GWAS
// ============================================================================

export const LONGEVITY_GENES = new Set([
  // === Core Longevity Pathways ===
  'FOXO3',     // Forkhead box O3 — master longevity transcription factor
  'FOXO1',     // Insulin/IGF-1 signaling, stress resistance
  'FOXO4',     // Senescence, p53 interaction
  'SIRT1',     // NAD+-dependent deacetylase — calorie restriction mediator
  'SIRT2',     // Cell cycle, oxidative stress
  'SIRT3',     // Mitochondrial sirtuin — fatty acid oxidation, ROS defense
  'SIRT4',     // Mitochondrial — insulin secretion, fatty acid metabolism
  'SIRT5',     // Mitochondrial — desuccinylase, ammonia detoxification
  'SIRT6',     // DNA repair, telomere maintenance, NF-kB suppression
  'SIRT7',     // rDNA transcription, stress response
  'MTOR',      // Mechanistic target of rapamycin — nutrient sensing
  'AKT1',      // AKT/PKB — insulin/PI3K signaling
  'AKT2',      // Insulin signaling, glucose homeostasis
  'IGF1',      // Insulin-like growth factor 1
  'IGF1R',     // IGF-1 receptor — longevity pathway
  'IGFBP3',    // IGF binding protein 3
  'INSR',      // Insulin receptor
  'IRS1',      // Insulin receptor substrate 1
  'IRS2',      // Insulin receptor substrate 2
  'PIK3CA',    // PI3K catalytic subunit
  'PIK3R1',    // PI3K regulatory subunit
  'PTEN',      // PI3K/AKT/mTOR suppressor — tumor + aging
  'TSC1',      // mTORC1 negative regulator
  'TSC2',      // mTORC1 negative regulator

  // === AMPK & Energy Sensing ===
  'PRKAA1',    // AMPK alpha-1 catalytic subunit
  'PRKAA2',    // AMPK alpha-2 — energy sensor
  'PRKAB1',    // AMPK beta-1
  'PRKAB2',    // AMPK beta-2
  'PRKAG1',    // AMPK gamma-1
  'PRKAG2',    // AMPK gamma-2
  'PRKAG3',    // AMPK gamma-3 — skeletal muscle

  // === Klotho & Anti-Aging ===
  'KL',        // Klotho — systemic anti-aging factor, FGF23 co-receptor
  'FGF23',     // Fibroblast growth factor 23 — phosphate/vitamin D
  'CLU',       // Clusterin/ApoJ — chaperone, longevity associated

  // === Telomere Maintenance ===
  'TERT',      // Telomerase reverse transcriptase
  'TERC',      // Telomerase RNA component
  'POT1',      // Protection of telomeres 1
  'TINF2',     // TERF1-interacting nuclear factor 2
  'ACD',       // Adrenocortical dysplasia homolog (TPP1)
  'RTEL1',     // Regulator of telomere elongation helicase

  // === DNA Repair & Genome Stability ===
  'TP53',      // p53 — guardian of genome, senescence
  'ATM',       // Ataxia telangiectasia mutated — DNA damage response
  'ATR',       // ATM-related — replication stress
  'BRCA1',     // Homologous recombination repair
  'BRCA2',     // Homologous recombination repair
  'WRN',       // Werner syndrome RecQ helicase — premature aging
  'BLM',       // Bloom syndrome helicase
  'ERCC1',     // Nucleotide excision repair
  'ERCC2',     // XPD — NER, transcription
  'ERCC4',     // XPF — DNA repair endonuclease
  'ERCC5',     // XPG — NER endonuclease
  'ERCC6',     // CSB — transcription-coupled repair
  'ERCC8',     // CSA — transcription-coupled repair
  'XRCC1',     // Base excision repair scaffold
  'XRCC5',     // Ku80 — NHEJ
  'XRCC6',     // Ku70 — NHEJ
  'OGG1',      // 8-oxoguanine glycosylase — oxidative damage repair
  'MUTYH',     // Adenine glycosylase — oxidative damage
  'NTHL1',     // Endonuclease III-like 1
  'NEIL1',     // Endonuclease VIII-like 1
  'PARP1',     // Poly-ADP-ribose polymerase — DNA damage sensor

  // === Proteostasis & Autophagy ===
  'ATG5',      // Autophagy protein 5
  'ATG7',      // Autophagy protein 7
  'BECN1',     // Beclin-1 — autophagy initiation
  'SQSTM1',    // p62 — autophagy receptor
  'LAMP2',     // Lysosomal membrane protein — chaperone-mediated autophagy
  'LAMP3',     // Lysosomal protein
  'UBQLN2',    // Ubiquilin 2 — proteasome shuttle
  'PSEN1',     // Presenilin-1 — gamma-secretase, APP processing
  'PSEN2',     // Presenilin-2
  'HSPA1A',    // HSP70 — heat shock response, protein folding
  'HSPA1B',    // HSP70 variant
  'HSPA8',     // HSC70 — constitutive chaperone
  'HSPA9',     // Mortalin/mtHSP70 — mitochondrial chaperone, senescence
  'HSPD1',     // HSP60 — mitochondrial protein folding
  'HSP90AA1',  // HSP90 — client protein maturation
  'HSPB1',     // HSP27 — small heat shock protein

  // === Mitochondrial Function ===
  'PPARGC1A',  // PGC-1α — mitochondrial biogenesis master regulator
  'TFAM',      // mtDNA transcription factor
  'NRF1',      // Nuclear respiratory factor 1
  'MFN1',      // Mitofusin 1 — mitochondrial fusion
  'MFN2',      // Mitofusin 2
  'OPA1',      // Optic atrophy 1 — mitochondrial fusion
  'DNM1L',     // DRP1 — mitochondrial fission
  'FIS1',      // Mitochondrial fission 1
  'PINK1',     // Mitophagy, Parkinson's
  'PRKN',      // Parkin — mitophagy
  'UCP1',      // Uncoupling protein 1 — thermogenesis
  'UCP2',      // Uncoupling protein 2 — ROS modulation
  'UCP3',      // Uncoupling protein 3 — muscle
  'SOD2',      // MnSOD — mitochondrial superoxide dismutase
  'CAT',       // Catalase — H2O2 detoxification
  'GPX1',      // Glutathione peroxidase 1
  'GPX4',      // Glutathione peroxidase 4 — ferroptosis
  'PRDX1',     // Peroxiredoxin 1 — antioxidant
  'PRDX3',     // Peroxiredoxin 3 — mitochondrial
  'TXN',       // Thioredoxin — redox regulation
  'TXN2',      // Thioredoxin 2 — mitochondrial
  'TRXR1',     // Thioredoxin reductase 1
  'GSR',       // Glutathione reductase

  // === Nutrient Sensing & Metabolism ===
  'NAMPT',     // Nicotinamide phosphoribosyltransferase — NAD+ salvage
  'NMNAT1',    // NMN adenylyltransferase 1 — nuclear NAD+
  'NMNAT2',    // NMNAT2 — axonal NAD+
  'NMNAT3',    // NMNAT3 — mitochondrial NAD+
  'NNMT',      // Nicotinamide N-methyltransferase — NAD+ sink
  'CD38',      // NADase — NAD+ degradation (increases with age)
  'BST1',      // CD157 — NADase
  'SLC5A8',    // Short-chain fatty acid transporter
  'SLC16A1',   // MCT1 — lactate/pyruvate transporter
  'PPARA',     // PPAR-alpha — fatty acid oxidation
  'PPARD',     // PPAR-delta — endurance
  'PPARG',     // PPAR-gamma — adipogenesis, insulin sensitivity
  'NR1H3',     // LXR-alpha — cholesterol homeostasis
  'NR1H2',     // LXR-beta
  'HNF4A',     // Hepatocyte nuclear factor 4 alpha

  // === Inflammation & Inflammaging ===
  'NFKB1',     // NF-kB p105/p50 — master inflammatory transcription factor
  'NFKB2',     // NF-kB p100/p52
  'RELA',      // NF-kB p65
  'NLRP3',     // Inflammasome sensor
  'IL1B',      // Interleukin 1 beta — inflammaging
  'IL6',       // Interleukin 6 — inflammaging
  'TNF',       // Tumor necrosis factor
  'CRP',       // C-reactive protein
  'IL10',      // Interleukin 10 — anti-inflammatory
  'TGFB1',     // TGF-beta — tissue repair, senescence

  // === Epigenetic Regulation ===
  'DNMT1',     // DNA methyltransferase 1 — maintenance
  'DNMT3A',    // DNA methyltransferase 3A — de novo, epigenetic clock
  'DNMT3B',    // DNA methyltransferase 3B
  'TET1',      // Ten-eleven translocation — DNA demethylation
  'TET2',      // TET2 — clonal hematopoiesis, aging
  'TET3',      // TET3
  'HDAC1',     // Histone deacetylase 1
  'HDAC2',     // Histone deacetylase 2
  'HDAC3',     // Histone deacetylase 3
  'HDAC4',     // Histone deacetylase 4
  'SIRT1',     // (already listed — NAD+-dependent deacetylase)

  // === Senescence & SASP ===
  'CDKN2A',    // p16/INK4a — senescence marker
  'CDKN1A',    // p21 — senescence, DNA damage
  'CDKN1B',    // p27 — cell cycle
  'RB1',       // Retinoblastoma — cell cycle
  'LMNB1',     // Lamin B1 — nuclear lamina, senescence marker
  'HMGA1',     // High mobility group AT-hook 1 — senescence
  'HMGA2',     // HMGA2 — senescence, height

  // === Stem Cells & Regeneration ===
  'OCT4',      // POU5F1 — pluripotency
  'SOX2',      // SRY-box 2 — neural stem cells
  'NANOG',     // Pluripotency factor
  'KLF4',      // Kruppel-like factor 4 — reprogramming
  'MYC',       // c-Myc — reprogramming, cancer
  'LIN28A',    // RNA-binding protein — reprogramming, metabolism
  'LIN28B',    // LIN28B
  'WNT3A',     // Wnt signaling — stem cell maintenance
  'CTNNB1',    // Beta-catenin — Wnt pathway
  'NOTCH1',    // Notch signaling — stem cells
  'JAG1',      // Jagged 1 — Notch ligand
  'DLL1',      // Delta-like 1

  // === Additional Longevity-Associated Genes ===
  'APOE',      // Apolipoprotein E — Alzheimer's, cardiovascular, longevity
  'CETP',      // Cholesteryl ester transfer protein — longevity
  'LPA',       // Lipoprotein(a) — cardiovascular aging
  'PCSK9',     // Proprotein convertase subtilisin/kexin type 9 — LDL
  'LDLR',      // LDL receptor
  'APOB',      // Apolipoprotein B
  'MTHFR',     // Methylenetetrahydrofolate reductase — methylation
  'MTR',       // Methionine synthase — B12/folate cycle
  'MTRR',      // Methionine synthase reductase
  'CBS',       // Cystathionine-beta-synthase — transsulfuration
  'BHMT',      // Betaine-homocysteine methyltransferase
  'TCN2',      // Transcobalamin II — B12 transport
  'FUT2',      // Fucosyltransferase 2 — B12 levels, microbiome
  'GC',        // Vitamin D binding protein
  'VDR',       // Vitamin D receptor
  'CYP2R1',    // Vitamin D 25-hydroxylase
  'CYP27B1',   // Vitamin D 1-alpha-hydroxylase
  'CYP24A1',   // Vitamin D 24-hydroxylase
  'SHBG',      // Sex hormone binding globulin — hormonal aging
  'ESR1',      // Estrogen receptor alpha — bone, cardiovascular
  'ESR2',      // Estrogen receptor beta
  'AR',        // Androgen receptor — muscle, bone
  'GH1',       // Growth hormone 1
  'GHR',       // Growth hormone receptor
  'GHRHR',     // GHRH receptor
]);

// ============================================================================
// Well-known longevity SNPs with published functional evidence
// (These are specific variants in longevity genes with known impact)
// ============================================================================

export const CURATED_LONGEVITY_VARIANTS: Array<{
  rsid: string;
  gene: string;
  effect: string;
  trait: string;
  impact: 'positive' | 'negative' | 'neutral';
  citation: string;
}> = [
  { rsid: 'rs2802292', gene: 'FOXO3', effect: 'Associated with exceptional longevity (centenarian studies). Enhances FOXO3 expression.', trait: 'longevity_pathway', impact: 'positive', citation: 'Willcox 2008 PNAS; Flachsbart 2009' },
  { rsid: 'rs2764264', gene: 'FOXO3', effect: 'FOXO3 longevity-associated haplotype. Reduced insulin/IGF-1 signaling sensitivity.', trait: 'longevity_pathway', impact: 'positive', citation: 'Willcox 2008 PNAS' },
  { rsid: 'rs1935949', gene: 'FOXO3', effect: 'FOXO3 variant linked to reduced cancer mortality in long-lived individuals.', trait: 'longevity_pathway', impact: 'positive', citation: 'Flachsbart 2009' },
  { rsid: 'rs9536314', gene: 'KL', effect: 'KL-VS haplotype — associated with increased klotho levels and longevity. May enhance cognitive function.', trait: 'klotho_anti_aging', impact: 'positive', citation: 'Arking 2002; Dubal 2014 Cell Reports' },
  { rsid: 'rs9527025', gene: 'KL', effect: 'Klotho variant near KL gene — associated with longevity and reduced cardiovascular mortality.', trait: 'klotho_anti_aging', impact: 'positive', citation: 'Arking 2002' },
  { rsid: 'rs1042522', gene: 'TP53', effect: 'TP53 Arg72Pro. Pro variant associated with reduced apoptosis but potentially higher longevity when combined with other protective variants.', trait: 'genome_stability', impact: 'neutral', citation: 'Dumont 2003 Nature Genetics' },
  { rsid: 'rs1800795', gene: 'IL6', effect: 'IL6 promoter G-174C. C allele = higher IL-6, increased inflammaging. G allele associated with longevity in some populations.', trait: 'inflammation', impact: 'negative', citation: 'Franceschi 2007' },
  { rsid: 'rs2228145', gene: 'IL6R', effect: 'IL6R Asp358Ala. C allele = reduced membrane-bound IL6R, lower IL-6 signaling. Associated with reduced CRP.', trait: 'inflammation', impact: 'positive', citation: 'IL6R Genetics Consortium 2012' },
  { rsid: 'rs1801198', gene: 'TCN2', effect: 'Transcobalamin II Pro259Arg. Affects B12 transport efficiency.', trait: 'b12_metabolism', impact: 'neutral', citation: 'Afman 2001' },
  { rsid: 'rs11549465', gene: 'HIF1A', effect: 'HIF1A Pro582Ser. Enhanced hypoxia response, potentially better stress adaptation.', trait: 'hypoxia_response', impact: 'positive', citation: 'Tanimoto 2003' },
  { rsid: 'rs8192678', gene: 'PPARGC1A', effect: 'PGC-1α Gly482Ser. Affects mitochondrial biogenesis and aerobic capacity.', trait: 'mitochondrial_biogenesis', impact: 'neutral', citation: 'Stefan 2007 Diabetes' },
  { rsid: 'rs4880', gene: 'SOD2', effect: 'MnSOD Ala16Val. TT (Val/Val) = reduced SOD2 efficiency, higher oxidative stress.', trait: 'oxidative_stress', impact: 'negative', citation: 'Sutton 2003' },
  { rsid: 'rs1001179', gene: 'CAT', effect: 'Catalase promoter C-262T. T allele = lower catalase expression, reduced H2O2 defense.', trait: 'oxidative_stress', impact: 'negative', citation: 'Forsberg 2001' },
  { rsid: 'rs662799', gene: 'APOA5', effect: 'APOA5 promoter -1131T>C. C allele = higher triglycerides, CVD risk.', trait: 'triglyceride_metabolism', impact: 'negative', citation: 'Pennacchio 2001' },
  { rsid: 'rs1761667', gene: 'CD36', effect: 'CD36 variant affecting fat taste perception and lipid metabolism.', trait: 'lipid_metabolism', impact: 'neutral', citation: 'Pepino 2012' },
  { rsid: 'rs2282679', gene: 'GC', effect: 'GC (vitamin D binding protein) — lower circulating 25(OH)D.', trait: 'vitamin_d', impact: 'negative', citation: 'Wang 2010 Lancet' },
  { rsid: 'rs12785878', gene: 'DHCR7', effect: 'DHCR7 variant — reduced vitamin D synthesis from sun exposure.', trait: 'vitamin_d', impact: 'negative', citation: 'Wang 2010 Lancet' },
  { rsid: 'rs12086634', gene: 'TERT', effect: 'TERT variant associated with telomere length. G allele = shorter telomeres.', trait: 'telomere_maintenance', impact: 'negative', citation: 'Codd 2013 Nature Genetics' },
  { rsid: 'rs2075786', gene: 'TERT', effect: 'TERT intronic variant — influences telomerase expression.', trait: 'telomere_maintenance', impact: 'neutral', citation: 'Bojesen 2013' },
  { rsid: 'rs1051730', gene: 'CHRNA3', effect: 'Nicotinic receptor variant — strongly associated with smoking intensity. Affects healthspan.', trait: 'smoking_cessation', impact: 'negative', citation: 'Thorgeirsson 2008 Nature' },
  { rsid: 'rs16969968', gene: 'CHRNA5', effect: 'CHRNA5 variant — nicotine dependence. Strongest genetic predictor of smoking heaviness.', trait: 'smoking_cessation', impact: 'negative', citation: 'Bierut 2008' },
  { rsid: 'rs1801133', gene: 'MTHFR', effect: 'MTHFR C677T. T allele = reduced MTHFR activity, higher homocysteine. Impacts methylation and cardiovascular risk.', trait: 'methylation', impact: 'negative', citation: 'Frosst 1995 Nature Genetics' },
  { rsid: 'rs4680', gene: 'COMT', effect: 'COMT Val158Met. Met allele = reduced COMT activity, higher dopamine. Affects cognitive function and stress response.', trait: 'dopamine_metabolism', impact: 'neutral', citation: 'Chen 2004' },
  { rsid: 'rs6265', gene: 'BDNF', effect: 'BDNF Val66Met. Met allele = reduced BDNF secretion, impacts neuroplasticity and cognitive aging.', trait: 'neuroplasticity', impact: 'negative', citation: 'Egan 2003 Cell' },
  { rsid: 'rs429358', gene: 'APOE', effect: 'APOE e4 allele — strongest common genetic risk factor for Alzheimer\'s and CVD.', trait: 'lipid_transport', impact: 'negative', citation: 'Corder 1993 Science' },
  { rsid: 'rs7412', gene: 'APOE', effect: 'APOE e2 allele — protective for Alzheimer\'s, lower LDL, associated with longevity.', trait: 'lipid_transport', impact: 'positive', citation: 'Corder 1994 Nature Genetics' },
];

// ============================================================================
// SIFT / PolyPhen thresholds
// ============================================================================

const SIFT_DAMAGING = 0.05;
const POLYPHEN_PROBABLY_DAMAGING = 0.909;
const POLYPHEN_POSSIBLY_DAMAGING = 0.447;

// ============================================================================
// Core function: extract missense calls for longevity genes
// ============================================================================

/**
 * Extract missense variants in longevity/wellness pathway genes from VEP output.
 *
 * @param vepAnnotations — Map<variantKey, VEPAnnotation> from VEP.tsv output
 * @param userGenotypes — Map<rsid, genotype> for dosage counting
 * @returns MissenseEnrichmentResult with scored calls
 */
export function enrichVEPMissenseLongevity(
  vepAnnotations: Map<string, VEPAnnotation>,
  userGenotypes?: Map<string, string>
): MissenseEnrichmentResult {
  const calls: MissenseCall[] = [];
  let totalMissense = 0;
  const genesFound: string[] = [];

  for (const [key, ann] of vepAnnotations) {
    // Count all missense variants
    const isMissense = /missense/i.test(ann.consequence || '');
    const isInframe = /inframe/i.test(ann.consequence || '');
    if (isMissense || isInframe) {
      totalMissense++;
    } else {
      continue; // Only process amino-acid-changing variants
    }

    // Check if in a longevity gene
    const gene = (ann.gene || '').toUpperCase();
    if (!gene || !LONGEVITY_GENES.has(gene)) continue;

    if (!genesFound.includes(gene)) {
      genesFound.push(gene);
    }

    // Parse functional scores
    const siftScore = parseSIFT(ann.sift || '');
    const polyphenScore = parsePolyPhen(ann.polyphen || '');
    const caddScore = ann.cadd_phred || ann.cadd_raw || 0;
    const gnomadAF = ann.gnomadAF || 0;

    // Determine functional significance
    const functionalSignificance = classifyMissense(siftScore, polyphenScore, caddScore);

    // Map to trait ID
    const traitId = mapLongevityGeneToTrait(gene);

    // Get genotype if available
    const rsid = key.includes(':') ? '' : key;
    const dosage = rsid && userGenotypes
      ? countDosage(userGenotypes.get(rsid))
      : 0;

    calls.push({
      rsid,
      gene,
      consequence: ann.consequence || '',
      proteinChange: ann.proteinChange || '',
      siftScore,
      polyphenScore,
      caddScore,
      gnomadAF,
      impact: ann.impact || 'MODERATE',
      traitId,
      functionalSignificance,
    });
  }

  const damagingCalls = calls.filter(c =>
    c.functionalSignificance === 'damaging' || c.functionalSignificance === 'possibly_damaging'
  ).length;

  return {
    calls,
    totalMissense,
    longevityGeneHits: calls.length,
    damagingCalls,
    genesFound,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function parseSIFT(siftStr: string): number {
  // SIFT format: "deleterious(0.01)" or "tolerated(0.5)"
  const match = siftStr.match(/\(([0-9.]+)\)/);
  return match ? parseFloat(match[1]) : -1;
}

function parsePolyPhen(polyStr: string): number {
  // PolyPhen format: "probably_damaging(0.98)" or "benign(0.05)"
  const match = polyStr.match(/\(([0-9.]+)\)/);
  return match ? parseFloat(match[1]) : -1;
}

function classifyMissense(
  sift: number,
  polyphen: number,
  cadd: number
): 'damaging' | 'possibly_damaging' | 'benign' | 'unknown' {
  let damagingEvidence = 0;

  if (sift >= 0 && sift < SIFT_DAMAGING) damagingEvidence++;
  if (polyphen >= POLYPHEN_PROBABLY_DAMAGING) damagingEvidence++;
  if (cadd > 20) damagingEvidence++;

  if (damagingEvidence >= 2) return 'damaging';
  if (damagingEvidence >= 1) return 'possibly_damaging';

  if (sift >= 0 || polyphen >= 0) return 'benign';

  return 'unknown';
}

/**
 * Map a longevity gene to its primary trait ID in the knowledge graph.
 */
function mapLongevityGeneToTrait(gene: string): string {
  const map: Record<string, string> = {
    // Core longevity pathways
    FOXO3: 'longevity_pathway',
    FOXO1: 'longevity_pathway',
    FOXO4: 'senescence',
    SIRT1: 'longevity_pathway',
    SIRT2: 'cell_cycle',
    SIRT3: 'mitochondrial_function',
    SIRT4: 'mitochondrial_function',
    SIRT5: 'mitochondrial_function',
    SIRT6: 'dna_repair',
    SIRT7: 'genome_stability',
    MTOR: 'mTOR_signaling',
    AKT1: 'insulin_signaling',
    AKT2: 'insulin_signaling',
    IGF1: 'insulin_signaling',
    IGF1R: 'insulin_signaling',
    IGFBP3: 'insulin_signaling',
    INSR: 'insulin_signaling',
    IRS1: 'insulin_signaling',
    IRS2: 'insulin_signaling',
    PIK3CA: 'cell_cycle',
    PIK3R1: 'insulin_signaling',
    PTEN: 'genome_stability',

    // mTOR
    TSC1: 'mTOR_signaling',
    TSC2: 'mTOR_signaling',

    // AMPK
    PRKAA1: 'energy_metabolism',
    PRKAA2: 'energy_metabolism',
    PRKAB1: 'energy_metabolism',
    PRKAB2: 'energy_metabolism',
    PRKAG1: 'energy_metabolism',
    PRKAG2: 'energy_metabolism',
    PRKAG3: 'energy_metabolism',

    // Klotho
    KL: 'klotho_anti_aging',
    FGF23: 'bone_health',
    CLU: 'neurodegeneration_risk',

    // Telomere
    TERT: 'telomere_maintenance',
    TERC: 'telomere_maintenance',
    POT1: 'telomere_maintenance',
    TINF2: 'telomere_maintenance',
    ACD: 'telomere_maintenance',
    RTEL1: 'telomere_maintenance',

    // DNA repair
    TP53: 'genome_stability',
    ATM: 'dna_repair',
    ATR: 'dna_repair',
    BRCA1: 'dna_repair',
    BRCA2: 'dna_repair',
    WRN: 'genome_stability',
    BLM: 'genome_stability',
    ERCC1: 'dna_repair',
    ERCC2: 'dna_repair',
    ERCC4: 'dna_repair',
    ERCC5: 'dna_repair',
    ERCC6: 'dna_repair',
    ERCC8: 'dna_repair',
    XRCC1: 'dna_repair',
    XRCC5: 'dna_repair',
    XRCC6: 'dna_repair',
    OGG1: 'dna_repair',
    MUTYH: 'dna_repair',
    NTHL1: 'dna_repair',
    NEIL1: 'dna_repair',
    PARP1: 'dna_repair',

    // Proteostasis
    ATG5: 'proteasome_autophagy',
    ATG7: 'proteasome_autophagy',
    BECN1: 'proteasome_autophagy',
    SQSTM1: 'proteasome_autophagy',
    LAMP2: 'proteasome_autophagy',
    UBQLN2: 'protein_homeostasis',
    PSEN1: 'neurodegeneration_risk',
    PSEN2: 'neurodegeneration_risk',
    HSPA1A: 'protein_homeostasis',
    HSPA1B: 'protein_homeostasis',
    HSPA8: 'protein_homeostasis',
    HSPA9: 'mitochondrial_function',
    HSPD1: 'protein_homeostasis',
    HSP90AA1: 'protein_homeostasis',
    HSPB1: 'protein_homeostasis',

    // Mitochondrial
    PPARGC1A: 'mitochondrial_biogenesis',
    TFAM: 'mitochondrial_function',
    NRF1: 'mitochondrial_biogenesis',
    MFN1: 'mitochondrial_function',
    MFN2: 'mitochondrial_function',
    OPA1: 'mitochondrial_function',
    DNM1L: 'mitochondrial_function',
    FIS1: 'mitochondrial_function',
    PINK1: 'mitochondrial_function',
    PRKN: 'mitochondrial_function',
    UCP1: 'thermogenesis',
    UCP2: 'thermogenesis',
    UCP3: 'muscle_performance',
    SOD2: 'oxidative_stress',
    CAT: 'oxidative_stress',
    GPX1: 'oxidative_stress',
    GPX4: 'oxidative_stress',
    PRDX1: 'oxidative_stress',
    PRDX3: 'oxidative_stress',
    TXN: 'oxidative_stress',
    TXN2: 'oxidative_stress',
    GSR: 'oxidative_stress',

    // NAD+
    NAMPT: 'nad_metabolism',
    NMNAT1: 'nad_metabolism',
    NMNAT2: 'nad_metabolism',
    NMNAT3: 'nad_metabolism',
    NNMT: 'nad_metabolism',
    CD38: 'nad_metabolism',

    // Inflammation
    NFKB1: 'inflammation',
    NFKB2: 'inflammation',
    RELA: 'inflammation',
    NLRP3: 'inflammation',
    IL1B: 'inflammation',
    IL6: 'inflammation',
    TNF: 'inflammation',
    CRP: 'inflammation_marker',
    IL10: 'anti_inflammation',
    TGFB1: 'inflammation',

    // Epigenetic
    DNMT1: 'epigenetic_maintenance',
    DNMT3A: 'epigenetic_maintenance',
    DNMT3B: 'epigenetic_maintenance',
    TET1: 'epigenetic_maintenance',
    TET2: 'epigenetic_maintenance',
    TET3: 'epigenetic_maintenance',
    HDAC1: 'epigenetic_maintenance',
    HDAC2: 'epigenetic_maintenance',
    HDAC3: 'epigenetic_maintenance',

    // Senescence
    CDKN2A: 'senescence',
    CDKN1A: 'senescence',
    CDKN1B: 'senescence',
    RB1: 'senescence',
    LMNB1: 'senescence',

    // Stem cells
    SOX2: 'stem_cells',
    NANOG: 'stem_cells',
    KLF4: 'stem_cells',
    LIN28A: 'stem_cells',
    LIN28B: 'stem_cells',
    NOTCH1: 'stem_cells',

    // Lipid / CVD
    APOE: 'lipid_transport',
    CETP: 'cholesterol_transport',
    LPA: 'lipid_composition',
    PCSK9: 'cholesterol',
    LDLR: 'ldl_receptor',
    APOB: 'lipid_transport',

    // Methylation
    MTHFR: 'methylation',
    MTR: 'methylation',
    MTRR: 'methylation',
    CBS: 'methylation',
    BHMT: 'methylation',
    TCN2: 'b12_metabolism',

    // Vitamins
    GC: 'vitamin_d',
    VDR: 'vitamin_d',
    CYP2R1: 'vitamin_d',
    CYP27B1: 'vitamin_d',
    CYP24A1: 'vitamin_d',

    // Hormonal
    SHBG: 'body_composition',
    ESR1: 'bone_health',
    ESR2: 'bone_health',
    AR: 'muscle_performance',
    GH1: 'insulin_signaling',
    GHR: 'insulin_signaling',
  };

  return map[gene] || 'longevity_pathway';
}

function countDosage(genotype: string | undefined): number {
  if (!genotype) return 0;
  const [a1, a2] = genotype.replace(/[|/]/g, '/').split('/');
  if (!a1 || !a2) return 0;
  if (a1 === '0' && a2 === '0') return 0;
  if (a1 !== '0' && a2 !== '0') return 2;
  return 1;
}

/**
 * Generate trait scores from VEP missense enrichment results.
 * Damaging variants in longevity genes get lower scores (more concerning).
 */
export function mapVEPMissenseToTraits(
  result: MissenseEnrichmentResult
): Array<{ trait_id: string; score: number; confidence: number; gene: string; proteinChange: string; functionalSignificance: string }> {
  const traits: Array<{ trait_id: string; score: number; confidence: number; gene: string; proteinChange: string; functionalSignificance: string }> = [];

  for (const call of result.calls) {
    let score: number;
    let confidence: number;

    switch (call.functionalSignificance) {
      case 'damaging':
        score = 35; // Potentially deleterious in longevity gene
        confidence = 0.75;
        break;
      case 'possibly_damaging':
        score = 45;
        confidence = 0.60;
        break;
      case 'benign':
        // Benign missense — don't penalize, but note the gene
        score = 70;
        confidence = 0.40;
        break;
      default:
        score = 60;
        confidence = 0.30;
    }

    traits.push({
      trait_id: call.traitId,
      score,
      confidence,
      gene: call.gene,
      proteinChange: call.proteinChange,
      functionalSignificance: call.functionalSignificance,
    });
  }

  return traits;
}
