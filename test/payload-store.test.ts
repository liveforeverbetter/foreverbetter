import assert from 'node:assert/strict';
import { test } from 'node:test';
import { S3PayloadStore } from '../src/connectors/payload-store.js';

test('creates an object-scoped signed PUT contract for direct genetics uploads', async () => {
  const store = new S3PayloadStore({
    S3_BUCKET: 'private-health-payloads',
    S3_ENDPOINT: 'https://storage.example.test',
    S3_REGION: 'auto',
    S3_ACCESS_KEY_ID: 'test-access-key',
    S3_SECRET_ACCESS_KEY: 'test-secret-key',
    GENETICS_UPLOAD_URL_TTL_SECONDS: '900',
  });

  const upload = await store.createSignedPayloadUpload('org/user/src/genome.vcf.gz', 'application/gzip');

  assert.equal(upload.method, 'PUT');
  assert.equal(upload.headers['content-type'], 'application/gzip');
  assert.equal(upload.expires_in_seconds, 900);
  assert.equal(upload.bucket_name, 'private-health-payloads');
  assert.equal(upload.object_key, 'org/user/src/genome.vcf.gz');
  assert.match(upload.upload_url, /X-Amz-Signature=/);
  assert.match(upload.upload_url, /X-Amz-Expires=900/);
});
