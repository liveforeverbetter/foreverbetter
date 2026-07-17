import type { RawSourceReference } from '../types.js';
import { createId } from '../store.js';

export interface AncestryAnalysisInput {
  user_id: string;
  organization_id?: string;
  source_id: string;
  reference_panel?: '1000_genomes_phase3';
  resolution?: 'continental' | 'regional' | 'sub_population';
}

export interface AncestryAnalysisResult {
  schema_version: '1.0';
  id: string;
  user_id: string;
  organization_id?: string;
  source_id: string;
  status: 'complete' | 'low_confidence' | 'setup_required' | 'failed';
  reference_panel: string;
  proportion_unit: 'percent';
  method: {
    id: 'curated_aim_maximum_likelihood';
    version: '1.0';
    execution: 'synchronous';
  };
  resolution: 'continental' | 'regional' | 'sub_population';
  summary: string;
  ancestry: AncestryBreakdown[];
  haplogroups: {
    maternal?: HaplogroupResult;
    paternal?: HaplogroupResult;
  };
  geographic_map?: GeoMap;
  chromosome_breakdown?: ChromosomeAncestry[];
  quality: AncestryQuality;
  methodology: AncestryMethodology;
  generated_at: string;
}

export interface AncestryBreakdown {
  region: string;
  sub_region?: string;
  population?: string;
  proportion: number;
  range?: { low: number; high: number };
  confidence: 'high' | 'medium' | 'low' | 'trace';
  coordinates?: { lat: number; lon: number };
  countries?: string[];
}

export interface GeoMap {
  regions: Array<{
    name: string;
    proportion: number;
    coordinates: Array<{ lat: number; lon: number; weight: number }>;
  }>;
}

export interface ChromosomeAncestry {
  chromosome: string;
  proportions: Record<string, number>;
}

export interface HaplogroupResult {
  haplogroup: string;
  confidence: string;
  description: string;
  geographic_origin: string;
  age_estimate: string;
  defining_markers: string[];
}

export interface AncestryQuality {
  variant_count: number;
  autosomal_variant_count: number;
  rsid_count: number;
  marker_count: number;
  matched_markers: number;
  matched_proportion: number;
  covered_populations: number;
  compatible_for_projection: boolean;
  data_source_note: string;
  notes: string[];
}

export interface AncestryMethodology {
  algorithm: string;
  reference_panel: string;
  reference_populations: string;
  marker_source: string;
  limitations: string[];
}

const POPULATION_REGISTRY: Record<string, {
  region: string;
  sub_region: string;
  label: string;
  countries: string[];
  lat: number;
  lon: number;
}> = {
  YRI: { region: 'Sub-Saharan African', sub_region: 'West African', label: 'Yoruba (Nigeria)', countries: ['Nigeria', 'Benin', 'Togo'], lat: 7.38, lon: 3.92 },
  LWK: { region: 'Sub-Saharan African', sub_region: 'East African', label: 'Luhya (Kenya)', countries: ['Kenya', 'Uganda'], lat: 0.52, lon: 35.27 },
  GWD: { region: 'Sub-Saharan African', sub_region: 'West African', label: 'Gambian', countries: ['Gambia', 'Senegal'], lat: 13.45, lon: -16.58 },
  MSL: { region: 'Sub-Saharan African', sub_region: 'West African', label: 'Mende (Sierra Leone)', countries: ['Sierra Leone', 'Liberia'], lat: 8.46, lon: -11.78 },
  ESN: { region: 'Sub-Saharan African', sub_region: 'West African', label: 'Esan (Nigeria)', countries: ['Nigeria'], lat: 6.50, lon: 6.00 },
  ASW: { region: 'Sub-Saharan African', sub_region: 'African Diaspora', label: 'African-American (SW USA)', countries: ['United States'], lat: 33.5, lon: -86.8 },
  ACB: { region: 'Sub-Saharan African', sub_region: 'African Diaspora', label: 'African-Caribbean (Barbados)', countries: ['Barbados', 'Caribbean'], lat: 13.19, lon: -59.54 },
  CEU: { region: 'European', sub_region: 'Northwestern European', label: 'Utah European (CEPH)', countries: ['United Kingdom', 'Ireland', 'Germany', 'Netherlands'], lat: 51.5, lon: -0.13 },
  GBR: { region: 'European', sub_region: 'Northwestern European', label: 'British (England/Scotland)', countries: ['United Kingdom'], lat: 55.0, lon: -3.5 },
  FIN: { region: 'European', sub_region: 'Finnish', label: 'Finnish', countries: ['Finland'], lat: 61.92, lon: 25.75 },
  TSI: { region: 'European', sub_region: 'Southern European', label: 'Tuscan (Italy)', countries: ['Italy', 'Greece'], lat: 43.77, lon: 11.25 },
  IBS: { region: 'European', sub_region: 'Southern European', label: 'Iberian (Spain)', countries: ['Spain', 'Portugal'], lat: 40.5, lon: -3.7 },
  CHB: { region: 'East Asian', sub_region: 'Chinese', label: 'Han Chinese (Beijing)', countries: ['China', 'Taiwan'], lat: 39.9, lon: 116.4 },
  CHS: { region: 'East Asian', sub_region: 'Chinese', label: 'Southern Han Chinese', countries: ['China'], lat: 22.5, lon: 114.1 },
  JPT: { region: 'East Asian', sub_region: 'Japanese/Korean', label: 'Japanese (Tokyo)', countries: ['Japan'], lat: 35.7, lon: 139.7 },
  CDX: { region: 'East Asian', sub_region: 'Southeast Asian', label: 'Dai (Xishuangbanna)', countries: ['China (Yunnan)', 'Myanmar', 'Laos'], lat: 21.5, lon: 100.5 },
  KHV: { region: 'East Asian', sub_region: 'Southeast Asian', label: 'Kinh (Vietnam)', countries: ['Vietnam'], lat: 21.0, lon: 105.8 },
  GIH: { region: 'South Asian', sub_region: 'Northern South Asian', label: 'Gujarati Indian (Texas)', countries: ['India (Gujarat)'], lat: 23.0, lon: 72.0 },
  PJL: { region: 'South Asian', sub_region: 'Northern South Asian', label: 'Punjabi (Lahore)', countries: ['Pakistan', 'India (Punjab)'], lat: 31.5, lon: 74.3 },
  BEB: { region: 'South Asian', sub_region: 'Eastern South Asian', label: 'Bengali (Bangladesh)', countries: ['Bangladesh', 'India (West Bengal)'], lat: 23.7, lon: 90.4 },
  STU: { region: 'South Asian', sub_region: 'Southern South Asian', label: 'Sri Lankan Tamil (UK)', countries: ['Sri Lanka', 'India (Tamil Nadu)'], lat: 7.0, lon: 81.0 },
  ITU: { region: 'South Asian', sub_region: 'Southern South Asian', label: 'Indian Telugu (UK)', countries: ['India (Telangana/Andhra)'], lat: 17.4, lon: 78.5 },
  MXL: { region: 'Native American / Latino', sub_region: 'Mexican/Central American', label: 'Mexican-American (LA)', countries: ['Mexico', 'United States'], lat: 23.0, lon: -102.0 },
  PUR: { region: 'Native American / Latino', sub_region: 'Caribbean Latino', label: 'Puerto Rican', countries: ['Puerto Rico', 'Caribbean'], lat: 18.2, lon: -66.6 },
  CLM: { region: 'Native American / Latino', sub_region: 'South American Latino', label: 'Colombian (Medellin)', countries: ['Colombia', 'Venezuela'], lat: 6.3, lon: -75.6 },
  PEL: { region: 'Native American / Latino', sub_region: 'South American Latino', label: 'Peruvian (Lima)', countries: ['Peru', 'Bolivia'], lat: -12.0, lon: -77.0 },
};

const ANCESTRY_INFORMATIVE_MARKERS: Array<{
  rsid: string;
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  populations: Record<string, { ref_freq: number; alt_freq: number }>;
}> = [
  { rsid: 'rs2814778', chromosome: '1', position: 159174683, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.01, alt_freq: 0.99 }, EUR: { ref_freq: 0.99, alt_freq: 0.01 }, EAS: { ref_freq: 1.0, alt_freq: 0.0 }, SAS: { ref_freq: 1.0, alt_freq: 0.0 }, AMR: { ref_freq: 0.87, alt_freq: 0.13 } }) },
  { rsid: 'rs1426654', chromosome: '15', position: 48426484, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.99, alt_freq: 0.01 }, EUR: { ref_freq: 0.01, alt_freq: 0.99 }, EAS: { ref_freq: 0.01, alt_freq: 0.99 }, SAS: { ref_freq: 0.22, alt_freq: 0.78 }, AMR: { ref_freq: 0.36, alt_freq: 0.64 } }) },
  { rsid: 'rs16891982', chromosome: '5', position: 33951693, ref: 'C', alt: 'G', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.01, alt_freq: 0.99 }, EUR: { ref_freq: 0.96, alt_freq: 0.04 }, EAS: { ref_freq: 1.0, alt_freq: 0.0 }, SAS: { ref_freq: 0.93, alt_freq: 0.07 }, AMR: { ref_freq: 0.87, alt_freq: 0.13 } }) },
  { rsid: 'rs3827760', chromosome: '2', position: 109513601, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 1.0, alt_freq: 0.0 }, EUR: { ref_freq: 0.98, alt_freq: 0.02 }, EAS: { ref_freq: 0.51, alt_freq: 0.49 }, SAS: { ref_freq: 0.79, alt_freq: 0.21 }, AMR: { ref_freq: 0.88, alt_freq: 0.12 } }) },
  { rsid: 'rs12913832', chromosome: '15', position: 28365618, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.87, alt_freq: 0.13 }, EUR: { ref_freq: 0.22, alt_freq: 0.78 }, EAS: { ref_freq: 0.02, alt_freq: 0.98 }, SAS: { ref_freq: 0.21, alt_freq: 0.79 }, AMR: { ref_freq: 0.33, alt_freq: 0.67 } }) },
  { rsid: 'rs1079597', chromosome: '5', position: 33964110, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.26, alt_freq: 0.74 }, EUR: { ref_freq: 0.94, alt_freq: 0.06 }, EAS: { ref_freq: 1.0, alt_freq: 0.0 }, SAS: { ref_freq: 0.80, alt_freq: 0.20 }, AMR: { ref_freq: 0.75, alt_freq: 0.25 } }) },
  { rsid: 'rs1800407', chromosome: '15', position: 28235718, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.34, alt_freq: 0.66 }, EUR: { ref_freq: 0.83, alt_freq: 0.17 }, EAS: { ref_freq: 1.0, alt_freq: 0.0 }, SAS: { ref_freq: 0.61, alt_freq: 0.39 }, AMR: { ref_freq: 0.37, alt_freq: 0.63 } }) },
  { rsid: 'rs1420389', chromosome: '1', position: 207610034, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.87, alt_freq: 0.13 }, EUR: { ref_freq: 0.11, alt_freq: 0.89 }, EAS: { ref_freq: 0.46, alt_freq: 0.54 }, SAS: { ref_freq: 0.74, alt_freq: 0.26 }, AMR: { ref_freq: 0.51, alt_freq: 0.49 } }) },
  { rsid: 'rs7554936', chromosome: '1', position: 204578598, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.04, alt_freq: 0.96 }, EUR: { ref_freq: 0.08, alt_freq: 0.92 }, EAS: { ref_freq: 0.36, alt_freq: 0.64 }, SAS: { ref_freq: 0.16, alt_freq: 0.84 }, AMR: { ref_freq: 0.04, alt_freq: 0.96 } }) },
  { rsid: 'rs12203592', chromosome: '6', position: 396321, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 1.0, alt_freq: 0.0 }, EUR: { ref_freq: 0.87, alt_freq: 0.13 }, EAS: { ref_freq: 1.0, alt_freq: 0.0 }, SAS: { ref_freq: 0.99, alt_freq: 0.01 }, AMR: { ref_freq: 0.91, alt_freq: 0.09 } }) },
  { rsid: 'rs1042602', chromosome: '11', position: 88911085, ref: 'C', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.90, alt_freq: 0.10 }, EUR: { ref_freq: 0.62, alt_freq: 0.38 }, EAS: { ref_freq: 0.05, alt_freq: 0.95 }, SAS: { ref_freq: 0.60, alt_freq: 0.40 }, AMR: { ref_freq: 0.71, alt_freq: 0.29 } }) },
  { rsid: 'rs12896399', chromosome: '14', position: 92773631, ref: 'G', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.13, alt_freq: 0.87 }, EUR: { ref_freq: 0.30, alt_freq: 0.70 }, EAS: { ref_freq: 0.62, alt_freq: 0.38 }, SAS: { ref_freq: 0.32, alt_freq: 0.68 }, AMR: { ref_freq: 0.17, alt_freq: 0.83 } }) },
  { rsid: 'rs1834640', chromosome: '15', position: 48392165, ref: 'A', alt: 'G', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.13, alt_freq: 0.87 }, EUR: { ref_freq: 0.62, alt_freq: 0.38 }, EAS: { ref_freq: 0.84, alt_freq: 0.16 }, SAS: { ref_freq: 0.50, alt_freq: 0.50 }, AMR: { ref_freq: 0.42, alt_freq: 0.58 } }) },
  { rsid: 'rs2470102', chromosome: '5', position: 33956872, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.10, alt_freq: 0.90 }, EUR: { ref_freq: 0.97, alt_freq: 0.03 }, EAS: { ref_freq: 0.85, alt_freq: 0.15 }, SAS: { ref_freq: 0.95, alt_freq: 0.05 }, AMR: { ref_freq: 0.89, alt_freq: 0.11 } }) },
  { rsid: 'rs1800414', chromosome: '15', position: 28230318, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 1.0, alt_freq: 0.0 }, EUR: { ref_freq: 1.0, alt_freq: 0.0 }, EAS: { ref_freq: 0.90, alt_freq: 0.10 }, SAS: { ref_freq: 0.99, alt_freq: 0.01 }, AMR: { ref_freq: 0.98, alt_freq: 0.02 } }) },
  { rsid: 'rs28777', chromosome: '5', position: 33959375, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.07, alt_freq: 0.93 }, EUR: { ref_freq: 0.95, alt_freq: 0.05 }, EAS: { ref_freq: 1.0, alt_freq: 0.0 }, SAS: { ref_freq: 0.90, alt_freq: 0.10 }, AMR: { ref_freq: 0.82, alt_freq: 0.18 } }) },
  { rsid: 'rs174546', chromosome: '11', position: 61570683, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.93, alt_freq: 0.07 }, EUR: { ref_freq: 0.32, alt_freq: 0.68 }, EAS: { ref_freq: 0.46, alt_freq: 0.54 }, SAS: { ref_freq: 0.83, alt_freq: 0.17 }, AMR: { ref_freq: 0.52, alt_freq: 0.48 } }) },
  { rsid: 'rs1129038', chromosome: '15', position: 28285117, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.39, alt_freq: 0.61 }, EUR: { ref_freq: 0.78, alt_freq: 0.22 }, EAS: { ref_freq: 0.02, alt_freq: 0.98 }, SAS: { ref_freq: 0.72, alt_freq: 0.28 }, AMR: { ref_freq: 0.47, alt_freq: 0.53 } }) },
  { rsid: 'rs2675345', chromosome: '4', position: 34719894, ref: 'G', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.70, alt_freq: 0.30 }, EUR: { ref_freq: 0.28, alt_freq: 0.72 }, EAS: { ref_freq: 0.12, alt_freq: 0.88 }, SAS: { ref_freq: 0.40, alt_freq: 0.60 }, AMR: { ref_freq: 0.45, alt_freq: 0.55 } }) },
  { rsid: 'rs4988235', chromosome: '2', position: 136608646, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.89, alt_freq: 0.11 }, EUR: { ref_freq: 0.20, alt_freq: 0.80 }, EAS: { ref_freq: 1.0, alt_freq: 0.0 }, SAS: { ref_freq: 0.64, alt_freq: 0.36 }, AMR: { ref_freq: 0.46, alt_freq: 0.54 } }) },
  { rsid: 'rs12124819', chromosome: '1', position: 207608822, ref: 'A', alt: 'G', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.63, alt_freq: 0.37 }, EUR: { ref_freq: 0.11, alt_freq: 0.89 }, EAS: { ref_freq: 0.37, alt_freq: 0.63 }, SAS: { ref_freq: 0.28, alt_freq: 0.72 }, AMR: { ref_freq: 0.12, alt_freq: 0.88 } }) },
  { rsid: 'rs6056505', chromosome: '20', position: 2714849, ref: 'G', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.23, alt_freq: 0.77 }, EUR: { ref_freq: 0.47, alt_freq: 0.53 }, EAS: { ref_freq: 0.81, alt_freq: 0.19 }, SAS: { ref_freq: 0.40, alt_freq: 0.60 }, AMR: { ref_freq: 0.37, alt_freq: 0.63 } }) },
  { rsid: 'rs7305066', chromosome: '12', position: 112168009, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.70, alt_freq: 0.30 }, EUR: { ref_freq: 0.25, alt_freq: 0.75 }, EAS: { ref_freq: 0.11, alt_freq: 0.89 }, SAS: { ref_freq: 0.26, alt_freq: 0.74 }, AMR: { ref_freq: 0.29, alt_freq: 0.71 } }) },
  { rsid: 'rs12629980', chromosome: '3', position: 68549585, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.11, alt_freq: 0.89 }, EUR: { ref_freq: 0.69, alt_freq: 0.31 }, EAS: { ref_freq: 0.93, alt_freq: 0.07 }, SAS: { ref_freq: 0.85, alt_freq: 0.15 }, AMR: { ref_freq: 0.49, alt_freq: 0.51 } }) },
  { rsid: 'rs7991418', chromosome: '13', position: 33000736, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.80, alt_freq: 0.20 }, EUR: { ref_freq: 0.34, alt_freq: 0.66 }, EAS: { ref_freq: 0.05, alt_freq: 0.95 }, SAS: { ref_freq: 0.17, alt_freq: 0.83 }, AMR: { ref_freq: 0.42, alt_freq: 0.58 } }) },
  { rsid: 'rs12904418', chromosome: '15', position: 28394079, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.62, alt_freq: 0.38 }, EUR: { ref_freq: 0.05, alt_freq: 0.95 }, EAS: { ref_freq: 0.45, alt_freq: 0.55 }, SAS: { ref_freq: 0.21, alt_freq: 0.79 }, AMR: { ref_freq: 0.30, alt_freq: 0.70 } }) },
  { rsid: 'rs401681', chromosome: '5', position: 1321273, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.85, alt_freq: 0.15 }, EUR: { ref_freq: 0.45, alt_freq: 0.55 }, EAS: { ref_freq: 0.32, alt_freq: 0.68 }, SAS: { ref_freq: 0.55, alt_freq: 0.45 }, AMR: { ref_freq: 0.60, alt_freq: 0.40 } }) },
  { rsid: 'rs1229984', chromosome: '4', position: 100239319, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.95, alt_freq: 0.05 }, EUR: { ref_freq: 0.66, alt_freq: 0.34 }, EAS: { ref_freq: 0.33, alt_freq: 0.67 }, SAS: { ref_freq: 0.95, alt_freq: 0.05 }, AMR: { ref_freq: 0.72, alt_freq: 0.28 } }) },
  { rsid: 'rs671', chromosome: '12', position: 112241766, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 1.0, alt_freq: 0.0 }, EUR: { ref_freq: 1.0, alt_freq: 0.0 }, EAS: { ref_freq: 0.32, alt_freq: 0.68 }, SAS: { ref_freq: 1.0, alt_freq: 0.0 }, AMR: { ref_freq: 0.97, alt_freq: 0.03 } }) },
  { rsid: 'rs1805007', chromosome: '16', position: 89986117, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 1.0, alt_freq: 0.0 }, EUR: { ref_freq: 0.92, alt_freq: 0.08 }, EAS: { ref_freq: 0.99, alt_freq: 0.01 }, SAS: { ref_freq: 0.99, alt_freq: 0.01 }, AMR: { ref_freq: 0.95, alt_freq: 0.05 } }) },
  { rsid: 'rs16830504', chromosome: '2', position: 136608618, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.93, alt_freq: 0.07 }, EUR: { ref_freq: 0.08, alt_freq: 0.92 }, EAS: { ref_freq: 0.96, alt_freq: 0.04 }, SAS: { ref_freq: 0.55, alt_freq: 0.45 }, AMR: { ref_freq: 0.42, alt_freq: 0.58 } }) },
  { rsid: 'rs4785763', chromosome: '16', position: 89993499, ref: 'C', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.28, alt_freq: 0.72 }, EUR: { ref_freq: 0.82, alt_freq: 0.18 }, EAS: { ref_freq: 0.09, alt_freq: 0.91 }, SAS: { ref_freq: 0.65, alt_freq: 0.35 }, AMR: { ref_freq: 0.40, alt_freq: 0.60 } }) },
  { rsid: 'rs3764261', chromosome: '16', position: 56959412, ref: 'C', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.33, alt_freq: 0.67 }, EUR: { ref_freq: 0.80, alt_freq: 0.20 }, EAS: { ref_freq: 0.88, alt_freq: 0.12 }, SAS: { ref_freq: 0.42, alt_freq: 0.58 }, AMR: { ref_freq: 0.62, alt_freq: 0.38 } }) },
  { rsid: 'rs8035124', chromosome: '15', position: 48714303, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.38, alt_freq: 0.62 }, EUR: { ref_freq: 0.83, alt_freq: 0.17 }, EAS: { ref_freq: 0.92, alt_freq: 0.08 }, SAS: { ref_freq: 0.69, alt_freq: 0.31 }, AMR: { ref_freq: 0.71, alt_freq: 0.29 } }) },
  { rsid: 'rs2246745', chromosome: '8', position: 19570031, ref: 'A', alt: 'G', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.75, alt_freq: 0.25 }, EUR: { ref_freq: 0.42, alt_freq: 0.58 }, EAS: { ref_freq: 0.53, alt_freq: 0.47 }, SAS: { ref_freq: 0.51, alt_freq: 0.49 }, AMR: { ref_freq: 0.62, alt_freq: 0.38 } }) },
  { rsid: 'rs10924069', chromosome: '1', position: 207620776, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.87, alt_freq: 0.13 }, EUR: { ref_freq: 0.15, alt_freq: 0.85 }, EAS: { ref_freq: 0.38, alt_freq: 0.62 }, SAS: { ref_freq: 0.35, alt_freq: 0.65 }, AMR: { ref_freq: 0.30, alt_freq: 0.70 } }) },
  { rsid: 'rs4833103', chromosome: '4', position: 38819514, ref: 'A', alt: 'G', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.15, alt_freq: 0.85 }, EUR: { ref_freq: 0.47, alt_freq: 0.53 }, EAS: { ref_freq: 0.60, alt_freq: 0.40 }, SAS: { ref_freq: 0.43, alt_freq: 0.57 }, AMR: { ref_freq: 0.35, alt_freq: 0.65 } }) },
  { rsid: 'rs2206277', chromosome: '2', position: 136603651, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.98, alt_freq: 0.02 }, EUR: { ref_freq: 0.39, alt_freq: 0.61 }, EAS: { ref_freq: 0.91, alt_freq: 0.09 }, SAS: { ref_freq: 0.68, alt_freq: 0.32 }, AMR: { ref_freq: 0.56, alt_freq: 0.44 } }) },
  { rsid: 'rs2255141', chromosome: '10', position: 114832114, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.54, alt_freq: 0.46 }, EUR: { ref_freq: 0.15, alt_freq: 0.85 }, EAS: { ref_freq: 0.03, alt_freq: 0.97 }, SAS: { ref_freq: 0.11, alt_freq: 0.89 }, AMR: { ref_freq: 0.20, alt_freq: 0.80 } }) },
  { rsid: 'rs870347', chromosome: '10', position: 114840150, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.65, alt_freq: 0.35 }, EUR: { ref_freq: 0.13, alt_freq: 0.87 }, EAS: { ref_freq: 0.01, alt_freq: 0.99 }, SAS: { ref_freq: 0.11, alt_freq: 0.89 }, AMR: { ref_freq: 0.18, alt_freq: 0.82 } }) },
  { rsid: 'rs693', chromosome: '2', position: 21232161, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.91, alt_freq: 0.09 }, EUR: { ref_freq: 0.85, alt_freq: 0.15 }, EAS: { ref_freq: 0.02, alt_freq: 0.98 }, SAS: { ref_freq: 0.87, alt_freq: 0.13 }, AMR: { ref_freq: 0.89, alt_freq: 0.11 } }) },
  { rsid: 'rs6060369', chromosome: '20', position: 46366142, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.37, alt_freq: 0.63 }, EUR: { ref_freq: 0.19, alt_freq: 0.81 }, EAS: { ref_freq: 0.01, alt_freq: 0.99 }, SAS: { ref_freq: 0.54, alt_freq: 0.46 }, AMR: { ref_freq: 0.23, alt_freq: 0.77 } }) },
  { rsid: 'rs7520389', chromosome: '1', position: 204625567, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.14, alt_freq: 0.86 }, EUR: { ref_freq: 0.18, alt_freq: 0.82 }, EAS: { ref_freq: 0.43, alt_freq: 0.57 }, SAS: { ref_freq: 0.25, alt_freq: 0.75 }, AMR: { ref_freq: 0.12, alt_freq: 0.88 } }) },
  { rsid: 'rs1545397', chromosome: '5', position: 33954841, ref: 'A', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.17, alt_freq: 0.83 }, EUR: { ref_freq: 0.97, alt_freq: 0.03 }, EAS: { ref_freq: 0.89, alt_freq: 0.11 }, SAS: { ref_freq: 0.90, alt_freq: 0.10 }, AMR: { ref_freq: 0.80, alt_freq: 0.20 } }) },
  { rsid: 'rs2238151', chromosome: '20', position: 2715160, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.46, alt_freq: 0.54 }, EUR: { ref_freq: 0.17, alt_freq: 0.83 }, EAS: { ref_freq: 0.85, alt_freq: 0.15 }, SAS: { ref_freq: 0.31, alt_freq: 0.69 }, AMR: { ref_freq: 0.21, alt_freq: 0.79 } }) },
  { rsid: 'rs7349332', chromosome: '2', position: 218591200, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.44, alt_freq: 0.56 }, EUR: { ref_freq: 0.97, alt_freq: 0.03 }, EAS: { ref_freq: 0.91, alt_freq: 0.09 }, SAS: { ref_freq: 0.79, alt_freq: 0.21 }, AMR: { ref_freq: 0.82, alt_freq: 0.18 } }) },
  { rsid: 'rs9378805', chromosome: '6', position: 156527880, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.22, alt_freq: 0.78 }, EUR: { ref_freq: 0.60, alt_freq: 0.40 }, EAS: { ref_freq: 0.86, alt_freq: 0.14 }, SAS: { ref_freq: 0.56, alt_freq: 0.44 }, AMR: { ref_freq: 0.38, alt_freq: 0.62 } }) },
  { rsid: 'rs11064560', chromosome: '12', position: 114159461, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.99, alt_freq: 0.01 }, EUR: { ref_freq: 0.55, alt_freq: 0.45 }, EAS: { ref_freq: 0.97, alt_freq: 0.03 }, SAS: { ref_freq: 0.60, alt_freq: 0.40 }, AMR: { ref_freq: 0.62, alt_freq: 0.38 } }) },
  { rsid: 'rs7107356', chromosome: '11', position: 61570390, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.73, alt_freq: 0.27 }, EUR: { ref_freq: 0.28, alt_freq: 0.72 }, EAS: { ref_freq: 0.56, alt_freq: 0.44 }, SAS: { ref_freq: 0.33, alt_freq: 0.67 }, AMR: { ref_freq: 0.31, alt_freq: 0.69 } }) },
  { rsid: 'rs17217768', chromosome: '3', position: 49808344, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.15, alt_freq: 0.85 }, EUR: { ref_freq: 0.60, alt_freq: 0.40 }, EAS: { ref_freq: 0.95, alt_freq: 0.05 }, SAS: { ref_freq: 0.64, alt_freq: 0.36 }, AMR: { ref_freq: 0.55, alt_freq: 0.45 } }) },
  { rsid: 'rs17132388', chromosome: '7', position: 27194029, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.88, alt_freq: 0.12 }, EUR: { ref_freq: 0.43, alt_freq: 0.57 }, EAS: { ref_freq: 0.76, alt_freq: 0.24 }, SAS: { ref_freq: 0.59, alt_freq: 0.41 }, AMR: { ref_freq: 0.55, alt_freq: 0.45 } }) },
  { rsid: 'rs9368878', chromosome: '6', position: 154786570, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.31, alt_freq: 0.69 }, EUR: { ref_freq: 0.62, alt_freq: 0.38 }, EAS: { ref_freq: 0.95, alt_freq: 0.05 }, SAS: { ref_freq: 0.69, alt_freq: 0.31 }, AMR: { ref_freq: 0.29, alt_freq: 0.71 } }) },
  { rsid: 'rs2051778', chromosome: '3', position: 187078055, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.16, alt_freq: 0.84 }, EUR: { ref_freq: 0.71, alt_freq: 0.29 }, EAS: { ref_freq: 0.10, alt_freq: 0.90 }, SAS: { ref_freq: 0.24, alt_freq: 0.76 }, AMR: { ref_freq: 0.40, alt_freq: 0.60 } }) },
  { rsid: 'rs1133486', chromosome: '5', position: 1279690, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.61, alt_freq: 0.39 }, EUR: { ref_freq: 0.15, alt_freq: 0.85 }, EAS: { ref_freq: 0.45, alt_freq: 0.55 }, SAS: { ref_freq: 0.22, alt_freq: 0.78 }, AMR: { ref_freq: 0.28, alt_freq: 0.72 } }) },
  { rsid: 'rs4782940', chromosome: '16', position: 10658392, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.40, alt_freq: 0.60 }, EUR: { ref_freq: 0.80, alt_freq: 0.20 }, EAS: { ref_freq: 0.19, alt_freq: 0.81 }, SAS: { ref_freq: 0.38, alt_freq: 0.62 }, AMR: { ref_freq: 0.60, alt_freq: 0.40 } }) },
  { rsid: 'rs2393996', chromosome: '7', position: 27193512, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.78, alt_freq: 0.22 }, EUR: { ref_freq: 0.76, alt_freq: 0.24 }, EAS: { ref_freq: 0.48, alt_freq: 0.52 }, SAS: { ref_freq: 0.70, alt_freq: 0.30 }, AMR: { ref_freq: 0.76, alt_freq: 0.24 } }) },
  { rsid: 'rs2228479', chromosome: '16', position: 89986336, ref: 'A', alt: 'G', populations: groupRegionalFreqs({ AFR: { ref_freq: 1.0, alt_freq: 0.0 }, EUR: { ref_freq: 0.93, alt_freq: 0.07 }, EAS: { ref_freq: 0.69, alt_freq: 0.31 }, SAS: { ref_freq: 0.83, alt_freq: 0.17 }, AMR: { ref_freq: 0.87, alt_freq: 0.13 } }) },
  { rsid: 'rs8659', chromosome: '16', position: 57013963, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.92, alt_freq: 0.08 }, EUR: { ref_freq: 0.80, alt_freq: 0.20 }, EAS: { ref_freq: 0.53, alt_freq: 0.47 }, SAS: { ref_freq: 0.80, alt_freq: 0.20 }, AMR: { ref_freq: 0.84, alt_freq: 0.16 } }) },
  { rsid: 'rs882605', chromosome: '1', position: 158868858, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.10, alt_freq: 0.90 }, EUR: { ref_freq: 0.41, alt_freq: 0.59 }, EAS: { ref_freq: 0.83, alt_freq: 0.17 }, SAS: { ref_freq: 0.48, alt_freq: 0.52 }, AMR: { ref_freq: 0.29, alt_freq: 0.71 } }) },
  { rsid: 'rs2752', chromosome: '11', position: 61571703, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.79, alt_freq: 0.21 }, EUR: { ref_freq: 0.32, alt_freq: 0.68 }, EAS: { ref_freq: 0.50, alt_freq: 0.50 }, SAS: { ref_freq: 0.71, alt_freq: 0.29 }, AMR: { ref_freq: 0.37, alt_freq: 0.63 } }) },
  { rsid: 'rs2824471', chromosome: '21', position: 16553139, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.55, alt_freq: 0.45 }, EUR: { ref_freq: 0.90, alt_freq: 0.10 }, EAS: { ref_freq: 0.77, alt_freq: 0.23 }, SAS: { ref_freq: 0.82, alt_freq: 0.18 }, AMR: { ref_freq: 0.79, alt_freq: 0.21 } }) },
  { rsid: 'rs17517408', chromosome: '1', position: 204599871, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.96, alt_freq: 0.04 }, EUR: { ref_freq: 0.93, alt_freq: 0.07 }, EAS: { ref_freq: 0.56, alt_freq: 0.44 }, SAS: { ref_freq: 0.89, alt_freq: 0.11 }, AMR: { ref_freq: 0.93, alt_freq: 0.07 } }) },
  { rsid: 'rs13333520', chromosome: '16', position: 56964288, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.96, alt_freq: 0.04 }, EUR: { ref_freq: 0.70, alt_freq: 0.30 }, EAS: { ref_freq: 0.89, alt_freq: 0.11 }, SAS: { ref_freq: 0.88, alt_freq: 0.12 }, AMR: { ref_freq: 0.78, alt_freq: 0.22 } }) },
  { rsid: 'rs10924083', chromosome: '1', position: 207620411, ref: 'C', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.97, alt_freq: 0.03 }, EUR: { ref_freq: 0.90, alt_freq: 0.10 }, EAS: { ref_freq: 0.62, alt_freq: 0.38 }, SAS: { ref_freq: 0.83, alt_freq: 0.17 }, AMR: { ref_freq: 0.87, alt_freq: 0.13 } }) },
  { rsid: 'rs7510493', chromosome: '1', position: 237762468, ref: 'T', alt: 'C', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.10, alt_freq: 0.90 }, EUR: { ref_freq: 0.38, alt_freq: 0.62 }, EAS: { ref_freq: 0.82, alt_freq: 0.18 }, SAS: { ref_freq: 0.45, alt_freq: 0.55 }, AMR: { ref_freq: 0.43, alt_freq: 0.57 } }) },
  { rsid: 'rs11639224', chromosome: '16', position: 89215135, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.96, alt_freq: 0.04 }, EUR: { ref_freq: 0.60, alt_freq: 0.40 }, EAS: { ref_freq: 0.93, alt_freq: 0.07 }, SAS: { ref_freq: 0.84, alt_freq: 0.16 }, AMR: { ref_freq: 0.74, alt_freq: 0.26 } }) },
  { rsid: 'rs1042471', chromosome: '11', position: 61200042, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.38, alt_freq: 0.62 }, EUR: { ref_freq: 0.68, alt_freq: 0.32 }, EAS: { ref_freq: 0.01, alt_freq: 0.99 }, SAS: { ref_freq: 0.23, alt_freq: 0.77 }, AMR: { ref_freq: 0.45, alt_freq: 0.55 } }) },
  { rsid: 'rs12781313', chromosome: '10', position: 114868982, ref: 'G', alt: 'A', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.02, alt_freq: 0.98 }, EUR: { ref_freq: 0.48, alt_freq: 0.52 }, EAS: { ref_freq: 0.46, alt_freq: 0.54 }, SAS: { ref_freq: 0.50, alt_freq: 0.50 }, AMR: { ref_freq: 0.39, alt_freq: 0.61 } }) },
  { rsid: 'rs1003290', chromosome: '3', position: 39109817, ref: 'C', alt: 'T', populations: groupRegionalFreqs({ AFR: { ref_freq: 0.91, alt_freq: 0.09 }, EUR: { ref_freq: 0.58, alt_freq: 0.42 }, EAS: { ref_freq: 0.23, alt_freq: 0.77 }, SAS: { ref_freq: 0.39, alt_freq: 0.61 }, AMR: { ref_freq: 0.72, alt_freq: 0.28 } }) },
];

const MATERNAL_HAPLOGROUP_SNPS: Array<{ rsid: string; chromosome: string; position: number; ancestral: string; derived: string; haplogroup: string; description: string; origin: string; age: string }> = [
  { rsid: 'rs28359178', chromosome: 'MT', position: 10400, ancestral: 'C', derived: 'T', haplogroup: 'L3', description: 'Founder of all non-African mtDNA lineages', origin: 'East Africa', age: '~70,000 years' },
  { rsid: 'rs2854124', chromosome: 'MT', position: 11719, ancestral: 'G', derived: 'A', haplogroup: 'R0', description: 'Major European/West Asian lineage', origin: 'Middle East', age: '~55,000 years' },
  { rsid: 'rs2853511', chromosome: 'MT', position: 14766, ancestral: 'C', derived: 'T', haplogroup: 'H', description: 'Most common European haplogroup', origin: 'Southwest Asia/Europe', age: '~25,000 years' },
  { rsid: 'rs28357678', chromosome: 'MT', position: 7028, ancestral: 'C', derived: 'T', haplogroup: 'H', description: 'Major European clade', origin: 'Europe', age: '~20,000 years' },
  { rsid: 'rs2853826', chromosome: 'MT', position: 12308, ancestral: 'A', derived: 'G', haplogroup: 'U', description: 'Oldest European-specific haplogroup', origin: 'Europe', age: '~50,000 years' },
  { rsid: 'rs2853498', chromosome: 'MT', position: 11467, ancestral: 'A', derived: 'G', haplogroup: 'U', description: 'European hunter-gatherer lineage', origin: 'Europe', age: '~45,000 years' },
  { rsid: 'rs2857284', chromosome: 'MT', position: 10398, ancestral: 'A', derived: 'G', haplogroup: 'N', description: 'Major Eurasian macro-haplogroup', origin: 'Middle East', age: '~65,000 years' },
  { rsid: 'rs2857293', chromosome: 'MT', position: 10873, ancestral: 'T', derived: 'C', haplogroup: 'N', description: 'Pan-Eurasian founder lineage', origin: 'Middle East', age: '~60,000 years' },
  { rsid: 'rs28357980', chromosome: 'MT', position: 8701, ancestral: 'A', derived: 'G', haplogroup: 'N', description: 'Eastern Eurasian maternal ancestry', origin: 'Central Asia', age: '~55,000 years' },
  { rsid: 'rs2853516', chromosome: 'MT', position: 9540, ancestral: 'T', derived: 'C', haplogroup: 'M', description: 'Major East/South Asian lineage', origin: 'South Asia', age: '~60,000 years' },
  { rsid: 'rs28358280', chromosome: 'MT', position: 10400, ancestral: 'C', derived: 'T', haplogroup: 'M', description: 'Pan-Asian maternal ancestry', origin: 'South Asia', age: '~55,000 years' },
  { rsid: 'rs2853506', chromosome: 'MT', position: 11251, ancestral: 'A', derived: 'G', haplogroup: 'JT', description: 'European/West Asian maternal ancestry', origin: 'Middle East', age: '~50,000 years' },
];

const PATERNAL_HAPLOGROUP_SNPS: Array<{ rsid: string; chromosome: string; position: number; ancestral: string; derived: string; haplogroup: string; description: string; origin: string; age: string }> = [
  { rsid: 'rs9785952', chromosome: 'Y', position: 2787400, ancestral: 'T', derived: 'C', haplogroup: 'R1b', description: 'Most common Western European paternal lineage', origin: 'Western Europe', age: '~18,000 years' },
  { rsid: 'rs2032652', chromosome: 'Y', position: 2655345, ancestral: 'G', derived: 'A', haplogroup: 'R1a', description: 'Major Eastern European/South Asian paternal lineage', origin: 'Eastern Europe', age: '~22,000 years' },
  { rsid: 'rs9341285', chromosome: 'Y', position: 23867550, ancestral: 'T', derived: 'C', haplogroup: 'I', description: 'Scandinavian/Balkan European paternal lineage', origin: 'Europe', age: '~27,000 years' },
  { rsid: 'rs9786153', chromosome: 'Y', position: 2879920, ancestral: 'C', derived: 'T', haplogroup: 'E1b1b', description: 'Major African/Mediterranean paternal lineage', origin: 'East Africa', age: '~25,000 years' },
  { rsid: 'rs2032644', chromosome: 'Y', position: 2655345, ancestral: 'C', derived: 'T', haplogroup: 'J', description: 'Middle Eastern/Caucasus paternal lineage', origin: 'Middle East', age: '~30,000 years' },
  { rsid: 'rs2534636', chromosome: 'Y', position: 2655579, ancestral: 'C', derived: 'T', haplogroup: 'O', description: 'Major East/Southeast Asian paternal lineage', origin: 'East Asia', age: '~35,000 years' },
  { rsid: 'rs17307398', chromosome: 'Y', position: 21857324, ancestral: 'C', derived: 'T', haplogroup: 'Q', description: 'Native American/Central Asian paternal lineage', origin: 'Siberia/Central Asia', age: '~30,000 years' },
];

function groupRegionalFreqs(freqs: Record<string, { ref_freq: number; alt_freq: number }>): Record<string, { ref_freq: number; alt_freq: number }> {
  const expanded: Record<string, { ref_freq: number; alt_freq: number }> = {};
  for (const [superPop, data] of Object.entries(freqs)) {
    const pops = Object.keys(POPULATION_REGISTRY).filter(code => {
      const info = POPULATION_REGISTRY[code];
      if (!info) return false;
      if (superPop === 'AFR') return ['YRI', 'LWK', 'GWD', 'MSL', 'ESN', 'ASW', 'ACB'].includes(code);
      if (superPop === 'EUR') return ['CEU', 'GBR', 'FIN', 'TSI', 'IBS'].includes(code);
      if (superPop === 'EAS') return ['CHB', 'CHS', 'JPT', 'CDX', 'KHV'].includes(code);
      if (superPop === 'SAS') return ['GIH', 'PJL', 'BEB', 'STU', 'ITU'].includes(code);
      if (superPop === 'AMR') return ['MXL', 'PUR', 'CLM', 'PEL'].includes(code);
      return false;
    });
    for (const code of pops) {
      expanded[code] = data;
    }
  }
  return expanded;
}

const BENFORD_SMOOTHING = 0.0001;

export { POPULATION_REGISTRY, ANCESTRY_INFORMATIVE_MARKERS, MATERNAL_HAPLOGROUP_SNPS, PATERNAL_HAPLOGROUP_SNPS, BENFORD_SMOOTHING };
