import assert from "node:assert/strict";
import { test } from "node:test";
import {
  listDesignSystems,
  getDesignSystem,
} from "../src/core/design-systems.js";

test("lists design systems with summaries", () => {
  const list = listDesignSystems();
  assert.equal(list.count, 3);
  assert.deepEqual(
    list.systems.map((system) => system.id),
    ["foreverbetter", "aperture", "meridian"],
  );
  assert.ok(
    list.systems.every((s) => s.id && s.name && s.inspired_by && s.vibe)
  );
  assert.match(list.note, /Three curated, production-ready/i);
});

test("returns full tokens and a generated DESIGN.md for a system", () => {
  const system = getDesignSystem("aperture");
  assert.ok(system, "aperture should exist");
  assert.equal(system!.inspired_by, "Aperture Design System handoff");
  // Structured tokens present.
  assert.match(system!.colors.background, /^#|rgb|linear-gradient/);
  assert.ok(system!.typography.scale.display.size);
  assert.ok(
    Array.isArray(system!.colors.data_viz) &&
      system!.colors.data_viz.length >= 3
  );
  assert.ok(Array.isArray(system!.spacing.scale_px));
  assert.ok(system!.components.aperture_action_card);
  // Layout identity: each system renders a structurally distinct dashboard.
  assert.equal(system!.layout?.hero, "aperture-overview");
  assert.ok(system!.layout?.voice && system!.layout?.score_word);
  assert.ok(
    Array.isArray(system!.layout?.sections) &&
      system!.layout!.sections.length > 0
  );
  // DESIGN.md is generated from the tokens and preserves its handoff source.
  assert.match(system!.design_md, /# Aperture/);
  assert.match(system!.design_md, /## Color/);
  assert.match(system!.design_md, /Layout:/);
  assert.match(system!.design_md, /user-provided Aperture handoff/i);
});

test("every design system carries a distinct layout", () => {
  const list = listDesignSystems();
  const heroes = list.systems.map((s) => (s as any).layout?.hero);
  assert.ok(heroes.every(Boolean), "all systems have a layout hero");
  assert.equal(
    new Set(heroes).size,
    list.systems.length,
    "each hero component is unique"
  );
});

test("every visual system preserves the full multimodal contract", () => {
  const list = listDesignSystems();
  for (const summary of list.systems) {
    const system = getDesignSystem(summary.id)!;
    assert.equal(
      system.modality_sections?.length,
      4,
      `${summary.id} should expose all four modalities`
    );
    assert.ok(
      system.metrics && system.metrics.length >= 10,
      `${summary.id} should expose a complete metric vocabulary`
    );
    assert.ok(
      system.animations && system.animations.length >= 4,
      `${summary.id} should expose motion guidance`
    );
    assert.ok(
      system.action_plan?.stages.some((stage) => stage.startsWith("FOCUS")),
      `${summary.id} should expose an action plan`
    );
    assert.ok(
      system.data_capture?.provenance_fields.includes("synced_at"),
      `${summary.id} should preserve provenance`
    );
  }
});

test("unknown system id returns undefined", () => {
  assert.equal(getDesignSystem("does-not-exist"), undefined);
});

test("removed systems cannot be queried", () => {
  for (const id of [
    "ring-data",
    "performance",
    "apex",
    "clinical-modern",
    "metabolic",
    "system-cards",
    "serene",
  ]) {
    assert.equal(getDesignSystem(id), undefined, `${id} should not be public`);
  }
});

test("Aperture handoff is queryable as a calm, source-aware health design", () => {
  const system = getDesignSystem("aperture")!;
  assert.equal(system.layout?.hero, "aperture-overview");
  assert.equal(system.colors.primary, "#0EA5A0");
  assert.match(system.typography.font_display, /Fustat/);
  assert.match(system.typography.font_mono!, /Geist Mono/);
  assert.ok(system.components.aperture_insight_banner);
  assert.ok(system.components.aperture_energy_score);
  assert.ok(
    system.metrics!.some(
      (metric) =>
        metric.id === "energy_score" &&
        metric.preferred_visual === "aperture_energy_score",
    ),
  );
  assert.deepEqual(
    system.modality_sections!.map((section) => section.modality),
    ["wearables", "biomarkers", "genetics", "health-context"],
  );
  assert.ok(
    system.animations!.some((animation) => animation.id === "aperture-ring-sweep"),
  );
  assert.match(system.design_md, /user-provided Aperture Design System handoff/i);
});
