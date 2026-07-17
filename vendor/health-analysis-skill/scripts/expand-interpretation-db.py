#!/usr/bin/env python3
"""
Auto-expand the genomic interpretation database using local GWAS Catalog and ClinVar.

Sources used (no downloads required):
  - reference/gwas/gwas_associations.json.gz  (~10MB, 325K rsIDs)
  - reference/clinvar/clinvar_index.current.txt  (344MB, 2.89M entries)

Run from repo root:
  python3 skills/longevity-analysis/scripts/expand-interpretation-db.py [--dry-run]
"""

import json
import gzip
import sys
import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path

DRY_RUN = '--dry-run' in sys.argv
REPO_ROOT = Path(__file__).resolve().parents[3]
INTERP_DIR = REPO_ROOT / 'skills/longevity-analysis/shared/interpretations'
GWAS_JSON = REPO_ROOT / 'reference/gwas/gwas_associations.json.gz'
CLINVAR_INDEX = REPO_ROOT / 'reference/clinvar/clinvar_index.current.txt'
CLINVAR_VCF = REPO_ROOT / 'reference/clinvar/clinvar.vcf.gz'
CLINVAR_ALLELE_CACHE = Path('/tmp/clinvar_snp_plp_alleles.tsv')

# Complement for the transition-bias genotype heuristic
COMPLEMENT = {'A': 'G', 'G': 'A', 'C': 'T', 'T': 'C'}

ACMG_GENES = {
    'BRCA1', 'BRCA2', 'PALB2', 'TP53', 'PTEN', 'STK11', 'CDH1', 'ATM',
    'MLH1', 'MSH2', 'MSH6', 'PMS2', 'EPCAM', 'APC', 'MUTYH',
    'RET', 'MEN1', 'VHL', 'FH', 'SDHB', 'SDHC', 'SDHD', 'SDHAF2',
    'TSC1', 'TSC2', 'NF2', 'WT1',
    'MYBPC3', 'MYH7', 'TNNT2', 'TNNI3', 'TPM1', 'MYL3', 'MYL2', 'ACTC1', 'PLN',
    'LMNA', 'SCN5A', 'KCNQ1', 'KCNH2', 'RYR2',
    'DSP', 'DSG2', 'PKP2', 'DSC2', 'TMEM43',
    'LDLR', 'APOB', 'PCSK9',
    'ATP7B', 'CASQ2', 'CALM1', 'CALM2', 'CALM3', 'RYR1',
    'HFE', 'FLNC', 'TTN', 'TGFBR1', 'TGFBR2', 'SMAD3', 'ACTA2', 'MYH11',
}

# ACMG gene → (condition_name, category, risk_tag)
ACMG_META = {
    'BRCA1':  ('Hereditary breast/ovarian cancer', 'hereditary', '⚠️ Medical Alert'),
    'BRCA2':  ('Hereditary breast/ovarian cancer', 'hereditary', '⚠️ Medical Alert'),
    'PALB2':  ('Hereditary breast cancer', 'hereditary', '⚠️ Medical Alert'),
    'TP53':   ('Li-Fraumeni syndrome', 'hereditary', '⚠️ Medical Alert'),
    'PTEN':   ('Cowden syndrome / PTEN hamartoma', 'hereditary', '⚠️ Medical Alert'),
    'STK11':  ('Peutz-Jeghers syndrome', 'hereditary', '⚠️ Medical Alert'),
    'CDH1':   ('Hereditary diffuse gastric cancer', 'hereditary', '⚠️ Medical Alert'),
    'ATM':    ('Hereditary breast cancer / ataxia-telangiectasia', 'hereditary', '⚠️ Medical Alert'),
    'MLH1':   ('Lynch syndrome / hereditary colorectal cancer', 'hereditary', '⚠️ Medical Alert'),
    'MSH2':   ('Lynch syndrome / hereditary colorectal cancer', 'hereditary', '⚠️ Medical Alert'),
    'MSH6':   ('Lynch syndrome / hereditary colorectal cancer', 'hereditary', '⚠️ Medical Alert'),
    'PMS2':   ('Lynch syndrome / hereditary colorectal cancer', 'hereditary', '⚠️ Medical Alert'),
    'EPCAM':  ('Lynch syndrome', 'hereditary', '⚠️ Medical Alert'),
    'APC':    ('Familial adenomatous polyposis', 'hereditary', '⚠️ Medical Alert'),
    'MUTYH':  ('MUTYH-associated polyposis', 'hereditary', '⚠️ Medical Alert'),
    'RET':    ('MEN2 / medullary thyroid carcinoma', 'hereditary', '⚠️ Medical Alert'),
    'MEN1':   ('Multiple endocrine neoplasia type 1', 'hereditary', '⚠️ Medical Alert'),
    'VHL':    ('Von Hippel-Lindau syndrome', 'hereditary', '⚠️ Medical Alert'),
    'FH':     ('Hereditary leiomyomatosis / renal cell carcinoma', 'hereditary', '⚠️ Medical Alert'),
    'SDHB':   ('Hereditary paraganglioma-pheochromocytoma', 'hereditary', '⚠️ Medical Alert'),
    'SDHC':   ('Hereditary paraganglioma', 'hereditary', '⚠️ Medical Alert'),
    'SDHD':   ('Hereditary paraganglioma', 'hereditary', '⚠️ Medical Alert'),
    'SDHAF2': ('Hereditary paraganglioma', 'hereditary', '⚠️ Medical Alert'),
    'TSC1':   ('Tuberous sclerosis', 'hereditary', '⚠️ Medical Alert'),
    'TSC2':   ('Tuberous sclerosis', 'hereditary', '⚠️ Medical Alert'),
    'NF2':    ('Neurofibromatosis type 2', 'hereditary', '⚠️ Medical Alert'),
    'WT1':    ('Wilms tumor predisposition', 'hereditary', '⚠️ Medical Alert'),
    'MYBPC3': ('Hypertrophic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'MYH7':   ('Hypertrophic cardiomyopathy / dilated cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'TNNT2':  ('Hypertrophic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'TNNI3':  ('Hypertrophic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'TPM1':   ('Hypertrophic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'MYL3':   ('Hypertrophic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'MYL2':   ('Hypertrophic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'ACTC1':  ('Hypertrophic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'PLN':    ('Dilated cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'LMNA':   ('Dilated cardiomyopathy / EDMD', 'hereditary', '⚠️ Medical Alert'),
    'SCN5A':  ('Brugada syndrome / Long QT type 3', 'hereditary', '⚠️ Medical Alert'),
    'KCNQ1':  ('Long QT syndrome type 1', 'hereditary', '⚠️ Medical Alert'),
    'KCNH2':  ('Long QT syndrome type 2', 'hereditary', '⚠️ Medical Alert'),
    'RYR2':   ('CPVT / arrhythmogenic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'DSP':    ('Arrhythmogenic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'DSG2':   ('Arrhythmogenic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'PKP2':   ('Arrhythmogenic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'DSC2':   ('Arrhythmogenic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'TMEM43': ('Arrhythmogenic cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'LDLR':   ('Familial hypercholesterolemia', 'vulnerability', '⚠️ Medical Alert'),
    'APOB':   ('Familial hypercholesterolemia', 'vulnerability', '⚠️ Medical Alert'),
    'PCSK9':  ('Familial hypercholesterolemia (gain-of-function)', 'vulnerability', '⚠️ Medical Alert'),
    'ATP7B':  ('Wilson disease', 'hereditary', '⚠️ Medical Alert'),
    'CASQ2':  ('CPVT type 2', 'hereditary', '⚠️ Medical Alert'),
    'CALM1':  ('Calmodulinopathy / CPVT / Long QT', 'hereditary', '⚠️ Medical Alert'),
    'CALM2':  ('Calmodulinopathy / Long QT', 'hereditary', '⚠️ Medical Alert'),
    'CALM3':  ('Calmodulinopathy', 'hereditary', '⚠️ Medical Alert'),
    'RYR1':   ('Malignant hyperthermia / myopathy', 'hereditary', '⚠️ Medical Alert'),
    'HFE':    ('Hereditary hemochromatosis', 'vulnerability', 'ℹ️ Dietary Rule'),
    'FLNC':   ('Hypertrophic / dilated cardiomyopathy', 'hereditary', '⚠️ Medical Alert'),
    'TGFBR1': ('Loeys-Dietz syndrome / aortic aneurysm', 'hereditary', '⚠️ Medical Alert'),
    'TGFBR2': ('Loeys-Dietz syndrome / aortic aneurysm', 'hereditary', '⚠️ Medical Alert'),
    'SMAD3':  ('Loeys-Dietz syndrome / aortic aneurysm', 'hereditary', '⚠️ Medical Alert'),
    'ACTA2':  ('Familial thoracic aortic aneurysm', 'hereditary', '⚠️ Medical Alert'),
    'MYH11':  ('Familial thoracic aortic aneurysm', 'hereditary', '⚠️ Medical Alert'),
}

# GWAS domain → interpretation category
DOMAIN_TO_CATEGORY = {
    'longevity':            'longevity',
    'athletic_performance': 'performance',
    'sleep':                'wellness',
    'cardiovascular':       'vulnerability',
    'brain_cognitive':      'personality',
    'metabolic':            'vulnerability',
    'nutrition':            'wellness',
    'immune':               'wellness',
    'cancer_risk':          'vulnerability',
}

# Curated gene allowlists per domain (biologically meaningful for longevity/wellness)
DOMAIN_GENE_ALLOWLIST = {
    'longevity': {
        # Aging rate, biological age, lifespan
        'ZNG1A', 'AXIN1', 'MEIS1', 'HCRTR2', 'RGS16', 'NPAS2', 'CLOCK', 'ARNTL',
        'EXO1', 'CCDC26', 'MRC1', 'FAM234A', 'CHCHD6', 'HBG2', 'CDKN2A', 'MDM2',
        'TERT', 'TERC', 'OBFC1', 'RTEL1', 'NBN',
    },
    'athletic_performance': {
        # Bone density, muscle, VO2max, injury
        'WNT16', 'CPED1', 'SFRP4', 'TMEM135', 'SMG6', 'C7orf58',
        'LRP5', 'COL1A1', 'COL5A1', 'TNFSF11', 'RANKL', 'OPG', 'TNFRSF11B',
        'SLC2A9', 'ABCG2', 'NRF1', 'HIF1A', 'EPAS1', 'GDF5',
    },
    'sleep': {
        # Sleep quality, insomnia, chronotype, circadian
        'MEIS1', 'HCRTR2', 'RGS16', 'CLOCK', 'ARNTL', 'PER2', 'PER3', 'CRY1',
        'NPAS2', 'RORA', 'RORC', 'LRRTM1', 'PAX8', 'MTNR1B', 'MTNR1A',
        'UTS2', 'PARK7',
    },
    'cardiovascular': {
        # Lipids, blood pressure, cardiac structure
        'LPL', 'PLTP', 'MLXIPL', 'ZPR1', 'APOA5', 'APOA1', 'APOC3',
        'ANGPTL3', 'ANGPTL4', 'DOCK7', 'CELSR2', 'SORT1', 'HMGCR',
        'NPC1L1', 'ABCA1', 'ABCG5', 'ABCG8', 'LIPC', 'LCAT',
        'ACE2', 'AGT', 'AGTR1', 'AGTR2', 'CYP11B2', 'CYP11B1',
        'EDN1', 'NOS1', 'NOS3', 'GUCY1A1',
        'ALDH2', 'ADH1B', 'ADH1C',
    },
    'brain_cognitive': {
        # Alzheimer's, cognitive function, neurodegeneration
        'TOMM40', 'NECTIN2', 'CLU', 'CR1', 'BIN1', 'PICALM', 'ABCA7',
        'MS4A6A', 'CD33', 'EPHA1', 'CD2AP', 'PTK2B', 'SLC24A4',
        'PLCG2', 'ABI3', 'TREM2', 'ADAM10', 'SORL1',
        'GBA', 'LRRK2', 'SNCA', 'MAPT', 'PARK7', 'PINK1',
        'NRXN1', 'SHANK3', 'CNTNAP2',
        'GWAS1', 'KTN1', 'STRN',
    },
    'metabolic': {
        # Insulin sensitivity, obesity, T2D, metabolic syndrome
        'TCF7L2', 'KCNJ11', 'PPARG', 'CDKAL1', 'CDKN2B', 'IGF2BP2',
        'SLC30A8', 'HHEX', 'HMGA2', 'TFAP2B', 'TMEM18', 'GNPDA2',
        'MTCH2', 'NEGR1', 'SEC16B', 'FAIM2', 'BDNF', 'NRXN3',
        'GIPR', 'GLP1R', 'INSR', 'IRS1', 'IRS2',
    },
    'nutrition': {
        # Micronutrient metabolism, dietary response
        'MTNR1B', 'GCK', 'GCKR', 'FADS1', 'FADS2', 'ELOVL2', 'ELOVL5',
        'SLC23A1', 'SLC23A2', 'GC', 'CYP2R1', 'CYP24A1', 'CASR',
        'TF', 'TMPRSS6', 'HFE', 'HAMP', 'SLC11A2',
        'BCMO1', 'ALDH1A2', 'RBP4',
    },
    'immune': {
        # Inflammation, immune regulation, autoimmunity relevant to longevity
        'IL6', 'IL6R', 'IL1B', 'IL1RN', 'TNF', 'TNFAIP3',
        'IL10', 'TGFB1', 'CTLA4', 'PTPN22', 'STAT3', 'STAT4',
        'IRF5', 'IFNL3', 'IL28B', 'MBL2',
        'HLA-DQA1', 'HLA-DQB1', 'HLA-DRB1',
    },
    'cancer_risk': {
        # Common cancer predisposition SNPs (common variants, not ACMG P/LP)
        'KIF1B', 'SDH5', 'MCC', 'MLH3', 'RNASEL',
        'ATM', 'CHEK2', 'NBN', 'BARD1', 'BRIP1',
        'MSH3', 'OGG1', 'XRCC1', 'XRCC3', 'ERCC1',
        'CYP1A1', 'CYP1B1', 'GSTM1', 'GSTT1',
        'TERT', 'CLPTM1L',
    },
}


def get_other_allele(effect_allele: str) -> str:
    """Transition-bias complement for genotype string generation."""
    return COMPLEMENT.get(effect_allele.upper(), 'G')


def format_trait_name(trait: str) -> str:
    """Clean up trait name for display."""
    trait = trait.replace(' measurement', '').replace(' amount', '').strip()
    trait = trait[:80]
    return trait


def or_to_magnitude(or_val) -> str:
    if or_val is None:
        return 'modest'
    try:
        v = float(or_val)
        if v > 1:
            if v >= 1.5: return 'strong'
            if v >= 1.2: return 'moderate'
            return 'modest'
        else:
            inv = 1 / v if v > 0 else 1
            if inv >= 1.5: return 'strong'
            if inv >= 1.2: return 'moderate'
            return 'modest'
    except Exception:
        return 'modest'


def generate_gwas_entry(rsid: str, assoc: dict) -> dict:
    """Generate an interpretation DB entry from a GWAS association."""
    gene = assoc['gene'].split(' - ')[0].strip()
    trait = format_trait_name(assoc['trait'])
    domain = assoc['domain']
    effect_allele = assoc.get('effectAllele', '').upper()
    direction = assoc.get('direction', 'unknown')
    or_val = assoc.get('or')
    p_val = assoc.get('p', 1)
    n = assoc.get('n', 0)
    magnitude = or_to_magnitude(or_val)

    category = DOMAIN_TO_CATEGORY.get(domain, 'wellness')
    other_allele = get_other_allele(effect_allele) if effect_allele else 'G'

    # Build sorted genotype strings (canonical: alphabetical within each genotype)
    def gt(*alleles):
        return ''.join(sorted(alleles))

    gt_hom_ref = gt(other_allele, other_allele)
    gt_het = gt(effect_allele, other_allele)
    gt_hom_eff = gt(effect_allele, effect_allele)

    # Trait label for interpretations
    if direction == 'risk':
        hom_ref_effect = f'Common genotype — baseline {trait}'
        het_effect = f'One {gene} risk allele — {magnitude} {trait} association'
        hom_eff_effect = f'Homozygous {gene} risk allele — elevated {trait}'
        hom_ref_interp = f'Most common genotype for {trait} at {gene} locus; no elevated GWAS risk signal'
        het_interp = f'Carrier of one GWAS-identified risk allele for {trait}. {magnitude.capitalize()} effect in population studies (n={n:,}, p={p_val:.0e})'
        hom_eff_interp = f'Homozygous for the GWAS risk allele associated with {trait}. Strongest risk signal at the {gene} locus'
        priority_hom_eff = 'high' if magnitude == 'strong' else 'medium'
        priority_het = 'medium' if magnitude == 'strong' else 'low'
        priority_ref = 'low'
        recs_hom = [f'Discuss {gene} GWAS finding with a healthcare provider', f'Monitor {trait} via regular checkups']
        recs_het = [f'Awareness of modest {trait} risk variant; standard screening applies']
        recs_ref = ['No action needed — favorable common genotype']
    elif direction == 'protective':
        hom_ref_effect = f'Common genotype — standard {trait}'
        het_effect = f'One {gene} protective allele — {magnitude} {trait} benefit'
        hom_eff_effect = f'Homozygous {gene} protective allele — maximum {trait} benefit'
        hom_ref_interp = f'Common genotype for {trait} at {gene}; baseline trajectory'
        het_interp = f'One copy of the GWAS-identified protective allele for {trait}. {magnitude.capitalize()} benefit observed in population studies (n={n:,}, p={p_val:.0e})'
        hom_eff_interp = f'Homozygous for the GWAS protective allele at {gene}. Strongest favorable association with {trait}'
        priority_hom_eff = 'low'
        priority_het = 'low'
        priority_ref = 'low'
        recs_hom = [f'Favorable {gene} variant — continue healthy lifestyle to maximise this genetic advantage']
        recs_het = [f'One protective {gene} allele — generally favorable']
        recs_ref = ['No action needed; standard {trait} management applies'.replace('{trait}', trait)]
    else:
        hom_ref_effect = f'Common genotype at {gene}'
        het_effect = f'Heterozygous at {gene} — associated with {trait}'
        hom_eff_effect = f'Homozygous effect allele at {gene} — {trait} association'
        hom_ref_interp = f'Common genotype at the {gene} GWAS locus for {trait}'
        het_interp = f'Carrier of one GWAS-significant allele at {gene} (n={n:,}, p={p_val:.0e}). Associated with {trait}'
        hom_eff_interp = f'Homozygous for effect allele at {gene}. Strongest association with {trait}'
        priority_hom_eff = 'medium'
        priority_het = 'low'
        priority_ref = 'low'
        recs_hom = [f'Note {gene} variant for {trait}; discuss with healthcare provider']
        recs_het = [f'Heterozygous {gene} variant; moderate attention warranted']
        recs_ref = ['No action needed']

    entry = {
        'gene': gene,
        'name': f'{gene} ({trait[:40]})',
        'displayName': f'{gene} – {trait[:50]}',
        'category': category,
        'chrom': '',
        'pos': 0,
        'evidenceTier': 2 if p_val < 1e-12 else 3,
        'gwas': True,
        'gwas_trait': assoc['trait'],
        'gwas_domain': domain,
        'gwas_p': p_val,
        'gwas_n': n,
        'interpretations': {
            gt_hom_ref: {
                'effect': hom_ref_effect,
                'interpretation': hom_ref_interp,
                'recommendations': recs_ref,
                'priority': priority_ref,
            },
            gt_het: {
                'effect': het_effect,
                'interpretation': het_interp,
                'recommendations': recs_het if gt_het != gt_hom_ref else recs_ref,
                'priority': priority_het,
            },
            gt_hom_eff: {
                'effect': hom_eff_effect,
                'interpretation': hom_eff_interp,
                'recommendations': recs_hom,
                'priority': priority_hom_eff,
            },
        },
    }

    # Deduplicate genotype keys if alleles are the same
    seen = {}
    for gt_key, gt_val in list(entry['interpretations'].items()):
        if gt_key not in seen:
            seen[gt_key] = gt_val
    entry['interpretations'] = seen

    return entry


def generate_clinvar_entry(rsid: str, gene: str, condition: str, sig: str, review: str,
                           ref: str, alt: str) -> dict:
    """Generate a hereditary/vulnerability entry from ClinVar P/LP with real REF/ALT alleles."""
    meta = ACMG_META.get(gene.upper(), ('Hereditary condition', 'hereditary', '⚠️ Medical Alert'))
    condition_name, category, tag = meta

    is_pathogenic = 'Pathogenic' in sig and 'Likely' not in sig
    sig_label = 'Pathogenic' if is_pathogenic else 'Likely pathogenic'
    review_quality = 'expert panel' if 'expert_panel' in review else 'multiple submitters'

    # Condition cleaning
    cond_clean = condition.replace('_', ' ').replace('not provided', '').strip(', ').strip()
    if not cond_clean:
        cond_clean = condition_name

    ref = ref.upper()
    alt = alt.upper()

    def gt(*alleles):
        return ''.join(sorted(alleles))

    gt_homref = gt(ref, ref)
    gt_het = gt(ref, alt)
    gt_homalt = gt(alt, alt)

    entry = {
        'gene': gene,
        'name': f'{gene} – {sig_label} variant',
        'displayName': f'{gene} {sig_label}',
        'category': category,
        'chrom': '',
        'pos': 0,
        'evidenceTier': 1,
        'clinvar': True,
        'clinvar_sig': sig_label,
        'clinvar_review': review_quality,
        'interpretations': {
            gt_homref: {
                'effect': f'No {gene} pathogenic variant at this position',
                'interpretation': f'Reference genotype — this position does not carry the known {gene} {sig_label} variant associated with {condition_name}',
                'recommendations': ['No action needed for this specific variant'],
                'priority': 'low',
            },
            gt_het: {
                'effect': f'{gene} {sig_label} carrier — {condition_name}',
                'interpretation': f'Heterozygous {sig_label} variant in {gene}, associated with {cond_clean}. Classified as {sig_label} by ClinVar ({review_quality}). This is an ACMG secondary finding gene — genetic counseling is strongly recommended.',
                'recommendations': [
                    f'Consult a genetic counselor or medical geneticist urgently',
                    f'Discuss {condition_name} screening and prevention with your physician',
                    f'Consider informing first-degree relatives who may benefit from testing',
                ],
                'priority': 'high',
            },
        },
    }

    # For recessive/homozygous conditions, add hom-alt genotype if it differs from het
    if gt_homalt != gt_het and gt_homalt != gt_homref:
        entry['interpretations'][gt_homalt] = {
            'effect': f'{gene} {sig_label} — homozygous, {condition_name}',
            'interpretation': f'Homozygous {sig_label} variant in {gene}. Associated with {cond_clean}. Requires urgent genetic counseling.',
            'recommendations': [
                f'Urgent: consult a genetic counselor or medical geneticist',
                f'Immediate clinical evaluation for {condition_name}',
            ],
            'priority': 'high',
        }

    return entry


def load_db() -> dict:
    """Load all interpretation JSON files, return {category: {rsid: marker}}."""
    categories = ['wellness', 'vulnerability', 'pharmacology', 'performance',
                  'personality', 'longevity', 'hereditary', 'ancestry']
    db = {}
    for cat in categories:
        path = INTERP_DIR / f'{cat}.json'
        with open(path) as f:
            db[cat] = json.load(f)
    return db


def get_all_rsids(db: dict) -> set:
    rsids = set()
    for cat_data in db.values():
        rsids.update(cat_data.get('markers', {}).keys())
    return rsids


def get_all_genes(db: dict) -> set:
    genes = set()
    for cat_data in db.values():
        for marker in cat_data.get('markers', {}).values():
            g = marker.get('gene', '')
            if g:
                genes.add(g.upper())
    return genes


def expand_gwas(db: dict, existing_rsids: set, existing_genes: set) -> dict:
    """Return {category: {rsid: entry}} of new GWAS-derived entries."""
    print(f'Loading GWAS JSON...')
    with gzip.open(GWAS_JSON) as f:
        gwas = json.load(f)
    print(f'  {len(gwas):,} rsIDs in GWAS JSON')

    new_entries = defaultdict(dict)
    # Best hit per (domain, gene) for new genes
    best_per_domain_gene: dict = {}

    for rsid, assocs in gwas.items():
        if rsid in existing_rsids:
            continue
        for a in assocs:
            domain = a.get('domain', '')
            if domain not in DOMAIN_TO_CATEGORY:
                continue
            if not a.get('effectAllele'):
                continue
            p = a.get('p', 1)
            n = a.get('n', 0)
            # Genome-wide significance + reasonable sample size
            if p > 5e-8 or n < 5000:
                continue

            gene_raw = a.get('gene', '').split(' - ')[0].strip()
            gene_up = gene_raw.upper()

            # Apply domain-specific gene allowlist (curated for biological relevance)
            allowlist = DOMAIN_GENE_ALLOWLIST.get(domain)
            if allowlist and gene_up not in allowlist:
                continue
            if not gene_raw or gene_up in existing_genes:
                continue

            key = (domain, gene_up)
            if key not in best_per_domain_gene or best_per_domain_gene[key]['p'] > p:
                best_per_domain_gene[key] = {**a, 'rsid': rsid, 'gene': gene_raw}

    for (domain, gene_up), hit in best_per_domain_gene.items():
        rsid = hit['rsid']
        if rsid in existing_rsids:
            continue
        category = DOMAIN_TO_CATEGORY[domain]
        entry = generate_gwas_entry(rsid, hit)
        new_entries[category][rsid] = entry
        print(f'  GWAS  {rsid:15} {gene_up:20} → {category} [{domain}] p={hit["p"]:.0e}')

    return dict(new_entries)


def load_clinvar_allele_cache() -> dict:
    """Load or build the ClinVar SNP allele cache. Returns {rsid_numeric_str: (ref, alt)}."""
    import subprocess

    if CLINVAR_ALLELE_CACHE.exists():
        print(f'  Loading cached alleles from {CLINVAR_ALLELE_CACHE}...')
    else:
        print(f'  Building ClinVar allele cache (one-time, ~18s)...')
        result = subprocess.run([
            'bcftools', 'query',
            '-i', 'CLNSIG~"Pathogenic" && (CLNREVSTAT~"multiple_submitters" || CLNREVSTAT~"expert_panel") && strlen(REF)==1 && strlen(ALT)==1',
            '-f', '%INFO/RS\t%REF\t%ALT\t%INFO/GENEINFO\t%INFO/CLNSIG\n',
            str(CLINVAR_VCF),
        ], capture_output=True, text=True)
        with open(CLINVAR_ALLELE_CACHE, 'w') as f:
            f.write(result.stdout)

    allele_map = {}
    with open(CLINVAR_ALLELE_CACHE) as f:
        for line in f:
            parts = line.rstrip('\n').split('\t')
            if len(parts) < 3:
                continue
            rs_num, ref, alt = parts[0], parts[1], parts[2]
            if rs_num and ref and alt:
                allele_map[rs_num] = (ref.upper(), alt.upper())

    print(f'  Loaded {len(allele_map):,} SNP allele records')
    return allele_map


def expand_clinvar(db: dict, existing_rsids: set) -> dict:
    """Return {category: {rsid: entry}} of new ClinVar P/LP ACMG entries with real alleles."""
    print(f'Loading ClinVar allele cache...')
    allele_cache = load_clinvar_allele_cache()

    print(f'Scanning ClinVar index for ACMG P/LP rsIDs...')
    new_entries = defaultdict(dict)
    gene_rsid_count: dict[str, int] = defaultdict(int)
    MAX_PER_GENE = 5

    with open(CLINVAR_INDEX) as f:
        for line_num, line in enumerate(f):
            parts = line.rstrip('\n').split('|')
            if len(parts) < 5:
                continue
            rsid, sig, condition, gene_pos, review = parts[0], parts[1], parts[2], parts[3], parts[4]

            if not rsid.startswith('rs'):
                continue
            if rsid in existing_rsids:
                continue
            if 'multiple_submitters' not in review and 'expert_panel' not in review:
                continue
            if 'Pathogenic' not in sig:
                continue
            if 'Benign' in sig or 'benign' in sig:
                continue

            gene = gene_pos.split(':')[0] if ':' in gene_pos else gene_pos
            gene_up = gene.upper()
            if gene_up not in ACMG_GENES:
                continue
            if gene_rsid_count[gene_up] >= MAX_PER_GENE:
                continue

            meta = ACMG_META.get(gene_up)
            if not meta:
                continue

            # Look up actual REF/ALT alleles for proper genotype keys
            rs_numeric = rsid[2:]  # strip 'rs' prefix
            if rs_numeric not in allele_cache:
                continue  # only add SNPs where we know exact alleles
            ref, alt = allele_cache[rs_numeric]

            entry = generate_clinvar_entry(rsid, gene, condition, sig, review, ref, alt)
            _, category, _ = meta
            new_entries[category][rsid] = entry
            gene_rsid_count[gene_up] += 1
            existing_rsids.add(rsid)

            if line_num % 500000 == 0 and line_num > 0:
                print(f'  ... scanned {line_num:,} ClinVar lines')

    for gene, cnt in sorted(gene_rsid_count.items(), key=lambda x: -x[1]):
        if cnt > 0:
            print(f'  ClinVar {gene}: {cnt} new P/LP entries (real REF/ALT)')

    return dict(new_entries)


def merge_and_write(db: dict, new_entries_by_cat: dict) -> tuple[int, int]:
    """Merge new entries into DB dicts and write JSON. Returns (files_changed, total_new)."""
    total_new = 0
    files_changed = 0
    today = datetime.utcnow().strftime('%Y-%m-%d')

    for category, entries in new_entries_by_cat.items():
        if not entries:
            continue
        cat_data = db[category]
        markers = cat_data.setdefault('markers', {})
        added = 0
        for rsid, entry in entries.items():
            if rsid not in markers:
                markers[rsid] = entry
                added += 1
        if added > 0:
            cat_data['updated'] = today
            if not DRY_RUN:
                path = INTERP_DIR / f'{category}.json'
                with open(path, 'w') as f:
                    json.dump(cat_data, f, indent=2)
                    f.write('\n')
            total_new += added
            files_changed += 1
            print(f'  ✓ {category}.json: +{added} markers ({"DRY RUN" if DRY_RUN else "written"})')

    return files_changed, total_new


def main():
    print('=== Genomic Interpretation DB Auto-Expander ===')
    print(f'Mode: {"DRY RUN" if DRY_RUN else "WRITE"}')
    print()

    db = load_db()
    existing_rsids = get_all_rsids(db)
    existing_genes = get_all_genes(db)
    print(f'Existing DB: {len(existing_rsids):,} rsIDs across {len(existing_genes):,} genes')
    print()

    # GWAS expansion
    print('--- GWAS Catalog expansion ---')
    gwas_new = expand_gwas(db, existing_rsids, existing_genes)
    print()

    # ClinVar expansion — pass existing_rsids by reference so GWAS entries are excluded
    all_rsids_after_gwas = existing_rsids | {rsid for cat in gwas_new.values() for rsid in cat}
    print('--- ClinVar P/LP expansion ---')
    clinvar_new = expand_clinvar(db, all_rsids_after_gwas)
    print()

    # Merge all new entries
    all_new: dict[str, dict] = defaultdict(dict)
    for source in (gwas_new, clinvar_new):
        for cat, entries in source.items():
            all_new[cat].update(entries)

    print('--- Writing results ---')
    files_changed, total_new = merge_and_write(db, all_new)

    print()
    print(f'Done. Added {total_new:,} new markers across {files_changed} files.')
    if DRY_RUN:
        print('(Dry run — no files written)')


if __name__ == '__main__':
    main()
