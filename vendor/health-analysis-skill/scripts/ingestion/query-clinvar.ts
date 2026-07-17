#!/usr/bin/env npx tsx
/**
 * ClinVar Integration Script
 *
 * Downloads and queries ClinVar VCF for clinical significance data.
 *
 * Usage:
 *   npx tsx scripts/query-clinvar.ts <rsid> [rsid2 rsid3 ...]
 *   npx tsx scripts/query-clinvar.ts --download    # Download ClinVar VCF
 *   npx tsx scripts/query-clinvar.ts --batch <file> # Query batch from file
 *
 * Requires:
 *   - bcftools in PATH
 *   - tabix indexed ClinVar VCF (clinvar_20240303.vcf.gz)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Types
// ============================================================================

interface ClinVarRecord {
  rsid: string;
  pos: number;
  chrom: string;
  clnsig: string;
  geneinfo: string;
  description: string;
}

interface ClinVarResponse {
  found: boolean;
  record?: ClinVarRecord;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const CLINVAR_URL = 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh37/clinvar_20240303.vcf.gz';
const DEFAULT_CLINVAR_PATH = 'reference/clinvar/clinvar_20240303.vcf.gz';

// ============================================================================
// Functions
// ============================================================================

function ensureClinVarDir(): string {
  const dir = path.join(process.cwd(), 'reference', 'clinvar');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getClinVarPath(): string {
  return process.env.CLIVAR_PATH || path.join(process.cwd(), DEFAULT_CLINVAR_PATH);
}

function isClinVarInstalled(): boolean {
  const clinVarPath = getClinVarPath();
  return fs.existsSync(clinVarPath) && fs.existsSync(clinVarPath + '.tbi');
}

function downloadClinVar(): void {
  console.log('📥 Downloading ClinVar VCF...');
  console.log(`   Source: ${CLINVAR_URL}`);
  console.log(`   Destination: ${getClinVarPath()}`);

  const dir = ensureClinVarDir();

  try {
    // Use curl to download with progress
    execSync(`curl -L -o "${getClinVarPath()}" "${CLINVAR_URL}"`, { stdio: 'inherit' });

    // Index with tabix
    console.log('\n📇 Indexing ClinVar VCF...');
    execSync(`bcftools index -t "${getClinVarPath()}"`);

    console.log('\n✅ ClinVar download and indexing complete!');
    console.log(`   File: ${getClinVarPath()}`);
  } catch (error) {
    console.error('❌ Failed to download ClinVar:', error);
    process.exit(1);
  }
}

function queryClinVarSingle(rsid: string): ClinVarResponse {
  const clinVarPath = getClinVarPath();

  if (!isClinVarInstalled()) {
    return {
      found: false,
      error: 'ClinVar not installed. Run with --download first.',
    };
  }

  try {
    // Query bcftools for this rsID
    const output = execSync(
      `bcftools query -r "${rsid}" -f '%POS\\t%ID\\t%INFO/RS\\t%INFO/CLNSIG\\t%INFO/GENEINFO\\n' "${clinVarPath}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    ).trim();

    if (!output) {
      return { found: false };
    }

    const parts = output.split('\t');
    if (parts.length < 5) {
      return { found: false };
    }

    const [pos, id, , clnsig, geneinfo] = parts;

    // Parse position - need to determine chromosome from bcftools
    const regionOutput = execSync(
      `bcftools query -r "${rsid}" -f '%CHROM\\n' "${clinVarPath}"`,
      { encoding: 'utf-8' }
    ).trim();

    const record: ClinVarRecord = {
      rsid: id || rsid,
      pos: parseInt(pos, 10),
      chrom: regionOutput.split('\n')[0] || 'unknown',
      clnsig: clnsig || 'Unknown',
      geneinfo: geneinfo || 'Unknown',
      description: parseClinicalSignificance(clnsig),
    };

    return { found: true, record };
  } catch (error) {
    return { found: false, error: `Query failed: ${error}` };
  }
}

function parseClinicalSignificance(clnsig: string): string {
  if (!clnsig) return 'Unknown significance';

  // CLNSIG values from ClinVar
  const significanceMap: Record<string, string> = {
    '0': 'Unknown',
    '1': 'Uncertain significance',
    '2': 'Likely benign',
    '3': 'Benign',
    '4': 'Likely pathogenic',
    '5': 'Pathogenic',
    '6': 'Drug response',
    '7': 'Association',
    '8': 'Other',
    '9': 'Risk factor',
    '10': 'Affects',
    '11': 'Benign/Likely benign',
    '12': 'Pathogenic/Likely pathogenic',
    '13': 'Uncertain significance (VUS)',
    '14': 'Likely pathogenic',
    '15': 'Pathogenic',
    '255': 'Other',
  };

  // Handle multiple significance values separated by |
  const parts = clnsig.split('|');
  const meanings = parts.map(p => significanceMap[p] || `Significance ${p}`);
  return meanings.join(' | ');
}

function queryBatch(rsids: string[]): Map<string, ClinVarResponse> {
  const results = new Map<string, ClinVarResponse>();

  console.log(`🔍 Querying ${rsids.length} rsIDs against ClinVar...`);

  for (const rsid of rsids) {
    const result = queryClinVarSingle(rsid);
    results.set(rsid, result);

    if (result.found) {
      console.log(`   ✅ ${rsid}: ${result.record?.description}`);
    } else {
      console.log(`   ❌ ${rsid}: Not found in ClinVar`);
    }
  }

  return results;
}

function formatResult(rsid: string, response: ClinVarResponse): string {
  if (!response.found) {
    return `${rsid}: Not found in ClinVar`;
  }

  const record = response.record!;
  return `
${rsid}:
  Position: ${record.chrom}:${record.pos}
  Clinical Significance: ${record.description}
  Gene Info: ${record.geneinfo}
`;
}

// ============================================================================
// Main
// ============================================================================

async function main(argv: string[]) {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
🧬 ClinVar Integration Script

Usage:
  npx tsx scripts/query-clinvar.ts <rsid> [rsid2 ...]   Query single or multiple rsIDs
  npx tsx scripts/query-clinvar.ts --download             Download ClinVar VCF
  npx tsx scripts/query-clinvar.ts --batch <file>         Query batch from file

Environment:
  CLINVAR_PATH    Override default ClinVar VCF path

Examples:
  npx tsx scripts/query-clinvar.ts rs1801133 rs4680
  npx tsx scripts/query-clinvar.ts --download
`);
    process.exit(0);
  }

  if (args.includes('--download')) {
    downloadClinVar();
    return;
  }

  if (args.includes('--batch')) {
    const fileIndex = args.indexOf('--batch') + 1;
    const filePath = args[fileIndex];

    if (!filePath) {
      console.error('❌ Please provide a file path after --batch');
      process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rsids = content.split('\n').map(l => l.trim()).filter(l => l && l.startsWith('rs'));

    const results = queryBatch(rsids);

    console.log('\n📊 Summary:');
    const found = Array.from(results.values()).filter(r => r.found).length;
    console.log(`   Found: ${found}/${rsids.length}`);

    return;
  }

  // Query individual rsIDs
  const rsids = args.filter(arg => !arg.startsWith('-'));

  if (rsids.length === 0) {
    console.error('❌ Please provide at least one rsID to query');
    process.exit(1);
  }

  if (!isClinVarInstalled()) {
    console.log('⚠️  ClinVar not installed.');
    console.log(`   Run: npx tsx scripts/query-clinvar.ts --download`);
    console.log(`   Or set CLINVAR_PATH environment variable\n`);
  }

  const results = queryBatch(rsids);

  console.log('\n' + '='.repeat(50));
  console.log('📊 CLINVAR QUERY RESULTS');
  console.log('='.repeat(50));

  for (const rsid of rsids) {
    const response = results.get(rsid);
    console.log(formatResult(rsid, response!));
  }

  // Save results to JSON
  const outputPath = path.join(process.cwd(), 'clinvar-results.json');
  const output: Record<string, ClinVarRecord | null> = {};

  for (const [rsid, response] of results) {
    output[rsid] = response.found ? response.record! : null;
  }

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
}

main(process.argv).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});