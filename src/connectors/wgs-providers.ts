export interface WgsProvider {
  id: string;
  name: string;
  type: 'wgs' | 'snp_array' | 'exome';
  regions: string[];
  url: string;
  sample_type: 'saliva' | 'blood' | 'swab' | 'other';
  turn_around_weeks: string;
  price_range_usd: string;
  includes_interpretation: boolean;
  data_format: string[];
  raw_data_access: boolean;
  clia_certified: boolean;
  notes: string[];
}

const WGS_PROVIDERS: WgsProvider[] = [
  {
    id: 'tellmegen',
    name: 'tellmeGen',
    type: 'wgs',
    regions: ['Europe', 'North America', 'Latin America', 'Middle East'],
    url: 'https://www.tellmegen.com',
    sample_type: 'saliva',
    turn_around_weeks: '4-8',
    price_range_usd: '$150-800',
    includes_interpretation: true,
    data_format: ['VCF', 'BAM', 'raw text', 'PDF report'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['Offers both SNP array and 30x WGS (tellmeGen Premium/Advanced). WGS covers pharmacogenetics, 400+ health predispositions, 200+ traits, ancestry, and nutrition. Raw VCF/BAM download available. CLIA-certified for clinical-grade reports.'],
  },
  {
    id: 'dante_labs',
    name: 'Dante Labs',
    type: 'wgs',
    regions: ['Europe', 'North America', 'International'],
    url: 'https://www.dantelabs.com',
    sample_type: 'saliva',
    turn_around_weeks: '6-12',
    price_range_usd: '$299-699',
    includes_interpretation: true,
    data_format: ['VCF', 'FASTQ', 'BAM', 'PDF report'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['30x whole genome sequencing. Provides VCF, FASTQ, and BAM files. Includes health reports for disease risk, pharmacogenetics, traits, and nutrition. CLIA-certified lab.'],
  },
  {
    id: 'nebula_genomics',
    name: 'Nebula Genomics',
    type: 'wgs',
    regions: ['North America', 'Europe', 'International'],
    url: 'https://nebula.org',
    sample_type: 'saliva',
    turn_around_weeks: '8-12',
    price_range_usd: '$249-999',
    includes_interpretation: true,
    data_format: ['VCF', 'CRAM', 'FASTQ'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['30x WGS. Privacy-focused with encrypted data storage. Research library with weekly trait updates. Offers 100x deep sequencing tier. Full data ownership guaranteed.'],
  },
  {
    id: 'sequencing_com',
    name: 'Sequencing.com',
    type: 'wgs',
    regions: ['North America', 'International'],
    url: 'https://sequencing.com',
    sample_type: 'saliva',
    turn_around_weeks: '8-12',
    price_range_usd: '$399-999',
    includes_interpretation: true,
    data_format: ['VCF', 'BAM', 'FASTQ'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['30x WGS. App marketplace for third-party DNA reports. Accepts raw data uploads from other providers for re-analysis.'],
  },
  {
    id: 'fabric_genomics',
    name: 'Fabric Genomics',
    type: 'wgs',
    regions: ['North America', 'Europe'],
    url: 'https://fabricgenomics.com',
    sample_type: 'saliva',
    turn_around_weeks: '6-8',
    price_range_usd: '$750-1500',
    includes_interpretation: true,
    data_format: ['VCF', 'clinical report'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['Clinical-grade sequencing with AI-powered interpretation. Focus on pediatric and rare disease. CLIA/CAP certified. Physician-mediated ordering.'],
  },
  {
    id: 'full_genomes',
    name: 'Full Genomes Corporation',
    type: 'wgs',
    regions: ['North America', 'International'],
    url: 'https://www.fullgenomes.com',
    sample_type: 'saliva',
    turn_around_weeks: '8-16',
    price_range_usd: '$550-1100',
    includes_interpretation: false,
    data_format: ['VCF', 'BAM', 'FASTQ'],
    raw_data_access: true,
    clia_certified: false,
    notes: ['30x WGS with Y-DNA and mtDNA analysis included. Raw data-focused; interpretation requires third-party tools or services. Good for bioinformaticians.'],
  },
  {
    id: 'gene_by_gene',
    name: 'Gene by Gene',
    type: 'wgs',
    regions: ['North America', 'International'],
    url: 'https://www.genebygene.com',
    sample_type: 'saliva',
    turn_around_weeks: '8-12',
    price_range_usd: '$499-999',
    includes_interpretation: false,
    data_format: ['VCF', 'BAM', 'FASTQ'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['CLIA/CAP lab that processes for FamilyTreeDNA and other brands. Research-grade and clinical WGS options. Good for researchers who want raw data.'],
  },
  {
    id: 'bgi',
    name: 'BGI Genomics',
    type: 'wgs',
    regions: ['Asia', 'Europe', 'International'],
    url: 'https://www.bgi.com',
    sample_type: 'blood',
    turn_around_weeks: '6-12',
    price_range_usd: '$400-800',
    includes_interpretation: false,
    data_format: ['VCF', 'FASTQ', 'BAM'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['One of the largest sequencing providers globally. Primarily serves clinical and research markets. DTC availability varies by region. Large reference database.'],
  },
  {
    id: 'veritas_genetics',
    name: 'Veritas Genetics (acquired by LetsGetChecked)',
    type: 'wgs',
    regions: ['Europe', 'Latin America', 'Middle East'],
    url: 'https://www.veritasint.com',
    sample_type: 'saliva',
    turn_around_weeks: '6-8',
    price_range_usd: '$599-999',
    includes_interpretation: true,
    data_format: ['VCF', 'clinical report'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['Pioneered the $999 genome. Now operating under LetsGetChecked. Clinical-grade interpretation with genetic counseling included in premium tiers.'],
  },
  {
    id: '23andme',
    name: '23andMe',
    type: 'snp_array',
    regions: ['North America', 'Europe', 'International'],
    url: 'https://www.23andme.com',
    sample_type: 'saliva',
    turn_around_weeks: '3-6',
    price_range_usd: '$99-229',
    includes_interpretation: true,
    data_format: ['raw text', 'online reports'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['SNP array (~650k variants), not WGS. Best-known DTC genetics company. Covers ancestry, health predispositions, carrier status, and traits. Raw data export supported. FDA-authorized for certain health reports.'],
  },
  {
    id: 'ancestrydna',
    name: 'AncestryDNA',
    type: 'snp_array',
    regions: ['North America', 'Europe', 'Australia'],
    url: 'https://www.ancestry.com/dna',
    sample_type: 'saliva',
    turn_around_weeks: '6-8',
    price_range_usd: '$99-119',
    includes_interpretation: true,
    data_format: ['raw text'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['SNP array (~700k variants), not WGS. Largest consumer DNA database. Primarily ancestry-focused; limited health traits. Raw data can be exported and uploaded to third-party services for health analysis.'],
  },
  {
    id: 'myheritage',
    name: 'MyHeritage DNA',
    type: 'snp_array',
    regions: ['Europe', 'North America', 'International'],
    url: 'https://www.myheritage.com/dna',
    sample_type: 'swab',
    turn_around_weeks: '4-6',
    price_range_usd: '$79-89',
    includes_interpretation: true,
    data_format: ['raw text'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['SNP array (~700k variants), not WGS. Strong European ancestry database. Health reports available as add-on. Cheek swab instead of saliva tube (better for elderly/children).'],
  },
  {
    id: 'circle_dna',
    name: 'CircleDNA',
    type: 'wgs',
    regions: ['Asia', 'North America', 'Europe', 'International'],
    url: 'https://www.circledna.com',
    sample_type: 'swab',
    turn_around_weeks: '3-4',
    price_range_usd: '$299-629',
    includes_interpretation: true,
    data_format: ['VCF', 'PDF report'],
    raw_data_access: true,
    clia_certified: true,
    notes: ['WGS at 30x depth. Extensive health reports (500+ reports): disease risk, cancer screening, pharmacogenetics, nutrition, fitness, and ancestry. Cheek swab collection.'],
  },
  {
    id: 'yfull',
    name: 'YFull',
    type: 'wgs',
    regions: ['International'],
    url: 'https://www.yfull.com',
    sample_type: 'other',
    turn_around_weeks: '2-4',
    price_range_usd: '$49-99',
    includes_interpretation: true,
    data_format: ['VCF', 'BAM'],
    raw_data_access: true,
    clia_certified: false,
    notes: ['Analysis service, not a lab. Upload existing WGS/WES data for Y-chromosome and mtDNA analysis. Uses large reference tree. No sample collection - analysis only.'],
  },
  {
    id: 'promethease',
    name: 'Promethease',
    type: 'snp_array',
    regions: ['International'],
    url: 'https://www.promethease.com',
    sample_type: 'other',
    turn_around_weeks: 'immediate',
    price_range_usd: '$12',
    includes_interpretation: true,
    data_format: ['HTML report'],
    raw_data_access: false,
    clia_certified: false,
    notes: ['Literature-based SNP interpretation service (not a lab). Upload raw data from any provider for instant SNPedia-based reports. Owned by MyHeritage. No sequencing performed.'],
  },
];

const REGION_ALIASES: Record<string, string[]> = {
  'north_america': ['North America'],
  'europe': ['Europe'],
  'asia': ['Asia'],
  'latin_america': ['Latin America'],
  'middle_east': ['Middle East'],
  'international': ['International'],
};

export function listWgsProviders(input?: { type?: string; region?: string }): WgsProvider[] {
  let providers = WGS_PROVIDERS;

  if (input?.type && input.type !== 'all') {
    providers = providers.filter(provider =>
      provider.type === input.type
      || (input.type === 'sequencing' && (provider.type === 'wgs' || provider.type === 'exome')),
    );
  }

  if (input?.region) {
    const targetRegions = REGION_ALIASES[input.region] ?? [input.region];
    providers = providers.filter(provider =>
      targetRegions.some(target =>
        provider.regions.some(providerRegion =>
          providerRegion.toLowerCase().includes(target.toLowerCase()),
        ),
      ),
    );
  }

  return providers;
}

export function getWgsProvider(id: string): WgsProvider | undefined {
  return WGS_PROVIDERS.find(provider => provider.id === id);
}
