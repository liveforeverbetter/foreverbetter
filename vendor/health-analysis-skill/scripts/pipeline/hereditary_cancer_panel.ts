/**
 * Hereditary multi-cancer panel coverage.
 *
 * Source: Labcorp/Invitae hereditary cancer with RNA analysis requisition form
 * TRF851-12, Invitae Multi-Cancer + RNA Panel / Multi-Cancer Panel gene list
 * (71 genes), current as published in 2026.
 */

export const HEREDITARY_CANCER_PANEL_ID = 901;
export const HEREDITARY_CANCER_PANEL_NAME = 'Hereditary multi-cancer predisposition panel';
export const HEREDITARY_CANCER_PANEL_SOURCE =
  'Labcorp/Invitae Multi-Cancer + RNA Panel and Invitae Multi-Cancer Panel, 71-gene hereditary cancer list';

export const HEREDITARY_CANCER_PANEL_GENES = [
  'AIP',
  'ALK',
  'APC',
  'ATM',
  'AXIN2',
  'BAP1',
  'BARD1',
  'BLM',
  'BMPR1A',
  'BRCA1',
  'BRCA2',
  'BRIP1',
  'CDC73',
  'CDH1',
  'CDK4',
  'CDKN1B',
  'CDKN2A',
  'CHEK2',
  'CTNNA1',
  'DICER1',
  'EPCAM',
  'EGFR',
  'FH',
  'FLCN',
  'GREM1',
  'HOXB13',
  'KIT',
  'LZTR1',
  'MAX',
  'MBD4',
  'MEN1',
  'MET',
  'MITF',
  'MLH1',
  'MSH2',
  'MSH3',
  'MSH6',
  'MUTYH',
  'NF1',
  'NF2',
  'NTHL1',
  'PALB2',
  'PDGFRA',
  'PMS2',
  'POLD1',
  'POLE',
  'POT1',
  'PRKAR1A',
  'PTCH1',
  'PTEN',
  'RAD51C',
  'RAD51D',
  'RB1',
  'RET',
  'RPS20',
  'SDHA',
  'SDHAF2',
  'SDHB',
  'SDHC',
  'SDHD',
  'SMAD4',
  'SMARCA4',
  'SMARCB1',
  'SMARCE1',
  'STK11',
  'SUFU',
  'TMEM127',
  'TP53',
  'TSC1',
  'TSC2',
  'VHL',
] as const;

export type HereditaryCancerPanelGene = typeof HEREDITARY_CANCER_PANEL_GENES[number];

