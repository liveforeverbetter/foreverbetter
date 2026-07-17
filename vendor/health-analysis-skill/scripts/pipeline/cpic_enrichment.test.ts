import assert from 'node:assert';
import { describe, it } from 'node:test';
import { generateCPICAlerts, matchCPIC, wellnessSafeCPICRecommendation } from './cpic_enrichment.js';

describe('CPIC wellness boundary', () => {
  it('replaces exact prescribing instructions with clinician-review context', () => {
    const recommendation = wellnessSafeCPICRecommendation({
      gene: 'CYP2C9',
      drug: 'warfarin',
      phenotype: 'Intermediate metabolizer',
      cpicLevel: 'A',
    });
    assert.doesNotMatch(recommendation, /20-30%|starting dose|alternative anticoagulant/i);
    assert.match(recommendation, /Do not start, stop, substitute, or change the dose/i);
    assert.match(recommendation, /prescribing clinician or pharmacist/i);
  });

  it('keeps matched phenotype evidence while suppressing dose changes in matches and alerts', () => {
    const result = matchCPIC([{ rsid: 'rs1799853', genotype: '*1/*2' }]);
    assert.equal(result.matches.length, 1);
    assert.equal(result.matches[0].phenotype, 'Intermediate metabolizer');
    assert.doesNotMatch(result.matches[0].recommendation, /20-30%|Reduce warfarin/i);
    const alerts = generateCPICAlerts(result);
    assert.equal(alerts.length, 1);
    assert.doesNotMatch(alerts[0].action, /20-30%|Reduce warfarin/i);
    assert.match(alerts[0].action, /clinician or pharmacist/i);
  });
});
