# Aperture Design System

Aperture is an AI-powered health platform that aggregates **genomics, biomarkers, and wearable data** into a single, calm, actionable picture of a person's health. This design system is the shared visual and component language for the Aperture **mobile app** and **web dashboard**.

The product is organized around five core pillars — **Sleep, Activity, Nutrition, Mindfulness, and Vitals** — and a set of signature interpretive tools: the **Heart Health Score**, **Vitals** (overnight biometrics vs. a personal baseline), **Daily Cardio Load**, the **Fitness Index**, the **Antioxidant Index** (nutrition), and the **AGEs Index** (metabolic aging).

> **Brand note:** No logo was provided in the source materials, so Aperture is set as a **typographic wordmark** (Fustat 800) plus a simple aperture glyph placeholder in chrome. Do not treat this as a final logo. See *Caveats*.

---

## Sources given

- `uploads/OMS Design System (1_1 with Figma)/` — a mature fintech design system, provided **as a component-breadth benchmark** (the level of component quality/coverage Aperture should match), **not** as a visual reference. Its Fustat + Geist Mono type files are reused here.
- Visual references (health-app category, soft/optimistic direction):
  `uploads/New-Samsung-Health-app-redesign-2026.jpg.webp`, `uploads/samsung-cardio.jpg`, `uploads/samsung-hearthealth.jpg`, `uploads/samsung-vitals.jpg`, `uploads/Samsung-Health-app-revamp-2-399w-864h.jpg.webp`. These informed the *category* aesthetic (rounded cards, big scores, color-coded domains, pastel gradients) — Aperture's identity is original, not a recreation of any third-party brand.

No Figma link or codebase was attached; all source material was local files.

---

## Index — what's in this folder

| Path | Purpose |
|---|---|
| `styles.css` | Global entry point — a list of `@import`s. **Consumers link only this file.** |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radii.css`, `elevation.css`, `motion.css`. |
| `fonts/` | `Fustat-VariableFont_wght.ttf` (UI + display), `GeistMono-VariableFont_wght.ttf` (data/numerics). |
| `components/` | React primitives, grouped by concern (see below). |
| `ui_kits/aperture-app/` | Mobile app recreation — 5 interactive screens. |
| `ui_kits/aperture-dashboard/` | Web dashboard recreation — sidebar + 5 views. |
| `SKILL.md` | Agent-Skills manifest for use in Claude Code. |
| `thumbnail.html` | Homepage tile for the design system. |

---

## Components

React function components (`export function <Name>`), styled entirely with the CSS custom properties. Namespace on the compiled bundle: `window.ApertureDesignSystem_<hash>`.

- **actions/** — `Button`, `IconButton`
- **layout/** — `Card`, `ListItem`, `TopBar`, `TabBar`, `Sidebar`
- **data/** (health data-viz) — `ScoreCard`, `MetricTile`, `ProgressRing`, `ActivityRing`, `RangeGauge`, `AreaChart`
- **feedback/** — `StatusPill`, `InsightBanner`, `Toast`, `Modal`
- **inputs/** — `Input`, `Switch`, `SegmentedControl`

Each directory has a `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and one `@dsCard` preview HTML.

### Intentional additions (no formal source-defined inventory)

The component list was authored to cover the health product surfaces rather than copied from a component library. Health-specific primitives — `ScoreCard`, `ProgressRing`, `ActivityRing`, `RangeGauge`, `InsightBanner`, `MetricTile` — exist because the five UI-kit screens require them (Heart Health Score, Energy Score, Daily Cardio Load, Vitals). General primitives (`Button`, `Card`, `Input`, `Switch`, `Modal`, `Toast`, …) mirror the breadth of the OMS benchmark.

---

## CONTENT FUNDAMENTALS

Aperture's voice is **warm, second-person, and coaching** — encouraging without being saccharine, and always grounded in the user's own data.

- **Second person, present-focused.** "Your recovery is trending up." "Your heart rate increased while HRV decreased."
- **Explain, then suggest.** Every insight states an observation, its likely cause, and one concrete, gentle action: *"…This can happen with stress, fatigue, or not enough rest. Slowing down may help your body settle."*
- **Sentence case everywhere** — titles, buttons, nav, pills. Proper nouns for the branded indices only: *Heart Health Score, Antioxidant Index, AGEs Index, Fitness Index, Daily Cardio Load*.
- **One optimistic exclamation is allowed** in a hero insight ("Incredible yesterday!") — used sparingly, never in clinical readouts, buttons, or biomarker copy.
- **No emoji.** Status is carried by color-coded pills and glyphs, never emoji.
- **Numbers are precise and unit-bearing.** `62 bpm`, `38 ms`, `6h 41m`, `LDL 128 mg/dL (range <100)`. Score bands are one word: *Excellent / Good / Fair / Needs attention*.
- **Button labels are verb-first:** "Log a reading", "Regenerate my plan", "Connect device", "View full lab report". Never "Get started!", "Learn more →".

### Examples

| String | Where |
|---|---|
| `Your recovery is trending up` | Overview insight title |
| `Heart signals under pressure` | Vitals insight headline |
| `2 out of range` | Vitals status |
| `Your heart health score is good. Vascular load is a critical part of your score…` | Heart Health Score description |
| `This week's focus: rebuild sleep consistency` | Action plan |

---

## VISUAL FOUNDATIONS

### Color
- **Brand accent: teal** (`--brand` = `#0EA5A0`). Used for links, selected nav, brand chips, progress, and the primary aura glow.
- **Primary CTA is ink** (`#171A1F`), not teal — a soft-modern health convention. Teal appears on the pressed state and on `brand`/`soft` buttons.
- **Health domains each own a hue:** Sleep = indigo, Activity = green, Nutrition = amber, Mindfulness = violet, Vitals = coral, Heart = rose. Every domain has a `-50` wash, `-500` core, `-700` text.
- **Score bands:** Excellent = teal, Good = green, Fair = amber, Needs attention = coral. Each has a matching soft background (`--score-*-bg`).
- **Neutrals** are a warm slate ramp. Text is `#171A1F`; the canvas is a warm off-white `#F4F6F7`; cards are pure white.

### Type
- **Fustat** for everything — friendly rounded humanist grotesque. Display/scores use weight 800; headings 700; body 400–500. **Geist Mono** for numeric values, ranges, and percentages (tabular figures).
- Tight display line-height (1.1) with `-0.02em` tracking on big numerals and headings; body at 1.45.
- Hero scores are large and confident (`--fs-score` = 56px); the number is always the loudest thing on a card.

### Backgrounds & gradients
- White cards on a warm off-white canvas. Content surfaces are never textured.
- **Signature soft gradients** (optimistic, low-saturation): `--grad-mesh` (cyan + lilac + cream mesh) behind the top-of-screen AI insight; `--grad-dawn` for the action-plan focus card; `--grad-vitality` (teal→indigo) for genetics/hero cards. Gradients are reserved for *featured* surfaces — most cards are plain white.

### Elevation
- Soft, diffuse, low-contrast shadows (`--shadow-card` for resting cards, `--shadow-raised`/`--shadow-pop` for the floating tab bar, modals, toasts).
- **Signature aura** (`--aura-teal`) — a wide, soft teal halo behind the single featured insight/index card per screen. Use once per view.
- No inner shadows, no hard drop shadows, no colored shadows beyond the teal aura.

### Shape & radius
- Chunky, friendly radii: chips 6px, badges 10px, buttons/inputs/list rows 14px, inner tiles 20px, content cards 26px, hero cards/sheets/modals 32px, pills/rings/avatars full.
- Pills are fully rounded; the mobile tab bar is a floating full-radius pill.

### Motion
- Calm: 120ms hover, 200ms base, 320ms modal/sheet entry, ~900ms ring-fill sweep. `--ease-out` (gentle) for appearance; **no bounce, no spring, no parallax.** Rings fill by animating `stroke-dasharray`.

### Interaction states
- **Hover:** cards lift 2px + gain `--shadow-card`; buttons step to a darker fill; nav rows gain a soft wash. Never opacity-only.
- **Press:** teal takes over on buttons (`--brand-active`); no scale-shrink.
- **Focus:** 3px teal `--focus-ring` halo on inputs; brand-tinted selected states on tabs/nav.

### Borders
- Hairline `--border-subtle` (`#ECEEF1`) on white cards; `--border-default` on inputs; `--border-brand` + focus ring when active. Domain/score-tone cards use no visible border (the wash carries them).

### Layout
- 4px base grid. Mobile canvas ≈402px with 18–20px gutters and a floating bottom tab bar. Desktop: 248px sidebar + 64px top bar; content max-width 1120px, 14–18px grid gaps.

---

## ICONOGRAPHY

Aperture uses **Lucide** (line icons, ~1.75–2px stroke, `currentColor`) as its icon system, loaded from CDN (`unpkg.com/lucide`). Icons are rendered as `<i data-lucide="name">` and hydrated with `lucide.createIcons()`.

- Standard sizes: 16 (inline), 18–20 (buttons, list chips, nav), 22 (headers), and larger for feature glyphs.
- Domain association is by **color**, not by swapping icon families: a `heart` glyph on a coral chip = vitals; on a rose chip = heart health.
- **No emoji, no unicode-as-icon.** Health status is a colored `StatusPill` or a tinted icon chip.
- Common glyphs: `moon` (sleep), `footprints`/`activity`/`flame` (activity), `apple`/`utensils` (nutrition), `brain` (mindfulness), `heart`/`heart-pulse` (vitals & heart), `dna` (genetics), `flask-conical` (biomarkers), `watch` (wearables), `target` (action plan), `sparkles` (AI).

We did **not** vendor individual Lucide SVGs (200+ in use, CDN-available). Custom glyphs, if ever needed, go in `assets/icons/` with `stroke="currentColor"`.

---

## Caveats / known substitutions

- **Fonts:** Fustat + Geist Mono are reused from the OMS source rather than newly chosen — both are soft rounded/technical faces that fit the "soft & optimistic" brief. If you want a bespoke display face for scores, flag it.
- **No brand logo** was provided; the wordmark is typographic and the sidebar mark uses a Lucide `aperture` glyph as a placeholder. Provide a real mark to replace it.
- **Accent color** was chosen as teal (`#0EA5A0`) from the picker; easy to reskin via `--brand` + `--teal-*` if you prefer the indigo option.
- **Foundation specimen cards** (Colors/Type/Spacing/Brand groups in the Design System tab) are **not yet built** — only the 5 component-group cards and the 2 UI-kit cards are registered. This is the top open item.
- All health data in the UI kits is **fictional sample data** (`ui_kits/aperture-app/app-data.js`).

---

## Quick start

```html
<link rel="stylesheet" href="/styles.css">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script src="/_ds_bundle.js"></script>
<script>
  const { ScoreCard, Card, StatusPill } = window.ApertureDesignSystem_6066d1;
</script>
```
