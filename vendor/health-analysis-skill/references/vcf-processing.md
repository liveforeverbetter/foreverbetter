# VCF Processing Reference

Guide for processing VCF (Variant Call Format) files for genomic analysis.

## VCF Format Overview

VCF is the standard format for storing genetic variant data. Key versions:
- VCF 4.2 (most common for direct-to-consumer tests)
- VCF 4.3 (latest specification)

## VCF File Structure

```vcf
##fileformat=VCFv4.2
##fileDate=20240115
##source=DanteLabs_WGS_v3
##reference=GRCh38
##contig=<ID=chr1,length=248956422>
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM  POS     ID      REF     ALT     QUAL    FILTER  INFO    FORMAT  SAMPLE
chr1    10491   rs7545  AC      A       .       PASS    DP=50   GT      0/1
chr1    1148277 rs10907 G       A       .       PASS    DP=80   GT      1/1
```

## Parsing in This Repository

### Key Files
- `src/lib/genotype/parsers/vcf.ts` - VCF parser
- `src/lib/genotype/types.ts` - Genotype data types
- `src/lib/genotype/index.ts` - Main export

### Parsing Logic

```typescript
import { parseVCF, type ParsedVCF } from '@/lib/genotype';

// Basic usage
const vcfContent = await readFile('genome.vcf', 'utf-8');
const parsed: ParsedVCF = parseVCF(vcfContent);

// Access SNPs
console.log(`Found ${parsed.snps.length} variants`);
for (const snp of parsed.snps) {
  console.log(`${snp.rsid}: ${snp.genotype}`);
}
```

### Parsed SNP Structure

```typescript
interface SNP {
  rsid: string;       // e.g., "rs1801133"
  chromosome: string;  // e.g., "1" or "chr1"
  position: number;     // e.g., 11845978
  ref: string;         // Reference allele, e.g., "C"
  alt: string;         // Alternate allele, e.g., "T"
  genotype: string;     // e.g., "CT", "TT", "CC"
  zygosity: 'homozygous_reference' | 'heterozygous' | 'homozygous_alternative';
}
```

## Supported File Formats

### Direct-to-Consumer Test Formats
1. **23andMe** - Tab-delimited with `#` header
2. **AncestryDNA** - Similar to 23andMe format
3. **Dante Labs** - Standard VCF with WGS data
4. **Living DNA** - Custom format
5. **MyHeritage** - VCF variant format

### VCF vs Array-Based Formats

| Format | Variants | Coverage |
|--------|----------|----------|
| WGS (Whole Genome Sequencing) | 4-5 million | ~90% of all known variants |
| WES (Whole Exome Sequencing) | 100K-500K | Protein-coding only |
| Array/DTC (23andMe, Ancestry) | 500K-700K | Pre-selected variants |

## Genotype Interpretation

### Allele Encoding
| Code | Meaning |
|------|---------|
| 0 | Reference allele (matches REF) |
| 1 | First alternate allele (matches ALT[0]) |
| 2 | Second alternate allele (matches ALT[1]) |
| . | Missing allele |

### Genotype Notation
| Notation | Meaning |
|----------|---------|
| 0/0 or 0\|0 | Homozygous reference |
| 0/1 or 0\|1 | Heterozygous |
| 1/1 or 1\|1 | Homozygous alternative |
| 1/2 | Multi-allelic (rare) |
| ./ | Missing data |

**Note**: `/` = unphased, `|` = phased

## Zygosity Determination

```typescript
function determineZygosity(genotype: string, ref: string, alt: string): Zygosity {
  const alleles = genotype.split(/[\/|]/);

  if (alleles[0] === '0' && alleles[1] === '0') {
    return 'homozygous_reference';
  } else if (alleles[0] === alleles[1]) {
    return 'homozygous_alternative';
  } else {
    return 'heterozygous';
  }
}
```

## Quality Filtering

### Standard Filters
- **PASS** - Variant passes all filters
- **LowQual** - Quality below threshold
- **MQ below threshold** - Mapping quality issue
- **QD below threshold** - Quality by depth issue

### Recommended Thresholds
```typescript
const QUAL_THRESHOLD = 30;      // Minimum quality score
const DP_MIN = 10;              // Minimum read depth
const DP_MAX = 500;             // Maximum read depth (potential mapping error)
const AF_THRESHOLD = 0.2;       // Minimum alternate allele frequency
```

## SNP Lookup Process

```typescript
import { extractMarkers } from '@/lib/markers/extraction';
import { GENETIC_MARKERS } from '@/lib/markers/definitions';

// Get all rsIDs to look for
const targetRsids = new Set(GENETIC_MARKERS.map(m => m.rsid));

// Filter parsed SNPs to only markers we care about
const relevantSnps = parsed.snps.filter(snp => targetRsids.has(snp.rsid));

// Extract markers with interpretations
const extraction = extractMarkers(relevantSnps);
```

## Example Analysis Pipeline

```typescript
async function analyzeGenome(vcfContent: string) {
  // 1. Parse VCF
  const parsed = parseVCF(vcfContent);

  // 2. Extract markers
  const { markers, byCategory } = extractMarkers(parsed.snps);

  // 3. Calculate overall health score
  const healthScore = calculateHealthScore(markers);

  // 4. Generate category summaries
  const summaries = {
    methylation: analyzeCategory(byCategory.methylation),
    cardiovascular: analyzeCategory(byCategory.cardiovascular),
    cognitive: analyzeCategory(byCategory.cognitive),
    // ... other categories
  };

  // 5. Generate recommendations
  const recommendations = generateRecommendations(markers);

  return {
    healthScore,
    markers,
    summaries,
    recommendations
  };
}
```

## Common Issues

### 1. Missing rsIDs - Position-Based Lookup
Some VCF files (especially WGS from Dante Labs) don't include rsIDs in the ID column (all "."). In these cases, use chromosome + position lookup:

```typescript
// Position-based marker lookup map
const MARKER_POSITIONS: MarkerLookup[] = [
  { rsid: 'rs1801133', gene: 'MTHFR', chrom: '1', position: 11856378, refAllele: 'C', altAllele: 'T' },
  { rsid: 'rs1801131', gene: 'MTHFR', chrom: '1', position: 11854476, refAllele: 'T', altAllele: 'G' },
  { rsid: 'rs4680', gene: 'COMT', chrom: '22', position: 19951271, refAllele: 'G', altAllele: 'A' },
  // ... more markers
];

// Build lookup map
const positionMap = new Map<string, MarkerLookup>();
for (const marker of MARKER_POSITIONS) {
  const key = `${marker.chrom}:${marker.position}`;
  positionMap.set(key, marker);
}

// During streaming parse
const key = `${chrom}:${position}`;
const marker = positionMap.get(key);
if (marker) {
  // Found a relevant marker even without rsID
}
```

**Key positions for common DTC markers:**
- MTHFR C677T: chr1:11856378
- MTHFR A1298C: chr1:11854476
- COMT Val158Met: chr22:19951271
- BDNF Val66Met: chr11:27679916
- CYP1A2 A>C: chr15:75041917
- FTO A>T: chr16:53820527
- IL6 -572 C>G: chr7:22766645
- APOE rs429358: chr19:45411941
- APOE rs7412: chr19:45412079

### 2. Chromosome Naming Conventions
Different files use different conventions:
- `1` vs `chr1` (strip `chr` prefix for consistency)
- `X` vs `chrX` vs `23` (normalize to X/Y/M)
- `MT` vs `chrM` (mitochondrial)

### 3. Non-Standard Reference Genomes
| Reference | Notes |
|-----------|-------|
| GRCh37 (hg19) | Older reference, still common |
| GRCh38 (hg38) | Current standard |
| b37 | UCSC naming for GRCh37 |
| hg18 | Very old, avoid if possible |

### 4. Allele Flipping
Sometimes ref and alt are swapped vs the database. Always normalize:
```typescript
function normalizeAlleles(ref: string, alt: string, expectedRef: string): string {
  if (ref === expectedRef) {
    return `${ref}/${alt}`;
  } else if (alt === expectedRef) {
    return `${alt}/${ref}`; // Flipped
  }
  return 'unknown';
}
```

## Performance Considerations

### For Large WGS Files (millions of variants)
```typescript
// Process in streaming fashion for memory efficiency
async function* parseVCFStream(filePath: string) {
  const stream = createReadStream(filePath);
  for await (const line of stream) {
    if (!line.startsWith('#')) {
      yield parseLine(line);
    }
  }
}

// Or use worker threads for parallel processing
import { Worker } from 'worker_threads';
```

### Targeted Extraction
Only parse markers you need:
```typescript
const targetRsids = getTargetRsids(); // Your gene panel
const filtered = parseVCFTargeted(vcfContent, targetRsids);
```

## File Size Estimates

| Test Type | Typical Variants | File Size |
|-----------|-----------------|-----------|
| 23andMe v5 | ~650K | ~50MB |
| AncestryDNA | ~700K | ~60MB |
| Dante Labs WGS | ~4M | ~400MB |
| Full WGS (30x) | ~5M | ~3-5GB |
