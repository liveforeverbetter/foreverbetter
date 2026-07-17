/**
 * Dashboard Renderer
 *
 * Pure function. Takes a template string and DashboardData object,
 * returns the fully-populated dashboard HTML string.
 *
 * No side effects, no file I/O. The caller handles reading the template
 * and writing the output so this composes cleanly with any pipeline.
 *
 * Usage:
 *   import { renderDashboard } from "./render.js";
 *   import { readFileSync, writeFileSync } from "fs";
 *
 *   const template = readFileSync("assets/template.html", "utf-8");
 *   const data = JSON.parse(readFileSync("pipeline-output/user.json", "utf-8"));
 *   const html = renderDashboard(template, data);
 *   writeFileSync("index.html", html, "utf-8");
 */

import type { DashboardData } from "./schema.js";
import { buildTokenMap } from "./config.js";

// ── Section marker pattern ──
// Template marks optional sections like:
//   <!-- section:innate_strengths -->...content...<!-- /section:innate_strengths -->
// When the corresponding data array is empty, everything between the
// markers is removed from the template (including the markers themselves).
const SECTION_MARKER = /<!-- section:(\w+) -->[\s\S]*?<!-- \/section:\1 -->/g;

/**
 * Map of section name → data check function.
 * Returns true if the section should be shown.
 */
const SECTION_CHECKS: Record<string, (data: DashboardData) => boolean> = {
  multimodal_plan: (d) => d.multimodal_plan != null,
  independent_modality_analysis: (d) => d.biomarker_analysis != null || d.wearable_analysis != null,
  innate_strengths: (d) => (d.innate_strengths?.length ?? 0) > 0,
  insights: (d) => (d.insights?.length ?? 0) > 0,
  action_plan: (d) => (d.action_plan?.length ?? 0) > 0,
  overview_protocols: (d) => (d.overview_protocols?.length ?? 0) > 0,
  ancestry: (d) => d.ancestry != null,
  genetic_variants: (d) => d.genetic_variants != null,
  prs_expanded: (d) => d.prs_expanded != null && (
    (d.prs_expanded.longevity_traits?.length ?? 0) + (d.prs_expanded.wellness_traits?.length ?? 0) > 0
  ),
  vep_missense: (d) => d.vep_missense != null && (d.vep_missense.calls?.length ?? 0) > 0,
  hallmark: (d) => d.hallmark != null && (d.hallmark.hallmarks?.length ?? 0) > 0,
};

function hasIndexedSectionData(name: string, data: DashboardData): boolean | undefined {
  let m = name.match(/^protocol_overview_(\d+)$/);
  if (m) return (data.overview_protocols?.[Number(m[1]) - 1]?.title ?? "").length > 0;

  m = name.match(/^protocol_(\d+)$/);
  if (m) return (data.protocols?.[Number(m[1]) - 1]?.title ?? "").length > 0;

  m = name.match(/^protocol_(\d+)_phase_(\d+)$/);
  if (m) {
    const protocol = data.protocols?.[Number(m[1]) - 1];
    return (protocol?.phases?.[Number(m[2]) - 1]?.check ?? "").length > 0;
  }

  m = name.match(/^protocol_overview_(\d+)_item_(\d+)$/);
  if (m) {
    const protocol = data.overview_protocols?.[Number(m[1]) - 1];
    return (protocol?.phases?.[Number(m[2]) - 1]?.check ?? "").length > 0;
  }

  m = name.match(/^action_(\d+)$/);
  if (m) return (data.action_plan?.[Number(m[1]) - 1]?.title ?? "").length > 0;

  m = name.match(/^insight_(\d+)$/);
  if (m) return (data.insights?.[Number(m[1]) - 1]?.title ?? "").length > 0;

  m = name.match(/^cross_action_(\d+)$/);
  if (m) return (data.multimodal_plan?.action_priorities?.[Number(m[1]) - 1]?.title ?? "").length > 0;

  return undefined;
}

/**
 * Renders the dashboard template with the provided data.
 *
 * Supports two modes:
 *
 * New JSON-driven templates (design system):
 *   Pass `jsonOverride` — the full JSON string is injected into
 *   `{{DASHBOARD_DATA_JSON}}` and the function returns immediately.
 *   The JavaScript inside the template handles all rendering.
 *
 * Legacy mustache templates:
 *   1. Strips empty optional sections from the template
 *   2. Builds a flat token → value map from the data
 *   3. Replaces all {{token}} placeholders in one pass
 *   4. Cleans up any unreplaced {{tokens}} (shouldn't remain)
 */
export function renderDashboard(
  template: string,
  data: DashboardData,
  jsonOverride?: string
): string {
  let html = template;

  // For new JSON-driven templates, inject the JSON block directly.
  // The template is fully self-contained after injection — its own JS handles rendering.
  if (html.includes("{{DASHBOARD_DATA_JSON}}")) {
    const json = jsonOverride ?? JSON.stringify(data, null, 2);
    html = html.replace("{{DASHBOARD_DATA_JSON}}", json.replace(/</g, "\\u003c"));
    return html;
  }

  // Legacy mustache template processing
  // Step 1: strip empty optional sections
  html = stripEmptySections(html, data);

  // Step 2: build flat replacement map
  const tokens = buildTokenMap(data);

  // Step 3: replace all {{token}} with values
  html = replaceTokens(html, tokens);

  // Step 4: clean up any remaining {{unreplaced}} patterns
  html = html.replace(/\{\{[^}]+\}\}/g, "");

  return html;
}

// ── Internal ──

/**
 * Removes section blocks whose data arrays are empty/null.
 * Uses the SECTION_CHECKS map to determine visibility.
 *
 * Example: if `innate_strengths` array is empty, everything between
 * `<!-- section:innate_strengths -->` and `<!-- /section:innate_strengths -->`
 * is removed from the template.
 */
function stripEmptySections(
  template: string,
  data: DashboardData
): string {
  let html = template;

  // Process repeatedly so nested section markers are evaluated after their parent
  // section is kept. The fixed depth prevents accidental infinite loops if an
  // unknown marker remains in the template.
  for (let i = 0; i < 8; i++) {
    let changed = false;
    const re = new RegExp(SECTION_MARKER.source, "g");
    html = html.replace(re, (match, name: string) => {
      const check = SECTION_CHECKS[name];
      const shouldShow = check ? check(data) : hasIndexedSectionData(name, data);
      if (shouldShow === undefined) return match; // unknown marker — leave as-is
      changed = true;
      if (shouldShow) {
        // Section has data — keep content but strip only this marker pair.
        return match
          .replace(new RegExp(`<!-- section:${name} -->\\n?`, "g"), "")
          .replace(new RegExp(`\\n?<!-- /section:${name} -->`, "g"), "");
      }
      return "";
    });
    if (!changed) break;
  }

  return html;
}

/**
 * Single-pass token replacement. Handles {{token}} with optional
 * whitespace around the token name.
 */
function replaceTokens(
  html: string,
  tokens: Record<string, string>
): string {
  return html.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, key: string) => {
    if (key in tokens) return tokens[key];
    // Token not found in map — leave it so cleanup can address it
    return `{{${key}}}`;
  });
}

// ── Convenience re-exports ──

export { buildTokenMap, formatNumber, formatCoverage, formatPercentile } from "./config.js";
export type * from "./schema.js";
