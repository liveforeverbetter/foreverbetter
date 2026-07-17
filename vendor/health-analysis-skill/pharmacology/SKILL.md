---
name: genomic-pharmacology
description: |
  **Use this skill when the user asks about drug metabolism, medication sensitivity, drug interactions,
  supplement compatibility, or how their genetics affect how they respond to medications.**

  Also triggers for: drug efficacy, side effects, drug sensitivity, pharmacogenetics,
  how medications work for them, medication warnings, or "which medications should I avoid".

  Analyzes CYP450 enzymes, drug metabolism genes, and provides dosage guidance.
category: longevity-analysis/pharmacology
---

# Pharmacology Analysis

Analyzes genetic variants affecting drug metabolism and medication responses.

## Key Drug Metabolism Genes

| Gene | rsID | Affected Drugs | Phenotype |
|------|------|----------------|-----------|
| CYP2C9 | rs1799853 | Warfarin, NSAIDs | Poor metabolizer |
| CYP2C19 | rs12248560 | Clopidogrel, PPIs | Ultra-rapid metabolizer |
| CYP2D6 | rs3892097 | Codeine, SSRIs | Poor metabolizer |
| VKORC1 | rs9923231 | Warfarin | Dosing requirement |
| DPYD | rs3918290 | Fluorouracil | Toxicity risk |
| SLCO1B1 | rs4149056 | Statins | Myopathy risk |
| TPMT | rs1800460 | Thiopurines | Bone marrow suppression |

## Dashboard Design

- **Card Color**: Violet (#8b5cf6) header
- **Metabolizer badges**: Color-coded (green=normal, yellow=intermediate, red=poor/ultra)
- **Drug interaction table**: Sortable list with impact descriptions
- **Supplement cards**: With dosage and timing recommendations
