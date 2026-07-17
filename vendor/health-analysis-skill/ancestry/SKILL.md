---
name: genomic-ancestry
description: |
  **Use this skill when the user asks about ancestry, genealogical background, ethnic composition,
  haplogroups, ancient DNA, or "where do I come from" genetically.**

  Also triggers when user mentions: mtDNA, Y-chromosome, Neanderthal ancestry, family heritage,
  ethnic background, population composition, or migradion patterns.

  This skill analyzes maternal/paternal lineages, calculates ancestry percentages,
  and identifies Neanderthal genetic contributions.
category: longevity-analysis/ancestry
---

# Ancestry Analysis

Analyzes mtDNA, Y-chromosome haplogroups, and ancestry-informative markers.

## Key Markers

| Marker | rsID | Population | Function |
|--------|------|------------|----------|
| Haplogroup B | - | Maternal | East Asia/Americas |
| Haplogroup H | - | Maternal | Western Europe |
| Haplogroup L | - | Maternal | Africa |
| Haplogroup J | - | Maternal | Middle East/Europe |
| rs1859951 | - | Neanderthal | Ancient admixture |
| rs1988499 | - | Neanderthal | Ancient admixture |

## Analysis Steps

1. **Parse mtDNA** - Extract haplogroup-defining variants
2. **Parse Y-chromosome** - Determine paternal haplogroup
3. **Calculate admixture** - Estimate population percentages
4. **Neanderthal analysis** - Check admixture markers
5. **Generate summary** - Compose ancestry narrative

## Dashboard Design

- **Card Color**: Indigo (#6366f1) header
- **Map visualization**: Optional interactive world map with highlighted regions
- **Timeline**: Ancient migration routes for haplogroups
- **Composition chart**: Pie/donut chart for population percentages
