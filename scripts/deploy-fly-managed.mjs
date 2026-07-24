#!/usr/bin/env node
/**
 * Managed Fly release for the hosted API plus the isolated WGS worker.
 *
 * The WGS Machine deliberately lives outside fly.toml: it has a 40 GB volume
 * in its own region and is started by the durable genetics queue. Running a
 * normal `fly deploy` risks treating that intentionally external volume as
 * config drift. This command deploys every API/wearable Machine. The
 * dispatcher refreshes the stopped WGS Machine to this image before its next
 * queued job starts. A missing WGS Machine is reported as degraded rather
 * than blocking a safe API release: queued WGS jobs must still wait until an
 * operator restores the single-volume worker topology.
 *
 * Dry-run is the default. Pass --execute to make changes.
 */
import { execFileSync } from 'node:child_process';

const args = parseArgs(process.argv.slice(2));
const app = stringArg(args.app, process.env.FLY_APP_NAME ?? 'fb-health-api');
const primaryRegion = stringArg(args['primary-region'], 'fra');
const wgsRegion = stringArg(args['wgs-region'], 'ams');
const imageLabel = stringArg(args['image-label'], `managed-${gitShortSha()}`);
const execute = args.execute === true;

const machines = flyJson(['machines', 'list', '--app', app, '--json']);
const volumes = flyJson(['volumes', 'list', '--app', app, '--json']);
const { apiMachines, wearableMachines, wgs } = validateTopology(machines, volumes);

const image = `registry.fly.io/${app}:${imageLabel}`;
console.log(`Managed Fly release for ${app}`);
console.log(`  API:       ${formatMachines(apiMachines)}`);
console.log(`  wearables: ${formatMachines(wearableMachines)}`);
console.log(`  WGS:       ${wgs.message}`);
console.log(`  image:     ${image}`);

if (!execute) {
  console.log('Dry run only. Re-run with --execute after reviewing the topology.');
  process.exit(0);
}

run('fly', ['deploy', '--app', app, '--build-only', '--push', '--image-label', imageLabel]);
for (const machine of apiMachines) {
  run('fly', ['machine', 'update', machine.id, '--app', app, '--image', image, '--yes']);
}
for (const machine of wearableMachines) {
  const updateArgs = ['machine', 'update', machine.id, '--app', app, '--image', image];
  if (machine.state !== 'started' && machine.state !== 'starting') updateArgs.push('--skip-start');
  updateArgs.push('--yes');
  run('fly', updateArgs);
}

const ready = await fetch(`https://${app}.fly.dev/ready`);
if (!ready.ok || (await ready.json()).ok !== true) throw new Error('Hosted /ready check failed after deployment.');

const after = flyJson(['machines', 'list', '--app', app, '--json']);
for (const machine of [...apiMachines, ...wearableMachines]) {
  const updated = after.find(candidate => candidate.id === machine.id);
  if (!updated?.config?.image?.includes(`:${imageLabel}`)) {
    throw new Error(`Machine ${machine.id} did not receive the requested image.`);
  }
}
if (wgs.machine) {
  console.log('Managed Fly release complete. The AMS WGS Machine will refresh to this image immediately before its next queued genetics job.');
} else {
  console.log('Managed Fly release complete with WGS degraded. Do not requeue WGS analyses until the AMS worker is attached to dbsnp_refs and its ID is configured.');
}

function validateTopology(machines, volumes) {
  const referenceVolumes = volumes.filter(volume => volume.name === 'dbsnp_refs');
  if (referenceVolumes.length !== 1) throw new Error(`Expected exactly one dbsnp_refs volume; found ${referenceVolumes.length}.`);
  const reference = referenceVolumes[0];
  if (reference.region !== wgsRegion) throw new Error(`Expected dbsnp_refs in ${wgsRegion}; found ${reference.region}.`);

  const machineWithReference = machines.filter(machine => machine.config?.mounts?.some(mount => mount.volume === reference.id));
  if (machineWithReference.length > 1) throw new Error(`Expected at most one WGS Machine attached to ${reference.id}; found ${machineWithReference.length}.`);
  const wgsMachine = machineWithReference[0];
  if (wgsMachine && wgsMachine.region !== wgsRegion) throw new Error(`WGS Machine must be in ${wgsRegion}; found ${wgsMachine.region}.`);

  const apiMachines = machines.filter(machine => processGroup(machine) === 'app' && !machine.config?.mounts?.length);
  const wearableMachines = machines.filter(machine => processGroup(machine) === 'worker' && !machine.config?.mounts?.length);
  if (!apiMachines.length || !wearableMachines.length) {
    throw new Error(`Expected at least one app and one wearable worker without mounts (primary region: ${primaryRegion}).`);
  }
  if (!apiMachines.some(machine => machine.region === primaryRegion) || !wearableMachines.some(machine => machine.region === primaryRegion)) {
    throw new Error(`Expected an app and wearable worker in the primary region (${primaryRegion}).`);
  }
  const wgs = wgsMachine
    ? { machine: wgsMachine, message: `${wgsMachine.id} (${wgsRegion}, ${wgsMachine.state})` }
    : { machine: undefined, message: `degraded: ${reference.id} is unattached in ${wgsRegion}` };
  return { apiMachines, wearableMachines, wgs };
}

function formatMachines(machines) {
  return machines.map(machine => `${machine.id} (${machine.region}, ${machine.state})`).join(', ');
}

function processGroup(machine) {
  return machine.config?.metadata?.fly_process_group ?? machine.config?.env?.FLY_PROCESS_GROUP;
}

function flyJson(args) {
  return JSON.parse(run('fly', args, { quiet: true }));
}

function run(command, args, options = {}) {
  if (!options.quiet) console.log(`$ ${command} ${args.join(' ')}`);
  return execFileSync(command, args, { encoding: 'utf8', stdio: options.quiet ? ['ignore', 'pipe', 'inherit'] : 'inherit' });
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const [name, inline] = token.slice(2).split(/=(.*)/s, 2);
    const next = argv[index + 1];
    parsed[name] = inline ?? (!next || next.startsWith('--') ? true : argv[++index]);
  }
  return parsed;
}

function stringArg(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function gitShortSha() {
  return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
}
