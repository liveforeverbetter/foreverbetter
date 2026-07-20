import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const MERIDIAN_ROOT = join(process.cwd(), 'public', 'design-systems', 'meridian');
const DESIGN_SPECIFICATIONS_ROOT = join(process.cwd(), 'public', 'design-system-specs');
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/liveforeverbetter/foreverbetter/main/public/design-system-specs';

export async function getDesignImplementation(id: string, baseUrl: string) {
  if (id === 'aperture') {
    const zipUrl = `${GITHUB_RAW_BASE}/aperture-handoff.zip`;
    const meta = await loadDesignMeta('aperture');
    return {
      schema_version: '1.0',
      id: 'aperture',
      name: 'Aperture design-system handoff',
      description: 'The complete Aperture component, token, template, and UI-kit specification. Download the full ZIP from the supplied URL.',
      format: 'design_system_handoff',
      download: { url: zipUrl, format: 'zip', size_bytes: await zipSize('aperture') },
      ...meta,
    };
  }

  if (id === 'meridian') {
    const zipUrl = `${GITHUB_RAW_BASE}/meridian-handoff.zip`;
    const meta = await loadDesignMeta('meridian');
    const sourceBase = `${baseUrl.replace(/\/$/, '')}/dashboard`;
    return {
      schema_version: '1.0',
      id: 'meridian',
      name: 'Meridian design-system handoff + wearable dashboard',
      description: 'The complete Meridian component, token, template, and UI-kit specification. Download the full ZIP from the supplied URL. Also includes the production dashboard source.',
      format: 'design_system_handoff',
      download: { url: zipUrl, format: 'zip', size_bytes: await zipSize('meridian') },
      ...meta,
      production_dashboard: {
        entrypoint: 'dashboard/index.html',
        framework: 'vanilla_html_css_javascript',
        components: [
          component('app_shell', '#app-shell', 'Authenticated dashboard shell and route container.'),
          component('auth_shell', '#auth-shell', 'Agent-first sign-in and workspace-key handoff.'),
          component('healthspan_readiness', '.meridian-readiness-card', 'Connection-backed health-context readiness orb; it never invents health values.'),
          component('whoop_provider_card', '.meridian-whoop-card', 'WHOOP OAuth connection CTA plus recovery, strain, and sleep visual channels.'),
          component('source_status_card', '.source-card', 'Provider status card populated from persisted connections.'),
          component('agent_context', '.agent-context-card', 'MCP-ready health context and available agent tools.'),
        ],
        data_bindings: [
          { component: 'healthspan_readiness', endpoint: 'GET /connections/wearables/status', fields: ['connections[].source_provider', 'connections[].status', 'connections[].last_synced_at'], behaviour: 'app.js computes readiness from real connected providers.' },
          { component: 'whoop_provider_card', endpoint: 'POST /connections/wearables/start', fields: ['authorization_url'], behaviour: 'app.js starts first-party WHOOP OAuth and redirects the browser.' },
          { component: 'source_status_card', endpoint: 'GET /connections/wearables/status', fields: ['connections[].webhook_sync_enabled', 'connections[].server_sync_enabled'], behaviour: 'app.js renders connected and automatic-update state.' },
          { component: 'agent_context', endpoint: 'GET /dashboard-specs/{analysis_id}', fields: ['cards', 'sections', 'coverage', 'quality', 'provenance'], behaviour: 'Use this data contract for a personalized analysis dashboard.' },
        ],
        files: [
          designFile('dashboard/index.html', 'text/html; charset=utf-8', await readFile(join(MERIDIAN_ROOT, 'index.html'), 'utf8')),
          designFile('dashboard/styles.css', 'text/css; charset=utf-8', await readFile(join(MERIDIAN_ROOT, 'styles.css'), 'utf8')),
          designFile('dashboard/app.js', 'application/javascript; charset=utf-8', await readFile(join(MERIDIAN_ROOT, 'app.js'), 'utf8')),
        ],
        binary_assets: [
          { path: 'dashboard/favicon.svg', media_type: 'image/svg+xml', url: `${sourceBase}/favicon.svg` },
          { path: 'dashboard/assets/tablet-dashboard.png', media_type: 'image/png', url: `${sourceBase}/assets/tablet-dashboard.png` },
        ],
        install: {
          instruction: 'Write files exactly at the supplied paths, download binary_assets to their listed paths, and serve the dashboard directory at /dashboard on the same wellnizz API origin.',
          required_routes: ['/auth/otp/start', '/auth/otp/verify', '/api-keys', '/capabilities', '/connections/wearables/start', '/connections/wearables/status', '/connections/wearables/callback', '/dashboard-specs/{analysis_id}'],
        },
      },
    };
  }

  if (id === 'foreverbetter') {
    return {
      schema_version: '1.0',
      id: 'foreverbetter',
      name: 'wellnizz Healthspan Dossier — house design system',
      description: 'The house design system for wellnizz. Code-defined from the live API (GET /design/systems/foreverbetter).',
      format: 'code_defined',
      entrypoint: '/design/systems/foreverbetter',
      components: [
        component('gli_dial', '.gli-dial', 'Genomic Longevity Index semicircular dial.'),
        component('modality_chip', '.modality-chip', 'Data-provenance pill.'),
        component('superpower_card', '.superpower-card', 'Green-left-border genetic superpower.'),
        component('primary_button', '.primary-btn[data-variant="editorial"]', 'Coral editorial CTA.'),
        component('biomarker_row', '.biomarker-row', 'Biomarker panel row with status pill.'),
        component('section_header', '.dossier-header', 'Editorial section header.'),
        component('action_item', '.action-item', 'Evidence-graded intervention item.'),
      ],
    };
  }

  return undefined;
}

async function loadDesignMeta(id: string) {
  const root = join(DESIGN_SPECIFICATIONS_ROOT, id);
  try {
    const manifestRaw = await readFile(join(root, '_ds_manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw) as Record<string, unknown>;
    return {
      components: manifestArray(manifest, 'components'),
      templates: manifestArray(manifest, 'templates'),
      starting_points: manifestArray(manifest, 'startingPoints'),
    };
  } catch {
    return { components: [], templates: [], starting_points: [] };
  }
}

async function zipSize(id: string): Promise<number> {
  try {
    const s = await stat(join(DESIGN_SPECIFICATIONS_ROOT, `${id}-handoff.zip`));
    return s.size;
  } catch { return 0; }
}

function manifestArray(manifest: Record<string, unknown>, key: string): unknown[] {
  const value = manifest[key];
  return Array.isArray(value) ? value : [];
}

function designFile(path: string, mediaType: string, contents: string) {
  return { path, media_type: mediaType, contents, sha256: createHash('sha256').update(contents).digest('hex') };
}

function component(type: string, selector: string, description: string) {
  return { type, selector, description };
}
