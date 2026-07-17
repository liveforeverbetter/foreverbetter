import assert from 'node:assert/strict';
import test from 'node:test';
import { emailDriver, validateEmailConfig } from '../src/connectors/email.js';
import { validateWebhookDeliveryConfig } from '../src/core/webhook-emit.js';
import { databaseSsl } from '../src/db/pool.js';
import { loadAuthConfig } from '../src/auth.js';

test('production email delivery defaults off and rejects console codes', () => {
  assert.equal(emailDriver({ NODE_ENV: 'production' }), 'none');
  assert.throws(
    () => validateEmailConfig({ NODE_ENV: 'production', EMAIL_DRIVER: 'console' }),
    /not allowed in production/,
  );
  assert.doesNotThrow(() => validateEmailConfig({ NODE_ENV: 'development', EMAIL_DRIVER: 'console' }));
});

test('database SSL require verifies certificates and supports a private CA', () => {
  assert.deepEqual(databaseSsl({ DATABASE_SSL: 'require' }), { rejectUnauthorized: true });
  assert.deepEqual(databaseSsl({
    DATABASE_SSL: 'require',
    DATABASE_SSL_CA: 'line one\\nline two',
  }), {
    rejectUnauthorized: true,
    ca: 'line one\nline two',
  });
  assert.throws(
    () => databaseSsl({ NODE_ENV: 'production', DATABASE_SSL: 'no-verify' }),
    /not allowed in production/,
  );
});

test('production webhook delivery requires HTTPS and a signing secret', () => {
  assert.throws(
    () => validateWebhookDeliveryConfig({
      NODE_ENV: 'production',
      HEALTH_API_WEBHOOK_URL: 'http://hooks.example.test/events',
      HEALTH_API_WEBHOOK_SECRET: 'x'.repeat(32),
    }),
    /must use HTTPS/,
  );
  assert.throws(
    () => validateWebhookDeliveryConfig({
      NODE_ENV: 'production',
      HEALTH_API_WEBHOOK_URL: 'https://hooks.example.test/events',
      HEALTH_API_WEBHOOK_SECRET: 'too-short',
    }),
    /at least 32 characters/,
  );
  assert.doesNotThrow(() => validateWebhookDeliveryConfig({
    NODE_ENV: 'production',
    HEALTH_API_WEBHOOK_URL: 'https://hooks.example.test/events',
    HEALTH_API_WEBHOOK_SECRET: 'x'.repeat(32),
  }));
});

test('production auth rejects placeholder and short signing material', () => {
  const base = {
    NODE_ENV: 'production',
    AUTH_MODE: 'service_account',
    AUTH_AUDIENCE: 'health-api',
    AUDIT_IP_HASH_SALT: 'a'.repeat(32),
  };
  assert.throws(
    () => loadAuthConfig({
      ...base,
      SERVICE_ACCOUNT_JWT_SECRET: 'change-me-generate-with-openssl-rand-hex-32',
    }),
    /SERVICE_ACCOUNT_JWT_SECRET must be a unique secret/,
  );
  assert.throws(
    () => loadAuthConfig({
      ...base,
      SERVICE_ACCOUNT_JWT_SECRET: 's'.repeat(32),
      API_KEY_JWT_SECRET: 'too-short',
    }),
    /API_KEY_JWT_SECRET must be a unique secret/,
  );
  assert.throws(
    () => loadAuthConfig({
      ...base,
      SERVICE_ACCOUNT_JWT_SECRET: 's'.repeat(32),
      AUDIT_IP_HASH_SALT: undefined,
    }),
    /AUDIT_IP_HASH_SALT must be a unique secret/,
  );
  assert.doesNotThrow(() => loadAuthConfig({
    ...base,
    SERVICE_ACCOUNT_JWT_SECRET: 's'.repeat(32),
    API_KEY_JWT_SECRET: 'k'.repeat(32),
  }));
});
