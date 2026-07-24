import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const generatedRoots = ['apps/api/openapi', 'packages/api-client/src/generated'];
const generatedExtensions = new Set(['.json', '.ts']);

async function collectFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (generatedExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files.sort();
}

async function digestGeneratedFiles() {
  const hash = createHash('sha256');
  for (const root of generatedRoots) {
    for (const file of await collectFiles(root)) {
      hash.update(file);
      hash.update(await readFile(file));
    }
  }
  return hash.digest('hex');
}

const before = await digestGeneratedFiles();
for (const command of [
  ['pnpm', ['openapi:generate']],
  ['pnpm', ['api-client:generate']],
]) {
  const result = spawnSync(command[0], command[1], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
const after = await digestGeneratedFiles();

if (before !== after) {
  throw new Error('Generated OpenAPI/client artifacts are not deterministic.');
}

console.log(`Generated artifacts are deterministic (${after.slice(0, 12)}).`);
