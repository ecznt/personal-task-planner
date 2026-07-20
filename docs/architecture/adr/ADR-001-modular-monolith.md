# ADR-001: Modular Monolith with Separate Runtime Entry Points

Status: Accepted
Date: 2026-07-20

## Context

The product has strongly related user-owned aggregates, cross-aggregate lifecycle operations, recurrence transactions, and read models that combine several concepts. It is a personal-use product with one development repository and no current scale or organization boundary that justifies distributed services. Background reminders and retention work still need an independently runnable process.

## Decision

Use a domain-aligned modular monolith in one pnpm workspace and one PostgreSQL database.

- `apps/web` is the Next.js presentation application.
- `apps/api` contains the NestJS modular monolith and exposes two composition roots: HTTP API and background worker.
- Web, API, and worker run as separate processes/containers from the same revision. API and worker share the same backend modules and image.
- Backend business modules are `accounts`, `planning`, `tasks`, `notifications`, `lifecycle`, `work-views`, and `onboarding`.
- Each module owns its domain/application surface and exports narrow application ports. Cross-module code cannot access another module's repository implementation or Prisma delegate.
- Cross-module atomic operations use an explicit application coordinator and shared Prisma transaction context.
- PostgreSQL stores durable jobs and leases. Redis and message brokers are not introduced for MVP.
- Initial production uses one API and one worker replica, while leasing and idempotency rules remain safe for later worker replication.

## Rationale

This keeps transactional rules local, supports rapid refactoring while the product is young, and makes module boundaries learnable and testable without the operational cost and failure modes of networked services. Separate entry points allow HTTP traffic and background work to scale or restart independently without pretending they are separately owned systems.

## Consequences

### Positive

- One deployment version and one contract for related business behavior.
- Database transactions can protect recurrence and lifecycle invariants.
- Domain modules can later be measured and extracted if a real boundary emerges.
- No extra broker/cache operations are required for MVP.

### Negative

- Module boundaries require lint/architecture tests because the compiler alone does not prevent all internal imports.
- One database can become a coupling point if table ownership is ignored.
- Heavy worker work can contend with API database traffic; metrics and bounded leasing are required.
- Independent deployment of one module is not supported.

## Alternatives considered

1. **Microservices**: rejected for MVP because ownership, scaling, and release boundaries do not justify network contracts and distributed transactions.
2. **Single Node.js process for HTTP and jobs**: rejected because job execution would share lifecycle and capacity directly with web traffic and complicate graceful shutdown.
3. **Separate worker service repository/database**: rejected because it would duplicate domain behavior and introduce distributed consistency without a business boundary.
4. **Redis-backed queue from day one**: deferred because PostgreSQL can meet the initial reliability and throughput needs with fewer operational components.

## Compliance and verification

- Static checks reject forbidden cross-module imports and cycles.
- Database integration tests verify transactions and job leasing.
- Architecture reviews use Graphify to compare source dependencies with the documented module map.
- Any proposal for a new service must provide measured load, ownership, failure-isolation, and operational evidence.

## Related decisions

- ADR-002: REST and OpenAPI contract
- ADR-003: Graphify architecture discovery and impact analysis
- `docs/domain/DOMAIN_MODEL.md`
- `docs/data/DATA_MODEL.md`
