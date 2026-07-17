# Hereditary Conditions Analysis Skill

Analyzes genetic variants associated with monogenic (single-gene) hereditary conditions.
These are typically rare but significant conditions caused by variants in specific genes.

## Key Genetic Markers

### Iron Metabolism Disorders

#### Hereditary Hemochromatosis (HFE Gene)
| rsID | Genotype | Condition | Clinical Impact |
|------|----------|-----------|----------------|
| rs1800562 | GG | No mutation | Normal iron metabolism |
| rs1800562 | GA | Carrier | Minimal iron overload risk |
| rs1800562 | AA | Homozygous | HFE-related hemochromatosis |
| rs1799945 | CC | No mutation | Normal |
| rs1799945 | CG | Carrier | Slight increase |
| rs1799945 | GG | Compound | Iron overload possible |

### Cystic Fibrosis (CFTR Gene)
| rsID | Genotype | Impact |
|------|----------|--------|
| rs113993959 | MM | Normal CFTR function |
| rs113993959 | Mm | Carrier (if heterozygous) |
| rs113993959 | mm | CF if homozygous |

### BRCA1/BRCA2 - Hereditary Breast/Ovarian Cancer
| rsID | Gene | Genotype | Impact |
|------|------|----------|--------|
| rs1799949 | BRCA1 | Various | Variant depends on specific mutation |
| rs28897696 | BRCA1 | Various | Variant depends on specific mutation |
| rs1801406 | BRCA2 | Various | Variant depends on specific mutation |

### Other Monogenic Conditions

#### Sickle Cell / Hemoglobinopathies
| rsID | Gene | Impact |
|------|------|--------|
| rs334 | HBB | Sickle cell trait/disease |

#### G6PD Deficiency
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1050828 | TT | Normal |
| rs1050828 | CT | Carrier (females) |
| rs1050828 | CC | G6PD deficiency |

#### Alpha-1 Antitrypsin Deficiency (SERPINA1)
| rsID | Genotype | Impact |
|------|----------|--------|
| rs17580 | MM | Normal |
| rs17580 | MS | Carrier |
| rs17580 | SS | Deficiency possible |

#### Hemophilia (F8, F9)
| rsID | Gene | Impact |
|------|------|--------|
| rs1801131 | F8 | Various variants affect severity |

### Carrier Status Genes

#### Tay-Sachs (HEXA Gene)
| rsID | Genotype | Impact |
|------|----------|--------|
| rs121964908 | N/N | Normal |
| rs121964908 | N/n | Carrier |
| rs121964908 | n/n | Affected (if both copies) |

## Analysis Logic

```typescript
interface HereditaryResult {
  monogenicConditions: {
    gene: string;
    condition: string;
    status: 'variant_present' | 'variant_absent' | 'carrier' | 'not_tested';
    zygosity: string | null;
    clinicalSignificance: string;
    actionItems: string[];
  }[];
  carrierScreening: {
    gene: string;
    condition: string;
    status: 'carrier' | 'not_a_carrier' | 'not_tested';
    implications: string;
  }[];
}
```

## Output Format

```json
{
  "monogenicFindings": [
    {
      "gene": "HFE",
      "condition": "Hereditary Hemochromatosis Type 1",
      "status": "Variant Absent",
      "interpretation": "No HFE mutations detected",
      "recommendation": "Standard iron guidelines apply"
    }
  ],
  "carrierStatus": [
    {
      "gene": "CFTR",
      "condition": "Cystic Fibrosis",
      "status": "Not a Carrier",
      "interpretation": "No CFTR mutations detected"
    }
  ],
  "actionableFindings": [],
  "summary": "No pathogenic variants detected in the screened hereditary conditions panel."
}
```

## Dashboard Presentation

### Visual Elements
- **Condition cards** with clear present/absent status
- **Gene badges** with color coding
- **Carrier status indicators** for reproductive planning
- **Medical consultation flags** where appropriate

### Status Indicators
- 🟢 **Variant Absent** - No pathogenic variant detected
- 🔴 **Variant Present** - Pathogenic variant detected
- 🟡 **Carrier** - Carrier status (typically for recessive conditions)
- ⚫ **Not Tested** - Gene not included in test

## Coverage Summary

This analysis covers the following monogenic condition categories:
- Blood & Immune Disorders
- Respiratory & Liver Conditions
- Cardiovascular Conditions
- Neurological & Cognitive Conditions
- Cancer Predisposition
- Other Hereditary Conditions

## Important Notes

1. **Monogenic conditions are rare** - Most people will not have variants in these genes
2. **Clinical confirmation needed** - Positive findings should be confirmed with clinical testing
3. **Genetic counseling recommended** - For any hereditary condition findings
4. **Family testing may be indicated** - If a variant is found

## Data Sources

- ClinVar database
- OMIM (Online Mendelian Inheritance in Man)
- GeneReviews
- ACMG guidelines