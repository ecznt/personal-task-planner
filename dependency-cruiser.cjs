/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'web-cannot-import-api',
      severity: 'error',
      from: { path: '^apps/web/' },
      to: { path: '^apps/api/' },
    },
    {
      name: 'prisma-only-in-database-platform',
      severity: 'error',
      from: {
        pathNot: '^apps/api/src/platform/database/',
      },
      to: {
        dependencyTypes: ['npm'],
        path: '^(?:@prisma/client|@prisma/adapter-pg)$',
      },
    },
    {
      name: 'api-client-only-in-web',
      severity: 'error',
      from: {
        pathNot: '^(?:apps/web/|packages/api-client/)',
      },
      to: {
        path: '^packages/api-client/',
      },
    },
    {
      name: 'known-forbidden-import-fixture',
      severity: 'error',
      from: { path: '^tests/architecture/fixtures/apps/web/' },
      to: { path: '^tests/architecture/fixtures/apps/api/' },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '(?:\\.next|coverage|dist|generated|node_modules)',
    },
    includeOnly: '^(?:apps|packages|tests/architecture/fixtures)/',
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['types', 'import', 'require', 'default'],
    },
  },
};
