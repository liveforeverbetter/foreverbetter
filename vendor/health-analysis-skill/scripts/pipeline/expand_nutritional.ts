/**
 * Nutritional Genomics Expansion
 *
 * Adds well-characterized nutritional genetic variants to the interpretation
 * database and knowledge graph. Covers fatty acid metabolism, full vitamin
 * panel (A, B2, B6, B9, B12, C, D, E, K), minerals (iron, calcium,
 * magnesium, zinc, selenium), choline, and thyroid/iodine metabolism.
 *
 * Run once: npx tsx scripts/pipeline/expand_nutritional.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INTERP_DIR = path.join(__dirname, '..', '..', 'shared', 'interpretations');
const KG_PATH = path.join(__dirname, '..', '..', 'shared', 'knowledge_graph_data.json');
const INDEX_PATH = path.join(__dirname, 'index.ts');

// ============================================================================
// Nutritional interpretation entries
// ============================================================================

interface NutritionalEntry {
  rsid: string;
  gene: string;
  name: string;
  display: string;
  category: string;
  interpretations: Record<string, {
    effect: string;
    interpretation: string;
    recommendations: string[];
    priority: string;
  }>;
}

const NUTRITIONAL_VARIANTS: NutritionalEntry[] = [
  // === Fatty Acid / Omega-3 Metabolism ===
  {
    rsid: 'rs174546', gene: 'FADS1', name: 'Omega-3 Conversion',
    display: 'FADS1 — Omega-3/Omega-6 Conversion Efficiency',
    category: 'wellness', interpretations: {
      'CC': { effect: 'Reduced FADS1 activity', interpretation: 'Reduced conversion of alpha-linolenic acid (ALA) to EPA. Lower endogenous omega-3 synthesis — may benefit from direct EPA/DHA supplementation rather than relying on plant-based ALA conversion.', recommendations: ['Consider direct EPA/DHA supplementation (fish oil or algae oil, 1-2g/day)', 'Limit omega-6 intake (vegetable oils) which compete for the same enzyme', 'Monitor omega-3 index (target >8%)'], priority: 'medium' },
      'CT': { effect: 'Moderate FADS1 activity', interpretation: 'Intermediate omega-3 conversion efficiency. Partial ability to convert plant ALA to EPA — direct sources still beneficial.', recommendations: ['Aim for mixed omega-3 sources (fatty fish 2x/week + plant sources)', 'Moderate omega-6 intake to avoid enzyme competition', 'Omega-3 index testing may be informative'], priority: 'low' },
      'TT': { effect: 'Efficient FADS1 activity', interpretation: 'Efficient conversion of plant-based ALA to long-chain omega-3s. Better endogenous EPA synthesis from dietary ALA.', recommendations: ['Plant-based omega-3 sources (flax, chia, walnuts) are well-utilized', 'Maintain adequate total omega-3 intake', 'Still benefit from some direct DHA sources'], priority: 'low' },
    },
  },
  {
    rsid: 'rs174547', gene: 'FADS1', name: 'Omega-3 Status',
    display: 'FADS1 — Phospholipid Omega-3 Status',
    category: 'wellness', interpretations: {
      'CC': { effect: 'Lower phospholipid EPA/AA ratio', interpretation: 'Genetically lower incorporation of omega-3s into cell membranes. More inflammatory eicosanoid profile from arachidonic acid.', recommendations: ['Higher EPA/DHA intake recommended (2-3g/day) to overcome genetic tendency', 'Monitor omega-3 index and AA/EPA ratio', 'Anti-inflammatory diet pattern (Mediterranean) especially important'], priority: 'medium' },
      'CT': { effect: 'Intermediate phospholipid omega-3 status', interpretation: 'Moderate genetic tendency for omega-3 membrane incorporation. Diet plays a significant role.', recommendations: ['Regular fatty fish or algae oil supplementation', 'Balanced omega-6/omega-3 ratio in diet'], priority: 'low' },
      'TT': { effect: 'Higher phospholipid omega-3 incorporation', interpretation: 'Efficient incorporation of dietary omega-3s into cell membranes. Favorable anti-inflammatory profile.', recommendations: ['Maintain adequate omega-3 intake', 'This genetic advantage works best with sufficient dietary omega-3 supply'], priority: 'low' },
    },
  },
  {
    rsid: 'rs1535', gene: 'FADS2', name: 'DHA Synthesis',
    display: 'FADS2 — DHA Synthesis Capacity',
    category: 'wellness', interpretations: {
      'AA': { effect: 'Reduced delta-6 desaturase activity', interpretation: 'Lower FADS2 enzyme activity reduces conversion of precursors to DHA. DHA is critical for brain, eye, and cardiovascular health.', recommendations: ['Prioritize preformed DHA sources (fatty fish, algae oil)', 'DHA supplementation (200-500mg/day) may be especially beneficial', 'Particularly important during pregnancy and for cognitive aging'], priority: 'medium' },
      'AG': { effect: 'Moderate delta-6 desaturase activity', interpretation: 'Intermediate DHA synthesis capacity. Can partially convert precursors but direct sources still beneficial.', recommendations: ['Include DHA-rich foods regularly', 'Consider DHA supplementation especially if vegetarian/vegan'], priority: 'low' },
      'GG': { effect: 'Normal delta-6 desaturase activity', interpretation: 'Normal FADS2 enzyme function. Efficient DHA synthesis from dietary precursors.', recommendations: ['Maintain adequate ALA intake for DHA synthesis', 'Fatty fish 1-2x/week for additional benefits'], priority: 'low' },
    },
  },

  // === Vitamin A ===
  {
    rsid: 'rs12934922', gene: 'BCO1', name: 'Beta-Carotene Conversion',
    display: 'BCO1 — Beta-Carotene to Vitamin A Conversion',
    category: 'wellness', interpretations: {
      'AA': { effect: 'Reduced BCO1 activity (~60% lower)', interpretation: 'Significantly reduced ability to convert beta-carotene from plant foods into active vitamin A (retinol). Relying on plant sources alone may lead to suboptimal vitamin A status.', recommendations: ['Include preformed vitamin A sources (liver, eggs, dairy, cod liver oil)', 'Do not rely solely on beta-carotene from vegetables for vitamin A', 'Monitor for signs of insufficiency: night vision, immune function, skin health'], priority: 'medium' },
      'AT': { effect: 'Moderately reduced BCO1 activity', interpretation: 'Some reduction in beta-carotene conversion efficiency. Mixed plant and animal vitamin A sources recommended.', recommendations: ['Include both plant (orange/yellow vegetables) and animal vitamin A sources', 'Cooking and consuming with fat improves beta-carotene absorption'], priority: 'low' },
      'TT': { effect: 'Normal BCO1 activity', interpretation: 'Efficient conversion of beta-carotene to vitamin A. Plant sources are well-utilized for vitamin A status.', recommendations: ['Orange/yellow vegetables and leafy greens are excellent vitamin A sources for you', 'Still include some preformed A for optimal status'], priority: 'low' },
    },
  },

  // === Vitamin B6 ===
  {
    rsid: 'rs4654748', gene: 'NBPF3', name: 'Vitamin B6 Metabolism',
    display: 'NBPF3 — Vitamin B6 (Pyridoxine) Metabolism',
    category: 'wellness', interpretations: {
      'CC': { effect: 'Lower plasma B6 levels', interpretation: 'Genetically lower circulating vitamin B6 (pyridoxal 5\'-phosphate). B6 is a cofactor for 100+ enzymatic reactions including neurotransmitter synthesis, homocysteine metabolism, and immune function.', recommendations: ['Consider B6 supplementation (pyridoxal-5\'-phosphate form, 25-50mg/day)', 'Monitor homocysteine — B6 works with folate and B12', 'B6-rich foods: poultry, fish, potatoes, bananas, chickpeas'], priority: 'medium' },
      'CT': { effect: 'Moderately lower B6 levels', interpretation: 'Slightly reduced B6 status. Dietary intake is especially important to maintain optimal levels.', recommendations: ['Emphasize B6-rich foods in diet', 'Consider B-complex supplement for comprehensive B-vitamin support'], priority: 'low' },
      'TT': { effect: 'Normal B6 metabolism', interpretation: 'Typical vitamin B6 metabolism. Standard dietary intake sufficient for most individuals.', recommendations: ['Maintain balanced diet with B6 sources'], priority: 'low' },
    },
  },

  // === Folate (B9) ===
  {
    rsid: 'rs2236225', gene: 'MTHFD1', name: 'Folate Cycle',
    display: 'MTHFD1 — Folate Cycle (10-Formyl-THF)',
    category: 'wellness', interpretations: {
      'AA': { effect: 'Reduced MTHFD1 activity (R653Q variant)', interpretation: 'The MTHFD1 R653Q variant reduces folate cycle efficiency upstream of MTHFR. Affects purine synthesis and homocysteine remethylation. May increase homocysteine and affect DNA synthesis.', recommendations: ['Active folate (5-MTHF or folinic acid, 400-800mcg/day) may bypass this step', 'Monitor homocysteine levels', 'Ensure adequate B12 — folate and B12 cycles are interdependent'], priority: 'medium' },
      'AG': { effect: 'Moderately reduced MTHFD1 activity', interpretation: 'One copy of the R653Q variant — mildly reduced folate cycle throughput.', recommendations: ['Ensure adequate dietary folate (leafy greens, legumes)', 'Consider methylfolate if homocysteine is elevated'], priority: 'low' },
      'GG': { effect: 'Normal MTHFD1 activity', interpretation: 'Normal folate cycle function at this step. Standard folate intake recommendations apply.', recommendations: ['Maintain adequate folate intake (400mcg/day from diet or supplement)'], priority: 'low' },
    },
  },
  {
    rsid: 'rs1979277', gene: 'SHMT1', name: 'Serine-Glycine Conversion',
    display: 'SHMT1 — Serine Hydroxymethyltransferase',
    category: 'wellness', interpretations: {
      'CC': { effect: 'Reduced SHMT1 activity (L474F variant)', interpretation: 'Reduced SHMT1 activity impairs the conversion of serine to glycine, a key step that provides one-carbon units for the folate cycle. May affect methylation capacity and nucleotide synthesis.', recommendations: ['Adequate dietary glycine and serine (bone broth, collagen, eggs, soy)', 'Active folate (5-MTHF) may help compensate', 'Monitor homocysteine as an integrated methylation marker'], priority: 'medium' },
      'CT': { effect: 'Moderately reduced SHMT1 activity', interpretation: 'Mildly reduced serine-glycine conversion. Most individuals compensate well with adequate dietary protein.', recommendations: ['Ensure adequate protein intake with glycine/serine-rich sources'], priority: 'low' },
      'TT': { effect: 'Normal SHMT1 activity', interpretation: 'Efficient serine-to-glycine conversion supporting one-carbon metabolism.', recommendations: ['Standard protein intake sufficient'], priority: 'low' },
    },
  },
  {
    rsid: 'rs1051266', gene: 'SLC19A1', name: 'Folate Transport',
    display: 'SLC19A1 (RFC1) — Folate Transporter',
    category: 'wellness', interpretations: {
      'AA': { effect: 'Reduced folate transporter activity', interpretation: 'Reduced efficiency of the reduced folate carrier (RFC1) that transports folates into cells. May require higher circulating folate levels to achieve adequate cellular uptake — especially important during pregnancy and for red blood cell production.', recommendations: ['Higher folate intake may be needed — consider 5-MTHF 800mcg/day', 'Monitor RBC folate rather than just serum folate', 'Critical during pregnancy planning — ensure adequate cellular folate'], priority: 'high' },
      'AG': { effect: 'Moderately reduced folate transport', interpretation: 'Mildly reduced cellular folate uptake. Higher dietary folate helps compensate.', recommendations: ['Ensure adequate folate intake (600mcg/day)', '5-MTHF form may be more bioavailable than folic acid'], priority: 'low' },
      'GG': { effect: 'Normal folate transport', interpretation: 'Efficient cellular folate uptake. Standard folate intake recommendations apply.', recommendations: ['Maintain adequate folate (400mcg/day)'], priority: 'low' },
    },
  },

  // === Vitamin B12 ===
  {
    rsid: 'rs1801198', gene: 'TCN2', name: 'B12 Transport',
    display: 'TCN2 — Transcobalamin II (B12 Cellular Delivery)',
    category: 'wellness', interpretations: {
      'GG': { effect: 'Reduced B12 cellular delivery (Pro259Arg)', interpretation: 'The TCII 259Arg variant reduces transcobalamin II efficiency in delivering B12 to cells. Despite normal serum B12, cellular B12 may be suboptimal — this is a "hidden" B12 deficiency risk.', recommendations: ['Monitor methylmalonic acid (MMA) and holotranscobalamin — not just serum B12', 'Active B12 forms (methylcobalamin, adenosylcobalamin) preferred', 'Higher B12 intake (1000-2000mcg/day) may be needed to overcome transport inefficiency'], priority: 'high' },
      'CG': { effect: 'Moderately reduced B12 transport', interpretation: 'Intermediate B12 transport efficiency. Active B12 and MMA monitoring more informative than serum B12 alone.', recommendations: ['Consider active B12 testing (holoTC)', 'Adequate B12 intake (500-1000mcg/day)'], priority: 'medium' },
      'CC': { effect: 'Normal B12 transport', interpretation: 'Efficient B12 cellular delivery. Standard B12 intake recommendations apply.', recommendations: ['Maintain adequate B12 (2.4mcg/day minimum, higher for vegetarians/vegans)'], priority: 'low' },
    },
  },
  {
    rsid: 'rs601338', gene: 'FUT2', name: 'B12 Absorption (Secretor Status)',
    display: 'FUT2 — Secretor Status & B12 Absorption',
    category: 'wellness', interpretations: {
      'AA': { effect: 'Non-secretor (FUT2 deficiency)', interpretation: 'Non-secretor status — reduced fucosyltransferase activity. Associated with lower B12 levels (via altered gut microbiome composition), altered gut microbiome, and reduced norovirus susceptibility. May have lower B12 from reduced intrinsic factor-independent absorption.', recommendations: ['Monitor B12 status regularly (serum B12 + MMA)', 'B12 supplementation (methylcobalamin 1000mcg/day) beneficial', 'Probiotics may help optimize B12-producing gut bacteria'], priority: 'medium' },
      'AG': { effect: 'Partial secretor status', interpretation: 'Intermediate secretor phenotype. Moderately affected B12 absorption and gut microbiome composition.', recommendations: ['Regular B12 monitoring recommended', 'Dietary B12 sources: shellfish, liver, fatty fish'], priority: 'low' },
      'GG': { effect: 'Secretor phenotype', interpretation: 'Full secretor status — normal fucosyltransferase activity. Normal B12 absorption and gut-microbiome-mediated B-vitamin production.', recommendations: ['Standard B12 intake guidelines apply'], priority: 'low' },
    },
  },

  // === Choline ===
  {
    rsid: 'rs7946', gene: 'PEMT', name: 'Choline Synthesis',
    display: 'PEMT — Phosphatidylethanolamine N-Methyltransferase (Endogenous Choline)',
    category: 'wellness', interpretations: {
      'AA': { effect: 'Reduced PEMT activity (V175M variant)', interpretation: 'Reduced endogenous choline synthesis — higher dietary choline requirement. Choline is critical for cell membrane integrity, methylation (via betaine), neurotransmitter synthesis (acetylcholine), and liver health (VLDL export, preventing fatty liver). The PEMT pathway is estrogen-responsive — premenopausal women have higher PEMT activity.', recommendations: ['Higher dietary choline intake (550mg/day for men, 425mg for women; higher with this variant)', 'Choline-rich foods: eggs (yolks), liver, soy lecithin, wheat germ, cruciferous vegetables', 'Consider choline supplementation (citicoline or alpha-GPC, 250-500mg/day)', 'Avoid choline deficiency — risk of fatty liver and muscle damage'], priority: 'high' },
      'AG': { effect: 'Moderately reduced PEMT activity', interpretation: 'Some reduction in endogenous choline synthesis. May have mildly increased dietary choline requirement.', recommendations: ['Include regular choline sources in diet (eggs, liver)', 'Consider choline if experiencing fatty liver, brain fog, or muscle issues'], priority: 'medium' },
      'GG': { effect: 'Normal PEMT activity', interpretation: 'Normal endogenous choline synthesis capacity. Standard dietary intake sufficient for most individuals.', recommendations: ['Maintain adequate choline intake (eggs, soy, liver)', 'Choline needs increase during pregnancy and lactation'], priority: 'low' },
    },
  },

  // === Vitamin C ===
  {
    rsid: 'rs33972313', gene: 'SLC23A1', name: 'Vitamin C Transport',
    display: 'SLC23A1 (SVCT1) — Vitamin C Renal Reabsorption',
    category: 'wellness', interpretations: {
      'TT': { effect: 'Reduced vitamin C reabsorption (~25% lower)', interpretation: 'Reduced renal vitamin C reabsorption — more vitamin C is lost in urine. This variant is present in ~5% of the population and is associated with lower plasma vitamin C even with adequate intake. Higher intake needed to maintain tissue saturation.', recommendations: ['Higher vitamin C intake (500-1000mg/day from diet + supplement)', 'Spread vitamin C intake throughout the day (renal threshold effect)', 'Monitor for signs of insufficiency: gum health, wound healing, immune function', 'Liposomal vitamin C may bypass transporter limitation'], priority: 'medium' },
      'CT': { effect: 'Moderately reduced vitamin C reabsorption', interpretation: 'Mildly increased renal vitamin C loss. Slightly higher maintenance dose needed.', recommendations: ['Ensure consistent vitamin C intake (200-500mg/day)', 'Vitamin C-rich foods: citrus, bell peppers, kiwi, strawberries, broccoli'], priority: 'low' },
      'CC': { effect: 'Normal vitamin C transport', interpretation: 'Efficient renal vitamin C conservation. Standard intake recommendations sufficient for tissue saturation.', recommendations: ['Maintain RDA vitamin C intake (75-90mg/day)', 'Higher doses during illness or stress still beneficial'], priority: 'low' },
    },
  },

  // === Vitamin D Receptor ===
  {
    rsid: 'rs2228570', gene: 'VDR', name: 'Vitamin D Receptor',
    display: 'VDR — Vitamin D Receptor (FokI, Transcriptional Activity)',
    category: 'wellness', interpretations: {
      'GG': { effect: 'Shorter VDR (FokI F-allele / T-allele)', interpretation: 'The FokI variant produces a shorter vitamin D receptor with ~30% higher transcriptional activity. More responsive to vitamin D — may require lower serum 25(OH)D for equivalent biological effect.', recommendations: ['Target 25(OH)D in 40-60 ng/mL range', 'May respond well to standard vitamin D supplementation doses (2000-4000 IU/day)', 'Monitor calcium and PTH alongside vitamin D'], priority: 'low' },
      'AG': { effect: 'Intermediate VDR activity', interpretation: 'Heterozygous FokI — intermediate vitamin D receptor activity.', recommendations: ['Standard vitamin D optimization protocol (target 40-60 ng/mL)', 'Monitor 25(OH)D levels and adjust supplementation accordingly'], priority: 'low' },
      'AA': { effect: 'Longer VDR (FokI f-allele / C-allele)', interpretation: 'The longer VDR variant has slightly reduced transcriptional activity. May require higher serum vitamin D levels for equivalent biological response.', recommendations: ['Target 25(OH)D in 50-70 ng/mL range for optimal VDR activation', 'Ensure adequate magnesium (required for vitamin D metabolism)', 'Vitamin D3 + K2 combination recommended for optimal utilization'], priority: 'low' },
    },
  },

  // === Vitamin E ===
  {
    rsid: 'rs2108622', gene: 'CYP4F2', name: 'Vitamin E Metabolism',
    display: 'CYP4F2 — Vitamin E (Tocopherol) Metabolism',
    category: 'wellness', interpretations: {
      'AA': { effect: 'Reduced CYP4F2 activity (V433M variant)', interpretation: 'Slower vitamin E omega-hydroxylation — tocopherols remain in circulation longer. May require lower vitamin E supplementation to achieve tissue levels. Also affects warfarin metabolism and blood pressure regulation via 20-HETE.', recommendations: ['Standard vitamin E intake likely sufficient (15mg/day)', 'Mixed tocopherols preferred over alpha-tocopherol alone', 'Higher vitamin E doses may accumulate — monitor if supplementing >400 IU/day'], priority: 'low' },
      'AG': { effect: 'Moderately reduced CYP4F2 activity', interpretation: 'Intermediate vitamin E metabolism rate. Standard supplementation guidelines apply.', recommendations: ['Standard vitamin E intake adequate', 'Mixed tocopherol supplement if indicated'], priority: 'low' },
      'GG': { effect: 'Normal CYP4F2 activity (rapid metabolism)', interpretation: 'Faster vitamin E metabolism and clearance. May require higher or more frequent intake to maintain tissue levels.', recommendations: ['Ensure consistent dietary vitamin E (nuts, seeds, olive oil, avocado)', 'Consider mixed tocopherol supplement if vitamin E status is a concern'], priority: 'low' },
    },
  },

  // === Vitamin K ===
  {
    rsid: 'rs9923231', gene: 'VKORC1', name: 'Vitamin K Recycling',
    display: 'VKORC1 — Vitamin K Epoxide Reductase (K Recycling)',
    category: 'wellness', interpretations: {
      'AA': { effect: 'Reduced VKORC1 expression (~50% lower)', interpretation: 'The VKORC1 -1639G>A variant significantly reduces vitamin K epoxide reductase expression. Less efficient recycling of vitamin K — higher dietary K intake needed to maintain adequate vitamin K-dependent protein carboxylation. Affects coagulation factors, bone Gla-protein (osteocalcin), and vascular calcification inhibitor (MGP). Also means significantly higher warfarin sensitivity if prescribed.', recommendations: ['Ensure adequate vitamin K intake (K1 from leafy greens + K2 MK-7 supplement 100-200mcg/day)', 'Adequate vitamin D to work synergistically with K2 for bone and vascular health', 'CRITICAL: If prescribed warfarin, inform physician — requires much lower doses'], priority: 'high' },
      'AG': { effect: 'Moderately reduced VKORC1 expression', interpretation: 'Intermediate vitamin K recycling efficiency. Somewhat reduced warfarin dose requirement if prescribed.', recommendations: ['Regular leafy green consumption for vitamin K1', 'Consider vitamin K2 MK-7 for bone and vascular health (100mcg/day)'], priority: 'medium' },
      'GG': { effect: 'Normal VKORC1 expression', interpretation: 'Efficient vitamin K recycling. Normal vitamin K-dependent protein function. Higher warfarin dose requirements if prescribed.', recommendations: ['Maintain vitamin K intake through diet', 'K2 supplementation still beneficial for bone/vascular optimization'], priority: 'low' },
    },
  },

  // === Iron ===
  {
    rsid: 'rs855791', gene: 'TMPRSS6', name: 'Iron Regulation',
    display: 'TMPRSS6 (Matriptase-2) — Iron Homeostasis & Hepcidin',
    category: 'wellness', interpretations: {
      'GG': { effect: 'Higher hepcidin, lower iron absorption (A736V variant)', interpretation: 'The TMPRSS6 A736V variant increases hepcidin production, reducing dietary iron absorption. May have lower serum iron and transferrin saturation, and slightly lower hemoglobin. More likely to experience iron deficiency on plant-based diets or with blood loss.', recommendations: ['Monitor ferritin, serum iron, TIBC, and hemoglobin regularly', 'Enhance iron absorption: pair iron-rich foods with vitamin C, avoid tea/coffee with meals', 'Consider iron supplementation if ferritin < 30 ng/mL (discuss with physician)', 'Heme iron (meat, seafood) better absorbed than non-heme plant iron'], priority: 'medium' },
      'AG': { effect: 'Moderately higher hepcidin', interpretation: 'Mild tendency toward reduced iron absorption. Adequate dietary iron and absorption enhancers important.', recommendations: ['Include iron-rich foods regularly', 'Pair with vitamin C for absorption', 'Monitor iron status if vegetarian, vegan, or female with heavy menstruation'], priority: 'low' },
      'AA': { effect: 'Lower hepcidin, higher iron absorption', interpretation: 'More efficient dietary iron absorption. This is generally beneficial but combined with HFE hemochromatosis variants could lead to iron overload. Monitor iron status periodically.', recommendations: ['Iron status monitoring — avoid excessive supplementation without documented deficiency', 'If also carrying HFE variants (C282Y/H63D), be more vigilant about iron monitoring'], priority: 'low' },
    },
  },

  // === Magnesium ===
  {
    rsid: 'rs3750425', gene: 'TRPM6', name: 'Magnesium Transport',
    display: 'TRPM6 — Magnesium Absorption & Renal Handling',
    category: 'wellness', interpretations: {
      'CC': { effect: 'Reduced TRPM6 activity', interpretation: 'Lower intestinal magnesium absorption and renal reabsorption. May have lower serum and intracellular magnesium. Magnesium is a cofactor for 300+ enzymes including ATP production, DNA repair, and neurotransmitter regulation.', recommendations: ['Magnesium supplementation recommended (magnesium glycinate or malate, 200-400mg/day elemental)', 'Epsom salt baths or topical magnesium oil can bypass gut absorption issues', 'Monitor RBC magnesium (more accurate than serum magnesium)', 'Reduce magnesium depletors: excess alcohol, caffeine, diuretics'], priority: 'medium' },
      'CT': { effect: 'Moderately reduced magnesium transport', interpretation: 'Mild tendency toward lower magnesium retention. Dietary magnesium especially important.', recommendations: ['Emphasize magnesium-rich foods (leafy greens, nuts, seeds, dark chocolate, legumes)', 'Consider magnesium supplement during stress, exercise, or poor sleep'], priority: 'low' },
      'TT': { effect: 'Normal magnesium transport', interpretation: 'Efficient magnesium absorption and renal conservation. Standard dietary intake sufficient.', recommendations: ['Maintain magnesium-rich foods in diet', 'Magnesium supplementation still beneficial for sleep and stress management'], priority: 'low' },
    },
  },

  // === Selenium ===
  {
    rsid: 'rs1050450', gene: 'GPX1', name: 'Selenium Utilization',
    display: 'GPX1 — Glutathione Peroxidase (Selenium-Dependent Antioxidant)',
    category: 'wellness', interpretations: {
      'TT': { effect: 'Reduced GPX1 activity (Pro198Leu variant)', interpretation: 'The GPX1 Pro198Leu variant reduces glutathione peroxidase activity — a key selenium-dependent antioxidant enzyme. Cells may be more vulnerable to oxidative damage, particularly under low selenium status. This enzyme protects against lipid peroxidation and hydrogen peroxide damage.', recommendations: ['Ensure adequate selenium intake (Brazil nuts are the richest source — 1-2/day provides RDA)', 'Selenium supplementation (selenomethionine 100-200mcg/day) if dietary intake is low', 'Adequate glutathione precursors: N-acetylcysteine (NAC), glycine, glutamine', 'Selenium status can be monitored via serum selenium or GPX activity'], priority: 'medium' },
      'CT': { effect: 'Moderately reduced GPX1 activity', interpretation: 'Intermediate glutathione peroxidase activity. Adequate selenium intake supports optimal enzyme function.', recommendations: ['Ensure adequate selenium intake (55mcg/day minimum)', 'Brazil nuts, sardines, eggs, sunflower seeds are excellent sources'], priority: 'low' },
      'CC': { effect: 'Normal GPX1 activity', interpretation: 'Normal glutathione peroxidase function. Efficient selenium utilization for antioxidant defense.', recommendations: ['Maintain adequate selenium intake', 'Selenium is also important for thyroid hormone conversion (deiodinase enzymes)'], priority: 'low' },
    },
  },

  // === Iodine / Thyroid ===
  {
    rsid: 'rs225014', gene: 'DIO2', name: 'Thyroid Hormone Activation',
    display: 'DIO2 — Type 2 Deiodinase (T4→T3 Conversion in Tissues)',
    category: 'wellness', interpretations: {
      'CC': { effect: 'Reduced DIO2 activity (Thr92Ala variant)', interpretation: 'The DIO2 Thr92Ala variant reduces local T4→T3 conversion in tissues including brain, muscle, and brown adipose tissue. Despite normal circulating thyroid levels, cellular T3 may be suboptimal in specific tissues. Associated with insulin resistance, reduced metabolic rate, and potential cognitive effects.', recommendations: ['Ensure adequate selenium and zinc (required cofactors for deiodinase enzymes)', 'Monitor TSH, free T3, free T4, and reverse T3 — not just TSH alone', 'Consider T3-containing therapy if symptomatic with normal labs (discuss with endocrinologist)', 'Iodine intake: adequate but not excessive (150-300mcg/day)'], priority: 'medium' },
      'CT': { effect: 'Moderately reduced DIO2 activity', interpretation: 'Mild reduction in tissue-level T4→T3 conversion. Ensure adequate deiodinase cofactors.', recommendations: ['Adequate selenium (1-2 Brazil nuts/day or 100-200mcg supplement)', 'Monitor thyroid function if experiencing fatigue, cold intolerance, or weight changes'], priority: 'low' },
      'TT': { effect: 'Normal DIO2 activity', interpretation: 'Efficient tissue-level T4→T3 conversion. Normal cellular thyroid hormone availability.', recommendations: ['Maintain adequate iodine, selenium, and zinc for thyroid health'], priority: 'low' },
    },
  },

  // === Zinc ===
  {
    rsid: 'rs13107325', gene: 'SLC39A8', name: 'Zinc/Manganese Transport',
    display: 'SLC39A8 (ZIP8) — Cellular Zinc & Manganese Uptake',
    category: 'wellness', interpretations: {
      'CC': { effect: 'Reduced ZIP8 transporter activity (Ala391Thr variant)', interpretation: 'Reduced cellular uptake of zinc and manganese. Affects immune function (zinc is critical for T-cell development), antioxidant defense (MnSOD requires manganese), and neurotransmitter regulation. Associated with slightly higher BMI and blood pressure in GWAS.', recommendations: ['Ensure adequate zinc intake (15-25mg/day; zinc picolinate or citrate forms)', 'Include manganese-rich foods (whole grains, nuts, leafy greens, tea)', 'Zinc status can be assessed via plasma zinc or alkaline phosphatase activity', 'Monitor blood pressure — this variant is an independent risk factor'], priority: 'medium' },
      'CT': { effect: 'Moderately reduced zinc/manganese transport', interpretation: 'Mild reduction in cellular zinc and manganese uptake. Dietary adequacy especially important.', recommendations: ['Include zinc-rich foods (oysters, beef, pumpkin seeds, lentils)', 'Ensure adequate dietary manganese'], priority: 'low' },
      'TT': { effect: 'Normal ZIP8 transporter activity', interpretation: 'Efficient cellular zinc and manganese uptake. Standard dietary intake sufficient.', recommendations: ['Maintain adequate zinc and manganese intake through diet'], priority: 'low' },
    },
  },
];

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log('🥗 Nutritional Genomics Expansion\n');

  // Load existing wellness.json
  const wellnessPath = path.join(INTERP_DIR, 'wellness.json');
  const wellness = JSON.parse(fs.readFileSync(wellnessPath, 'utf-8'));
  const existingCount = Object.keys(wellness.markers).length;

  let added = 0;
  let skipped = 0;

  for (const entry of NUTRITIONAL_VARIANTS) {
    if (wellness.markers[entry.rsid]) {
      skipped++;
      continue;
    }
    wellness.markers[entry.rsid] = {
      gene: entry.gene,
      name: entry.name,
      category: entry.category,
      chrom: '',
      pos: 0,
      display: entry.display,
      interpretations: entry.interpretations,
    };
    added++;
  }

  wellness.updated = new Date().toISOString();
  fs.writeFileSync(wellnessPath, JSON.stringify(wellness, null, 2));
  console.log(`   wellness.json: ${existingCount} → ${Object.keys(wellness.markers).length} markers (+${added}, skipped ${skipped})`);

  // Add knowledge graph entries for new nutritional traits
  console.log('\n📚 Updating knowledge graph...');
  const kg = JSON.parse(fs.readFileSync(KG_PATH, 'utf-8'));
  const kgAdditions: Record<string, any> = {
    'omega3_metabolism': {
      trait_id: 'omega3_metabolism',
      mechanism: 'FADS1/FADS2/ELOVL2 desaturase and elongase pathway converting dietary alpha-linolenic acid (ALA) to long-chain omega-3 fatty acids EPA and DHA',
      outcomes: [
        { id: 'low_omega3_status', severity: 0.5, description: 'Reduced endogenous omega-3 synthesis may lead to suboptimal EPA/DHA levels, affecting cardiovascular, cognitive, and inflammatory health' },
        { id: 'high_aa_epa_ratio', severity: 0.6, description: 'Elevated arachidonic acid to EPA ratio promotes pro-inflammatory eicosanoid production' },
      ],
      actions: [
        { id: 'direct_omega3_supplementation', title: 'Supplement with direct EPA/DHA (fish oil or algae oil, 1-3g/day)', impact: 0.8, difficulty: 'low', description: 'Direct omega-3 supplementation bypasses the FADS-dependent conversion step entirely' },
        { id: 'limit_omega6', title: 'Reduce omega-6 intake from vegetable oils to improve omega-3 conversion efficiency', impact: 0.5, difficulty: 'medium', description: 'Omega-6 fatty acids compete for the same desaturase enzymes as omega-3s' },
        { id: 'monitor_omega3_index', title: 'Monitor omega-3 index (target >8%) via blood spot test', impact: 0.4, difficulty: 'low', description: 'Omega-3 index measures EPA+DHA as percentage of total RBC fatty acids' },
      ],
    },
    'choline_metabolism': {
      trait_id: 'choline_metabolism',
      mechanism: 'PEMT-mediated endogenous choline synthesis from phosphatidylethanolamine; choline is essential for methylation (via betaine), membrane integrity, lipoprotein secretion, and neurotransmitter synthesis',
      outcomes: [
        { id: 'choline_deficiency', severity: 0.6, description: 'Reduced endogenous choline synthesis increases risk of fatty liver, muscle damage, and impaired methylation when dietary intake is insufficient' },
        { id: 'methylation_compromise', severity: 0.5, description: 'Choline is a major methyl donor — deficiency shifts methylation burden to folate pathway' },
      ],
      actions: [
        { id: 'choline_rich_diet', title: 'Include choline-rich foods: eggs (yolks), beef liver, soy lecithin, wheat germ, cruciferous vegetables', impact: 0.8, difficulty: 'low', description: 'Dietary choline compensates for reduced endogenous synthesis' },
        { id: 'choline_supplement', title: 'Consider citicoline or alpha-GPC supplementation (250-500mg/day)', impact: 0.7, difficulty: 'low', description: 'Supplemental choline forms that cross the blood-brain barrier effectively' },
        { id: 'liver_monitoring', title: 'Monitor liver function (ALT, AST) and consider ultrasound if fatty liver is suspected', impact: 0.6, difficulty: 'medium', description: 'Choline deficiency is a direct cause of non-alcoholic fatty liver disease' },
      ],
    },
    'iron_homeostasis': {
      trait_id: 'iron_homeostasis',
      mechanism: 'Hepcidin-ferroportin axis regulating dietary iron absorption and reticuloendothelial iron recycling; TMPRSS6 matriptase-2 modulates hepcidin expression',
      outcomes: [
        { id: 'iron_deficiency_risk', severity: 0.5, description: 'Higher hepcidin reduces iron absorption, increasing risk of iron deficiency especially with plant-based diets or blood loss' },
        { id: 'iron_overload_risk', severity: 0.6, description: 'Lower hepcidin increases iron absorption; combined with HFE hemochromatosis variants can lead to iron overload' },
      ],
      actions: [
        { id: 'monitor_iron_panel', title: 'Monitor ferritin, serum iron, TIBC, and transferrin saturation annually', impact: 0.7, difficulty: 'low', description: 'Regular iron panel monitoring catches both deficiency and overload early' },
        { id: 'vitamin_c_with_iron', title: 'Pair iron-rich foods with vitamin C to enhance absorption (if deficient)', impact: 0.5, difficulty: 'low', description: 'Vitamin C increases non-heme iron absorption 2-3x' },
        { id: 'avoid_excess_supplementation', title: 'Avoid iron supplementation without documented deficiency and physician guidance', impact: 0.7, difficulty: 'low', description: 'Excess iron is pro-oxidative and contributes to aging via Fenton reaction' },
      ],
    },
    'magnesium_status': {
      trait_id: 'magnesium_status',
      mechanism: 'TRPM6-mediated intestinal magnesium absorption and renal reabsorption; magnesium is cofactor for 300+ enzymes including ATP metabolism, DNA repair, and neurotransmitter regulation',
      outcomes: [
        { id: 'magnesium_insufficiency', severity: 0.5, description: 'Suboptimal magnesium status can impair energy production, sleep quality, muscle function, and cardiovascular health' },
      ],
      actions: [
        { id: 'magnesium_supplementation', title: 'Supplement magnesium glycinate or malate (200-400mg elemental/day)', impact: 0.8, difficulty: 'low', description: 'Well-absorbed magnesium forms that don\'t cause GI distress' },
        { id: 'magnesium_rich_foods', title: 'Include leafy greens, nuts, seeds, dark chocolate, and legumes daily', impact: 0.5, difficulty: 'low', description: 'Dietary magnesium supports consistent daily intake' },
        { id: 'epsom_salt_baths', title: 'Epsom salt baths or topical magnesium oil for transdermal absorption', impact: 0.3, difficulty: 'low', description: 'Alternative route that bypasses gut absorption issues' },
      ],
    },
    'thyroid_metabolism': {
      trait_id: 'thyroid_metabolism',
      mechanism: 'Deiodinase enzymes (DIO1, DIO2) convert T4 to active T3 in peripheral tissues; selenium-dependent process crucial for metabolic rate, thermogenesis, and cognitive function',
      outcomes: [
        { id: 'reduced_t4_to_t3', severity: 0.5, description: 'Reduced peripheral T4→T3 conversion can cause tissue-level hypothyroidism despite normal TSH' },
        { id: 'metabolic_slowdown', severity: 0.4, description: 'Lower cellular T3 reduces basal metabolic rate and thermogenesis' },
      ],
      actions: [
        { id: 'selenium_zinc_support', title: 'Ensure adequate selenium (100-200mcg/day) and zinc — required deiodinase cofactors', impact: 0.7, difficulty: 'low', description: 'Selenium and zinc are essential for deiodinase enzyme function' },
        { id: 'full_thyroid_panel', title: 'Monitor TSH, free T3, free T4, and reverse T3 — not just TSH alone', impact: 0.7, difficulty: 'low', description: 'Comprehensive thyroid panel reveals conversion efficiency' },
        { id: 'iodine_balance', title: 'Maintain adequate but not excessive iodine (150-300mcg/day)', impact: 0.5, difficulty: 'low', description: 'Both deficiency and excess can impair thyroid function' },
      ],
    },
    'selenium_metabolism': {
      trait_id: 'selenium_metabolism',
      mechanism: 'Selenium incorporation into selenoproteins (GPX1, GPX4, SEPP1, DIO1/2/3) — critical for antioxidant defense, thyroid hormone metabolism, and ferroptosis protection',
      outcomes: [
        { id: 'reduced_antioxidant_defense', severity: 0.5, description: 'Lower GPX activity increases vulnerability to oxidative stress and lipid peroxidation' },
        { id: 'ferroptosis_sensitivity', severity: 0.4, description: 'GPX4 requires selenium to prevent ferroptotic cell death' },
      ],
      actions: [
        { id: 'selenium_supplementation', title: 'Selenium supplementation (selenomethionine 100-200mcg/day)', impact: 0.7, difficulty: 'low', description: 'Supports GPX and deiodinase enzyme activity' },
        { id: 'brazil_nuts', title: '1-2 Brazil nuts/day provides full RDA of selenium', impact: 0.6, difficulty: 'low', description: 'Brazil nuts are the richest natural selenium source; don\'t exceed 3-4/day to avoid toxicity' },
      ],
    },
    'zinc_homeostasis': {
      trait_id: 'zinc_homeostasis',
      mechanism: 'SLC39A8 (ZIP8) and SLC30A8 (ZnT8) transporters regulating cellular zinc uptake and distribution; zinc is essential for immune function, DNA repair, growth, and 300+ zinc-finger transcription factors',
      outcomes: [
        { id: 'zinc_insufficiency', severity: 0.5, description: 'Reduced cellular zinc can impair immune response, wound healing, and antioxidant defense' },
      ],
      actions: [
        { id: 'zinc_supplementation', title: 'Ensure adequate zinc intake (15-25mg/day; zinc picolinate or citrate)', impact: 0.7, difficulty: 'low', description: 'Well-absorbed zinc forms support immune and antioxidant function' },
        { id: 'zinc_rich_foods', title: 'Include oysters, beef, pumpkin seeds, and lentils regularly', impact: 0.5, difficulty: 'low', description: 'Dietary zinc from animal sources is more bioavailable than plant sources' },
      ],
    },
  };

  let kgAdded = 0;
  for (const [traitId, entry] of Object.entries(kgAdditions)) {
    if (!kg[traitId]) {
      kg[traitId] = entry;
      kgAdded++;
    }
  }

  fs.writeFileSync(KG_PATH, JSON.stringify(kg, null, 2));
  console.log(`   Knowledge graph: ${Object.keys(kg).length} traits (+${kgAdded})`);

  // Add gene→trait mappings to index.ts
  console.log('\n🔗 Adding gene→trait mappings...');
  let indexContent = fs.readFileSync(INDEX_PATH, 'utf-8');

  const newMappings: Array<[string, string, string]> = [
    ['fads1', 'omega3_metabolism', 'FADS1 — omega-3 desaturase, EPA synthesis'],
    ['fads2', 'omega3_metabolism', 'FADS2 — delta-6 desaturase, DHA synthesis'],
    ['elovl2', 'omega3_metabolism', 'ELOVL2 — PUFA elongase'],
    ['pemt', 'choline_metabolism', 'PEMT — endogenous choline synthesis'],
    ['slc19a1', 'b12_metabolism', 'RFC1 — reduced folate carrier'],
    ['tmpress6', 'iron_homeostasis', 'TMPRSS6 — hepcidin regulator'],
    ['trpm6', 'magnesium_status', 'TRPM6 — magnesium transporter'],
    ['dio2', 'thyroid_metabolism', 'DIO2 — T4→T3 tissue conversion'],
    ['gpx1', 'selenium_metabolism', 'GPX1 — selenium-dependent antioxidant'],
    ['slc39a8', 'zinc_homeostasis', 'SLC39A8/ZIP8 — zinc/manganese transporter'],
  ];

  // Find insertion point — after a well-known gene mapping
  const insertMarker = "'trpm6': 'magnesium_status'";
  if (!indexContent.includes(insertMarker)) {
    // Add after slco1b1 line
    const slcoLine = "'slco1b1': 'drug_transport'";
    let inserted = 0;
    for (const [gene, trait, comment] of newMappings) {
      const mapping = `'${gene}': '${trait}',`;
      if (indexContent.includes(mapping)) continue;
      indexContent = indexContent.replace(
        slcoLine,
        `${slcoLine},\n    ${mapping.padEnd(35)} // ${comment}`
      );
      inserted++;
    }
    console.log(`   Added ${inserted} gene→trait mappings`);
  } else {
    console.log('   Gene→trait mappings already present');
    fs.writeFileSync(INDEX_PATH, indexContent);
  }

  // Only write index if we changed it
  if (indexContent !== fs.readFileSync(INDEX_PATH, 'utf-8')) {
    fs.writeFileSync(INDEX_PATH, indexContent);
  }

  console.log('\n✅ Nutritional genomics expansion complete.');
  console.log(`   Total markers: ${Object.keys(wellness.markers).length} (wellness.json)`);
  console.log(`   Knowledge graph: ${Object.keys(kg).length} traits`);
}

main();
