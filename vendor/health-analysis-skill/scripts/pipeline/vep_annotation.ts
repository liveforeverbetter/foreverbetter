/**
 * VEP Functional Annotation Engine
 *
 * Runs Ensembl Variant Effect Predictor (VEP) for consequence prediction
 * on annotated VCF files. Produces a cached .vep.tsv output with:
 *   - Consequence type (missense, stop_gained, etc.)
 *   - Gene name and Ensembl gene ID
 *   - Protein change (HGVS.p)
 *   - SIFT and PolyPhen scores
 *   - gnomAD allele frequency
 *   - IMPACT rating (HIGH, MODERATE, LOW, MODIFIER)
 *
 * VEP is optional — if not installed or if the cache is missing, the
 * pipeline skips VEP annotation gracefully and logs a warning.
 *
 * Output is cached as .vep.tsv alongside the annotated VCF.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Types
// ============================================================================

export interface VEPAnnotation {
  variantKey: string;    // chrom:pos:ref:alt
  consequence: string;   // e.g. "missense_variant", "stop_gained"
  gene: string;          // Gene symbol
  geneId: string;        // Ensembl gene ID
  proteinChange: string; // HGVS.p notation
  sift: string;          // SIFT prediction
  polyphen: string;      // PolyPhen prediction
  cadd_phred?: number;   // CADD PHRED score when available from VEP plugins
  cadd_raw?: number;     // CADD raw score when available from VEP plugins
  gnomadAF: number;      // gnomAD allele frequency (0 if absent)
  impact: string;        // HIGH | MODERATE | LOW | MODIFIER
}

export interface VEPResult {
  annotations: Map<string, VEPAnnotation>;
  totalInput: number;
  totalAnnotated: number;
  highImpactCount: number;
  moderateImpactCount: number;
}

// ============================================================================
// VEP Availability Check
// ============================================================================

/**
 * Check if VEP is installed and has a cache available.
 */
export function isVEPAvailable(): boolean {
  try {
    execSync('vep --help', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Run VEP annotation on a VCF file.
 *
 * Uses --cache --offline --everything to leverage the local VEP cache
 * without network access. Output is tab-separated for easy parsing.
 *
 * If a cached .vep.tsv exists, skips re-annotation.
 *
 * @param vcfPath - Path to annotated VCF (.vcf.gz)
 * @returns Path to the .vep.tsv output file, or null if VEP is unavailable
 */
export function runVEP(vcfPath: string): string | null {
  if (!isVEPAvailable()) {
    console.log('   ⚠️  VEP not installed or not found in PATH. Skipping functional annotation.');
    console.log('   To enable VEP, install: https://useast.ensembl.org/info/docs/tools/vep/script/vep_download.html');
    return null;
  }

  const outputPath = vcfPath.replace(/\.vcf\.gz$/, '').replace(/\.vcf$/, '') + '.vep.tsv';

  // Check for cached output
  if (fs.existsSync(outputPath)) {
    console.log(`   Using cached VEP output: ${outputPath}`);
    return outputPath;
  }

  console.log('   Running VEP functional annotation (this may take several minutes)...');
  try {
    execSync(
      `vep --cache --offline --everything --tab \\
        --input_file "${vcfPath}" \\
        --output_file "${outputPath}" \\
        --no_stats \\
        --force_overwrite 2>&1`,
      { stdio: 'pipe', shell: '/bin/bash', timeout: 600000 }
    );

    if (fs.existsSync(outputPath)) {
      console.log(`   ✅ VEP annotation complete: ${outputPath}`);
      return outputPath;
    } else {
      console.warn('   ⚠️  VEP ran but did not produce output. Skipping functional annotation.');
      return null;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`   ⚠️  VEP annotation failed: ${msg.substring(0, 200)}`);
    console.log('   Continuing without functional annotation...');
    return null;
  }
}

/**
 * Parse a single VEP tabular output line into a VEPAnnotation.
 * Returns null for unparseable or low-impact lines.
 */
function parseVEPLine(line: string): VEPAnnotation | null {
  if (line.trim() === '' || line.startsWith('#')) return null;

  const parts = line.split('\t');
  if (parts.length < 7) return null;

  const uploadedVar = parts[0] || '';
  const location = parts[1] || '';
  const allele = parts[2] || '';
  const gene = parts[3] || '';
  const consequence = parts[6] || '';

  const geneId = parts[9] || parts[10] || parts[5] || '';
  const proteinChange = parts[13] || parts[14] || '';
  const sift = parts.length > 32 ? parts[32] || '' : '';
  const polyphen = parts.length > 33 ? parts[33] || '' : '';

  let gnomadAF = 0;
  if (parts.length > 41) {
    const afStr = parts[41];
    if (afStr && afStr !== '-' && afStr !== '.') {
      const parsed = parseFloat(afStr);
      if (!isNaN(parsed)) gnomadAF = parsed;
    }
  }
  if (gnomadAF === 0 && parts.length > 42) {
    const afStr = parts[42];
    if (afStr && afStr !== '-' && afStr !== '.') {
      const parsed = parseFloat(afStr);
      if (!isNaN(parsed)) gnomadAF = parsed;
    }
  }

  // IMPACT — try standard column (~45), then extract from short-form info field
  let impact = 'MODIFIER';
  if (parts.length > 45) {
    impact = parts[45] || 'MODIFIER';
  } else {
    // Short-form VEP output (common in tests/simplified pipelines) puts
    // IMPACT= in the last column alongside other annotations
    const lastCol = parts[parts.length - 1] || '';
    const impactMatch = lastCol.match(/IMPACT=(HIGH|MODERATE|LOW|MODIFIER)/);
    if (impactMatch) {
      impact = impactMatch[1];
    }
  }

  // Build variant key from Uploaded_variation
  let variantKey = '';
  if (uploadedVar && (uploadedVar.includes('_') || uploadedVar.includes('/'))) {
    const match = uploadedVar.match(/^(\d+|X|Y|MT|M)_(\d+)_(\w+)\/(\w+)$/);
    if (match) {
      variantKey = `${match[1]}:${match[2]}:${match[3]}:${match[4]}`;
    }
  }
  if (!variantKey && location) {
    variantKey = location.replace(/[-:]/g, ':').replace(/\s+/g, '');
    if (allele) variantKey += `:${allele}`;
  }
  if (!variantKey) {
    variantKey = uploadedVar || `${gene}:${consequence}`;
  }

  return {
    variantKey,
    consequence,
    gene,
    geneId,
    proteinChange,
    sift,
    polyphen,
    gnomadAF,
    impact,
  };
}

/**
 * Parse VEP tabular output into a Map of VEPAnnotation keyed by chrom:pos:ref:alt.
 *
 * Uses chunked streaming reading to avoid loading the entire multi-GB VEP TSV
 * into memory at once. On a consumer laptop with 3.7M variants, the VEP output
 * can be 2-5GB.
 *
 * We keep only HIGH and MODERATE impact annotations:
 *   HIGH-impact: ~0.1% of variants = ~3.7K entries (stop_gained, frameshift, splice)
 *   MODERATE-impact: ~1% of variants = ~37K entries (missense, inframe indel)
 * Total map entries: ~40K, which is <10MB in memory.
 *
 * LOW and MODIFIER impact variants (the vast majority) are discarded.
 */
export function parseVEPOutput(tsvPath: string): Map<string, VEPAnnotation> {
  const annotations = new Map<string, VEPAnnotation>();

  if (!fs.existsSync(tsvPath)) {
    return annotations;
  }

  const impactPriority: Record<string, number> = { HIGH: 4, MODERATE: 3, LOW: 2, MODIFIER: 1 };
  const stats = { total: 0, kept: 0, high: 0, moderate: 0 };

  try {
    // Use synchronous chunked reading to avoid consuming gigabytes of RAM.
    // Read the file in 64MB chunks, process complete lines from each chunk,
    // and carry over any partial line to the next chunk.
    const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB
    const fd = fs.openSync(tsvPath, 'r');
    const buffer = Buffer.alloc(CHUNK_SIZE);
    let leftover = '';
    let bytesRead: number;

    while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) > 0) {
      const chunk = leftover + buffer.toString('utf-8', 0, bytesRead);
      const lines = chunk.split('\n');

      // The last element may be incomplete; save it for the next chunk
      leftover = lines.pop() || '';

      for (const line of lines) {
        const annotation = parseVEPLine(line);
        if (!annotation) continue;
        stats.total++;

        if (annotation.impact === 'LOW' || annotation.impact === 'MODIFIER') continue;

        if (annotation.impact === 'HIGH') stats.high++;
        else if (annotation.impact === 'MODERATE') stats.moderate++;
        stats.kept++;

        const existing = annotations.get(annotation.variantKey);
        if (existing) {
          if ((impactPriority[annotation.impact] || 0) > (impactPriority[existing.impact] || 0)) {
            annotations.set(annotation.variantKey, annotation);
          }
        } else {
          annotations.set(annotation.variantKey, annotation);
        }
      }
    }

    // Process the final leftover line (if any)
    if (leftover.trim()) {
      const annotation = parseVEPLine(leftover);
      if (annotation && annotation.impact !== 'LOW' && annotation.impact !== 'MODIFIER') {
        stats.total++;
        stats.kept++;
        const existing = annotations.get(annotation.variantKey);
        if (!existing || (impactPriority[annotation.impact] || 0) > (impactPriority[existing.impact] || 0)) {
          annotations.set(annotation.variantKey, annotation);
        }
      }
    }

    fs.closeSync(fd);
  } catch (err) {
    console.warn(`   ⚠️  Error reading VEP output: ${err instanceof Error ? err.message : String(err)}`);
    return annotations;
  }

  return annotations;
}

/**
 * Parse VEP tabular output into a Map of VEPAnnotation keyed by chrom:pos:ref:alt
 * (legacy synchronous version — kept for backward compatibility in tests).
 *
 * Prefer parseVEPOutput() for production use as it filters to HIGH/MODERATE only.
 */
export function parseVEPOutputSync(tsvPath: string): Map<string, VEPAnnotation> {
  const annotations = new Map<string, VEPAnnotation>();

  if (!fs.existsSync(tsvPath)) {
    return annotations;
  }

  const content = fs.readFileSync(tsvPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const annotation = parseVEPLine(line);
    if (!annotation) continue;

    const existing = annotations.get(annotation.variantKey);
    const impactPriority: Record<string, number> = { HIGH: 4, MODERATE: 3, LOW: 2, MODIFIER: 1 };
    if (existing) {
      if ((impactPriority[annotation.impact] || 0) > (impactPriority[existing.impact] || 0)) {
        annotations.set(annotation.variantKey, annotation);
      }
    } else {
      annotations.set(annotation.variantKey, annotation);
    }
  }

  return annotations;
}

/**
 * Look up VEP annotations for a set of variant keys using grep on the cached TSV.
 *
 * This is the on-demand counterpart to parseVEPOutput(). While parseVEPOutput()
 * keeps only HIGH/MODERATE impact variants in memory (<10MB for 3.7M variants),
 * this function can look up any specific variant at any impact level using grep.
 *
 * Use this when you need LOW/MODIFIER annotations for a specific variant,
 * e.g., to check gnomAD AF for a ClinVar-matched variant that wasn't in the
 * HIGH/MODERATE set.
 *
 * @param variantKeys - Array of variant keys in "chrom:pos:ref:alt" format
 * @param tsvPath - Path to the cached .vep.tsv file
 * @returns Map of variantKey → VEPAnnotation, only for variants found in the TSV
 */
export function queryVEPForVariants(variantKeys: string[], tsvPath: string): Map<string, VEPAnnotation> {
  const annotations = new Map<string, VEPAnnotation>();

  if (!fs.existsSync(tsvPath) || variantKeys.length === 0) {
    return annotations;
  }

  try {
    // Build grep patterns from variant keys
    // VEP TSV uses "chrom_pos_ref/alt" in the Uploaded_variation column (col 1),
    // or "chrom:pos" in the Location column (col 2).
    // We grep for both patterns.
    const patterns = variantKeys.flatMap(k => {
      const parts = k.split(':');
      if (parts.length !== 4) return [];
      // chrom_pos_ref/alt format (Uploaded_variation column)
      const vepKey = `${parts[0]}_${parts[1]}_${parts[2]}/${parts[3]}`;
      // chrom:pos format (Location column, matches line start or early columns)
      const locKey = `${parts[0]}:${parts[1]}`;
      return [vepKey, locKey];
    });

    if (patterns.length === 0) return annotations;

    // Write patterns to temp file for grep -F
    const patternFile = tsvPath + '.vep_lookup.txt';
    fs.writeFileSync(patternFile, patterns.join('\n'));

    try {
      // grep -F -f for fast fixed-string matching
      const cmd = `grep -F -f "${patternFile}" "${tsvPath}"`;
      const output = execSync(cmd, {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024, // 50MB — on-demand lookups are typically small batches
      });

      for (const line of output.trim().split('\n')) {
        const annotation = parseVEPLine(line);
        if (!annotation) continue;

        // Keep the most severe consequence per variant
        const existing = annotations.get(annotation.variantKey);
        const impactPriority: Record<string, number> = { HIGH: 4, MODERATE: 3, LOW: 2, MODIFIER: 1 };
        if (!existing || (impactPriority[annotation.impact] || 0) > (impactPriority[existing.impact] || 0)) {
          annotations.set(annotation.variantKey, annotation);
        }
      }
    } finally {
      try { fs.unlinkSync(patternFile); } catch (_) {}
    }
  } catch (err: any) {
    if (err.status !== 1) {
      // grep exits 1 on no matches, which is fine
      console.warn(`   VEP lookup warning: ${err.message}`);
    }
  }

  return annotations;
}

/**
 * Look up VEP annotation for a single variant key.
 */
export function queryVEPForVariant(variantKey: string, tsvPath: string): VEPAnnotation | null {
  const result = queryVEPForVariants([variantKey], tsvPath);
  return result.get(variantKey) || null;
}

/**
 * Run VEP and parse its output in one call.
 * This is the main entry point for the pipeline.
 *
 * Keeps only HIGH and MODERATE impact annotations in memory by default
 * (<10MB for the typical genome). These are the clinically actionable
 * variants: stop_gained, frameshift, missense, splice variants, etc.
 *
 * For LOW/MODIFIER impact annotations on specific variants, use
 * queryVEPForVariant() or queryVEPForVariants() for on-demand grep-based lookup.
 *
 * @param vcfPath - Path to annotated VCF (.vcf.gz)
 * @returns VEPResult with annotation map and summary stats, or null if unavailable
 */
export function annotateWithVEP(vcfPath: string): VEPResult | null {
  const tsvPath = runVEP(vcfPath);
  if (!tsvPath) return null;

  const annotations = parseVEPOutput(tsvPath);

  let highImpact = 0;
  let moderateImpact = 0;

  for (const ann of annotations.values()) {
    if (ann.impact === 'HIGH') highImpact++;
    if (ann.impact === 'MODERATE') moderateImpact++;
  }

  return {
    annotations,
    totalInput: 0, // Will be set by caller
    totalAnnotated: annotations.size,
    highImpactCount: highImpact,
    moderateImpactCount: moderateImpact,
  };
}

/**
 * Annotate with VEP and filter to rare variants only.
 *
 * Keeps only HIGH or MODERATE impact variants with gnomAD allele frequency
 * below 0.01 (rare in the general population). These are the most likely
 * to be clinically significant findings.
 *
 * This returns a subset of the full VEP result, pre-filtered for the
 * rare variant analysis pipeline. The full set is still available via
 * annotateWithVEP() when needed.
 *
 * @param vcfPath - Path to annotated VCF (.vcf.gz)
 * @returns VEPResult filtered to rare HIGH/MODERATE variants only, or null
 */
export function annotateWithVEPr(vcfPath: string): VEPResult | null {
  const result = annotateWithVEP(vcfPath);
  if (!result) return null;

  // Filter to rare variants: gnomAD AF < 0.01 (frequency < 1% in population)
  const rareAnnotations = new Map<string, VEPAnnotation>();
  let rareHigh = 0;
  let rareModerate = 0;

  for (const [key, ann] of result.annotations) {
    if (ann.gnomadAF < 0.01) {
      rareAnnotations.set(key, ann);
      if (ann.impact === 'HIGH') rareHigh++;
      if (ann.impact === 'MODERATE') rareModerate++;
    }
  }

  return {
    annotations: rareAnnotations,
    totalInput: result.totalInput,
    totalAnnotated: rareAnnotations.size,
    highImpactCount: rareHigh,
    moderateImpactCount: rareModerate,
  };
}
