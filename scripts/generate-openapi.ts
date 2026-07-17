import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { openApiDocument } from '../src/schemas.js';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const destination = resolve(repositoryRoot, 'docs', 'openapi.json');
const baseUrl = process.env.PUBLIC_BASE_URL?.trim() || 'https://api.foreverbetter.xyz';

mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, `${JSON.stringify(openApiDocument(baseUrl), null, 2)}\n`, 'utf8');

console.log(`Generated ${destination}`);
