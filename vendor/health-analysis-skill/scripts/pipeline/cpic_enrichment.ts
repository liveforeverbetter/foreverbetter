/**
 * CPIC Pharmacogenomic Enrichment Engine
 *
 * Cross-references user variants against CPIC Level A/B drug-gene pairs.
 * These are clinically actionable pharmacogenomic associations with
 * published practice guidelines from CPIC (Clinical Pharmacogenetics
 * Implementation Consortium).
 *
 * Level A: Genetic information should be used to change prescribing.
 * Level B: Genetic information could be used to change prescribing.
 *
 * Sources: CPIC guidelines, PharmGKB, peer-reviewed medical literature.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface CPICGeneDrugPair {
  gene: string;
  drug: string;
  rsid: string;
  alleles: string[];
  phenotypeMap: Record<string, string>; // genotype → phenotype
  recommendationMap: Record<string, string>; // phenotype → clinical recommendation
  cpicLevel: 'A' | 'B' | 'C' | 'D';
  guidelineUrl: string;
  evidenceSummary: string;
}

export interface CPICMatch {
  gene: string;
  drug: string;
  rsid: string;
  userGenotype: string;
  phenotype: string;
  recommendation: string;
  cpicLevel: string;
  guidelineUrl: string;
  evidenceTier?: 1 | 2 | 3;
}

export interface CPICEnrichmentResult {
  matches: CPICMatch[];
  totalQueried: number;
  totalFound: number;
  levelAMatches: number;
  levelBMatches: number;
}

/**
 * Keep CPIC evidence useful without turning a wellness report into a prescribing
 * surface. Exact drug choices and dose changes belong in a verified clinical
 * workflow with the complete medication and patient context.
 */
export function wellnessSafeCPICRecommendation(input: {
  gene: string;
  drug: string;
  phenotype: string;
  cpicLevel: string;
}): string {
  const phenotype = input.phenotype === 'Unknown phenotype'
    ? 'The phenotype could not be resolved from this result.'
    : `The detected ${input.gene} result maps to ${input.phenotype.toLowerCase()} for ${input.drug}.`;
  return `${phenotype} Do not start, stop, substitute, or change the dose of ${input.drug} from this wellness report. A prescribing clinician or pharmacist should confirm the result, review the complete clinical context, and consult the CPIC Level ${input.cpicLevel} guideline.`;
}

// ============================================================================
// Known CPIC Level A Drug-Gene Pairs (from clinical guidelines)
// ============================================================================

export const CPIC_LEVEL_A_PAIRS: CPICGeneDrugPair[] = [
  // Cardiovascular
  {
    gene: 'CYP2C19',
    drug: 'clopidogrel',
    rsid: 'rs4244285',
    alleles: ['*1', '*2', '*3', '*17'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*2': 'Intermediate metabolizer',
      '*1/*3': 'Intermediate metabolizer',
      '*2/*2': 'Poor metabolizer',
      '*2/*3': 'Poor metabolizer',
      '*3/*3': 'Poor metabolizer',
      '*1/*17': 'Rapid metabolizer',
      '*17/*17': 'Ultrarapid metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard dose clopidogrel 75mg daily',
      'Intermediate metabolizer': 'Consider alternative antiplatelet (prasugrel or ticagrelor)',
      'Poor metabolizer': 'Use alternative antiplatelet — clopidogrel ineffective. Prasugrel or ticagrelor recommended',
      'Rapid metabolizer': 'Standard dose clopidogrel 75mg daily',
      'Ultrarapid metabolizer': 'Standard dose clopidogrel 75mg daily',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-clopidogrel-and-cyp2c19/',
    evidenceSummary: 'CYP2C19 poor metabolizers have reduced clopidogrel active metabolite and increased cardiovascular events',
  },
  {
    gene: 'CYP2C19',
    drug: 'clopidogrel',
    rsid: 'rs12248560',
    alleles: ['*1', '*17'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*17': 'Rapid metabolizer',
      '*17/*17': 'Ultrarapid metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard dose clopidogrel',
      'Rapid metabolizer': 'Standard dose clopidogrel',
      'Ultrarapid metabolizer': 'Standard dose clopidogrel',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-clopidogrel-and-cyp2c19/',
    evidenceSummary: 'CYP2C19*17 gain-of-function allele associated with increased enzyme activity',
  },
  {
    gene: 'CYP2C9',
    drug: 'warfarin',
    rsid: 'rs1799853',
    alleles: ['*1', '*2'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*2': 'Intermediate metabolizer',
      '*2/*2': 'Poor metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard warfarin dosing based on clinical factors',
      'Intermediate metabolizer': 'Reduce warfarin starting dose 20-30%. Monitor INR closely',
      'Poor metabolizer': 'Reduce warfarin starting dose 40-50%. Consider alternative anticoagulant',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-warfarin/',
    evidenceSummary: 'CYP2C9*2 reduces warfarin metabolism ~30%; increases bleeding risk if not dose-adjusted',
  },
  {
    gene: 'CYP2C9',
    drug: 'warfarin',
    rsid: 'rs1057910',
    alleles: ['*1', '*3'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*3': 'Intermediate metabolizer',
      '*3/*3': 'Poor metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard warfarin dosing',
      'Intermediate metabolizer': 'Reduce warfarin starting dose 20-30%',
      'Poor metabolizer': 'Reduce warfarin starting dose 40-50%. Consider alternative anticoagulant',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-warfarin/',
    evidenceSummary: 'CYP2C9*3 reduces warfarin metabolism ~80%; strongly associated with bleeding risk',
  },
  {
    gene: 'VKORC1',
    drug: 'warfarin',
    rsid: 'rs9923231',
    alleles: ['G', 'A'],
    phenotypeMap: {
      'GG': 'Normal sensitivity',
      'GA': 'Intermediate sensitivity',
      'AA': 'High sensitivity',
    },
    recommendationMap: {
      'Normal sensitivity': 'Standard warfarin dosing',
      'Intermediate sensitivity': 'Reduce warfarin starting dose ~30%',
      'High sensitivity': 'Reduce warfarin starting dose ~50%. Strongly consider alternative anticoagulant',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-warfarin/',
    evidenceSummary: 'VKORC1 -1639G>A reduces VKORC1 expression; AA genotype requires significantly lower warfarin dose',
  },
  {
    gene: 'SLCO1B1',
    drug: 'simvastatin',
    rsid: 'rs4149056',
    alleles: ['T', 'C'],
    phenotypeMap: {
      'TT': 'Normal function',
      'TC': 'Intermediate function',
      'CC': 'Low function',
    },
    recommendationMap: {
      'Normal function': 'Standard simvastatin dosing tolerated',
      'Intermediate function': 'Consider lower simvastatin dose or alternative statin (atorvastatin, rosuvastatin)',
      'Low function': 'High myopathy risk with simvastatin >20mg. Use alternative statin (atorvastatin or rosuvastatin)',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-simvastatin-and-slco1b1/',
    evidenceSummary: 'SLCO1B1*5 (rs4149056 C allele) reduces hepatic statin uptake; CC genotype has 17x increased myopathy risk with high-dose simvastatin',
  },

  // Pain / Neurology
  {
    gene: 'CYP2D6',
    drug: 'codeine',
    rsid: 'rs3892097',
    alleles: ['*1', '*4'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*4': 'Intermediate metabolizer',
      '*4/*4': 'Poor metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard codeine dosing as indicated',
      'Intermediate metabolizer': 'Standard dosing. Monitor for efficacy; consider alternative if inadequate response',
      'Poor metabolizer': 'Avoid codeine — ineffective. Use alternative analgesic (morphine, oxycodone not prodrug; or NSAID)',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-codeine-and-cyp2d6/',
    evidenceSummary: 'CYP2D6 poor metabolizers cannot convert codeine (prodrug) to active morphine; no analgesic effect',
  },
  {
    gene: 'CYP2D6',
    drug: 'tramadol',
    rsid: 'rs3892097',
    alleles: ['*1', '*4'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*4': 'Intermediate metabolizer',
      '*4/*4': 'Poor metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard tramadol dosing',
      'Intermediate metabolizer': 'Standard dosing. If inadequate response, consider non-codeine alternative',
      'Poor metabolizer': 'Avoid tramadol — reduced efficacy. Use alternative analgesic',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-codeine-and-cyp2d6/',
    evidenceSummary: 'CYP2D6 converts tramadol to O-desmethyltramadol (active metabolite); poor metabolizers have reduced analgesia',
  },

  // Oncology
  {
    gene: 'TPMT',
    drug: 'azathioprine / mercaptopurine / thioguanine',
    rsid: 'rs1142345',
    alleles: ['*1', '*3A', '*3B', '*3C'],
    phenotypeMap: {
      '*1/*1': 'Normal activity',
      '*1/*3A': 'Intermediate activity',
      '*1/*3C': 'Intermediate activity',
      '*3A/*3A': 'Low activity',
      '*3C/*3C': 'Low activity',
    },
    recommendationMap: {
      'Normal activity': 'Standard thiopurine dosing',
      'Intermediate activity': 'Reduce dose to 30-70% of standard. Monitor for myelosuppression',
      'Low activity': 'Reduce dose to 10% of standard (or choose alternative). High risk of fatal myelosuppression at standard doses',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-thiopurines-and-tpmt/',
    evidenceSummary: 'TPMT deficiency causes severe myelosuppression with standard thiopurine doses; potentially fatal',
  },
  {
    gene: 'DPYD',
    drug: 'fluorouracil / capecitabine',
    rsid: 'rs3918290',
    alleles: ['*1', '*2A'],
    phenotypeMap: {
      '*1/*1': 'Normal activity',
      '*1/*2A': 'Intermediate activity',
      '*2A/*2A': 'Low activity',
    },
    recommendationMap: {
      'Normal activity': 'Standard fluorouracil dosing',
      'Intermediate activity': 'Reduce starting dose 50%. Monitor for toxicity',
      'Low activity': 'Avoid fluorouracil. Consider alternative chemotherapy regimen',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-fluoropyrimidines-and-dpyd/',
    evidenceSummary: 'DPYD deficiency causes severe/life-threatening toxicity with standard fluoropyrimidine doses',
  },
  {
    gene: 'UGT1A1',
    drug: 'irinotecan',
    rsid: 'rs8175347',
    alleles: ['*1', '*28'],
    phenotypeMap: {
      '*1/*1': 'Normal activity',
      '*1/*28': 'Intermediate activity',
      '*28/*28': 'Low activity',
    },
    recommendationMap: {
      'Normal activity': 'Standard irinotecan dose',
      'Intermediate activity': 'Consider irinotecan dose reduction to 70%',
      'Low activity': 'Reduce irinotecan starting dose 70%. High risk of severe neutropenia at standard dose',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-irinotecan-and-ugt1a1/',
    evidenceSummary: 'UGT1A1*28 reduces irinotecan glucuronidation; *28/*28 homozygotes have 9x increased severe neutropenia risk',
  },

  // Infectious disease
  {
    gene: 'HLA-B',
    drug: 'abacavir',
    rsid: 'rs2395029',
    alleles: ['Negative', 'Positive'],
    phenotypeMap: {
      'Negative': '*57:01 negative',
      'Positive': '*57:01 positive',
    },
    recommendationMap: {
      '*57:01 negative': 'Abacavir is safe to prescribe',
      '*57:01 positive': 'ABSOLUTELY contraindicated — high risk of fatal hypersensitivity reaction. Use alternative antiretroviral',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-abacavir-and-hla-b/',
    evidenceSummary: 'HLA-B*57:01 is a near-perfect predictor of abacavir hypersensitivity; screening reduces incidence to near zero',
  },
  {
    gene: 'CYP2B6',
    drug: 'efavirenz',
    rsid: 'rs3745274',
    alleles: ['*1', '*6'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*6': 'Intermediate metabolizer',
      '*6/*6': 'Poor metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard efavirenz 600mg daily',
      'Intermediate metabolizer': 'Standard dose. Monitor for CNS side effects',
      'Poor metabolizer': 'Consider reduced efavirenz dose (400mg) or alternative regimen due to high CNS toxicity risk',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-efavirenz-and-cyp2b6/',
    evidenceSummary: 'CYP2B6*6 poor metabolizers have 3x higher efavirenz plasma levels; increased CNS adverse effects',
  },

  // Psychiatry
  {
    gene: 'CYP2D6',
    drug: 'amitriptyline / nortriptyline',
    rsid: 'rs3892097',
    alleles: ['*1', '*4'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*4': 'Intermediate metabolizer',
      '*4/*4': 'Poor metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard TCA dosing',
      'Intermediate metabolizer': 'Reduce dose 25%. Monitor plasma levels',
      'Poor metabolizer': 'Avoid TCAs or reduce dose 50%. Use alternative (SSRI not metabolized by CYP2D6). Monitor plasma levels',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-tricyclic-antidepressants-and-cyp2d6-and-cyp2c19/',
    evidenceSummary: 'CYP2D6 poor metabolizers accumulate TCAs; increased cardiotoxicity and anticholinergic side effects',
  },
  {
    gene: 'CYP2C19',
    drug: 'amitriptyline',
    rsid: 'rs4244285',
    alleles: ['*1', '*2'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*2': 'Intermediate metabolizer',
      '*2/*2': 'Poor metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard TCA dosing',
      'Intermediate metabolizer': 'Standard dosing. Monitor plasma levels',
      'Poor metabolizer': 'Reduce dose 50%. Monitor plasma levels. Consider alternative',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-tricyclic-antidepressants-and-cyp2d6-and-cyp2c19/',
    evidenceSummary: 'CYP2C19 metabolizes tertiary amines (amitriptyline); poor metabolizers have reduced clearance',
  },
  {
    gene: 'CYP2C19',
    drug: 'citalopram / escitalopram',
    rsid: 'rs4244285',
    alleles: ['*1', '*2'],
    phenotypeMap: {
      '*1/*1': 'Normal metabolizer',
      '*1/*2': 'Intermediate metabolizer',
      '*2/*2': 'Poor metabolizer',
    },
    recommendationMap: {
      'Normal metabolizer': 'Standard SSRI dosing',
      'Intermediate metabolizer': 'Standard dose. Consider 50% reduction if side effects',
      'Poor metabolizer': 'Reduce dose 50% or consider alternative SSRI (sertraline, fluoxetine less CYP2C19-dependent)',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-ssris-and-cyp2d6-and-cyp2c19/',
    evidenceSummary: 'CYP2C19 poor metabolizers have 3x higher citalopram exposure; increased QTc prolongation risk',
  },

  // Other
  {
    gene: 'IFNL3',
    drug: 'peginterferon alfa',
    rsid: 'rs12979860',
    alleles: ['C', 'T'],
    phenotypeMap: {
      'CC': 'Favorable response genotype',
      'CT': 'Intermediate response genotype',
      'TT': 'Unfavorable response genotype',
    },
    recommendationMap: {
      'Favorable response genotype': 'High likelihood of SVR with peginterferon-based therapy',
      'Intermediate response genotype': 'Moderate likelihood of SVR. Consider alternative regimens',
      'Unfavorable response genotype': 'Low likelihood of SVR with peginterferon. Strongly consider direct-acting antiviral alternatives',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/announcement/cpic-guideline-for-peginterferon-alpha-based-regimens/',
    evidenceSummary: 'IFNL3 rs12979860 CC genotype strongly predicts HCV treatment response',
  },
  {
    gene: 'NUDT15',
    drug: 'azathioprine / mercaptopurine / thioguanine',
    rsid: 'rs116855232',
    alleles: ['*1', '*2', '*3'],
    phenotypeMap: {
      '*1/*1': 'Normal activity',
      '*1/*2': 'Intermediate activity',
      '*1/*3': 'Intermediate activity',
      '*2/*2': 'Low activity',
      '*3/*3': 'Low activity',
    },
    recommendationMap: {
      'Normal activity': 'Standard thiopurine dosing',
      'Intermediate activity': 'Reduce dose to 30-80% of standard',
      'Low activity': 'Reduce dose to 10% of standard or use alternative. High risk of myelosuppression',
    },
    cpicLevel: 'A',
    guidelineUrl: 'https://cpicpgx.org/guidelines/cpic-guideline-for-thiopurines-and-tpmt-and-nudt15/',
    evidenceSummary: 'NUDT15 deficiency strongly associated with thiopurine-induced myelosuppression, especially in East Asian populations',
  },
];

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Match user variants against CPIC drug-gene pairs
 */
export function matchCPIC(
  userRsids: Array<{ rsid: string; genotype: string }>
): CPICEnrichmentResult {
  const matches: CPICMatch[] = [];
  let levelA = 0;
  let levelB = 0;

  // Build lookup map
  const pairMap = new Map<string, CPICGeneDrugPair[]>();
  for (const pair of CPIC_LEVEL_A_PAIRS) {
    const existing = pairMap.get(pair.rsid) || [];
    existing.push(pair);
    pairMap.set(pair.rsid, existing);
  }

  for (const userVar of userRsids) {
    const pairs = pairMap.get(userVar.rsid);
    if (!pairs) continue;

    for (const pair of pairs) {
      // Simple phenotype lookup by genotype
      const phenotype = pair.phenotypeMap[userVar.genotype] || 'Unknown phenotype';
      const recommendation = wellnessSafeCPICRecommendation({
        gene: pair.gene,
        drug: pair.drug,
        phenotype,
        cpicLevel: pair.cpicLevel,
      });

      // CPIC Level A = tier 1 (established), Level B = tier 2 (emerging)
      const evidenceTier: 1 | 2 | 3 = pair.cpicLevel === 'A' ? 1 : pair.cpicLevel === 'B' ? 2 : 3;

      matches.push({
        gene: pair.gene,
        drug: pair.drug,
        rsid: pair.rsid,
        userGenotype: userVar.genotype,
        phenotype,
        recommendation,
        cpicLevel: pair.cpicLevel,
        guidelineUrl: pair.guidelineUrl,
        evidenceTier,
      });

      if (pair.cpicLevel === 'A') levelA++;
      else if (pair.cpicLevel === 'B') levelB++;
    }
  }

  return {
    matches,
    totalQueried: userRsids.length,
    totalFound: matches.length,
    levelAMatches: levelA,
    levelBMatches: levelB,
  };
}

/**
 * Generate CPIC alerts for the pipeline
 */
export function generateCPICAlerts(
  cpicResult: CPICEnrichmentResult
): Array<{
  itemName: string;
  tag: string;
  evidence: string;
  action: string;
  gene: string;
  rsid: string;
}> {
  const alerts: Array<{ itemName: string; tag: string; evidence: string; action: string; gene: string; rsid: string }> = [];

  const seen = new Set<string>();

  for (const match of cpicResult.matches) {
    const key = `${match.gene}-${match.drug}-${match.phenotype}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Only generate alerts for non-normal phenotypes
    if (match.phenotype.includes('Normal')) continue;

    const tag = match.cpicLevel === 'A' ? '⚠️ Medical Alert' : 'ℹ️ Dietary Rule';

    alerts.push({
      itemName: match.gene,
      tag,
      evidence: `CPIC Level ${match.cpicLevel}: ${match.phenotype} for ${match.drug} (${match.rsid})`,
      action: `${match.recommendation} [CPIC Level ${match.cpicLevel}]`,
      gene: match.gene,
      rsid: match.rsid,
    });
  }

  return alerts;
}
