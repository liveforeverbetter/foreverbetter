/**
 * Local OAuth2 Callback Server
 *
 * Spins up a temporary HTTP server on localhost:PORT to receive the OAuth2
 * redirect after the user authorizes in the browser. Shuts itself down once
 * the code is received.
 */

import * as http from 'http';
import * as url from 'url';

export const CALLBACK_PORT = 8788;
export const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/callback`;

export interface OAuthCallbackResult {
  code: string;
  state?: string;
}

/**
 * Returns a Promise that resolves with { code, state } when the browser
 * redirects to localhost after the user authorizes.
 *
 * The server times out after `timeoutMs` (default 5 min).
 */
export function waitForCallback(expectedState?: string, timeoutMs = 5 * 60 * 1000): Promise<OAuthCallbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url ?? '', true);
      if (parsed.pathname !== '/callback') {
        res.writeHead(404); res.end('Not found'); return;
      }

      const code = parsed.query['code'] as string | undefined;
      const state = parsed.query['state'] as string | undefined;
      const error = parsed.query['error'] as string | undefined;

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<html><body><h2>Authorization failed: ${error}</h2><p>You can close this tab.</p></body></html>`);
        server.close();
        reject(new Error(`OAuth authorization failed: ${error}`));
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<html><body><h2>Missing code parameter.</h2></body></html>`);
        server.close();
        reject(new Error('No authorization code received'));
        return;
      }

      if (expectedState && state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<html><body><h2>State mismatch — possible CSRF.</h2></body></html>`);
        server.close();
        reject(new Error('OAuth state mismatch'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html><body style="font-family:sans-serif;padding:40px;max-width:500px;margin:auto">
          <h2>✅ Connected successfully</h2>
          <p>You can close this browser tab and return to your terminal.</p>
        </body></html>
      `);
      server.close();
      resolve({ code, state });
    });

    server.listen(CALLBACK_PORT, 'localhost', () => {
      // Server is ready
    });

    server.on('error', (err) => {
      reject(new Error(`OAuth callback server error: ${err.message}`));
    });

    setTimeout(() => {
      server.close();
      reject(new Error('OAuth authorization timed out after 5 minutes'));
    }, timeoutMs);
  });
}

/** Generate a random state string for CSRF protection */
export function generateState(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}
