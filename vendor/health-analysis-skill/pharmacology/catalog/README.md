# Pharmacogenomic Catalog

Reference data for the drug-gene interactions and metabolizer status surfaced by the longevity-analysis pipeline. This is a condition-centric companion to the variant-centric files in `shared/interpretations/`.

## Files

- `PROVENANCE.md` 
- `catalog.json` — list of conditions in this pharmacogene panel (id, name, slug)
- `drug_pharmacological_action.json` — action category lookup (id → label)
- `drug_pharmacological_group.json` — pharmacology group lookup
- `editorial.json` — clinical narrative blocks per condition (description, symptoms, prevention, causes, dose, technical_description, technical_citations)
- `gene_map.json` — gene panel per condition (id → [HGNC gene symbols])
- `pharmacogene_list.json` — flat list of pharmacogenes covered
- `pharmacogene_variant_catalog.json` — per-gene variant catalog with rsIDs, GRCh38 positions, and named star alleles
- `pharmacology_action.json` — action label lookup
- `status_lookup.json` — id → human-readable status label

## Consumption

The VCF pipeline consumes this catalog through `scripts/pipeline/catalog_loader.ts`:

```ts
import { loadCatalog, surfaceForGenes } from './catalog_loader.js';

const catalog = loadCatalog('pharmacology');
const matches = surfaceForGenes(catalog, userGeneSet);
// matches[i] = { id, name, editorial, matched_genes }
```

Each surfaced match is intended to render alongside the user's actual variant calls (from `shared/interpretations/`) as the condition-level context layer.

## Schema

`catalog.json` — array of `{ id: number, name: string, url_slug?: string, loci_count?: number }`

`editorial.json` — map of `id` → editorial block. Common keys: `name`, `description`, `overview`, `symptoms`, `prevention`, `causes`, `dose`, `technical_description`, `technical_citations`. Not every condition has every field.

`gene_map.json` — map of `id` → array of HGNC gene symbols.

`status_lookup.json` — map of `id` → human-readable label (e.g. `"Variant absent"`, `"Carrier"`, `"CYP2D6 Poor metabolizer/CYP2C19 Intermediate metabolizer"`).
