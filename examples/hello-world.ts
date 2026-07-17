const baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:8787';
const token = process.env.HEALTH_API_TOKEN ?? 'dev-token';
const userId = process.env.HEALTH_API_USER_ID ?? 'sandbox-user';
const organizationId = process.env.HEALTH_API_ORG_ID ?? 'sandbox-org';

type Json = Record<string, unknown>;

async function main() {
  const ready = await get('/ready');
  console.log('ready', { ok: ready.ok, auth_mode: ready.auth_mode, storage: ready.storage });

  const imported = await post('/imports/file', {
    user_id: userId,
    organization_id: organizationId,
    category: 'biomarkers',
    filename: 'labs.csv',
    content_type: 'text/csv',
    text: 'marker,value,unit\nApoB,118,mg/dL\nHbA1c,5.7,%\nFasting Insulin,12,uIU/mL\nGlucose,96,mg/dL\n',
  }, 'hello-world-ts-import');

  const sourceId = (imported.source as Json).id as string;
  console.log('source_id', sourceId);

  const analysis = await post('/analyses', {
    user_id: userId,
    organization_id: organizationId,
    source_ids: [sourceId],
    profile: { age: 42, sex: 'male' },
  }, 'hello-world-ts-analysis');

  const analysisId = analysis.id as string;
  console.log('analysis_id', analysisId);
  console.log('cards', ((analysis.dashboard_spec as Json).cards as unknown[]).length);

  const query = await post('/query', {
    user_id: userId,
    organization_id: organizationId,
    analysis_ids: [analysisId],
    query: 'ApoB',
  });
  console.log('query', { answer: query.answer, matches: (query.matches as unknown[]).length });

  const mcpTools = await post('/mcp', {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {},
  });
  console.log('mcp_tools', ((mcpTools.result as Json).tools as Json[]).map(tool => tool.name));
}

async function get(path: string): Promise<Json> {
  return request(path, { method: 'GET' });
}

async function post(path: string, body: unknown, idempotencyKey?: string): Promise<Json> {
  return request(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function request(path: string, init: RequestInit): Promise<Json> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${text}`);
  return text ? JSON.parse(text) as Json : {};
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
