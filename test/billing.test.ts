import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { hostedIntroductoryUsage, StripeBillingService, stripeBillingConfig, verifyStripeSignature } from '../src/billing.js';
import { isBillingAdmin, loadAuthConfig } from '../src/auth.js';
import { HOSTED_INTRODUCTORY_REQUEST_LIMIT, pricingCatalog } from '../src/pricing.js';

test('publishes a first-value allowance before payment details are requested', () => {
  const pricing = pricingCatalog();
  assert.equal(HOSTED_INTRODUCTORY_REQUEST_LIMIT, 100);
  assert.deepEqual(pricing.hosted_introductory_allowance, {
    requests: 100,
    payment_method_required_after: 100,
    scope: 'per cloud workspace',
    summary: 'Your first 100 protected hosted API requests are free. When you choose to continue, Checkout collects a payment method and the selected subscription begins. Self-hosting is always available without a hosted subscription.',
  });
});

test('makes the 101st hosted request require payment while preserving the first 100', () => {
  assert.deepEqual(hostedIntroductoryUsage(0), { limit: 100, used: 0, remaining: 100, payment_required: false });
  assert.deepEqual(hostedIntroductoryUsage(99), { limit: 100, used: 99, remaining: 1, payment_required: false });
  assert.deepEqual(hostedIntroductoryUsage(100), { limit: 100, used: 100, remaining: 0, payment_required: true });
  assert.deepEqual(hostedIntroductoryUsage(101), { limit: 100, used: 100, remaining: 0, payment_required: true });
});

test('billing admin is a narrow email or user-id entitlement', () => {
  const config = loadAuthConfig({
    NODE_ENV: 'test',
    AUTH_MODE: 'disabled',
    HEALTH_API_BILLING_ADMIN_EMAILS: 'OPERATOR@EXAMPLE.COM',
    HEALTH_API_BILLING_ADMIN_USER_IDS: 'usr_operator',
  });
  const emailAuth = {
    subject: 'session',
    userId: 'usr_email',
    scopes: new Set<string>(),
    claims: { email: 'operator@example.com' },
    mode: 'oidc' as const,
  };
  assert.equal(isBillingAdmin(emailAuth, config), true);
  assert.equal(isBillingAdmin({ ...emailAuth, userId: 'usr_other', claims: { email: 'other@example.com' } }, config), false);
  assert.equal(isBillingAdmin({ ...emailAuth, userId: 'usr_operator', claims: {} }, config), true);
  assert.equal(isBillingAdmin({ ...emailAuth, claims: { billing_admin: true } }, config), true);
});

test('loads hosted Stripe billing only after an explicit billing opt-in and every required value is present', () => {
  assert.equal(stripeBillingConfig({ STRIPE_SECRET_KEY: 'sk_test' }), undefined);
  assert.equal(stripeBillingConfig({
    STRIPE_SECRET_KEY: 'sk_test', STRIPE_WEBHOOK_SECRET: 'whsec_test',
    STRIPE_PRICE_STANDARD: 'price_standard', STRIPE_PRICE_BUILDER: 'price_builder', STRIPE_PRICE_GROWTH: 'price_growth',
  }), undefined);
  const config = stripeBillingConfig({
    BILLING_ENABLED: 'true',
    STRIPE_SECRET_KEY: 'sk_test',
    STRIPE_WEBHOOK_SECRET: 'whsec_test',
    STRIPE_PRICE_STANDARD: 'price_standard',
    STRIPE_PRICE_BUILDER: 'price_builder',
    STRIPE_PRICE_GROWTH: 'price_growth',
  });
  assert.deepEqual(config?.priceIds, {
    standard: 'price_standard',
    builder: 'price_builder',
    growth: 'price_growth',
  });
});

test('Checkout requires a payment method after the introductory allowance', async () => {
  const service = new StripeBillingService({
    secretKey: 'sk_test',
    webhookSecret: 'whsec_test',
    priceIds: { standard: 'price_standard', builder: 'price_builder', growth: 'price_growth' },
    returnUrl: 'https://api.example.com/dashboard',
  });
  let requestPath = '';
  let requestForm: URLSearchParams | undefined;
  (service as any).subscriptionFor = async () => undefined;
  (service as any).createCustomer = async () => 'cus_test';
  (service as any).request = async (path: string, form: URLSearchParams) => {
    requestPath = path;
    requestForm = form;
    return { url: 'https://checkout.stripe.com/c/pay/test' };
  };

  await service.createCheckoutSession({ userId: 'user_1', organizationId: 'org_1', tier: 'standard', activationSource: 'request_limit' });

  assert.equal(requestPath, '/checkout/sessions');
  assert.equal(requestForm?.get('payment_method_collection'), 'always');
  assert.equal(requestForm?.has('subscription_data[trial_period_days]'), false);
  assert.equal(requestForm?.get('metadata[activation_source]'), 'request_limit');
});

test('a restarted cloud subscription has no additional introductory allowance', async () => {
  const service = new StripeBillingService({
    secretKey: 'sk_test',
    webhookSecret: 'whsec_test',
    priceIds: { standard: 'price_standard', builder: 'price_builder', growth: 'price_growth' },
    returnUrl: 'https://api.example.com/dashboard',
  });
  let requestForm: URLSearchParams | undefined;
  (service as any).subscriptionFor = async () => ({
    user_id: 'user_1', organization_id: 'org_1', tier: 'standard', status: 'canceled',
    stripe_customer_id: 'cus_test', stripe_subscription_id: 'sub_previous', stripe_price_id: 'price_standard', cancel_at_period_end: false,
  });
  (service as any).request = async (_path: string, form: URLSearchParams) => {
    requestForm = form;
    return { url: 'https://checkout.stripe.com/c/pay/test' };
  };

  await service.createCheckoutSession({ userId: 'user_1', organizationId: 'org_1', tier: 'standard', activationSource: 'biomarkers' });

  assert.equal(requestForm?.get('payment_method_collection'), 'always');
  assert.equal(requestForm?.has('subscription_data[trial_period_days]'), false);
});

test('accepts an authentic Stripe signature and rejects a tampered payload', () => {
  const body = Buffer.from('{"id":"evt_test"}');
  const secret = 'whsec_test';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body.toString('utf8')}`).digest('hex');
  assert.equal(verifyStripeSignature(body, `t=${timestamp},v1=wrong,v1=${signature}`, secret), true);
  assert.equal(verifyStripeSignature(Buffer.from('{"id":"changed"}'), `t=${timestamp},v1=${signature}`, secret), false);
});
