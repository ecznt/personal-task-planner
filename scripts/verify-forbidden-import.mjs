import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'dependency-cruiser',
    '--config',
    'dependency-cruiser.cjs',
    'tests/architecture/fixtures',
  ],
  { encoding: 'utf8' },
);

if (result.status === 0 || !result.stdout.includes('known-forbidden-import-fixture')) {
  throw new Error('The known forbidden-import fixture was not rejected by dependency-cruiser.');
}

console.log('Known forbidden import was rejected as expected.');
