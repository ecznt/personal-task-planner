# ADR-002: REST API with Backend-Owned OpenAPI and Generated Client

Status: Accepted
Date: 2026-07-20

## Context

The product needs a stable browser-to-backend contract, consistent privacy-safe errors, typed request/response models, and a practical learning path for contract checks. REST and OpenAPI are fixed project decisions. Hand-written frontend DTOs would drift from the NestJS implementation, while a design-first OpenAPI file maintained separately would duplicate the initial single-team source of truth.

## Decision

- NestJS controllers and DTO schemas own the implemented HTTP contract under `/api/v1`.
- A deterministic OpenAPI 3.1 document is generated from backend metadata and committed at `apps/api/openapi/openapi.json`.
- The document is validated, linted, and compared with the base branch for breaking changes in CI.
- Stable operation IDs are mandatory and form the generated method names.
- `packages/api-client` is generated from the committed document using a pinned `@hey-api/openapi-ts` Fetch configuration, subject to an implementation proof for the required OpenAPI and error features.
- The web application imports the generated client and does not maintain parallel transport types.
- RFC 9457 errors, cookie authentication, ownership-safe `404` behavior, pagination, idempotency, and concurrency preconditions are represented in the contract.
- Generated output is never hand-edited. A small hand-written client bootstrap may set the base URL, credentials, correlation metadata, and typed error normalization.

## Rationale

This makes the backend implementation and the reviewable contract converge, provides compile-time feedback to the frontend, and allows compatibility and drift checks before merge. REST resources match the approved product and domain operations without introducing GraphQL infrastructure.

## Consequences

### Positive

- Browser calls and schemas are generated consistently.
- API changes are visible as an artifact diff and a TypeScript impact.
- Contract linting and compatibility checks become release gates.
- External documentation can later reuse the same artifact.

### Negative

- Decorator metadata and generated schemas require discipline and tests.
- Generator upgrades can create large diffs and must be reviewed separately.
- Backend-generated descriptions can omit semantics unless examples, errors, and operation IDs are explicitly maintained.
- OpenAPI compatibility does not prove domain correctness or authorization.

## Alternatives considered

1. **Hand-written frontend client/types**: rejected because it permits silent contract drift.
2. **OpenAPI design-first as a separately edited source**: deferred because it adds dual maintenance before a separate API governance role exists.
3. **GraphQL**: out of scope for the first version and unnecessary for the approved resource operations.
4. **Runtime-only schema inference without a committed artifact**: rejected because reviewers and compatibility tooling need a stable baseline.

## Compliance and verification

- CI fails on invalid OpenAPI, breaking unapproved changes, unstable operation IDs, or generated-client drift.
- Supertest verifies documented success and error variants for every endpoint group.
- The generated client is type-checked in the Next.js build.
- Ownership tests remain mandatory because a schema cannot prove per-user isolation.

## Related decisions

- `docs/api/API_CONTRACT.md`
- ADR-001: Modular monolith
- ADR-003: Graphify
