---
name: genomic-hereditary
description: |
  **Use this skill when the user asks about inherited conditions, genetic diseases,
  carrier status, BRCA, Lynch syndrome, or "am I a carrier for any genetic diseases".**

  Also triggers for: hereditary cancer risk, single-gene disorders, genetic conditions
  that run in families, hemochromatosis, cystic fibrosis, or "will I pass this to my children".

  Analyzes monogenic conditions and provides carrier status information.
category: longevity-analysis/hereditary
---

# Hereditary Analysis

Analyzes variants associated with monogenic hereditary conditions.

## Key Genes

| Gene | rsID | Associated Conditions | Risk Level |
|------|------|----------------------|------------|
| BRCA1 | rs29164 | Breast/Ovarian cancer | High if pathogenic |
| BRCA2 | rs29164 | Breast/Pancreatic cancer | High if pathogenic |
| MLH1 | rs17855760 | Lynch syndrome | High if pathogenic |
| HFE | rs1800562 | Hemochromatosis | C282Y variant |
| CFTR | rs76763715 | Cystic fibrosis | Carrier |
| GBA | rs76763715 | Gaucher disease | Carrier |

## Dashboard Design

- **Card Color**: Rose (#f43f5e) header
- **Alert badges**: Red for actionable findings
- **Carrier badges**: Yellow for carrier status
- **Referral buttons**: Links to genetic counseling
- **Screening calendar**: Age-based recommended screenings
