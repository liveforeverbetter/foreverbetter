/**
 * Unified preflight for the modality-optional CLI.
 *
 * Inspects supplied files without running the full analysis. Reports
 * problem + cause + fix + example for each issue, so the user can correct
 * before launching the real pipeline.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseBiomarkerFile, parseWearableFile } from './health_data_import.js';

export interface DoctorIssue {
  modality: 'genetics' | 'biomarkers' | 'wearables';
  severity: 'error' | 'warning' | 'info';
  problem: string;
  cause: string;
  fix: string;
  example?: string;
}

export interface DoctorModalityResult {
  modality: 'genetics' | 'biomarkers' | 'wearables';
  supplied: boolean;
  file_path?: string;
  row_count?: number;
  ok: boolean;
  issues: DoctorIssue[];
}

export interface DoctorReport {
  generated_at: string;
  modalities: DoctorModalityResult[];
  any_error: boolean;
}

export interface InputDoctorInput {
  geneticsPath?: string;
  biomarkersPath?: string;
  previousBiomarkersPath?: string;
  wearablesPath?: string;
}

function fileExistsCheck(modality: DoctorModalityResult['modality'], filePath: string | undefined): { exists: boolean; issues: DoctorIssue[] } {
  if (!filePath) return { exists: false, issues: [] };
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      issues: [{
        modality,
        severity: 'error',
        problem: `${modality} file not found: ${filePath}`,
        cause: 'The path you supplied does not point to an existing file.',
        fix: 'Check the path is absolute and that the file exists. Use tab-completion if your shell supports it.',
        example: `--${modality}=/absolute/path/to/file`,
      }],
    };
  }
  return { exists: true, issues: [] };
}

function geneticsDoctor(filePath: string | undefined): DoctorModalityResult {
  const result: DoctorModalityResult = { modality: 'genetics', supplied: Boolean(filePath), file_path: filePath, ok: true, issues: [] };
  if (!filePath) return result;
  const exists = fileExistsCheck('genetics', filePath);
  result.issues.push(...exists.issues);
  if (!exists.exists) { result.ok = false; return result; }
  const lower = filePath.toLowerCase();
  const acceptedExt = lower.endsWith('.vcf') || lower.endsWith('.vcf.gz') || lower.endsWith('.bgz') || lower.endsWith('.txt');
  if (!acceptedExt) {
    result.issues.push({
      modality: 'genetics',
      severity: 'warning',
      problem: 'Unrecognised genetics file extension.',
      cause: 'Expected one of .vcf, .vcf.gz, .bgz, or 23andMe / AncestryDNA raw .txt.',
      fix: 'Re-export with a supported extension, or rename the file if you know the format.',
      example: '--genetics=/data/sample.vcf.gz',
    });
  }
  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    result.ok = false;
    result.issues.push({
      modality: 'genetics',
      severity: 'error',
      problem: 'Genetics file is empty (0 bytes).',
      cause: 'The file you supplied has no content.',
      fix: 'Re-download or re-export the genetics file.',
    });
  }
  return result;
}

function biomarkerDoctor(filePath: string | undefined, label: 'biomarkers' = 'biomarkers'): DoctorModalityResult {
  const result: DoctorModalityResult = { modality: 'biomarkers', supplied: Boolean(filePath), file_path: filePath, ok: true, issues: [] };
  if (!filePath) return result;
  const exists = fileExistsCheck('biomarkers', filePath);
  result.issues.push(...exists.issues);
  if (!exists.exists) { result.ok = false; return result; }
  try {
    const readings = parseBiomarkerFile(filePath);
    result.row_count = readings.length;
    if (readings.length === 0) {
      result.ok = false;
      result.issues.push({
        modality: 'biomarkers',
        severity: 'error',
        problem: `Parsed zero biomarker rows from ${path.basename(filePath)}.`,
        cause: 'Header names may not match the marker/value/unit/collected_at convention, or the body may contain only comments.',
        fix: 'Open the file and confirm there is a header row with marker, value, unit, collected_at (or one of the documented aliases). Save and retry.',
        example: 'marker,value,unit,collected_at\nApoB,118,mg/dL,2026-05-01',
      });
    } else if (readings.length < 4) {
      result.issues.push({
        modality: 'biomarkers',
        severity: 'warning',
        problem: `Only ${readings.length} biomarker row${readings.length === 1 ? '' : 's'} parsed.`,
        cause: 'A very small panel may not surface many actions.',
        fix: 'If you have a larger export, prefer it; otherwise the pipeline will still run.',
      });
    }
  } catch (err) {
    result.ok = false;
    const message = err instanceof Error ? err.message : String(err);
    result.issues.push({
      modality: 'biomarkers',
      severity: 'error',
      problem: `Could not parse ${label} file ${path.basename(filePath)}.`,
      cause: message,
      fix: 'Open the file and confirm it is valid CSV / JSON / plain text and the columns match the expected aliases.',
      example: 'marker,value,unit,collected_at\nApoB,118,mg/dL,2026-05-01',
    });
  }
  return result;
}

function wearableDoctor(filePath: string | undefined): DoctorModalityResult {
  const result: DoctorModalityResult = { modality: 'wearables', supplied: Boolean(filePath), file_path: filePath, ok: true, issues: [] };
  if (!filePath) return result;
  const exists = fileExistsCheck('wearables', filePath);
  result.issues.push(...exists.issues);
  if (!exists.exists) { result.ok = false; return result; }
  try {
    const readings = parseWearableFile(filePath);
    result.row_count = readings.length;
    if (readings.length === 0) {
      result.ok = false;
      result.issues.push({
        modality: 'wearables',
        severity: 'error',
        problem: `Parsed zero wearable rows from ${path.basename(filePath)}.`,
        cause: 'The exporter may use column names not in the alias map, or the file may be a placeholder.',
        fix: 'Confirm the file contains daily rows with sleep / hrv / steps / etc. or use a recognised WHOOP/Oura/Apple Health export.',
        example: 'date,sleep_duration,hrv,resting_heart_rate,steps\n2026-04-24,7.5,42,58,8200',
      });
    } else if (readings.length < 4) {
      result.issues.push({
        modality: 'wearables',
        severity: 'warning',
        problem: `Only ${readings.length} wearable signal${readings.length === 1 ? '' : 's'} parsed.`,
        cause: 'A thin export limits trend confidence; the pipeline still runs.',
        fix: 'If you have a longer window (≥7 days), prefer it.',
      });
    }
  } catch (err) {
    result.ok = false;
    const message = err instanceof Error ? err.message : String(err);
    result.issues.push({
      modality: 'wearables',
      severity: 'error',
      problem: `Could not parse wearable file ${path.basename(filePath)}.`,
      cause: message,
      fix: 'Confirm the file is valid CSV / JSON. Check column headers against the documented WHOOP/Oura/Apple Health aliases.',
      example: 'date,sleep_duration,hrv,resting_heart_rate,steps\n2026-04-24,7.5,42,58,8200',
    });
  }
  return result;
}

export function runInputDoctor(input: InputDoctorInput): DoctorReport {
  const modalities: DoctorModalityResult[] = [];
  if (input.geneticsPath) modalities.push(geneticsDoctor(input.geneticsPath));
  if (input.biomarkersPath) modalities.push(biomarkerDoctor(input.biomarkersPath, 'biomarkers'));
  if (input.previousBiomarkersPath) {
    const prev = biomarkerDoctor(input.previousBiomarkersPath, 'biomarkers');
    prev.modality = 'biomarkers';
    // Annotate the file_path so callers can distinguish current vs previous.
    if (prev.file_path) prev.file_path = `${prev.file_path} (previous panel)`;
    modalities.push(prev);
  }
  if (input.wearablesPath) modalities.push(wearableDoctor(input.wearablesPath));

  // If nothing was supplied at all, surface a hint rather than an empty report.
  if (modalities.length === 0) {
    modalities.push({
      modality: 'biomarkers',
      supplied: false,
      ok: false,
      issues: [{
        modality: 'biomarkers',
        severity: 'info',
        problem: 'No modality files supplied to the doctor command.',
        cause: 'You ran `--doctor` without any --genetics / --biomarkers / --wearables flags.',
        fix: 'Re-run with at least one path, for example: `npm run doctor -- --biomarkers=./examples/sample-biomarkers.csv`.',
      }],
    });
  }

  const any_error = modalities.some(m => m.issues.some(i => i.severity === 'error'));
  return { generated_at: new Date().toISOString(), modalities, any_error };
}

export function renderDoctorReport(report: DoctorReport): string {
  const lines: string[] = [];
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('  Input doctor — preflight summary');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const modality of report.modalities) {
    lines.push('');
    const label = `${modality.modality}`;
    const status = modality.ok ? 'OK' : 'BLOCKED';
    const rowText = modality.row_count != null ? ` · ${modality.row_count} row${modality.row_count === 1 ? '' : 's'}` : '';
    lines.push(`[${status}] ${label}${rowText}`);
    if (modality.file_path) lines.push(`  file: ${modality.file_path}`);
    for (const issue of modality.issues) {
      lines.push(`  - [${issue.severity.toUpperCase()}] ${issue.problem}`);
      lines.push(`      cause: ${issue.cause}`);
      lines.push(`      fix:   ${issue.fix}`);
      if (issue.example) lines.push(`      example: ${issue.example}`);
    }
  }
  lines.push('');
  lines.push(report.any_error
    ? 'Result: BLOCKED — fix the errors above before running the pipeline.'
    : 'Result: OK — inputs look usable for analysis.');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return lines.join('\n');
}
