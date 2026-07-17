import { execFileSync } from 'node:child_process';

const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});
const [pack] = JSON.parse(output);
const files = (pack?.files ?? []).map(entry => String(entry.path));
const forbidden = [
  /^\.env(?:\.|$)/,
  /^\.secrets(?:\/|$)/,
  /^\.gstack(?:\/|$)/,
  /^docs-internal(?:\/|$)/,
  /^content\/out(?:\/|$)/,
  /^data\/lab-locations\/.*\.json$/,
];
const leaked = files.filter(file => forbidden.some(pattern => pattern.test(file)));

if (leaked.length > 0) {
  console.error(`Unsafe package contents:\n${leaked.map(file => `- ${file}`).join('\n')}`);
  process.exit(1);
}
for (const required of ['package.json', 'src/index.ts', 'vendor/health-analysis-skill/SKILL.md']) {
  if (!files.includes(required)) {
    console.error(`Required package file is missing: ${required}`);
    process.exit(1);
  }
}

console.log(`Package contents verified: ${files.length} files, no secret or generated-output paths.`);
