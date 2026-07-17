import type {
  BiomarkerAnalysisSummary,
  BiomarkerDomainScore,
  BiomarkerLabValue,
  BiomarkerBiologicalAge,
  DerivedBiomarkerValue,
  BiomarkerFinding,
  BiomarkerSystemScore,
  CrossModalAction,
  SignalStatus,
} from '../../shared/dashboard-types.js';

export interface UserProfile {
  age?: number;
  /** Biological sex used for age/sex-stratified reference ranges */
  sex?: 'male' | 'female';
}

export type BiomarkerDomainId =
  | 'cardiometabolic'
  | 'glucose_insulin'
  | 'inflammation_immune'
  | 'nutrient_status'
  | 'hormone_thyroid'
  | 'organ_function'
  | 'hematology';

export interface BiomarkerReading {
  id: string;
  value: number;
  unit?: string;
  raw_value?: string;
  collected_at?: string;
}

interface AgeRange {
  min_age: number;
  max_age: number;
  optimal_min?: number;
  optimal_max?: number;
  critical_low?: number;
  critical_high?: number;
}

interface SexRange {
  optimal_min?: number;
  optimal_max?: number;
  critical_low?: number;
  critical_high?: number;
  by_age?: AgeRange[];
}

interface RangeSet {
  optimal_min?: number;
  optimal_max?: number;
  critical_low?: number;
  critical_high?: number;
}

interface BiomarkerDefinition {
  id: string;
  aliases: string[];
  name: string;
  domain: BiomarkerDomainId;
  unit: string;
  value_type?: 'numeric' | 'qualitative';
  /** One–two sentences: what this marker measures and why it matters for health/longevity */
  clinical_context: string;
  optimal_min?: number;
  optimal_max?: number;
  critical_low?: number;
  critical_high?: number;
  /** Sex-specific range overrides; applied when UserProfile.sex is known */
  male?: SexRange;
  female?: SexRange;
  /** Skip scoring when the user's sex doesn't match */
  male_only?: boolean;
  female_only?: boolean;
  qualitative_normal?: string[];
  qualitative_watch?: string[];
  qualitative_attention?: string[];
  action_low?: string;
  action_high?: string;
  action_watch?: string;
}

// ── Domain metadata ───────────────────────────────────────────────────────────

const DOMAIN_NAMES: Record<BiomarkerDomainId, string> = {
  cardiometabolic: 'Cardiometabolic',
  glucose_insulin: 'Glucose and insulin',
  inflammation_immune: 'Inflammation and immune',
  nutrient_status: 'Nutrient status',
  hormone_thyroid: 'Hormone and thyroid',
  organ_function: 'Organ function and safety',
  hematology: 'Blood and oxygen transport',
};

const DEFAULT_ACTIONS: Record<BiomarkerDomainId, string> = {
  cardiometabolic: 'Prioritize ApoB/lipid review, blood pressure context, fiber/protein targets, and clinician follow-up for major abnormalities.',
  glucose_insulin: 'Retest fasting glucose, insulin, and HbA1c together; pair nutrition changes with resistance training and post-meal walking.',
  inflammation_immune: 'Look for infection, injury, sleep debt, excess training load, oral health, and visceral-fat drivers before adding supplements.',
  nutrient_status: 'Correct deficiencies conservatively and retest before escalating dose or stacking multiple supplements.',
  hormone_thyroid: 'Review thyroid/sex-hormone outliers with symptoms, sleep, energy availability, and clinician guidance.',
  organ_function: 'Use liver, kidney, and protein markers as safety checks before aggressive supplements, medication changes, or training blocks.',
  hematology: 'Review iron/B12/folate, training load, hydration, and clinician follow-up for anemia-like or clotting-related patterns.',
};

const URINE_NEGATIVE_VALUES = ['negative', 'neg', 'none', 'none seen', 'absent', 'not seen', 'not detected', 'normal', 'clear'];
const URINE_TRACE_VALUES = ['trace', 'few', 'rare', 'small', 'slight'];
const URINE_POSITIVE_VALUES = ['positive', 'pos', 'present', 'detected', 'moderate', 'many', 'large', 'abnormal'];
const URINE_ACTION = 'Interpret urinalysis with hydration, exercise, infection symptoms, medications, and kidney markers; repeat or review with a clinician if persistent.';
const URINE_CONTEXT = 'Urinalysis results reflect kidney filtration, hydration status, and local urinary tract conditions — interpret alongside symptoms and related markers.';

// ── Biomarker definitions ─────────────────────────────────────────────────────

export const BIOMARKER_DEFINITIONS: BiomarkerDefinition[] = [

  // ── Cardiometabolic ──
  { id: 'apob', aliases: ['apo b', 'apolipoprotein b'], name: 'ApoB', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'ApoB counts every atherogenic lipoprotein particle (LDL, IDL, VLDL) — more predictive of cardiovascular risk than LDL-C because particle number, not cholesterol mass, drives plaque formation.',
    optimal_max: 80, critical_high: 120, action_high: 'Discuss ApoB lowering strategy and overall ASCVD risk context with a clinician.' },

  { id: 'ldl_c', aliases: ['ldl', 'ldl cholesterol'], name: 'LDL-C', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'Elevated LDL cholesterol drives arterial plaque accumulation and is the central target of cardiovascular prevention — though ApoB provides a more precise risk estimate.',
    optimal_max: 100, critical_high: 190, action_high: 'Pair LDL-C with ApoB, Lp(a), blood pressure, and family history before deciding intervention intensity.' },

  { id: 'hdl_c', aliases: ['hdl', 'hdl cholesterol'], name: 'HDL-C', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'HDL-C reflects the cholesterol-carrying capacity of protective lipoprotein particles — low levels associate with higher cardiovascular risk, though HDL is less directly actionable than ApoB.',
    optimal_min: 50, critical_low: 35,
    male: { optimal_min: 40, critical_low: 30 },
    female: { optimal_min: 55, critical_low: 40 },
    action_low: 'Use HDL-C as context, not a direct target; focus on triglycerides, exercise, and insulin sensitivity.' },

  { id: 'triglycerides', aliases: ['tg', 'trigs'], name: 'Triglycerides', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'Fasting triglycerides rise with refined carbohydrates, alcohol, and insulin resistance — elevated levels signal metabolic dysfunction and atherogenic dyslipidemia.',
    optimal_max: 100, critical_high: 200, action_high: 'Review alcohol, refined carbohydrate, insulin resistance, and omega-3/fiber intake.' },

  { id: 'total_cholesterol', aliases: ['tc'], name: 'Total cholesterol', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'Total cholesterol measures all circulating lipoprotein fractions combined — useful context but less specific than ApoB or LDL-C for cardiovascular risk.',
    optimal_max: 200, critical_high: 240 },

  { id: 'non_hdl_c', aliases: ['non hdl', 'non-hdl cholesterol'], name: 'Non-HDL-C', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'Non-HDL-C captures cholesterol in all atherogenic particles (total minus HDL) — a practical ApoB surrogate when particle counting is unavailable.',
    optimal_max: 130, critical_high: 190 },

  { id: 'lp_a', aliases: ['lpa', 'lipoprotein a', 'lp(a)'], name: 'Lp(a)', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'Lp(a) is a genetically determined lipoprotein with both atherogenic and thrombotic properties — elevated levels roughly double lifetime cardiovascular risk independent of LDL.',
    optimal_max: 30, critical_high: 50, action_high: 'Treat as inherited cardiovascular context; optimize ApoB and discuss risk stratification.' },

  { id: 'apoa1', aliases: ['apolipoprotein a1', 'apo a1'], name: 'ApoA1', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'ApoA1 is the structural protein of HDL particles and reflects the number and functionality of protective lipoproteins involved in reverse cholesterol transport.',
    optimal_min: 120, critical_low: 100 },

  { id: 'apob_apoa1_ratio', aliases: ['apob/apoa1 ratio', 'apo b apo a1 ratio'], name: 'ApoB/ApoA1 ratio', domain: 'cardiometabolic', unit: 'ratio',
    clinical_context: 'The ApoB/ApoA1 ratio quantifies the balance of atherogenic vs. protective particles — one of the strongest single predictors of cardiovascular events.',
    optimal_max: 0.7, critical_high: 0.9 },

  { id: 'ldl_particle_number', aliases: ['ldl-p', 'ldl particles'], name: 'LDL particle number', domain: 'cardiometabolic', unit: 'nmol/L',
    clinical_context: 'LDL particle number directly counts LDL particles regardless of cholesterol content — more accurate than LDL-C because the same mass can be spread across many small, dangerous particles.',
    optimal_max: 1000, critical_high: 1600 },

  { id: 'small_ldl_p', aliases: ['small ldl particles', 'small dense ldl'], name: 'Small LDL particles', domain: 'cardiometabolic', unit: 'nmol/L',
    clinical_context: 'Small dense LDL particles penetrate arterial walls more easily and oxidize more readily than large LDL — greater risk per particle for the same total count.',
    optimal_max: 500, critical_high: 900 },

  { id: 'hdl_particle_number', aliases: ['hdl-p', 'hdl particles'], name: 'HDL particle number', domain: 'cardiometabolic', unit: 'umol/L',
    clinical_context: 'HDL particle count reflects the number of particles actively removing cholesterol from arterial tissue — a better predictor of protection than HDL-C mass.',
    optimal_min: 30, critical_low: 25 },

  { id: 'vldl_c', aliases: ['vldl cholesterol'], name: 'VLDL-C', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'VLDL-C is the cholesterol in triglyceride-rich particles produced by the liver — elevated in insulin-resistant and metabolically dysregulated states.',
    optimal_max: 30, critical_high: 40 },

  { id: 'remnant_cholesterol', aliases: ['remnant cholesterol'], name: 'Remnant cholesterol', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'Remnant cholesterol (total minus LDL and HDL cholesterol) represents partially cleared VLDL/IDL particles and may explain cardiovascular risk that persists despite statin therapy.',
    optimal_max: 20, critical_high: 30 },

  { id: 'chol_hdl_ratio', aliases: ['total cholesterol hdl ratio', 'tc/hdl', 'cholesterol hdl ratio'], name: 'Total cholesterol / HDL ratio', domain: 'cardiometabolic', unit: 'ratio',
    clinical_context: 'Total cholesterol divided by HDL-C is a compact lipid balance index that helps contextualize a standard lipid panel when particle counts are not available.',
    optimal_max: 3.5, critical_high: 5 },

  { id: 'ldl_hdl_ratio', aliases: ['ldl hdl ratio', 'ldl/hdl'], name: 'LDL / HDL ratio', domain: 'cardiometabolic', unit: 'ratio',
    clinical_context: 'LDL-C divided by HDL-C compares cholesterol carried in atherogenic LDL particles against HDL-associated cholesterol transport.',
    optimal_max: 2.5, critical_high: 4 },

  { id: 'triglyceride_hdl_ratio', aliases: ['tg/hdl', 'triglycerides hdl ratio'], name: 'Triglyceride / HDL ratio', domain: 'cardiometabolic', unit: 'ratio',
    clinical_context: 'Triglycerides divided by HDL-C is a practical proxy for insulin resistance and atherogenic dyslipidemia from a standard lipid panel.',
    optimal_max: 2, critical_high: 3.5 },

  { id: 'atherogenic_coefficient', aliases: ['atherogenic coefficient', 'non hdl hdl ratio'], name: 'Atherogenic coefficient', domain: 'cardiometabolic', unit: 'ratio',
    clinical_context: 'The atherogenic coefficient normalizes non-HDL cholesterol against HDL-C, summarizing the balance of atherogenic and HDL-associated cholesterol.',
    optimal_max: 3, critical_high: 4.5 },

  { id: 'atherogenic_index_plasma', aliases: ['aip', 'atherogenic index of plasma'], name: 'Atherogenic index of plasma', domain: 'cardiometabolic', unit: 'index',
    clinical_context: 'Atherogenic index of plasma uses triglyceride and HDL-C concentrations to summarize lipoprotein particle-pattern risk from a standard lipid panel.',
    optimal_max: 0.11, critical_high: 0.21 },

  { id: 'oxidized_ldl', aliases: ['oxldl', 'oxidized ldl'], name: 'Oxidized LDL', domain: 'cardiometabolic', unit: 'U/L',
    clinical_context: 'Oxidized LDL measures chemically modified particles that trigger arterial inflammation and foam cell formation — the biologically active form that initiates plaque.',
    optimal_max: 60, critical_high: 80 },

  { id: 'lp_pla2', aliases: ['lp pla2', 'lipoprotein phospholipase a2'], name: 'Lp-PLA2', domain: 'cardiometabolic', unit: 'nmol/min/mL',
    clinical_context: 'Lp-PLA2 is an inflammatory enzyme associated with unstable arterial plaques — elevated levels indicate active vascular oxidative stress beyond what standard lipid panels detect.',
    optimal_max: 180, critical_high: 225 },

  // ── Glucose and insulin ──
  { id: 'fasting_glucose', aliases: ['glucose', 'fasting blood glucose'], name: 'Fasting glucose', domain: 'glucose_insulin', unit: 'mg/dL',
    clinical_context: 'Fasting blood glucose is the fundamental metabolic marker — even mildly elevated levels above 90 mg/dL accelerate glycation, vascular damage, and long-term organ aging.',
    optimal_min: 70, optimal_max: 90, critical_high: 126, action_high: 'Pair with fasting insulin and HbA1c; review sleep, training, protein/fiber, and post-meal movement.' },

  { id: 'fasting_insulin', aliases: ['insulin'], name: 'Fasting insulin', domain: 'glucose_insulin', unit: 'uIU/mL',
    clinical_context: 'Fasting insulin often rises years before glucose becomes abnormal — making it the earliest detectable signal of insulin resistance, a central driver of metabolic disease and accelerated aging.',
    optimal_max: 8, critical_high: 15, action_high: 'Insulin is an early metabolic signal; prioritize resistance training, waist reduction, and meal composition.' },

  { id: 'hba1c', aliases: ['a1c', 'hemoglobin a1c'], name: 'HbA1c', domain: 'glucose_insulin', unit: '%',
    clinical_context: 'HbA1c reflects average blood sugar over ~90 days — even levels in the upper-normal range above 5.3% predict increased cardiovascular and dementia risk over time.',
    optimal_max: 5.3, critical_high: 6.5, action_high: 'Confirm with fasting glucose/CGM and review clinician follow-up if persistently high.' },

  { id: 'homa_ir', aliases: ['homa-ir', 'homa ir'], name: 'HOMA-IR', domain: 'glucose_insulin', unit: 'score',
    clinical_context: 'HOMA-IR combines fasting glucose and insulin into a single insulin resistance index — one of the most clinically useful derived metabolic markers from a basic lab panel.',
    optimal_max: 1.5, critical_high: 2.9, action_high: 'Use as a combined glucose-insulin signal; prioritize metabolic fundamentals and retest.' },

  { id: 'estimated_average_glucose', aliases: ['eag', 'estimated average glucose'], name: 'Estimated average glucose', domain: 'glucose_insulin', unit: 'mg/dL',
    clinical_context: 'Estimated average glucose converts HbA1c into an approximate mean glucose value, making glycation burden easier to compare with glucose readings.',
    optimal_min: 70, optimal_max: 105, critical_high: 140 },

  { id: 'tyg_index', aliases: ['tyg', 'triglyceride glucose index'], name: 'TyG index', domain: 'glucose_insulin', unit: 'index',
    clinical_context: 'The triglyceride-glucose index combines fasting glucose and triglycerides into a compact insulin-resistance signal when fasting insulin is not available.',
    optimal_max: 8.5, critical_high: 9.2 },

  { id: 'c_peptide', aliases: ['c peptide'], name: 'C-peptide', domain: 'glucose_insulin', unit: 'ng/mL',
    clinical_context: 'C-peptide is produced alongside insulin by the pancreas and more accurately reflects beta-cell output than insulin itself, since it is not cleared by the liver.',
    optimal_min: 0.8, optimal_max: 3.1, critical_high: 5 },

  { id: 'fructosamine', aliases: ['fructosamine'], name: 'Fructosamine', domain: 'glucose_insulin', unit: 'umol/L',
    clinical_context: 'Fructosamine reflects average glucose over 2–3 weeks — useful for shorter-term monitoring or when HbA1c is unreliable due to hemolytic conditions.',
    optimal_max: 285, critical_high: 320 },

  { id: 'glycated_albumin', aliases: ['glycated albumin'], name: 'Glycated albumin', domain: 'glucose_insulin', unit: '%',
    clinical_context: 'Glycated albumin measures glucose binding to albumin over 2–3 weeks — complementary to HbA1c for shorter-term glucose assessment.',
    optimal_max: 14, critical_high: 16 },

  { id: 'adiponectin', aliases: ['adiponectin'], name: 'Adiponectin', domain: 'glucose_insulin', unit: 'ug/mL',
    clinical_context: 'Adiponectin is an insulin-sensitizing hormone secreted by healthy fat tissue — lower levels associate with insulin resistance, visceral obesity, and chronic inflammation.',
    optimal_min: 6, critical_low: 4 },

  { id: 'leptin', aliases: ['leptin'], name: 'Leptin', domain: 'glucose_insulin', unit: 'ng/mL',
    clinical_context: 'Leptin signals energy stores to the brain; chronically elevated leptin with impaired brain signaling (leptin resistance) drives obesity, metabolic syndrome, and inflammation.',
    optimal_max: 15, critical_high: 30 },

  { id: 'ghrelin', aliases: ['ghrelin'], name: 'Ghrelin', domain: 'glucose_insulin', unit: 'pg/mL',
    clinical_context: 'Ghrelin is the stomach-derived hunger hormone that rises with caloric restriction and declines after eating — low levels can impair appetite regulation and recovery.',
    optimal_min: 400, optimal_max: 1200, critical_low: 300 },

  // ── Inflammation and immune ──
  { id: 'hs_crp', aliases: ['crp', 'high sensitivity crp'], name: 'hs-CRP', domain: 'inflammation_immune', unit: 'mg/L',
    clinical_context: 'hs-CRP is a sensitive marker of systemic low-grade inflammation — chronically elevated levels above 1 mg/L independently predict cardiovascular events and accelerated biological aging.',
    optimal_max: 1, critical_high: 3, action_high: 'Repeat when healthy; investigate infection, injury, sleep debt, oral health, and visceral-fat drivers.' },

  { id: 'ferritin', aliases: ['serum ferritin'], name: 'Ferritin', domain: 'inflammation_immune', unit: 'ng/mL',
    clinical_context: 'Ferritin is the primary iron storage protein but also rises sharply with inflammation — distinguishing iron overload from inflammatory elevation requires context.',
    optimal_min: 40, optimal_max: 150, critical_low: 20, critical_high: 300,
    action_low: 'Review iron intake, blood loss, and CBC context.', action_high: 'Check inflammation, iron overload context, liver markers, and clinician review.' },

  { id: 'homocysteine', aliases: ['hcy'], name: 'Homocysteine', domain: 'inflammation_immune', unit: 'umol/L',
    clinical_context: 'Homocysteine damages arterial walls and promotes blood clotting when elevated — reflects B-vitamin (folate, B12, B6) and methylation cycle status.',
    optimal_max: 8, critical_high: 15, action_high: 'Review folate, B12, B6, riboflavin, creatine, thyroid, kidney function, and MTHFR context.' },

  { id: 'wbc', aliases: ['white blood cells', 'white blood cell count'], name: 'White blood cells', domain: 'inflammation_immune', unit: '10^9/L',
    clinical_context: 'WBC count reflects immune system activity — persistently elevated counts signal chronic infection, inflammation, or, rarely, a bone marrow condition.',
    optimal_min: 4, optimal_max: 7, critical_low: 3, critical_high: 11 },

  { id: 'neutrophils', aliases: ['absolute neutrophils'], name: 'Neutrophils', domain: 'inflammation_immune', unit: '10^9/L',
    clinical_context: 'Neutrophils are the most abundant innate immune cells; the neutrophil-to-lymphocyte ratio is an emerging longevity biomarker tracking inflammatory burden.',
    optimal_min: 1.8, optimal_max: 5.4, critical_low: 1, critical_high: 8 },

  { id: 'lymphocytes', aliases: ['absolute lymphocytes'], name: 'Lymphocytes', domain: 'inflammation_immune', unit: '10^9/L',
    clinical_context: 'Lymphocytes (B and T cells) drive adaptive immunity — their count relative to other immune cells reflects immune balance and is associated with biological aging.',
    optimal_min: 1.2, optimal_max: 3.2, critical_low: 0.8, critical_high: 4 },

  { id: 'esr', aliases: ['erythrocyte sedimentation rate'], name: 'ESR', domain: 'inflammation_immune', unit: 'mm/hr',
    clinical_context: 'ESR is a non-specific inflammatory marker reflecting protein-mediated red cell clumping — useful for detecting systemic inflammation but lacking specificity.',
    optimal_max: 15, critical_high: 30 },

  { id: 'il6', aliases: ['interleukin 6', 'interleukin-6'], name: 'IL-6', domain: 'inflammation_immune', unit: 'pg/mL',
    clinical_context: 'IL-6 is a key pro-inflammatory cytokine that, when chronically elevated, drives the "inflammaging" process linked to cardiovascular disease, metabolic dysfunction, and cognitive decline.',
    optimal_max: 2, critical_high: 5 },

  { id: 'tnf_alpha', aliases: ['tnf alpha', 'tumor necrosis factor alpha'], name: 'TNF-alpha', domain: 'inflammation_immune', unit: 'pg/mL',
    clinical_context: 'TNF-alpha is a potent inflammatory cytokine — chronically elevated levels drive insulin resistance, muscle wasting, and systemic inflammation characteristic of age-related disease.',
    optimal_max: 8, critical_high: 12 },

  { id: 'fibrinogen', aliases: ['fibrinogen activity'], name: 'Fibrinogen', domain: 'inflammation_immune', unit: 'mg/dL',
    clinical_context: 'Fibrinogen is both a clotting protein and acute-phase reactant — elevated levels increase blood viscosity, clotting risk, and cardiovascular event probability alongside inflammation.',
    optimal_min: 200, optimal_max: 350, critical_high: 450 },

  { id: 'neutrophil_lymphocyte_ratio', aliases: ['nlr', 'neutrophil lymphocyte ratio'], name: 'Neutrophil / lymphocyte ratio', domain: 'inflammation_immune', unit: 'ratio',
    clinical_context: 'Neutrophils divided by lymphocytes summarizes innate-to-adaptive immune balance and is useful for tracking inflammatory and stress load over time.',
    optimal_min: 1, optimal_max: 2.5, critical_low: 0.7, critical_high: 4 },

  { id: 'platelet_lymphocyte_ratio', aliases: ['plr', 'platelet lymphocyte ratio'], name: 'Platelet / lymphocyte ratio', domain: 'inflammation_immune', unit: 'ratio',
    clinical_context: 'Platelets divided by lymphocytes provides thrombo-inflammatory context from a routine complete blood count.',
    optimal_min: 80, optimal_max: 180, critical_low: 50, critical_high: 300 },

  { id: 'systemic_immune_inflammation_index', aliases: ['sii', 'systemic immune inflammation index'], name: 'Systemic immune-inflammation index', domain: 'inflammation_immune', unit: 'index',
    clinical_context: 'The systemic immune-inflammation index combines platelets, neutrophils, and lymphocytes into one CBC-derived inflammation signal.',
    optimal_min: 100, optimal_max: 600, critical_high: 1000 },

  { id: 'systemic_inflammation_response_index', aliases: ['siri', 'systemic inflammation response index'], name: 'Systemic inflammation response index', domain: 'inflammation_immune', unit: 'index',
    clinical_context: 'The systemic inflammation response index combines neutrophils, monocytes, and lymphocytes into a compact CBC-derived immune activation signal.',
    optimal_max: 1.5, critical_high: 3 },

  { id: 'myeloperoxidase', aliases: ['mpo'], name: 'Myeloperoxidase', domain: 'inflammation_immune', unit: 'pmol/L',
    clinical_context: 'MPO is released by activated neutrophils in arterial walls, generating oxidative species that destabilize plaques — a marker of active vascular oxidative stress.',
    optimal_max: 470, critical_high: 650 },

  { id: 'ana_titer', aliases: ['ana'], name: 'ANA titer', domain: 'inflammation_immune', unit: 'titer',
    clinical_context: 'Anti-nuclear antibodies at elevated titers signal autoimmune activity targeting cell nuclei — a screening finding that requires clinical context before interpretation.',
    optimal_max: 80, critical_high: 160 },

  { id: 'rheumatoid_factor', aliases: ['rf'], name: 'Rheumatoid factor', domain: 'inflammation_immune', unit: 'IU/mL',
    clinical_context: 'Rheumatoid factor is an autoantibody targeting immunoglobulin G — elevated levels associate with rheumatoid arthritis and autoimmune conditions, though low titers can appear in healthy individuals.',
    optimal_max: 14, critical_high: 30 },

  // ── Nutrient status ──
  { id: 'vitamin_d', aliases: ['25-oh vitamin d', '25 hydroxy vitamin d'], name: 'Vitamin D', domain: 'nutrient_status', unit: 'ng/mL',
    clinical_context: 'Vitamin D acts as a hormone regulating immune function, bone density, muscle strength, and gene expression in hundreds of tissue types — insufficiency is widespread and independently predicts mortality.',
    optimal_min: 30, optimal_max: 60, critical_low: 20, critical_high: 100, action_low: 'Consider D3 supplementation with magnesium, sunlight exposure, and retest after 8–12 weeks.' },

  { id: 'b12', aliases: ['vitamin b12', 'cobalamin'], name: 'Vitamin B12', domain: 'nutrient_status', unit: 'pg/mL',
    clinical_context: 'B12 is essential for neurological function, DNA synthesis, and red blood cell production — deficiency causes irreversible nerve damage and is common in plant-based dieters and older adults.',
    optimal_min: 500, optimal_max: 1000, critical_low: 300, action_low: 'Pair with MMA, homocysteine, folate, diet pattern, and absorption context.' },

  { id: 'folate', aliases: ['serum folate'], name: 'Folate', domain: 'nutrient_status', unit: 'ng/mL',
    clinical_context: 'Folate is a B vitamin critical for DNA synthesis, cell division, and one-carbon methylation — works with B12 and B6 to regulate homocysteine.',
    optimal_min: 8, optimal_max: 20, critical_low: 4 },

  { id: 'magnesium', aliases: ['serum magnesium'], name: 'Magnesium', domain: 'nutrient_status', unit: 'mg/dL',
    clinical_context: 'Magnesium is a cofactor in 300+ enzymatic reactions including ATP production, muscle contraction, and insulin signaling — one of the most commonly deficient minerals.',
    optimal_min: 2, optimal_max: 2.3, critical_low: 1.7 },

  { id: 'omega3_index', aliases: ['omega-3 index', 'omega 3 index'], name: 'Omega-3 index', domain: 'nutrient_status', unit: '%',
    clinical_context: 'The omega-3 index measures EPA and DHA as a percentage of red blood cell membranes — a long-term marker of omega-3 status that predicts cardiovascular and cognitive risk.',
    optimal_min: 8, critical_low: 4, action_low: 'Increase EPA/DHA food or supplement intake and retest omega-3 index.' },

  { id: 'uric_acid', aliases: ['urate'], name: 'Uric acid', domain: 'nutrient_status', unit: 'mg/dL',
    clinical_context: 'Uric acid is the end-product of purine breakdown — chronically elevated levels cause gout and promote inflammation, hypertension, kidney disease, and insulin resistance.',
    optimal_min: 3.5, optimal_max: 6.0, critical_high: 7.0,
    male: { optimal_min: 3.5, optimal_max: 6.5, critical_high: 7.5 },
    female: { optimal_min: 2.0, optimal_max: 5.5, critical_high: 6.5 },
    action_high: 'Review alcohol, fructose, dehydration, kidney function, and gout history.' },

  { id: 'uric_acid_hdl_ratio', aliases: ['uhr', 'uric acid hdl ratio'], name: 'Uric acid / HDL ratio', domain: 'nutrient_status', unit: 'ratio',
    clinical_context: 'Uric acid divided by HDL-C combines purine/oxidative-metabolic load with lipid resilience context.',
    optimal_max: 0.12, critical_high: 0.2 },

  { id: 'iron', aliases: ['serum iron'], name: 'Iron', domain: 'nutrient_status', unit: 'ug/dL',
    clinical_context: 'Iron is essential for oxygen transport via hemoglobin and mitochondrial energy production — both deficiency and excess (which drives oxidative stress) carry significant health consequences.',
    optimal_min: 70, optimal_max: 150, critical_low: 40, critical_high: 180 },

  { id: 'tibc', aliases: ['total iron binding capacity'], name: 'TIBC', domain: 'nutrient_status', unit: 'ug/dL',
    clinical_context: 'TIBC reflects transferrin protein availability — high TIBC signals iron-deficient states where more transport capacity is available; low TIBC suggests iron sufficiency or overload.',
    optimal_min: 250, optimal_max: 400, critical_high: 450 },

  { id: 'transferrin_saturation', aliases: ['iron saturation', 'transferrin sat'], name: 'Transferrin saturation', domain: 'nutrient_status', unit: '%',
    clinical_context: 'Transferrin saturation measures what fraction of iron transport capacity is occupied — low values confirm iron deficiency while values above 45% raise concern for hemochromatosis.',
    optimal_min: 20, optimal_max: 45, critical_low: 15, critical_high: 60 },

  { id: 'zinc', aliases: ['serum zinc'], name: 'Zinc', domain: 'nutrient_status', unit: 'ug/dL',
    clinical_context: 'Zinc is essential for immune function, testosterone production, wound healing, DNA repair, and antioxidant enzymes — commonly deficient in plant-based and older populations.',
    optimal_min: 80, optimal_max: 120, critical_low: 60 },

  { id: 'copper', aliases: ['serum copper'], name: 'Copper', domain: 'nutrient_status', unit: 'ug/dL',
    clinical_context: 'Copper is required for iron metabolism, collagen synthesis, and SOD antioxidant defense — its balance with zinc matters because both compete for intestinal absorption.',
    optimal_min: 70, optimal_max: 140, critical_low: 50, critical_high: 180 },

  { id: 'selenium', aliases: ['serum selenium'], name: 'Selenium', domain: 'nutrient_status', unit: 'ug/L',
    clinical_context: 'Selenium is critical for thyroid hormone activation, glutathione peroxidase antioxidant function, and immune defense — both deficiency and excess are physiologically harmful.',
    optimal_min: 100, optimal_max: 160, critical_low: 80, critical_high: 200 },

  { id: 'vitamin_a', aliases: ['retinol'], name: 'Vitamin A', domain: 'nutrient_status', unit: 'ug/dL',
    clinical_context: 'Vitamin A is a fat-soluble vitamin essential for vision, immune function, and epithelial integrity — liver stores are substantial, so toxicity risk exists with aggressive supplementation.',
    optimal_min: 30, optimal_max: 80, critical_low: 20, critical_high: 100 },

  { id: 'vitamin_e', aliases: ['alpha tocopherol'], name: 'Vitamin E', domain: 'nutrient_status', unit: 'mg/L',
    clinical_context: 'Vitamin E is a fat-soluble antioxidant that protects cell membranes from lipid peroxidation — important for immune function and potentially protective against neurodegeneration.',
    optimal_min: 5, optimal_max: 20, critical_low: 4, critical_high: 25 },

  { id: 'vitamin_b6', aliases: ['plp', 'pyridoxal phosphate'], name: 'Vitamin B6', domain: 'nutrient_status', unit: 'ng/mL',
    clinical_context: 'B6 is a coenzyme in amino acid metabolism, neurotransmitter synthesis, and hemoglobin production — deficiency impairs immune function and elevates homocysteine.',
    optimal_min: 5, optimal_max: 50, critical_low: 3, critical_high: 100 },

  { id: 'methylmalonic_acid', aliases: ['mma'], name: 'Methylmalonic acid', domain: 'nutrient_status', unit: 'umol/L',
    clinical_context: 'MMA accumulates when B12 is functionally deficient — elevated MMA is a more sensitive functional marker than serum B12 alone and confirms true cellular insufficiency.',
    optimal_max: 0.27, critical_high: 0.4 },

  { id: 'coq10', aliases: ['coenzyme q10'], name: 'CoQ10', domain: 'nutrient_status', unit: 'ug/mL',
    clinical_context: 'CoQ10 is a mitochondrial electron transport chain component and lipid-soluble antioxidant — essential for cellular energy production and depleted by statin medications and aging.',
    optimal_min: 0.8, critical_low: 0.5 },

  // ── Hormone and thyroid ──
  { id: 'tsh', aliases: ['thyroid stimulating hormone'], name: 'TSH', domain: 'hormone_thyroid', unit: 'mIU/L',
    clinical_context: 'TSH regulates thyroid hormone output — even subtle abnormalities within the broad normal range can meaningfully impact metabolism, energy, cholesterol, and cognitive function.',
    optimal_min: 0.5, optimal_max: 2.5, critical_low: 0.1, critical_high: 4.5, action_high: 'Pair with free T4, free T3, thyroid antibodies, symptoms, and clinician review.' },

  { id: 'free_t4', aliases: ['ft4'], name: 'Free T4', domain: 'hormone_thyroid', unit: 'ng/dL',
    clinical_context: 'Free T4 is the main thyroid hormone produced by the gland — it circulates unbound to proteins and is converted to the active T3 form in peripheral tissues.',
    optimal_min: 1, optimal_max: 1.6, critical_low: 0.8, critical_high: 2 },

  { id: 'tsh_free_t4_ratio', aliases: ['tsh ft4 ratio', 'tsh/free t4', 'tsh free t4 ratio'], name: 'TSH / free T4 ratio', domain: 'hormone_thyroid', unit: 'ratio',
    clinical_context: 'TSH divided by free T4 provides a compact thyroid-axis setpoint signal from the two most common thyroid markers.',
    optimal_min: 0.3, optimal_max: 2.5, critical_high: 4 },

  { id: 'free_t3', aliases: ['ft3'], name: 'Free T3', domain: 'hormone_thyroid', unit: 'pg/mL',
    clinical_context: 'Free T3 is the biologically active thyroid hormone that directly controls metabolic rate, heart rate, body temperature, and cognitive function in virtually every cell.',
    optimal_min: 2.8, optimal_max: 4.2, critical_low: 2.2, critical_high: 5 },

  { id: 'testosterone_total', aliases: ['total testosterone'], name: 'Total testosterone', domain: 'hormone_thyroid', unit: 'ng/dL',
    clinical_context: 'Testosterone drives muscle mass, bone density, libido, mood, and metabolic rate — levels decline ~1% per year after age 30 and differ markedly between males and females.',
    optimal_min: 300, optimal_max: 900, critical_low: 200,
    male: {
      optimal_min: 400, optimal_max: 1000, critical_low: 200,
      by_age: [
        { min_age: 18, max_age: 30, optimal_min: 500, optimal_max: 1000, critical_low: 300 },
        { min_age: 31, max_age: 45, optimal_min: 400, optimal_max: 950, critical_low: 250 },
        { min_age: 46, max_age: 60, optimal_min: 350, optimal_max: 850, critical_low: 200 },
        { min_age: 61, max_age: 999, optimal_min: 250, optimal_max: 800, critical_low: 150 },
      ],
    },
    female: { optimal_min: 15, optimal_max: 70, critical_low: 5, critical_high: 150 } },

  { id: 'testosterone_free', aliases: ['free testosterone'], name: 'Free testosterone', domain: 'hormone_thyroid', unit: 'pg/mL',
    clinical_context: 'Free testosterone is the unbound, biologically active fraction — more clinically relevant than total testosterone when SHBG is abnormal, as SHBG determines what reaches tissues.',
    optimal_min: 80, optimal_max: 200, critical_low: 50,
    male: {
      optimal_min: 100, optimal_max: 250, critical_low: 50,
      by_age: [
        { min_age: 18, max_age: 30, optimal_min: 120, optimal_max: 280, critical_low: 70 },
        { min_age: 31, max_age: 45, optimal_min: 100, optimal_max: 240, critical_low: 55 },
        { min_age: 46, max_age: 60, optimal_min: 80, optimal_max: 200, critical_low: 40 },
        { min_age: 61, max_age: 999, optimal_min: 60, optimal_max: 180, critical_low: 30 },
      ],
    },
    female: { optimal_min: 3, optimal_max: 20, critical_low: 1, critical_high: 50 } },

  { id: 'estradiol', aliases: ['e2'], name: 'Estradiol', domain: 'hormone_thyroid', unit: 'pg/mL',
    clinical_context: 'Estradiol is the dominant estrogen — essential for bone health, cardiovascular protection, brain function, and sexual health in both sexes; optimal ranges differ substantially by sex and age.',
    optimal_min: 15, optimal_max: 60, critical_high: 100,
    male: { optimal_min: 15, optimal_max: 60, critical_low: 10, critical_high: 100 },
    female: {
      optimal_min: 30, optimal_max: 300, critical_low: 10, critical_high: 700,
      by_age: [
        { min_age: 18, max_age: 50, optimal_min: 30, optimal_max: 300, critical_low: 10, critical_high: 700 },
        { min_age: 51, max_age: 999, optimal_min: 10, optimal_max: 80, critical_high: 200 },
      ],
    } },

  { id: 'shbg', aliases: ['sex hormone binding globulin'], name: 'SHBG', domain: 'hormone_thyroid', unit: 'nmol/L',
    clinical_context: 'SHBG binds testosterone and estradiol, controlling the free (active) fraction — elevated SHBG can cause low-normal total hormones to have insufficient biological effect.',
    optimal_min: 20, optimal_max: 60, critical_low: 10, critical_high: 90,
    male: { optimal_min: 15, optimal_max: 50, critical_low: 8, critical_high: 75 },
    female: { optimal_min: 40, optimal_max: 130, critical_low: 20, critical_high: 200 } },

  { id: 'dhea_s', aliases: ['dhea-s', 'dheas'], name: 'DHEA-S', domain: 'hormone_thyroid', unit: 'ug/dL',
    clinical_context: 'DHEA-S is the sulfated storage form of DHEA, the most abundant adrenal androgen — levels peak in the mid-twenties and decline ~10% per decade, a reliable adrenal aging marker.',
    optimal_min: 100, optimal_max: 400, critical_low: 50,
    male: {
      optimal_min: 150, optimal_max: 500, critical_low: 70,
      by_age: [
        { min_age: 18, max_age: 30, optimal_min: 250, optimal_max: 620, critical_low: 120 },
        { min_age: 31, max_age: 40, optimal_min: 180, optimal_max: 520, critical_low: 90 },
        { min_age: 41, max_age: 50, optimal_min: 130, optimal_max: 420, critical_low: 70 },
        { min_age: 51, max_age: 60, optimal_min: 80, optimal_max: 310, critical_low: 45 },
        { min_age: 61, max_age: 999, optimal_min: 50, optimal_max: 220, critical_low: 30 },
      ],
    },
    female: {
      optimal_min: 100, optimal_max: 400, critical_low: 50,
      by_age: [
        { min_age: 18, max_age: 30, optimal_min: 160, optimal_max: 510, critical_low: 90 },
        { min_age: 31, max_age: 40, optimal_min: 120, optimal_max: 430, critical_low: 70 },
        { min_age: 41, max_age: 50, optimal_min: 85, optimal_max: 340, critical_low: 50 },
        { min_age: 51, max_age: 60, optimal_min: 55, optimal_max: 255, critical_low: 35 },
        { min_age: 61, max_age: 999, optimal_min: 35, optimal_max: 180, critical_low: 20 },
      ],
    } },

  { id: 'cortisol_am', aliases: ['morning cortisol', 'am cortisol'], name: 'Morning cortisol', domain: 'hormone_thyroid', unit: 'ug/dL',
    clinical_context: 'Morning cortisol reflects peak daily adrenal output — chronically elevated levels suppress immunity and drive muscle loss, while chronically low levels indicate adrenal insufficiency.',
    optimal_min: 8, optimal_max: 18, critical_low: 4, critical_high: 25 },

  { id: 'lh', aliases: ['luteinizing hormone'], name: 'LH', domain: 'hormone_thyroid', unit: 'IU/L',
    clinical_context: 'LH from the pituitary drives testosterone production in males and triggers ovulation in females — elevated LH in men signals primary testicular failure; low LH suggests pituitary dysfunction.',
    optimal_min: 1.5, optimal_max: 9.3, critical_high: 15,
    male: { optimal_min: 1.5, optimal_max: 9.0, critical_high: 15 },
    female: { optimal_min: 2.0, optimal_max: 15.0, critical_high: 40 } },

  { id: 'fsh', aliases: ['follicle stimulating hormone'], name: 'FSH', domain: 'hormone_thyroid', unit: 'IU/L',
    clinical_context: 'FSH drives sperm production in males and follicle development in females — markedly elevated FSH in women indicates diminished ovarian reserve or menopause.',
    optimal_min: 1.4, optimal_max: 12.4, critical_high: 20,
    male: { optimal_min: 1.5, optimal_max: 9.5, critical_high: 15 },
    female: {
      optimal_min: 3.0, optimal_max: 10.0, critical_high: 20,
      by_age: [
        { min_age: 18, max_age: 50, optimal_min: 3.0, optimal_max: 10.0, critical_high: 20 },
        { min_age: 51, max_age: 999, optimal_min: 25, optimal_max: 135 },
      ],
    } },

  { id: 'prolactin', aliases: ['prolactin'], name: 'Prolactin', domain: 'hormone_thyroid', unit: 'ng/mL',
    clinical_context: 'Elevated prolactin in non-pregnant individuals suppresses sex hormones, causes infertility, and may indicate a pituitary adenoma — a treatable and commonly missed diagnosis.',
    optimal_max: 18, critical_high: 25,
    male: { optimal_max: 14, critical_high: 20 },
    female: { optimal_max: 29, critical_high: 50 } },

  { id: 'progesterone', aliases: ['progesterone'], name: 'Progesterone', domain: 'hormone_thyroid', unit: 'ng/mL',
    clinical_context: 'Progesterone has calming, anti-inflammatory, and bone-protective effects — low levels relative to estradiol contribute to estrogen-dominance symptoms and cycle irregularity.',
    optimal_min: 0.2, optimal_max: 20, critical_high: 30,
    male: { optimal_min: 0.1, optimal_max: 1.0, critical_high: 3.0 },
    female: { optimal_min: 0.1, optimal_max: 25.0, critical_high: 40.0 } },

  { id: 'igf_1', aliases: ['igf-1', 'insulin like growth factor 1'], name: 'IGF-1', domain: 'hormone_thyroid', unit: 'ng/mL',
    clinical_context: 'IGF-1 mediates growth hormone\'s anabolic effects on muscle, bone, and organs — the GH-IGF-1 axis declines with age (somatopause) and is a key longevity lever.',
    optimal_min: 90, optimal_max: 250, critical_low: 60, critical_high: 350,
    male: {
      by_age: [
        { min_age: 18, max_age: 25, optimal_min: 135, optimal_max: 320, critical_low: 80, critical_high: 400 },
        { min_age: 26, max_age: 35, optimal_min: 115, optimal_max: 290, critical_low: 70, critical_high: 370 },
        { min_age: 36, max_age: 45, optimal_min: 100, optimal_max: 265, critical_low: 65, critical_high: 340 },
        { min_age: 46, max_age: 55, optimal_min: 85, optimal_max: 240, critical_low: 55, critical_high: 310 },
        { min_age: 56, max_age: 999, optimal_min: 70, optimal_max: 215, critical_low: 45, critical_high: 280 },
      ],
    },
    female: {
      by_age: [
        { min_age: 18, max_age: 25, optimal_min: 135, optimal_max: 320, critical_low: 80, critical_high: 400 },
        { min_age: 26, max_age: 35, optimal_min: 115, optimal_max: 290, critical_low: 70, critical_high: 370 },
        { min_age: 36, max_age: 45, optimal_min: 100, optimal_max: 265, critical_low: 65, critical_high: 340 },
        { min_age: 46, max_age: 55, optimal_min: 85, optimal_max: 240, critical_low: 55, critical_high: 310 },
        { min_age: 56, max_age: 999, optimal_min: 70, optimal_max: 215, critical_low: 45, critical_high: 280 },
      ],
    } },

  { id: 'tpo_antibodies', aliases: ['tpo ab', 'thyroid peroxidase antibodies'], name: 'TPO antibodies', domain: 'hormone_thyroid', unit: 'IU/mL',
    clinical_context: 'TPO antibodies attack the thyroid gland\'s main enzyme — the hallmark of Hashimoto\'s autoimmune thyroiditis, often present years before overt hypothyroidism develops.',
    optimal_max: 9, critical_high: 35 },

  { id: 'thyroglobulin_antibodies', aliases: ['tg ab', 'thyroglobulin antibodies'], name: 'Thyroglobulin antibodies', domain: 'hormone_thyroid', unit: 'IU/mL',
    clinical_context: 'Thyroglobulin antibodies attack the precursor of thyroid hormones — a second Hashimoto\'s marker useful when TPO antibodies are negative but clinical suspicion remains.',
    optimal_max: 4, critical_high: 20 },

  { id: 'total_t3', aliases: ['triiodothyronine', 'triiodothyronine t3', 't3'], name: 'Triiodothyronine (T3)', domain: 'hormone_thyroid', unit: 'ng/dL',
    clinical_context: 'Total T3 measures all thyroid hormone (bound and free); free T3 is more clinically precise, but total T3 provides useful context in comprehensive thyroid panels.',
    optimal_min: 90, optimal_max: 180, critical_low: 70, critical_high: 220 },

  { id: 'igf_1_z_score', aliases: ['z score', 'igf-1 z score', 'igf 1 z score'], name: 'IGF-1 Z score', domain: 'hormone_thyroid', unit: 'z-score',
    clinical_context: 'IGF-1 Z-score adjusts for the expected age-related decline, enabling comparison of IGF-1 status relative to age-matched peers rather than a fixed population normal.',
    optimal_min: -1, optimal_max: 1, critical_low: -2, critical_high: 2,
    action_low: 'Interpret IGF-1 Z score with age, nutrition, sleep, training load, and endocrine context.',
    action_high: 'Interpret IGF-1 Z score with age, symptoms, medication/supplement exposures, and endocrine context.' },

  { id: 'psa_total', aliases: ['psa total', 'psa', 'prostate specific antigen', 'psa total antigen', 'prostate-specific antigen'], name: 'PSA total', domain: 'hormone_thyroid', unit: 'ng/mL',
    clinical_context: 'PSA is secreted by prostate cells — elevated levels require careful interpretation alongside age, prostate volume, and clinical context before inferring cancer risk.',
    male_only: true, optimal_max: 2.5, critical_high: 4,
    male: {
      by_age: [
        { min_age: 0,  max_age: 49, optimal_max: 1.5, critical_high: 3.0 },
        { min_age: 50, max_age: 64, optimal_max: 2.5, critical_high: 4.0 },
        { min_age: 65, max_age: 999, optimal_max: 3.5, critical_high: 5.5 },
      ],
    },
    action_high: 'Review PSA with age, prostate size, cycling/ejaculation timing, urinary symptoms, and clinician guidance.' },

  { id: 'psa_free', aliases: ['free psa'], name: 'PSA free', domain: 'hormone_thyroid', unit: 'ng/mL',
    clinical_context: 'Free PSA is the unbound fraction of total PSA — a higher free-to-total ratio generally favors benign prostate enlargement over prostate cancer.',
    male_only: true, optimal_min: 0.2, critical_low: 0.1 },

  { id: 'psa_percent_free', aliases: ['psa % free', 'percent free psa', 'psa free percent'], name: 'PSA % free', domain: 'hormone_thyroid', unit: '%',
    clinical_context: 'Percent free PSA is the proportion of PSA that circulates unbound — values below 25% at elevated total PSA increase the probability of prostate cancer versus benign disease.',
    male_only: true, optimal_min: 25, critical_low: 10,
    action_low: 'Interpret % free PSA only alongside total PSA, age, prostate history, and clinician review.' },

  { id: 'anti_mullerian_hormone', aliases: ['amh', 'anti-mullerian hormone', 'anti mullerian hormone'], name: 'Anti-Mullerian Hormone', domain: 'hormone_thyroid', unit: 'ng/mL',
    clinical_context: 'AMH reflects ovarian reserve — the number of remaining egg follicles — and is the most reliable single blood marker of reproductive aging in women.',
    female_only: true, optimal_min: 1, optimal_max: 4, critical_low: 0.3, critical_high: 8,
    female: {
      by_age: [
        { min_age: 18, max_age: 25, optimal_min: 2.5, optimal_max: 7.5, critical_low: 1.0 },
        { min_age: 26, max_age: 30, optimal_min: 2.0, optimal_max: 7.0, critical_low: 0.7 },
        { min_age: 31, max_age: 35, optimal_min: 1.5, optimal_max: 6.0, critical_low: 0.5 },
        { min_age: 36, max_age: 40, optimal_min: 0.8, optimal_max: 4.5, critical_low: 0.3 },
        { min_age: 41, max_age: 45, optimal_min: 0.3, optimal_max: 3.5, critical_low: 0.1 },
        { min_age: 46, max_age: 999, optimal_min: 0.0, optimal_max: 2.0 },
      ],
    },
    action_low: 'Interpret AMH with age, cycle context, fertility goals, and clinician guidance.',
    action_high: 'Interpret AMH with age, cycle context, PCOS features, fertility goals, and clinician guidance.' },

  // ── Organ function ──
  { id: 'alt', aliases: ['alanine aminotransferase'], name: 'ALT', domain: 'organ_function', unit: 'U/L',
    clinical_context: 'ALT is released from liver cells when damaged — a sensitive early marker of hepatocellular injury from fatty liver, alcohol, medications, or supplements.',
    optimal_max: 25, critical_high: 55, action_high: 'Review alcohol, liver fat risk, medications/supplements, hard training, and repeat with AST/GGT.' },

  { id: 'ast', aliases: ['aspartate aminotransferase'], name: 'AST', domain: 'organ_function', unit: 'U/L',
    clinical_context: 'AST is found in liver and muscle — elevated AST without proportional ALT elevation more often reflects muscle damage than liver disease.',
    optimal_max: 30, critical_high: 55 },

  { id: 'ggt', aliases: ['gamma gt'], name: 'GGT', domain: 'organ_function', unit: 'U/L',
    clinical_context: 'GGT rises with alcohol intake, liver stress, and oxidative burden — an independently predictive cardiovascular risk marker with broader significance than its liver-enzyme label suggests.',
    optimal_max: 30, critical_high: 60, action_high: 'Review alcohol, liver stress, oxidative burden, and medication/supplement exposures.' },

  { id: 'alp', aliases: ['alkaline phosphatase'], name: 'ALP', domain: 'organ_function', unit: 'U/L',
    clinical_context: 'ALP is produced in liver bile ducts and bone — disproportionate elevation versus aminotransferases points toward cholestatic liver disease or bone-related conditions.',
    optimal_min: 40, optimal_max: 100, critical_high: 150 },

  { id: 'bilirubin', aliases: ['total bilirubin'], name: 'Bilirubin', domain: 'organ_function', unit: 'mg/dL',
    clinical_context: 'Bilirubin is a hemoglobin breakdown product cleared by the liver — mildly elevated bilirubin (as in Gilbert\'s syndrome) is usually benign, while higher levels suggest liver dysfunction or hemolysis.',
    optimal_min: 0.3, optimal_max: 1.2, critical_high: 2 },

  { id: 'creatinine', aliases: ['serum creatinine'], name: 'Creatinine', domain: 'organ_function', unit: 'mg/dL',
    clinical_context: 'Creatinine is a muscle metabolism byproduct cleared by kidneys — elevated levels indicate reduced filtering function, but values are influenced by muscle mass and protein intake.',
    optimal_min: 0.6, optimal_max: 1.2, critical_high: 1.5,
    male: { optimal_min: 0.7, optimal_max: 1.2, critical_high: 1.6 },
    female: { optimal_min: 0.5, optimal_max: 1.0, critical_high: 1.3 } },

  { id: 'egfr', aliases: ['eGFR'], name: 'eGFR', domain: 'organ_function', unit: 'mL/min/1.73m2',
    clinical_context: 'eGFR estimates the rate at which kidneys filter waste — values below 60 define chronic kidney disease, and below 30 indicate severely reduced function.',
    optimal_min: 90, critical_low: 60, action_low: 'Repeat with hydration context and review kidney risk factors with a clinician.' },

  { id: 'bun', aliases: ['urea nitrogen', 'urea'], name: 'BUN', domain: 'organ_function', unit: 'mg/dL',
    clinical_context: 'BUN reflects protein breakdown and kidney clearance — must be paired with creatinine to distinguish dietary protein effects from kidney dysfunction.',
    optimal_min: 8, optimal_max: 20, critical_high: 30 },

  { id: 'bun_creatinine_ratio', aliases: ['bun creatinine ratio', 'bun/creatinine'], name: 'BUN / creatinine ratio', domain: 'organ_function', unit: 'ratio',
    clinical_context: 'BUN divided by creatinine helps separate hydration, protein turnover, and renal-clearance context better than either marker alone.',
    optimal_min: 10, optimal_max: 20, critical_low: 8, critical_high: 30 },

  { id: 'albumin', aliases: ['serum albumin'], name: 'Albumin', domain: 'organ_function', unit: 'g/dL',
    clinical_context: 'Albumin is the most abundant blood protein produced by the liver — low levels signal malnutrition, chronic liver disease, or protein loss and are a powerful predictor of mortality.',
    optimal_min: 4.2, optimal_max: 5, critical_low: 3.5 },

  { id: 'albumin_globulin_ratio', aliases: ['a/g ratio', 'albumin globulin ratio'], name: 'Albumin / globulin ratio', domain: 'organ_function', unit: 'ratio',
    clinical_context: 'Albumin divided by globulin summarizes liver protein synthesis, nutritional reserve, and immune-protein burden from the protein panel.',
    optimal_min: 1.2, optimal_max: 2.2, critical_low: 1, critical_high: 3 },

  { id: 'sodium', aliases: ['sodium'], name: 'Sodium', domain: 'organ_function', unit: 'mmol/L',
    clinical_context: 'Sodium regulates fluid balance, blood pressure, and neurological function — blood sodium abnormalities typically reflect fluid shifts rather than dietary sodium intake.',
    optimal_min: 136, optimal_max: 145, critical_low: 132, critical_high: 150 },

  { id: 'potassium', aliases: ['potassium'], name: 'Potassium', domain: 'organ_function', unit: 'mmol/L',
    clinical_context: 'Potassium is critical for cardiac rhythm and muscle function — abnormalities in either direction can be medically urgent and require immediate clinical context.',
    optimal_min: 3.8, optimal_max: 5.0, critical_low: 3.2, critical_high: 5.5 },

  { id: 'chloride', aliases: ['chloride'], name: 'Chloride', domain: 'organ_function', unit: 'mmol/L',
    clinical_context: 'Chloride is the primary extracellular anion maintaining electrical neutrality alongside sodium — moves in tandem with sodium in most physiological conditions.',
    optimal_min: 98, optimal_max: 107, critical_low: 95, critical_high: 112 },

  { id: 'co2', aliases: ['carbon dioxide', 'bicarbonate'], name: 'CO2', domain: 'organ_function', unit: 'mmol/L',
    clinical_context: 'CO2 (bicarbonate) reflects the body\'s acid-base buffering capacity — low values indicate metabolic acidosis from kidney disease, diabetes, or high acid load.',
    optimal_min: 22, optimal_max: 29, critical_low: 18, critical_high: 33 },

  { id: 'calculated_osmolality', aliases: ['calculated serum osmolality', 'serum osmolality calculated'], name: 'Calculated osmolality', domain: 'organ_function', unit: 'mOsm/kg',
    clinical_context: 'Calculated osmolality combines sodium, glucose, and urea nitrogen to estimate hydration and solute concentration from common chemistry markers.',
    optimal_min: 275, optimal_max: 295, critical_low: 270, critical_high: 305 },

  { id: 'calcium', aliases: ['serum calcium'], name: 'Calcium', domain: 'organ_function', unit: 'mg/dL',
    clinical_context: 'Calcium is essential for bone structure, muscle contraction, and nerve signaling — hypercalcemia often signals parathyroid disorders or malignancy.',
    optimal_min: 8.8, optimal_max: 10.2, critical_low: 8, critical_high: 11 },

  { id: 'corrected_calcium', aliases: ['albumin corrected calcium'], name: 'Corrected calcium', domain: 'organ_function', unit: 'mg/dL',
    clinical_context: 'Corrected calcium adjusts total calcium for albumin concentration, improving interpretation when protein status shifts total calcium.',
    optimal_min: 8.8, optimal_max: 10.2, critical_low: 8, critical_high: 11 },

  { id: 'phosphorus', aliases: ['phosphate'], name: 'Phosphorus', domain: 'organ_function', unit: 'mg/dL',
    clinical_context: 'Phosphorus works with calcium in bone mineralization and ATP energy production — inversely regulated with calcium through parathyroid hormone and vitamin D.',
    optimal_min: 2.5, optimal_max: 4.5, critical_low: 2, critical_high: 5.5 },

  { id: 'total_protein', aliases: ['protein total'], name: 'Total protein', domain: 'organ_function', unit: 'g/dL',
    clinical_context: 'Total protein reflects the combined concentration of albumin and globulin — providing a broad view of nutritional status and immune protein production.',
    optimal_min: 6.4, optimal_max: 8.3, critical_low: 5.8, critical_high: 9 },

  { id: 'globulin', aliases: ['globulin'], name: 'Globulin', domain: 'organ_function', unit: 'g/dL',
    clinical_context: 'Globulin (total protein minus albumin) includes immune proteins — elevated globulin can indicate chronic infection, autoimmune disease, or rarely a plasma cell disorder.',
    optimal_min: 2.0, optimal_max: 3.5, critical_high: 4.5 },

  { id: 'ast_alt_ratio', aliases: ['ast alt ratio', 'ast/alt'], name: 'AST / ALT ratio', domain: 'organ_function', unit: 'ratio',
    clinical_context: 'AST divided by ALT helps pattern liver and muscle enzyme elevations when interpreted alongside GGT, ALP, bilirubin, training load, and alcohol context.',
    optimal_max: 1.5, critical_high: 2 },

  { id: 'fib4_index', aliases: ['fib-4', 'fib4'], name: 'FIB-4 fibrosis index', domain: 'organ_function', unit: 'index',
    clinical_context: 'FIB-4 combines age, AST, ALT, and platelets into a non-invasive liver fibrosis screen that can guide whether liver risk needs deeper follow-up.',
    optimal_max: 1.3, critical_high: 2.67 },

  { id: 'apri', aliases: ['aspartate aminotransferase platelet ratio index'], name: 'APRI', domain: 'organ_function', unit: 'index',
    clinical_context: 'APRI combines AST and platelets into a non-invasive liver fibrosis context marker, especially useful when tracked with other liver enzymes.',
    optimal_max: 0.5, critical_high: 1.5 },

  { id: 'crp_albumin_ratio', aliases: ['crp albumin ratio', 'crp/albumin'], name: 'CRP / albumin ratio', domain: 'organ_function', unit: 'ratio',
    clinical_context: 'CRP divided by albumin relates inflammatory burden to liver/nutritional protein reserve and can add context to recovery and immune stress.',
    optimal_max: 0.2, critical_high: 1 },

  { id: 'fibrinogen_albumin_ratio', aliases: ['fibrinogen albumin ratio', 'fibrinogen/albumin'], name: 'Fibrinogen / albumin ratio', domain: 'organ_function', unit: 'ratio',
    clinical_context: 'Fibrinogen divided by albumin combines coagulation/inflammation tone with protein reserve, adding context when both markers are ordered together.',
    optimal_max: 80, critical_high: 120 },

  { id: 'cystatin_c', aliases: ['cystatin c'], name: 'Cystatin C', domain: 'organ_function', unit: 'mg/L',
    clinical_context: 'Cystatin C is filtered purely by the glomerulus, making it a more accurate kidney function marker than creatinine — especially important in people with unusual muscle mass.',
    optimal_max: 1.0, critical_high: 1.3 },

  { id: 'urine_albumin_creatinine', aliases: ['uacr', 'albumin creatinine ratio'], name: 'Urine albumin/creatinine ratio', domain: 'organ_function', unit: 'mg/g',
    clinical_context: 'UACR detects early kidney damage — even mild albuminuria predicts accelerated kidney decline and cardiovascular risk, often appearing before eGFR worsens.',
    optimal_max: 30, critical_high: 300 },

  { id: 'creatine_kinase', aliases: ['ck'], name: 'Creatine kinase', domain: 'organ_function', unit: 'U/L',
    clinical_context: 'CK is released from muscle when damaged — transiently elevated after intense exercise but chronically elevated CK warrants investigation for muscle disease.',
    optimal_max: 200, critical_high: 600 },

  { id: 'ldh', aliases: ['lactate dehydrogenase'], name: 'LDH', domain: 'organ_function', unit: 'U/L',
    clinical_context: 'LDH is released from many cell types during injury — a non-specific but useful marker for hemolysis, tissue damage, or certain cancers when combined with other findings.',
    optimal_min: 120, optimal_max: 240, critical_high: 300 },

  // ── Urinalysis (organ function, qualitative) ──
  { id: 'urine_appearance', aliases: ['appearance urine', 'urine appearance', 'character urine', 'urine character'], name: 'Appearance (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: ['clear', 'normal'], qualitative_watch: ['hazy', 'slightly cloudy'], qualitative_attention: ['cloudy', 'turbid'], action_watch: URINE_ACTION },
  { id: 'urine_color', aliases: ['color urine', 'urine color'], name: 'Color (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: ['yellow', 'pale yellow', 'straw', 'amber', 'normal'], qualitative_watch: ['dark yellow', 'orange'], qualitative_attention: ['red', 'brown', 'tea colored', 'abnormal'], action_watch: URINE_ACTION },
  { id: 'urine_bacteria', aliases: ['bacteria urine', 'urine bacteria'], name: 'Bacteria (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Bacteria in urine may indicate a urinary tract infection — interpret with symptoms, leukocyte esterase, nitrite, and WBC before concluding an active infection.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_bilirubin', aliases: ['bilirubin urine', 'urine bilirubin'], name: 'Bilirubin (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Urine bilirubin is normally absent — its presence suggests liver dysfunction or biliary obstruction and warrants correlation with serum bilirubin and liver enzymes.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_crystals', aliases: ['crystals urine', 'urine crystals'], name: 'Crystals (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_epithelial_cast', aliases: ['epithelial cast urine', 'urine epithelial cast'], name: 'Epithelial Cast (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_epithelial_cells', aliases: ['epithelial cells urine', 'urine epithelial cells'], name: 'Epithelial Cells (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_renal_epithelial_cells', aliases: ['renal epithelial cells urine', 'urine renal epithelial cells'], name: 'Renal Epithelial Cells (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Renal epithelial cells in urine suggest tubular injury — a finding that warrants correlation with eGFR, cystatin C, and clinical context.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_squamous_epithelial_cells', aliases: ['squamous epithelial cells urine', 'urine squamous epithelial cells'], name: 'Squamous Epithelial Cells (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_fatty_cast', aliases: ['fatty cast urine', 'urine fatty cast'], name: 'Fatty Cast (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_glucose', aliases: ['glucose urine', 'urine glucose'], name: 'Glucose (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Urine glucose typically means blood glucose exceeded the kidney reabsorption threshold — interpret alongside fasting glucose and HbA1c.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: 'Urine glucose should be interpreted alongside fasting glucose, HbA1c, kidney threshold, and medication context.' },
  { id: 'urine_granular_cast', aliases: ['granular cast urine', 'urine granular cast'], name: 'Granular Cast (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_occult_blood', aliases: ['occult blood urine', 'blood urine', 'urine occult blood'], name: 'Occult Blood (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Blood in urine can reflect kidney, urinary tract, or menstrual sources — persistent occult blood requires evaluation to exclude kidney or bladder pathology.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: 'Repeat urinalysis away from hard exercise and menstruation context; review persistent blood with a clinician.' },
  { id: 'urine_hyaline_cast', aliases: ['hyaline cast urine', 'urine hyaline cast'], name: 'Hyaline Cast (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_ketones_confirmation', aliases: ['ketones confirmation urine', 'urine ketones confirmation'], name: 'Ketones Confirmation (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Urine ketones indicate fat is being burned for fuel — normal during fasting or low-carb diets but potentially concerning in diabetics with elevated glucose.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: 'Interpret urine ketones with fasting, carbohydrate intake, diabetes medication status, hydration, and symptoms.' },
  { id: 'urine_ketones', aliases: ['ketones urine', 'urine ketones'], name: 'Ketones (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Urine ketones indicate fat is being burned for fuel — normal during fasting or low-carb diets but potentially concerning in diabetics with elevated glucose.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: 'Interpret urine ketones with fasting, carbohydrate intake, diabetes medication status, hydration, and symptoms.' },
  { id: 'urine_leukocyte_esterase', aliases: ['leukocyte esterase urine', 'urine leukocyte esterase'], name: 'Leukocyte Esterase (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Leukocyte esterase detects white blood cells in urine — a marker of urinary inflammation or infection that must be paired with symptoms and other urinalysis findings.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: 'Positive leukocyte esterase can reflect urinary inflammation or infection; interpret with nitrite, WBC, symptoms, and clinician review.' },
  { id: 'urine_nitrite', aliases: ['nitrite urine', 'urine nitrite'], name: 'Nitrite (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Positive nitrite suggests gram-negative bacteria are converting nitrate to nitrite in the bladder — when combined with leukocyte esterase, strongly suggests a urinary tract infection.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: 'Positive nitrite can suggest bacteriuria; interpret with symptoms, leukocyte esterase, WBC, and clinician review.' },
  { id: 'urine_ph', aliases: ['ph urine', 'urine ph', 'pH (Urine)'], name: 'pH (Urine)', domain: 'organ_function', unit: 'pH', clinical_context: 'Urine pH reflects dietary acid load, hydration, and kidney acid-base regulation — extreme values may indicate metabolic disorders or risks for certain kidney stone types.', optimal_min: 5, optimal_max: 7.5, critical_low: 4.5, critical_high: 8.5, action_low: URINE_ACTION, action_high: URINE_ACTION },
  { id: 'urine_protein', aliases: ['protein urine', 'urine protein'], name: 'Protein (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Urine protein signals kidney filtration impairment — even persistent trace amounts warrant monitoring alongside UACR and eGFR as an early kidney damage marker.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: 'Interpret urine protein with UACR, blood pressure, exercise timing, hydration, and kidney markers.' },
  { id: 'urine_rbc_cast', aliases: ['rbc cast urine', 'urine rbc cast'], name: 'RBC Cast (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'RBC casts in urine indicate glomerular bleeding from the kidney itself — a specific finding suggesting glomerulonephritis that warrants urgent clinical evaluation.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_rbc', aliases: ['rbc urine', 'urine rbc', 'red blood cells urine'], name: 'RBC (Urine)', domain: 'organ_function', unit: 'cells/hpf', clinical_context: 'Red blood cells in urine can come from the kidney, ureter, bladder, or urethra — context (exercise, menstruation, symptoms) determines clinical significance.', optimal_max: 2, critical_high: 10, action_high: 'Repeat urinalysis away from hard exercise and menstruation context; review persistent RBCs with a clinician.' },
  { id: 'urine_reducing_substances', aliases: ['reducing substances urine', 'urine reducing substances'], name: 'Reducing Substances (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_specific_gravity', aliases: ['specific gravity urine', 'urine specific gravity'], name: 'Specific Gravity (Urine)', domain: 'organ_function', unit: 'specific gravity', clinical_context: 'Urine specific gravity reflects hydration status and kidney concentrating ability — very low values suggest overhydration or impaired concentration, very high values indicate dehydration.', optimal_min: 1.005, optimal_max: 1.03, critical_low: 1.002, critical_high: 1.035, action_low: 'Specific gravity reflects hydration and concentrating ability; interpret with fluid intake, electrolytes, and kidney context.', action_high: 'Specific gravity reflects hydration and concentrating ability; interpret with fluid intake, glucose/ketones, and kidney context.' },
  { id: 'urine_sperm_cells', aliases: ['sperm cells urine', 'urine sperm cells'], name: 'Sperm Cells (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: URINE_CONTEXT, qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_trichomonas', aliases: ['trichomonas urine', 'urine trichomonas'], name: 'Trichomonas (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Trichomonas vaginalis in urine indicates a parasitic sexually transmitted infection that is highly treatable with antibiotics.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_urobilinogen', aliases: ['urobilinogen urine', 'urine urobilinogen'], name: 'Urobilinogen (Urine)', domain: 'organ_function', unit: 'mg/dL', clinical_context: 'Urine urobilinogen is a bilirubin breakdown product — elevated levels can reflect liver dysfunction or hemolysis; absent levels may indicate bile duct obstruction.', optimal_max: 1, critical_high: 2, action_high: 'Interpret urine urobilinogen with bilirubin, liver enzymes, hemolysis context, and clinician review.' },
  { id: 'urine_waxy_cast', aliases: ['waxy cast urine', 'urine waxy cast'], name: 'Waxy Cast (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Waxy casts suggest advanced kidney disease with tubular stasis — their presence warrants urgent correlation with eGFR, cystatin C, and clinical evaluation.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_wbc_cast', aliases: ['wbc cast urine', 'urine wbc cast'], name: 'WBC Cast (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'WBC casts in urine indicate kidney tubular inflammation, most often from pyelonephritis — a specific finding that warrants clinical evaluation.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },
  { id: 'urine_wbc', aliases: ['wbc urine', 'urine wbc', 'white blood cells urine'], name: 'WBC (Urine)', domain: 'organ_function', unit: 'cells/hpf', clinical_context: 'White blood cells in urine reflect urinary tract inflammation or infection — interpret in the context of symptoms, leukocyte esterase, nitrite, and bacteria results.', optimal_max: 5, critical_high: 20, action_high: 'Interpret urine WBC with symptoms, leukocyte esterase, nitrite, bacteria, and clinician review.' },
  { id: 'urine_yeast', aliases: ['yeast urine', 'urine yeast'], name: 'Yeast (Urine)', domain: 'organ_function', unit: 'qualitative', value_type: 'qualitative', clinical_context: 'Yeast in urine may indicate candiduria — more significant in immunocompromised individuals or those with indwelling catheters than in otherwise healthy people.', qualitative_normal: URINE_NEGATIVE_VALUES, qualitative_watch: URINE_TRACE_VALUES, qualitative_attention: URINE_POSITIVE_VALUES, action_watch: URINE_ACTION },

  // ── Hematology ──
  { id: 'hemoglobin', aliases: ['hgb'], name: 'Hemoglobin', domain: 'hematology', unit: 'g/dL',
    clinical_context: 'Hemoglobin carries oxygen in red blood cells — low levels define anemia, impairing exercise capacity and tissue oxygenation; normal ranges differ by sex.',
    optimal_min: 13, optimal_max: 16, critical_low: 11, critical_high: 18,
    male: { optimal_min: 13.5, optimal_max: 17.5, critical_low: 11, critical_high: 18.5 },
    female: { optimal_min: 12.0, optimal_max: 16.0, critical_low: 10.0, critical_high: 17.0 } },

  { id: 'hematocrit', aliases: ['hct'], name: 'Hematocrit', domain: 'hematology', unit: '%',
    clinical_context: 'Hematocrit is the fraction of blood volume occupied by red blood cells — parallels hemoglobin as a measure of oxygen-carrying capacity and blood viscosity.',
    optimal_min: 38, optimal_max: 48, critical_low: 34, critical_high: 54,
    male: { optimal_min: 41, optimal_max: 53, critical_low: 34, critical_high: 56 },
    female: { optimal_min: 36, optimal_max: 48, critical_low: 31, critical_high: 51 } },

  { id: 'platelets', aliases: ['plt'], name: 'Platelets', domain: 'hematology', unit: '10^9/L',
    clinical_context: 'Platelets are cell fragments essential for clotting — too few increases bleeding risk while thrombocytosis (excess) can increase clotting and cardiovascular event risk.',
    optimal_min: 180, optimal_max: 350, critical_low: 120, critical_high: 450 },

  { id: 'rdw', aliases: ['red cell distribution width'], name: 'RDW', domain: 'hematology', unit: '%',
    clinical_context: 'RDW measures variation in red blood cell size — elevated values often signal nutritional deficiencies (iron, B12, folate) before frank anemia develops and independently predict mortality.',
    optimal_max: 13.5, critical_high: 15 },

  { id: 'mcv', aliases: ['mean corpuscular volume'], name: 'MCV', domain: 'hematology', unit: 'fL',
    clinical_context: 'MCV measures average red blood cell volume — small cells suggest iron deficiency while large cells indicate B12/folate deficiency or liver disease.',
    optimal_min: 82, optimal_max: 96, critical_low: 78, critical_high: 100 },

  { id: 'apoa1', aliases: ['apolipoprotein a1', 'apo a1'], name: 'ApoA1', domain: 'cardiometabolic', unit: 'mg/dL',
    clinical_context: 'ApoA1 is the structural protein of HDL particles — reflects the number and functionality of protective lipoproteins involved in reverse cholesterol transport.',
    optimal_min: 120, critical_low: 100 },

  { id: 'rbc', aliases: ['red blood cells', 'red blood cell count'], name: 'Red blood cells', domain: 'hematology', unit: '10^12/L',
    clinical_context: 'RBC count combined with hemoglobin, MCV, and MCH characterizes the nature and cause of anemia — normal ranges differ meaningfully between males and females.',
    optimal_min: 4.2, optimal_max: 5.8, critical_low: 3.8, critical_high: 6.2,
    male: { optimal_min: 4.5, optimal_max: 5.9, critical_low: 3.9, critical_high: 6.3 },
    female: { optimal_min: 4.0, optimal_max: 5.4, critical_low: 3.5, critical_high: 5.8 } },

  { id: 'mch', aliases: ['mean corpuscular hemoglobin'], name: 'MCH', domain: 'hematology', unit: 'pg',
    clinical_context: 'MCH is the average hemoglobin content per red blood cell — low MCH parallels low MCV in iron-deficiency anemia.',
    optimal_min: 27, optimal_max: 33, critical_low: 25, critical_high: 35 },

  { id: 'mchc', aliases: ['mean corpuscular hemoglobin concentration'], name: 'MCHC', domain: 'hematology', unit: 'g/dL',
    clinical_context: 'MCHC is the concentration of hemoglobin within red blood cells — low MCHC indicates hypochromic (iron-poor) anemia.',
    optimal_min: 32, optimal_max: 36, critical_low: 30, critical_high: 38 },

  { id: 'mentzer_index', aliases: ['mentzer'], name: 'Mentzer index', domain: 'hematology', unit: 'index',
    clinical_context: 'Mentzer index combines MCV and RBC count to add context to microcytic anemia patterns when CBC indices are available.',
    optimal_min: 10, optimal_max: 20, critical_low: 9, critical_high: 25 },

  { id: 'estimated_mchc', aliases: ['estimated mchc', 'hemoglobin hematocrit ratio'], name: 'Estimated MCHC', domain: 'hematology', unit: 'g/dL',
    clinical_context: 'Estimated MCHC uses hemoglobin and hematocrit as a consistency check when direct MCHC is missing from the CBC.',
    optimal_min: 32, optimal_max: 36, critical_low: 30, critical_high: 38 },

  { id: 'mpv', aliases: ['mean platelet volume'], name: 'MPV', domain: 'hematology', unit: 'fL',
    clinical_context: 'MPV measures average platelet size — larger platelets are more metabolically active, and elevated MPV with low count may indicate rapid platelet consumption.',
    optimal_min: 7.5, optimal_max: 11.5, critical_high: 13 },

  { id: 'monocytes', aliases: ['absolute monocytes'], name: 'Monocytes', domain: 'hematology', unit: '10^9/L',
    clinical_context: 'Monocytes are innate immune cells that differentiate into macrophages in tissues — persistently elevated counts suggest chronic infection, inflammation, or a bone marrow condition.',
    optimal_min: 0.2, optimal_max: 0.8, critical_high: 1.2 },

  { id: 'eosinophils', aliases: ['absolute eosinophils'], name: 'Eosinophils', domain: 'hematology', unit: '10^9/L',
    clinical_context: 'Eosinophils drive allergic responses and antiparasitic immunity — elevated counts most commonly reflect allergy, atopy, or helminth infection.',
    optimal_max: 0.5, critical_high: 1.0 },

  { id: 'basophils', aliases: ['absolute basophils'], name: 'Basophils', domain: 'hematology', unit: '10^9/L',
    clinical_context: 'Basophils are the rarest white blood cells involved in allergic and inflammatory responses — basophilia is uncommon and warrants further investigation.',
    optimal_max: 0.2, critical_high: 0.4 },

  { id: 'reticulocyte_count', aliases: ['reticulocytes'], name: 'Reticulocyte count', domain: 'hematology', unit: '%',
    clinical_context: 'Reticulocytes are immature red blood cells released from bone marrow — a low count alongside anemia suggests bone marrow failure or nutritional deficiency rather than blood loss.',
    optimal_min: 0.5, optimal_max: 2.5, critical_high: 4 },
];

// ── Lookup map ────────────────────────────────────────────────────────────────

function normalizeId(id: string): string {
  return id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function buildDefinitionMap(): Map<string, BiomarkerDefinition> {
  const map = new Map<string, BiomarkerDefinition>();
  for (const def of BIOMARKER_DEFINITIONS) {
    map.set(normalizeId(def.id), def);
    map.set(normalizeId(def.name), def);
    for (const alias of def.aliases) map.set(normalizeId(alias), def);
  }
  return map;
}

const DEF_BY_ID = buildDefinitionMap();

// ── Age/sex stratified range resolution ──────────────────────────────────────

function getEffectiveRanges(def: BiomarkerDefinition, profile?: UserProfile): RangeSet {
  const base: RangeSet = {
    optimal_min: def.optimal_min,
    optimal_max: def.optimal_max,
    critical_low: def.critical_low,
    critical_high: def.critical_high,
  };

  const sexOverride = profile?.sex === 'male' ? def.male : profile?.sex === 'female' ? def.female : undefined;
  if (!sexOverride) return base;

  // Apply sex-level overrides
  const merged: RangeSet = {
    optimal_min: sexOverride.optimal_min ?? base.optimal_min,
    optimal_max: sexOverride.optimal_max ?? base.optimal_max,
    critical_low: sexOverride.critical_low ?? base.critical_low,
    critical_high: sexOverride.critical_high ?? base.critical_high,
  };

  // Refine with age-specific range if profile.age is provided
  if (sexOverride.by_age && profile?.age != null) {
    const ageRange = sexOverride.by_age.find(r => profile.age! >= r.min_age && profile.age! <= r.max_age);
    if (ageRange) {
      if (ageRange.optimal_min != null) merged.optimal_min = ageRange.optimal_min;
      if (ageRange.optimal_max != null) merged.optimal_max = ageRange.optimal_max;
      if (ageRange.critical_low != null) merged.critical_low = ageRange.critical_low;
      if (ageRange.critical_high != null) merged.critical_high = ageRange.critical_high;
    }
  }

  return merged;
}

// ── Scoring ───────────────────────────────────────────────────────────────────

interface ScoredResult {
  status: SignalStatus;
  score: number;
  direction: 'low' | 'high' | 'ok';
  ranges: RangeSet;
}

function scoreReading(value: number, def: BiomarkerDefinition, profile?: UserProfile): ScoredResult {
  const ranges = getEffectiveRanges(def, profile);

  if (ranges.critical_low != null && value < ranges.critical_low) return { status: 'needs_attention', score: 25, direction: 'low', ranges };
  if (ranges.critical_high != null && value > ranges.critical_high) return { status: 'needs_attention', score: 25, direction: 'high', ranges };

  if (ranges.optimal_min != null && value < ranges.optimal_min) {
    const floor = ranges.critical_low ?? 0;
    const span = Math.max(0.001, ranges.optimal_min - floor);
    return { status: 'watch', score: Math.max(35, Math.round(70 - ((ranges.optimal_min - value) / span) * 35)), direction: 'low', ranges };
  }
  if (ranges.optimal_max != null && value > ranges.optimal_max) {
    const ceiling = ranges.critical_high ?? ranges.optimal_max * 1.5;
    const span = Math.max(0.001, ceiling - ranges.optimal_max);
    return { status: 'watch', score: Math.max(35, Math.round(70 - ((value - ranges.optimal_max) / span) * 35)), direction: 'high', ranges };
  }
  return { status: 'optimal', score: 90, direction: 'ok', ranges };
}

function normalizeQualitative(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

function matchesQualitative(value: string, candidates?: string[]): boolean {
  if (!candidates || candidates.length === 0) return false;
  const normalized = normalizeQualitative(value);
  return candidates.some(candidate => {
    const target = normalizeQualitative(candidate);
    return normalized === target || normalized.includes(target);
  });
}

function scoreQualitativeReading(reading: BiomarkerReading, def: BiomarkerDefinition): ScoredResult {
  const ranges: RangeSet = {};
  const raw = reading.raw_value ?? String(reading.value);
  if (matchesQualitative(raw, def.qualitative_attention)) return { status: 'needs_attention', score: 35, direction: 'high', ranges };
  if (matchesQualitative(raw, def.qualitative_watch)) return { status: 'watch', score: 60, direction: 'high', ranges };
  if (matchesQualitative(raw, def.qualitative_normal)) return { status: 'optimal', score: 90, direction: 'ok', ranges };
  return reading.value > 0
    ? { status: 'watch', score: 60, direction: 'high', ranges }
    : { status: 'optimal', score: 85, direction: 'ok', ranges };
}

// ── Interpretation generation ─────────────────────────────────────────────────

function formatRangeStr(ranges: RangeSet, unit: string): string {
  if (ranges.optimal_min != null && ranges.optimal_max != null) return ` (${ranges.optimal_min}–${ranges.optimal_max} ${unit})`;
  if (ranges.optimal_min != null) return ` (≥${ranges.optimal_min} ${unit})`;
  if (ranges.optimal_max != null) return ` (≤${ranges.optimal_max} ${unit})`;
  return '';
}

function targetLabelFor(ranges: RangeSet, unit: string): string {
  const suffix = unit ? ` ${unit}` : '';
  if (ranges.optimal_min != null && ranges.optimal_max != null) return `${ranges.optimal_min}-${ranges.optimal_max}${suffix}`;
  if (ranges.optimal_min != null) return `>=${ranges.optimal_min}${suffix}`;
  if (ranges.optimal_max != null) return `<=${ranges.optimal_max}${suffix}`;
  return 'Expected pattern';
}

function statusLabelFor(status: SignalStatus): string {
  if (status === 'optimal') return 'In target';
  if (status === 'watch') return 'Monitor';
  if (status === 'needs_attention') return 'Act on this';
  return 'Not measured';
}

function interpretationFor(
  def: BiomarkerDefinition,
  value: number,
  status: SignalStatus,
  direction: 'low' | 'high' | 'ok',
  displayValue: string,
  ranges: RangeSet,
): string {
  const context = def.clinical_context ? ` ${def.clinical_context}` : '';

  if (status === 'optimal') {
    const rangeStr = formatRangeStr(ranges, def.unit);
    return `Your ${def.name} of ${displayValue} is within the optimal range${rangeStr}.${context}`;
  }

  const directionWord = direction === 'high' ? 'above' : 'below';
  const severity = status === 'needs_attention' ? 'significantly ' : '';
  const rangeStr = formatRangeStr(ranges, def.unit);

  return `Your ${def.name} of ${displayValue} is ${severity}${directionWord} the optimal target${rangeStr}.${context}`;
}

function qualitativeInterpretationFor(def: BiomarkerDefinition, displayValue: string, status: SignalStatus): string {
  const context = def.clinical_context ? ` ${def.clinical_context}` : '';
  if (status === 'optimal') {
    return `Your ${def.name} result of "${displayValue}" is within the expected normal pattern.${context}`;
  }
  const level = status === 'needs_attention' ? 'a significantly elevated' : 'an elevated';
  return `Your ${def.name} shows ${level} result of "${displayValue}".${context}`;
}

function actionFor(def: BiomarkerDefinition, status: SignalStatus, direction: 'low' | 'high' | 'ok'): string {
  if (status === 'optimal') return `Maintain current habits and retest ${def.name} with the next biomarker cycle.`;
  if (direction === 'low' && def.action_low) return def.action_low;
  if (direction === 'high' && def.action_high) return def.action_high;
  return def.action_watch ?? DEFAULT_ACTIONS[def.domain];
}

function statusFromScore(score: number): SignalStatus {
  if (score >= 80) return 'optimal';
  if (score >= 55) return 'watch';
  return 'needs_attention';
}

// ── Domain scores ─────────────────────────────────────────────────────────────

function domainScores(findings: BiomarkerFinding[]): BiomarkerDomainScore[] {
  return (Object.keys(DOMAIN_NAMES) as BiomarkerDomainId[]).map((domain) => {
    const defs = BIOMARKER_DEFINITIONS.filter(d => d.domain === domain);
    const domainFindings = findings.filter(f => f.domain === domain);
    const measuredIds = new Set(domainFindings.map(f => f.id));
    const missing = defs.filter(d => !measuredIds.has(d.id)).slice(0, 5).map(d => d.name);
    const score = domainFindings.length
      ? Math.round(domainFindings.reduce((sum, f) => sum + f.score, 0) / domainFindings.length)
      : 0;
    const top = domainFindings.slice().sort((a, b) => a.score - b.score).slice(0, 3);
    return {
      id: domain,
      name: DOMAIN_NAMES[domain],
      score,
      status: domainFindings.length ? statusFromScore(score) : 'missing',
      measured: domainFindings.length,
      missing,
      top_findings: top.map(f => `${f.name}: ${f.status}`),
      actions: top.length ? Array.from(new Set(top.map(f => f.action))).slice(0, 3) : [DEFAULT_ACTIONS[domain]],
    };
  });
}

// ── Derived biomarkers ────────────────────────────────────────────────────────

function deriveHomaIR(readings: BiomarkerReading[]): BiomarkerReading[] {
  const byId = new Map(readings.map(r => [normalizeId(r.id), r]));
  if (byId.has('homa_ir')) return [];
  const glucose = byId.get('fasting_glucose') ?? byId.get('glucose');
  const insulin = byId.get('fasting_insulin') ?? byId.get('insulin');
  if (!glucose || !insulin || !Number.isFinite(glucose.value) || !Number.isFinite(insulin.value)) return [];
  return [{ id: 'homa_ir', value: Math.round(((glucose.value * insulin.value) / 405) * 100) / 100, unit: 'score' }];
}

interface DerivedReading extends BiomarkerReading {
  formula: string;
  inputs: string[];
}

function readingByAnyId(readings: BiomarkerReading[], ids: string[]): BiomarkerReading | undefined {
  const byId = new Map(readings.map(r => [normalizeId(r.id), r]));
  for (const id of ids) {
    const reading = byId.get(normalizeId(id));
    if (reading) return reading;
  }
  return undefined;
}

function addDerived(readings: BiomarkerReading[], derived: DerivedReading[], id: string, value: number | undefined, unit: string, formula: string, inputs: string[]): void {
  if (value == null || !Number.isFinite(value)) return;
  if (readingByAnyId([...readings, ...derived], [id])) return;
  derived.push({ id, value: Math.round(value * 100) / 100, unit, formula, inputs });
}

function divide(numerator: BiomarkerReading | undefined, denominator: BiomarkerReading | undefined): number | undefined {
  if (!numerator || !denominator || denominator.value === 0) return undefined;
  return numerator.value / denominator.value;
}

function deriveEgfrFromCreatinine(creatinine: BiomarkerReading | undefined, profile?: UserProfile): number | undefined {
  if (!creatinine || !profile?.age || !profile.sex || creatinine.value <= 0) return undefined;
  const isFemale = profile.sex === 'female';
  const k = isFemale ? 0.7 : 0.9;
  const alpha = isFemale ? -0.241 : -0.302;
  return 142
    * Math.pow(Math.min(creatinine.value / k, 1), alpha)
    * Math.pow(Math.max(creatinine.value / k, 1), -1.2)
    * Math.pow(0.9938, profile.age)
    * (isFemale ? 1.012 : 1);
}

function deriveBiomarkerMetrics(inputReadings: BiomarkerReading[], profile?: UserProfile): DerivedReading[] {
  const homa = deriveHomaIR(inputReadings).map((reading): DerivedReading => ({
    ...reading,
    formula: '(fasting glucose mg/dL × fasting insulin uIU/mL) / 405',
    inputs: ['fasting_glucose', 'fasting_insulin'],
  }));
  const derived: DerivedReading[] = [...homa];
  const totalCholesterol = readingByAnyId(inputReadings, ['total_cholesterol', 'total cholesterol']);
  const hdl = readingByAnyId(inputReadings, ['hdl_c', 'hdl']);
  const ldl = readingByAnyId(inputReadings, ['ldl_c', 'ldl']);
  const triglycerides = readingByAnyId(inputReadings, ['triglycerides', 'tg']);
  const glucose = readingByAnyId(inputReadings, ['fasting_glucose', 'glucose']);
  const hba1c = readingByAnyId(inputReadings, ['hba1c', 'hemoglobin a1c']);
  const apob = readingByAnyId(inputReadings, ['apob', 'apo b']);
  const apoa1 = readingByAnyId(inputReadings, ['apoa1', 'apo a1']);
  const uricAcid = readingByAnyId(inputReadings, ['uric_acid', 'urate']);
  const iron = readingByAnyId(inputReadings, ['iron', 'serum iron']);
  const tibc = readingByAnyId(inputReadings, ['tibc', 'total iron binding capacity']);
  const bun = readingByAnyId(inputReadings, ['bun', 'urea', 'urea nitrogen']);
  const creatinine = readingByAnyId(inputReadings, ['creatinine', 'serum creatinine']);
  const albumin = readingByAnyId(inputReadings, ['albumin', 'serum albumin']);
  const globulin = readingByAnyId(inputReadings, ['globulin']);
  const totalProtein = readingByAnyId(inputReadings, ['total_protein', 'total protein']);
  const sodium = readingByAnyId(inputReadings, ['sodium']);
  const calcium = readingByAnyId(inputReadings, ['calcium', 'serum calcium']);
  const ast = readingByAnyId(inputReadings, ['ast', 'aspartate aminotransferase']);
  const alt = readingByAnyId(inputReadings, ['alt', 'alanine aminotransferase']);
  const platelets = readingByAnyId(inputReadings, ['platelets', 'plt']);
  const neutrophils = readingByAnyId(inputReadings, ['neutrophils', 'absolute neutrophils']);
  const lymphocytes = readingByAnyId(inputReadings, ['lymphocytes', 'absolute lymphocytes']);
  const monocytes = readingByAnyId(inputReadings, ['monocytes', 'absolute monocytes']);
  const rbc = readingByAnyId(inputReadings, ['rbc', 'red blood cells']);
  const mcv = readingByAnyId(inputReadings, ['mcv']);
  const hemoglobin = readingByAnyId(inputReadings, ['hemoglobin', 'hgb']);
  const hematocrit = readingByAnyId(inputReadings, ['hematocrit', 'hct']);
  const tsh = readingByAnyId(inputReadings, ['tsh', 'thyroid stimulating hormone']);
  const freeT4 = readingByAnyId(inputReadings, ['free_t4', 'ft4']);
  const crp = readingByAnyId(inputReadings, ['hs_crp', 'crp']);
  const fibrinogen = readingByAnyId(inputReadings, ['fibrinogen']);

  addDerived(inputReadings, derived, 'non_hdl_c', totalCholesterol && hdl ? totalCholesterol.value - hdl.value : undefined, 'mg/dL', 'total cholesterol − HDL-C', ['total_cholesterol', 'hdl_c']);
  addDerived(inputReadings, derived, 'remnant_cholesterol', totalCholesterol && hdl && ldl ? totalCholesterol.value - hdl.value - ldl.value : undefined, 'mg/dL', 'total cholesterol − HDL-C − LDL-C', ['total_cholesterol', 'hdl_c', 'ldl_c']);
  addDerived(inputReadings, derived, 'apob_apoa1_ratio', apob && apoa1 ? apob.value / apoa1.value : undefined, 'ratio', 'ApoB / ApoA1', ['apob', 'apoa1']);
  addDerived(inputReadings, derived, 'transferrin_saturation', iron && tibc ? (iron.value / tibc.value) * 100 : undefined, '%', '(iron / TIBC) × 100', ['iron', 'tibc']);
  addDerived(inputReadings, derived, 'vldl_c', triglycerides ? triglycerides.value / 5 : undefined, 'mg/dL', 'triglycerides / 5', ['triglycerides']);
  addDerived(inputReadings, derived, 'chol_hdl_ratio', divide(totalCholesterol, hdl), 'ratio', 'total cholesterol / HDL-C', ['total_cholesterol', 'hdl_c']);
  addDerived(inputReadings, derived, 'ldl_hdl_ratio', divide(ldl, hdl), 'ratio', 'LDL-C / HDL-C', ['ldl_c', 'hdl_c']);
  addDerived(inputReadings, derived, 'triglyceride_hdl_ratio', divide(triglycerides, hdl), 'ratio', 'triglycerides / HDL-C', ['triglycerides', 'hdl_c']);
  addDerived(inputReadings, derived, 'uric_acid_hdl_ratio', divide(uricAcid, hdl), 'ratio', 'uric acid / HDL-C', ['uric_acid', 'hdl_c']);
  addDerived(inputReadings, derived, 'atherogenic_coefficient', totalCholesterol && hdl ? (totalCholesterol.value - hdl.value) / hdl.value : undefined, 'ratio', '(total cholesterol − HDL-C) / HDL-C', ['total_cholesterol', 'hdl_c']);
  addDerived(inputReadings, derived, 'atherogenic_index_plasma', triglycerides && hdl ? Math.log10((triglycerides.value / 88.57) / (hdl.value / 38.67)) : undefined, 'index', 'log10((triglycerides mmol/L) / (HDL-C mmol/L))', ['triglycerides', 'hdl_c']);
  addDerived(inputReadings, derived, 'estimated_average_glucose', hba1c ? (28.7 * hba1c.value) - 46.7 : undefined, 'mg/dL', '(28.7 × HbA1c) − 46.7', ['hba1c']);
  addDerived(inputReadings, derived, 'tyg_index', triglycerides && glucose ? Math.log((triglycerides.value * glucose.value) / 2) : undefined, 'index', 'ln((triglycerides × fasting glucose) / 2)', ['triglycerides', 'fasting_glucose']);
  addDerived(inputReadings, derived, 'bun_creatinine_ratio', divide(bun, creatinine), 'ratio', 'BUN / creatinine', ['bun', 'creatinine']);
  addDerived(inputReadings, derived, 'egfr', deriveEgfrFromCreatinine(creatinine, profile), 'mL/min/1.73m2', 'CKD-EPI 2021 creatinine equation', ['creatinine', 'age', 'sex']);
  addDerived(inputReadings, derived, 'calculated_osmolality', sodium && glucose && bun ? (2 * sodium.value) + (glucose.value / 18) + (bun.value / 2.8) : undefined, 'mOsm/kg', '(2 × sodium) + (glucose / 18) + (BUN / 2.8)', ['sodium', 'fasting_glucose', 'bun']);
  addDerived(inputReadings, derived, 'corrected_calcium', calcium && albumin ? calcium.value + (0.8 * (4 - albumin.value)) : undefined, 'mg/dL', 'calcium + 0.8 × (4 − albumin)', ['calcium', 'albumin']);
  addDerived(inputReadings, derived, 'globulin', totalProtein && albumin ? totalProtein.value - albumin.value : undefined, 'g/dL', 'total protein − albumin', ['total_protein', 'albumin']);
  addDerived(inputReadings, derived, 'albumin_globulin_ratio', albumin && globulin ? albumin.value / globulin.value : (albumin && totalProtein ? albumin.value / (totalProtein.value - albumin.value) : undefined), 'ratio', 'albumin / globulin', ['albumin', 'globulin']);
  addDerived(inputReadings, derived, 'ast_alt_ratio', divide(ast, alt), 'ratio', 'AST / ALT', ['ast', 'alt']);
  addDerived(inputReadings, derived, 'fib4_index', profile?.age && ast && alt && platelets ? (profile.age * ast.value) / (platelets.value * Math.sqrt(alt.value)) : undefined, 'index', '(age × AST) / (platelets × √ALT)', ['age', 'ast', 'alt', 'platelets']);
  addDerived(inputReadings, derived, 'apri', ast && platelets ? ((ast.value / 40) / platelets.value) * 100 : undefined, 'index', '((AST / 40) / platelets) × 100', ['ast', 'platelets']);
  addDerived(inputReadings, derived, 'crp_albumin_ratio', divide(crp, albumin), 'ratio', 'CRP / albumin', ['hs_crp', 'albumin']);
  addDerived(inputReadings, derived, 'fibrinogen_albumin_ratio', divide(fibrinogen, albumin), 'ratio', 'fibrinogen / albumin', ['fibrinogen', 'albumin']);
  addDerived(inputReadings, derived, 'neutrophil_lymphocyte_ratio', divide(neutrophils, lymphocytes), 'ratio', 'neutrophils / lymphocytes', ['neutrophils', 'lymphocytes']);
  addDerived(inputReadings, derived, 'platelet_lymphocyte_ratio', divide(platelets, lymphocytes), 'ratio', 'platelets / lymphocytes', ['platelets', 'lymphocytes']);
  addDerived(inputReadings, derived, 'systemic_immune_inflammation_index', platelets && neutrophils && lymphocytes ? (platelets.value * neutrophils.value) / lymphocytes.value : undefined, 'index', '(platelets × neutrophils) / lymphocytes', ['platelets', 'neutrophils', 'lymphocytes']);
  addDerived(inputReadings, derived, 'systemic_inflammation_response_index', neutrophils && monocytes && lymphocytes ? (neutrophils.value * monocytes.value) / lymphocytes.value : undefined, 'index', '(neutrophils × monocytes) / lymphocytes', ['neutrophils', 'monocytes', 'lymphocytes']);
  addDerived(inputReadings, derived, 'mentzer_index', divide(mcv, rbc), 'index', 'MCV / RBC', ['mcv', 'rbc']);
  addDerived(inputReadings, derived, 'estimated_mchc', hemoglobin && hematocrit ? (hemoglobin.value / hematocrit.value) * 100 : undefined, 'g/dL', '(hemoglobin / hematocrit) × 100', ['hemoglobin', 'hematocrit']);
  addDerived(inputReadings, derived, 'tsh_free_t4_ratio', divide(tsh, freeT4), 'ratio', 'TSH / free T4', ['tsh', 'free_t4']);

  return derived;
}

// ── Cross-modal actions ───────────────────────────────────────────────────────

function buildActions(findings: BiomarkerFinding[], domains: BiomarkerDomainScore[]): CrossModalAction[] {
  const actions: CrossModalAction[] = findings
    .filter(f => f.status !== 'optimal')
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((f) => ({
      title: `Address ${f.name}`,
      priority: f.status === 'needs_attention' ? 'high' : 'medium',
      source_modalities: ['biomarkers'],
      rationale: f.interpretation,
      next_step: f.action,
      retest_window: '8–12 weeks, or sooner if a clinician recommends it',
    }));

  if (actions.length > 0) return actions;
  const strongestDomain = domains.slice().sort((a, b) => b.measured - a.measured)[0];
  return [{
    title: 'Preserve biomarker baseline',
    priority: 'low',
    source_modalities: ['biomarkers'],
    rationale: strongestDomain ? `${strongestDomain.name} has a usable baseline.` : 'No concerning biomarker signals were detected.',
    next_step: 'Keep the same marker panel for the next annual comparison so trend quality improves.',
    retest_window: 'Annual baseline, with targeted 8–12 week retests after changes',
  }];
}

function dedupeFindingsByWorstStatus(findings: BiomarkerFinding[]): BiomarkerFinding[] {
  const byId = new Map<string, BiomarkerFinding>();
  for (const finding of findings) {
    const existing = byId.get(finding.id);
    if (!existing || finding.score < existing.score) byId.set(finding.id, finding);
  }
  return Array.from(byId.values());
}

// ── System scores ─────────────────────────────────────────────────────────────

const BIOMARKER_SYSTEM_SCORE_DEFINITIONS: Array<{ id: string; name: string; markers: string[] }> = [
  { id: 'cardiovascular_risk', name: 'Cardiovascular risk', markers: ['apob', 'lp_a', 'ldl_c', 'triglycerides', 'hba1c', 'hs_crp', 'non_hdl_c', 'remnant_cholesterol', 'chol_hdl_ratio'] },
  { id: 'lipid_transport', name: 'Lipid transport', markers: ['apob', 'apoa1', 'apob_apoa1_ratio', 'ldl_c', 'hdl_c', 'triglycerides', 'non_hdl_c', 'remnant_cholesterol', 'vldl_c', 'ldl_hdl_ratio', 'triglyceride_hdl_ratio', 'atherogenic_coefficient', 'atherogenic_index_plasma'] },
  { id: 'glucose_control', name: 'Glucose control', markers: ['fasting_glucose', 'hba1c', 'estimated_average_glucose', 'fructosamine', 'glycated_albumin'] },
  { id: 'insulin_resistance', name: 'Insulin resistance', markers: ['fasting_insulin', 'homa_ir', 'tyg_index', 'triglycerides', 'hdl_c', 'triglyceride_hdl_ratio', 'c_peptide'] },
  { id: 'inflammation', name: 'Inflammation', markers: ['hs_crp', 'ferritin', 'homocysteine', 'esr', 'il6', 'tnf_alpha', 'fibrinogen', 'crp_albumin_ratio', 'fibrinogen_albumin_ratio', 'neutrophil_lymphocyte_ratio', 'systemic_immune_inflammation_index'] },
  { id: 'immune_balance', name: 'Immune balance', markers: ['wbc', 'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils', 'neutrophil_lymphocyte_ratio', 'platelet_lymphocyte_ratio', 'systemic_inflammation_response_index'] },
  { id: 'iron_status', name: 'Iron status', markers: ['ferritin', 'iron', 'tibc', 'transferrin_saturation', 'hemoglobin', 'mcv', 'rdw'] },
  { id: 'micronutrient_status', name: 'Micronutrient status', markers: ['vitamin_d', 'b12', 'folate', 'magnesium', 'omega3_index', 'zinc', 'copper', 'selenium'] },
  { id: 'thyroid_function', name: 'Thyroid function', markers: ['tsh', 'free_t4', 'tsh_free_t4_ratio', 'free_t3', 'tpo_antibodies', 'thyroglobulin_antibodies'] },
  { id: 'sex_hormone_balance', name: 'Sex hormone balance', markers: ['testosterone_total', 'testosterone_free', 'estradiol', 'shbg', 'lh', 'fsh', 'prolactin'] },
  { id: 'stress_axis', name: 'Stress axis', markers: ['cortisol_am', 'dhea_s'] },
  { id: 'liver_function', name: 'Liver function', markers: ['alt', 'ast', 'ggt', 'alp', 'bilirubin', 'albumin', 'globulin', 'albumin_globulin_ratio', 'ast_alt_ratio', 'fib4_index', 'apri'] },
  { id: 'kidney_function', name: 'Kidney function', markers: ['creatinine', 'egfr', 'bun', 'bun_creatinine_ratio', 'calculated_osmolality', 'cystatin_c', 'urine_albumin_creatinine'] },
  { id: 'metabolic_safety', name: 'Metabolic safety', markers: ['alt', 'ggt', 'uric_acid', 'uric_acid_hdl_ratio', 'fasting_glucose', 'homa_ir', 'tyg_index', 'triglycerides', 'creatinine', 'egfr'] },
  { id: 'oxygen_transport', name: 'Oxygen transport', markers: ['hemoglobin', 'hematocrit', 'rbc', 'mcv', 'mch', 'mchc', 'estimated_mchc', 'mentzer_index', 'rdw'] },
  { id: 'blood_cell_balance', name: 'Blood cell balance', markers: ['wbc', 'rbc', 'hemoglobin', 'platelets', 'neutrophils', 'lymphocytes', 'monocytes', 'rdw', 'neutrophil_lymphocyte_ratio', 'platelet_lymphocyte_ratio'] },
];

function buildSystemScores(findings: BiomarkerFinding[]): BiomarkerSystemScore[] {
  const byId = new Map(findings.map(f => [f.id, f]));
  return BIOMARKER_SYSTEM_SCORE_DEFINITIONS.map((def) => {
    const matched = def.markers.map(m => byId.get(m)).filter((f): f is BiomarkerFinding => Boolean(f));
    const score = matched.length > 0 ? Math.round(matched.reduce((s, f) => s + f.score, 0) / matched.length) : 0;
    const drivers = matched.slice().sort((a, b) => a.score - b.score).slice(0, 3).map(f => `${f.name}: ${f.status}`);
    return { id: def.id, name: def.name, score, status: matched.length > 0 ? statusFromScore(score) : 'missing', marker_count: matched.length, drivers };
  });
}

function buildBiologicalAge(systemScores: BiomarkerSystemScore[]): BiomarkerBiologicalAge {
  const scored = systemScores.filter(s => s.status !== 'missing');
  const score = scored.length > 0 ? Math.round(scored.reduce((s, i) => s + i.score, 0) / scored.length) : 0;
  const estimatedDeltaYears = Math.max(-8, Math.min(12, Math.round((72 - score) / 4)));
  const strongestDrivers = scored.slice().sort((a, b) => a.score - b.score).slice(0, 5);
  return {
    model_version: 'biomarker-internal-v1',
    score,
    status: scored.length > 0 ? statusFromScore(score) : 'missing',
    estimated_delta_years: estimatedDeltaYears,
    inputs: strongestDrivers.map(s => s.id),
    rationale: strongestDrivers.length > 0
      ? `Internal estimate from ${scored.length} biomarker system scores; main drag: ${strongestDrivers.map(s => s.name).join(', ')}.`
      : 'No biomarker system scores were available for biological-age estimation.',
  };
}

// ── Lab value helpers ─────────────────────────────────────────────────────────

function displayValueFor(reading: BiomarkerReading, def: BiomarkerDefinition): string {
  const raw = reading.raw_value?.trim();
  if (raw) {
    if ((reading.unit || def.unit) === 'qualitative') return raw;
    return reading.unit && !raw.toLowerCase().includes(reading.unit.toLowerCase()) ? `${raw} ${reading.unit}` : raw;
  }
  return `${reading.value} ${reading.unit || def.unit}`.trim();
}

function labValueFor(reading: BiomarkerReading, def: BiomarkerDefinition, scored: ScoredResult): BiomarkerLabValue {
  const unit = reading.unit || def.unit;
  return {
    id: def.id,
    name: def.name,
    domain: def.domain,
    value: reading.value,
    unit,
    display_value: displayValueFor(reading, def),
    status: scored.status,
    status_label: statusLabelFor(scored.status),
    target_label: targetLabelFor(scored.ranges, unit),
    collected_at: reading.collected_at,
    source_type: 'measured',
  };
}

function derivedValueFor(reading: DerivedReading, scored: ScoredResult): DerivedBiomarkerValue | undefined {
  const def = DEF_BY_ID.get(normalizeId(reading.id));
  if (!def) return undefined;
  const unit = reading.unit || def.unit;
  return {
    id: def.id,
    name: def.name,
    domain: def.domain,
    value: reading.value,
    unit,
    display_value: displayValueFor(reading, def),
    status: scored.status,
    status_label: statusLabelFor(scored.status),
    target_label: targetLabelFor(scored.ranges, unit),
    formula: reading.formula,
    inputs: reading.inputs,
    source_type: 'derived',
  };
}

// ── Main analysis function ────────────────────────────────────────────────────

export function analyzeBiomarkers(inputReadings: BiomarkerReading[], profile?: UserProfile): BiomarkerAnalysisSummary {
  const derivedReadings = deriveBiomarkerMetrics(inputReadings, profile);
  const readings = [...inputReadings, ...derivedReadings];
  const findings: BiomarkerFinding[] = [];
  const labData: BiomarkerLabValue[] = [];
  const derivedBiomarkers: DerivedBiomarkerValue[] = [];
  const derivedIds = new Set(derivedReadings.map(r => normalizeId(r.id)));

  for (const reading of readings) {
    const def = DEF_BY_ID.get(normalizeId(reading.id));
    if (!def || !Number.isFinite(reading.value)) continue;

    // Skip sex-specific markers that don't apply to this user
    if (def.male_only && profile?.sex === 'female') continue;
    if (def.female_only && profile?.sex === 'male') continue;

    const scored = def.value_type === 'qualitative'
      ? scoreQualitativeReading(reading, def)
      : scoreReading(reading.value, def, profile);

    const displayValue = displayValueFor(reading, def);
    const unit = reading.unit || def.unit;

    const interpretation = def.value_type === 'qualitative'
      ? qualitativeInterpretationFor(def, displayValue, scored.status)
      : interpretationFor(def, reading.value, scored.status, scored.direction, displayValue, scored.ranges);

    if (derivedIds.has(normalizeId(reading.id))) {
      const derivedValue = derivedValueFor(reading as DerivedReading, scored);
      if (derivedValue) derivedBiomarkers.push(derivedValue);
    } else {
      labData.push(labValueFor(reading, def, scored));
    }

    findings.push({
      id: def.id,
      name: def.name,
      domain: def.domain,
      value: reading.value,
      unit,
      display_value: displayValue,
      status: scored.status,
      status_label: statusLabelFor(scored.status),
      target_label: targetLabelFor(scored.ranges, unit),
      direction: scored.direction,
      score: scored.score,
      interpretation,
      action: actionFor(def, scored.status, scored.direction),
      source_type: derivedIds.has(normalizeId(reading.id)) ? 'derived' : 'measured',
      collected_at: reading.collected_at,
    });
  }

  const deduped = dedupeFindingsByWorstStatus(findings);
  const domains = domainScores(deduped);
  const systemScores = buildSystemScores(deduped);
  const biologicalAge = buildBiologicalAge(systemScores);
  const measuredDomains = domains.filter(d => d.measured > 0);
  const score = measuredDomains.length
    ? Math.round(measuredDomains.reduce((s, d) => s + d.score, 0) / measuredDomains.length)
    : 0;
  const measuredIds = new Set(deduped.map(f => f.id));
  const missingPriority = ['apob', 'hba1c', 'fasting_insulin', 'hs_crp', 'homocysteine', 'vitamin_d', 'egfr', 'alt', 'hemoglobin']
    .filter(id => !measuredIds.has(id))
    .map(id => BIOMARKER_DEFINITIONS.find(d => d.id === id)?.name || id);

  return {
    score,
    status: measuredDomains.length ? statusFromScore(score) : 'missing',
    measured_count: deduped.filter(finding => finding.source_type !== 'derived').length,
    total_supported: BIOMARKER_DEFINITIONS.length,
    domains,
    system_scores: systemScores,
    biological_age: biologicalAge,
    lab_data: labData,
    derived_biomarkers: derivedBiomarkers,
    findings: deduped
      .sort((a, b) => a.score - b.score)
      .map((finding) => {
        if (finding.status === 'optimal') return finding;
        const previousRanks = deduped.filter(item => item.status !== 'optimal' && item.score < finding.score).length;
        return { ...finding, priority_rank: previousRanks + 1 };
      }),
    missing_priority: missingPriority,
    action_items: buildActions(deduped, domains),
  };
}
