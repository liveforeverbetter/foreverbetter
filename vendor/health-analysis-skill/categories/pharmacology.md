# Pharmacology Analysis Skill

Analyzes genetic variants affecting drug metabolism, efficacy, and adverse reactions.
This includes pharmacogenomic markers for dosage recommendations, drug sensitivity, and drug interactions.

## Key Genetic Markers

### Cytochrome P450 Family (Primary Drug Metabolism)

#### CYP1A2 - Caffeine & Drug Metabolism
| rsID | Genotype | Phenotype | Clinical Impact |
|------|----------|-----------|----------------|
| rs762551 | AA | Fast metabolizer | Normal caffeine processing, 2-4 cups coffee OK |
| rs762551 | AC | Intermediate | Moderate caffeine sensitivity, limit to 1-3 cups |
| rs762551 | CC | Slow metabolizer | Caffeine stays longer, limit to 1-2 cups, avoid after noon |

#### CYP2C9 - Warfarin, NSAIDs, Phenytoin
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1799853 | TT | Normal |
| rs1799853 | TC | Reduced metabolism, lower warfarin dose |
| rs1799853 | CC | Poor metabolizer, significantly reduced metabolism |

#### CYP2C19 - PPIs, Clopidogrel, Antidepressants
| rsID | Genotype | Impact |
|------|----------|--------|
| rs4244285 | AA | Normal metabolizer |
| rs4244285 | AG | Intermediate metabolizer |
| rs4244285 | GG | Poor metabolizer (affects clopidogrel activation) |

#### CYP2D6 - Antidepressants, Antipsychotics, Opioids
| rsID | Genotype | Impact |
|------|----------|--------|
| rs3892097 | AA | Normal *1/*1 |
| rs3892097 | AG | Poor metabolizer *4/*4 carrier |
| rs3892097 | GG | Poor metabolizer *4/*4 Homozygous |

#### CYP3A4/5 - Statins, Calcium Channel Blockers
| rsID | Genotype | Impact |
|------|----------|--------|
| rs776746 | CC | Normal metabolism |
| rs776746 | CT/TT | Reduced CYP3A5 expression |

### Drug Target Genes

#### SLCO1B1 - Statin Sensitivity
| rsID | Genotype | Impact |
|------|----------|--------|
| rs4149056 | CC | Normal statin tolerance |
| rs4149056 | TC | Increased statin sensitivity, higher myopathy risk |
| rs4149056 | TT | Significantly increased myopathy risk |

#### VKORC1 - Warfarin Sensitivity
| rsID | Genotype | Impact |
|------|----------|--------|
| rs9923231 | AA | Normal warfarin sensitivity |
| rs9923231 | AG | Increased sensitivity, lower dose may be needed |
| rs9923231 | GG | High warfarin sensitivity, significantly lower dose required |

#### DPYD - 5-FU/Capecitabine Toxicity
| rsID | Genotype | Impact |
|------|----------|--------|
| rs3918290 | CC | Normal DPD enzyme function |
| rs3918290 | CT/TT | DPD deficiency, risk of severe toxicity |

#### TPMT - Thiopurine Toxicity (Azathioprine, 6-MP)
| rsID | Genotype | Impact |
|------|----------|--------|
| rs1800462 | AA | Normal TPMT activity |
| rs1800462 | AG | Intermediate activity, reduce dose 30-70% |
| rs1800462 | GG | Low activity, severe toxicity risk, use alternative |

#### UGT1A1 - Irinotecan Toxicity
| rsID | Genotype | Impact |
|------|----------|--------|
| rs4148323 | AA | Normal bilirubin metabolism |
| rs4148323 | AG | Gilbert-like syndrome, mild elevation |
| rs4148323 | GG | Crigler-Najjar syndrome (severe) |

## Comprehensive Pharmacogenomics Database (95+ drugs)

### Antidepressants & Psychiatric Medications

| Drug | Category | Key Genes |
|------|----------|-----------|
| Amitriptyline | Dosage | CYP2D6, CYP2C19 |
| Citalopram | Dosage | CYP2C19, CYP2D6, SLC6A4, HTR2A |
| Clomipramine | Dosage | CYP2D6, CYP2C19 |
| Desipramine | Dosage | CYP2D6, CYP2C19 |
| Doxepin | Dosage | CYP2D6, CYP2C19 |
| Escitalopram | Dosage | CYP2C19, CYP2D6, SLC6A4, HTR2A |
| Fluvoxamine | Dosage | CYP2D6, CYP2C19, CYP2B6 |
| Imipramine | Dosage | CYP2D6, CYP2C19 |
| Mirtazapine | Adverse Reactions | CYP2D6, CYP3A4 |
| Nortriptyline | Dosage | CYP2D6, CYP2C19 |
| Paroxetine | Dosage | CYP2D6, CYP2C19, SLC6A4, HTR2A |
| Sertraline | Dosage | CYP2C19, CYP2D6, CYP2B6, SLC6A4, HTR2A |
| Trimipramine | Dosage | CYP2C19, CYP2D6, CYP2C9 |
| Venlafaxine | Dosage | CYP2D6 |
| Vortioxetine | Dosage | CYP2D6, CYP2C19, CYP2B6, SLC6A4, HTR2A |

### Antipsychotics

| Drug | Category | Key Genes |
|------|----------|-----------|
| Aripiprazole | Dosage | CYP2D6, CYP3A4, CYP1A2 |
| Brexpiprazole | Dosage | CYP2D6, CYP3A4, CYP1A2 |
| Haloperidol | Dosage | CYP2D6, CYP3A4, CYP1A2 |
| Iloperidone | Dosage | CYP3A4, CYP2D6 |
| Olanzapine | Adverse Effects | HTR2A, DRD2, ANKK1 |
| Olanzapine | Efficacy | DRD3, HTR2A, DRD2, CYP1A2, ABCB1 |
| Pimozide | Dosage | CYP2D6, CYP3A4, CYP1A2 |
| Quetiapine | Dosage | CYP3A4, CYP2D6, CYP3A5, ABCB1, CYP1A2 |
| Zuclopenthixol | Dosage | CYP2D6, CYP3A4, CYP1A2 |

### Antiepileptics

| Drug | Category | Key Genes |
|------|----------|-----------|
| Brivaracetam | Dosage | CYP2C19 |
| Carbamazepine | Dosage | CYP3A4, CYP3A5, SCN1A, EPHX1 |
| Clobazam | Adverse Reactions | CYP2C19 |
| Diazepam | Adverse Reactions | CYP2C19, CYP2B6 |
| Lornoxicam | Dosage | CYP2C9, CYP2C8 |
| Phenytoin | Dosage | CYP2C9, HLA, CYP2C19 |
| Piroxicam | Dosage | CYP2C9 |
| Tenoxicam | Dosage | CYP2C9 |
| Valproic Acid | Adverse Effects | POLG |

### Opioid Analgesics

| Drug | Category | Key Genes |
|------|----------|-----------|
| Codeine | Dosage | CYP2D6, OPRM1, COMT |
| Fentanyl | Efficacy | CYP3A4, CYP3A5 |
| Hydrocodone | Dosage | CYP2D6, OPRM1, OPRD1, COMT |
| Tramadol | Dosage | CYP2D6, CYP3A4, OPRM1, COMT, CYP2C9 |

### Statins & Cardiovascular

| Drug | Category | Key Genes |
|------|----------|-----------|
| Atorvastatin | Dosage | SLCO1B1, CYP3A4, CYP2C9, ABCG2 |
| Fluvastatin | Dosage | SLCO1B1, CYP2C9 |
| Lovastatin | Dosage | CYP3A4, SLCO1B1, ABCG2, CYP2C9 |
| Pitavastatin | Dosage | SLCO1B1, ABCG2, CYP2C9 |
| Pravastatin | Efficacy | SLCO1B1, ABCG2, CYP2C9 |
| Rosuvastatin | Dosage | ABCG2, SLCO1B1, CYP2C9 |
| Simvastatin | Dosage | SLCO1B1, CYP3A4, ABCG2, CYP2C9 |
| Statins (myopathy risk) | Adverse Effects | SLCO1B1, ABCG2, CYP2C9 |

### Anticoagulants & Antiplatelets

| Drug | Category | Key Genes |
|------|----------|-----------|
| Acenocoumarol, Fenprocoumon | Adverse Effects | VKORC1, CYP2C9 |
| Clopidogrel | Dosage | CYP2C19, CYP2C8 |
| Fluindione | Adverse Reactions | CYP2C9, VKORC1 |
| Warfarin | Adverse Reactions | CYP2C9, VKORC1 |

### PPIs & Gastrointestinal

| Drug | Category | Key Genes |
|------|----------|-----------|
| Lansoprazole, Dexlansoprazole | Dosage | CYP2C19 |
| Omeprazole | Efficacy | CYP2C19 |
| Pantoprazole | Dosage | CYP2C19 |

### NSAIDs

| Drug | Category | Key Genes |
|------|----------|-----------|
| Celecoxib | Dosage | CYP2C9, CYP2C8 |
| Flurbiprofen | Dosage | CYP2C9 |
| Ibuprofen | Dosage | CYP2C9, CYP2C8 |

### Chemotherapy & Oncology

| Drug | Category | Key Genes |
|------|----------|-----------|
| Carbamazepine | (see antiepileptics) | - |
| Cisplatin | Adverse Reactions | TPMT, COMT |
| Daunorubicin, Doxorubicin | Adverse Reactions | UGT1A6, SLC28A3, RARG |
| Docetaxel | Adverse Effects | SLCO1B3, ABCC2 |
| Fluorouracil, Capecitabine | Dosage | DPYD |
| Irinotecan | Adverse Effects | UGT1A1, CYP3A4, ABCC2, UGT1A7, UGT1A9 |
| Methotrexate | Adverse Reactions | MTHFR, ATIC |
| Methotrexate (RA) | Efficacy | SLC19A1, ATIC, MTHFR |
| Nilotinib | Adverse Reactions | UGT1A1, BCR, ABL1 |
| Tamoxifen | Efficacy | CYP2D6 |

### HIV Antiretrovirals

| Drug | Category | Key Genes |
|------|----------|-----------|
| Abacavir | Adverse Effects | HLA-B*5701, HCP5 |
| Atazanavir | Adverse Effects | UGT1A1, CYP3A4, CYP3A5 |
| Efavirenz | Adverse Effects | CYP2B6, CYP2C19, CYP3A4 |

### Immunosuppressants

| Drug | Category | Key Genes |
|------|----------|-----------|
| Tacrolimus | Dosage | CYP3A5, CYP3A4, FKBP12 |
| Thioguanine, Azathioprine, Mercaptopurine | Dosage | TPMT, NUDT15 |

### Other Therapeutic Areas

| Drug | Category | Key Genes |
|------|----------|-----------|
| Abacavir | Adverse Effects | HLA-B*5701 |
| Allopurinol | Dosage | HLA-B*5801, ABCG2 |
| Aminoglycoside antibiotics | Adverse Effects | MT-RNR1, RNR1 |
| Amifampridine | Dosage | NAT2 |
| Atomoxetine | Dosage | CYP2D6 |
| Celecoxib | Dosage | CYP2C9 |
| Eliglustat | Adverse Reactions | CYP2D6, CYP3A |
| Flucytosine | Adverse Reactions | DPYD |
| Floxacillin | Adverse Effects | HLA-B |
| G6PD Deficiency | Adverse Drug Reactions | G6PD |
| Gonadotrophins and Ovulation Stimulants | Efficacy | FSHR |
| Inhalation anesthetics and succinylcholine | Adverse Effects | RYR1, CACNA1S, BCHE |
| Isoniazid | Adverse Effects | NAT2 |
| Ivacaftor | Efficacy | CFTR |
| Lumacaftor + Ivacaftor | Efficacy | CFTR |
| Meloxicam | Dosage | CYP2C9 |
| Mivacurium and succinylcholine | Adverse Reactions | BCHE |
| Peginterferons alfa-2a -2b and ribavirin | Efficacy | IFNL3, IL28B |
| Pitolisant | Dosage | CYP2D6, CYP3A4 |
| Propafenone | Adverse Reactions | CYP2D6, CYP3A4, CYP1A2 |
| Siponimod | Dosage | CYP2C9 |
| Voriconazole | Dosage | CYP2C19, CYP3A4 |

## Key Pharmacogenomic Genes Summary

| Gene | Function | Drugs Affected |
|------|----------|----------------|
| CYP2D6 | Phase I metabolism (40%+ of drugs) | SSRIs, TCAs, antipsychotics, opioids, tamoxifen, tramadol |
| CYP2C19 | Phase I metabolism | PPIs, clopidogrel, benzodiazepines, antidepressants |
| CYP3A4/5 | Phase I metabolism (most abundant) | Statins, calcineurin inhibitors, many drugs |
| CYP2C9 | Phase I metabolism (warfarin, NSAIDs) | Warfarin, fluvastatin, celecoxib |
| CYP1A2 | Phase I metabolism | Haloperidol, olanzapine, caffeine |
| SLCO1B1 | Drug transporter (statin uptake) | All statins, repaglinide |
| VKORC1 | Warfarin target | Warfarin, acenocoumarol |
| HLA genes | Immune-mediated adverse reactions | Abacavir (HLA-B), allopurinol (HLA-B), floxacillin (HLA-B) |
| TPMT | Thiopurine metabolism | Azathioprine, mercaptopurine, thioguanine |
| DPYD | 5-FU/capecitabine metabolism | Fluorouracil, capecitabine |
| UGT1A1 | Drug conjugation | Irinotecan, nilotinib, atazanavir |
| NAT2 | Acetylator status | Isoniazid, amifampridine |
| ABCG2 | Drug transporter | Statins, rosuvastatin |
| OPRM1 | Opioid receptor | Codeine, tramadol, hydrocodone |
| COMT | Catecholamine metabolism | Opioids, psychiatric medications |
| CFTR | Chloride channel | Ivacaftor, lumacaftor/ivacaftor |
| RYR1/CACNA1S | Muscle calcium release | Malignant hyperthermia |
| POLG | Mitochondrial DNA polymerase | Valproic acid |
| SCN1A | Sodium channel | Carbamazepine |
| BCHE | Butyrylcholinesterase | Mivacurium, succinylcholine |

## Analysis Logic

```typescript
interface PharmacologyResult {
  metabolizerStatus: {
    cyp1a2: 'fast' | 'intermediate' | 'slow';
    cyp2c9: 'normal' | 'reduced' | 'poor';
    cyp2c19: 'normal' | 'intermediate' | 'poor';
    cyp2d6: 'normal' | 'intermediate' | 'poor';
  };
  drugSensitivities: {
    drug: string;
    gene: string;
    status: 'normal' | 'caution' | 'avoid';
    recommendation: string;
  }[];
  dosageRecommendations: {
    drugClass: string;
    recommendation: string;
    evidence: string;
  }[];
}
```

## Output Format

```json
{
  "metabolizerProfile": {
    "cyp1a2": {
      "phenotype": "Slow Metabolizer",
      "implications": ["Caffeine stays in system longer", "May experience caffeine jitters"]
    },
    "cyp2c19": {
      "phenotype": "Normal Metabolizer",
      "implications": ["Standard drug dosing applies"]
    }
  },
  "medicationConsiderations": [
    {
      "category": "Statins",
      "medication": "Simvastatin",
      "status": "caution",
      "reason": "SLCO1B1 variant increases myopathy risk",
      "recommendation": "Consider lower dose or alternative statin"
    },
    {
      "category": "Anticoagulants",
      "medication": "Warfarin",
      "status": "adjusted",
      "reason": "VKORC1 variant affects sensitivity",
      "recommendation": "Lower initial dose with close INR monitoring"
    },
    {
      "category": "Antidepressants",
      "medication": "SSRIs (Paroxetine, Fluoxetine)",
      "status": "normal",
      "reason": "CYP2D6 normal function",
      "recommendation": "Standard dosing expected"
    }
  ],
  "keyRecommendations": [
    "Share this report with your healthcare provider before starting new medications",
    "Consider pharmacogenomic testing if starting long-term medication therapy",
    "Review caffeine intake given CYP1A2 status"
  ]
}
```

## Dashboard Presentation

### Visual Elements
- **Metabolizer gauge** for each CYP enzyme (visual spectrum: fast → slow)
- **Drug category cards** with status badges (Normal/Caution/Avoid)
- **Timeline indicator** for medication timing recommendations

### Status Indicators
- 🟢 **Normal** - Standard dosing applies
- 🟡 **Caution** - May need dose adjustment or alternative
- 🔴 **Avoid** - Consider alternative medications

## Coverage Summary

This analysis covers the following therapeutic areas:
- Antidepressants & Psychiatric Medications
- Antipsychotics
- Antiepileptics
- Opioid Analgesics
- Statins & Cardiovascular Drugs
- Anticoagulants & Antiplatelets
- Proton Pump Inhibitors
- NSAIDs
- Chemotherapy & Oncology
- HIV Antiretrovirals
- Immunosuppressants

## Data Sources

- PharmGKB (Pharmacogenomics Knowledge Base)
- CPIC (Clinical Pharmacogenetics Implementation Consortium)
- FDA pharmacogenomic biomarker labels
- DPWG (Dutch Pharmacogenetics Working Group)