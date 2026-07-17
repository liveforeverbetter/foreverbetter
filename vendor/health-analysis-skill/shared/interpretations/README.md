# Genomic Interpretations Database

**This is the authoritative source of truth for all variant interpretations.**

The analysis pipeline MUST read from this file - never hardcode interpretations elsewhere.

## File Structure

This directory contains interpretation data organized by category:

```
shared/
├── interpretations/
│   ├── wellness.json      # Nutrition, methylation, metabolism, inflammation
│   ├── pharmacology.json  # Drug metabolism, pharmacogenetics
│   ├── personality.json   # Cognitive, neurotransmitter, behavioral
│   ├── performance.json   # Athletic, exercise response
│   ├── vulnerability.json # Disease risks, complex traits
│   ├── hereditary.json   # Monogenic conditions, carrier status
│   └── ancestry.json      # Haplogroups, ancestry composition
└── marker-database.md     # Marker metadata (rsID, position, genes)
```

## JSON Schema

Each interpretation file contains:

```json
{
  "version": "1.0.0",
  "updated": "2026-04-23",
  "markers": {
    "rs1801133": {
      "gene": "MTHFR",
      "name": "C677T",
      "category": "wellness",
      "chrom": "1",
      "pos": 11856378,
      "interpretations": {
        "CC": {
          "effect": "Normal enzyme activity (100%)",
          "interpretation": "Full MTHFR function - standard folate metabolism",
          "recommendations": ["Standard folic acid is effective"],
          "priority": "low"
        },
        "CT": {
          "effect": "Reduced activity (65-70%)",
          "interpretation": "Heterozygous variant - moderate folate processing reduction",
          "recommendations": ["Consider methylfolate", "Monitor homocysteine levels"],
          "priority": "medium"
        },
        "TT": {
          "effect": "Significantly reduced (30%)",
          "interpretation": "Homozygous variant - impaired folate pathway",
          "recommendations": ["Methylfolate strongly recommended", "Regular homocysteine monitoring"],
          "priority": "high"
        }
      }
    }
  }
}
```

## Critical Rules

1. **All interpretations MUST be in these JSON files** - no hardcoding
2. **The analysis script reads JSON at runtime** - never duplicates interpretation data
3. **Update these files when adding new markers** - keeps single source of truth
4. **Marker metadata (rsID, position, category) comes from marker-database.md**

## Key Markers Reference

### Wellness
- MTHFR: rs1801133, rs1801131
- IL6: rs1800795
- IL10: rs1800896
- FTO: rs9939609
- LCT: rs4988235
- MCM6: rs182549535

### Pharmacology
- CYP1A2: rs762551
- CYP2C19: rs12248560, rs4244285
- CYP2D6: rs3892097

### Performance
- ACTN3: rs1815739
- ACE: rs4340
