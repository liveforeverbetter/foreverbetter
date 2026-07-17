# Meridian — App UI Kit

An interactive, high-fidelity recreation of the Meridian mobile app (a dark, data-forward health & longevity product). Built entirely from the design-system components — no primitive is re-implemented here.

## Run
Open `index.html`. It loads `../../styles.css` and `../../_ds_bundle.js`, then mounts the screens. Requires the compiled bundle (generated automatically by the design-system compiler) and the Lucide UMD script for icons.

## Screens
| File | Surface |
|---|---|
| `LoginScreen.jsx` | Brand entry / sign-in with the glowing orb backdrop. |
| `OverviewScreen.jsx` | Multimodal inference — the aggregated read across genetics, biomarkers and wearables, with a bio-age orb and cross-modal synthesis. |
| `ActionPlanScreen.jsx` | Concrete steps for the week, chosen from all data points, with the reasons behind each. |
| `GeneticsScreen.jsx` | Genetic trait cards and polygenic risk meters. |
| `BiomarkersScreen.jsx` | Blood panels with optimal-range reference bars. |
| `WearablesScreen.jsx` | Device-measured layer — sleep / recovery / strain rings, HRV/RHR, activities. |
| `HealthspanScreen.jsx` | Longevity detail — bio-age particle orb + pace-of-aging slider. Opened from Overview. |
| `PhoneFrame.jsx` | Device shell (status bar, notch, safe areas). |

## Interactions
- **Sign in** enters the app.
- **Bottom tab bar** switches Overview / Plan / Genetics / Biomarkers / Wearables.
- **Overview tiles and insights** deep-link into each modality; the Bio Age insight opens Healthspan.
- Sliders, tabs, activity rows and cards are live.

## Components used
`TopNav`, `TabBar`, `MetricRing`, `StatTile`, `StatusBanner`, `InsightCard`, `ActivityRow`, `ProgressBar`, `PlanItem`, `JournalWeek`, `HealthspanOrb`, `Slider`, `BiomarkerPanel`, `BiomarkerRow`, `RangeBar`, `GeneCard`, `RiskMeter`, `Button`, `Input`, `IconButton`, `Badge`, `EmptyState`, `Tabs`, `Icon`.

## Fidelity notes
This kit is a cosmetic recreation for prototyping — data is static and charts/detail drill-downs are stubbed. It mirrors the reference wearable-dashboard layout (rings row, insight strip, gamified plan, healthspan orb) using Meridian's own tokens and brand, not any third-party product's assets.
