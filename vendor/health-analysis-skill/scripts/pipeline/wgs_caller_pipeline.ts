#!/usr/bin/env npx tsx
/**
 * WGS caller orchestration manifest.
 *
 * Production WGS interpretation starts from FASTQ/BAM/CRAM and requires
 * external validated callers. This script records the expected caller layer
 * and detects whether the local environment can run it. It does not fabricate
 * calls when tools are absent.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

export interface CallerStep {
  id: string;
  variant_class: string;
  tool: string;
  required_input: string[];
  expected_output: string;
  command_template: string;
  container_image?: string;
  availability_checks: string[];
  available: boolean;
  missing_requirements: string[];
}

function argValue(flag: string): string | undefined {
  const direct = process.argv.find(arg => arg.startsWith(`${flag}=`));
  if (direct) return direct.split('=').slice(1).join('=');
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasCommand(command: string): boolean {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function hasDockerImage(image: string): boolean {
  if (process.env.WGS_DOCKER_CHECK !== '1') return false;
  if (!hasCommand('docker')) return false;
  try {
    execFileSync('docker', ['image', 'inspect', image], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function envPathExists(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && fs.existsSync(value));
}

function callerAvailable(checks: Array<{ label: string; ok: boolean }>): { available: boolean; missing: string[] } {
  const missing = checks.filter(check => !check.ok).map(check => check.label);
  return { available: missing.length === 0, missing };
}

export interface WgsCallerManifest {
  generated_at: string;
  default_input_model: {
    expected_inputs: string[];
    raw_read_callers_required_for_default: boolean;
    raw_read_callers_required_when: string[];
    local_default_assessment: 'repo_contained_vcf_interpretation' | 'raw_read_calling_required';
  };
  input_path: string;
  reference_path: string;
  caller_steps: CallerStep[];
  limitations: string[];
}

export function buildWgsCallerManifest(inputPath = '<sample.bam|sample.cram>', referencePath = '<reference.fa>'): WgsCallerManifest {
  const manta = callerAvailable([{ label: 'configManta.py command', ok: hasCommand('configManta.py') }]);
  const gatkHaplotypeCaller = callerAvailable([{ label: 'gatk command', ok: hasCommand('gatk') }]);
  const gatkGcnv = callerAvailable([{ label: 'gatk command', ok: hasCommand('gatk') }]);
  const gatkSv = callerAvailable([
    { label: 'cromwell command', ok: hasCommand('cromwell') },
    { label: 'GATK_SV_WDL_DIR path', ok: envPathExists('GATK_SV_WDL_DIR') },
  ]);
  const expansionHunter = callerAvailable([{ label: 'ExpansionHunter command', ok: hasCommand('ExpansionHunter') }]);
  const vep = callerAvailable([{ label: 'vep command', ok: hasCommand('vep') }]);

  const steps: CallerStep[] = [
    {
      id: 'gatk_haplotypecaller_small_variants',
      variant_class: 'rare_small_variants',
      tool: 'GATK HaplotypeCaller',
      required_input: ['BAM', 'CRAM', 'reference FASTA'],
      expected_output: 'small-variants.vcf.gz',
      command_template: `gatk HaplotypeCaller -R ${referencePath} -I ${inputPath} -O small-variants.g.vcf.gz && gatk GenotypeGVCFs -R ${referencePath} -V small-variants.g.vcf.gz -O small-variants.vcf.gz`,
      container_image: 'broadinstitute/gatk:latest',
      availability_checks: ['gatk command'],
      available: gatkHaplotypeCaller.available || hasDockerImage('broadinstitute/gatk:latest'),
      missing_requirements: gatkHaplotypeCaller.available ? [] : gatkHaplotypeCaller.missing,
    },
    {
      id: 'manta_sv_large_indel',
      variant_class: 'large_indels,rearrangements',
      tool: 'Manta',
      required_input: ['BAM', 'CRAM', 'reference FASTA'],
      expected_output: 'diploidSV.vcf.gz',
      command_template: `configManta.py --bam ${inputPath} --referenceFasta ${referencePath} --runDir manta && manta/runWorkflow.py`,
      container_image: 'quay.io/biocontainers/manta:1.6.0--h9ee0642_2',
      availability_checks: ['configManta.py command'],
      available: manta.available || hasDockerImage('quay.io/biocontainers/manta:1.6.0--h9ee0642_2'),
      missing_requirements: manta.available ? [] : manta.missing,
    },
    {
      id: 'gatk_gcnv',
      variant_class: 'copy_number_variants',
      tool: 'GATK GermlineCNVCaller',
      required_input: ['BAM', 'CRAM', 'reference FASTA', 'read-count intervals', 'trained cohort model for best performance'],
      expected_output: 'genotyped_segments.vcf.gz',
      command_template: `gatk CollectReadCounts -I ${inputPath} -R ${referencePath} ... && gatk GermlineCNVCaller ...`,
      container_image: 'broadinstitute/gatk:latest',
      availability_checks: ['gatk command'],
      available: gatkGcnv.available || hasDockerImage('broadinstitute/gatk:latest'),
      missing_requirements: gatkGcnv.available ? [] : gatkGcnv.missing,
    },
    {
      id: 'gatk_sv_ensemble',
      variant_class: 'copy_number_variants,large_indels,rearrangements',
      tool: 'GATK-SV',
      required_input: ['BAM', 'CRAM', 'reference FASTA', 'WDL/Cromwell or Terra-compatible runtime'],
      expected_output: 'GATK-SV sites and genotypes VCFs',
      command_template: 'Run GATK-SV WDL modules: GatherSampleEvidence, ClusterBatch, GenotypeBatch, FilterBatch, AnnotateVcf.',
      container_image: 'gatk-sv runtime image plus local WDL checkout',
      availability_checks: ['cromwell command', 'GATK_SV_WDL_DIR path'],
      available: gatkSv.available,
      missing_requirements: gatkSv.missing,
    },
    {
      id: 'expansionhunter_repeats',
      variant_class: 'tandem_repeats',
      tool: 'ExpansionHunter',
      required_input: ['BAM', 'CRAM', 'reference FASTA', 'repeat-specification catalog'],
      expected_output: 'repeat expansion VCF/JSON',
      command_template: `ExpansionHunter --reads ${inputPath} --reference ${referencePath} --variant-catalog repeat-catalog.json --output-prefix sample`,
      container_image: 'quay.io/biocontainers/expansionhunter:5.0.0--h9ee0642_0',
      availability_checks: ['ExpansionHunter command'],
      available: expansionHunter.available || hasDockerImage('quay.io/biocontainers/expansionhunter:5.0.0--h9ee0642_0'),
      missing_requirements: expansionHunter.available ? [] : expansionHunter.missing,
    },
    {
      id: 'vep_rare_small_variants',
      variant_class: 'rare_small_variants',
      tool: 'Ensembl VEP',
      required_input: ['small variant VCF', 'VEP cache'],
      expected_output: 'VEP consequence TSV/VCF',
      command_template: 'vep --cache --offline --everything --vcf -i small-variants.vcf.gz -o small-variants.vep.vcf',
      container_image: 'ensemblorg/ensembl-vep:release_112.0',
      availability_checks: ['vep command'],
      available: vep.available || hasDockerImage('ensemblorg/ensembl-vep:release_112.0'),
      missing_requirements: vep.available ? [] : vep.missing,
    },
  ];

  return {
    generated_at: new Date().toISOString(),
    default_input_model: {
      expected_inputs: ['WGS VCF/VCF.GZ', '23andMe/Ancestry SNP-array export or converted VCF'],
      raw_read_callers_required_for_default: false,
      raw_read_callers_required_when: [
        'the user provides FASTQ/BAM/CRAM instead of VCF',
        'the provided VCF omits CNV/SV/repeat classes that the report needs to interpret',
        'the pipeline is externally validated by regenerating query VCFs from benchmark reads'
      ],
      local_default_assessment: 'repo_contained_vcf_interpretation',
    },
    input_path: inputPath,
    reference_path: referencePath,
    caller_steps: steps,
    limitations: [
      'Tool availability is not equivalent to validated clinical performance.',
      'GATK-SV/gCNV need cohort models, intervals, and runtime configuration before production use.',
      'Docker being installed is not treated as caller availability unless the required image is present locally.',
      'Long-read WGS would require a separate SV/repeat strategy.',
      'For the default VCF-first product path, raw-read callers are not required; they are optional escalation when only reads are available or vendor VCFs are missing needed variant classes.'
    ],
  };
}

function main(): void {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const packageDir = path.resolve(scriptDir, '../..');
  const input = argValue('--input') ?? '<sample.bam|sample.cram>';
  const reference = argValue('--reference') ?? '<reference.fa>';
  const out = path.resolve(argValue('--out') ?? path.join(packageDir, 'output/wgs-caller-manifest.json'));
  const manifest = buildWgsCallerManifest(input, reference);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    status: 'ok',
    output: out,
    configured_steps: manifest.caller_steps.length,
    available_steps: manifest.caller_steps.filter(step => step.available).length,
  }, null, 2));
}

if (process.argv[1]?.endsWith('wgs_caller_pipeline.ts')) {
  main();
}
