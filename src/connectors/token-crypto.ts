import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM at-rest encryption for provider OAuth tokens. The key is supplied
// as a base64-encoded 32-byte value in WHOOP_TOKEN_ENC_KEY. Without a key the
// helper throws, so any code path that would persist a token fails closed rather
// than writing plaintext.

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;

export class TokenCryptoError extends Error {}

export function loadTokenEncryptionKey(env: NodeJS.ProcessEnv = process.env): Buffer | undefined {
  const raw = env.WHOOP_TOKEN_ENC_KEY;
  if (!raw) return undefined;
  const key = Buffer.from(raw, 'base64');
  if (key.byteLength !== KEY_BYTES) {
    throw new TokenCryptoError(`WHOOP_TOKEN_ENC_KEY must decode to ${KEY_BYTES} bytes (got ${key.byteLength}). Generate one with: openssl rand -base64 32`);
  }
  return key;
}

// Serialized as base64(iv).base64(authTag).base64(ciphertext) so a single text
// column can hold the whole envelope.
export function encryptToken(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${ciphertext.toString('base64')}`;
}

export function decryptToken(envelope: string, key: Buffer): string {
  const parts = envelope.split('.');
  if (parts.length !== 3) throw new TokenCryptoError('Malformed encrypted token envelope.');
  const [iv, authTag, ciphertext] = parts.map(part => Buffer.from(part, 'base64'));
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
