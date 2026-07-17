import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createHealthApiServer } from '../src/http.js';
import { loadAuthConfig } from '../src/auth.js';
import { encryptToken } from '../src/connectors/token-crypto.js';
import { HealthApiStore } from '../src/store.js';
import { verifyWhoopSignature, parseWhoopWebhookPayload, whoopResourceType } from '../src/connectors/whoop-webhook.js';

const CLIENT_SECRET = 'fb_first_party_secret';
const ENC_KEY = randomBytes(32).toString('base64');

const authConfig = loadAuthConfig({
  NODE_ENV: 'test',
  AUTH_MODE: 'disabled',
  WHOOP_CLIENT_ID: 'fb_first_party_client',
  WHOOP_CLIENT_SECRET: CLIENT_SECRET,
  WHOOP_REDIRECT_URI: 'https://api.foreverbetter.xyz/dashboard',
});

const store = new HealthApiStore();
const server = createHealthApiServer(store, { auth: authConfig });
let baseUrl = '';

before(async () => {
  await new Promise<void>(resolve => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

function signedRequest(body: string, timestamp = String(Date.now())): { headers: Record<string, string>; body: string } {
  const signature = createHmac('sha256', CLIENT_SECRET).update(timestamp).update(Buffer.from(body, 'utf8')).digest('base64');
  return {
    headers: {
      'content-type': 'application/json',
      'x-whoop-signature': signature,
      'x-whoop-signature-timestamp': timestamp,
    },
    body,
  };
}

test('verifyWhoopSignature accepts a correct signature and rejects tampering', () => {
  const body = Buffer.from(JSON.stringify({ user_id: 1, id: 2, type: 'sleep.updated' }));
  const timestamp = String(Date.now());
  const signature = createHmac('sha256', CLIENT_SECRET).update(timestamp).update(body).digest('base64');
  assert.equal(verifyWhoopSignature({ rawBody: body, signature, timestamp, clientSecret: CLIENT_SECRET }), true);
  assert.equal(verifyWhoopSignature({ rawBody: body, signature, timestamp: String(Number(timestamp) + 1), clientSecret: CLIENT_SECRET }), false);
  assert.equal(verifyWhoopSignature({ rawBody: Buffer.from('tampered'), signature, timestamp, clientSecret: CLIENT_SECRET }), false);
});

test('verifyWhoopSignature rejects stale timestamps', () => {
  const body = Buffer.from('{}');
  const stale = String(Date.now() - 10 * 60 * 1000);
  const signature = createHmac('sha256', CLIENT_SECRET).update(stale).update(body).digest('base64');
  assert.equal(verifyWhoopSignature({ rawBody: body, signature, timestamp: stale, clientSecret: CLIENT_SECRET }), false);
});

test('parseWhoopWebhookPayload and whoopResourceType map event families', () => {
  const payload = parseWhoopWebhookPayload(Buffer.from(JSON.stringify({ user_id: 7, id: 'uuid', type: 'workout.updated', trace_id: 't' })));
  assert.equal(payload?.type, 'workout.updated');
  assert.equal(whoopResourceType('workout.updated'), 'workout');
  assert.equal(whoopResourceType('recovery.deleted'), 'recovery');
  assert.equal(whoopResourceType('user.updated'), undefined);
});

test('rejects a webhook with an invalid signature', async () => {
  const res = await fetch(`${baseUrl}/connections/whoop/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-whoop-signature': 'bad', 'x-whoop-signature-timestamp': String(Date.now()) },
    body: JSON.stringify({ user_id: 1, id: 2, type: 'sleep.updated' }),
  });
  assert.equal(res.status, 401);
});

test('acknowledges an unhandled event type with 204', async () => {
  const req = signedRequest(JSON.stringify({ user_id: 1, id: 2, type: 'user.updated' }));
  const res = await fetch(`${baseUrl}/connections/whoop/webhook`, { method: 'POST', headers: req.headers, body: req.body });
  assert.equal(res.status, 204);
});

test('ignores a webhook for an unknown WHOOP user', async () => {
  const req = signedRequest(JSON.stringify({ user_id: 999999, id: 2, type: 'sleep.updated' }));
  const res = await fetch(`${baseUrl}/connections/whoop/webhook`, { method: 'POST', headers: req.headers, body: req.body });
  assert.equal(res.status, 202);
  assert.equal((await res.json()).status, 'ignored');
});

test('queues a sync job for a known WHOOP connection', async () => {
  const key = Buffer.from(ENC_KEY, 'base64');
  const account = await store.upsertExternalAccount({
    id: 'acct_test',
    user_id: 'user_1',
    organization_id: 'org_1',
    provider: 'wearables',
    external_user_id: 'user_1',
    status: 'active',
    metadata: { source_provider: 'whoop', whoop_user_id: '424242', webhook_sync_enabled: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  await store.saveProviderToken({
    id: 'ptok_test',
    external_account_id: account.id,
    user_id: 'user_1',
    organization_id: 'org_1',
    provider: 'whoop',
    provider_external_user_id: '424242',
    refresh_token_encrypted: encryptToken('refresh-abc', key),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const req = signedRequest(JSON.stringify({ user_id: 424242, id: 'sleep-uuid', type: 'sleep.updated', trace_id: 'tr-1' }));
  const res = await fetch(`${baseUrl}/connections/whoop/webhook`, { method: 'POST', headers: req.headers, body: req.body });
  assert.equal(res.status, 202);
  const body = await res.json();
  assert.equal(body.status, 'queued');
  assert.ok(body.job_id.startsWith('wjob_'));

  const job = await store.getConnectorSyncJob(body.job_id);
  assert.equal(job?.provider, 'whoop');
  assert.equal((job?.request as any).webhook_resource_type, 'sleep');
  assert.equal((job?.request as any).provider_user_id, '424242');
});
