# Architecture and Quality Strategy

Status: Approved Stage 7 baseline; MVP scope revised to defer social authentication
Last updated: 2026-07-23

## 1. Purpose and scope

This document defines the implementation-ready architecture and quality strategy for the personal task planner. It translates the approved product, UX, domain, data, and API contracts into deployable boundaries without adding production implementation.

The system is a TypeScript modular monolith delivered from one pnpm workspace. It has one source repository and one PostgreSQL database, while web, HTTP API, and background worker entry points run as separate processes. The worker is not a microservice: it uses the same application modules, database ownership rules, release artifact, and version as the API.

The decisions in this document were accepted with explicit Stage 7 approval on 2026-07-20.

## 2. Architecture drivers

- Strict per-user data isolation is required for every aggregate operation and read model.
- Task, recurrence, lifecycle, and restore rules require explicit transactional boundaries.
- The browser must consume a generated client from the backend-owned OpenAPI contract.
- The application must remain understandable for one maintainer and must not introduce microservices or infrastructure without a demonstrated need.
- The first UI is Turkish, while routes, messages, validation, and stored preferences must remain i18n-ready.
- Background reminders, expiry, and deletion work must be reliable without introducing Redis in the first release.
- The architecture must provide current engineering learning value through automated contracts, migrations, security checks, and layered tests.

## 3. System context and runtime topology

### ARC-001: Runtime topology

The release contains three separately runnable processes:

1. **Web**: a self-hosted Next.js Node.js process serving the responsive application.
2. **API**: a NestJS application using the Express adapter and exposing `/api/v1`.
3. **Worker**: a non-HTTP NestJS application context that leases and executes PostgreSQL-backed jobs.

All three are built from the same Git revision. API and worker use the same `apps/api` codebase and container image with different start commands. The initial production topology is one web replica, one API replica, and one worker replica. Concurrency controls must still be safe if worker replication is introduced later.

PostgreSQL is the only stateful infrastructure dependency. Redis, a message broker, and a separate search service are not part of the MVP.

### ARC-002: Deployment shape

- Production uses portable OCI containers and a managed PostgreSQL service.
- A reverse proxy or managed ingress terminates TLS and exposes the web application and `/api/v1` under one public origin.
- The API and worker are private network workloads. PostgreSQL is never internet-accessible.
- Local development uses Docker Compose for PostgreSQL and supporting development services; applications may run on the host for fast feedback or in containers for parity.
- `develop` is the integration branch and `main` is the release branch. Both are protected; changes arrive through reviewed pull requests with required CI checks.

## 4. Monorepo and workspace layout

### ARC-003: pnpm workspace

The repository uses pnpm workspaces without an additional task orchestrator initially. Root scripts coordinate package scripts through pnpm filters. The repository pins Node.js 24 LTS and the pnpm version through the root package metadata and Corepack-compatible configuration. The lockfile is committed and CI uses a frozen lockfile.

```text
apps/
  web/                         # Next.js App Router application
  api/                         # NestJS API and worker entry points
    prisma/                    # Prisma schema, migrations, and explicit seed entry point
    src/
      modules/                 # Domain-aligned application modules
      platform/                # Technical adapters and composition support
      main.ts                  # HTTP API composition root
      worker.ts                # Background worker composition root
packages/
  api-client/                  # Generated OpenAPI client; no hand-written domain logic
  config/                      # Shared, environment-neutral config parsing helpers
  eslint-config/               # Shared lint policy
  typescript-config/           # Shared strict TypeScript bases
docs/
graphify-out/
```

`packages/ui` is deliberately absent. With one frontend consumer, shadcn/ui components remain in `apps/web/src/components/ui`. A UI package may be introduced only when a second real consumer exists or the design system needs an independently tested and versioned boundary.

There is no generic `packages/types` or shared domain package. API transport types come from the generated client; backend domain types stay inside their owning module. This prevents a shared-package dependency hub and accidental coupling.

## 5. Frontend boundary

### ARC-004: Next.js responsibilities

`apps/web` owns:

- App Router routes, layouts, navigation, and responsive presentation;
- Turkish message catalogs and locale selection;
- accessible shadcn/ui compositions and frontend-only view state;
- React Hook Form forms with Zod schemas derived from UX needs, while treating API validation as authoritative;
- TanStack Query query keys, cache orchestration, optimistic interaction only where rollback is deterministic, and server-state invalidation;
- authentication entry screens and browser session interaction through the generated client;
- frontend error boundaries, loading states, empty states, and analytics-free operational telemetry approved for the product.

It must not:

- access PostgreSQL or Prisma;
- reimplement domain rules or ownership decisions;
- create a second business API through Next.js route handlers;
- hand-write API response types that duplicate the OpenAPI contract;
- expose server secrets through `NEXT_PUBLIC_*` variables.

User-owned mutable data is requested through `packages/api-client`. Server Components may render public pages and application shells, but they must not create a parallel data-access contract. The browser sends the secure session cookie to the same-origin `/api/v1` path.

## 6. Backend boundary and modular monolith

### ARC-005: Module map

Backend source is organized by domain ownership, not by global technical layers such as `controllers/`, `services/`, or `repositories/`.

| Module | Owns | Key collaborations |
| --- | --- | --- |
| `accounts` | User, the email/password AuthenticationIdentity, sessions, credentials, preferences, account-deletion initiation | Calls onboarding after first account creation; exposes authenticated actor and preference ports |
| `planning` | Area, Project, AreaStatus, canonical-status mapping | Supplies validated Area/Project/status references to tasks and lifecycle |
| `tasks` | Task, ChecklistItem, Label, TaskLabel, RecurrenceRule, reminder definitions, task ordering | Uses planning reference ports; emits completion/reminder facts; participates in lifecycle restore |
| `notifications` | Notification creation, in-app delivery state, read/dismiss operations | Consumes due-reminder work and reads account notification preferences |
| `lifecycle` | Archive/Trash orchestration, restore validation, expiry, cascade provenance, account purge coordination | Coordinates accounts, planning, tasks, and notifications in explicit transactions |
| `work-views` | Read-only Today, list, Kanban, search, filter, and archive/trash projections | Composes owned read models without acquiring aggregate ownership |
| `onboarding` | Idempotent creation of first-user sample data | Coordinates accounts, planning, and tasks through their public application ports |

Technical support belongs under `apps/api/src/platform`, with narrow adapters for configuration, Prisma/database, logging, observability, HTTP, clock, cryptography, and email delivery. Platform code implements ports defined by modules; it does not own business operations.

### ARC-006: Internal module shape

Each business module may contain its own transport, application, domain, and infrastructure folders. The dependency direction is:

```text
HTTP or worker adapter -> application use case -> domain model -> declared port
                                                   ^                 |
                                                   | infrastructure adapter
```

- Controllers validate transport input and call one application use case.
- Application use cases authorize the actor, coordinate transactions, and invoke domain behavior.
- Domain code contains invariants and has no NestJS, Prisma, HTTP, or logging dependency.
- Infrastructure adapters implement module-owned ports.
- Cross-module calls target an exported application port or a documented integration event, never another module's controller, repository implementation, Prisma delegate, or internal table.
- Cyclic module imports are forbidden and checked by static architecture tests.

Cross-module atomic commands, including task completion with next recurrence creation and restore validation, execute through an application coordinator using the shared Prisma transaction context. Events emitted inside a transaction are recorded in PostgreSQL and processed only after commit when asynchronous behavior is required.

## 7. Data and Prisma ownership

### ARC-007: Prisma and PostgreSQL

- `apps/api/prisma` is the only owner of the Prisma schema, migrations, and generated Prisma client.
- Only backend infrastructure adapters import Prisma. Web and shared packages cannot depend on `@prisma/client`.
- Each repository method requires an authenticated owner scope for user-owned data. Raw ID-only lookups are prohibited outside explicitly audited system jobs.
- Cross-user outcomes follow the API contract's non-enumerating `404` policy.
- Database constraints enforce uniqueness and referential integrity; domain validation provides user-facing errors before constraint failures where possible.
- PostgreSQL stores domain data, sessions, idempotency records, durable job leases, deletion replay records, and asynchronous integration events.

### ARC-008: Transactions and concurrency

The following operations require explicit transactions:

- task completion plus creation of the single next recurrence occurrence;
- Kanban or checklist reorder updates;
- trash/restore cascades and restore fallback when a Project is unavailable;
- Area or Project lifecycle operations affecting descendants;
- onboarding sample-data creation;
- account deletion marking and purge scheduling;
- idempotent mutation result recording.

Concurrency-sensitive rows use the version/precondition strategy defined by the API and data contracts. Recurrence uses a database uniqueness guard plus transactional locking so retries cannot create a duplicate next occurrence.

### ARC-009: PostgreSQL-backed worker

Durable work is represented by rows with job type, payload reference, available time, attempt count, lease owner, lease expiry, last error category, and terminal state. Workers claim work in small batches using transaction-safe row locking such as `FOR UPDATE SKIP LOCKED`, assign a lease token, and acknowledge only after the side effect commits.

Handlers are idempotent. Expired leases can be reclaimed. Retryable failures use bounded exponential backoff with jitter; permanent failures enter a failed state visible to operations. Initial worker responsibilities are:

- scheduling and creating due in-app notifications;
- retrying notification work;
- expiring Trash items after the approved retention period;
- executing account purge and deletion replay work;
- removing expired sessions and idempotency records.

The initial target is to materialize due in-app notifications within 60 seconds under normal operation. Failed reminder work is attempted up to five times over a maximum 15-minute retry window. Trash/account purge jobs must complete within 24 hours of becoming eligible. These are operational targets, not a public availability SLA.

## 8. Authentication and security boundaries

### ARC-010: Session strategy

- Authentication uses an opaque, high-entropy session identifier stored only in a `Secure`, `HttpOnly`, `SameSite=Lax`, path-scoped cookie.
- Only a hash of the session token is stored in PostgreSQL.
- Sessions have a 12-hour idle timeout and a 7-day absolute lifetime. Activity refresh is rate-limited to avoid a write on every request.
- A user may have at most five active sessions; creating a sixth revokes the least recently used session.
- Password reset tokens expire after 30 minutes; email verification tokens expire after 24 hours. Single-use tokens are stored hashed and consumed transactionally.
- Password reset, account deletion, and detected credential compromise revoke all active sessions. Login rotates the session identifier.
- Sensitive identity changes require a session authenticated within the previous 15 minutes or an explicit reauthentication flow.

Passwords use Argon2id with parameters selected and benchmarked during implementation against current OWASP guidance. The UI accepts 12–128 Unicode characters, permits paste and password managers, and does not impose arbitrary composition rules. Credential values, reset tokens, cookies, and authorization headers are never logged.

Social authentication providers, including Google, and provider identity linking are outside the MVP. No provider adapter, callback boundary, provider configuration, or provider test fixture is part of the implementation baseline. A future provider requires a fresh cross-document security and architecture decision.

### ARC-011: Origin, proxy, headers, and abuse controls

- Production is same-origin; CORS is disabled. Development permits only explicit local origins with credentials.
- The API trusts the exact ingress proxy hop count configured for the environment, never an unrestricted forwarded-header chain.
- HTTPS is mandatory outside local development. Helmet-managed headers include a restrictive Content Security Policy, HSTS, `nosniff`, a conservative referrer policy, frame protection, and a minimal permissions policy.
- CSRF protection combines SameSite cookies, same-origin deployment, Origin/Referer validation for unsafe methods, and a CSRF token where browser compatibility or route behavior requires it.
- Request bodies and bulk operations have explicit size limits; bulk mutations accept at most 100 items.
- General burst limiting may be in-process while the API has one replica. Login, reset, registration, and token-confirmation abuse counters are persisted in PostgreSQL by normalized account key and privacy-conscious network prefix. Responses do not reveal whether an account or cross-user resource exists.
- The exact initial endpoint-class thresholds, windows, alert condition, and 60-minute maximum emergency relaxation are the approved baseline in API Contract section 9. The most restrictive matching class wins. Any production override is non-secret configuration, reviewable, tested, and unable to bypass authorization, ownership, CSRF, enumeration resistance, or idempotency.
- Idempotency records for supported mutations are retained for at least 24 hours and cleaned after 48 hours unless the API contract specifies a longer domain requirement.

### ARC-012: Security verification

CI and release checks include dependency vulnerability review, secret scanning, static analysis, lockfile integrity, OpenAPI security review, container scanning, and migration review. Authorization integration tests attempt cross-user access for every user-owned endpoint group. Production logs and metrics must not contain task content, email addresses, tokens, or raw user identifiers.

## 9. API contract and generated client

### ARC-013: OpenAPI ownership

NestJS controllers and DTO schemas are the implementation source for a backend-generated OpenAPI 3.1 document. The generated document is committed at `apps/api/openapi/openapi.json` so changes are reviewable. It must express stable operation IDs, RFC 9457 errors, security schemes, pagination, validation errors, idempotency headers, concurrency headers, and examples without secrets.

The contract pipeline is:

1. build the backend metadata without starting external listeners;
2. generate and deterministically sort `openapi.json`;
3. validate and lint the document;
4. compare it with the base branch for breaking changes;
5. generate `packages/api-client` with a pinned OpenAPI TypeScript generator and Fetch runtime;
6. type-check the web application against the generated package;
7. fail CI when generation changes committed files.

The initial generator choice is `@hey-api/openapi-ts` with its Fetch client. `SPIKE-001` runs as the first non-production work of EPIC-001 and before `BL-003` or any generated production transport artifact. It verifies OpenAPI 3.1, cookie credentials, RFC 9457 unions, nullable fields, file-free JSON operations, response headers, Fetch credentials, and operation-ID stability, then pins the compatible versions and configuration. Failure reopens the generator choice without changing the REST/OpenAPI decision or counting the experiment as production code.

The frontend never edits generated files. Hand-written wrappers in `packages/api-client` are limited to client construction, credentials, correlation headers, and typed error normalization; business rules remain outside the package.

## 10. Configuration and environment validation

### ARC-014: Configuration policy

- Each process validates its environment synchronously at startup with Zod and fails before accepting work if configuration is invalid.
- `packages/config` contains environment-neutral schema helpers and shared value objects, not a universal environment object.
- Server-only variables are parsed only in API/worker code. Browser-exposed variables have an explicit public prefix and contain no secrets.
- `.env.example` contains names and safe examples only. Real secrets come from local untracked files or the deployment secret manager.
- Configuration names cover database connectivity, public origin, proxy trust, cookie/security flags, email delivery, log level, worker polling, retention, and observability endpoints.
- Test configuration is explicit and isolated; production defaults are never silently reused in tests.

## 11. Logging, errors, and observability

### ARC-015: Pino logging

NestJS uses Pino through one platform logging adapter. JSON is the production format; local pretty printing is a development transport only. Every API request receives or generates a correlation ID and every worker execution has a job/attempt ID. Child loggers carry safe context such as module, operation, request ID, and opaque actor reference.

Pino redaction is configured for authorization/cookie headers, passwords, tokens, secrets, request bodies containing personal task data, and database connection strings. Logging full DTOs or entities is forbidden. Errors are serialized with safe class, code, and stack in trusted environments only.

### ARC-016: Error handling

A global HTTP exception filter maps typed application/domain errors to the API's RFC 9457 contract. Unknown errors return a generic `500` problem with a trace identifier. Constraint failures are translated only when their meaning is known; raw database errors never reach clients. Cross-user and absent-resource cases remain indistinguishable.

The worker classifies failures as retryable, permanent, or invariant violations. Invariant violations halt that job, emit a high-severity operational event, and do not loop indefinitely.

### ARC-017: Observability baseline

- `/health/live` proves the process event loop is responsive and does not depend on PostgreSQL.
- `/health/ready` verifies required configuration and a bounded PostgreSQL query; it fails during shutdown.
- Metrics include request count/latency/error rate by normalized route, DB pool saturation, worker queue age, attempts/failures, reminder delay, session/auth abuse aggregates, and lifecycle backlog.
- Metrics labels never contain user IDs, resource IDs, emails, search text, or task content.
- W3C trace context and correlation IDs are propagated even if a distributed tracing backend is not deployed initially.
- Alerts target sustained readiness failure, error-rate increase, worker backlog age, failed jobs, and managed-database capacity/backup failure.

The MVP has no contractual availability SLA. Its internal availability objective is at least 99.5% successful production readiness observations over every rolling 30-day window. A one-minute external or platform probe evaluates `/health/ready`; any failed or missing observation counts as unavailable, including planned maintenance, and local/test environments are excluded. Alerts fire after five consecutive failed observations and when the rolling objective is at risk.

Performance objectives are p95 under 500 ms for common API reads/writes and under 1 second for bounded search on the reference dataset, with notification materialization normally within 60 seconds. Performance tests establish and document the reference dataset and machine before these targets become release gates.

## 12. Docker Compose and production infrastructure

### ARC-018: Local Compose

Docker Compose defines:

- PostgreSQL with a named volume and health check;
- an optional local mail-capture service for verification/reset workflow development;
- optional web, API, and worker profiles built from the same repository.

There is no Redis service. Compose uses non-secret development credentials and does not represent production secret management. Testcontainers starts separate disposable PostgreSQL instances for integration tests; it does not share the developer Compose database.

### ARC-019: Backups and deletion replay

The managed PostgreSQL service provides encrypted backups and point-in-time recovery where available. Backup retention is no longer than 30 days. Restore drills are performed before release and periodically thereafter.

Account deletion writes a privacy-minimized deletion replay record before primary data is purged. After any backup restore, an operational replay step reapplies deletion records before the restored environment serves user traffic. The replay record contains only an opaque account deletion key, deletion time, and execution status—never email or task content—and is retained for the backup window plus a five-day operational buffer, then purged. This control is documented in the recovery runbook and tested in a restore exercise.

## 13. Migration and release workflow

### ARC-020: Prisma migrations

- Developers change the Prisma schema and create migrations with `prisma migrate dev` against a disposable/local database.
- Generated SQL is reviewed for locks, data loss, ownership constraints, indexes, and rollback implications before commit.
- Shared and production environments never use `prisma db push`.
- CI applies the complete migration history to a fresh PostgreSQL instance and runs database integration tests.
- A single release job runs `prisma migrate deploy` before the new application processes receive traffic. Applications do not auto-migrate on startup.
- Schema evolution uses expand-and-contract changes so the previous application version remains compatible during rollout. Destructive contraction occurs only after the new version is stable and data transition is verified.
- Failed migrations stop deployment. Application rollback is allowed only while schema compatibility is preserved; database restoration follows the recovery runbook, not an automatic down migration.

### ARC-021: Seed and onboarding data

The Prisma seed entry point is explicit, deterministic, and safe to run repeatedly in local/test environments. It creates only technical/reference data required by the environment. It does not create production users or silently create personal sample tasks.

Per-user sample Areas, Projects, Tasks, labels, and checklist items are created by the `onboarding` application coordinator after first account creation. The operation is owner-scoped, transactional, locale-aware, and idempotent through an onboarding completion marker. It uses the same public application ports and domain rules as normal creation.

## 14. CI/CD and branch strategy

### ARC-022: Pull-request pipeline

Pull requests targeting `develop` or `main` run:

1. repository policy, formatting, lint, and secret checks;
2. strict TypeScript type-check for every workspace package;
3. unit and frontend component tests;
4. OpenAPI generation, lint, compatibility comparison, client generation, and drift check;
5. backend build, worker build, and Next.js production build;
6. API and PostgreSQL integration tests with Testcontainers;
7. Playwright critical-path E2E tests on the production-like topology;
8. fresh-database migration validation;
9. dependency, static-analysis, and container/dependency manifest checks as applicable.

Jobs may run in parallel after dependency installation, but contract generation precedes client/web type-checking. Required checks are branch protection gates. CI uses least-privilege tokens, pinned action revisions, and no production credentials.

### ARC-023: Release pipeline

- Feature/fix branches merge into `develop` through pull requests.
- `develop` is continuously integration-ready.
- A reviewed promotion pull request moves an identified `develop` revision to `main`.
- A `main` revision produces immutable, revision-labelled web and API/worker images plus the reviewed OpenAPI artifact.
- Deployment runs the one-off migration job, starts API/worker/web, checks readiness, and performs owner-isolation and login smoke tests.
- Production environment approval remains manual for the MVP.

## 15. Testing strategy

### ARC-024: Test portfolio

| Test level | Scope | Tools | Required examples |
| --- | --- | --- | --- |
| Unit | Pure domain rules and application decisions with ports replaced | Jest for backend; Vitest for frontend utilities | Area/Project invariant, recurrence next occurrence, lifecycle transitions, sorting calculations, error mapping |
| Component | Rendered frontend components and composed feature states without a real backend | Vitest, Testing Library, user-event, axe | forms, dialogs, list/Kanban keyboard behavior, empty/loading/error states, Turkish labels |
| API integration | NestJS HTTP stack through Express with real guards, validation, filters, and module wiring | Jest, Supertest | auth cookies, RFC 9457 errors, pagination, idempotency, concurrency, cross-user non-enumeration |
| Database integration | Repositories, constraints, transactions, job leasing, and migrations against real PostgreSQL | Jest, Testcontainers | owner-scoped queries, uniqueness, restore fallback, duplicate recurrence race, lease recovery |
| End-to-end | Browser journeys against built web/API/worker and isolated PostgreSQL | Playwright | registration/onboarding, email/password recovery, Today planning, task lifecycle, recurrence, notification, Trash restore |
| Contract/OpenAPI | Machine-readable API compatibility and generated-client correctness | OpenAPI validator/linter, compatibility diff, generator, TypeScript | stable operation IDs, schemas/errors/security, no generated drift, frontend compiles against client |

Every invariant and concurrency-sensitive operation listed in the domain/data contracts has at least one deterministic test. Coverage reports expose gaps, but a global percentage is not a substitute for rule coverage. Once a representative implementation baseline exists, coverage thresholds may only ratchet upward. Flaky tests are treated as defects and are not retried indefinitely to obtain green CI.

Test data builders default to two owners so isolation is exercised by design. E2E suites use deterministic clocks for date-sensitive behavior and never call real email delivery services.

## 16. Quality gates

### ARC-025: Type, lint, architecture, and contract gates

- TypeScript `strict` is enabled in every authored package; suppressions require a local explanation.
- ESLint enforces module boundaries, no backend import in web, no Prisma outside backend adapters, and accessibility rules.
- Dependency-cycle and forbidden-import checks enforce the module map.
- Formatting is deterministic and checked in CI.
- OpenAPI and generated-client drift fail CI.
- New migrations must pass fresh-database and representative-upgrade tests.
- Critical owner-isolation, recurrence, and lifecycle tests are mandatory release checks.

### ARC-026: Accessibility gate

The target is WCAG 2.2 AA for all primary journeys. Accessibility is verified through:

- semantic HTML and accessible-name rules enforced by linting;
- Testing Library queries that prefer roles, labels, and names;
- automated axe checks for feature components and Playwright checks for core routes, with no serious or critical violations;
- keyboard tests for focus order, dialogs, list selection, bulk actions, and both Kanban variants;
- visible focus, reduced-motion, reflow/zoom, contrast, error announcement, and live-region checks;
- a manual screen-reader and keyboard checklist before MVP release.

Automated checks do not replace manual verification. Any inaccessible alternative to drag-and-drop is a release blocker for affected Kanban operations.

### ARC-027: Browser and responsive support

The MVP supports the latest two stable releases of Chrome, Edge, Firefox, and Safari, plus the current stable iOS Safari. Automated E2E covers Chromium, Firefox, and WebKit at compact and wide reference widths; selected navigation and task flows also cover the medium layout. Progressive enhancement is used where browser capability differs.

## 17. i18n strategy

### ARC-028: Internationalization

- Turkish is the default and only shipped message catalog for MVP.
- Frontend messages use ICU-capable message catalogs with stable semantic keys; no user-facing sentence is embedded in domain/API logic.
- Locale preference belongs to the user account, with browser preference used before authentication and Turkish as fallback.
- MVP routes keep the approved route shape without a locale prefix. Locale-aware routing may be introduced only with a UX decision.
- API responses expose stable codes, structured parameters, and field paths—not localized prose as the sole meaning. The web maps these to localized messages.
- Dates, times, numbers, pluralization, week start, and time zones use locale-aware platform APIs. Domain instants remain UTC with explicit user time-zone semantics.
- Notification/email templates use the same semantic message policy and persist the locale used for rendering when needed.

## 18. Dependency update strategy

### ARC-029: Dependency governance

- Runtime, pnpm, direct packages, generated tools, Docker base images, and GitHub Actions are pinned to reviewable versions; the lockfile is committed.
- Dependabot checks pnpm/npm, Docker, and GitHub Actions weekly. Compatible patch/minor updates may be grouped by ecosystem; major updates are separate.
- Security updates are enabled and prioritized immediately. A vulnerable dependency requires an impact review even when it is transitive.
- Automated pull requests run the full relevant CI suite and are never auto-merged before review.
- Unused dependencies are removed; new dependencies require a documented use, maintenance/license check, and assessment against existing platform capability.

## 19. Graphify workflow

### ARC-030: Architecture knowledge graph

Graphify is a review and impact-analysis aid for approved project documents and, later, source code. Before an architecture or cross-cutting change, use graph queries to locate requirements, domain concepts, API operations, data entities, module ownership, and affected tests. Direct file reading remains authoritative for exact wording, security rules, ordering, and implementation details.

After meaningful approved document or source changes:

1. confirm `.graphifyignore` still excludes secrets, credentials, dependencies, build artifacts, and transient Graphify data;
2. run the project-pinned Graphify workflow with incremental update when a graph exists;
3. inspect graph statistics, communities, god nodes, and targeted queries;
4. verify findings against source documents and tests;
5. commit only the shareable `graphify-out` artifacts permitted by repository policy;
6. update generation metadata in `PROJECT_MASTER.md`.

Graphify does not replace file review, TypeScript checks, migrations, OpenAPI validation, or tests. Detailed rationale and MCP operation are recorded in ADR-003.

## 20. Requirement and module traceability

| Concern | Primary module/process | Authoritative documents |
| --- | --- | --- |
| Authentication and user isolation | `accounts`, API | PRD privacy/NFRs, Domain User/AuthenticationIdentity, API auth/security |
| Area, Project, status hierarchy | `planning`, API | Domain model, data model, Area/Project/status API |
| Tasks, labels, checklists, recurrence | `tasks`, API/worker | Domain Task/RecurrenceRule, data transactions, task/checklist/label API |
| Today/list/Kanban/search | `work-views`, API/web | UX flows, API collection/search endpoints |
| Notifications | `notifications`, worker/API | PRD notifications, domain Notification, API notifications |
| Archive, Trash, restore, purge | `lifecycle`, API/worker | Domain lifecycle rules, data delete/restore effects, archive/trash API |
| First-user sample data | `onboarding`, API | PRD onboarding, UX onboarding flow, data seed assumptions |
| Presentation and accessibility | web | UX responsive/a11y, PRD NFRs |

## 21. Explicitly deferred decisions

- A second API replica, Redis, message broker, or independent worker service is deferred until measured load or availability requirements justify it.
- A separate `packages/ui` is deferred until there is a second consumer or independently governed design-system need.
- A dedicated search engine is deferred; PostgreSQL-backed search must first be measured against the approved scope.
- Full distributed tracing storage, a hosted error-tracking vendor, and advanced product analytics are deferred pending privacy and operational decisions.
- Native mobile, collaboration, organization, billing, and microservices remain out of scope.

## 22. Stage 7 approval criteria

Stage 7 may be approved when:

- the workspace, runtime, module, dependency, and process boundaries are accepted;
- API/worker reliability without Redis and the single-replica assumption are accepted;
- OpenAPI ownership and generated-client workflow are accepted;
- migration, seed/onboarding, CI/release, security, observability, i18n, accessibility, and testing gates are accepted;
- ADR-001 through ADR-003 are accepted;
- Graphify confirms that every proposed module has a source-document responsibility and any graph gaps are reconciled against the authoritative documents;
- no unresolved architecture decision blocks backlog planning.
