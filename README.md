# Personal Task Planner

This repository contains the approved planning baseline and the Phase 3 modular-monolith
workspace. Product features have not started. The first implementation slice establishes
only reproducible tooling, composition roots, PostgreSQL/Prisma infrastructure, generated
OpenAPI transport, and enforceable quality gates.

## Start here

1. Read [`docs/PROJECT_MASTER.md`](docs/PROJECT_MASTER.md).
2. Read the current story in [`docs/planning/BACKLOG.md`](docs/planning/BACKLOG.md).
3. Use Node.js `24.18.0` and pnpm `11.9.0`.
4. Copy `.env.example` to an untracked `.env`.
5. Start PostgreSQL and install dependencies:

   ```sh
   docker-compose up -d postgres
   pnpm install --frozen-lockfile
   pnpm prisma:generate
   pnpm prisma:migrate:deploy
   ```

6. Start the web, API, and worker processes in separate terminals:

   ```sh
   pnpm --filter @planner/web dev
   pnpm --filter @planner/api dev
   pnpm --filter @planner/api dev:worker
   ```

The web shell listens on `http://127.0.0.1:3000`. API liveness and readiness are
`http://127.0.0.1:3001/health/live` and `/health/ready`.

## Required checks

```sh
pnpm verify:workspace
pnpm format:check
pnpm lint
pnpm verify:architecture
pnpm prisma:validate
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm test:security
docker-compose config
```

`apps/api/openapi/openapi.json` and `packages/api-client/src/generated` are generated,
reviewed artifacts. Regenerate them with `pnpm openapi:generate` and
`pnpm api-client:generate`; `pnpm test:contract` verifies deterministic output.

Do not add product tables, authentication, or task behavior while working on the
foundation story. Do not commit real `.env` files, credentials, private keys, or
`graphify-out/cost.json`.
