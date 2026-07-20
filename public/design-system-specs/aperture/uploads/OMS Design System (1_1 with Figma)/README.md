# OMS Design System

A 1:1 recreation of the OMS Design System Figma file. OMS is the product surface for **OMSX** — a sandboxed financial product where users register senders, create deposit addresses, monitor activity, and convert funds. The design system is purple-led (`#670DE5`), built on a slate neutral scale, and uses **Fustat** for the product UI with **Inter** and **Geist** as documentation faces.

> **Source of truth:** the OMS Design System Figma file (provided as a virtual filesystem). 28 pages: Cover, Foundations, Colours, Typography, Icons, Buttons, Alerts, Navigation, Input, Badges, Table, Separator, Checkbox, Radio, Customer-profile, Cards, List-item, Empty-state, Scroll-area, Area-chart, Analytics, Tooltip, Context-menu, Toast, Modal, Drawer, Governance.

---

## Index — what's in this folder

| File / folder | Purpose |
|---|---|
| `colors_and_type.css` | Primitive + semantic CSS variables, type classes, motion, radii, shadow tokens. **Always import this first.** |
| `fonts/` | `Fustat-VariableFont_wght.ttf` — the product face. |
| `assets/` | Logos (`logo-mark.svg`, `logo-stacked.svg`) and brand artwork. |
| `preview/` | Cards rendered into the project's Design System tab. |
| `ui_kits/oms/` | High-fidelity HTML+JSX recreation of the OMS dashboard surface. |
| `SKILL.md` | Skill manifest — describes how to use this system in Claude Code. |

---

## Product context

OMS is an enterprise-grade dashboard for managing fund flows. Surfaces seen in the Figma file:

- **Customer profile** (KYB-style screen with sections, lists, and a side metadata column)
- **Analytics & area-charts** (purple-led data viz on a slate canvas)
- **Tables with filters** (large data tables with sticky filter chips and pagination)
- **Modals + drawers** (forms, multi-step flows, governance/approval flows)
- **Empty states**, **toasts**, **tooltips**, **context menus**

Two environments are surfaced in chrome: **Sandbox** and **Live**. The sandbox toggle is a soft purple-gradient pill; the global banner ("You are testing OMSX capabilities in a sandbox environment") sits beneath the top nav.

---

## CONTENT FUNDAMENTALS

OMS copy is **functional, second-person, and evidence-led**. There is no marketing voice in the product — every string is doing a job.

### Voice

- **Second person, plural where the product takes responsibility.** "You are testing OMSX capabilities…", "Senders must be registered before sending funds…"
- **Action-led labels.** Buttons say `Documentation`, `Save`, `Cancel`, `Create deposit address` — verbs and nouns, never CTA-speak ("Get started!", "Learn more →").
- **Plain conditional explanations.** "Only registered senders will be converted." Cause → effect, no hedging.
- **Sentence case, always.** Titles, buttons, menu items, table headers — sentence case throughout. No Title Case, no ALL CAPS except the optional eyebrow on a section header.
- **No exclamation marks. No emoji.** The product is a financial tool; tone is calm and authoritative.
- **Numbers are precise.** Currency uses the explicit unit; percentages get one decimal; addresses are truncated with an ellipsis or copy affordance, never paraphrased.

### Examples (verbatim from the Figma)

| String | Where | Notes |
|---|---|---|
| `Sandbox mode` | Global banner | Two words, sentence case. |
| `You are testing OMSX capabilities in a sandbox environment` | Global banner | Statement of fact, no period. |
| `Create deposit address` | Modal title | Imperative + noun phrase. |
| `Step 1: Sender information` | Modal subtitle | Numeric step, colon, noun phrase. |
| `Senders must be registered before sending funds to your deposit address. Only registered senders will be converted.` | Inline warning | Two short declarative sentences. |
| `Toasts provide brief, non-blocking feedback…` | Toast component description | Neutral, definitional documentation tone. |

### Tone don'ts

- ❌ "Let's get you set up!" → ✅ "Create deposit address"
- ❌ "Oops, something went wrong" → ✅ "We couldn't save this. Try again or contact support."
- ❌ "🎉 Success!" → ✅ "Saved"
- ❌ "Click here to learn more" → ✅ `Documentation` (link, capital D)

---

## VISUAL FOUNDATIONS

### Colors

- **Brand:** `#670DE5` (`--purple-500`). Used sparingly — for links, progress, selected states, key icon flourishes, focus rings (via `--purple-300`). Brand purple does **not** carry primary CTAs.
- **Primary CTA:** near-black `#090624` (`--slate-950`). Hover → `--slate-800`. Active/pressed → `--purple-600`. The pressed state is the only place purple takes over.
- **Neutrals:** an 11-step slate scale from `#F6F6FC` (slate-50) to `#090624` (slate-950). Body text is `slate-900` (`#141635`); secondary text is `slate-500`; placeholders / disabled use slate-300/400.
- **Semantic:** purple = info, emerald = success, amber/orange = warning, red = danger. Each has a `*-50` background and a `*-600/700` foreground. Inverted variants flip them.
- **Surfaces are white.** Page background, cards, modals, toasts — all `#FFFFFF` on a `slate-50` page wash, never tinted. Dark surfaces (sidebar navigation in dark mode, inverse toasts) use `slate-900`.

### Type

- **Fustat** for the product UI (Medium 500, Bold 700). Headings use Bold; running labels use Medium. Body sizes step 12 / 14 / 16 / 18 / 20; headings 24 / 28 / 32 / 40 / 48. Line-height is `1.2` across the board — tight, no exceptions.
- **Inter** drives Figma-side documentation and the H1 covers. **Geist** appears in component description blocks (like a code-doc face).
- **No italics.** No small caps. No letter-spacing tricks except a tiny `-0.01em` on H1/H2.

### Backgrounds

- White page, white cards. **No textures, no gradients on content surfaces.**
- One signature gradient: a vertical `linear-gradient(#EAE4F5 → #F6F3FB)` used for the sandbox-mode global banner and the sandbox/live toggle pill in the sidebar. It's the only place gradients appear.
- Dashed `1px dashed #8A38F5` borders mark spec slots in Figma docs — they're a Figma convention, not a product UI element.

### Borders & strokes

- Default border: `1px solid #C8CFE1` (slate-300).
- Search/input idle border: `slate-200`. Active: `slate-300` with a `purple-300` focus ring (2px outer).
- Semantic borders use the matching `*-200` swatch.
- Dividers: `1px solid rgba(0,0,0,0.05)` — almost invisible.

### Corner radii

- `4px` — small inline accents, swatch chips
- `6–8px` — buttons, inputs, swatch cards, badges
- `12px` — primary CTA buttons, key surfaces
- `24px` — modals, toasts, sandbox/live pill, large cards
- Radius **does not vary by size** within a component family — a small button and a large button share `12px`.

### Shadows

Two-stop ambient shadows, never harsh:

- **Card resting:** `0 4px 6px -2px rgba(16,24,40,0.03), 0 12px 16px -4px rgba(16,24,40,0.08)`
- **Pop / overlay (toast, modal, popover):** `0 4px 6px -4px rgba(0,0,0,0.10), 0 10px 15px -3px rgba(0,0,0,0.10)`
- **Subtle button lift:** `0 1px 2px 0 rgba(0,0,0,0.05)`

No coloured shadows, no inner shadows, no glow.

### Buttons

- **Primary** — `slate-950` fill, white label. Fustat 700 / 16. 8px V padding, 12px H, `radius-lg` (12). Default size 40px tall (lg).
- **Secondary** — white fill, `slate-500` border, slate-900 label. Hover thickens border to slate-950. Active → `purple-100` fill + `purple-200` border.
- **Danger primary** — `red-600` fill, white label. Hover → `red-500`. Active → `red-800`.
- **Danger secondary** — white fill, `red-800` border, red-700 label.
- Disabled: slate-300 fill / slate-400 label across all variants.
- Focus ring: 2px `purple-300` halo.

### Hover & press

- **Hover:** lift via stronger border (slate-300 → slate-950) or a darker fill step. Never opacity changes alone.
- **Press / active:** the brand purple appears — purple-100 backgrounds, purple-600 borders, never a `transform: scale()` shrink.
- **Focus:** always a 2px purple-300 ring + radius match. Keyboard-only via `:focus-visible`.

### Cards

- White surface, `radius-md` (8px) for swatch / data cards, `radius-2xl` (24px) for content cards.
- Border `1px solid slate-200`. Flat — shadow is reserved for popovers, modals, and drawers.
- Internal padding: 16 / 20 / 24 depending on density.

### Layout rules

- 4px base grid. Container gutters 64px on the desktop docs canvas, 24/16 in product chrome.
- Sidebar 240px wide (desktop). Top nav 64px tall, gutters 36px.
- Modal: 400×~600 desktop, bottom-sheet on mobile (rounded top corners only).
- Drawer: right-anchored, full height, slides in.

### Motion

- 200ms ease-out for most appearance/disappearance.
- 320ms for drawer/modal entry.
- No bounce, no spring overshoot, no parallax. **Fades and slides only.**
- Hover transitions are 120ms.

### Iconography

See ICONOGRAPHY below.

### Imagery / illustration

The Figma file contains no full-bleed product photography. Imagery is constrained to:

- The OMS polygon mark (a folded-ribbon glyph extracted to `assets/logo-mark.svg`)
- Avatars (placeholder portraits, circular, ~36–40px in chrome)
- Empty-state illustrations (line illustrations on a slate-50 plate — preserved as Figma vectors)

No photography, no 3D, no AI-generated decoration.

---

## ICONOGRAPHY

OMS uses **Lucide** as its icon system — every icon in the Figma file is a Lucide glyph (`Lucide Icons / plus`, `Lucide Icons / x`, `Lucide Icons / chevron-right`, `Lucide Icons / triangle-alert`, `Lucide Icons / circle-check-big`, etc).

### Implementation

- The Figma file ships both **line-icons** (default) and **filled-icons** subdirectories. The product uses **line icons by default** — the filled set is reserved for active/selected states (e.g. a filled chevron in a chosen tab).
- Line stroke weight: **1.5px** at 16/20/24 sizes. Stroke colour inherits from `currentColor` so a single SVG works on light or dark surfaces.
- Standard sizes: **16px** (inline with body text), **20px** (buttons, inputs), **24px** (nav, headers), **32px** (modal key icons).
- **No emoji are used in the product** — not in headings, not in toasts, not in empty states. Status is communicated via the colour-coded Lucide glyphs (`circle-check-big` = success, `triangle-alert` = warning, `circle-help` = info).

### How to use

Pull icons from the Lucide CDN:

```html
<!-- Inline SVG (preferred — recolours via currentColor) -->
<i data-lucide="plus"></i>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>lucide.createIcons();</script>
```

Or via direct SVG fetch from `https://unpkg.com/lucide-static@latest/icons/{name}.svg`.

We did **not** copy individual Lucide SVGs into `assets/` — they're CDN-available and the system has 200+ in use. If you need a custom glyph, place it in `assets/icons/` with `stroke="currentColor"` and `stroke-width="1.5"` to match the Lucide system.

---

## Caveats / known substitutions

- **Inter** and **Geist** are loaded from Google Fonts — they match the Figma source.
- **Fustat** is the product face and is loaded from the variable font file shipped in `fonts/`.
- The Figma file includes Lucide icon nodes by name (`Lucide Icons / plus` etc) but does not ship the SVG bytes — we link the official CDN.
- Empty-state illustrations were not extracted as standalone vectors; treat them as placeholders to commission later.

---

## Quick start

```html
<link rel="stylesheet" href="/colors_and_type.css">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<style>body { background: var(--bg-page-default); color: var(--fg-primary); font-family: var(--font-body); }</style>

<button class="t-body3-bold" style="background:var(--btn-primary-bg);color:var(--fg-inverse);border:none;border-radius:var(--radius-lg);padding:8px 12px;height:40px;">
  Create deposit address
</button>
```
