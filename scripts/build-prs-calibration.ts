import { writeFile } from 'node:fs/promises';
import { buildPgsCalibrationRegistry } from '../src/core/pgs-calibration-builder.js';
import { calibrationRegistryDigest } from '../src/core/pgs-calibration.js';

const args = parseArgs(process.argv.slice(2));
const required = (name: string): string => {
  const value = args.get(name);
  if (!value) throw new Error(`Missing required --${name}.`);
  return value;
};

const registry = await buildPgsCalibrationRegistry({
  scoreRowsPath: required('scores'),
  scoreManifestPath: args.get('manifest') ?? 'data/genetics/pgs/manifest.json',
  release: required('release'),
  referencePanel: {
    id: args.get('reference-id') ?? 'PGSC_HGDP+1kGP_v1',
    release: args.get('reference-release') ?? 'v1',
    source_url: args.get('reference-url') ?? 'https://ftp.ebi.ac.uk/pub/databases/spot/pgs/resources/pgsc_HGDP+1kGP_v1.tar.zst',
    sha256: required('reference-sha256'),
    unrelated_samples: Number(required('unrelated-samples')),
  },
  generator: {
    name: args.get('generator-name') ?? 'foreverbetter-prs-reference',
    version: required('generator-version'),
    command: args.get('generator-command'),
  },
});

const output = args.get('output') ?? 'data/genetics/pgs/calibration.json';
await writeFile(output, `${JSON.stringify(registry)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ output, scores: registry.scores.length, sha256: calibrationRegistryDigest(registry) }));

function parseArgs(values: string[]): Map<string, string> {
  const output = new Map<string, string>();
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith('--') || !value) throw new Error(`Invalid argument near ${key ?? '<end>'}. Expected --name value.`);
    output.set(key.slice(2), value);
  }
  return output;
}
