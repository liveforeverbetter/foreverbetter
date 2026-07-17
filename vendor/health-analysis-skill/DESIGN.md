# foreverbetter Dashboard — design spec

A single-file, local-first healthspan dashboard. It **opens by celebrating the
member's standout genes** — an editorial "specimen" collection of rare favorable
variants they'll want to screenshot and share — then gives them a ranked
**plan**, and lets them drill into Genetics, Biomarkers, and Wearables on
dedicated tabs. Genomic and biomarker data are the core; wearables are framed
as supplementary.

The aesthetic is **editorial / "paperclip-punk"**: warm paper canvas (`#f5f3ec`),
a faint registration-dot grid, hairline rules and crop marks, section numbers,
and engineering figure plates (SVG helix, gauge dial, chromosome locus), set in
**Fraunces** (display) and **Newsreader** (serif body) with **JetBrains Mono**
for every label, spec, and numeric value. Coral (`#df1e39`) is the brand and
attention accent; evergreen (`#1e7a52`) is reserved for positive carried
advantages and strengths. No em dashes in copy.

> **To reproduce this for another member, swap only the JSON** inside the
> `<script type="application/json" id="dashboard-data">` block in
> `templates/longevity-dashboard.html`. Every pixel is rendered from that object.

---

## 1. Structure

Five tabs in a sticky pill nav. Tab state is kept in the URL hash
(`#overview`, `#plan`, `#genetics`, `#biomarkers`, `#wearables`).

### Overview — the emotional summary
| # | Section | id | Purpose |
|---|---|---|---|
| 01 | **Masthead** | `.masthead` | Brand header with member name, compiled date, and a SVG DNA helix figure plate (FIG_001). Editorial serif display. |
| 02 | **Standout variants** (the wow) | `#sec-edges` | "Specimen collection" — numbered figure plates for each favorable variant. Rarity framing ("1 in N people carry this"), evidence tier badge, 4-pip rarity meter, chromosome locus diagram on the featured card. Shareable with "Stamp & share dossier" button. |
| 03 | **Strengths across your data** | `#sec-strengths` | Three light-bordered pillar columns (genes / blood work / day-to-day) showing what's working. Wearable column marked "Supplementary". |
| 04 | **Healthspan index** | `#sec-index` | SVG gauge dial (FIG_007) + subscore table + connected-data sources. |

### Your Plan — `#plan`
The synthesis tab. A short intro, then a **ranked list of priorities** (each a
numbered card with horizon + impact pills, the why, evidence chips tracing to
markers/genes, concrete steps, and an expected result + recheck horizon), then
a **"Keep doing this"** grid of strengths to maintain. This is the action layer;
it deliberately replaces the old single "14-day plan" upsell card.

### Genetics — `#genetics`
Stats row → Polygenic risk & trait scores → Innate strengths → Hereditary risk
variants → Drug–gene interactions → Aging hallmark pathways.

### Biomarkers — `#biomarkers`
Stats row → priority callout (the two markers sharing a root cause) → a
**category index** of jump chips → **8 category cards** (Heart & cholesterol,
Blood sugar & insulin, Inflammation & immune, Vitamins & nutrients, Liver,
Kidney & electrolytes, Thyroid & hormones, Blood count). Every marker is an
**expandable row** — name + value + status dot — that opens a plain-English
overview of what it means for the member.

The biomarker surface borrows the best part of WHOOP-style labs: fast scoring,
clear status language, obvious priorities, and retestable progress. It does not
borrow streaks, badges, leaderboards, or extra fitness-app rings. The default
read is: how many markers are in target, what needs action first, what target
range was used, and whether the marker improved since the last panel.

### Wearables — `#wearables`
Framed as **supplementary**. Stats row → wide domain panels.

### What changed from earlier versions
- **Hero celebrates unique genes, editorial.** Standout variants are presented
  as a "specimen collection" with section numbers, figure tags, rarity framing
  ("1 in 9 people carry this"), and evidence tiers — the screenshot moment.
- **Action lives on its own Plan tab**, ranked and evidence-linked.
- **Dropped the 6-bucket genetic taxonomy.** Ancestry removed from the surface.
- **Editorial design system.** Fraunces + Newsreader + JetBrains Mono replaces
  the earlier product-dashboard (Plus Jakarta) aesthetic. Warm paper, hairlines,
  registration marks, and crop-mark section dividers.
- **Consumer-facing voice throughout** (see §3).

---

## 2. Data contract

### 2.1 `member` *(required)*
```json
{ "name": "Tomás Esteves", "initials": "TE", "lastUpdated": "May 28, 2026" }
```
`initials` draws the avatar; `name` appears in the hero eyebrow.

### 2.2 `signature` *(required)* — the gamified edges hero
```json
{
  "eyebrow": "Standout variants",
  "headlineBefore": "You carry",
  "headlineAfter": "genes that put you ahead.",
  "sub": "Most of your DNA is unremarkable, like everyone's. These are the standout variants...",
  "edges": [
    { "name": "The centenarian variant", "gene": "FOXO3", "rsid": "rs2802292",
      "carriedByPct": 11, "tier": "Established",
      "benefit": "Over-represented in people who reach their late 90s in good health..." }
  ]
}
```
- The headline renders as `{headlineBefore} {N} {headlineAfter}` where **N is the
  edge count** (coral). No hardcoded number.
- `edges[0]` is the **featured** card (larger, coral-glow). Order edges by
  rarity/impact so the rarest leads.
- `carriedByPct` drives everything gamified: the **"1 in N"** stat
  (`round(100 / pct)`), the **rarity label** (≤5 Rare, ≤15 Uncommon, ≤35
  Notable, else Common), and the **rarity meter** pips (rarer = more lit).
- `tier` → evidence badge. Anything containing "emerg" renders blue *Emerging*;
  everything else green *Established*.
- **Share button** uses `navigator.share`, else copies a one-line brag and flips
  to "Copied ✓". The hero is sized to crop cleanly into a screenshot.
- **Honesty:** every edge must be a real variant the member carries with a real
  population frequency. Don't inflate rarity. A favourable common variant is
  still worth showing — it just reads "Common", not "Rare".

### 2.3 `identity.pillars` *(required, 3)* — strengths across your data
`{ modality, secondary, score, scoreStatus, primary, supports:[{lbl,val}] }`.
`secondary: true` → muted card + "Supplementary" tag (use for wearables).

### 2.4 `healthspan` *(required)*
`{ gli, gliStatus, percentile, focusAreas[], subscores[], connected[] }`. The
GLI ring is a single-color arc keyed to `gliStatus`
(optimal→green ≥70, watch→amber 40–69, attention→red <40, neutral→blue).

### 2.5 `tracking` *(populated but not rendered in current template)*
`{ id, title, score, scoreStatus, isSecondary, summary, markers:[{name,tech,value,status}] }`.
The pipeline populates this for future use. The current template renders genomic
and biomarker data directly on their own tabs.

### 2.6 `plan` *(required)* — the Your Plan tab
```json
{
  "intro": "We scored your genes, blood work, and day-to-day signals separately...",
  "priorities": [
    { "rank": "01", "horizon": "Start now", "impact": "High impact",
      "title": "Run a 2-week insulin and inflammation reset",
      "why": "...",
      "evidence": [ { "k": "Insulin response", "v": "HOMA-IR 3.21", "sev": "bad" } ],
      "steps": [ "...", "..." ],
      "result": "Lower hs-CRP and HOMA-IR", "retest": "8–12 weeks" }
  ],
  "maintain": [ { "title": "Your protective gene profile", "note": "..." } ]
}
```
| Field | Notes |
|---|---|
| `rank` | String, drawn as a giant coral numeral. `priorities[0]` is featured (coral-tinted card). |
| `horizon` | Contains "now" → coral pill, "next" → amber, else blue (ongoing). |
| `impact` | Contains "high" → dark pill, else neutral. |
| `evidence[].sev` | `good` / `warn` / `bad` → colors the chip value. Every priority must trace to measured signals. |
| `maintain[]` | Things already working — the positive counterweight to the action list. |

**Ordering rule:** priorities are ranked by where two or more modalities agree
on the same retestable action. Modifiable-first (behaviour > supplement >
clinical referral) breaks ties.

### 2.7 Genetics tab
- `geneticStats[]` — `{ value, label }` KPI cells.
- `polygenic[]` — `{ name, pct, band, desc }`. `band`: lower/average/elevated/high. Plain disease names.
- `strengths[]` — `{ title, gene, rsid, score, body, tags[] }`.
- `hereditary[]` / `drugGene[]` — `{ gene, rsid, name, lead, desc, tag }`. `drugGene` may be empty → explicit empty state.
- `hallmarks[]` — `{ name, tech, genes[], count, burden, action }`.

### 2.8 Biomarkers tab
- `biomarkerStats[]` — KPI cells.
- `biomarkerPriority` — `{ title, body, markers:[{name,value}] }`. The critical-tinted "one root cause" callout (semantic red, never decorative).
- `biomarkerCategories[]` — `{ title, score, scoreStatus, summary, markers[] }`, where each marker is `{ name, tech, value, status, statusLabel, targetLabel, priorityRank?, trendLabel?, info }`. **`info` is the plain-English overview** shown when the row expands — one or two sentences on what the marker is and what it means for the member. Categories follow a body-system taxonomy (Heart, Blood sugar, Inflammation, Nutrients, Liver, Kidney, Thyroid/hormones, Blood count), mirroring how Superpower groups its panel.
- Marker statuses are consumer labels: `optimal` → `In target`, `watch` → `Monitor`, `needs_attention` / `attention` → `Act on this`, `missing` → `Not measured`. Never show raw enum names to the member.
- `targetLabel` must come from the scoring engine's optimal range. `trendLabel` is shown only when a previous panel contains the same marker with a compatible unit.

### 2.9 Wearables tab
- `wearableStats[]` + `wearableDomains[]` (`{ title, score, scoreStatus, summary, markers[] }`). Framed supplementary.
- Marker rows use the same consumer presentation as biomarkers: current value, targetLabel, user-facing statusLabel, optional priorityRank, interpretation, and next action.
- Wearable signals can explain behavior and recovery context between lab cycles, but they must not override direct biomarker values or genomic findings.

---

## 3. Voice (consumer-facing)
The product speaks to a layperson. The design-system rule — **no clinical
jargon without translation** — is applied everywhere:

| Pattern | Do | Don't |
|---|---|---|
| Marker names | `Insulin response (HOMA-IR)` | `HOMA-IR` |
| Rarity | `1 in 9 people carry this` | `MAF 0.11` |
| Disease names | `Heart disease` | `Coronary artery disease` |
| Overviews | What it **means for you** + what to do | A textbook definition |

Plain name leads; the technical token follows in muted monospace parens.
Sentence case, **no em dashes**, no exclamation marks, no emoji, no "unlock
your potential."

---

## 4. Design rules (preserve when extending)
- **Keep accent semantics distinct** — coral `#df1e39` is the brand and
  attention accent. Evergreen `#1e7a52` is the positive accent for standout
  variants, innate strengths, and strengths-across-data surfaces. Red should
  not decorate positive "superpower" content.
- Page `--paper: #f5f3ec`; nested `--paper-2: #efece2`; ink `--ink: #17150f`.
  Hairlines use `--line: #d6cfbf`. Semantic colors only next to data.
- **Fraunces** for display/headings, **Newsreader** for body copy, **JetBrains
  Mono** for every label, spec, number, and technical token.
  `tabular-nums` on every numeric value.
- Section structure: each major section has a number (`01`, `02`, `03`), a
  coral rule-accent (`div.rule-accent`), and optional registration crosshairs.
- `--ease-out` only; `prefers-reduced-motion` zeroes transitions.

### Anti-patterns — banned
| Pattern | Instead |
|---|---|
| `border-left: 4px solid <semantic>` accent strips | Top pill + score color |
| Decorative gradients | GLI arc + the one dark-hero glow + the hero's coral edge-card wash only |
| Emoji as load-bearing UI | Mono glyphs (`+ → · ✓`), tabular numerals |
| Generic CTAs ("Learn more") | Name the action ("Share my edges") |
| Clinical jargon with no translation | Plain name + `(technical)` parens |
| Six-category genetic taxonomy on the surface | Meaning-grouped tracking + tabs |
| Em dashes in copy | Comma, colon, or middot |
| Pipeline telemetry on the consumer surface (e.g., "3.72M Single-letter variants", "annotated rsIDs available for ClinVar matching", "interpretation pending") | One plain-English summary line. Move the per-class breakdown, methodology language, and "report does X" telemetry into a closed `<details>` disclosure or drop it. If a number does not change a user decision, it does not belong on the page. |
| Textbook definitions of variant types, pathways, or marker biology | A single line on what it means for the user and what to do. The encyclopedia entry belongs in linked references, not the dashboard. |

### Required disclaimer
The medical disclaimer in `<footer class="method">` is **mandatory** and uses
the design-system wellness-not-medical language verbatim.

---

## 5. File map
```
templates/longevity-dashboard.html   # The dashboard template. The pipeline injects JSON
                                   # into {{DASHBOARD_DATA_JSON}} and writes output/index.html.
                                   # Design tokens (foreverbetter token set) are inlined.
scripts/pipeline/index.ts          # buildForeverbetterDashboardJSON() maps PipelineOutput
                                   # → the dashboard JSON schema. Edit this to enrich the data.
DESIGN.md                          # This file
```
Extend by adding `:root` variables in the template's own override block — never
invent a color outside the existing `--paper`, `--ink`, `--accent`, `--line`
shorthand variables defined at the top of the template.

---

## 6. Extending checklist
1. Does it answer a question the member has *at that point in the page*? If not, push it deeper or cut it.
2. Is it grouped by **meaning**, not lab taxonomy?
3. Does every claim trace back to a measured signal (marker, percentile, variant)?
4. Is the default state the cheapest read? Don't push the hero below the fold; keep biomarker overviews collapsed.
5. Plain English first, technical token in parens. Use existing tokens only. No em dashes.

---

## 7. Connecting data (how a member populates this)

This is a **local-first, open-source** dashboard: it renders entirely from the
JSON block, so "connecting data" means producing that JSON, nothing is uploaded
to a server.

- **Genomics** — run your VCF / whole-genome file through the open-source
  pipeline; it emits the `signature`, `polygenic`, `strengths`, `hereditary`,
  `drugGene`, and `hallmarks` sections.
- **Biomarkers** — export your blood panel (most labs provide a CSV/PDF) and map
  each result into the relevant `biomarkerCategories[].markers[]` entry. The
  per-marker `info` overviews are reusable across members.
- **Wearables (supplementary)** — export the 30-day summary from your device
  (e.g. Oura/Whoop/Apple Health) and populate `wearableDomains[]`.

There is intentionally **no live OAuth/upload UI** in this open-source build. If
a hosted product needs one, add an onboarding screen that writes the same JSON
shape — the rendering layer doesn't change.
