import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCatalogEvidence } from './catalog_evidence_resolver.js';
import type { ClinVarAnnotation } from './clinvar_enrichment.js';
import type { CPICMatch } from './cpic_enrichment.js';
import type { PRSScore } from './prs_engine.js';

describe('catalog evidence resolver', () => {
  it('surfaces the hereditary multi-cancer panel for any of the 71 panel genes', () => {
    const clinvar: ClinVarAnnotation[] = [
      {
        rsid: 'rs587780161',
        geneInfo: 'BARD1:580',
        clinicalSignificance: 'Pathogenic',
        diseaseName: 'Hereditary cancer-predisposing syndrome',
        reviewStatus: 'criteria_provided',
        confidenceTier: 'pathogenic_likely_pathogenic',
      },
    ];
    const findings = resolveCatalogEvidence({
      userGenes: new Set(['BARD1']),
      clinvarAnnotations: clinvar,
      cpicMatches: [],
      prsScores: [],
      gwasTraits: undefined,
    });
    const panel = (findings.modalities.hereditary ?? []).find((r) => r.name === 'Hereditary multi-cancer predisposition panel');
    assert.ok(panel, 'multi-cancer panel should be surfaced for BARD1');
    assert.equal(panel!.panel_genes.length, 71);
    assert.equal(panel!.matched_genes.includes('BARD1'), true);
    assert.equal(panel!.clinvar_evidence[0]!.gene, 'BARD1');
  });

  it('marks a monogenic condition as likely_affected when two pathogenic ClinVar variants hit its gene panel', () => {
    const clinvar: ClinVarAnnotation[] = [
      {
        rsid: 'rs1800937',
        geneInfo: 'MSH6:2956',
        clinicalSignificance: 'Pathogenic',
        diseaseName: 'Lynch syndrome',
        reviewStatus: 'criteria_provided',
        confidenceTier: 'pathogenic_likely_pathogenic',
      },
      {
        rsid: 'rs63749893',
        geneInfo: 'MSH6:2956',
        clinicalSignificance: 'Pathogenic',
        diseaseName: 'Hereditary nonpolyposis colorectal neoplasms',
        reviewStatus: 'criteria_provided',
        confidenceTier: 'pathogenic_likely_pathogenic',
      },
    ];
    const findings = resolveCatalogEvidence({
      userGenes: new Set(['MSH6']),
      clinvarAnnotations: clinvar,
      cpicMatches: [],
      prsScores: [],
      gwasTraits: undefined,
    });
    const lynch = (findings.modalities.hereditary ?? []).find((r) => r.name?.toLowerCase().includes('lynch'));
    assert.ok(lynch, 'Lynch syndrome should be surfaced');
    assert.equal(lynch!.monogenic_status, 'likely_affected');
    assert.equal(lynch!.clinvar_evidence.length, 2);
    assert.equal(lynch!.matched_genes.includes('MSH6'), true);
  });

  it('marks a monogenic condition as variant_absent when only benign variants hit', () => {
    const clinvar: ClinVarAnnotation[] = [
      {
        rsid: 'rs6687605',
        geneInfo: 'LDLRAP1:26119',
        clinicalSignificance: 'Benign',
        diseaseName: 'Hypercholesterolemia, familial',
        reviewStatus: 'criteria_provided',
        confidenceTier: 'benign',
      },
    ];
    const findings = resolveCatalogEvidence({
      userGenes: new Set(['LDLRAP1']),
      clinvarAnnotations: clinvar,
      cpicMatches: [],
      prsScores: [],
      gwasTraits: undefined,
    });
    const fh = (findings.modalities.hereditary ?? []).find((r) => r.name?.toLowerCase().includes('familial hypercholesterolemia'));
    if (fh) {
      assert.equal(fh.monogenic_status, 'variant_absent');
      assert.equal(fh.clinvar_evidence.length, 0);
    }
  });

  it('joins CPIC matches to pharmacology catalog entries via gene panel', () => {
    const cpic: CPICMatch[] = [
      {
        gene: 'CYP2D6',
        drug: 'Nortriptyline',
        rsid: 'rs1065852',
        userGenotype: 'AA',
        phenotype: 'Intermediate metabolizer',
        recommendation: 'Consider a 50% dose reduction.',
        cpicLevel: 'A',
        guidelineUrl: 'https://cpicpgx.org/guidelines/',
      },
    ];
    const findings = resolveCatalogEvidence({
      userGenes: new Set(['CYP2D6', 'CYP2C19']),
      clinvarAnnotations: [],
      cpicMatches: cpic,
      prsScores: [],
      gwasTraits: undefined,
    });
    const nortriptyline = (findings.modalities.pharmacology ?? []).find((r) => r.name?.toLowerCase().includes('nortriptyline'));
    assert.ok(nortriptyline, 'Nortriptyline catalog entry should resolve with CPIC evidence');
    assert.equal(nortriptyline!.cpic_evidence.length >= 1, true);
    assert.equal(nortriptyline!.cpic_evidence[0]!.gene, 'CYP2D6');
    assert.match(nortriptyline!.cpic_evidence[0]!.phenotype, /Intermediate metabolizer/);
    assert.doesNotMatch(nortriptyline!.cpic_evidence[0]!.recommendation, /50%|dose reduction/i);
    assert.match(nortriptyline!.cpic_evidence[0]!.recommendation, /prescribing clinician or pharmacist/i);
  });

  it('joins PRS scores to polygenic catalog entries by disease name overlap', () => {
    const prs: PRSScore[] = [
      {
        disease: 'Coronary heart disease',
        score: 0.5,
        riskLabel: 'Lower than average',
        percentile: 11,
        description: 'PGS Catalog',
        variantsScored: 100,
        totalWeightedVariants: 120,
        coveragePct: 83,
        confidence: 'moderate',
        sourceType: 'pgs_catalog_score',
        sourceId: 'PGS004197',
        sourceName: 'PGS Catalog: Coronary Heart Disease',
      },
    ];
    const findings = resolveCatalogEvidence({
      userGenes: new Set(['APOE', 'LDLR']),
      clinvarAnnotations: [],
      cpicMatches: [],
      prsScores: prs,
      gwasTraits: undefined,
    });
    const chd = (findings.modalities['genetic-vulnerability'] ?? []).find((r) => r.name?.toLowerCase().includes('coronary heart disease'));
    assert.ok(chd, 'Coronary heart disease should be surfaced with PRS evidence');
    assert.equal(chd!.prs_evidence.length, 1);
    assert.equal(chd!.prs_evidence[0]!.source_id, 'PGS004197');
    assert.equal(chd!.prs_evidence[0]!.percentile, 11);
  });

  it('returns no condition-driven findings when no user genes match and no evidence is supplied', () => {
    const findings = resolveCatalogEvidence({
      userGenes: new Set(['BOGUS_GENE_XYZ']),
      clinvarAnnotations: [],
      cpicMatches: [],
      prsScores: [],
      gwasTraits: undefined,
    });
    // No genetic-vulnerability / hereditary / personality / wellness hits without panel matches
    assert.equal((findings.modalities['genetic-vulnerability'] ?? []).length, 0);
    assert.equal((findings.modalities['hereditary'] ?? []).length, 0);
    assert.equal((findings.modalities['personality'] ?? []).length, 0);
    assert.equal((findings.modalities['wellness'] ?? []).length, 0);
    // Pharma surfaces drugs whose pharmacogene variant catalog exists (reference layer)
    // and ancestry surfaces the encyclopedia. Both are reference data, not user-specific.
    const pharma = findings.modalities['pharmacology'] ?? [];
    assert.ok(pharma.length > 0, 'pharma surfaces pharmacogene variant inventory as reference');
    for (const p of pharma) {
      assert.equal(p.matched_genes.length, 0, 'no user-gene match');
      assert.ok(p.pharmacogene_variant_evidence.length > 0, 'pharmacogene variant inventory is present');
      for (const v of p.pharmacogene_variant_evidence) {
        assert.equal(v.user_genotype, undefined, 'no user genotype calls');
      }
    }
    const ancestry = findings.modalities['ancestry'] ?? [];
    assert.ok(ancestry.length > 0, 'ancestry surfaces the population encyclopedia as reference');
  });
});
