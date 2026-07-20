# OMS Design System — Skill

When a user invokes this skill, build artifacts that look like they belong inside the **OMS (Onchain Money System)** — Polygon's stablecoin / treasury product. Match the visual vocabulary precisely.

## Core principles
- **Brand purple `#670DE5` is sparing.** Use it for primary CTAs, info accents, focused links — not for backgrounds, large fills, or decoration. Most surfaces are white-on-slate-50.
- **Slate-950 (`#090624`) is the workhorse for primary buttons and hero CTAs.** Purple is the brand colour, but slate-950 wins on the click target itself; purple shows up around it (focus ring, hover, link text).
- **Generous radii.** Cards 16–24px, buttons/inputs 12px (10px at md, 8px at sm), pills 999px. Avoid sharp corners.
- **Fustat for everything in product UI.** Bold (700) for display + buttons + emphasis; Medium (500) is the body weight. Inter is for documentation contexts (Figma docs, dev-facing copy). Geist appears in long descriptive blocks.
- **No emoji. No gradient backgrounds. No left-border-accent containers.** This is a financial product — restraint reads as trust.
- **Tabular numerals on every dollar value, basis point, and quantity.** `font-variant-numeric: tabular-nums`.

## Always start by importing
```html
<link rel="stylesheet" href="colors_and_type.css">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```
Then call `lucide.createIcons()` after DOM ready. Icons should be 14–18px, stroked, never filled.

## Token reference (use the variable, never the raw hex)

### Colors
- **Light mode only.** Do not introduce dark surfaces, dark sidebars, or inverse panels.
- Brand: `--brand` / `--purple-500` (#670DE5). Hover `--link-hover` / `--purple-600`. Surface tint `--purple-50`. Border `--purple-200`. Focus ring `--ring` / `--purple-300`.
- Neutrals: `--slate-50` (page bg), `--slate-200` (borders), `--slate-500` (secondary text), `--slate-900` (#141635 primary text), `--slate-950` (#090624 primary CTA bg).
- Semantic: pair the surface with its border + foreground.
  - info → `--bg-info` / `--border-info` / `--fg-info`
  - success → emerald-50/200/700 via `--bg-success` etc.
  - warning → orange-50/200/700
  - danger → red-50/200/700
- Foreground hierarchy: `--fg-primary` → `--fg-secondary` → `--fg-tertiary` → `--fg-disabled`.

### Type
Use the prebuilt classes from `colors_and_type.css`:
- Display: `t-h1` 48 → `t-h2` 40 → `t-h3` 32 → `t-h4` 28 → `t-h5` 24, all Fustat 700, line-height 1.2.
- Body: `t-body1` 20 → `t-body5` 12, Fustat 500. Each has a `-bold` 700 partner.

### Spacing & radii
- 4-pt baseline. Tokens `--space-1` (4) through `--space-16` (64) plus `-20`/`-24`/`-32`.
- Radii: `--r-xs` 4 / `--r-sm` 6 / `--r-md` 8 / `--r-lg` 12 / `--r-xl` 16 / `--r-2xl` 24 / `--r-pill`.

### Radii (component-level rules)
- Button lg → 12 (`--radius-button-lg`)
- Button md / sm → 8 (`--radius-button`)
- Badge → 16 (`--radius-badge`)
- Card · Modal · Popover → 24 (`--radius-card` / `--radius-modal` / `--radius-popover`)
- Context menu → 16 (`--radius-menu`)
Elevation is reserved for transient overlays only. Cards, panels, buttons, and inputs are flat — separated by borders (`--slate-200`), not shadow.
- `--shadow-popover` — menus, tooltips, date pickers.
- `--shadow-modal` — dialogs.
- `--shadow-drawer` — side sheets.

## Components — recipes

### Primary button
```html
<button style="background:var(--btn-primary-bg); color:#fff; border-radius:12px; height:40px; padding:8px 16px;
  font-family:var(--font-display); font-weight:700; font-size:16px;">Button</button>
```
Hover → `--btn-primary-bg-hover` (purple-700). Focus → keep bg, add `box-shadow: 0 0 0 2px var(--purple-300)`. Disabled → `--slate-200` bg, `--slate-400` text.

### Input
40px tall, 12px radius, `--slate-300` border on white. Focus: border `--slate-500` + `0 0 0 2px var(--purple-300)` ring. Error: `--red-400` border + `--red-200` ring. Always ship a label above and helper text below in `--font-doc` 11px.

### Badge / status
3px × 10px padding, 999px radius, Fustat 500 12px. Always a colored 6px dot when used in tables; the dot lives in its own narrow column to keep names left-aligned.

### Alert
Inline messaging — 12px × 16px padding, 12px radius, 1px tonal border, icon top-aligned. Title (Fustat 700 14) + description (Fustat 500 13) stacked in a column.

### Toast
2xl radius (24px), white surface, `--shadow-popover`, 16px × 20px padding, semantic icon left, close × right. Lives bottom-right.

### Card / panel
White, 1px `--slate-200` border, 16–24px radius. Flat — no shadow. Section headers go inside a 14×18 toolbar bordered on the bottom; content fills the remainder.

### Table
- Header row: `--slate-50` background, 1px `--slate-200` bottom border, doc font 11px UPPERCASE, secondary color.
- Cells: 12×18 padding, 14px Fustat. Mono columns (addresses, timestamps) use `'Geist', monospace` 13 in `--fg-secondary`.
- Row hover: `--slate-50`.

## Layout patterns
- **App shell:** 240px white sidebar with 1px right border + flex main on `--slate-50`. Nav items 8×12 padding, 10px radius. Active item uses `--purple-50` bg + `--purple-700` text.
- **Page header:** Breadcrumb (doc font 11) → H1 (32, Fustat 700, letter-spacing -0.01em) → lede (Fustat 500 15, secondary). Actions float right, baseline-aligned with the H1.
- **Stats row:** 4-up grid. Label (doc 11 uppercase) → value (Fustat 700 26) → delta (Fustat 500 12, semantic colored).

## Reference screen
`screens/senders_dashboard.html` shows the system applied end-to-end (sidebar + page header + stats + banner + filterable table). Use it as the visual yardstick when building new screens.

## Don'ts
- Don't introduce new color hexes; extend by reaching for an existing scale step.
- Don't put purple on backgrounds larger than a small badge or `--purple-50` info surface.
- Don't render currency or counts in proportional figures — always tabular nums.
- Don't switch font families mid-component. Pick one face per surface.
- Don't add decorative iconography. Icons earn their place by labeling an action or tagging a state.
