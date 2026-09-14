import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('.next/static');
const destination = resolve('.next/standalone/apps/web/.next/static');

await rm(destination, { force: true, recursive: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });

const publicSource = resolve('public');
const publicDestination = resolve('.next/standalone/apps/web/public');

await rm(publicDestination, { force: true, recursive: true });
await mkdir(publicDestination, { recursive: true });
await cp(publicSource, publicDestination, { recursive: true });
