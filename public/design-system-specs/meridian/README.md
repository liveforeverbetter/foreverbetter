# Meridian Design System

Meridian is the design system for a **gamified health & longevity product** — a 24/7 wellness platform that surfaces multimodal data (genetic, biomarker, wearable) alongside personalized coaching. It helps people understand how they **sleep, train, and feel**, and nudges them to move their long-term health baseline. The surface is a dark, data-forward mobile app + dashboard organized around a handful of signature ideas: **circular metric rings** (Sleep · Recovery · Strain), **gamified plans and journals**, and a **longevity / bio-age hero**.

> **Brand note — original identity.** No company name or logo was supplied (the product is meant to be re-skinned per customer). "Meridian", its wordmark, and the concentric-ring mark in `assets/` are an **original placeholder identity** created for this system — not a real company's brand. Swap `assets/logo-*.svg` and the `--brand` token to re-skin. See *Caveats*.

## Sources

- **Reference spec (breadth):** the attached **OMS Design System** (`uploads/OMS Design System (1_1 with Figma)/`) — a fintech dashboard system used only as a checklist for component coverage (buttons, inputs, table, modal, drawer, toast, tooltip, etc.). None of its purple/slate visuals or fintech content were carried over.
- **Visual reference (domain):** wearable health-dashboard screenshots (`uploads/whoopreference.webp`, `uploads/whoop-age-update-…webp`) — used as high-level guidance for the rings row, insight strips, gamified plan, and healthspan orb. Meridian re-expresses these patterns in its own brand; no third-party assets, marks, or copy were copied.
- **Typography spec:** Proxima Nova single-family system (provided in the brief). The system now ships **Metropolis** (Chris Simpson / dw5) as the display face, per request. See *Caveats*.

---

## Index — what's in this folder

| Path | Purpose |
|---|---|
| `styles.css` | Global entry point — `@import`s all token files. **Consumers link this one file.** |
| `tokens/` | `colors.css`, `typography.css`, `spacing.css`, `effects.css`, `fonts.css` — all CSS custom properties + keyframes. |
| `assets/` | `logo-mark.svg`, `logo-wordmark.svg` (original placeholder identity). |
| `components/` | React primitives, grouped: `core/`, `forms/`, `navigation/`, `feedback/`, `health/`. |
| `guidelines/` | Foundation specimen cards (Colors, Type, Spacing, Brand) for the Design System tab. |
| `ui_kits/app/` | Interactive mobile app recreation (sign-in → Today → Plan → Healthspan). |
| `SKILL.md` | Agent-Skill manifest for use in Claude Code. |
| `thumbnail.html` | Homepage tile. |

### Components (public API — `window.MeridianDesignSystem_0f3f3a`)

- **core:** `Button`, `IconButton`, `Icon`, `Badge`, `Card` + `CardHeader`, `Avatar`, `Separator`
- **forms:** `Input`, `Select`, `Checkbox`, `Radio` + `RadioGroup`, `Switch`, `Slider`, `CodeInput`
- **navigation:** `TabBar`, `TopNav`, `Sidebar`, `ListItem`, `MenuItem`, `Tabs`
- **feedback:** `Modal`, `Drawer`, `Toast` + `StatusGlyph`, `StatusBanner`, `Tooltip`, `EmptyState`, `Spinner` / `Skeleton` / `Loader`, `ContextMenu`, `ProgressBar`
- **health (domain):** `MetricRing`, `MetricCard`, `StatTile`, `ActivityRow`, `InsightCard`, `JournalWeek`, `PlanItem`, `HealthspanOrb`
- **charts:** `TrendChart`, `Sparkline`
- **bio (domain):** `RangeBar`, `BiomarkerRow`, `BiomarkerPanel`, `GeneCard`, `GenotypeChip`, `RiskMeter`

---

## CONTENT FUNDAMENTALS

Meridian's voice is **second-person, evidence-led, and quietly encouraging** — a knowledgeable coach, never a cheerleader or a clinician.

- **Second person.** "Your HRV is 7% lower than usual." "Know your body." The product speaks *to you* about *your* data.
- **Cause → effect, with real numbers.** Every insight states the evidence then the meaning: *"Your HRV is 7% lower than usual, landing you a yellow Recovery."* Percentages and figures are precise and tabular; times are exact ("11:47 PM", "6:37").
- **Encouraging, grounded framing.** Progress is celebrated without hype: *"9.2 years younger"*, *"Keep an eye on this trend, but celebrate the progress you've been making."* Yellow/low states are explained calmly, never alarmingly.
- **Casing.** Screen titles and headings are **Title-ish sentence case** ("My Plan", "Tonight's Sleep"). Metric labels, eyebrows, tab labels and plan headers are **UPPERCASE** with +0.1em tracking ("SLEEP", "TODAY'S ACTIVITIES", "CUSTOM PLAN"). Body copy is sentence case.
- **Verb-first actions.** Buttons say `Start activity`, `Add activity`, `Set alarm`, `View my plan` — never "Get started!" or "Learn more →".
- **No emoji, no exclamation spam.** Status is carried by color-coded rings and glyphs, not emoji. Tone is confident and calm.

**Voice examples**

| ✅ Meridian | ❌ Off-brand |
|---|---|
| "Your HRV is 7% lower than usual, landing you a yellow Recovery." | "Uh oh, your recovery tanked 😬" |
| "9.2 years younger" | "You CRUSHED it!! 🔥" |
| "Set alarm" | "Let's get you some rest!" |
| "Within range · 5/5 metrics" | "Everything looks great!!!" |

---

## VISUAL FOUNDATIONS

### Color
- **Canvas is near-black.** Page `#07090C`, cards `#12161C`, raised `#171C24`, overlays `#171C24`. A 16-step **ink** neutral scale runs from `#050608` to `#EDF0F3`. Surfaces are never tinted — depth comes from the ink steps + hairline borders, not color.
- **Brand is electric mint** `#12D982` (`--brand`, from the recovery-green lineage). It carries primary CTAs, progress, selected states, links and the mark. Used with restraint on the dark field so it reads as energy.
- **Performance channels** are the data palette: Recovery `#34E08A` (green), Strain `#3BB6F5` (blue), Sleep `#8A9BFF` (indigo), Stress `#FFD23F` (amber). Recovery additionally uses a green/amber/red traffic-light for high/medium/low.
- **Status:** success green, warning amber, danger red, info blue — each a bright `*-400` foreground over a ~12%-opacity tinted background.
- **Text:** primary `#F4F7FA`, secondary `#9AA4B0`, tertiary `#6B7480`, disabled `#454E59`.

### Type
- **Single family — Metropolis**, weights 400/500/600/700. One geometric family covers 13px captions up to 120px display.
- **Signature tracking compression:** display/hero/title tighten to **-0.04em** (down to -4.8px at 120px), making oversized numbers feel *carved*; body sits at neutral tracking; uppercase eyebrows and nav open up to **+0.10em**.
- **Line-height tightens as size grows:** 0.71 at 120 → 0.80 at 50 → 1.0 at 35 → 1.09 at 32 → 1.13 at 24 → ~1.3 at 19–20 → 1.33 at 16 → 1.5–1.59 at 14–15.
- **All data uses tabular figures** (`font-variant-numeric: tabular-nums`).

### Backgrounds & imagery
- Flat near-black surfaces; **no photography, no textures.** The only "imagery" is generated data-viz: the **metric rings** and the **healthspan orb** (a radial glow with scattered particle dots). Signature gradients are `--grad-brand` (mint→blue, for CTAs/mark), `--grad-premium` (violet→pink, for pro/customize), and `--grad-orb` (the longevity glow). Gradients appear only on brand/energy moments, never on content surfaces.

### Depth, borders & radii
- **Borders** are hairline whites: subtle `rgba(255,255,255,0.06)`, default `.10`, strong `.16`. Dividers `.07`.
- **Elevation** is ambient dark shadow (`--shadow-card` → `--shadow-overlay` → `--shadow-pop`); cards mostly rely on border, overlays get shadow. Live metrics get **colored glows** (`--glow-recovery/strain/sleep/brand`) instead of shadow.
- **Radii:** xs 4 · sm 8 · md 12 · lg 16 · xl 20 · 2xl 28 · pill. Buttons sm/md use 8, lg 12; cards 16; modals/drawers 28; badges/toggles pill.
- **Cards:** dark surface, hairline border, 16px radius, 16–24px padding. Flat by default; interactive cards lift 2px on hover.

### Motion & states
- **Easing:** `--ease-out` (0.16,1,0.3,1) for most transitions; `--ease-spring` for toggle thumbs; ring fills sweep over ~900ms.
- **Durations:** 120ms hover, 200ms base, 320ms overlays.
- **Hover:** darker/lighter fill step or stronger border — never opacity-only. **Press:** brand-press color step, no scale-shrink. **Focus:** 3px mint focus ring (`--focus-ring`).
- Fades and slides only; no bounce/parallax. Only the healthspan orb gently drifts (scale/opacity loop).

### Layout
- Mobile-first. Bottom **TabBar** 80px with a floating brand orb; **TopNav** 64px with a centered date stepper. Desktop **Sidebar** 248px (mini 76px). 4px spacing grid; card gutters 18–20px; container max 1280px.

---

## ICONOGRAPHY

Meridian uses **Lucide** as its icon system (matching the reference system's convention). Icons inherit `currentColor` at a **1.75px stroke**, sizes 16 (inline) / 18–20 (buttons, rows) / 22–24 (nav).

- The **`Icon`** component (`components/core/Icon.jsx`) is a thin wrapper — pass a Lucide name (`heart-pulse`, `moon`, `activity`, `zap`, `flame`, `bed`, `footprints`, `trending-up`, `plus`, `chevron-right`, `sparkles`, `sun`, `brain`, `mail`, `fingerprint`, …).
- **Requires the Lucide UMD script** on the page: `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>`. Cards and the UI kit load it already.
- A few glyphs are drawn inline where they are structural rather than iconographic: the metric-ring arcs, the tab-bar nav glyphs, and status glyphs (`check`/`alert`/`info` in `Toast`/`StatusBanner`).
- **No emoji, ever.** Status is color + glyph. **No PNG icons** — everything is stroked SVG via Lucide or `currentColor` inline SVG.

---

## Quick start

```html
<link rel="stylesheet" href="/styles.css">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script src="/_ds_bundle.js"></script>
<style>body{background:var(--surface-page);color:var(--text-primary);font-family:var(--font-sans)}</style>
<script>
  const { MetricRing, Button } = window.MeridianDesignSystem_0f3f3a;
  // <MetricRing channel="recovery" value={65} unit="%" label="Recovery" />
</script>
```

---

## Caveats / known substitutions

- **Font — Metropolis via CDN.** Proxima Nova was requested but not supplied; the system now ships **Metropolis** (the geometric sans by Chris Simpson), served from the archived `dw5/Metropolis` repo through the jsDelivr GitHub CDN in `tokens/fonts.css` (weights 400/500/600/700, woff2 with woff fallback). To fully self-host, drop the `.woff2` files into `assets/fonts/` and repoint the `src` url()s. The whole scale and tracking is tuned for a geometric sans, so Proxima Nova can be swapped back in the same way if you license it.
- **Original brand identity.** The "Meridian" name, wordmark, and ring mark are placeholders — no real logo was provided. Do not treat them as a real company's brand.
- **Lucide via CDN.** Icons are not vendored; the Lucide UMD script must be present (as in all cards/kits).
- **UI kit is cosmetic.** `ui_kits/app` is a prototype recreation — static data, stubbed drill-downs.
- **Health-domain components** (`MetricRing`, `HealthspanOrb`, etc.) are intentional additions beyond the reference spec's inventory, required to express the wearable-health product. Listed here so consumers know they're Meridian-specific.
