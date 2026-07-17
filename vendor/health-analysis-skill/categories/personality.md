# Personality & Cognition Analysis Skill

Analyzes genetic variants affecting cognitive function, personality traits, neurotransmitter systems,
and behavioral tendencies. These are polygenic traits influenced by multiple genes.

## Key Genetic Markers

### Dopamine System

#### COMT - Catechol-O-Methyltransferase
| rsID | Genotype | Phenotype | Impact |
|------|----------|-----------|--------|
| rs4680 | GG | Warrior (Fast COMT) | Rapid dopamine breakdown, stress resilience |
| rs4680 | AG | Intermediate | Balanced dopamine levels |
| rs4680 | AA | Worrier (Slow COMT) | Slower dopamine breakdown, enhanced cognition, stress sensitivity |

#### DRD2 - Dopamine D2 Receptor
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1800497 | CC | Normal receptor density |
| rs1800497 | CT | Slightly reduced receptor density |
| rs1800497 | TT | Reduced receptor density, higher impulsivity |

#### DRD4 - Dopamine D4 Receptor
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1800955 | 2R/4R | Common variants |
| rs1800955 | 7R | Novelty seeking, ADHD association |

#### DAT1 - Dopamine Transporter
| rsID | Genotype | Impact |
|------|----------|--------|
| rs28363170 | 9R | Normal |
| rs28363170 | 10R | Higher dopamine reuptake, ADHD association |

### Serotonin System

#### SLC6A4 - Serotonin Transporter (5-HTTLPR)
| rsID | Genotype | Impact |
|------|----------|--------|
| rs4795541 | LL | High serotonin transport, stress resilience |
| rs4795541 | SL | Intermediate |
| rs4795541 | SS | Reduced transport, higher anxiety/depression risk |

#### HTR2A - Serotonin 2A Receptor
| rsID | Genotype | Impact |
|------|----------|--------|
| rs6313 | CC | Normal receptor density |
| rs6313 | CT | Reduced receptor density |
| rs6313 | TT | Significantly reduced, affects mood/cognition |

### Mood & Stress Response

#### BDNF - Brain-Derived Neurotrophic Factor
| rsID | Genotype | Impact |
|------|----------|--------|
| rs6265 | CC | Normal BDNF secretion, optimal neuroplasticity |
| rs6265 | CT | Reduced activity-dependent secretion |
| rs6265 | TT | Significantly reduced, memory/learning affected |

#### FKBP5 - Stress Response
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1360780 | TT | Normal cortisol response |
| rs1360780 | TC | Exaggerated stress response |
| rs1360780 | CC | Significantly exaggerated, PTSD/depression risk |

#### MAOA - Monoamine Oxidase A
| rsID | Genotype | Impact |
|------|----------|--------|
| rs6323 | 3R | High activity, normal neurotransmitter breakdown |
| rs6323 | 2R/5R | Low activity, slower breakdown, stress sensitivity |

### Cognitive Function

#### KIBRA - Memory
| rsID | Genotype | Impact |
|------|----------|--------|
| rs17070145 | CC | Normal memory function |
| rs17070145 | CT | Reduced episodic memory |
| rs17070145 | TT | Significantly reduced memory |

#### GABRA2 - GABA Receptor
| rsID | Genotype | Impact |
|------|----------|--------|
| rs279858 | GG | Normal inhibitory neurotransmission |
| rs279858 | GA | Reduced, increased anxiety |
| rs279858 | AA | Significantly reduced, elevated anxiety |

### Additional Cognitive Markers

| rsID | Gene | Impact |
|------|------|--------|
| rs362819 | CHRM2 | Memory performance |
| rs1019385 | GRIN2B | NMDA receptor function, synaptic plasticity |
| rs7844085 | PRDM2 | Executive processing |
| rs6439886 | CLSTN2 | Memory consolidation |

## Analysis Logic

```typescript
interface PersonalityResult {
  neurotransmitterProfile: {
    dopamine: 'fast' | 'balanced' | 'slow';
    serotonin: 'high_transport' | 'normal' | 'reduced_transport';
    gaba: 'normal' | 'reduced';
  };
  cognitiveTraits: {
    memory: 'optimal' | 'average' | 'reduced';
    stressResponse: 'resilient' | 'moderate' | 'sensitive';
    anxietyRisk: 'low' | 'moderate' | 'elevated';
  };
  personalityInsights: {
    phenotype: string; // e.g., "Worrier", "Warrior"
    traits: string[];
    strengths: string[];
    considerations: string[];
  };
}
```

## Output Format

```json
{
  "neurotransmitterProfile": {
    "dopamine": {
      "phenotype": "Worrier",
      "genotype": "AA",
      "gene": "COMT Val158Met",
      "interpretation": "Slower dopamine breakdown may enhance working memory but increase stress sensitivity"
    },
    "serotonin": {
      "phenotype": "Reduced Transport",
      "genotype": "SS",
      "gene": "SLC6A4 5-HTTLPR",
      "interpretation": "Reduced serotonin reuptake may affect mood regulation and stress response"
    }
  },
  "cognitiveTraits": [
    {
      "trait": "Working Memory",
      "status": "Enhanced",
      "genotype": "COMT AA",
      "implication": "May have enhanced prefrontal cortex function"
    },
    {
      "trait": "Stress Response",
      "status": "Elevated Sensitivity",
      "genotype": "FKBP5 CC + COMT AA",
      "implication": "May benefit from stress management practices"
    }
  ],
  "personalitySummary": {
    "phenotype": "Cognitive Enhancer with Stress Sensitivity",
    "description": "Genetic variants suggest enhanced cognitive potential with increased sensitivity to stress. Your COMT genotype may provide advantages in sustained attention tasks while requiring attention to stress management.",
    "strengths": [
      "Enhanced working memory and cognitive performance",
      "Better sustained attention",
      "Potential for deep focus and concentration"
    ],
    "considerations": [
      "Higher stress sensitivity - prioritize stress management",
      "May benefit from mindfulness practices",
      "Consider adaptogenic support during high-stress periods"
    ]
  },
  "supplementRecommendations": [
    {
      "for": "Stress response",
      "recommendations": ["Ashwagandha", "Phosphatidylserine", "Magnesium glycinate"]
    },
    {
      "for": "Cognitive support",
      "recommendations": ["L-theanine", "Rhodiola rosea", "Omega-3 DHA"]
    }
  ]
}
```

## Dashboard Presentation

### Visual Elements
- **Neurotransmitter radar chart** showing dopamine, serotonin, GABA balance
- **Trait badges** with strength indicators
- **Personality archetype card** (Warrior, Worrier, etc.)
- **Supplement recommendations panel**

### Phenotype Archetypes

Common interpretations:
- **Warrior** (COMT GG) - Stress-resilient, fast-acting dopamine
- **Worrier** (COMT AA) - Enhanced cognition, stress-sensitive
- **Explorer** (DRD4 7R) - Novelty seeking, high curiosity
- **Builder** (DRD2 CC) - Consistent, reward-focused

## Important Notes

1. **Personality is polygenic** - Many genes contribute to personality traits
2. **Environment matters** - Genes influence but don't determine behavior
3. **Self-awareness tool** - Understanding genetic tendencies can aid personal growth
4. **Not deterministic** - These are propensities, not predestined outcomes

## Coverage Summary

This analysis covers the following trait categories:
- Cognitive & Brain Function
- Personality & Behavior
- Physical Traits
- Health/Blood Traits
- Metabolizer Profiles

## Data Sources

- Molecular Psychiatry research publications
- PNAS (personality genetics studies)
- Molecular Genetics and Genomics research
- Twin and family studies on personality
