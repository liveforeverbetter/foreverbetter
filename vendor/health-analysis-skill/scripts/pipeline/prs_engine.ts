/**
 * Polygenic Risk Score (PRS) Engine
 *
 * Computes polygenic risk scores for common complex diseases by aggregating
 * weighted variant effects across published GWAS loci.
 *
 * Formula: PRS = sum(effect_weight × dosage) / total_variants
 * Where dosage = 0 (0 risk alleles), 1 (1 risk allele), or 2 (2 risk alleles).
 *
 * Each disease has a pre-defined set of weight variants sourced from published
 * GWAS meta-analyses (PGC, GIANT, BCAC, PRACTICAL, IGAP consortia).
 */

import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { fileURLToPath } from "url";
import { findWellnessPRSWeights, readWellnessManifest, type SourceProvenance } from './wellness_reference.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Types
// ============================================================================

export interface PRSWeight {
  rsid: string;
  effect_allele: string;
  effect_weight: number;
  disease: string;
  citation: string;
  pgs_id?: string;
  pgs_name?: string;
  reported_trait?: string;
  mapped_trait?: string;
  genome_build?: string;
  ancestry_distribution?: string;
  source_type?: "curated_prs_weight" | "pgs_catalog_score";
  source_url?: string;
  source_release?: string;
  confidenceTier?: 'prs';
  provenance?: SourceProvenance[];
}

export interface PRSWeightsRegistry {
  diseases: string[];
  variants: PRSWeight[];
}

export interface PRSScore {
  disease: string;
  score: number;
  riskLabel: string;
  percentile: number;
  description: string;
  variantsScored: number;
  totalWeightedVariants: number;
  coveragePct: number;
  confidence: "low" | "moderate" | "high";
  confidenceTier?: 'prs';
  sourceType?: "curated_prs_weight" | "pgs_catalog_score";
  sourceId?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceRelease?: string;
  genomeBuild?: string;
  ancestry?: string;
  ancestryDisclosure?: string;
  buildDisclosure?: string;
  coverageDisclosure?: string;
  provenance?: SourceProvenance[];
}

export interface PRSResult {
  scores: PRSScore[];
  variantsScored: number;
  totalWeightedVariants: number;
  sourceSummary?: {
    sourceType: string;
    sourceName: string;
    sourceRelease?: string;
    genomeBuild?: string;
    ancestryDisclosure?: string;
    buildDisclosure?: string;
    coverageDisclosure?: string;
  };
}

// ============================================================================
// Population parameters (mean and SD for each disease, derived from GWAS)
// ============================================================================

interface PopulationParams {
  mean: number;
  sd: number;
}

const POPULATION_PARAMS: Record<string, PopulationParams> = {
  coronary_artery_disease: { mean: 0.15, sd: 0.12 },
  type_2_diabetes: { mean: 0.18, sd: 0.14 },
  breast_cancer: { mean: 0.12, sd: 0.10 },
  prostate_cancer: { mean: 0.14, sd: 0.11 },
  alzheimers_disease: { mean: 0.10, sd: 0.09 },
  telomere_length: { mean: -0.02, sd: 0.15 },
  vo2max: { mean: 0.05, sd: 0.08 },
  grip_strength: { mean: 0.08, sd: 0.06 },
  bone_density: { mean: 0.10, sd: 0.07 },
  sleep_duration: { mean: 0.00, sd: 0.05 },
  chronotype_morningness: { mean: 0.02, sd: 0.08 },
  hdl_cholesterol: { mean: 0.08, sd: 0.07 },
  ldl_cholesterol: { mean: -0.02, sd: 0.10 },
  triglycerides: { mean: 0.06, sd: 0.08 },
  systolic_bp: { mean: 0.04, sd: 0.06 },
  crp_inflammation: { mean: 0.10, sd: 0.09 },
  il6_inflammation: { mean: 0.04, sd: 0.07 },
  igf1_levels: { mean: 0.06, sd: 0.06 },
  lean_body_mass: { mean: 0.03, sd: 0.04 },
  vitamin_d: { mean: -0.04, sd: 0.12 },
  homocysteine: { mean: 0.06, sd: 0.08 },
  epigenetic_age_grimage: { mean: 0.02, sd: 0.06 },
  reaction_time: { mean: 0.04, sd: 0.05 },
  cognitive_performance: { mean: 0.06, sd: 0.07 },
  neuroticism: { mean: 0.04, sd: 0.05 },
  alcohol_consumption: { mean: -0.02, sd: 0.10 },
  caffeine_metabolism: { mean: 0.06, sd: 0.08 },
};

// ============================================================================
// Disease consumer descriptions
// ============================================================================

const DISEASE_DESCRIPTIONS: Record<string, Record<string, string>> = {
  coronary_artery_disease: {
    "Lower than average": "Your genetic risk for coronary artery disease appears lower than average based on the variants analyzed. Continue heart-healthy lifestyle habits.",
    "Average": "Your genetic risk for coronary artery disease is about average for the general population. Standard prevention guidelines apply.",
    "Slightly elevated": "Your genetic risk for coronary artery disease is slightly above average. Consider discussing lipid screening and heart-healthy lifestyle modifications with your healthcare provider.",
    "Elevated": "Your genetic risk for coronary artery disease is elevated compared to the general population. Proactive cardiovascular risk management, including regular lipid panels and blood pressure monitoring, is recommended.",
    "Significantly elevated": "Your genetic risk for coronary artery disease is significantly above average. Comprehensive cardiovascular risk assessment, including advanced lipid testing (apoB, Lp(a)), coronary calcium scoring, and consultation with a preventive cardiologist is strongly recommended.",
  },
  type_2_diabetes: {
    "Lower than average": "Your genetic risk for type 2 diabetes appears lower than average. Maintain a healthy lifestyle to preserve this advantage.",
    "Average": "Your genetic risk for type 2 diabetes is about average. Standard prevention guidelines apply — maintain a healthy weight and stay physically active.",
    "Slightly elevated": "Your genetic risk for type 2 diabetes is slightly above average. Monitoring HbA1c and fasting glucose annually is recommended.",
    "Elevated": "Your genetic risk for type 2 diabetes is elevated. Regular glucose monitoring, dietary modification (lower glycemic load), and exercise are especially important for you.",
    "Significantly elevated": "Your genetic risk for type 2 diabetes is significantly elevated. Comprehensive metabolic screening, continuous glucose monitoring consideration, and consultation with an endocrinologist or preventive medicine specialist is recommended.",
  },
  breast_cancer: {
    "Lower than average": "Your polygenic risk for breast cancer appears lower than average. Continue routine age-appropriate screening.",
    "Average": "Your polygenic risk for breast cancer is about average. Follow standard screening guidelines for your age group.",
    "Slightly elevated": "Your polygenic risk for breast cancer is slightly above average. Discuss with your doctor whether earlier or more frequent screening may be appropriate.",
    "Elevated": "Your polygenic risk for breast cancer is elevated. Enhanced screening (breast MRI in addition to mammography) may be considered. Discuss with a genetic counselor or breast specialist.",
    "Significantly elevated": "Your polygenic risk for breast cancer is significantly elevated. Comprehensive risk assessment including mammography, breast MRI, and genetic counseling for additional testing is strongly recommended.",
  },
  prostate_cancer: {
    "Lower than average": "Your polygenic risk for prostate cancer appears lower than average. Continue routine screening as recommended for your age.",
    "Average": "Your polygenic risk for prostate cancer is about average. Follow standard screening guidelines.",
    "Slightly elevated": "Your polygenic risk for prostate cancer is slightly above average. Discuss PSA screening timing with your healthcare provider.",
    "Elevated": "Your polygenic risk for prostate cancer is elevated. Earlier and more frequent PSA screening may be beneficial. Discuss with a urologist.",
    "Significantly elevated": "Your polygenic risk for prostate cancer is significantly elevated. Comprehensive screening including PSA, potentially MRI, and consultation with a urologist specializing in prostate cancer is recommended.",
  },
  alzheimers_disease: {
    "Lower than average": "Your polygenic risk for Alzheimer's disease appears lower than average. Continue brain-healthy lifestyle habits including exercise, cognitive engagement, and social connection.",
    "Average": "Your polygenic risk for Alzheimer's disease is about average. Brain-healthy lifestyle habits (exercise, Mediterranean diet, cognitive stimulation) are recommended.",
    "Slightly elevated": "Your polygenic risk for Alzheimer's disease is slightly above average. Prioritize cardiovascular health, sleep quality, and cognitive engagement as protective factors.",
    "Elevated": "Your polygenic risk for Alzheimer's disease is elevated. Comprehensive brain health optimization including cardiovascular risk management, sleep optimization, and cognitive training is recommended.",
    "Significantly elevated": "Your polygenic risk for Alzheimer's disease is significantly elevated. Proactive brain health management including regular cognitive assessment, cardiovascular risk optimization, and consultation with a neurologist specializing in dementia prevention is recommended.",
  },
  telomere_length: {
    "Shorter": "Your polygenic profile suggests genetically shorter telomere length. Prioritize telomere-protective behaviors: regular aerobic exercise, stress management, adequate sleep (7-8h), and Mediterranean diet rich in antioxidants and omega-3s.",
    "Average": "Your genetic predisposition for telomere length is about average. Healthy lifestyle factors (exercise, sleep, nutrition) remain the primary determinants of telomere maintenance.",
    "Longer": "Your polygenic profile suggests genetically longer telomere length — a favorable finding for biological aging and healthspan. Continue telomere-protective lifestyle habits to maintain this advantage.",
  },
  vo2max: {
    "Lower": "Your polygenic profile suggests lower baseline cardiorespiratory fitness potential. Targeted aerobic training (HIIT + zone 2) can significantly improve VO2max regardless of genetics — training response often outweighs baseline genetics.",
    "Average": "Your genetic predisposition for VO2max is about average. Consistent aerobic training (150+ min/week moderate-vigorous) is the most effective way to improve cardiorespiratory fitness.",
    "Higher": "Your polygenic profile suggests higher cardiorespiratory fitness potential. This is a favorable finding — VO2max is one of the strongest predictors of longevity.",
  },
  grip_strength: {
    "Lower": "Your polygenic profile suggests genetically lower grip strength — a significant predictor of all-cause mortality. Prioritize resistance training and adequate protein intake (1.6g/kg/day) to offset this genetic tendency.",
    "Average": "Your genetic predisposition for muscular strength is about average. Regular resistance training is recommended to maintain functional strength across the lifespan.",
    "Higher": "Your polygenic profile suggests higher baseline muscular strength. This is protective — maintain with continued resistance training as you age.",
  },
  bone_density: {
    "Lower": "Your polygenic profile suggests genetically lower bone mineral density. Prioritize weight-bearing exercise, adequate calcium (1000-1200mg/day), vitamin D (2000-4000 IU/day), and consider DEXA screening earlier than standard guidelines.",
    "Average": "Your genetic predisposition for bone density is about average. Weight-bearing exercise and adequate calcium/vitamin D remain important for lifelong bone health.",
    "Higher": "Your polygenic profile suggests higher bone mineral density — a protective finding for fracture risk and mobility in later life.",
  },
  sleep_duration: {
    "Shorter": "Your polygenic profile suggests a tendency toward shorter sleep duration. Prioritize sleep hygiene, consistent sleep-wake timing, and target 7-8 hours. Short sleep is associated with increased all-cause mortality and metabolic dysfunction.",
    "Average": "Your genetic predisposition for sleep duration is about average. Consistent sleep schedule and good sleep hygiene remain the most impactful factors.",
    "Longer": "Your polygenic profile suggests a tendency toward longer sleep duration. While generally favorable, excessive sleep (>9h) can also be associated with health risks — aim for 7-8 hours.",
  },
  chronotype_morningness: {
    "Eveningness": "Your polygenic profile suggests an evening chronotype tendency ('night owl'). If your schedule allows, align demanding tasks with your natural peak alertness window. Prioritize morning light exposure to anchor your circadian rhythm.",
    "Average": "Your chronotype predisposition is about average — you likely have flexibility in sleep-wake timing.",
    "Morningness": "Your polygenic profile suggests a morning chronotype tendency ('early bird'). This is associated with better alignment with typical work schedules and potentially lower risk of depression.",
  },
  hdl_cholesterol: {
    "Lower": "Your polygenic profile suggests genetically lower HDL cholesterol. Prioritize aerobic exercise (most effective HDL-raising intervention), omega-3 intake, and minimizing refined carbohydrates and trans fats.",
    "Average": "Your genetic predisposition for HDL cholesterol is about average. Regular aerobic exercise and healthy dietary fats support optimal HDL levels.",
    "Higher": "Your polygenic profile suggests genetically higher HDL cholesterol — a cardioprotective finding. Maintain with regular exercise.",
  },
  ldl_cholesterol: {
    "Higher": "Your polygenic profile suggests genetically higher LDL cholesterol. Monitor with regular lipid panels. Dietary saturated fat reduction, increased soluble fiber, and potentially pharmacotherapy (statin, ezetimibe) may be indicated — discuss with your physician.",
    "Average": "Your genetic predisposition for LDL cholesterol is about average. Standard dietary guidelines for cardiovascular health apply.",
    "Lower": "Your polygenic profile suggests genetically lower LDL cholesterol — a cardioprotective finding. Maintain with heart-healthy diet.",
  },
  triglycerides: {
    "Higher": "Your polygenic profile suggests genetically higher triglycerides. Reduce refined carbohydrates and alcohol. Omega-3 fatty acids (2-4g/day EPA/DHA) and regular aerobic exercise are effective interventions.",
    "Average": "Your genetic predisposition for triglycerides is about average. Limit refined sugar and alcohol for optimal levels.",
    "Lower": "Your polygenic profile suggests genetically lower triglycerides — a favorable metabolic finding.",
  },
  systolic_bp: {
    "Higher": "Your polygenic profile suggests genetically higher blood pressure. Regular monitoring, sodium restriction (<2300mg/day), potassium-rich diet, regular exercise, and stress management are especially important. Discuss with your physician.",
    "Average": "Your genetic predisposition for blood pressure is about average. Standard lifestyle recommendations for cardiovascular health apply.",
    "Lower": "Your polygenic profile suggests genetically lower blood pressure — a cardioprotective finding.",
  },
  crp_inflammation: {
    "Higher": "Your polygenic profile suggests genetically higher C-reactive protein — a marker of systemic inflammation ('inflammaging'). Prioritize anti-inflammatory lifestyle: Mediterranean diet, regular exercise, adequate sleep, stress reduction, and maintaining healthy body weight.",
    "Average": "Your genetic predisposition for CRP levels is about average. Anti-inflammatory lifestyle habits benefit everyone for healthy aging.",
    "Lower": "Your polygenic profile suggests genetically lower CRP — lower baseline systemic inflammation. This is a favorable finding for healthy aging.",
  },
  il6_inflammation: {
    "Higher": "Your polygenic profile suggests genetically higher interleukin-6 — a key inflammatory cytokine. Regular exercise (both aerobic and resistance) is the most effective natural IL-6 modulator. Omega-3s, curcumin, and adequate vitamin D may also help.",
    "Average": "Your genetic predisposition for IL-6 levels is about average. Regular exercise and anti-inflammatory nutrition are recommended.",
    "Lower": "Your polygenic profile suggests genetically lower IL-6 signaling — lower baseline inflammatory tone. This is favorable for longevity.",
  },
  igf1_levels: {
    "Higher": "Your polygenic profile suggests genetically higher IGF-1 levels. This supports muscle maintenance and tissue repair but may require balanced interpretation — high IGF-1 can promote growth signaling. Protein cycling and exercise are natural modulators.",
    "Average": "Your genetic predisposition for IGF-1 is about average. IGF-1 naturally declines with age — resistance training can help maintain healthy levels.",
    "Lower": "Your polygenic profile suggests genetically lower IGF-1. While lower IGF-1 is associated with longevity in some models, it may impact muscle maintenance. Resistance training is especially important.",
  },
  lean_body_mass: {
    "Lower": "Your polygenic profile suggests genetically lower lean body mass. Prioritize resistance training (2-3x/week) and adequate protein intake (1.6-2.0g/kg/day) to build and maintain muscle mass — critical for healthy aging and metabolic health.",
    "Average": "Your genetic predisposition for lean body mass is about average. Consistent resistance training and adequate protein support muscle maintenance.",
    "Higher": "Your polygenic profile suggests higher baseline lean body mass — favorable for metabolic health, mobility, and longevity.",
  },
  vitamin_d: {
    "Lower": "Your polygenic profile suggests genetically lower vitamin D levels. Consider vitamin D3 supplementation (2000-4000 IU/day) and regular sun exposure. Monitor 25(OH)D levels annually — target 40-60 ng/mL.",
    "Average": "Your genetic predisposition for vitamin D levels is about average. Maintain adequate sun exposure or consider supplementation, especially in winter months.",
    "Higher": "Your polygenic profile suggests higher vitamin D levels — favorable for immune function, bone health, and potentially longevity.",
  },
  homocysteine: {
    "Higher": "Your polygenic profile suggests genetically higher homocysteine — a risk factor for cardiovascular disease, cognitive decline, and methylation dysfunction. Active B-vitamins (methylfolate, methyl-B12, B6 as P5P) and TMG can help lower levels. Monitor homocysteine annually.",
    "Average": "Your genetic predisposition for homocysteine levels is about average. Adequate B-vitamin intake (folate, B12, B6) supports healthy homocysteine metabolism.",
    "Lower": "Your polygenic profile suggests genetically lower homocysteine — favorable for cardiovascular and brain health.",
  },
  epigenetic_age_grimage: {
    "Faster": "Your polygenic profile suggests potentially faster epigenetic aging (GrimAge clock). Prioritize known epigenetic age decelerators: regular exercise, Mediterranean diet, stress reduction, adequate sleep, and avoiding smoking/excess alcohol. These lifestyle factors can modify epigenetic aging rate.",
    "Average": "Your genetic predisposition for epigenetic aging rate is about average. Lifestyle factors (exercise, nutrition, sleep, stress) are the primary determinants of epigenetic age trajectory.",
    "Slower": "Your polygenic profile suggests potentially slower epigenetic aging — a favorable finding. Continue health-promoting lifestyle habits that support this trajectory.",
  },
  reaction_time: {
    "Slower": "Your polygenic profile suggests genetically slower reaction time. While largely genetically determined, cognitive training, adequate sleep, and physical exercise can improve processing speed.",
    "Average": "Your genetic predisposition for reaction time is about average. Physical exercise and cognitive engagement support processing speed.",
    "Faster": "Your polygenic profile suggests faster reaction time — favorable for cognitive aging and neurological health.",
  },
  cognitive_performance: {
    "Lower": "Your polygenic profile suggests lower baseline cognitive performance potential. Cognitive reserve is highly modifiable: lifelong learning, cognitive stimulation, physical exercise, social engagement, and cardiovascular health protection are powerful interventions.",
    "Average": "Your genetic predisposition for cognitive performance is about average. Lifelong learning, exercise, and cardiovascular health are the most impactful factors.",
    "Higher": "Your polygenic profile suggests higher cognitive performance potential. Maintain with continued cognitive engagement, exercise, and cardiovascular health.",
  },
  neuroticism: {
    "Higher": "Your polygenic profile suggests higher emotional sensitivity/neuroticism. While partially genetic, stress resilience is trainable: mindfulness meditation, CBT techniques, regular exercise, and adequate sleep are evidence-based interventions. This trait also correlates with creativity and vigilance.",
    "Average": "Your genetic predisposition for emotional stability is about average. Stress management practices benefit everyone.",
    "Lower": "Your polygenic profile suggests higher emotional stability — associated with lower risk of depression and anxiety. A favorable finding for mental health and stress resilience.",
  },
  alcohol_consumption: {
    "Higher": "Your polygenic profile suggests genetically higher alcohol consumption tendency. Awareness is protective — consider tracking intake, setting limits, and exploring alcohol-free alternatives. The ADH1B/ALDH2 pathway strongly influences alcohol metabolism and cancer risk.",
    "Average": "Your genetic predisposition for alcohol consumption is about average. Standard guidelines for moderate drinking apply (≤1 drink/day women, ≤2 men).",
    "Lower": "Your polygenic profile suggests genetically lower alcohol consumption tendency. This may reflect enhanced alcohol metabolism or aversive response — protective for alcohol-related cancer risk.",
  },
  caffeine_metabolism: {
    "Slow": "Your polygenic profile suggests slower caffeine metabolism (CYP1A2 pathway). Limit caffeine to morning hours to avoid sleep disruption. Consider switching to decaf after noon. Slow metabolizers may have increased cardiovascular risk with high caffeine intake.",
    "Average": "Your genetic predisposition for caffeine metabolism is about average. Moderate caffeine intake (2-4 cups coffee/day) is generally safe and associated with longevity benefits.",
    "Fast": "Your polygenic profile suggests rapid caffeine metabolism. You can likely tolerate caffeine later in the day without sleep disruption. Coffee intake is associated with reduced all-cause mortality in fast metabolizers.",
  },
};

// ============================================================================
// Core functions
// ============================================================================

/**
 * Load PRS weights from the JSON registry.
 */
export function loadPRSWeights(): PRSWeightsRegistry {
  const defaultWeightsPath = path.join(
    __dirname,
    "..",
    "..",
    "shared",
    "prs_weights.json"
  );
  const loadDefault = (): PRSWeightsRegistry => {
    if (!fs.existsSync(defaultWeightsPath)) {
      console.warn(
        `   ⚠️  PRS weights file not found at: ${defaultWeightsPath}. Using empty registry.`
      );
      return { diseases: [], variants: [] };
    }
    try {
      return JSON.parse(fs.readFileSync(defaultWeightsPath, "utf-8"));
    } catch (err: any) {
      console.warn(`   ⚠️  Failed to parse PRS weights: ${err.message}`);
      return { diseases: [], variants: [] };
    }
  };

  const wellnessWeightsPath = findWellnessPRSWeights();
  if (wellnessWeightsPath) {
    try {
      const raw = wellnessWeightsPath.endsWith('.gz')
        ? zlib.gunzipSync(fs.readFileSync(wellnessWeightsPath)).toString('utf8')
        : fs.readFileSync(wellnessWeightsPath, 'utf8');
      const parsed = JSON.parse(raw) as PRSWeightsRegistry;
      if ((parsed.variants?.length ?? 0) > 0) {
        const fallback = loadDefault();
        const compactDiseases = new Set(parsed.variants.map(variant => variant.disease));
        const fallbackVariants = fallback.variants.filter(variant => !compactDiseases.has(variant.disease));
        const variants = [...parsed.variants, ...fallbackVariants];
        return {
          diseases: [...new Set(variants.map(variant => variant.disease))],
          variants,
        };
      }
    } catch (err: any) {
      console.warn(`   ⚠️  Failed to parse PGS Catalog wellness weights: ${err.message}`);
    }
  }

  return loadDefault();
}

/**
 * Count risk alleles for a given rsID and genotype.
 *
 * If the effect allele is known, counts matching alleles.
 * If not (heterozygous with unknown effect allele), counts 1.
 * Falls back to: 0/0 → 0, 0/1 → 1, 1/1 → 2, any → 1.
 */
function countRiskAlleles(
  genotype: string,
  effectAllele: string
): number {
  if (!genotype) return 0;
  const normalized = genotype.toUpperCase().replace(/\s/g, "");
  let alleles: string[];
  if (normalized.includes("/") || normalized.includes("|")) {
    alleles = normalized.split(/[|/]/);
  } else if (normalized.length === 2) {
    // parse-vcf converts 0/1-style VCF genotypes to nucleotide pairs like "AG".
    alleles = [normalized[0], normalized[1]];
  } else {
    alleles = [normalized];
  }
  const [a1, a2] = alleles;
  if (!a1 || !a2) return 0;

  // If we know the effect allele, count matches
  const normalizedEffect = effectAllele.toUpperCase();
  if (normalizedEffect) {
    let count = 0;
    if (a1 === normalizedEffect) count++;
    if (a2 === normalizedEffect) count++;
    return count;
  }

  // Fallback: assume alt allele is the effect allele
  if (a1 === "0" && a2 === "0") return 0;
  if ((a1 === "0" && a2 === "1") || (a1 === "1" && a2 === "0")) return 1;
  if (a1 === "1" && a2 === "1") return 2;
  return 1; // Unknown pattern, assume heterozygous
}

/**
 * Compute PRS for a single disease from the user's genotype map.
 *
 * @param genotypes Map of rsid → genotype string (e.g., "0/1")
 * @param weights Array of PRSWeight variants for this disease
 * @returns Raw PRS score and metadata
 */
function computeDiseasePRS(
  genotypes: Map<string, string>,
  weights: PRSWeight[]
): { score: number; variantsScored: number; totalWeighted: number } {
  let total = 0;
  let count = 0;

  for (const w of weights) {
    const gt = genotypes.get(w.rsid) || genotypes.get(`rs${w.rsid}`);
    if (!gt) continue;

    const dosage = countRiskAlleles(gt, w.effect_allele);
    total += w.effect_weight * dosage;
    count++;
  }

  const score = count > 0 ? total / count : 0;
  return { score, variantsScored: count, totalWeighted: weights.length };
}

function summarizePRSProvenance(weights: PRSWeight[]): {
  sourceType: "curated_prs_weight" | "pgs_catalog_score";
  sourceId?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourceRelease?: string;
  genomeBuild?: string;
  ancestry?: string;
  provenance?: SourceProvenance[];
} {
  const first = weights.find(w => w.source_type === 'pgs_catalog_score') ?? weights[0];
  const pgsIds = [...new Set(weights.map(w => w.pgs_id).filter(Boolean))] as string[];
  const sourceType = first?.source_type === 'pgs_catalog_score' ? 'pgs_catalog_score' : 'curated_prs_weight';
  return {
    sourceType,
    sourceId: pgsIds.length === 1 ? pgsIds[0] : pgsIds.length > 1 ? `${pgsIds.length} PGS Catalog scores` : undefined,
    sourceName: first?.pgs_name ?? first?.citation ?? (sourceType === 'pgs_catalog_score' ? 'PGS Catalog' : 'Curated PRS weights'),
    sourceUrl: first?.source_url,
    sourceRelease: first?.source_release,
    genomeBuild: first?.genome_build,
    ancestry: first?.ancestry_distribution,
    provenance: first?.provenance,
  };
}

/**
 * Convert a raw PRS score to a risk label and percentile.
 *
 * Uses population parameters (mean and SD) derived from published GWAS:
 *   z_score = (user_PRS - population_mean) / population_SD
 *   percentile = approximate percentile from z-score
 *
 * Risk labels:
 *   "Lower than average"      z < -1.0
 *   "Average"                  -1.0 ≤ z < 0.5
 *   "Slightly elevated"        0.5 ≤ z < 1.0
 *   "Elevated"                 1.0 ≤ z < 2.0
 *   "Significantly elevated"   z ≥ 2.0
 */
// Traits where higher polygenic score = better outcome (longevity/wellness traits)
const HIGHER_IS_BETTER = new Set([
  'telomere_length', 'vo2max', 'grip_strength', 'bone_density',
  'hdl_cholesterol', 'lean_body_mass', 'cognitive_performance',
  'chronotype_morningness',
]);

// Traits where deviation in either direction is notable
const BIDIRECTIONAL_TRAITS: Record<string, { lowLabel: string; highLabel: string; midLabel: string }> = {
  sleep_duration: { lowLabel: 'Shorter', highLabel: 'Longer', midLabel: 'Average' },
  epigenetic_age_grimage: { lowLabel: 'Slower', highLabel: 'Faster', midLabel: 'Average' },
  reaction_time: { lowLabel: 'Faster', highLabel: 'Slower', midLabel: 'Average' },
  caffeine_metabolism: { lowLabel: 'Slow', highLabel: 'Fast', midLabel: 'Average' },
  alcohol_consumption: { lowLabel: 'Lower', highLabel: 'Higher', midLabel: 'Average' },
  chronotype_morningness: { lowLabel: 'Eveningness', highLabel: 'Morningness', midLabel: 'Average' },
};

function scoreToRiskLabel(
  disease: string,
  score: number
): { riskLabel: string; percentile: number } {
  const params = POPULATION_PARAMS[disease];
  if (!params) {
    return { riskLabel: "Average", percentile: 50 };
  }

  const z = params.sd > 0 ? (score - params.mean) / params.sd : 0;
  const percentile = Math.round(normalCDF(z) * 100);

  // Handle bidirectional traits with custom labels
  const bidir = BIDIRECTIONAL_TRAITS[disease];
  if (bidir) {
    let riskLabel: string;
    if (z < -1.0) riskLabel = bidir.lowLabel;
    else if (z > 1.0) riskLabel = bidir.highLabel;
    else riskLabel = bidir.midLabel;
    return { riskLabel, percentile };
  }

  // Handle "higher is better" longevity traits
  if (HIGHER_IS_BETTER.has(disease)) {
    let riskLabel: string;
    if (z > 1.0) riskLabel = 'Higher';
    else if (z < -1.0) riskLabel = 'Lower';
    else riskLabel = 'Average';
    return { riskLabel, percentile };
  }

  // Standard disease risk labels (higher = more risk)
  let riskLabel: string;
  if (z < -1.0) {
    riskLabel = "Lower than average";
  } else if (z < 0.5) {
    riskLabel = "Average";
  } else if (z < 1.0) {
    riskLabel = "Slightly elevated";
  } else if (z < 2.0) {
    riskLabel = "Elevated";
  } else {
    riskLabel = "Significantly elevated";
  }

  return { riskLabel, percentile };
}

/**
 * Get a consumer-facing description for a disease risk level.
 */
function getRiskDescription(
  disease: string,
  riskLabel: string
): string {
  const diseaseDescriptions = DISEASE_DESCRIPTIONS[disease];
  if (!diseaseDescriptions) {
    return `Your polygenic score for ${disease.replace(/_/g, " ")} is ${riskLabel.toLowerCase()}.`;
  }
  const base = diseaseDescriptions[riskLabel] || diseaseDescriptions["Average"] || "";
  return base;
}

/**
 * Approximate cumulative normal distribution function.
 * Uses a polynomial approximation (Abramowitz & Stegun).
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

/**
 * Compute PRS for all diseases using the user's genotype map.
 *
 * @param genotypes Map of rsid → genotype string
 * @param weightsPath Optional path to PRS weights file (defaults to shared/prs_weights.json)
 * @returns PRSResult with scores for each disease
 */
export function computePRS(
  genotypes: Map<string, string>,
  weightsPath?: string
): PRSResult {
  const registry = loadPRSWeights();
  const wellnessManifest = readWellnessManifest();
  const wellnessDisclosures = wellnessManifest?.disclosures;
  const scores: PRSScore[] = [];
  let totalScored = 0;
  let totalWeighted = 0;

  // Optionally load from a custom path
  let variants = registry.variants;
  if (weightsPath && fs.existsSync(weightsPath)) {
    try {
      const custom = JSON.parse(fs.readFileSync(weightsPath, "utf-8"));
      variants = custom.variants || [];
    } catch {
      // Fall back to default registry
    }
  }

  const diseases = [...new Set(variants.map((v) => v.disease))];

  for (const disease of diseases) {
    const diseaseWeights = variants.filter((v) => v.disease === disease);
    if (diseaseWeights.length === 0) continue;

    const { score, variantsScored } = computeDiseasePRS(
      genotypes,
      diseaseWeights
    );

    if (variantsScored === 0) continue; // No genotype data for this disease

    const coveragePct = Math.round((variantsScored / diseaseWeights.length) * 100);
    const confidence: "low" | "moderate" | "high" =
      coveragePct >= 70 ? "high" : coveragePct >= 35 ? "moderate" : "low";
    const { riskLabel, percentile } = scoreToRiskLabel(disease, score);
    const description = getRiskDescription(disease, riskLabel);
    const provenance = summarizePRSProvenance(diseaseWeights);

    scores.push({
      disease,
      score: Math.round(score * 1000) / 1000,
      riskLabel,
      percentile,
      description,
      variantsScored,
      totalWeightedVariants: diseaseWeights.length,
      coveragePct,
      confidence,
      confidenceTier: 'prs',
      sourceType: provenance.sourceType,
      sourceId: provenance.sourceId,
      sourceName: provenance.sourceName,
      sourceUrl: provenance.sourceUrl,
      sourceRelease: provenance.sourceRelease,
      genomeBuild: provenance.genomeBuild,
      ancestry: provenance.ancestry,
      ancestryDisclosure: wellnessDisclosures?.ancestry,
      buildDisclosure: wellnessDisclosures?.genome_build,
      coverageDisclosure: wellnessDisclosures?.coverage,
      provenance: provenance.provenance,
    });

    totalScored += variantsScored;
    totalWeighted += diseaseWeights.length;
  }

  return {
    scores,
    variantsScored: totalScored,
    totalWeightedVariants: totalWeighted,
    sourceSummary: {
      sourceType: scores.some(score => score.sourceType === 'pgs_catalog_score') ? 'pgs_catalog_score' : 'curated_prs_weight',
      sourceName: scores.some(score => score.sourceType === 'pgs_catalog_score') ? 'PGS Catalog compact wellness weights' : 'Curated PRS weights',
      sourceRelease: scores.find(score => score.sourceRelease)?.sourceRelease,
      genomeBuild: scores.find(score => score.genomeBuild)?.genomeBuild,
      ancestryDisclosure: wellnessDisclosures?.ancestry,
      buildDisclosure: wellnessDisclosures?.genome_build,
      coverageDisclosure: wellnessDisclosures?.coverage,
    },
  };
}

/**
 * Extract all rsIDs from the PRS weights registry for efficient ClinVar lookup.
 */
export function getPRSRSIDs(): string[] {
  const registry = loadPRSWeights();
  return registry.variants.map((v) => v.rsid);
}
