import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('.', import.meta.url);
const generatedRoot = fileURLToPath(new URL('./generated/', root));

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else {
      files.push(path);
    }
  }

  return files.sort();
}

const files = await listFiles(generatedRoot);
const contents = new Map();
const digest = createHash('sha256');

for (const file of files) {
  const name = relative(generatedRoot, file);
  const content = await readFile(file, 'utf8');
  contents.set(name, content);
  digest.update(name);
  digest.update('\0');
  digest.update(content);
  digest.update('\0');
}

const source = await readFile(new URL('./openapi.yaml', root), 'utf8');
const types = contents.get('types.gen.ts') ?? '';
const sdk = contents.get('sdk.gen.ts') ?? '';
const clientTypes = contents.get('client/types.gen.ts') ?? '';

assert.match(source, /^openapi: 3\.1\.0$/m);
assert.match(source, /in: cookie\n\s+name: __Host-session/);
assert.match(source, /name: X-CSRF-Token/);
assert.match(source, /ETag:/);
assert.match(source, /X-Request-Id:/);

assert.match(sdk, /export const updateTask\b/);
assert.match(sdk, /in: 'cookie'/);
assert.match(sdk, /name: '__Host-session'/);
assert.match(types, /'X-CSRF-Token': string/);
assert.match(types, /description\?: string \| null/);
assert.match(types, /description: string \| null/);
assert.match(types, /projectId\?: string \| null/);
assert.match(types, /400: ValidationProblem/);
assert.match(types, /401: ProblemDetails/);
assert.match(types, /404: ProblemDetails/);
assert.match(types, /412: ProblemDetails/);
assert.match(clientTypes, /extends Omit<RequestInit, 'body' \| 'headers' \| 'method'>/);
assert.match(clientTypes, /response: Response/);

console.log(
  JSON.stringify(
    {
      combinedSha256: digest.digest('hex'),
      fileCount: files.length,
      verified: [
        'OpenAPI 3.1 input',
        'cookie security metadata',
        'required CSRF header',
        'stable operationId-derived SDK name',
        'RFC 9457 base and validation error union',
        'optional and nullable fields',
        'native Fetch credentials configuration surface',
        'native Response header access',
      ],
    },
    null,
    2,
  ),
);
