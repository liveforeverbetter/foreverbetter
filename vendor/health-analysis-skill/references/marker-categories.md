# Marker Category Mapping

Maps the existing repository markers to the 7 skill suite categories.

## Existing Repository Categories

The codebase has these categories defined in `src/lib/markers/types.ts`:
- methylation
- neurotransmitters
- cardiovascular
- metabolism
- detoxification
- nutrient_processing
- inflammation
- histamine
- gluten_sensitivity
- gut_health
- circadian_rhythm
- longevity
- cognitive
- physical_performance
- sleep_recovery
- bone_joint
- telomere

## Skill Suite Categories (7 Total)

### 1. Ancestry
**Purpose**: Ancestry composition, haplogroups, Neanderthal %, lineage tracing

**Related repo markers**: None currently defined
**Additional markers needed**:
- Mitochondrial DNA markers (MT-RNR2, MT-ND1, MT-ND2)
- Y-chromosome markers (SRY, DYS19, DYS390)
- Ancestry composition SNPs (rs1024002, rs1293823, rs3787238)
- Neanderthal introgression markers (rs1294558, rs1861685, rs4659768)

### 2. Pharmacology
**Purpose**: Drug metabolism, pharmacogenetics, medication sensitivities

**Related repo markers**: None currently defined
**Additional markers needed**:
- CYP1A2 (rs762551) - already in metabolism via caffeine
- CYP2C9, CYP2C19, CYP2D6
- VKORC1 (rs9933231)
- DPYD (rs3918290)
- TPMT (rs1800462)
- SLCO1B1 (rs4149056)
- UGT1A1 (rs4148323)

### 3. Wellness
**Purpose**: Nutrition, vitamins, metabolism, food sensitivities

**Related repo markers**:
- `methylation`: MTHFR, MTR, MTRR, CBS
- `nutrient_processing`: VDR, HFE
- `metabolism`: LCT, MCM6, FTO, PPARG, ADRB2
- `detoxification`: CYP1A2, GSTP1, NQO1
- `inflammation`: SOD2, IL6, IL10
- `histamine`: DAO, HNMT
- `gluten_sensitivity`: HLA-DQA1, HLA-DQB1
- `gut_health`: FUT2

### 4. Hereditary
**Purpose**: Monogenic conditions, carrier status, rare disease genes

**Related repo markers**: None of the wellness markers directly, but HFE is related
**Additional markers needed**:
- CFTR (cystic fibrosis)
- BRCA1, BRCA2 (hereditary breast cancer)
- DMD (muscular dystrophy)
- F8, F9 (hemophilia)
- HBB (sickle cell)
- GBA (Gaucher disease)
- HEXA (Tay-Sachs)

### 5. Personality
**Purpose**: Cognitive traits, behavioral tendencies, neurotransmitter function

**Related repo markers**:
- `neurotransmitters`: COMT, BDNF, ADRA2A, FKBP5, NR3C1, SLC6A4, CRHR1, CRHR2
- `cognitive`: COMT, BDNF, PRDM2, SLC6A4, HTR2A, DRD2, DRD4, MAOA, CHRM2, SNAP25, KIBRA, CLSTN2, GABRA2, NGF, SYP, RELN, TCF7L2
- `circadian_rhythm`: CLOCK (also in sleep_recovery)

### 6. Performance
**Purpose**: Athletic potential, exercise response, muscle composition

**Related repo markers**:
- `physical_performance`: ACTN3, ACE, PPARG, PPARGC1A, AMPD1, CPT1B, GDF5, COL1A1, HIF1A, UCP2, LDHA, PYGB, ACVR1B, MSTN
- `sleep_recovery`: CLOCK, PER2, CRY1, ARNTL, ADRA2B, TPH2, HTR7, FABP7, SLC64A1, IL6

### 7. Genetic Vulnerability
**Purpose**: Disease risks, complex trait susceptibilities, polygenic conditions

**Related repo markers**:
- `cardiovascular`: APOE, AGTR1, TNF
- `longevity`: FOXO3
- `telomere`: TERC, TERT, OBFC1, NCCN, SIRT1, SIRT3, TERF2IP, ATM, PARP1

## Marker Mapping Table

| Repo Category | Skill Category | Markers |
|--------------|-----------------|---------|
| methylation | Wellness | MTHFR (C677T, A1298C), MTR, MTRR, CBS |
| metabolism | Wellness + Performance | FTO, LCT, MCM6, PPARG, ADRB2 |
| nutrient_processing | Wellness | VDR, HFE (C282Y, H63D) |
| detoxification | Wellness | CYP1A2, GSTP1, NQO1 |
| inflammation | Wellness + Vulnerability | SOD2, IL6, IL10 |
| histamine | Wellness | DAO, HNMT |
| gluten_sensitivity | Wellness | HLA-DQ2.5, HLA-DQ8 |
| gut_health | Wellness | FUT2 |
| circadian_rhythm | Personality + Performance | CLOCK |
| longevity | Vulnerability | FOXO3 |
| cognitive | Personality | COMT, BDNF, SLC6A4, HTR2A, DRD2, DRD4, MAOA, KIBRA, GABRA2, TCF7L2, etc. |
| physical_performance | Performance | ACTN3, ACE, PPARGC1A, AMPD1, GDF5, COL1A1, MSTN |
| sleep_recovery | Personality + Performance | PER2, CRY1, ARNTL, FABP7 |
| bone_joint | Wellness (partial) | VDR, COL1A1, BMP2, LRP5, SOST, RANKL |
| telomere | Vulnerability | TERT, SIRT1, ATM, PARP1 |
| cardiovascular | Vulnerability | APOE, AGTR1, TNF |
| neurotransmitters | Personality | COMT, BDNF, FKBP5, NR3C1, CRHR1, CRHR2 |

## Key Genes by Skill Category

### Ancestry
```
No existing markers - needs mtDNA and Y-chromosome analysis
```

### Pharmacology
```
No existing markers - needs CYP450 family analysis
Existing: CYP1A2 (in metabolism category)
```

### Wellness
```
MTHFR, MTR, MTRR, CBS (methylation)
VDR, HFE (nutrient processing)
FTO, LCT, MCM6, PPARG, ADRB2 (metabolism)
CYP1A2, GSTP1, NQO1 (detoxification)
SOD2, IL6, IL10 (inflammation)
DAO, HNMT (histamine)
HLA-DQA1, HLA-DQB1 (gluten)
FUT2 (gut health)
```

### Hereditary
```
HFE (hemochromatosis - already in nutrient_processing)
No other hereditary markers currently defined
```

### Personality
```
COMT, BDNF (neurotransmitters + cognitive overlap)
FKBP5, NR3C1, SLC6A4, CRHR1, CRHR2 (neurotransmitters)
SLC6A4, HTR2A, DRD2, DRD4, MAOA, KIBRA, GABRA2, TCF7L2 (cognitive)
CLOCK (circadian rhythm)
```

### Performance
```
ACTN3, ACE, PPARGC1A, AMPD1, CPT1B, GDF5, COL1A1, HIF1A, UCP2, LDHA, MSTN (physical_performance)
PER2, CRY1, ARNTL, FABP7 (sleep_recovery)
```

### Genetic Vulnerability
```
APOE, AGTR1, TNF (cardiovascular)
FOXO3 (longevity)
TERT, SIRT1, ATM, PARP1 (telomere)
```

## Recommendations for Expansion

1. **Add pharmacogenomics markers** - CYP2D6, CYP2C9, CYP2C19, VKORC1, DPYD
2. **Add hereditary condition markers** - CFTR, BRCA1/2, DMD, hemophilia genes
3. **Add ancestry markers** - mtDNA and Y-chromosome haplogroup markers
4. **Expand cardiovascular** - 9p21 locus, LPA, SORT1 for more complete risk picture
