# Ancestry Analysis Skill

Analyzes genetic data to determine ancestry composition, haplogroups, and lineage information.

## Key Genetic Markers

### Mitochondrial DNA (mtDNA) - Maternal Lineage
| rsID | Gene | Variant | Haplogroup Indicator |
|------|------|---------|---------------------|
| rs904 | MT-RNR2 | A839G | Various haplogroups |
| rs2853518 | MT-ND1 | G3460A | Haplogroup H |
| rs2835798 | MT-ND2 | T4216C | Various |
| rs2835827 | MT-CO1 | G7146A | Various |

### Y-Chromosome - Paternal Lineage
| rsID | Gene | Variant | Haplogroup Indicator |
|------|------|---------|---------------------|
| rs2032651 | SRY | T8818A | Various haplogroups |
| rs2032652 | SRY | G2081A | R1b marker |
| rs1344737 | DYS19 | - | DYS19 10/11/12/13/14 repeats |
| rs2032636 | DYS390 | - | STR marker |

### Neanderthal Ancestry
| rsID | Gene | Function | Impact |
|------|------|---------|--------|
| rs1294558 | OR10A3 | Olfactory receptor | Neanderthal introgression |
| rs1861685 | HLA-A | Immune receptor | HLA-A*66 haplotype |
| rs4659768 | STAT2 | Immune signaling | Neanderthal variant |
| rs688146 | NEU1 | Sialidase | Neanderthal ancestry marker |

### Ancestry Composition SNPs
| rsID | Associated Population | Impact |
|------|---------------------|--------|
| rs1024002 | European vs East Asian | Ancestry component |
| rs1293823 | European vs African | Ancestry marker |
| rs3787238 | Southern vs Northern European | Regional ancestry |
| rs12916 | rs12916 | Lipid metabolism (selection signal) |

## Analysis Logic

```typescript
interface AncestryResult {
  maternalHaplogroup: string | null;
  paternalHaplogroup: string | null;
  neanderthalPercentage: number;
  ancestryComposition: {
    region: string;
    percentage: number;
  }[];
  regionalMarkers: string[];
}

// Detection pattern
function analyzeAncestry(markers: ExtractedMarker[]): AncestryResult {
  // 1. Identify mtDNA haplogroup markers
  // 2. Identify Y-chromosome markers (male only)
  // 3. Calculate Neanderthal ancestry SNPs
  // 4. Determine regional ancestry composition
}
```

## Output Format

```json
{
  "maternalLineage": {
    "haplogroup": "H2a2a1",
    "description": "One of the oldest European lineages, originating in the Near East",
    "frequency": "Rare",
    "region": "Western Eurasia"
  },
  "paternalLineage": {
    "haplogroup": "R-M343",
    "description": "Common in Western Europe, associated with Bronze Age migrations",
    "frequency": "Common",
    "region": "Western Europe"
  },
  "neanderthalAncestry": {
    "percentage": 2.8,
    "interpretation": "Slightly above average European ancestry",
    "significantVariants": [
      { "rsid": "rs1294558", "effect": "Olfactory receptor variant" }
    ]
  },
  "composition": [
    { "region": "European", "percentage": 94.2 },
    { "region": "East Asian", "percentage": 2.1 },
    { "region": "Sub-Saharan African", "percentage": 1.8 },
    { "region": "Native American", "percentage": 1.9 }
  ]
}
```

## Dashboard Presentation

### Visual Elements
- **Pie chart** for ancestry composition
- **Haplogroup badges** with lineage icons
- **Neanderthal percentage gauge** (typical range 1-4%)
- **Regional map highlighting** for geographic ancestry

### Risk Indicators
- No risk levels for ancestry (informational only)
- Confidence intervals for percentages

## Data Sources

- ISOGG (International Society of Genetic Genealogy) haplogroup tree
- 1000 Genomes Project reference populations
- Patterson et al. (2012) ancestry inference methods

