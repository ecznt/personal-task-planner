import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const trackedFiles = spawnSync('git', ['ls-files', '-co', '--exclude-standard'], {
  encoding: 'utf8',
});
if (trackedFiles.status !== 0) {
  throw new Error(trackedFiles.stderr);
}

const excluded = new Set([
  'scripts/scan-secrets.mjs',
  'docs/planning/READINESS_REPORT.md',
  'graphify-out/GRAPH_REPORT.md',
  'graphify-out/graph.html',
  'graphify-out/graph.json',
]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bghp_[A-Za-z0-9]{36}\b/,
  /\bsk_live_[A-Za-z0-9]{16,}\b/,
];
const findings = [];

for (const file of trackedFiles.stdout.split('\n').filter(Boolean)) {
  if (excluded.has(file) || file.endsWith('pnpm-lock.yaml')) continue;
  const content = await readFile(file, 'utf8').catch(() => null);
  if (content === null) continue;
  for (const pattern of patterns) {
    if (pattern.test(content)) findings.push(`${file}: ${pattern.source}`);
  }
}

if (findings.length > 0) {
  throw new Error(`Potential secrets found:\n${findings.join('\n')}`);
}

console.log('No high-confidence credential patterns found.');
