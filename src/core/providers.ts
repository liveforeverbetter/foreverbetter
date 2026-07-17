import { searchLabs, type LabSearchInput } from '../connectors/labs.js';
import { listWgsProviders } from '../connectors/wgs-providers.js';
import { WEARABLE_PROVIDERS } from '../connectors/wearables.js';

// One place to discover where to *get* wellness data: genetic-testing/WGS providers,
// lab draw sites, and supported wearable integrations. Callers pass the modalities
// they care about; results are grouped by modality (the shapes differ per source).

export type ProviderModality = 'genetics' | 'biomarkers' | 'wearables';

export const PROVIDER_MODALITIES: ProviderModality[] = ['genetics', 'biomarkers', 'wearables'];

export interface FindProvidersInput {
  modalities?: ProviderModality[];
  // Genetics filters (WGS/SNP providers).
  type?: string;      // 'wgs' | 'snp_array' | 'exome'
  region?: string;    // e.g. 'Europe', 'North America'
  // Biomarker/lab locator filters (a location is required to return draw sites).
  lab_provider?: 'quest' | 'synlab' | 'all';
  postal_code?: string;
  city?: string;
  country?: string;
  lat?: number;
  lon?: number;
  radius_miles?: number;
}

export interface FindProvidersResult {
  query: { modalities: ProviderModality[]; region?: string; type?: string };
  genetics?: ReturnType<typeof listWgsProviders>;
  wearables?: typeof WEARABLE_PROVIDERS;
  biomarkers?: {
    supported_providers: Array<'quest' | 'synlab'>;
    locations: unknown[];
    note?: string;
  };
}

export async function findProviders(input: FindProvidersInput): Promise<FindProvidersResult> {
  const modalities = input.modalities && input.modalities.length > 0 ? input.modalities : PROVIDER_MODALITIES;
  const result: FindProvidersResult = { query: { modalities, region: input.region, type: input.type } };

  if (modalities.includes('genetics')) {
    result.genetics = listWgsProviders({ type: input.type, region: input.region });
  }

  if (modalities.includes('wearables')) {
    result.wearables = WEARABLE_PROVIDERS;
  }

  if (modalities.includes('biomarkers')) {
    const hasLocation = Boolean(input.postal_code || input.city || input.country || (input.lat != null && input.lon != null));
    if (hasLocation) {
      const labInput: LabSearchInput = {
        provider: input.lab_provider ?? 'all',
        postal_code: input.postal_code,
        city: input.city,
        country: input.country,
        lat: input.lat,
        lon: input.lon,
        radius_miles: input.radius_miles,
      };
      result.biomarkers = { supported_providers: ['quest', 'synlab'], locations: await searchLabs(labInput) };
    } else {
      result.biomarkers = {
        supported_providers: ['quest', 'synlab'],
        locations: [],
        note: 'Pass postal_code, city, or lat/lon (with optional radius_miles) to locate nearby lab draw sites.',
      };
    }
  }

  return result;
}

// Parse the comma-separated `modality` query param into a validated list.
export function parseModalities(raw: string | null | undefined): ProviderModality[] | undefined {
  if (!raw) return undefined;
  const requested = raw.split(',').map(value => value.trim().toLowerCase());
  const valid = requested.filter((value): value is ProviderModality => (PROVIDER_MODALITIES as string[]).includes(value));
  return valid.length > 0 ? valid : undefined;
}
