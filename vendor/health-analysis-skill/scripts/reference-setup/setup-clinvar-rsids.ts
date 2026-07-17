#!/usr/bin/env npx tsx

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { execFileSync, execSync } from 'child_process';
import {
  CLINVAR_GRCH37_INDEX_URL,
  CLINVAR_GRCH37_MD5_URL,
  CLINVAR_GRCH37_URL,
  CLINVAR_INTERPRETATION_INDEX_GZ,
  CLINVAR_MANIFEST,
  CLINVAR_RSID_ANNOTATION,
  CLINVAR_RSID_ANNOTATION_INDEX,
  ClinVarReferenceManifest,
  getPackageDir,
  getSkillClinVarDir,
} from '../pipeline/clinvar_reference.js';

function parseArgs(argv: string[]): { skipDownload: boolean; keepSource: boolean } {
  return {
    skipDownload: argv.includes('--skip-download'),
    keepSource: argv.includes('--keep-source'),
  };
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        download(response.headers.location, dest).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`Download failed (${response.statusCode}): ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      file.close();
      reject(err);
    });
  });
}

function md5(filePath: string): string {
  const hash = crypto.createHash('md5');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Request failed (${response.statusCode}): ${url}`));
        return;
      }
      let data = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function ensureTools(): void {
  for (const tool of ['bcftools', 'bgzip', 'tabix', 'gzip', 'awk']) {
    try {
      execFileSync('which', [tool], { stdio: 'ignore' });
    } catch {
      throw new Error(`${tool} is required. Install htslib/bcftools before running setup:rsids.`);
    }
  }
}

function run(command: string): void {
  execSync(command, { stdio: 'inherit', shell: '/bin/bash' });
}

function capture(command: string): string {
  return execSync(command, { encoding: 'utf8', shell: '/bin/bash', maxBuffer: 64 * 1024 * 1024 }).trim();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const packageDir = getPackageDir();
  const outDir = getSkillClinVarDir(packageDir);
  fs.mkdirSync(outDir, { recursive: true });
  ensureTools();

  const sourcePath = path.join(outDir, 'clinvar.vcf.gz');
  const sourceIndexPath = `${sourcePath}.tbi`;
  const md5Path = `${sourcePath}.md5`;

  if (!args.skipDownload || !fs.existsSync(sourcePath)) {
    console.log(`Downloading ClinVar GRCh37 VCF to ${sourcePath}`);
    await download(CLINVAR_GRCH37_URL, sourcePath);
    await download(CLINVAR_GRCH37_INDEX_URL, sourceIndexPath);
    const md5Text = await fetchText(CLINVAR_GRCH37_MD5_URL);
    fs.writeFileSync(md5Path, md5Text);
  }

  const expectedMd5 = fs.readFileSync(md5Path, 'utf8').trim().split(/\s+/)[0];
  const actualMd5 = md5(sourcePath);
  if (expectedMd5 !== actualMd5) {
    throw new Error(`ClinVar MD5 mismatch. Expected ${expectedMd5}, got ${actualMd5}.`);
  }
  console.log(`ClinVar MD5 verified: ${actualMd5}`);

  const annotationPath = path.join(outDir, CLINVAR_RSID_ANNOTATION);
  const interpretationPath = path.join(outDir, CLINVAR_INTERPRETATION_INDEX_GZ);

  console.log('Building lean position-to-rsID annotation table...');
  run(
    `bcftools query -f '%CHROM\\t%POS\\t%REF\\t%ALT\\t%INFO/RS\\n' "${sourcePath}" ` +
    `| awk -F'\\t' 'BEGIN{OFS="\\t"} $5 != "." && $5 != "" {rs=$5; gsub(/\\|/, ";rs", rs); gsub(/,/, ";rs", rs); if (rs !~ /^rs/) rs="rs"rs; print $1,$2,$3,$4,rs}' ` +
    `| bgzip -c > "${annotationPath}"`
  );
  run(`tabix -f -s 1 -b 2 -e 2 "${annotationPath}"`);

  console.log('Building compressed ClinVar interpretation index...');
  run(
    `bcftools query -f '%INFO/RS\\t%INFO/CLNSIG\\t%INFO/CLNDN\\t%INFO/GENEINFO\\t%INFO/CLNREVSTAT\\n' "${sourcePath}" ` +
    `| awk -F'\\t' 'BEGIN{OFS="|"} $1 != "." && $1 != "" {for (i=2; i<=5; i++) gsub(/\\|/, ",", $i); n=split($1, ids, /[|,]/); for (j=1; j<=n; j++) if (ids[j] != "") print "rs"ids[j],$2,$3,$4,$5}' ` +
    `| gzip -c > "${interpretationPath}"`
  );

  const annotationRows = Number(capture(`gzip -dc "${annotationPath}" | wc -l`));
  const uniqueRsids = Number(capture(`gzip -dc "${annotationPath}" | cut -f5 | tr ';' '\\n' | sort -u | wc -l`));
  const interpretationRows = Number(capture(`gzip -dc "${interpretationPath}" | wc -l`));
  const malformedRows = Number(capture(`gzip -dc "${interpretationPath}" | awk -F'|' 'NF != 5 {bad++} END{print bad+0}'`));
  if (malformedRows !== 0) {
    throw new Error(`ClinVar interpretation index has ${malformedRows} malformed rows.`);
  }

  const sourceRelease = fs.readFileSync(md5Path, 'utf8').trim().split('/').pop()?.replace(/\s*$/, '') ?? 'clinvar.vcf.gz';
  const manifest: ClinVarReferenceManifest = {
    source: 'NCBI ClinVar',
    genome_build: 'GRCh37',
    source_url: CLINVAR_GRCH37_URL,
    source_md5: actualMd5,
    source_release: sourceRelease,
    generated_at: new Date().toISOString(),
    row_counts: {
      rsid_annotation_rows: annotationRows,
      unique_rsids: uniqueRsids,
      interpretation_rows: interpretationRows,
    },
    files: [
      {
        path: `reference/clinvar/${CLINVAR_RSID_ANNOTATION}`,
        bytes: fs.statSync(annotationPath).size,
        purpose: 'Tabix-indexed GRCh37 CHROM/POS/REF/ALT to ClinVar rsID annotation table for bcftools annotate.',
      },
      {
        path: `reference/clinvar/${CLINVAR_RSID_ANNOTATION_INDEX}`,
        bytes: fs.statSync(`${annotationPath}.tbi`).size,
        purpose: 'Tabix index for the lean ClinVar rsID annotation table.',
      },
      {
        path: `reference/clinvar/${CLINVAR_INTERPRETATION_INDEX_GZ}`,
        bytes: fs.statSync(interpretationPath).size,
        purpose: 'Compressed rsID-keyed ClinVar interpretation index.',
      },
    ],
    disclosure: {
      rsid_source: 'ClinVar GRCh37 rsID subset, generated from INFO/RS in NCBI ClinVar.',
      limitation: 'ClinVar rsID recovery only. This is not full dbSNP annotation and will miss many non-ClinVar rsIDs used by GWAS, PRS, and consumer wellness markers.',
      not_diagnostic: 'ClinVar findings are educational and are not a diagnosis, treatment plan, or clinical decision tool. Confirm clinically before medical action.',
      vus_policy: 'Variants of uncertain significance are shown as uncertain context only and are not used as medical action triggers.',
    },
  };
  fs.writeFileSync(path.join(outDir, CLINVAR_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);

  if (!args.keepSource) {
    for (const filePath of [sourcePath, sourceIndexPath, md5Path]) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }

  console.log(JSON.stringify({
    status: 'pass',
    output_dir: outDir,
    annotation_rows: annotationRows,
    unique_rsids: uniqueRsids,
    interpretation_rows: interpretationRows,
    bundled_bytes: manifest.files.reduce((sum, file) => sum + file.bytes, 0),
  }, null, 2));
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

