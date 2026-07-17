import type {
  DashboardData,
  Category,
  Protocol,
  InnateStrength,
  Insight,
  ActionItem,
  Ancestry,
  ProtocolPhase,
  ClinVarVariantCard,
  PRSScore,
  GeneticVariantsSection,
  MultiModalPlan,
  BiomarkerAnalysisSummary,
  WearableAnalysisSummary,
  CrossModalAction,
} from "./schema.js";

// ── Format helpers ──

/** Formats large integers with commas: 3700000 → "3,700,000" */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Checks whether a string looks like it already contains "×" or "x" */
function hasCoverageSuffix(s: string): boolean {
  return /\d[x×]/.test(s);
}

/** Ensures coverage has "×" appended: "30" → "30×" */
export function formatCoverage(raw: string): string {
  if (hasCoverageSuffix(raw)) return raw;
  return `${raw}×`;
}

/** "12" → "Top 12%" */
export function formatPercentile(n: number): string {
  return `Top ${n}%`;
}

// ── Token builders ──

/**
 * Converts a nested DashboardData object into a flat
 * Record<string, string> of template tokens → replacement values.
 *
 * Sections with empty/missing arrays produce empty-string tokens
 * so the renderer can detect and hide those sections.
 */
export function buildTokenMap(data: DashboardData): Record<string, string> {
  const t: Record<string, string> = {};

  // ── Meta ──
  const m = data.meta;
  t["user_initials"] = esc(m.user_initials || "—");
  t["data_source"] = esc(m.data_source);
  t["modality_summary"] = esc(m.modality_summary ?? m.data_source);
  t["coverage"] = formatCoverage(m.coverage);
  t["pipeline_version"] = esc(m.pipeline_version);
  t["ref_db"] = esc(m.ref_db);
  t["generated_date"] = esc(m.generated_date);
  const q = m.analysis_quality;
  t["quality_data_handling"] = esc(q?.data_handling ?? "Processed on this machine. Raw genetic files are not uploaded by the local pipeline.");
  t["quality_analysis_scope"] = esc(q?.analysis_scope ?? "Wellness and educational interpretation based on curated markers, ClinVar, CPIC, PRS, and aging pathway mappings.");
  t["quality_genome_build"] = esc(q?.genome_build ?? "GRCh37-compatible rsID annotation");
  t["quality_vep_status"] = esc(q?.vep_status === "included" ? "Functional annotation included" : "Functional annotation not included");
  t["quality_vep_note"] = esc(q?.vep_note ?? "VEP is optional and was not used for this local report.");
  t["quality_wgs_validation_coverage"] = esc((q?.wgs_validation_coverage ?? [])
    .map(item => `${item.label}: ${item.status_label}`)
    .join("; "));
  t["quality_total_variants"] = formatNumber(q?.total_variants ?? 0);
  t["quality_matched_markers"] = formatNumber(q?.matched_markers ?? 0);
  t["quality_rsid_annotation_source"] = esc(q?.rsid_annotation_source ?? "GRCh37 rsID annotation");
  t["quality_rsid_annotation_note"] = esc(q?.rsid_annotation_note ?? "rsID annotation source was not specified.");
  t["quality_clinvar_not_diagnostic"] = esc(q?.clinvar_not_diagnostic ?? "ClinVar findings are educational and require clinical confirmation before medical action.");
  t["quality_clinvar_vus_note"] = esc(q?.clinvar_vus_note ?? "Variants of uncertain significance are not used as medical action triggers.");
  t["quality_prs_note"] = esc(q?.prs_note ?? "Polygenic scores are directional and depend on available marker coverage.");

  // ── Findings summary ──
  t["curated_markers"] = formatNumber(m.curated_markers);
  t["vep_rare_variants"] = formatNumber(m.vep_rare_variants);
  t["clinvar_pathogenic"] = formatNumber(m.clinvar_pathogenic);
  t["cpic_actionable"] = formatNumber(m.cpic_actionable);

  // -- Multi-modal upload/action path --
  fillMultiModalTokens(t, data.multimodal_plan);
  fillIndependentAnalysisTokens(t, data.biomarker_analysis, data.wearable_analysis);

  // ── GLI ──
  const g = data.gli;
  t["gli_score"] = String(g.score);
  t["percentile"] = formatPercentile(g.percentile);
  t["rating"] = esc(g.rating);
  t["rating_color_class"] = g.rating_color || "optimal";
  t["what_this_means"] = esc(g.what_this_means ?? "");
  t["focus_areas"] = esc((g.focus_areas ?? []).join(", "));

  // ── Innate strengths (0–2) ──
  const strengths = data.innate_strengths || [];
  for (let i = 0; i < 2; i++) {
    const idx = i + 1;
    const s: InnateStrength | undefined = strengths[i];
    t[`strength_${idx}_gene`] = esc(s?.gene ?? "");
    t[`strength_${idx}_name`] = esc(s?.name ?? "");
    t[`strength_${idx}_score`] = s != null ? String(s.score) : "";
    t[`strength_${idx}_desc`] = esc(s?.desc ?? "");
    t[`strength_${idx}_evidence`] = esc(s?.evidence ?? "");
    t[`strength_${idx}_impact`] = esc(s?.impact ?? "");
    t[`strength_${idx}_confidence`] = esc(s?.confidence ?? "");
  }
  t["strengths_empty"] = strengths.length === 0 ? "1" : "";

  // ── Categories (6 required) ──
  const cats = data.categories;
  for (const cat of cats) {
    fillCategoryTokens(t, cat);
  }

  // ── Insights (0–4) ──
  const insights = data.insights || [];
  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const ins: Insight | undefined = insights[i];
    t[`insight_${idx}_title`] = esc(ins?.title ?? "");
    t[`insight_${idx}_body`] = esc(ins?.body ?? "");
    if (idx === 3) {
      // insight 3 uses actions_text instead of actions_count
      t[`insight_${idx}_actions_count`] = "";
      t[`insight_${idx}_actions_text`] = esc(ins?.actions_text ?? "");
    } else {
      t[`insight_${idx}_actions_count`] = ins != null ? String(ins.actions_count) : "";
      t[`insight_${idx}_actions_text`] = "";
    }
  }
  t["insights_empty"] = insights.length === 0 ? "1" : "";

  // ── Action Plan (0–4) ──
  const actions = data.action_plan || [];
  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const a: ActionItem | undefined = actions[i];
    t[`action_${idx}_priority`] = esc(a?.priority ?? "");
    t[`action_${idx}_title`] = esc(a?.title ?? "");
    t[`action_${idx}_gene_info`] = esc(a?.gene_info ?? "");
    t[`action_${idx}_desc`] = esc(a?.desc ?? "");
    for (let s = 0; s < 3; s++) {
      t[`action_${idx}_step_${s + 1}`] = esc(a?.steps?.[s] ?? "");
    }
  }
  t["action_plan_empty"] = actions.length === 0 ? "1" : "";

  // ── Overview protocols (0–3 shown as scroll cards) ──
  const overviewProtocols = data.overview_protocols || [];
  for (let i = 0; i < 3; i++) {
    const idx = i + 1;
    const p = overviewProtocols[i];
    fillProtocolOverviewTokens(t, idx, p);
  }
  t["overview_protocols_empty"] = overviewProtocols.length === 0 ? "1" : "";

  // ── Full protocols (0–4 in the Protocols tab) ──
  const protocols = data.protocols || [];
  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const p = protocols[i];
    fillProtocolTokens(t, idx, p);
  }
  t["protocols_empty"] = protocols.length === 0 ? "1" : "";

  // ── Ancestry ──
  const ancestry = data.ancestry;
  fillAncestryTokens(t, ancestry);

  // ── Genetic Variants + PRS (data tokens for client-side rendering) ──
  fillVariantDataTokens(t, data.genetic_variants, data.prs_scores);

  // Expanded PRS (longevity + wellness traits)
  t["prs_expanded_json"] = data.prs_expanded ? JSON.stringify(data.prs_expanded) : "null";

  // VEP missense enrichment
  t["vep_missense_json"] = data.vep_missense ? JSON.stringify(data.vep_missense) : "null";

  // Hallmark pathway analysis
  t["hallmark_json"] = data.hallmark ? JSON.stringify(data.hallmark) : "null";

  return t;
}

// ── Private token-fill helpers ──

function fillCategoryTokens(
  t: Record<string, string>,
  cat: Category
): void {
  const id = cat.id;
  t[`cat_${id}_name`] = esc(cat.name);
  t[`cat_${id}_score`] = String(cat.score);
  t[`cat_${id}_status`] = cat.status;
  t[`cat_${id}_status_color`] = cat.status;
  t[`cat_${id}_total_markers`] = String(cat.total_markers);
  t[`cat_${id}_flagged`] = String(cat.flagged);
  t[`cat_${id}_interactions`] = String(cat.interactions ?? 0);
  t[`cat_${id}_status_label`] = esc(cat.status_label ?? "");
  t[`cat_${id}_insights`] = String(cat.insights_count ?? 0);
  t[`cat_${id}_recommendations`] = String(cat.recommendations ?? 0);
  t[`cat_${id}_haplogroups`] = String(cat.haplogroups ?? 0);

  for (let i = 0; i < 5; i++) {
    const sub = cat.subitems[i];
    t[`cat_${id}_sub_${i + 1}_name`] = esc(sub?.name ?? "");
    t[`cat_${id}_sub_${i + 1}_status`] = esc(sub?.status ?? "");
    t[`cat_${id}_sub_${i + 1}_status_color`] = sub?.status_color ?? "neutral";
    t[`cat_${id}_sub_${i + 1}_detail`] = esc(sub?.detail ?? "");
  }
}

function fillMultiModalTokens(t: Record<string, string>, plan?: MultiModalPlan): void {
  t["multimodal_summary"] = esc(plan?.summary ?? "");
  t["multimodal_current_state"] = esc(plan?.current_state ?? "");
  t["multimodal_next_upload"] = esc(plan?.next_best_upload ?? "");
  t["multimodal_plan_json"] = plan ? JSON.stringify(plan) : "null";

  for (let i = 0; i < 3; i++) {
    const idx = i + 1;
    const modality = plan?.modalities?.[i];
    t[`modality_${idx}_title`] = esc(modality?.title ?? "");
    t[`modality_${idx}_status`] = esc(modality?.status_label ?? "");
    t[`modality_${idx}_status_class`] = esc(modality?.status ?? "not_started");
    t[`modality_${idx}_desc`] = esc(modality?.desc ?? "");
    t[`modality_${idx}_formats`] = esc(modality?.accepted_formats?.join(", ") ?? "");
    t[`modality_${idx}_examples`] = esc(modality?.examples?.join(", ") ?? "");
    t[`modality_${idx}_action`] = esc(modality?.action ?? "");
  }

  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const step = plan?.upload_path?.[i];
    t[`upload_step_${idx}_label`] = esc(step?.label ?? "");
    t[`upload_step_${idx}_title`] = esc(step?.title ?? "");
    t[`upload_step_${idx}_body`] = esc(step?.body ?? "");
  }

  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const domain = plan?.biomarker_domains?.[i];
    t[`biomarker_${idx}_name`] = esc(domain?.name ?? "");
    t[`biomarker_${idx}_status`] = esc(domain?.status ?? "missing");
    t[`biomarker_${idx}_markers`] = esc(domain?.markers?.join(", ") ?? "");
    t[`biomarker_${idx}_why`] = esc(domain?.why_it_matters ?? "");
  }

  for (let i = 0; i < 3; i++) {
    const idx = i + 1;
    const domain = plan?.wearable_domains?.[i];
    t[`wearable_${idx}_name`] = esc(domain?.name ?? "");
    t[`wearable_${idx}_status`] = esc(domain?.status ?? "missing");
    t[`wearable_${idx}_signals`] = esc(domain?.signals?.join(", ") ?? "");
    t[`wearable_${idx}_why`] = esc(domain?.why_it_matters ?? "");
  }

  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const action = plan?.action_priorities?.[i];
    fillCrossModalActionTokens(t, `cross_action_${idx}`, action);
  }
}

function fillIndependentAnalysisTokens(
  t: Record<string, string>,
  biomarker?: BiomarkerAnalysisSummary,
  wearable?: WearableAnalysisSummary,
): void {
  t["biomarker_analysis_json"] = biomarker ? JSON.stringify(biomarker) : "null";
  t["wearable_analysis_json"] = wearable ? JSON.stringify(wearable) : "null";

  t["biomarker_score"] = biomarker ? String(biomarker.score) : "0";
  t["biomarker_status"] = esc(biomarker?.status ?? "missing");
  t["biomarker_measured_count"] = biomarker ? formatNumber(biomarker.measured_count) : "0";
  t["biomarker_total_supported"] = biomarker ? formatNumber(biomarker.total_supported) : "0";
  t["biomarker_missing_priority"] = esc((biomarker?.missing_priority ?? []).slice(0, 6).join(", "));

  t["wearable_score"] = wearable ? String(wearable.score) : "0";
  t["wearable_status"] = esc(wearable?.status ?? "missing");
  t["wearable_measured_count"] = wearable ? formatNumber(wearable.measured_count) : "0";
  t["wearable_total_supported"] = wearable ? formatNumber(wearable.total_supported) : "0";
  t["wearable_missing_priority"] = esc((wearable?.missing_priority ?? []).slice(0, 6).join(", "));

  const biomarkerDomains = biomarker?.domains ?? [];
  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const domain = biomarkerDomains[i];
    t[`biomarker_domain_${idx}_name`] = esc(domain?.name ?? "");
    t[`biomarker_domain_${idx}_score`] = domain ? String(domain.score) : "0";
    t[`biomarker_domain_${idx}_status`] = esc(domain?.status ?? "missing");
    t[`biomarker_domain_${idx}_measured`] = domain ? String(domain.measured) : "0";
    t[`biomarker_domain_${idx}_findings`] = esc((domain?.top_findings?.length ? domain.top_findings : domain?.missing ?? []).slice(0, 3).join(", "));
  }

  const wearableDomains = wearable?.domains ?? [];
  for (let i = 0; i < 4; i++) {
    const idx = i + 1;
    const domain = wearableDomains[i];
    t[`wearable_domain_${idx}_name`] = esc(domain?.name ?? "");
    t[`wearable_domain_${idx}_score`] = domain ? String(domain.score) : "0";
    t[`wearable_domain_${idx}_status`] = esc(domain?.status ?? "missing");
    t[`wearable_domain_${idx}_measured`] = domain ? String(domain.measured) : "0";
    t[`wearable_domain_${idx}_findings`] = esc((domain?.top_findings?.length ? domain.top_findings : domain?.missing ?? []).slice(0, 3).join(", "));
  }
}

function fillCrossModalActionTokens(t: Record<string, string>, prefix: string, action?: CrossModalAction): void {
  t[`${prefix}_title`] = esc(action?.title ?? "");
  t[`${prefix}_priority`] = esc(action?.priority ?? "");
  t[`${prefix}_sources`] = esc(action?.source_modalities?.join(" + ") ?? "");
  t[`${prefix}_rationale`] = esc(action?.rationale ?? "");
  t[`${prefix}_next_step`] = esc(action?.next_step ?? "");
  t[`${prefix}_retest_window`] = esc(action?.retest_window ?? "");
}

function fillProtocolOverviewTokens(
  t: Record<string, string>,
  idx: number,
  p?: Protocol
): void {
  const base = `protocol_overview_${idx}`;
  if (!p) {
    t[`${base}_empty`] = "1";
    t[`${base}_tier`] = "";
    t[`${base}_title`] = "";
    t[`${base}_impact`] = "";
    t[`${base}_difficulty`] = "";
    t[`${base}_progress`] = "0";
    for (let i = 0; i < 4; i++) {
      const j = i + 1;
      t[`${base}_item_${j}_text`] = "";
      t[`${base}_item_${j}_status`] = "pending";
      t[`${base}_item_${j}_icon`] = "";
    }
    return;
  }
  t[`${base}_empty`] = "";
  t[`${base}_tier`] = esc(p.tier_label);
  t[`${base}_title`] = esc(p.title);
  t[`${base}_impact`] = esc(p.impact);
  t[`${base}_difficulty`] = esc(p.difficulty);
  t[`${base}_progress`] = String(p.progress_pct);

  const phases = p.phases || [];
  for (let i = 0; i < 4; i++) {
    const j = i + 1;
    const ph: ProtocolPhase | undefined = phases[i];
    t[`${base}_item_${j}_text`] = esc(ph?.check ?? "");
    t[`${base}_item_${j}_status`] = ph?.done ? "done" : "pending";
    t[`${base}_item_${j}_icon`] = ph?.done ? "\u2713" : "";
  }
}

function fillProtocolTokens(
  t: Record<string, string>,
  idx: number,
  p?: Protocol
): void {
  const base = `protocol_${idx}`;
  if (!p) {
    t[`${base}_empty`] = "1";
    t[`${base}_title`] = "";
    t[`${base}_impact`] = "";
    t[`${base}_difficulty`] = "";
    t[`${base}_duration`] = "";
    t[`${base}_progress`] = "0";
    for (let i = 0; i < 4; i++) {
      const j = i + 1;
      t[`${base}_phase_${j}_label`] = "";
      t[`${base}_phase_${j}_check`] = "";
      t[`${base}_phase_${j}_desc`] = "";
      t[`${base}_phase_${j}_status`] = "pending";
      t[`${base}_phase_${j}_icon`] = "";
      // Protocol 4 uses "step" naming
      t[`${base}_step_${j}_label`] = "";
      t[`${base}_step_${j}_check`] = "";
      t[`${base}_step_${j}_desc`] = "";
      t[`${base}_step_${j}_status`] = "pending";
    }
    return;
  }
  t[`${base}_empty`] = "";
  t[`${base}_title`] = esc(p.title);
  t[`${base}_impact`] = esc(p.impact);
  t[`${base}_difficulty`] = esc(p.difficulty);
  t[`${base}_duration`] = esc(p.duration);
  t[`${base}_progress`] = String(p.progress_pct);

  const phases = p.phases || [];
  for (let i = 0; i < 4; i++) {
    const j = i + 1;
    const ph: ProtocolPhase | undefined = phases[i];
    if (ph) {
      t[`${base}_phase_${j}_label`] = esc(ph.label);
      t[`${base}_phase_${j}_check`] = esc(ph.check);
      t[`${base}_phase_${j}_desc`] = esc(ph.desc);
      t[`${base}_phase_${j}_status`] = ph.done ? "done" : "pending";
      t[`${base}_phase_${j}_icon`] = ph.done ? "\u2713" : "";
      // Copy to step-named tokens for protocol 4 compatibility
      t[`${base}_step_${j}_label`] = esc(ph.label);
      t[`${base}_step_${j}_check`] = esc(ph.check);
      t[`${base}_step_${j}_desc`] = esc(ph.desc);
      t[`${base}_step_${j}_status`] = ph.done ? "done" : "pending";
    } else {
      t[`${base}_phase_${j}_label`] = "";
      t[`${base}_phase_${j}_check`] = "";
      t[`${base}_phase_${j}_desc`] = "";
      t[`${base}_phase_${j}_status`] = "pending";
      t[`${base}_phase_${j}_icon`] = "";
      t[`${base}_step_${j}_label`] = "";
      t[`${base}_step_${j}_check`] = "";
      t[`${base}_step_${j}_desc`] = "";
      t[`${base}_step_${j}_status`] = "pending";
    }
  }
}

function fillAncestryTokens(
  t: Record<string, string>,
  ancestry?: Ancestry
): void {
  if (!ancestry) {
    t["ancestry_empty"] = "1";
    t["y_dna"] = "";
    t["y_dna_detail"] = "";
    t["mt_dna"] = "";
    t["mt_dna_detail"] = "";
    t["neanderthal_pct"] = "";
    t["neanderthal_percentile"] = "";
    for (let i = 0; i < 4; i++) {
      t[`ancestry_comp_${i + 1}_region`] = "";
      t[`ancestry_comp_${i + 1}_pct`] = "";
    }
    return;
  }
  t["ancestry_empty"] = "";
  t["y_dna"] = esc(ancestry.y_dna);
  t["y_dna_detail"] = esc(ancestry.y_dna_detail);
  t["mt_dna"] = esc(ancestry.mt_dna);
  t["mt_dna_detail"] = esc(ancestry.mt_dna_detail);
  t["neanderthal_pct"] = String(ancestry.neanderthal_pct);
  t["neanderthal_percentile"] = String(ancestry.neanderthal_percentile);

  const comp = ancestry.composition || [];
  for (let i = 0; i < 4; i++) {
    const region = comp[i];
    t[`ancestry_comp_${i + 1}_region`] = esc(region?.region ?? "");
    t[`ancestry_comp_${i + 1}_pct`] = region != null ? String(region.pct) : "";
  }
}

// ── Build variant data JSON tokens (un-escaped, embedded in <script> tags) ──

function fillVariantDataTokens(
  t: Record<string, string>,
  variants?: GeneticVariantsSection,
  prsScores?: PRSScore[]
): void {
  if (variants) {
    const variantData = {
      genetic_conditions: variants.genetic_conditions || [],
      drug_response: variants.drug_response || [],
      other_risks: variants.other_risks || [],
      rare_mutations: variants.rare_mutations || [],
      uncommon_mutations: variants.uncommon_mutations || [],
    };
    const total =
      variantData.genetic_conditions.length +
      variantData.drug_response.length +
      variantData.other_risks.length +
      variantData.rare_mutations.length +
      variantData.uncommon_mutations.length;
    t["variant_data_json"] = JSON.stringify(variantData);
    t["variant_data_total"] = String(total);
    t["variant_genetic_conditions_count"] = String(variantData.genetic_conditions.length);
    t["variant_drug_response_count"] = String(variantData.drug_response.length);
    t["variant_other_risks_count"] = String(variantData.other_risks.length);
    t["variant_rare_mutations_count"] = String(variantData.rare_mutations.length);
    t["variant_uncommon_mutations_count"] = String(variantData.uncommon_mutations.length);
  } else {
    t["variant_data_json"] = '{"genetic_conditions":[],"drug_response":[],"other_risks":[],"rare_mutations":[],"uncommon_mutations":[]}';
    t["variant_data_total"] = "0";
    t["variant_genetic_conditions_count"] = "0";
    t["variant_drug_response_count"] = "0";
    t["variant_other_risks_count"] = "0";
    t["variant_rare_mutations_count"] = "0";
    t["variant_uncommon_mutations_count"] = "0";
  }

  if (prsScores && prsScores.length > 0) {
    t["prs_data_json"] = JSON.stringify(prsScores);
    for (let i = 0; i < prsScores.length; i++) {
      const idx = i + 1;
      const p = prsScores[i];
      const displayName = p.disease.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      t[`prs_${idx}_disease`] = esc(displayName);
      t[`prs_${idx}_risk_label`] = esc(p.riskLabel);
      t[`prs_${idx}_percentile`] = String(p.percentile);
      t[`prs_${idx}_description`] = esc(p.description);
      const labelToColor: Record<string, string> = {
        "Lower than average": "green", "Average": "blue",
        "Slightly elevated": "orange", "Elevated": "orange", "Significantly elevated": "red",
      };
      const labelToEmoji: Record<string, string> = {
        "Lower than average": "\u2B07", "Average": "\u2014",
        "Slightly elevated": "\u26A0", "Elevated": "\u26A0", "Significantly elevated": "\u2757",
      };
      t[`prs_${idx}_color`] = labelToColor[p.riskLabel] || "blue";
      t[`prs_${idx}_emoji`] = labelToEmoji[p.riskLabel] || "\u2014";
    }
  } else {
    t["prs_data_json"] = "[]";
  }
}

// ── Internal ──

/** Escape HTML-sensitive characters so template output is safe. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
