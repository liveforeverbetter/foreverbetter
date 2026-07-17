# Wellness Analysis Skill

Analyzes genetic variants affecting nutrition, metabolism, vitamin processing, and general wellness traits.
This includes methylation, nutrient absorption, metabolic rate, and dietary sensitivities.

## Key Genetic Markers

### Methylation Cycle

#### MTHFR - Folate Metabolism
| rsID | Genotype | Enzyme Activity | Impact |
|------|----------|----------------|--------|
| rs1801133 | CC | 100% (normal) | Standard folic acid processing |
| rs1801133 | CT | 65-70% | Consider methylfolate supplementation |
| rs1801133 | TT | 30% (reduced) | Strongly consider methylfolate, monitor homocysteine |
| rs1801131 | TT | Normal | No impact at this position |
| rs1801131 | TG | Mildly reduced | May benefit from methylfolate |
| rs1801131 | GG | Reduced | Support BH4 pathway |

#### MTR/MTRR - B12 Metabolism
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1805087 (MTR) | AA | Normal methionine synthase |
| rs1805087 (MTR) | AG | Slightly reduced B12 utilization |
| rs1805087 (MTR) | GG | Reduced enzyme activity |
| rs1801394 (MTRR) | AA | Normal B12 regeneration |
| rs1801394 (MTRR) | AG | May need more B12 |
| rs1801394 (MTRR) | GG | Reduced MTR regeneration |

### Vitamin Processing

#### VDR - Vitamin D Receptor
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1544410 | GG | Normal VDR function |
| rs1544410 | GA | Slightly higher vitamin D needs |
| rs1544410 | AA | May need 40-50% more vitamin D |
| rs731236 (TaqI) | TT | Normal |
| rs731236 (TaqI) | TC/CC | Altered calcium homeostasis |

#### BCMO1 - Beta-Carotene Conversion
| rsID | Genotype | Impact |
|------|----------|--------|
| rs12934922 | AA | Normal conversion |
| rs12934922 | TT | Reduced conversion to vitamin A |

### Metabolic Traits

#### LCT - Lactose Tolerance
| rsID | Genotype | Impact |
|------|----------|--------|
| rs4988235 | GG | Lactose intolerant |
| rs4988235 | GA | Variable tolerance |
| rs4988235 | AA | Lactose tolerant |
| rs182549 (MCM6) | CC | Non-persistent lactase |
| rs182549 (MCM6) | CT/TT | Lactase persistence |

#### FTO - Obesity Risk
| rsID | Genotype | Impact |
|------|----------|--------|
| rs9939609 | TT | Lower genetic obesity risk |
| rs9939609 | TA | ~1.2kg higher average weight |
| rs9939609 | AA | ~3kg higher, 1.7x obesity risk |

#### CYP1A2 - Caffeine Metabolism
| rsID | Genotype | Impact |
|------|----------|--------|
| rs762551 | AA | Fast metabolizer, 2-4 cups OK |
| rs762551 | AC | Moderate, 1-3 cups, avoid after noon |
| rs762551 | CC | Slow, limit to 1-2 cups, none after noon |

### Food Sensitivities

#### HLA-DQ2/DQ8 - Celiac Disease Risk
| rsID | Genotype | Impact |
|------|----------|--------|
| rs2187668 | TT | Lower risk |
| rs2187668 | TC | Increased susceptibility |
| rs2187668 | CC | High susceptibility |

#### DAO/HNMT - Histamine Intolerance
| rsID | Genotype | Impact |
|------|----------|--------|
| rs10156191 (DAO) | CC | Normal DAO activity |
| rs10156191 (DAO) | CT | Mildly reduced |
| rs10156191 (DAO) | TT | Reduced DAO activity |
| rs1050891 (HNMT) | CC | Normal histamine metabolism |
| rs1050891 (HNMT) | CT/TT | Reduced histamine breakdown |

### Antioxidant & Inflammation

#### SOD2 - Mitochondrial Antioxidant
| rsID | Genotype | Impact |
|------|----------|--------|
| rs4880 | TT | Efficient mitochondrial targeting |
| rs4880 | TC | Intermediate |
| rs4880 | CC | Different antioxidant needs, avoid high-dose antioxidants |

#### IL6 - Inflammation
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1800795 | GG | Higher IL-6 production, more inflammation |
| rs1800795 | GC | Intermediate |
| rs1800795 | CC | Lower inflammatory response |

## Analysis Logic

```typescript
interface WellnessResult {
  methylationStatus: {
    mthfrActivity: number; // percentage
    recommendation: string;
    supplements: string[];
  };
  vitaminNeeds: {
    vitaminD: 'normal' | 'increased' | 'significantly_increased';
    vitaminB12: 'normal' | 'increased' | 'decreased';
    folate: 'normal' | 'increased' | 'decreased';
  };
  dietarySensitivities: {
    lactose: 'tolerant' | 'intolerant' | 'variable';
    gluten: 'standard' | 'caution' | 'sensitive';
    histamine: 'normal' | 'caution' | 'intolerant';
    caffeine: 'fast' | 'moderate' | 'slow';
  };
  metabolicFactors: {
    obesityRisk: 'low' | 'moderate' | 'elevated';
    metabolicRate: 'fast' | 'normal' | 'slow';
  };
}
```

## Output Format

```json
{
  "methylationSummary": {
    "status": "Reduced",
    "mthfrActivity": "65-70%",
    "keyVariant": "MTHFR C677T ( heterozygous )",
    "recommendations": [
      "Consider methylfolate instead of folic acid",
      "Ensure adequate B12 and B6 intake",
      "Monitor homocysteine levels periodically"
    ],
    "supplements": ["Methylfolate 400-800mcg", "Methylcobalamin B12", "P-5-P B6"]
  },
  "vitaminProfile": {
    "vitaminD": {
      "status": "Increased Need",
      "reason": "VDR variant may reduce receptor function",
      "recommendation": "Target 40-60 ng/mL, consider 3000-5000 IU daily"
    },
    "vitaminB12": {
      "status": "Normal",
      "recommendation": "Standard intake adequate"
    }
  },
  "dietaryConsiderations": [
    {
      "category": "Lactose",
      "status": "Intolerant",
      "confidence": "High",
      "recommendation": "Use lactase supplements or choose dairy alternatives"
    },
    {
      "category": "Gluten",
      "status": "Standard",
      "confidence": "High",
      "recommendation": "No special dietary modifications needed based on genetics"
    },
    {
      "category": "Histamine",
      "status": "Caution",
      "confidence": "Moderate",
      "recommendation": "Consider reducing fermented foods and wine if symptomatic"
    }
  ],
  "metabolicInsights": [
    {
      "trait": "Obesity Genetic Risk",
      "status": "Moderate",
      "implication": "Genetic predisposition exists but lifestyle significantly modifies risk",
      "recommendation": "Regular exercise offsets FTO effect by ~40%"
    }
  ]
}
```

## Dashboard Presentation

### Visual Elements
- **Methylation cycle diagram** with activity percentage
- **Vitamin level gauges** with target ranges
- **Dietary sensitivity badges** (color-coded)
- **Supplement stack visualization**

### Color Coding
- 🟢 **Optimal/Normal** - Green
- 🟡 **Moderate Concern** - Yellow/Amber
- 🟠 **Elevated Concern** - Orange
- 🔴 **Significant Concern** - Red

## Coverage Summary

This analysis covers the following wellness trait categories:
- Nutrition & Metabolism
- Food Response & Sensitivities
- Physical Performance & Body Composition
- Antioxidant & Inflammation

## Data Sources

- SNPedia genetic interpretations
- NIH Genetic Home Reference
- PubMed peer-reviewed studies
- nutrigenomics research databases
