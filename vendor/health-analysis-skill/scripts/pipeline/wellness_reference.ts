import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export const WELLNESS_REFERENCE_VERSION = '2026-06-10';

export type InterpretationConfidenceTier =
  | 'curated_marker'
  | 'prs'
  | 'gwas_association'
  | 'pharmacogenomic_guideline'
  | 'functional_prediction'
  | 'pathway_context';

export interface SourceProvenance {
  source_id: string;
  source_name: string;
  source_type: InterpretationConfidenceTier | 'clinvar' | 'pgs_catalog' | 'gwas_catalog';
  source_url?: string;
  release?: string;
  retrieved_at?: string;
  genome_build?: string;
  ancestry?: string;
  limitation?: string;
}

export interface WellnessReferenceManifest {
  version: string;
  generated_at: string;
  sources: SourceProvenance[];
  files: Array<{ path: string; bytes: number; records?: number; sha256?: string }>;
  disclosures: {
    scope: string;
    ancestry: string;
    genome_build: string;
    coverage: string;
    not_diagnostic: string;
  };
  counts?: Record<string, number>;
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, '../..');

function firstExisting(paths: string[]): string | undefined {
  return paths.find(candidate => fs.existsSync(candidate));
}

export function getPackageDir(): string {
  return packageDir;
}

export function getWellnessReferenceDir(): string {
  return path.join(packageDir, 'reference/wellness');
}

export function findWellnessManifest(): string | undefined {
  return firstExisting([
    process.env.WELLNESS_REFERENCE_MANIFEST_PATH ?? '',
    path.join(packageDir, 'reference/wellness/wellness-reference.manifest.json'),
    path.resolve(packageDir, '../../../reference/wellness/wellness-reference.manifest.json'),
  ].filter(Boolean));
}

export function findWellnessPRSWeights(): string | undefined {
  return firstExisting([
    process.env.PGS_WELLNESS_WEIGHTS_PATH ?? '',
    path.join(packageDir, 'reference/wellness/pgs_wellness_weights.json.gz'),
    path.join(packageDir, 'reference/wellness/pgs_wellness_weights.json'),
    path.resolve(packageDir, '../../../reference/wellness/pgs_wellness_weights.json.gz'),
    path.resolve(packageDir, '../../../reference/wellness/pgs_wellness_weights.json'),
  ].filter(Boolean));
}

export function findWellnessGWASAssociations(): string | undefined {
  return firstExisting([
    process.env.GWAS_WELLNESS_ASSOCIATIONS_PATH ?? '',
    path.join(packageDir, 'reference/wellness/gwas_wellness_associations.json.gz'),
    path.join(packageDir, 'reference/wellness/gwas_wellness_associations.json'),
    path.resolve(packageDir, '../../../reference/wellness/gwas_wellness_associations.json.gz'),
    path.resolve(packageDir, '../../../reference/wellness/gwas_wellness_associations.json'),
    path.resolve(packageDir, '../../../reference/gwas/gwas_associations.json.gz'),
  ].filter(Boolean));
}

export function readWellnessManifest(): WellnessReferenceManifest | undefined {
  const manifestPath = findWellnessManifest();
  if (!manifestPath) return undefined;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as WellnessReferenceManifest;
}

export function getDefaultWellnessDisclosures(): WellnessReferenceManifest['disclosures'] {
  return {
    scope: 'PGS Catalog and GWAS Catalog findings are wellness association context, not ClinVar clinical assertions.',
    ancestry: 'PRS and GWAS effects depend on the ancestry distribution of the discovery, training, and evaluation cohorts; interpret scores as directional when ancestry is unknown or mismatched.',
    genome_build: 'Default compact scoring files are harmonized to GRCh37 when available; build mismatches require liftover or matching harmonized scoring files.',
    coverage: 'PGS confidence depends on how many configured score variants are observed in the user VCF.',
    not_diagnostic: 'These associations are not diagnostic and should be interpreted with biomarkers, clinical history, and clinician guidance.',
  };
}

