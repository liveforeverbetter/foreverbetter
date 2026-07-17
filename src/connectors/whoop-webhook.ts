import { createHmac, timingSafeEqual } from 'node:crypto';

// WHOOP webhook signature validation. WHOOP signs each delivery with the app
// client secret: base64(HMAC-SHA256(timestamp + rawBody, clientSecret)). See
// https://developer.whoop.com/docs/developing/webhooks/#webhooks-security
//
// The raw request body must be validated byte-for-byte, so callers pass the
// exact bytes received rather than a re-serialized object.

export const WHOOP_SIGNATURE_HEADER = 'x-whoop-signature';
export const WHOOP_SIGNATURE_TIMESTAMP_HEADER = 'x-whoop-signature-timestamp';

// Reject deliveries whose timestamp is too far from now to blunt replay attacks.
const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000;

export interface WhoopSignatureInput {
  rawBody: Buffer;
  signature?: string;
  timestamp?: string;
  clientSecret: string;
  now?: number;
}

export function verifyWhoopSignature(input: WhoopSignatureInput): boolean {
  const { rawBody, signature, timestamp, clientSecret } = input;
  if (!signature || !timestamp || !clientSecret) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = input.now ?? Date.now();
  if (Math.abs(now - ts) > MAX_TIMESTAMP_SKEW_MS) return false;

  const expected = createHmac('sha256', clientSecret)
    .update(timestamp)
    .update(rawBody)
    .digest('base64');

  const provided = Buffer.from(signature, 'utf8');
  const computed = Buffer.from(expected, 'utf8');
  if (provided.byteLength !== computed.byteLength) return false;
  return timingSafeEqual(provided, computed);
}

export interface WhoopWebhookPayload {
  user_id: number | string;
  id: number | string;
  type: string;
  trace_id?: string;
}

export function parseWhoopWebhookPayload(rawBody: Buffer): WhoopWebhookPayload | undefined {
  try {
    const parsed = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
    if (parsed == null || typeof parsed !== 'object') return undefined;
    if (parsed.user_id == null || parsed.type == null) return undefined;
    return {
      user_id: parsed.user_id as number | string,
      id: parsed.id as number | string,
      type: String(parsed.type),
      trace_id: parsed.trace_id == null ? undefined : String(parsed.trace_id),
    };
  } catch {
    return undefined;
  }
}

// Map a WHOOP webhook event type (sleep.updated, workout.deleted, ...) to the
// resource family it concerns.
export function whoopResourceType(eventType: string): string | undefined {
  const [resource] = eventType.split('.');
  return ['sleep', 'workout', 'recovery'].includes(resource) ? resource : undefined;
}
