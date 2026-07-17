/**
 * Tests for the modality-optional orchestrator and unified input doctor.
 *
 * Run: npx tsx --test scripts/pipeline/health_analysis.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

import { runHealthAnalysis, saveHealthAnalysisOutput, summarizeRunForConsole } from './health_analysis.js';
import { runInputDoctor, renderDoctorReport } from './input_doctor.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PIPELINE_INDEX = path.resolve(SCRIPT_DIR, 'index.ts');

function makeTempDir(label: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `foreverbetter-${label}-`));
}

function writeFixture(dir: string, name: string, contents: string): string {
  const p = path.join(dir, name);
  fs.writeFileSync(p, contents, 'utf8');
  return p;
}

describe('runHealthAnalysis — modality optionality', () => {
  it('runs without genetics and still produces a canonical plan', async () => {
    const tmp = makeTempDir('orchestrator');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit,collected_at\nApoB,125,mg/dL,2026-05-01\nVitamin D,22,ng/mL,2026-05-01\n');
      const wearables = writeFixture(tmp, 'wear.csv', 'date,sleep_duration,steps\n2026-05-01,5.5,3500\n2026-05-02,6,3800\n');
      const result = await runHealthAnalysis({
        user_id: 'test_user',
        biomarkersPath: biomarkers,
        wearablesPath: wearables,
        generated_at: '2026-06-21T12:00:00.000Z',
      });
      assert.strictEqual(result.user_id, 'test_user');
      assert.deepStrictEqual(result.modalities_supplied.sort(), ['biomarkers', 'wearables']);
      assert.ok(result.modalities_with_observations.includes('biomarkers'));
      assert.ok(result.modalities_with_observations.includes('wearables'));
      assert.ok(!result.genomic_output, 'genomic_output must be undefined when genetics is absent');
      assert.ok(result.plan.priorities.length >= 1, 'should produce at least one priority');
      assert.ok(result.plan.coverage.find(c => c.modality === 'genetics')?.status === 'not_provided');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('runs with biomarkers only', async () => {
    const tmp = makeTempDir('bio-only');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit\nHbA1c,5.9,%\n');
      const result = await runHealthAnalysis({
        user_id: 'bio_only',
        biomarkersPath: biomarkers,
        generated_at: '2026-06-21T12:00:00.000Z',
      });
      assert.deepStrictEqual(result.modalities_supplied, ['biomarkers']);
      assert.ok(result.plan.priorities.some(p => p.intervention_id === 'metabolic.glucose_retest_and_lifestyle'));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('runs with wearables only', async () => {
    const tmp = makeTempDir('wear-only');
    try {
      const wearables = writeFixture(tmp, 'wear.csv', 'date,sleep_duration\n2026-05-01,5\n2026-05-02,5.5\n');
      const result = await runHealthAnalysis({
        user_id: 'wear_only',
        wearablesPath: wearables,
        generated_at: '2026-06-21T12:00:00.000Z',
      });
      assert.deepStrictEqual(result.modalities_supplied, ['wearables']);
      assert.ok(result.plan.priorities.some(p => p.source_modalities.includes('wearables')));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('persists action plan + analysis summary to disk', async () => {
    const tmp = makeTempDir('persist');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit\nApoB,125,mg/dL\n');
      const result = await runHealthAnalysis({
        user_id: 'persist_user',
        biomarkersPath: biomarkers,
        generated_at: '2026-06-21T12:00:00.000Z',
      });
      const saved = saveHealthAnalysisOutput(result, { outputDir: tmp });
      assert.ok(fs.existsSync(saved.plan_path));
      assert.ok(fs.existsSync(saved.analysis_path));
      const plan = JSON.parse(fs.readFileSync(saved.plan_path, 'utf8'));
      assert.strictEqual(plan.generated_at, '2026-06-21T12:00:00.000Z');
      assert.ok(Array.isArray(plan.priorities));
      const analysis = JSON.parse(fs.readFileSync(saved.analysis_path, 'utf8'));
      assert.strictEqual(analysis.user_id, 'persist_user');
      assert.strictEqual(analysis.observation_count, result.observations.length);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('summary text reflects supplied modalities and priority count', async () => {
    const tmp = makeTempDir('summary');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit\nApoB,125,mg/dL\n');
      const result = await runHealthAnalysis({
        user_id: 'summary_user',
        biomarkersPath: biomarkers,
        generated_at: '2026-06-21T12:00:00.000Z',
      });
      const summary = summarizeRunForConsole(result);
      assert.match(summary, /Analyzed:.*blood test/);
      assert.match(summary, /Created:/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('runInputDoctor', () => {
  it('flags a missing file as an error', () => {
    const report = runInputDoctor({ biomarkersPath: '/definitely/does/not/exist.csv' });
    assert.strictEqual(report.any_error, true);
    assert.ok(report.modalities[0]?.issues.some(i => i.severity === 'error'));
  });

  it('parses a good biomarker file and returns ok', () => {
    const tmp = makeTempDir('doctor-ok');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit,collected_at\nApoB,118,mg/dL,2026-05-01\nHbA1c,5.5,%,2026-05-01\n');
      const report = runInputDoctor({ biomarkersPath: biomarkers });
      assert.strictEqual(report.any_error, false);
      const result = report.modalities[0];
      assert.strictEqual(result?.ok, true);
      assert.strictEqual(result?.row_count, 2);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('warns when no inputs are supplied to the doctor', () => {
    const report = runInputDoctor({});
    assert.strictEqual(report.modalities[0]?.issues[0]?.severity, 'info');
  });

  it('renders a human-readable report containing each result section', () => {
    const tmp = makeTempDir('doctor-render');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit\nApoB,118,mg/dL\n');
      const report = runInputDoctor({ biomarkersPath: biomarkers });
      const text = renderDoctorReport(report);
      assert.match(text, /Input doctor/);
      assert.match(text, /biomarkers/);
      assert.match(text, /Result: OK/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('CLI cutover (positional args rejected)', () => {
  it('rejects a positional argument with exit code 2 and a fix hint', () => {
    const proc = spawnSync('npx', ['tsx', PIPELINE_INDEX, 'some/file.vcf'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.strictEqual(proc.status, 2, `expected exit 2 for positional args, got ${proc.status}\nstderr: ${proc.stderr}`);
    assert.match(proc.stderr, /Positional arguments are no longer supported/);
    assert.match(proc.stderr, /--genetics=/);
    assert.match(proc.stderr, /--biomarkers=/);
  });

  it('rejects an unknown flag with exit code 2', () => {
    const proc = spawnSync('npx', ['tsx', PIPELINE_INDEX, '--unknown-flag=value'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.strictEqual(proc.status, 2, `expected exit 2 for unknown flag, got ${proc.status}\nstderr: ${proc.stderr}`);
    assert.match(proc.stderr, /Unknown flag/);
  });

  it('shows help when no arguments are supplied', () => {
    const proc = spawnSync('npx', ['tsx', PIPELINE_INDEX], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.strictEqual(proc.status, 0);
    assert.match(proc.stdout, /Usage:/);
    assert.match(proc.stdout, /--genetics=/);
  });

  it('exits non-zero when no modality flag is supplied', () => {
    const proc = spawnSync('npx', ['tsx', PIPELINE_INDEX, '--user=demo'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    assert.strictEqual(proc.status, 2);
    assert.match(proc.stderr, /No modality supplied/);
  });

  it('runs --doctor against a real biomarker file and exits 0', () => {
    const tmp = makeTempDir('cli-doctor');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit,collected_at\nApoB,118,mg/dL,2026-05-01\nHbA1c,5.5,%,2026-05-01\n');
      const proc = spawnSync('npx', ['tsx', PIPELINE_INDEX, '--doctor', `--biomarkers=${biomarkers}`, `--out=${tmp}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      assert.strictEqual(proc.status, 0, `expected exit 0, stderr: ${proc.stderr}`);
      assert.match(proc.stdout, /Result: OK/);
      assert.ok(fs.existsSync(path.join(tmp, 'user_001_input_doctor.json')));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('produces a canonical action plan and HTML dashboard when run with biomarkers only (no genetics)', () => {
    const tmp = makeTempDir('cli-bio');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit,collected_at\nApoB,125,mg/dL,2026-05-01\nHbA1c,5.9,%,2026-05-01\n');
      const proc = spawnSync('npx', ['tsx', PIPELINE_INDEX, `--biomarkers=${biomarkers}`, '--user=demo', `--out=${tmp}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      assert.strictEqual(proc.status, 0, `expected exit 0, stderr: ${proc.stderr}`);
      assert.doesNotMatch(proc.stdout, /Dashboard opened/, 'pipeline runs must not open generated dashboards automatically');
      const planPath = path.join(tmp, 'demo_action_plan.json');
      assert.ok(fs.existsSync(planPath), `expected ${planPath} to exist`);
      const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
      assert.ok(Array.isArray(plan.priorities));
      assert.ok(plan.priorities.length >= 1);
      const htmlPath = path.join(tmp, 'index.html');
      assert.ok(fs.existsSync(htmlPath), 'M4 dashboard HTML should render even without genetics');
      const html = fs.readFileSync(htmlPath, 'utf8');
      // index.html is the chosen per-design layout; it renders the canonical plan.
      assert.match(html, /data-design=/);
      assert.match(html, new RegExp(plan.priorities[0].title.split(/\s+/).slice(0, 3).join('\\s+')));
      // The full genomic deep-dive view is preserved with the canonical coverage markup.
      const deep = fs.readFileSync(path.join(tmp, 'deep-dive.html'), 'utf8');
      assert.match(deep, /plan-coverage/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('renders the canonical plan with biomarkers + wearables (no genetics) and includes coverage + safety markup', () => {
    const tmp = makeTempDir('cli-bw');
    try {
      const biomarkers = writeFixture(tmp, 'bio.csv', 'marker,value,unit,collected_at\nhs-CRP,4.2,mg/L,2026-05-01\n');
      const wearables = writeFixture(tmp, 'wear.csv', 'date,sleep_duration,hrv\n2026-05-01,5.5,22\n2026-05-02,5.8,24\n');
      const proc = spawnSync('npx', ['tsx', PIPELINE_INDEX, `--biomarkers=${biomarkers}`, `--wearables=${wearables}`, '--user=demo', `--out=${tmp}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      assert.strictEqual(proc.status, 0, `expected exit 0, stderr: ${proc.stderr}`);
      const htmlPath = path.join(tmp, 'index.html');
      assert.ok(fs.existsSync(htmlPath));
      const html = fs.readFileSync(htmlPath, 'utf8');
      // index.html is the chosen per-design layout.
      assert.match(html, /data-design=/);
      // Deep-dive view preserves the full canonical coverage + safety markup.
      const deep = fs.readFileSync(path.join(tmp, 'deep-dive.html'), 'utf8');
      assert.match(deep, /plan-coverage/);
      assert.match(deep, /proc-safety/);
      assert.match(deep, /proc-mod-chip/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
