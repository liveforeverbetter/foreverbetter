import { randomBytes } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export interface TraceContext {
  trace_id: string;
  span_id: string;
  traceparent: string;
}

const contexts = new WeakMap<IncomingMessage, TraceContext>();
const TRACEPARENT_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;

export function traceContext(req: IncomingMessage): TraceContext {
  const existing = contexts.get(req);
  if (existing) return existing;
  const parent = traceparentHeader(req);
  const match = parent?.match(TRACEPARENT_PATTERN);
  const traceId = match?.[1]?.toLowerCase() ?? randomHex(16);
  const flags = match?.[3]?.toLowerCase() ?? '01';
  const spanId = randomHex(8);
  const context = {
    trace_id: traceId,
    span_id: spanId,
    traceparent: `00-${traceId}-${spanId}-${flags}`,
  };
  contexts.set(req, context);
  return context;
}

function traceparentHeader(req: IncomingMessage): string | undefined {
  const raw = req.headers.traceparent;
  return Array.isArray(raw) ? raw[0] : raw;
}

function randomHex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}
