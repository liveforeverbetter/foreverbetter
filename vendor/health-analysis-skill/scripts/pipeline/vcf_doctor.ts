#!/usr/bin/env npx tsx

import * as fs from 'fs';
import { execFileSync, execSync } from 'child_process';

export interface VcfDoctorReport {
  status: 'pass' | 'warn' | 'fail';
  input: string;
  readable: boolean;
  bgzip_indexed: boolean;
  total_variants: number;
  rsid_variants: number;
  rsid_density: number;
  likely_wgs: boolean;
  warnings: string[];
  recommendation: string;
}

function usage(): never {
  console.error('Usage: npm run doctor:vcf -- /absolute/path/to/input.vcf[.gz] [--json]');
  process.exit(1);
}

function hasTool(tool: string): boolean {
  try {
    execFileSync('which', [tool], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function capture(command: string, timeout = 300000): string {
  return execSync(command, {
    encoding: 'utf8',
    shell: '/bin/bash',
    timeout,
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

function countTotal(vcfPath: string): number {
  if (hasTool('bcftools')) {
    try {
      const indexedCount = capture(`bcftools index -n "${vcfPath}" 2>/dev/null`, 30000);
      const n = Number(indexedCount);
      if (Number.isFinite(n) && n > 0) return n;
    } catch {}
    try {
      return Number(capture(`bcftools view -H "${vcfPath}" | wc -l`));
    } catch {}
  }
  return Number(capture(`zcat -f "${vcfPath}" | awk 'BEGIN{n=0} $0 !~ /^#/ {n++} END{print n}'`));
}

function countRsids(vcfPath: string): number {
  if (hasTool('bcftools')) {
    try {
      return Number(capture(`bcftools query -f '%ID\\n' "${vcfPath}" | awk '$1 ~ /^rs/ {n++} END{print n+0}'`));
    } catch {}
  }
  return Number(capture(`zcat -f "${vcfPath}" | awk -F'\\t' '$0 !~ /^#/ && $3 ~ /^rs/ {n++} END{print n+0}'`));
}

export function runVcfDoctor(vcfPath: string): VcfDoctorReport {
  const warnings: string[] = [];
  if (!fs.existsSync(vcfPath)) {
    return {
      status: 'fail',
      input: vcfPath,
      readable: false,
      bgzip_indexed: false,
      total_variants: 0,
      rsid_variants: 0,
      rsid_density: 0,
      likely_wgs: false,
      warnings: [`File not found: ${vcfPath}`],
      recommendation: 'Provide a readable VCF/VCF.GZ path.',
    };
  }

  const indexed = fs.existsSync(`${vcfPath}.tbi`) || fs.existsSync(`${vcfPath}.csi`);
  if (!indexed && vcfPath.endsWith('.gz')) {
    warnings.push('VCF.GZ is not indexed. The pipeline can still try to read it, but bgzip + tabix indexing is faster and more reliable.');
  }

  const total = countTotal(vcfPath);
  const rsids = countRsids(vcfPath);
  const density = total > 0 ? rsids / total : 0;
  const likelyWgs = total >= 500000;

  if (likelyWgs && density < 0.1) {
    warnings.push('WGS-scale VCF has low rsID density. Run npm run annotate:vcf before generating the dashboard.');
  }
  if (rsids === 0) {
    warnings.push('No rsIDs found in the VCF ID column. Most curated marker, ClinVar, CPIC, PRS, and GWAS lookups will be weak until rsIDs are added.');
  }
  if (likelyWgs && density >= 0.1 && density < 0.5) {
    warnings.push('WGS-scale VCF has partial rsID coverage. Interpretation can run, but rsID-keyed lookups may miss useful variants.');
  }

  const recommendation = warnings.length === 0
    ? 'VCF rsID coverage looks adequate for the default dashboard path.'
    : rsids === 0 || (likelyWgs && density < 0.1)
      ? 'Run `npm run annotate:vcf -- <input.vcf.gz> <output.annotated.vcf.gz>` using the bundled ClinVar rsID subset, or use full dbSNP for broader coverage.'
      : 'Proceed if the limitation is acceptable; full dbSNP annotation gives broader rsID coverage than the bundled ClinVar subset.';

  return {
    status: warnings.length === 0 ? 'pass' : 'warn',
    input: vcfPath,
    readable: true,
    bgzip_indexed: indexed,
    total_variants: total,
    rsid_variants: rsids,
    rsid_density: density,
    likely_wgs: likelyWgs,
    warnings,
    recommendation,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const vcfPath = args.find(arg => !arg.startsWith('--'));
  if (!vcfPath) usage();

  const report = runVcfDoctor(vcfPath);
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`VCF doctor: ${report.input}`);
  console.log(`  Status: ${report.status}`);
  console.log(`  Total variants: ${report.total_variants.toLocaleString()}`);
  console.log(`  rsID variants: ${report.rsid_variants.toLocaleString()}`);
  console.log(`  rsID density: ${(report.rsid_density * 100).toFixed(2)}%`);
  console.log(`  Likely WGS: ${report.likely_wgs ? 'yes' : 'no'}`);
  for (const warning of report.warnings) console.log(`  Warning: ${warning}`);
  console.log(`  Recommendation: ${report.recommendation}`);
}

if (process.argv[1]?.endsWith('vcf_doctor.ts')) {
  main();
}

