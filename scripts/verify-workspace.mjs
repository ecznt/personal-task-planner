import { readFile } from 'node:fs/promises';

const expectedNode = 'v24.18.0';
const expectedPnpm = 'pnpm/11.9.0';
const requiredPackages = [
  'apps/api/package.json',
  'apps/web/package.json',
  'packages/api-client/package.json',
  'packages/config/package.json',
  'packages/eslint-config/package.json',
  'packages/typescript-config/package.json',
];

if (process.version !== expectedNode) {
  throw new Error(`Expected Node ${expectedNode}, received ${process.version}`);
}

const userAgent = process.env.npm_config_user_agent ?? '';
if (!userAgent.includes(expectedPnpm)) {
  throw new Error(`Expected ${expectedPnpm} in npm_config_user_agent, received "${userAgent}"`);
}

for (const packagePath of requiredPackages) {
  const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
  if (!manifest.name || !manifest.version || manifest.private !== true) {
    throw new Error(`${packagePath} is not a private, named workspace package`);
  }
}

console.log(`Workspace verified with ${expectedNode} and ${expectedPnpm}.`);
