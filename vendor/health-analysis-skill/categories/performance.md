# Performance Analysis Skill

Analyzes genetic variants affecting physical performance, exercise response, muscle composition,
athletic potential, and recovery capacity. Useful for fitness optimization and training personalization.

## Key Genetic Markers

### Muscle Fiber Composition

#### ACTN3 - Alpha-Actinin-3 (Fast-Twitch Muscle)
| rsID | Genotype | Phenotype | Impact |
|------|----------|-----------|--------|
| rs1815739 | CC | RR | Full ACTN3, optimized for power/speed |
| rs1815739 | CT | RX | Intermediate, some power capability |
| rs1815739 | TT | XX | Null, enhanced endurance potential |

#### Myostatin (MSTN) - Muscle Growth Inhibition
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1805086 | AA | Normal myostatin, average muscle growth |
| rs1805086 | AG | Reduced inhibition, enhanced muscle building |
| rs1805086 | GG | Significantly enhanced muscle potential |

### Cardiovascular & Oxygen Efficiency

#### ACE - Angiotensin-Converting Enzyme
| rsID | Genotype | Phenotype | Impact |
|------|----------|-----------|--------|
| rs4340 | II | Endurance | Better cardiovascular efficiency |
| rs4340 | ID | Intermediate | Balanced potential |
| rs4340 | DD | Power | Strength/power advantage |

#### PPARGC1A - PGC-1alpha (Mitochondrial Biogenesis)
| rsID | Genotype | Impact |
|------|----------|--------|
| rs8192678 | GG | Normal mitochondrial function |
| rs8192678 | GA | Reduced endurance training response |
| rs8192678 | AA | Significantly reduced adaptation |

### Energy Production & Recovery

#### AMPD1 - Adenosine Monophosphate Deaminase
| rsID | Genotype | Impact |
|------|----------|--------|
| rs17602729 | CC | Normal ATP production during exercise |
| rs17602729 | CT | Reduced high-intensity capacity |
| rs17602729 | TT | Significant limitation in sprints |

#### CPT1B - Carnitine Palmitoyltransferase
| rsID | Genotype | Impact |
|------|----------|--------|
| rs2302205 | TT | Normal fatty acid oxidation |
| rs2302205 | TC/CC | Reduced fatty acid oxidation |

### Tendon & Joint Health

#### GDF5 - Growth Differentiation Factor 5
| rsID | Genotype | Impact |
|------|----------|--------|
| rs143383 | CC | Normal tendon/ligament strength |
| rs143383 | CT | Slightly increased injury risk |
| rs143383 | TT | Elevated osteoarthritis/tendon injury risk |

#### COL1A1 - Type I Collagen
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1800012 | GG | Normal collagen, lower injury risk |
| rs1800012 | GT/TT | Increased tendon/ligament injury risk |

### Training Response

#### HIF1A - Hypoxia-Inducible Factor
| rsID | Genotype | Impact |
|------|----------|--------|
| rs11549465 | CC | Normal adaptation to altitude |
| rs11549465 | TC/TT | Better altitude adaptation |

#### UCP2 - Uncoupling Protein 2
| rsID | Genotype | Impact |
|------|----------|--------|
| rs659366 | CC | Normal energy expenditure |
| rs659366 | TC/TT | May have higher metabolic efficiency |

### Lactate & Endurance

#### LDHA - Lactate Dehydrogenase
| rsID | Genotype | Impact |
|------|----------|--------|
| rs2272042 | CC | Normal lactate threshold |
| rs2272042 | TC/TT | May have altered lactate metabolism |

## Analysis Logic

```typescript
interface PerformanceResult {
  muscleProfile: {
    fiberType: 'power' | 'endurance' | 'balanced';
    optimalTraining: string[];
    recoveryCapacity: 'fast' | 'moderate' | 'slow';
  };
  athleticPotential: {
    powerSports: 'advantage' | 'neutral' | 'disadvantage';
    enduranceSports: 'advantage' | 'neutral' | 'disadvantage';
    mixedSports: 'advantage' | 'neutral' | 'disadvantage';
  };
  injuryRisk: {
    tendons: 'low' | 'moderate' | 'elevated';
    joints: 'low' | 'moderate' | 'elevated';
  };
  trainingRecommendations: {
    strengthTraining: string;
    cardioTraining: string;
    recoveryProtocol: string;
  };
}
```

## Output Format

```json
{
  "muscleProfile": {
    "primaryType": "Power-Oriented",
    "secondaryType": "Some Endurance Capability",
    "genotypeSummary": "ACTN3 RX + ACE ID + MSTN AA",
    "interpretation": "Your genetics suggest a combination of fast-twitch fiber capacity with some endurance potential. You may excel at activities requiring both power and sustained effort."
  },
  "athleticPotential": [
    {
      "category": "Power Sports",
      "sports": ["Weightlifting", "Sprinting", "CrossFit", "Gymnastics"],
      "assessment": "Advantage",
      "rationale": "ACTN3 RR genotype supports fast-twitch muscle optimization"
    },
    {
      "category": "Endurance Sports",
      "sports": ["Long-distance running", "Cycling", "Swimming"],
      "assessment": "Neutral to Advantage",
      "rationale": "Some endurance markers present, but power genes may limit elite endurance potential"
    }
  ],
  "trainingPersonalization": {
    "strengthTraining": {
      "focus": "Heavy compound movements with moderate volume",
      "recovery": "48-72 hours between intense sessions",
      "supplements": ["Creatine monohydrate", "Beta-alanine", "Whey protein"]
    },
    "cardioTraining": {
      "focus": "Zone 2 base with HIIT intervals",
      "ratio": "70% aerobic / 30% high-intensity",
      "supplements": ["Beetroot nitrate", "L-citrulline"]
    }
  },
  "injuryPrevention": [
    {
      "concern": "Tendon/Ligament Risk",
      "status": "Moderate",
      "recommendations": [
        "Prioritize collagen peptides (10g daily)",
        "Include prehab exercises for vulnerable joints",
        "Progress training volume gradually"
      ]
    }
  ]
}
```

## Dashboard Presentation

### Visual Elements
- **Athlete profile card** with sport icons
- **Training zone distribution chart** (power vs endurance)
- **Injury risk gauge** with body diagram
- **Supplement stack** for performance

### Sport Matching

| Genetic Profile | Best Sports |
|----------------|-------------|
| Power + Endurance | CrossFit, team sports, martial arts |
| Pure Power | Weightlifting, sprinting, baseball |
| Pure Endurance | Long-distance, cycling, swimming |
| Balanced | Military, tactical sports |

## Supplement Recommendations by Gene

| Gene/Variant | Supplements |
|--------------|-------------|
| ACTN3 TT (endurance) | Creatine, Beta-alanine, Whey protein |
| ACE DD (power) | L-citrulline, L-arginine, Beetroot |
| AMPD1 TT | D-ribose, Betaine, L-carnitine |
| MSTN GG | Leucine, HMB, Creatine |
| GDF5 TT | Collagen peptides, Vitamin C, Silica |

## Data Sources

- Sports Genomics research
- Journal of Strength and Conditioning Research
- NCBI Sports Science literature
- Athletic performance GWAS studies
