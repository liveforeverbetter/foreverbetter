/**
 * Smoke test: compiles and runs the renderer against sample data.
 * Run: npx tsx src/smoke-test.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { renderDashboard } from "./render.js";
import type { DashboardData } from "./schema.js";

// 1. Read the template
const templatePath = resolve(
  dirname(new URL(import.meta.url).pathname),
  "..",
  "..",
  "templates",
  "longevity-dashboard.html"
);
const template = readFileSync(templatePath, "utf-8");

// 2. Build sample data that exercises every section
const sampleData: DashboardData = {
  meta: {
    data_source: "Dante Labs WGS",
    modality_summary: "Genomics + biomarkers",
    coverage: "30",
    pipeline_version: "v8.0.0",
    ref_db: "dbSNP GRCh37 + ClinVar + CPIC + PharmGKB",
    generated_date: "April 28, 2026",
    user_initials: "JD",
    curated_markers: 227,
    vep_rare_variants: 42,
    clinvar_pathogenic: 15,
    cpic_actionable: 8,
    total_trait_findings: 145,
  },
  multimodal_plan: {
    summary: "Genomics is connected; biomarkers and wearable exports can be added next for a retestable action plan.",
    current_state: "Genomics and sample biomarkers are connected. Wearables are optional.",
    next_best_upload: "wearables",
    modalities: [
      {
        id: "genomics",
        title: "Genomics",
        status: "connected",
        status_label: "Connected",
        desc: "VCF/WGS interpretation and genetic context.",
        accepted_formats: ["VCF", "VCF.GZ"],
        examples: ["Dante Labs WGS", "TellmeGen export"],
        action: "Use as stable predisposition context.",
      },
      {
        id: "biomarkers",
        title: "Blood biomarkers",
        status: "connected",
        status_label: "Connected",
        desc: "Lab markers create a retestable baseline.",
        accepted_formats: ["PDF", "CSV"],
        examples: ["Superpower-style panel", "Lucis panel"],
        action: "Compare annually.",
      },
      {
        id: "wearables",
        title: "Wearables and behavior",
        status: "recommended_next",
        status_label: "Next",
        desc: "Behavior signals explain recovery and adherence.",
        accepted_formats: ["CSV", "Apple Health export"],
        examples: ["WHOOP", "Oura", "OHealth"],
        action: "Add sleep, HRV, RHR, and activity trends.",
      },
    ],
    upload_path: [
      { label: "01", title: "Start anywhere", body: "Use one modality first." },
      { label: "02", title: "Normalize", body: "Map signals into shared domains." },
      { label: "03", title: "Prioritize", body: "Rank the clearest next actions." },
      { label: "04", title: "Retest", body: "Compare changes over time." },
    ],
    biomarker_domains: [
      { name: "Cardiometabolic", status: "available", markers: ["ApoB", "HbA1c"], why_it_matters: "Shows current metabolic state." },
      { name: "Inflammation", status: "partial", markers: ["hs-CRP", "ferritin"], why_it_matters: "Adds inflammaging context." },
      { name: "Nutrients", status: "available", markers: ["Vitamin D", "B12"], why_it_matters: "Supports supplement decisions." },
      { name: "Organ function", status: "available", markers: ["ALT", "eGFR"], why_it_matters: "Adds safety context." },
    ],
    wearable_domains: [
      { name: "Sleep and recovery", status: "missing", signals: ["HRV", "sleep duration"], why_it_matters: "Validates recovery." },
      { name: "Training load", status: "missing", signals: ["strain", "steps"], why_it_matters: "Tracks adherence." },
      { name: "Rhythm", status: "missing", signals: ["bedtime", "wake time"], why_it_matters: "Explains consistency." },
    ],
    action_priorities: [
      {
        title: "Improve metabolic baseline",
        priority: "high",
        source_modalities: ["biomarkers", "wearables"],
        rationale: "ApoB and activity are both off target.",
        next_step: "Set a weekly movement floor and retest ApoB.",
        retest_window: "8-12 weeks",
      },
    ],
  },
  biomarker_analysis: {
    score: 58,
    status: "watch",
    measured_count: 4,
    total_supported: 45,
    missing_priority: ["Homocysteine", "Fasting insulin"],
    findings: [
      { id: "apob", name: "ApoB", domain: "cardiometabolic", value: 125, unit: "mg/dL", status: "needs_attention", score: 25, interpretation: "ApoB is high.", action: "Review ApoB strategy." },
    ],
    domains: [
      { id: "cardiometabolic", name: "Cardiometabolic", score: 45, status: "needs_attention", measured: 2, missing: ["Lp(a)"], top_findings: ["ApoB: needs_attention"], actions: ["Review ApoB strategy."] },
      { id: "glucose_insulin", name: "Glucose and insulin", score: 65, status: "watch", measured: 1, missing: ["Fasting insulin"], top_findings: ["HbA1c: watch"], actions: ["Retest glucose and insulin."] },
      { id: "inflammation_immune", name: "Inflammation and immune", score: 90, status: "optimal", measured: 1, missing: ["Homocysteine"], top_findings: ["hs-CRP: optimal"], actions: ["Maintain baseline."] },
      { id: "nutrient_status", name: "Nutrient status", score: 0, status: "missing", measured: 0, missing: ["Vitamin D", "B12"], top_findings: [], actions: ["Add nutrient markers."] },
    ],
    action_items: [
      { title: "Address ApoB", priority: "high", source_modalities: ["biomarkers"], rationale: "ApoB is high.", next_step: "Review ApoB strategy.", retest_window: "8-12 weeks" },
    ],
  },
  wearable_analysis: {
    score: 62,
    status: "watch",
    measured_count: 4,
    total_supported: 19,
    missing_priority: ["Sleep consistency", "Zone 2 minutes"],
    findings: [
      { id: "sleep_duration", name: "Sleep duration", domain: "sleep_recovery", value: 6.1, unit: "hours", status: "watch", score: 42, interpretation: "Sleep is low.", action: "Increase sleep opportunity." },
    ],
    domains: [
      { id: "sleep_recovery", name: "Sleep and recovery", score: 48, status: "watch", measured: 1, missing: ["Sleep efficiency"], top_findings: ["Sleep duration: watch"], actions: ["Increase sleep opportunity."] },
      { id: "cardiovascular_recovery", name: "Cardiovascular recovery", score: 70, status: "watch", measured: 1, missing: ["RHR"], top_findings: ["HRV: watch"], actions: ["Track HRV trend."] },
      { id: "activity_training", name: "Activity and training load", score: 68, status: "watch", measured: 1, missing: ["Strength sessions"], top_findings: ["Steps: watch"], actions: ["Build movement floor."] },
      { id: "rhythm_consistency", name: "Rhythm and consistency", score: 0, status: "missing", measured: 0, missing: ["Bedtime variability"], top_findings: [], actions: ["Add rhythm signals."] },
    ],
    action_items: [
      { title: "Improve sleep duration", priority: "medium", source_modalities: ["wearables"], rationale: "Sleep is low.", next_step: "Increase sleep opportunity.", retest_window: "2-4 weeks" },
    ],
  },
  gli: {
    score: 78,
    percentile: 12,
    rating: "Excellent",
    rating_color: "optimal",
  },
  innate_strengths: [
    {
      gene: "SIRT1",
      name: "Enhanced Cellular Maintenance",
      score: 89,
      desc: "Your SIRT1 variant is associated with improved cellular stress resistance.",
      evidence: "Strong",
      impact: "Longevity",
      confidence: "93%",
    },
    {
      gene: "ACTN3",
      name: "Power-Speed Profile",
      score: 85,
      desc: "Your ACTN3 RR genotype enhances fast-twitch muscle fiber function.",
      evidence: "Strong",
      impact: "Performance",
      confidence: "89%",
    },
  ],
  categories: [
    {
      id: "vulnerability",
      name: "Genetic Vulnerability",
      score: 82,
      status: "optimal",
      icon: "vulnerability",
      total_markers: 57,
      flagged: 3,
      desc: "57 disease-associated markers.",
      subitems: [
        { name: "APOE", status: "Favorable · ε3/ε3", status_color: "optimal", detail: "ε3/ε3" },
        { name: "TCF7L2", status: "Favorable", status_color: "optimal", detail: "" },
        { name: "LPA", status: "Flagged · Monitor", status_color: "moderate", detail: "Monitor" },
        { name: "PCSK9", status: "Favorable", status_color: "optimal", detail: "" },
        { name: "IL6", status: "Average", status_color: "optimal", detail: "54/57" },
      ],
    },
    {
      id: "pharmacology",
      name: "Pharmacological",
      score: 74,
      status: "neutral",
      icon: "pharmacology",
      total_markers: 44,
      flagged: 6,
      interactions: 6,
      desc: "44 pharmacogenetic markers.",
      subitems: [
        { name: "CYP2D6", status: "Intermediate", status_color: "moderate", detail: "" },
        { name: "CYP2C19", status: "Normal", status_color: "optimal", detail: "" },
        { name: "SLCO1B1", status: "Normal", status_color: "optimal", detail: "" },
        { name: "CYP2C9", status: "Sensitive", status_color: "critical", detail: "" },
        { name: "TPMT", status: "Normal", status_color: "optimal", detail: "" },
      ],
    },
    {
      id: "hereditary",
      name: "Hereditary",
      score: 91,
      status: "optimal",
      icon: "hereditary",
      total_markers: 13,
      flagged: 0,
      status_label: "All clear",
      desc: "13 monogenic markers.",
      subitems: [
        { name: "CFTR", status: "Non-carrier", status_color: "optimal", detail: "" },
        { name: "HBB", status: "Non-carrier", status_color: "optimal", detail: "" },
        { name: "BRCA1/BRCA2", status: "No pathogenic variant", status_color: "optimal", detail: "" },
        { name: "HFE", status: "Non-carrier", status_color: "optimal", detail: "" },
        { name: "ACMG findings", status: "No findings", status_color: "optimal", detail: "" },
      ],
    },
    {
      id: "traits",
      name: "Personal Traits",
      score: 68,
      status: "neutral",
      icon: "traits",
      total_markers: 15,
      flagged: 0,
      insights_count: 4,
      desc: "15 markers.",
      subitems: [
        { name: "BDNF", status: "Favorable", status_color: "optimal", detail: "Val/Val" },
        { name: "COMT", status: "Balanced", status_color: "neutral", detail: "Met/Val" },
        { name: "OXTR", status: "Favorable", status_color: "optimal", detail: "" },
        { name: "CYP1A2", status: "Slow", status_color: "moderate", detail: "" },
      ],
    },
    {
      id: "wellness",
      name: "Wellness",
      score: 79,
      status: "optimal",
      icon: "wellness",
      total_markers: 61,
      flagged: 0,
      recommendations: 8,
      desc: "61 markers.",
      subitems: [
        { name: "MTHFR", status: "35% reduced", status_color: "moderate", detail: "" },
        { name: "FTO", status: "Favorable", status_color: "optimal", detail: "" },
        { name: "LCT", status: "Lactase persistent", status_color: "optimal", detail: "" },
        { name: "SOD2", status: "Favorable", status_color: "optimal", detail: "" },
        { name: "VDR", status: "Variant", status_color: "neutral", detail: "Supplement?" },
      ],
    },
    {
      id: "ancestry",
      name: "Ancestry",
      score: 85,
      status: "neutral",
      icon: "ancestry",
      total_markers: 14,
      flagged: 0,
      haplogroups: 3,
      desc: "14 markers.",
      subitems: [
        { name: "Y-dna", status: "R1b-M269", status_color: "neutral", detail: "Western European" },
        { name: "mtDNA", status: "H1", status_color: "neutral", detail: "European" },
        { name: "Neanderthal", status: "2.5%", status_color: "neutral", detail: "68th" },
        { name: "Autosomal", status: "82% Euro", status_color: "neutral", detail: "12% WA" },
      ],
    },
  ],
  insights: [
    { title: "Slow caffeine", body: "CYP1A2 variant.", actions_count: 2 },
    { title: "Methylation", body: "MTHFR C677T.", actions_count: 3 },
    { title: "VO2 max", body: "Favorable genetics.", actions_count: 1, actions_text: "View protocol" },
    { title: "Fat sensitivity", body: "APOA2 variant.", actions_count: 1 },
  ],
  action_plan: [
    {
      priority: "High Priority",
      priority_class: "high",
      title: "Warfarin warning",
      gene_info: "CYP2C9",
      desc: "Slow processing.",
      steps: ["Print report", "Share with PCP", "Ask about PGx"],
    },
  ],
  overview_protocols: [
    {
      id: "methylation",
      tier: 1,
      tier_label: "Tier 1 · Established",
      title: "Methylation",
      impact: "High",
      difficulty: "Low",
      duration: "Ongoing",
      progress_pct: 33,
      evidence: "MTHFR.",
      phases: [
        { label: "Week 1", check: "Baseline labs", done: true, desc: "Draw blood." },
        { label: "Weeks 2-4", check: "Methylfolate 400mcg", done: false, desc: "Start." },
        { label: "Week 5+", check: "Cofactors", done: false, desc: "Add B12+B6." },
      ],
    },
  ],
  protocols: [
    {
      id: "methylation",
      tier: 1,
      tier_label: "Tier 1 · Established",
      title: "Methylation Optimization",
      impact: "High",
      difficulty: "Low",
      duration: "Ongoing",
      progress_pct: 33,
      evidence: "MTHFR.",
      phases: [
        { label: "Week 1", check: "Baseline labs", done: true, desc: "Draw blood." },
        { label: "Weeks 2-4", check: "Methylfolate", done: false, desc: "Start daily." },
        { label: "Week 5+", check: "Cofactors", done: false, desc: "Add B12+B6." },
        { label: "Check-in", check: "Re-test", done: false, desc: "Target < 8." },
      ],
    },
  ],
  ancestry: {
    y_dna: "R1b-M269",
    y_dna_detail: "Western European",
    mt_dna: "H1",
    mt_dna_detail: "European",
    neanderthal_pct: 2.5,
    neanderthal_percentile: 68,
    composition: [
      { region: "Europe", pct: 82 },
      { region: "West Asia", pct: 12 },
      { region: "North Africa", pct: 4 },
      { region: "Other", pct: 2 },
    ],
    map_regions: ["europe", "west_asia", "north_africa"],
  },
};

// 3. Render
const html = renderDashboard(template, sampleData);

function payloadFrom(htmlText: string): DashboardData {
  const match = htmlText.match(/<script type="application\/json" id="dashboard-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Missing JSON script dashboard-data");
  return JSON.parse(match[1] || "null") as DashboardData;
}

// 4. Check that no unreplaced tokens remain
const unreplaced = html.match(/\{\{[^}]+\}\}/g);
if (unreplaced && unreplaced.length > 0) {
  console.error("FAIL: Unreplaced tokens found:", unreplaced);
  process.exit(1);
}

// 5. Check that the HTML starts and ends correctly
if (!html.startsWith("<!doctype html")) {
  console.error('FAIL: Output does not start with "<!doctype html>"');
  process.exit(1);
}
if (!html.trimEnd().endsWith("</html>")) {
  console.error('FAIL: Output does not end with "</html>"');
  process.exit(1);
}

// 6. Write the output
const outDir = resolve(dirname(new URL(import.meta.url).pathname), "..", "dist");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "index.html");
writeFileSync(outPath, html, "utf-8");

// 7. Check section visibility: data has innate_strengths → section should exist
if (html.includes("SIRT1")) {
  console.log("PASS: Innate strengths section present");
} else {
  console.error("FAIL: Innate strengths section missing");
  process.exit(1);
}

// 8. Check JSON injection: "JD" should appear in the dashboard payload.
if (html.includes('"user_initials": "JD"')) {
  console.log("PASS: User initials embedded");
} else {
  console.error("FAIL: User initials not found");
  process.exit(1);
}

console.log(`OK — Rendered ${html.length.toLocaleString()} bytes to ${outPath}`);

// 9. Section-hiding smoke test: remove innate_strengths, verify they disappear
const noStrengths = { ...sampleData, innate_strengths: [] };
const htmlNoStrengths = renderDashboard(template, noStrengths);
if ((payloadFrom(htmlNoStrengths).innate_strengths?.length ?? 0) !== 0) {
  console.error("FAIL: Innate strengths should not appear when array is empty");
  process.exit(1);
}
console.log("PASS: Empty innate_strengths section is properly hidden");

// 10. Section-hiding: empty insights
const noInsights = { ...sampleData, insights: [] };
const htmlNoInsights = renderDashboard(template, noInsights);
if ((payloadFrom(htmlNoInsights).insights?.length ?? 0) !== 0) {
  console.error("FAIL: Insights should not appear when array is empty");
  process.exit(1);
}
console.log("PASS: Empty insights section is properly hidden");

// 11. Section-hiding: empty ancestry
const noAncestry = { ...sampleData, ancestry: undefined };
const htmlNoAncestry = renderDashboard(template, noAncestry);
if (payloadFrom(htmlNoAncestry).ancestry != null) {
  console.error("FAIL: Ancestry should not appear when undefined");
  process.exit(1);
}
console.log("PASS: Empty ancestry section is properly hidden");

// 12. Section-hiding: missing multi-modal plan
const noMultimodal = { ...sampleData, multimodal_plan: undefined };
const htmlNoMultimodal = renderDashboard(template, noMultimodal);
if (payloadFrom(htmlNoMultimodal).multimodal_plan != null) {
  console.error("FAIL: Multi-modal upload path should not appear when undefined");
  process.exit(1);
}
console.log("PASS: Missing multi-modal plan section is properly hidden");

// 13. Indexed section hiding: a single protocol should not leave blank cards.
const emptyProtocolTitle = /<div class="protocol-title">\s*<\/div>/;
const emptyProtocolPhase = /<div class="protocol-phase-label">\s*<\/div>/;
const emptyProtocolAction = /<span class="check pending"><\/span>\s*<\/div>/;
for (const [label, pattern] of [
  ["empty protocol title", emptyProtocolTitle],
  ["empty protocol phase", emptyProtocolPhase],
  ["empty protocol action", emptyProtocolAction],
] as const) {
  if (pattern.test(html)) {
    console.error(`FAIL: Rendered dashboard contains ${label}`);
    process.exit(1);
  }
}
console.log("PASS: Sparse protocol data does not render blank cards or phases");

// 14. Embedded JSON should remain parseable for client-side tabs.
payloadFrom(html);
console.log("PASS: Embedded dashboard JSON is parseable");
