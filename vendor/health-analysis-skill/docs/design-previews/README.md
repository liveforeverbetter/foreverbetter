# Design previews

Each design is a structurally distinct dashboard, not a recolor. Regenerate with
`npm run design:preview` (needs Playwright, see the script header).

| Preview | Design | Hero | Voice |
| --- | --- | --- | --- |
| ![ring-data](ring-data.png) | `ring-data` | gradient readiness ring + contributor rings | calm editorial |
| ![performance](performance.png) | `performance` | dual tick-marked recovery/strain gauges + metric bars | bold coach |
| ![clinical-modern](clinical-modern.png) | `clinical-modern` | in-range donut + reference-range biomarker table | clinical |
| ![metabolic](metabolic.png) | `metabolic` | glucose-style zone curve + time-in-range + chips | data-forward |
| ![system-cards](system-cards.png) | `system-cards` | rounded category-card grid + sparklines | neutral system |
| ![serene](serene.png) | `serene` | glowing breathing orb, one thing at a time | soft, minimal |

Rendered from sample data by `shared/design/render-designs.ts`. Pass
`--design=<id>` to the pipeline, or a custom tokens JSON, to use one.

## Thorough, all-modality dashboards

Beyond the summary layouts above, each design is being built out to render every
modality from the full pipeline (wearable domains, a biomarker panel, genetic
edges, polygenic risk, aging hallmarks, pharmacogenomic context, and the full
action plan) in its own voice. The performance (WHOOP-style) dashboard is done:

![performance-full](performance-full.png)

The thorough renderer is `shared/design/render-performance.ts`, dispatched by
`renderFullDashboard()` from the full transformed pipeline data. The other five
designs get the same treatment next.

