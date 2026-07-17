#!/usr/bin/env node
import { createWriteStream, renameSync, statSync, unlinkSync } from 'node:fs';
import { basename } from 'node:path';
import http from 'node:http';
import https from 'node:https';

const [url, destination] = process.argv.slice(2);
if (!url || !destination) {
  console.error('Usage: node scripts/download-reference-file.mjs <url> <destination>');
  process.exit(2);
}

const partPath = `${destination}.part`;

try {
  unlinkSync(partPath);
} catch {
  // No partial file to clean up.
}

await download(url, partPath, 0);
renameSync(partPath, destination);
const final = statSync(destination);
console.log(JSON.stringify({
  ts: new Date().toISOString(),
  event: 'download_complete',
  file: basename(destination),
  bytes: final.size,
}));

function download(sourceUrl, outputPath, redirects) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) {
      reject(new Error(`Too many redirects while downloading ${sourceUrl}`));
      return;
    }

    const client = sourceUrl.startsWith('https:') ? https : http;
    const request = client.get(sourceUrl, response => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        const nextUrl = new URL(response.headers.location, sourceUrl).toString();
        download(nextUrl, outputPath, redirects + 1).then(resolve, reject);
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new Error(`Download failed with HTTP ${status}: ${sourceUrl}`));
        return;
      }

      const total = Number(response.headers['content-length'] ?? 0);
      let downloaded = 0;
      let lastLog = Date.now();
      const startedAt = Date.now();
      const file = createWriteStream(outputPath);

      response.on('data', chunk => {
        downloaded += chunk.length;
        const now = Date.now();
        if (now - lastLog >= 30_000) {
          lastLog = now;
          const mb = Math.round(downloaded / 1024 / 1024);
          const totalMb = total ? Math.round(total / 1024 / 1024) : undefined;
          const seconds = Math.max((now - startedAt) / 1000, 1);
          const mbps = Math.round((downloaded / 1024 / 1024 / seconds) * 10) / 10;
          console.log(JSON.stringify({
            ts: new Date().toISOString(),
            event: 'download_progress',
            file: basename(destination),
            mb,
            total_mb: totalMb,
            mbps,
          }));
        }
      });

      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
      response.on('error', reject);
    });
    request.on('error', reject);
  });
}
