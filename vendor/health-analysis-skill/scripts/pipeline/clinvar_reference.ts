import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const CLINVAR_GRCH37_URL = 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh37/clinvar.vcf.gz';
export const CLINVAR_GRCH37_INDEX_URL = `${CLINVAR_GRCH37_URL}.tbi`;
export const CLINVAR_GRCH37_MD5_URL = `${CLINVAR_GRCH37_URL}.md5`;

export const CLINVAR_RSID_ANNOTATION = 'clinvar_rsid_annotation.tsv.gz';
export const CLINVAR_RSID_ANNOTATION_INDEX = 'clinvar_rsid_annotation.tsv.gz.tbi';
export const CLINVAR_INTERPRETATION_INDEX_GZ = 'clinvar_index.txt.gz';
export const CLINVAR_INTERPRETATION_INDEX_TXT = 'clinvar_index.txt';
export const CLINVAR_MANIFEST = 'clinvar-rsid-reference.manifest.json';

export interface ClinVarReferenceManifest {
  source: 'NCBI ClinVar';
  genome_build: 'GRCh37';
  source_url: string;
  source_md5: string;
  source_release: string;
  generated_at: string;
  row_counts: {
    rsid_annotation_rows: number;
    unique_rsids: number;
    interpretation_rows: number;
  };
  files: Array<{
    path: string;
    bytes: number;
    purpose: string;
  }>;
  disclosure: {
    rsid_source: string;
    limitation: string;
    not_diagnostic: string;
    vus_policy: string;
  };
}

export function getPackageDir(): string {
  return path.resolve(__dirname, '../..');
}

export function getSkillClinVarDir(packageDir = getPackageDir()): string {
  return path.join(packageDir, 'reference', 'clinvar');
}

export function getRepoRootClinVarDir(packageDir = getPackageDir()): string {
  return path.resolve(packageDir, '..', '..', 'reference', 'clinvar');
}

function existingFile(filePath: string): string | undefined {
  return fs.existsSync(filePath) ? filePath : undefined;
}

export function findClinVarAnnotationReference(packageDir = getPackageDir()): string | undefined {
  const envPath = process.env.CLINVAR_RSID_ANNOTATION_PATH;
  if (envPath && fs.existsSync(envPath) && fs.existsSync(`${envPath}.tbi`)) return envPath;

  const skillDir = getSkillClinVarDir(packageDir);
  const repoDir = getRepoRootClinVarDir(packageDir);
  return (
    existingFile(path.join(skillDir, CLINVAR_RSID_ANNOTATION)) ??
    existingFile(path.join(repoDir, CLINVAR_RSID_ANNOTATION)) ??
    existingFile(path.join(repoDir, 'clinvar_rsid_annotation.current.tsv.gz'))
  );
}

export function findClinVarInterpretationIndex(packageDir = getPackageDir()): string | undefined {
  const envPath = process.env.CLINVAR_INDEX_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const skillDir = getSkillClinVarDir(packageDir);
  const repoDir = getRepoRootClinVarDir(packageDir);
  return (
    existingFile(path.join(skillDir, CLINVAR_INTERPRETATION_INDEX_TXT)) ??
    existingFile(path.join(skillDir, CLINVAR_INTERPRETATION_INDEX_GZ)) ??
    existingFile(path.join(repoDir, CLINVAR_INTERPRETATION_INDEX_TXT)) ??
    existingFile(path.join(repoDir, CLINVAR_INTERPRETATION_INDEX_GZ)) ??
    existingFile(path.join(repoDir, 'clinvar_index.current.txt')) ??
    existingFile(path.join(repoDir, 'clinvar_index.current.txt.gz'))
  );
}

export function readClinVarReferenceManifest(packageDir = getPackageDir()): ClinVarReferenceManifest | undefined {
  const manifestPath = path.join(getSkillClinVarDir(packageDir), CLINVAR_MANIFEST);
  if (!fs.existsSync(manifestPath)) return undefined;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ClinVarReferenceManifest;
}

export function getClinVarDisclosure(packageDir = getPackageDir()): ClinVarReferenceManifest['disclosure'] {
  return readClinVarReferenceManifest(packageDir)?.disclosure ?? {
    rsid_source: 'ClinVar-derived rsID subset',
    limitation: 'ClinVar rsID recovery only; this is not full dbSNP annotation and misses many non-ClinVar rsIDs.',
    not_diagnostic: 'ClinVar findings are educational and require clinical confirmation before medical action.',
    vus_policy: 'Variants of uncertain significance are not used as medical action triggers.',
  };
}

export function requireClinVarAnnotationReference(packageDir = getPackageDir()): string {
  const refPath = findClinVarAnnotationReference(packageDir);
  if (!refPath) {
    throw new Error(
      'ClinVar rsID annotation reference not found. Run `npm run setup:rsids`, or provide CLINVAR_RSID_ANNOTATION_PATH.'
    );
  }
  if (!fs.existsSync(`${refPath}.tbi`)) {
    throw new Error(`ClinVar rsID annotation index missing: ${refPath}.tbi`);
  }
  return refPath;
}

