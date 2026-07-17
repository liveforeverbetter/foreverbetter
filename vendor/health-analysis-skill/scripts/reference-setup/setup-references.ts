#!/usr/bin/env npx tsx
/**
 * Optional reference setup planner/downloader.
 *
 * Default mode is a dry-run plan. Large/updateable references stay outside the
 * committed package and are written only to ignored local reference paths.
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { fileURLToPath } from 'url';

type ReferenceGroup = 'clinvar' | 'dbsnp' | 'vep' | 'callers' | 'giab';
type SetupMode = 'plan' | 'download';

interface ExternalTruthset {
  id: string;
  source_name: string;
  source_url: string;
  truth_vcf?: string;
  truth_vcf_url?: string;
  truth_vcf_index?: string;
  truth_vcf_index_url?: string;
  confident_regions?: string;
  confident_regions_url?: string;
}

interface TruthsetConfig {
  external_truthsets?: ExternalTruthset[];
}

interface ReferenceArtifact {
  id: string;
  group: ReferenceGroup;
  label: string;
  url?: string;
  output_path?: string;
  present: boolean;
  downloadable: boolean;
  notes: string[];
  remote_status?: number;
  remote_size_bytes?: number;
  remote_size_mb?: number;
  download_allowed?: boolean;
  download_reason?: string;
}

interface CommandPlan {
  id: string;
  group: ReferenceGroup;
  description: string;
  commands: string[];
}

interface SetupReport {
  generated_at: string;
  mode: SetupMode;
  package_dir: string;
  repo_root: string;
  plan_output: string;
  shell_plan_output: string;
  included_groups: ReferenceGroup[];
  artifacts: ReferenceArtifact[];
  command_plans: CommandPlan[];
  summary: {
    artifacts: number;
    present_artifacts: number;
    downloadable_artifacts: number;
    missing_downloadable_artifacts: number;
    remote_checked_artifacts: number;
    download_allowed_artifacts: number;
    download_blocked_artifacts: number;
    downloaded_artifacts: number;
  };
}

const ALL_GROUPS: ReferenceGroup[] = ['clinvar', 'dbsnp', 'vep', 'callers', 'giab'];

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function argValue(flag: string): string | undefined {
  const direct = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (direct) return direct.split('=').slice(1).join('=');
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function numericArg(flag: string, fallback: number): number {
  const value = argValue(flag);
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function parseGroups(): ReferenceGroup[] {
  const only = argValue('--only') ?? argValue('--groups');
  if (!only) return ALL_GROUPS;
  const selected = only.split(',').map(part => part.trim()).filter(Boolean);
  const invalid = selected.filter(group => !ALL_GROUPS.includes(group as ReferenceGroup));
  if (invalid.length > 0) {
    throw new Error(`Unknown reference group(s): ${invalid.join(', ')}. Valid groups: ${ALL_GROUPS.join(', ')}`);
  }
  return selected as ReferenceGroup[];
}

function resolvePackageDir(): string {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDir, '../..');
}

function artifact(params: Omit<ReferenceArtifact, 'present' | 'downloadable'> & { downloadable?: boolean }): ReferenceArtifact {
  const present = params.output_path ? fs.existsSync(params.output_path) : false;
  return {
    ...params,
    present,
    downloadable: Boolean(params.downloadable ?? params.url),
  };
}

function buildClinVarArtifacts(repoRoot: string): ReferenceArtifact[] {
  const clinvarDir = path.join(repoRoot, 'reference/clinvar');
  return [
    artifact({
      id: 'clinvar-grch38-vcf',
      group: 'clinvar',
      label: 'ClinVar GRCh38 VCF',
      url: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/clinvar.vcf.gz',
      output_path: path.join(clinvarDir, 'clinvar.vcf.gz'),
      notes: ['Optional clinical-significance enrichment input.', 'Ignored by .gitignore under reference/clinvar/.'],
    }),
    artifact({
      id: 'clinvar-grch38-vcf-index',
      group: 'clinvar',
      label: 'ClinVar GRCh38 VCF tabix index',
      url: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/vcf_GRCh38/clinvar.vcf.gz.tbi',
      output_path: path.join(clinvarDir, 'clinvar.vcf.gz.tbi'),
      notes: ['Index for local tabix/bcftools queries.', 'Can also be regenerated with tabix if needed.'],
    }),
  ];
}

function buildDbSnpArtifacts(repoRoot: string): ReferenceArtifact[] {
  const dbSnpDir = path.join(repoRoot, 'reference/dbsnp');
  return [
    artifact({
      id: 'dbsnp-grch37-vcf',
      group: 'dbsnp',
      label: 'dbSNP GRCh37 VCF',
      url: 'https://ftp.ncbi.nlm.nih.gov/snp/latest_release/VCF/GCF_000001405.25.gz',
      output_path: path.join(dbSnpDir, 'GCF_000001405.25.gz'),
      notes: ['Optional full rsID annotation reference for hg19/GRCh37 provider VCFs.', 'Large archive; use --only=dbsnp with explicit download guards.'],
    }),
    artifact({
      id: 'dbsnp-grch37-vcf-index',
      group: 'dbsnp',
      label: 'dbSNP GRCh37 VCF tabix index',
      url: 'https://ftp.ncbi.nlm.nih.gov/snp/latest_release/VCF/GCF_000001405.25.gz.tbi',
      output_path: path.join(dbSnpDir, 'GCF_000001405.25.gz.tbi'),
      notes: ['Index for GRCh37 rsID annotation.', 'Ignored by .gitignore under reference/dbsnp/.'],
    }),
    artifact({
      id: 'dbsnp-grch38-vcf',
      group: 'dbsnp',
      label: 'dbSNP GRCh38 VCF',
      url: 'https://ftp.ncbi.nlm.nih.gov/snp/latest_release/VCF/GCF_000001405.40.gz',
      output_path: path.join(dbSnpDir, 'GCF_000001405.40.gz'),
      notes: ['Optional full rsID annotation reference.', 'Large archive; use --only=dbsnp with an explicit --max-mb or --force when intended.'],
    }),
    artifact({
      id: 'dbsnp-grch38-vcf-index',
      group: 'dbsnp',
      label: 'dbSNP GRCh38 VCF tabix index',
      url: 'https://ftp.ncbi.nlm.nih.gov/snp/latest_release/VCF/GCF_000001405.40.gz.tbi',
      output_path: path.join(dbSnpDir, 'GCF_000001405.40.gz.tbi'),
      notes: ['Index for GRCh38 rsID annotation.', 'Ignored by .gitignore under reference/dbsnp/.'],
    }),
  ];
}

function buildGiabArtifacts(packageDir: string, repoRoot: string): ReferenceArtifact[] {
  const truthsetPath = path.join(packageDir, 'references/wgs-validation-truthsets.json');
  if (!fs.existsSync(truthsetPath)) return [];
  const config = readJson<TruthsetConfig>(truthsetPath);
  return (config.external_truthsets ?? []).flatMap(truthset => {
    const candidates: Array<{ suffix: string; label: string; configured?: string; url?: string }> = [
      { suffix: 'truth-vcf', label: `${truthset.id} truth VCF`, configured: truthset.truth_vcf, url: truthset.truth_vcf_url },
      { suffix: 'truth-vcf-index', label: `${truthset.id} truth VCF index`, configured: truthset.truth_vcf_index ?? (truthset.truth_vcf ? `${truthset.truth_vcf}.tbi` : undefined), url: truthset.truth_vcf_index_url ?? (truthset.truth_vcf_url ? `${truthset.truth_vcf_url}.tbi` : undefined) },
      { suffix: 'confident-regions', label: `${truthset.id} confident regions`, configured: truthset.confident_regions, url: truthset.confident_regions_url },
    ];
    return candidates
      .filter(candidate => candidate.configured && candidate.url)
      .map(candidate => {
        const configured = candidate.configured as string;
        const outputPath = path.isAbsolute(configured)
          ? configured
          : path.resolve(path.dirname(truthsetPath), configured);
        const safeOutputPath = outputPath.includes(`${path.sep}external-truthsets${path.sep}`)
          ? outputPath
          : path.join(repoRoot, 'external-truthsets/giab', path.basename(outputPath));
        return artifact({
          id: `giab-${truthset.id}-${candidate.suffix}`,
          group: 'giab',
          label: `${candidate.label} from ${truthset.source_name}`,
          url: candidate.url,
          output_path: safeOutputPath,
          notes: ['Advanced validation artifact only.', 'Ignored by .gitignore under external-truthsets/.'],
        });
      });
  });
}

function buildCommandPlans(repoRoot: string): CommandPlan[] {
  const referenceRoot = path.join(repoRoot, 'reference');
  const externalRoot = path.join(repoRoot, 'external-truthsets');
  const vepCache = path.join(referenceRoot, 'vep/cache');
  const callerWork = path.join(externalRoot, 'giab/query-vcfs');
  return [
    {
      id: 'clinvar-postprocess',
      group: 'clinvar',
      description: 'Index or rebuild local ClinVar query helpers after download.',
      commands: [
        `mkdir -p ${shellQuote(path.join(referenceRoot, 'clinvar'))}`,
        `test -f ${shellQuote(path.join(referenceRoot, 'clinvar/clinvar.vcf.gz.tbi'))} || tabix -p vcf ${shellQuote(path.join(referenceRoot, 'clinvar/clinvar.vcf.gz'))}`,
        'npm run interpretation:depth',
      ],
    },
    {
      id: 'dbsnp-postprocess',
      group: 'dbsnp',
      description: 'Index dbSNP and use it for rsID annotation when provider VCFs lack IDs.',
      commands: [
        `mkdir -p ${shellQuote(path.join(referenceRoot, 'dbsnp'))}`,
        `bcftools index ${shellQuote(path.join(referenceRoot, 'dbsnp/GCF_000001405.25.gz'))}`,
        `bcftools index ${shellQuote(path.join(referenceRoot, 'dbsnp/GCF_000001405.40.gz'))}`,
        `bcftools annotate --annotations ${shellQuote(path.join(referenceRoot, 'dbsnp/GCF_000001405.25.gz'))} --columns ID --output annotated.grch37.vcf.gz --output-type z input.grch37.vcf.gz`,
        `bcftools annotate --annotations ${shellQuote(path.join(referenceRoot, 'dbsnp/GCF_000001405.40.gz'))} --columns ID --output annotated.vcf.gz --output-type z input.vcf.gz`,
      ],
    },
    {
      id: 'vep-cache',
      group: 'vep',
      description: 'Install or refresh the optional Ensembl VEP offline cache.',
      commands: [
        `mkdir -p ${shellQuote(vepCache)}`,
        `vep_install -a cf -s homo_sapiens -y GRCh38 -c ${shellQuote(vepCache)}`,
        `vep --cache --offline --dir_cache ${shellQuote(vepCache)} --species homo_sapiens --assembly GRCh38 --everything --vcf -i input.vcf.gz -o output.vep.vcf`,
      ],
    },
    {
      id: 'caller-tools',
      group: 'callers',
      description: 'Check optional raw-read caller and postprocess tools; these are not needed for normal VCF-first dashboard generation.',
      commands: [
        'which bcftools bgzip tabix samtools || true',
        'docker --version || true',
        'gatk --version || true',
        'deepvariant --version || true',
        'ExpansionHunter --version || true',
        'truvari --version || true',
        'hap.py --version || true',
      ],
    },
    {
      id: 'giab-validation',
      group: 'giab',
      description: 'Prepare ignored GIAB truth/query locations and print validation preflight commands.',
      commands: [
        `mkdir -p ${shellQuote(path.join(externalRoot, 'giab'))} ${shellQuote(callerWork)}`,
        'npm run wgs:truthsets',
        'npm run wgs:truthsets -- --check-remote',
        'npm run wgs:query-readiness',
        'npm run wgs:external-validation',
      ],
    },
  ];
}

function requestHead(url: string, redirects = 0): Promise<{ status?: number; sizeBytes?: number }> {
  const client = url.startsWith('https://') ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.request(url, { method: 'HEAD' }, response => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirects < 5) {
        response.resume();
        requestHead(response.headers.location, redirects + 1).then(resolve, reject);
        return;
      }
      const contentLength = response.headers['content-length'];
      const sizeBytes = typeof contentLength === 'string' ? Number(contentLength) : undefined;
      response.resume();
      resolve({
        status: response.statusCode,
        sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : undefined,
      });
    });
    request.on('error', reject);
    request.end();
  });
}

async function attachRemotePolicy(artifacts: ReferenceArtifact[], maxBytes: number, force: boolean): Promise<ReferenceArtifact[]> {
  return Promise.all(artifacts.map(async item => {
    if (!item.url || item.present || !item.downloadable) return item;
    try {
      const remote = await requestHead(item.url);
      const remoteSizeMb = remote.sizeBytes == null ? undefined : Math.round((remote.sizeBytes / 1024 / 1024) * 10) / 10;
      if (force) {
        return { ...item, remote_status: remote.status, remote_size_bytes: remote.sizeBytes, remote_size_mb: remoteSizeMb, download_allowed: true, download_reason: 'Forced download requested.' };
      }
      if (remote.sizeBytes == null) {
        return { ...item, remote_status: remote.status, download_allowed: false, download_reason: 'Remote size unknown; rerun with --force to download anyway.' };
      }
      if (remote.sizeBytes > maxBytes) {
        return {
          ...item,
          remote_status: remote.status,
          remote_size_bytes: remote.sizeBytes,
          remote_size_mb: remoteSizeMb,
          download_allowed: false,
          download_reason: `Remote artifact is ${remoteSizeMb} MB, above max ${Math.round((maxBytes / 1024 / 1024) * 10) / 10} MB.`,
        };
      }
      return {
        ...item,
        remote_status: remote.status,
        remote_size_bytes: remote.sizeBytes,
        remote_size_mb: remoteSizeMb,
        download_allowed: true,
        download_reason: 'Remote artifact is within the configured download size limit.',
      };
    } catch (error) {
      return { ...item, download_allowed: false, download_reason: `Remote check failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }));
}

function downloadFile(url: string, outputPath: string): Promise<void> {
  const client = url.startsWith('https://') ? https : http;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  return new Promise((resolve, reject) => {
    const request = client.get(url, response => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        downloadFile(response.headers.location, outputPath).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed ${response.statusCode}: ${url}`));
        return;
      }
      const file = fs.createWriteStream(outputPath);
      response.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
      file.on('error', reject);
    });
    request.on('error', reject);
  });
}

async function downloadAllowedArtifacts(artifacts: ReferenceArtifact[]): Promise<number> {
  let downloaded = 0;
  for (const item of artifacts) {
    if (!item.url || !item.output_path || item.present || item.download_allowed !== true) continue;
    await downloadFile(item.url, item.output_path);
    downloaded += 1;
  }
  return downloaded;
}

function renderShellPlan(commandPlans: CommandPlan[], groups: ReferenceGroup[]): string {
  const selected = commandPlans.filter(plan => groups.includes(plan.group));
  const lines = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    'case "${1:-print-plan}" in',
    '  print-plan)',
  ];
  for (const plan of selected) {
    lines.push(`    echo ${shellQuote(`# ${plan.id}: ${plan.description}`)}`);
    for (const command of plan.commands) {
      lines.push(`    echo ${shellQuote(command)}`);
    }
    lines.push("    echo ''");
  }
  lines.push('    ;;');
  for (const plan of selected) {
    lines.push(`  ${plan.id})`);
    for (const command of plan.commands) {
      lines.push(`    ${command}`);
    }
    lines.push('    ;;');
  }
  lines.push('  *)');
  lines.push('    echo "Usage: $0 print-plan|' + selected.map(plan => plan.id).join('|') + '" >&2');
  lines.push('    exit 2');
  lines.push('    ;;');
  lines.push('esac');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function summarize(artifacts: ReferenceArtifact[], downloaded: number): SetupReport['summary'] {
  const remoteChecked = artifacts.filter(item => item.remote_status != null || item.download_reason?.startsWith('Remote check failed')).length;
  return {
    artifacts: artifacts.length,
    present_artifacts: artifacts.filter(item => item.present).length,
    downloadable_artifacts: artifacts.filter(item => item.downloadable).length,
    missing_downloadable_artifacts: artifacts.filter(item => item.downloadable && !item.present).length,
    remote_checked_artifacts: remoteChecked,
    download_allowed_artifacts: artifacts.filter(item => item.download_allowed === true).length,
    download_blocked_artifacts: artifacts.filter(item => item.download_allowed === false).length,
    downloaded_artifacts: downloaded,
  };
}

async function main(): Promise<void> {
  const packageDir = resolvePackageDir();
  const repoRoot = path.resolve(packageDir, '../..');
  const includedGroups = parseGroups();
  const mode: SetupMode = hasFlag('--download') ? 'download' : 'plan';
  const outPath = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/reference-setup-plan.json'));
  const shellPlanPath = path.resolve(argValue('--shell-plan') ?? path.join(packageDir, 'output/reference-setup-plan.sh'));
  const maxDownloadMb = numericArg('--max-mb', 5120);
  const maxBytes = maxDownloadMb * 1024 * 1024;
  const force = hasFlag('--force');
  const checkRemote = hasFlag('--check-remote') || mode === 'download';

  const allArtifacts = [
    ...buildClinVarArtifacts(repoRoot),
    ...buildDbSnpArtifacts(repoRoot),
    ...buildGiabArtifacts(packageDir, repoRoot),
  ].filter(item => includedGroups.includes(item.group));
  const commandPlans = buildCommandPlans(repoRoot).filter(plan => includedGroups.includes(plan.group));

  let artifacts = allArtifacts;
  if (checkRemote) {
    artifacts = await attachRemotePolicy(artifacts, maxBytes, force);
  }

  const downloaded = mode === 'download' ? await downloadAllowedArtifacts(artifacts) : 0;
  if (downloaded > 0) {
    artifacts = [
      ...buildClinVarArtifacts(repoRoot),
      ...buildDbSnpArtifacts(repoRoot),
      ...buildGiabArtifacts(packageDir, repoRoot),
    ].filter(item => includedGroups.includes(item.group));
    if (checkRemote) {
      artifacts = await attachRemotePolicy(artifacts, maxBytes, force);
    }
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.mkdirSync(path.dirname(shellPlanPath), { recursive: true });
  fs.writeFileSync(shellPlanPath, renderShellPlan(commandPlans, includedGroups), { encoding: 'utf8', mode: 0o755 });

  const report: SetupReport = {
    generated_at: new Date().toISOString(),
    mode,
    package_dir: packageDir,
    repo_root: repoRoot,
    plan_output: outPath,
    shell_plan_output: shellPlanPath,
    included_groups: includedGroups,
    artifacts,
    command_plans: commandPlans,
    summary: summarize(artifacts, downloaded),
  };
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    status: mode === 'download' ? 'download_checked' : 'plan_written',
    output: outPath,
    shell_plan: shellPlanPath,
    included_groups: includedGroups,
    max_download_mb: checkRemote ? maxDownloadMb : undefined,
    force: checkRemote ? force : undefined,
    summary: report.summary,
    next: [
      `Review ${outPath}`,
      `Print command plan with: ${shellPlanPath} print-plan`,
      'Use --download with --only=clinvar,dbsnp,giab when you explicitly want local reference downloads.',
    ],
  }, null, 2));
}

if (process.argv[1]?.endsWith('setup-references.ts')) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
