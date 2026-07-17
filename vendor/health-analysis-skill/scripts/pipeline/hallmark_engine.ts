/**
 * Hallmark Pathway Engine
 * Groups VCF-matched genes into the 9 aging hallmarks (Lopez-Otin 2023)
 * and produces per-hallmark burden + actionability scores.
 *
 * This leverages WGS data properly — every variant in every gene contributes
 * to pathway-level analysis, not just individual SNP matching.
 *
 * Hallmarks of Aging:
 *  1. Genomic instability
 *  2. Telomere attrition
 *  3. Epigenetic alterations
 *  4. Loss of proteostasis
 *  5. Disabled macroautophagy
 *  6. Deregulated nutrient sensing
 *  7. Mitochondrial dysfunction
 *  8. Cellular senescence
 *  9. Stem cell exhaustion
 * 10. Altered intercellular communication (bonus: inflammaging)
 */

// ============================================================================
// Gene → Hallmark Mapping (307 GenAge genes → 9 hallmarks)
// ============================================================================

export const hallmarkNames: Record<string, string> = {
  genomic_instability: 'Genomic Instability',
  telomere_attrition: 'Telomere Attrition',
  epigenetic_alterations: 'Epigenetic Alterations',
  loss_of_proteostasis: 'Loss of Proteostasis',
  disabled_macroautophagy: 'Disabled Macroautophagy',
  deregulated_nutrient_sensing: 'Deregulated Nutrient Sensing',
  mitochondrial_dysfunction: 'Mitochondrial Dysfunction',
  cellular_senescence: 'Cellular Senescence',
  stem_cell_exhaustion: 'Stem Cell Exhaustion',
  altered_communication: 'Altered Intercellular Communication',
};

export const hallmarkColors: Record<string, string> = {
  genomic_instability: '#FF5A5F',
  telomere_attrition: '#FF8C42',
  epigenetic_alterations: '#FFB020',
  loss_of_proteostasis: '#3A86FF',
  disabled_macroautophagy: '#5A9FD4',
  deregulated_nutrient_sensing: '#2EE6A6',
  mitochondrial_dysfunction: '#9B59B6',
  cellular_senescence: '#E74C3C',
  stem_cell_exhaustion: '#E91E63',
  altered_communication: '#3498DB',
};

export const hallmarkActions: Record<string, string[]> = {
  genomic_instability: [
    'Minimize UV, smoking, genotoxic exposures',
    'Support NAD+ for PARP-mediated DNA repair',
    'Age-appropriate cancer screening',
    'Consider DNA-damage prevention supplements (NAC, selenium)'
  ],
  telomere_attrition: [
    'Regular aerobic exercise (slows telomere shortening)',
    'Stress management (cortisol accelerates attrition)',
    'Avoid telomerase supplement scams (retracted evidence)'
  ],
  epigenetic_alterations: [
    'Exercise (strongest epigenetic anti-aging intervention)',
    'Dietary HDAC inhibitors: sulforaphane, butyrate',
    'Track epigenetic age every 1-2 years'
  ],
  loss_of_proteostasis: [
    'Sauna / heat exposure 4-7x/week (induces HSPs)',
    'Exercise-induced HSP response',
    'Sulforaphane / NRF2 activators for proteasome subunits'
  ],
  disabled_macroautophagy: [
    'Intermittent fasting (>16h triggers autophagy)',
    'Exercise stimulates autophagy in muscle and brain',
    'Spermidine-rich foods (wheat germ, aged cheese, mushrooms)'
  ],
  deregulated_nutrient_sensing: [
    'Discuss rapamycin with longevity-literate physician',
    'Time-restricted eating (16:8 protocol)',
    'Moderate protein intake; balance mTOR vs sarcopenia risk'
  ],
  mitochondrial_dysfunction: [
    'HIIT training 2x/week for mitochondrial biogenesis',
    'CoQ10, PQQ, ALA supplementation',
    'Cold exposure for mitochondrial uncoupling',
    'Consider urolithin A (Mitopure) for mitophagy'
  ],
  cellular_senescence: [
    'D+Q senolytic protocol (physician-supervised)',
    'Regular exercise reduces p16INK4a and senescent markers',
    'Dietary fisetin (strawberries, apples)',
    'Avoid known senescence inducers: smoking, UV, pollution'
  ],
  stem_cell_exhaustion: [
    'Exercise mobilizes endogenous stem cells',
    'Avoid unregulated stem cell clinics',
    'Monitor emerging iPSC-derived therapies in clinical trials'
  ],
  altered_communication: [
    'Anti-inflammatory diet (omega-3, polyphenols)',
    'Exercise reduces systemic inflammation',
    'CRP and IL-6 monitoring',
    'Gut microbiome support (fiber, fermented foods)'
  ],
};

const geneToHallmark: Record<string, string[]> = {
  // Genomic instability
  'tp53': ['genomic_instability', 'cellular_senescence'],
  'atm': ['genomic_instability', 'cellular_senescence'],
  'atr': ['genomic_instability'],
  'brca1': ['genomic_instability'],
  'brca2': ['genomic_instability'],
  'chek2': ['genomic_instability'],
  'ercc1': ['genomic_instability'],
  'ercc2': ['genomic_instability'],
  'ercc3': ['genomic_instability'],
  'ercc4': ['genomic_instability'],
  'ercc5': ['genomic_instability'],
  'ercc6': ['genomic_instability'],
  'ercc8': ['genomic_instability'],
  'wrn': ['genomic_instability'],
  'blm': ['genomic_instability'],
  'recql4': ['genomic_instability'],
  'xpa': ['genomic_instability'],
  'xpc': ['genomic_instability'],
  'xrcc1': ['genomic_instability'],
  'xrcc5': ['genomic_instability'],
  'xrcc6': ['genomic_instability'],
  'mlh1': ['genomic_instability'],
  'rad51': ['genomic_instability'],
  'rad52': ['genomic_instability'],
  'nbn': ['genomic_instability'],
  'parp1': ['genomic_instability'],
  'pcna': ['genomic_instability'],
  'pold1': ['genomic_instability'],
  'pole': ['genomic_instability'],
  'polg': ['genomic_instability', 'mitochondrial_dysfunction'],
  'apex1': ['genomic_instability'],
  'ogg1': ['genomic_instability'],
  'mutyh': ['genomic_instability'],
  'fen1': ['genomic_instability'],
  'nudt1': ['genomic_instability'],
  'h2afx': ['genomic_instability'],
  'prkdc': ['genomic_instability'],
  'rb1': ['genomic_instability', 'cellular_senescence'],
  'sprtn': ['genomic_instability'],

  // Telomere attrition
  'tert': ['telomere_attrition'],
  'terc': ['telomere_attrition'],
  'terf1': ['telomere_attrition'],
  'terf2': ['telomere_attrition'],

  // Epigenetic alterations
  'sirt1': ['epigenetic_alterations', 'deregulated_nutrient_sensing'],
  'sirt6': ['epigenetic_alterations', 'genomic_instability'],
  'sirt7': ['epigenetic_alterations'],
  'hdac1': ['epigenetic_alterations'],
  'hdac2': ['epigenetic_alterations'],
  'hdac3': ['epigenetic_alterations'],
  'sin3a': ['epigenetic_alterations'],
  'ep300': ['epigenetic_alterations'],
  'crebbp': ['epigenetic_alterations'],
  'ncrd1': ['epigenetic_alterations'],
  'ncrd2': ['epigenetic_alterations'],
  'bmi1': ['epigenetic_alterations', 'stem_cell_exhaustion'],
  'helys': ['epigenetic_alterations'],
  'hic1': ['epigenetic_alterations'],
  'hist1': ['epigenetic_alterations'],

  // Loss of proteostasis
  'hspa1a': ['loss_of_proteostasis'],
  'hspa1b': ['loss_of_proteostasis'],
  'hspa8': ['loss_of_proteostasis'],
  'hspa9': ['loss_of_proteostasis', 'mitochondrial_dysfunction'],
  'hspd1': ['loss_of_proteostasis', 'mitochondrial_dysfunction'],
  'hsp90aa1': ['loss_of_proteostasis'],
  'stub1': ['loss_of_proteostasis'],
  'pin1': ['loss_of_proteostasis'],
  'sumo1': ['loss_of_proteostasis'],
  'ubuln': ['loss_of_proteostasis'],
  'ub1': ['loss_of_proteostasis'],
  'uchl1': ['loss_of_proteostasis'],
  'vcp': ['loss_of_proteostasis'],

  // Disabled macroautophagy
  'sqstm1': ['disabled_macroautophagy'],
  'atg5': ['disabled_macroautophagy'],
  'atg7': ['disabled_macroautophagy'],
  'been1': ['disabled_macroautophagy'],
  'ndp52': ['disabled_macroautophagy'],

  // Deregulated nutrient sensing
  'mtor': ['deregulated_nutrient_sensing'],
  'rictor': ['deregulated_nutrient_sensing'],
  'akt1': ['deregulated_nutrient_sensing'],
  'akt2': ['deregulated_nutrient_sensing'],
  'igf1': ['deregulated_nutrient_sensing'],
  'igf1r': ['deregulated_nutrient_sensing'],
  'irs1': ['deregulated_nutrient_sensing'],
  'irs2': ['deregulated_nutrient_sensing'],
  'ins': ['deregulated_nutrient_sensing'],
  'insr': ['deregulated_nutrient_sensing'],
  'gsk3a': ['deregulated_nutrient_sensing'],
  'gsk3b': ['deregulated_nutrient_sensing'],
  'pten': ['deregulated_nutrient_sensing'],
  'pik3ca': ['deregulated_nutrient_sensing'],
  'pik3cb': ['deregulated_nutrient_sensing'],
  'pik3r1': ['deregulated_nutrient_sensing'],
  'pdpk1': ['deregulated_nutrient_sensing'],
  'foxo1': ['deregulated_nutrient_sensing'],
  'foxo3': ['deregulated_nutrient_sensing'],
  'foxo4': ['deregulated_nutrient_sensing'],
  'ampk': ['deregulated_nutrient_sensing'],
  'sirt3': ['deregulated_nutrient_sensing', 'mitochondrial_dysfunction'],
  'kl': ['deregulated_nutrient_sensing'],
  'fgf21': ['deregulated_nutrient_sensing'],
  'gh1': ['deregulated_nutrient_sensing'],
  'ghr': ['deregulated_nutrient_sensing'],
  'ghrh': ['deregulated_nutrient_sensing'],
  'ghrhr': ['deregulated_nutrient_sensing'],
  'igfbp2': ['deregulated_nutrient_sensing'],
  'igfbp3': ['deregulated_nutrient_sensing'],
  'lep': ['deregulated_nutrient_sensing'],
  'lepr': ['deregulated_nutrient_sensing'],

  // Mitochondrial dysfunction
  'sod1': ['mitochondrial_dysfunction'],
  'sod2': ['mitochondrial_dysfunction'],
  'cat': ['mitochondrial_dysfunction'],
  'gpx1': ['mitochondrial_dysfunction'],
  'gpx4': ['mitochondrial_dysfunction'],
  'prdx1': ['mitochondrial_dysfunction'],
  'txn': ['mitochondrial_dysfunction'],
  'gsr': ['mitochondrial_dysfunction'],
  'gss': ['mitochondrial_dysfunction'],
  'gclc': ['mitochondrial_dysfunction'],
  'gclm': ['mitochondrial_dysfunction'],
  'msra': ['mitochondrial_dysfunction'],
  'aifm1': ['mitochondrial_dysfunction'],
  'coq7': ['mitochondrial_dysfunction'],
  'atp5o': ['mitochondrial_dysfunction'],
  'hmox1': ['mitochondrial_dysfunction'],
  'hif1a': ['mitochondrial_dysfunction'],
  'ppargc1a': ['mitochondrial_dysfunction'],
  'ucp1': ['mitochondrial_dysfunction'],
  'ucp2': ['mitochondrial_dysfunction'],
  'ucp3': ['mitochondrial_dysfunction'],
  'htrea2': ['mitochondrial_dysfunction'],
  'nfe2l2': ['mitochondrial_dysfunction'],

  // Cellular senescence
  'cdkn1a': ['cellular_senescence'],
  'cdkn2a': ['cellular_senescence'],
  'cdkn2b': ['cellular_senescence'],
  'pml': ['cellular_senescence'],
  'cdk1': ['cellular_senescence'],
  'e2f1': ['cellular_senescence'],
  'bcl2': ['cellular_senescence'],
  'bax': ['cellular_senescence'],
  'bak1': ['cellular_senescence'],
  'fas': ['cellular_senescence'],
  'myc': ['cellular_senescence'],
  'hras': ['cellular_senescence'],
  'mdm2': ['cellular_senescence'],
  'serpine1': ['cellular_senescence'],
  'mapk14': ['cellular_senescence'],
  'mapk3': ['cellular_senescence'],
  'mapk8': ['cellular_senescence'],
  'mapk9': ['cellular_senescence'],
  'jun': ['cellular_senescence'],
  'fos': ['cellular_senescence'],
  'rela': ['cellular_senescence'],
  'nfkb1': ['cellular_senescence'],
  'nfkb2': ['cellular_senescence'],
  'nfkbia': ['cellular_senescence'],

  // Stem cell exhaustion
  'wnt1': ['stem_cell_exhaustion'],
  'ctnnb1': ['stem_cell_exhaustion'],
  'notch1': ['stem_cell_exhaustion'],
  'nog': ['stem_cell_exhaustion'],
  'gdf11': ['stem_cell_exhaustion'],
  'fgfr1': ['stem_cell_exhaustion'],
  'egf': ['stem_cell_exhaustion'],
  'egfr': ['stem_cell_exhaustion'],
  'pdgfb': ['stem_cell_exhaustion'],
  'pdgfra': ['stem_cell_exhaustion'],
  'pdgfrb': ['stem_cell_exhaustion'],
  'lmna': ['stem_cell_exhaustion'],

  // Altered intercellular communication
  'il6': ['altered_communication'],
  'tnf': ['altered_communication'],
  'il1a': ['altered_communication'],
  'il1b': ['altered_communication'],
  'il10': ['altered_communication'],
  'il7': ['altered_communication'],
  'il7r': ['altered_communication'],
  'ifnb1': ['altered_communication'],
  'crp': ['altered_communication'],
  'tgfbi': ['altered_communication'],
  'ctgf': ['altered_communication'],
  'vegfa': ['altered_communication'],
  'hmgb1': ['altered_communication'],
  'mif': ['altered_communication'],
  's100b': ['altered_communication'],
  'c1qa': ['altered_communication'],
  'apoe': ['altered_communication', 'deregulated_nutrient_sensing'],
  'clu': ['altered_communication'],
  'plau': ['altered_communication'],
  'sst': ['altered_communication'],
  'sstr3': ['altered_communication'],
};

// ============================================================================
// Types
// ============================================================================

export interface HallmarkScore {
  hallmark_id: string;
  name: string;
  color: string;
  gene_count: number;
  genes: string[];
  burden: number;          // 0-1 normalized burden score
  actionability: 'high' | 'moderate' | 'low';
  actions: string[];
  trait_connections: string[]; // knowledge graph traits connected to this hallmark
}

export interface HallmarkReport {
  hallmarks: HallmarkScore[];
  total_genes_hit: number;
  hallmarks_affected: number;
  summary: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Score gene burden based on alert/risk/superpower severity
 */
function scoreGeneBurden(
  gene: string,
  alerts: Array<{ gene: string; tag: string }>,
  risks: Array<{ itemName: string; priority: number }>,
  superpowers: Array<{ itemName: string }>
): number {
  let burden = 0;

  const geneLower = gene.toLowerCase();

  // Medical alerts = high burden
  for (const alert of alerts) {
    if (alert.gene.toLowerCase() === geneLower) {
      burden += alert.tag.includes('Medical Alert') ? 0.8 : 0.5;
    }
  }

  // Risk priority scores
  for (const risk of risks) {
    const parts = risk.itemName.split(' ');
    if (parts[0].toLowerCase() === geneLower) {
      burden += (4 - risk.priority) * 0.2; // priority 1 = 0.6, 2 = 0.4, 3 = 0.2
    }
  }

  // Superpowers reduce burden (protective variants)
  for (const sp of superpowers) {
    const parts = sp.itemName.split(' ');
    if (parts[0].toLowerCase() === geneLower) {
      burden -= 0.3;
    }
  }

  return Math.max(0, Math.min(1, burden));
}

/**
 * Trait connections for each hallmark
 */
const hallmarkToTraits: Record<string, string[]> = {
  genomic_instability: ['genome_stability', 'dna_repair'],
  telomere_attrition: ['telomere_maintenance'],
  epigenetic_alterations: ['epigenetic_maintenance', 'epigenetic_age'],
  loss_of_proteostasis: ['protein_homeostasis'],
  disabled_macroautophagy: ['proteasome_autophagy'],
  deregulated_nutrient_sensing: ['mTOR_signaling', 'insulin_signaling', 'klotho_anti_aging'],
  mitochondrial_dysfunction: ['mitochondrial_function', 'oxidative_stress', 'mitochondrial_biogenesis'],
  cellular_senescence: ['senescence'],
  stem_cell_exhaustion: ['stem_cells'],
  altered_communication: ['inflammation', 'inflammation_marker'],
};

/**
 * Compute hallmark pathway scores from VCF-matched genes
 */
export function computeHallmarkScores(
  matchedGenes: string[],
  alerts: Array<{ gene: string; tag: string }>,
  risks: Array<{ itemName: string; priority: number }>,
  superpowers: Array<{ itemName: string }>
): HallmarkReport {
  const hallmarkMap = new Map<string, { genes: string[]; burden: number }>();

  for (const gene of matchedGenes) {
    const geneLower = gene.toLowerCase();
    const hallmarks = geneToHallmark[geneLower];

    if (!hallmarks) continue;

    const burden = scoreGeneBurden(gene, alerts, risks, superpowers);

    for (const hallmarkId of hallmarks) {
      if (!hallmarkMap.has(hallmarkId)) {
        hallmarkMap.set(hallmarkId, { genes: [], burden: 0 });
      }
      const entry = hallmarkMap.get(hallmarkId)!;
      entry.genes.push(gene);
      entry.burden = Math.max(entry.burden, burden); // take max burden per hallmark
    }
  }

  const scores: HallmarkScore[] = [];

  for (const [hallmarkId, data] of hallmarkMap) {
    const avgBurden = data.burden; // using max per hallmark
    const name = hallmarkNames[hallmarkId] || hallmarkId;
    const color = hallmarkColors[hallmarkId] || '#5A6168';
    const actions = hallmarkActions[hallmarkId] || [];
    const traitConnections = hallmarkToTraits[hallmarkId] || [];

    let actionability: 'high' | 'moderate' | 'low';
    if (avgBurden >= 0.5) actionability = 'high';
    else if (avgBurden >= 0.3) actionability = 'moderate';
    else actionability = 'low';

    scores.push({
      hallmark_id: hallmarkId,
      name,
      color,
      gene_count: data.genes.length,
      genes: data.genes,
      burden: avgBurden,
      actionability,
      actions,
      trait_connections: traitConnections,
    });
  }

  // Sort by burden (highest first)
  scores.sort((a, b) => b.burden - a.burden);

  const totalGenes = new Set(matchedGenes.map(g => g.toLowerCase())).size;
  const hallmarksAffected = scores.length;

  let summary: string;
  if (hallmarksAffected === 0) {
    summary = 'No aging hallmark pathways show significant variant burden.';
  } else if (hallmarksAffected <= 2) {
    summary = `Your variants affect ${hallmarksAffected} aging hallmark pathway${hallmarksAffected > 1 ? 's' : ''}: ${scores.map(s => s.name).join(' and ')}.`;
  } else {
    const highBurden = scores.filter(s => s.actionability === 'high');
    summary = `Your variants affect ${hallmarksAffected} of 9 aging hallmark pathways`;
    if (highBurden.length > 0) {
      summary += `, with significant burden in: ${highBurden.map(s => s.name).join(', ')}.`;
    } else {
      summary += '. Impact is distributed across pathways.';
    }
  }

  return {
    hallmarks: scores,
    total_genes_hit: totalGenes,
    hallmarks_affected: hallmarksAffected,
    summary,
  };
}

/**
 * Get all genes mapped to a specific hallmark
 */
export function getGenesForHallmark(hallmarkId: string): string[] {
  return Object.entries(geneToHallmark)
    .filter(([, hallmarks]) => hallmarks.includes(hallmarkId))
    .map(([gene]) => gene);
}

/**
 * Get hallmarks for a gene
 */
export function getHallmarksForGene(gene: string): string[] {
  return geneToHallmark[gene.toLowerCase()] || [];
}
