# Personal Task Planner — Project Master

| Field | Value |
| --- | --- |
| Repository | `ecznt/personal-task-planner` |
| Document role | Authoritative planning index and decision record |
| Document language | English |
| Last updated | 2026-07-20 |

## Product vision

Create a focused personal work-tracking and planning application that gives each user a private space for organizing Tasks under Areas and optional Projects, then executing that work through Today, List, and Kanban views. The project also serves as a practical vehicle for learning current industry development practices.

## Fixed technology decisions

| Area | Decision |
| --- | --- |
| Runtime | Node.js 24 LTS |
| Language | TypeScript with strict mode |
| Package manager | pnpm |
| Workspace | pnpm workspaces |
| Frontend | Next.js with App Router and React |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Server state | TanStack Query |
| Forms | React Hook Form |
| Validation | Zod |
| Backend | NestJS |
| HTTP adapter | Express |
| API style | REST |
| API contract | OpenAPI |
| Frontend API client | Generated from OpenAPI |
| Database | PostgreSQL |
| ORM and migrations | Prisma |
| Backend tests | Jest and Supertest |
| Frontend tests | Vitest and Testing Library |
| End-to-end tests | Playwright |
| Integration database tests | Testcontainers |
| Local infrastructure | Docker Compose |
| Continuous integration | GitHub Actions |
| Logging | Pino |
| Architecture | Modular monolith |
| Initial UI language | Turkish |
| Internationalization | System must be i18n-ready |

## Product decisions

- The application is a personal work-tracking and planning tool.
- The system is multi-user, but every user's data is private and isolated from every other user.
- The MVP has no teams, organizations, shared work, or collaboration.
- Every Task must belong to exactly one Area.
- Project use is optional; every Project belongs to one Area.
- A Task may belong directly to an Area or to a Project within that Area.
- Tasks support descriptions, independent planned and due dates, priority, labels, checklists, recurrence, and multiple in-app reminders.
- Recurrence supports both fixed calendar schedules and completion-based schedules.
- A recurrence series has at most one open occurrence; completion generates the next occurrence, and missed calendar slots are not backfilled.
- Every Task status maps to one canonical group: To Do, In Progress, or Completed; an Area may define and order its own statuses within those mappings.
- The MVP provides List, Kanban, and Today-focused views, plus search, filtering, and basic bulk actions.
- Global Kanban uses canonical status groups; Area Kanban displays that Area's configured statuses.
- List views offer automatic sorting; Kanban order is manually controlled by the user.
- Today is the primary authenticated destination and emphasizes personal daily planning.
- Desktop navigation uses a persistent sidebar; mobile navigation uses Today, Tasks, Kanban, and More bottom destinations.
- Task capture is globally available; detailed editing uses a desktop side panel and a full-screen compact-layout route.
- Archive and Trash apply to Tasks, Projects, and Areas.
- Parent Archive and Trash operations cascade with recorded cause and prior state; restore reverses only the matching cascade effects.
- Trash content is permanently deleted after 30 days.
- Authentication supports email/password and Google; the email/password lifecycle includes email verification and password reset.
- Users can request permanent account deletion through an explicitly confirmed flow.
- The product is a responsive web application.
- The first user interface language is Turkish, and the system is designed to remain ready for internationalization.
- First-time users may explicitly choose to create private sample data or start empty.
- Task dates and reminders use the user's account time zone.
- Date-only Task values preserve their calendar date across time-zone changes; timed values preserve their instant, while future calendar recurrence uses the newly confirmed account time zone.
- Project moves between Areas are atomic and move all contained Tasks while preserving canonical meaning through target Area defaults.
- Authentication identities are linked only through an authenticated explicit action; matching email addresses do not cause automatic account linking.
- A normalized verified primary email belongs to at most one retained User; a matching Google email cannot create a second User and still requires authenticated explicit identity linking.
- Confirmed account deletion revokes access immediately and starts an idempotent physical purge of primary User data; backup expiry and operational evidence remain later Privacy and Architecture decisions.
- Global and Area Kanban manual orders use independent opaque Task rank keys with optimistic conflict handling and a deterministic Task-identity tie-breaker.
- Each User has a persisted, default-Enabled preference for future in-app reminder Notifications. Disabling preserves reminder definitions and existing Notifications; due reminders are suppressed without backfill until the preference is re-enabled for future scheduled instants.
- Production implementation begins only after the planning stages have been completed and approved.

## Out-of-scope items

- Teams, organizations, shared work, delegation, and collaboration in the MVP.
- Billing, subscriptions, and payments in the MVP.
- Native mobile applications in the MVP.
- Public sharing in the MVP.
- Email, SMS, and native push notifications in the MVP.
- User-data export and third-party productivity integrations in the MVP.
- Supabase or any other Backend as a Service platform.
- Spring.
- Flask.
- Microservice architecture.
- GraphQL in the first version.
- Production application code during the planning stages.

## Planning stages

| Stage | Purpose | Status |
| --- | --- | --- |
| 1. Planning infrastructure | Establish the master document, decision controls, and Graphify integration. | Completed |
| 2. Product requirements | Define target problems, goals, users, scope, requirements, and success criteria through the PRD. | Completed and approved |
| 3. UX flows and information architecture | Define routes, navigation, primary flows, interaction states, responsiveness, and accessibility behavior. | Completed and approved |
| 4. Domain analysis | Define domain language, concepts, rules, workflows, and boundaries. | Completed and approved |
| 5. Data design | Define the conceptual and logical data model, ownership, lifecycle, and constraints. | Completed and approved |
| 6. API design | Define REST resources, operations, errors, versioning, and the OpenAPI approach. | Completed and approved |
| 7. Solution architecture | Define modular-monolith boundaries, runtime topology, security, observability, and deployment approach. | Completed and approved |
| 8. Backlog planning | Produce prioritized epics, stories, acceptance criteria, dependencies, and delivery slices. | Not started |
| 9. Implementation readiness | Reconcile all decisions and confirm that implementation can begin. | Not started |

Every stage requires explicit user approval before the next stage begins.

## Decision log

| ID | Date | Decision | Status | Source |
| --- | --- | --- | --- | --- |
| DEC-001 | 2026-07-19 | Use the fixed technology stack recorded in this document. | Fixed | User instruction |
| DEC-002 | 2026-07-19 | Use a modular monolith; do not introduce microservices. | Fixed | User instruction |
| DEC-003 | 2026-07-19 | Use Turkish for the initial UI while keeping the system i18n-ready. | Fixed | User instruction |
| DEC-004 | 2026-07-19 | Complete and approve planning stages before writing production application code. | Approved | User instruction |
| DEC-005 | 2026-07-19 | Use Graphify for architecture discovery and impact analysis without treating its output as a substitute for source, tests, or type checking. | Fixed | User instruction |
| DEC-006 | 2026-07-19 | Version the project Graphify skill and shareable graph outputs; exclude `graphify-out/cost.json`. | Fixed | User instruction |
| DEC-007 | 2026-07-19 | Install the official Graphify Agent-Skills project target under `.agents/skills/graphify`. | Approved | User approval after CLI target-path conflict was reported |
| DEC-008 | 2026-07-19 | Do not generate a graph until the repository contains a meaningful document or source corpus. | Approved | User instruction and Graphify skill guard |
| DEC-009 | 2026-07-19 | Complete the planning-infrastructure stage, now numbered Stage 1, and publish its artifacts to the remote `develop` branch. | Approved; numbering clarified by DEC-023 | User instruction |
| DEC-010 | 2026-07-19 | Treat the system as multi-user with strictly isolated personal data and no MVP collaboration, team, or organization model. | Approved | User instruction |
| DEC-011 | 2026-07-19 | Require every Task to belong to an Area; keep Projects optional and contained within one Area. | Approved | User instruction |
| DEC-012 | 2026-07-19 | Support Task descriptions, independent planned and due dates, priority, labels, checklists, recurrence, and multiple in-app reminders. | Approved | User instruction and clarification |
| DEC-013 | 2026-07-19 | Support both calendar-based and completion-based recurrence. | Approved | User clarification |
| DEC-014 | 2026-07-19 | Use the account time zone for Task dates and reminders. | Approved | User clarification |
| DEC-015 | 2026-07-19 | Use To Do, In Progress, and Completed as the canonical Task status groups for the MVP. | Amended by DEC-020 | User clarification |
| DEC-016 | 2026-07-19 | Apply Archive and Trash to Tasks, Projects, and Areas, with automatic permanent deletion after 30 days in Trash. | Approved | User clarification |
| DEC-017 | 2026-07-19 | Include email verification, password reset, Google authentication, and confirmed account deletion in the MVP account lifecycle. | Approved | User instruction and clarification |
| DEC-018 | 2026-07-19 | Offer first-time users an explicit choice to create private sample data or start empty. | Approved | User clarification |
| DEC-019 | 2026-07-19 | Adopt `docs/product/PRD.md` as the approved Stage 2 product-requirements artifact without implementation detail or technical schemas. | Approved | User instruction to proceed to Stage 3 |
| DEC-020 | 2026-07-19 | Keep canonical status groups globally while allowing each Area to define ordered statuses that each map to exactly one canonical group. | Approved | User instruction and clarification |
| DEC-021 | 2026-07-19 | Use Global Kanban canonical groups, Area Kanban local mapped statuses, automatic List sorting, and user-controlled manual Kanban ordering. | Approved | User instruction |
| DEC-022 | 2026-07-19 | Use a desktop sidebar, mobile bottom navigation with a More destination, global quick Task creation, desktop Task side panels, and full-screen compact Task detail. | Approved | User clarification |
| DEC-023 | 2026-07-19 | Number planning infrastructure as Stage 1, Product Requirements as Stage 2, UX as Stage 3, and Domain Analysis as Stage 4, shifting later stages accordingly. | Approved | User instruction to begin Planning Stage 3 |
| DEC-024 | 2026-07-19 | Adopt `docs/product/UX_FLOWS.md` and its PRD status-workflow amendments as the completed Stage 3 UX baseline. | Approved | User explicit phase approval |
| DEC-025 | 2026-07-19 | Preserve both Calendar Based and Completion Based recurrence, allow at most one open occurrence per series, generate the successor only after completion, and never backfill missed calendar slots. | Approved | User approved the recommended Stage 4 decision package |
| DEC-026 | 2026-07-19 | Cascade parent Archive and Trash actions with lifecycle provenance; restore only effects caused by the matching cascade, and permanently delete required descendants with their parent. | Approved | User approved the recommended Stage 4 decision package |
| DEC-027 | 2026-07-19 | Move a Project between Areas atomically with all its Tasks and map each Task to the target Area default that preserves its canonical status group. | Approved | User approved the recommended Stage 4 decision package |
| DEC-028 | 2026-07-19 | Keep date-only values stable as calendar dates, preserve timed instants across account time-zone changes, and evaluate future calendar recurrence in the newly confirmed account time zone. | Approved | User approved the recommended Stage 4 decision package |
| DEC-029 | 2026-07-19 | Require authenticated explicit AuthenticationIdentity linking and prohibit automatic linking based only on matching email addresses. | Approved | User approved the recommended Stage 4 decision package |
| DEC-030 | 2026-07-19 | Draft `docs/domain/DOMAIN_MODEL.md` as the decision-complete Stage 4 domain baseline without persistence, API, or application implementation artifacts. | Approved by DEC-033 | User instruction to begin Stage 4 |
| DEC-031 | 2026-07-19 | Reconcile the approved PRD and UX documents with the approved Stage 4 recurrence, lifecycle, Project-move, time, and identity-linking decisions without changing the MVP boundary. | Approved | Cross-document consistency requirement |
| DEC-032 | 2026-07-19 | Keep Graphify pinned at `0.9.20` and install its official MCP extra as `graphifyy[mcp]==0.9.20` so the project-scoped local stdio server is operational. | Approved and verified | User explicit instruction; stdio MCP verification |
| DEC-033 | 2026-07-19 | Adopt `docs/domain/DOMAIN_MODEL.md` and its reconciled PRD, UX, and Graphify artifacts as the completed Stage 4 domain baseline. | Approved | User explicit phase completion instruction |
| DEC-034 | 2026-07-19 | Revoke access immediately after confirmed account deletion and use a durable, idempotent process to physically purge the User and all primary owned data; defer backup expiry and deletion evidence to Privacy and Architecture. | Approved | User approved the recommended Stage 5 data decision package |
| DEC-035 | 2026-07-19 | Enforce global uniqueness for a normalized verified primary email across retained Users; a matching Google email cannot create a second User or auto-link an identity. | Approved | User approved the recommended Stage 5 data decision package |
| DEC-036 | 2026-07-19 | Persist independent opaque rank keys for Global and Area Kanban ordering, with optimistic conflict checks and deterministic Task-ID tie-breaking. | Approved | User approved the recommended Stage 5 data decision package |
| DEC-037 | 2026-07-19 | Draft `docs/data/DATA_MODEL.md` as the Stage 5 conceptual data baseline without Prisma schema, migration, SQL, API schema, or production application code. | Approved by DEC-038 | User instruction to begin Stage 5 |
| DEC-038 | 2026-07-20 | Adopt `docs/data/DATA_MODEL.md` and its synchronized Graphify artifacts as the completed Stage 5 data-design baseline. | Approved | User explicitly confirmed Stage 5 approval |
| DEC-039 | 2026-07-20 | Use opaque server-side sessions in protected host-only cookies, session-bound CSRF protection, and Google Authorization Code flow with PKCE S256, state, and nonce; never expose reusable browser tokens. | Approved | User selected option 1A; Stage 6 approval |
| DEC-040 | 2026-07-20 | Preserve explicit re-authenticated Google identity linking and the existing prohibition on automatic email-match linking in every authentication endpoint. | Approved | User selected option 1A; DEC-029, DEC-035, and Stage 6 approval |
| DEC-041 | 2026-07-20 | Use strong ETag/`If-Match` preconditions for single-resource concurrency and `Idempotency-Key` for resource creation and retry-sensitive commands; report bulk Task outcomes per independently atomic item. | Approved | User selected option 2A; Stage 6 approval |
| DEC-042 | 2026-07-20 | Use opaque cursor pagination for growing top-level collections while keeping small aggregate-contained status, checklist, and reminder collections bounded and unpaginated. | Approved | User selected option 3A; Stage 6 approval |
| DEC-043 | 2026-07-20 | Return the same non-disclosing `404 RESOURCE_NOT_FOUND` behavior for missing, foreign-owned, deleted, wrong-parent, or otherwise unavailable private resources. | Approved | Mandatory user security rule; BR-OWN-010, UXF-027, and Stage 6 approval |
| DEC-044 | 2026-07-20 | Draft `docs/api/API_CONTRACT.md` as the conceptual Stage 6 REST, authentication, and security baseline without controllers, OpenAPI output, schemas, migrations, SQL, or production application code. | Approved by DEC-046 | User instruction to begin Stage 6 |
| DEC-045 | 2026-07-20 | Persist a default-Enabled User preference for future in-app reminder Notifications; disabling preserves reminder definitions and existing Notifications, resolves due reminders as Suppressed, and never backfills them after re-enabling. | Approved | User selected option 4B |
| DEC-046 | 2026-07-20 | Adopt `docs/api/API_CONTRACT.md` and the reconciled PRD, UX, Domain, Data, and Graphify artifacts as the completed Stage 6 API-design baseline. | Approved | User explicitly approved Stage 6 |
| DEC-047 | 2026-07-20 | Run web, API, and worker as separate processes/containers while keeping API and worker in the same `apps/api` modular-monolith codebase, release, and image. | Approved | User selected option 1A |
| DEC-048 | 2026-07-20 | Use PostgreSQL for sessions, idempotency, durable job leasing, reminders, expiry, and purge coordination; do not add Redis for MVP and begin with one API and one worker replica. | Approved | User selected option 2A |
| DEC-049 | 2026-07-20 | Use `develop` as the protected integration branch and `main` as the protected release branch; deploy portable containers behind one same-origin reverse proxy with managed PostgreSQL. | Approved | User selected option 3A |
| DEC-050 | 2026-07-20 | Limit backup retention to 30 days and require privacy-minimized deletion replay before a restored environment serves traffic. | Approved | User selected option 3A |
| DEC-051 | 2026-07-20 | Adopt domain-aligned backend modules for accounts, planning, tasks, notifications, lifecycle, work views, and onboarding; prohibit global technical controller/service ownership and cross-module repository access. | Approved | `docs/architecture/ARCHITECTURE.md`; ADR-001; explicit Stage 7 approval |
| DEC-052 | 2026-07-20 | Generate and commit a backend-owned OpenAPI 3.1 contract and generate the Fetch-based frontend client from it; make contract validation, compatibility, and drift checks CI gates. | Approved | `docs/architecture/ARCHITECTURE.md`; ADR-002; explicit Stage 7 approval |
| DEC-053 | 2026-07-20 | Keep shadcn/ui components inside `apps/web` and defer `packages/ui` until a second real consumer or independently governed design-system boundary exists. | Approved | `docs/architecture/ARCHITECTURE.md`; explicit Stage 7 approval |
| DEC-054 | 2026-07-20 | Adopt the Stage 7 architecture, security, observability, migration, CI, testing, accessibility, i18n, dependency, and Graphify strategies as implementation-ready planning constraints. | Approved | `docs/architecture/ARCHITECTURE.md`; ADR-001 through ADR-003; explicit Stage 7 approval |

## Open questions

The product boundary is defined in the approved PRD, and UX decisions are recorded in the approved UX document. The following decisions are intentionally deferred and must not be silently assumed:

- What exact visual language, density, and final Turkish interface copy should be adopted without changing the approved UX hierarchy?
- Which exact production provider, region, reverse proxy/ingress, secret manager, monitoring sink, and backup/PITR features will be selected at deployment time?
- What measured reference dataset and execution environment should turn the proposed performance targets into release gates?
- Does the implementation proof confirm `@hey-api/openapi-ts` as the generator for every required OpenAPI 3.1, cookie, nullable, and RFC 9457 shape, or must the generator choice be reopened?

## Risks

| Risk | Current response |
| --- | --- |
| The active Node.js version is 25.8.1 rather than the fixed Node.js 24 LTS version. | Resolve and pin the runtime before application scaffolding. |
| The approved PRD and UX document form a meaningful Graphify corpus that will evolve in later planning stages. | Update the graph after approved planning changes; record metadata and review outputs before version control. |
| Removing or failing to refresh `graphify-out/graph.json` would make the Graphify MCP unavailable or stale. | Keep the graph versioned and refresh it after approved planning changes that materially affect its contents. |
| The Graphify MCP runtime can become unavailable if its optional dependency is omitted during a global tool reinstall. | Reproduce the pinned installation as `uv tool install 'graphifyy[mcp]==0.9.20'` and re-run the stdio tool-call verification after any reinstall. |
| Project-scoped Codex configuration is loaded only for trusted repositories. | Confirm repository trust and restart Codex after enabling MCP. |
| The MCP registration contains machine-local absolute paths required by the current stdio setup. | Revalidate or update those paths when the repository is used on another machine. |
| A global Graphify tool installation can drift if upgraded outside the project. | Record and reproduce the approved version explicitly. |
| Shareable Graphify output could accidentally include local or sensitive artifacts. | Apply `.graphifyignore` and Git ignore rules; review generated artifacts before version control. |
| Graphify 0.9.20 force-includes `graphify-out/memory/` even when the directory is ignored, which can make derived query notes re-enter the source corpus. | Restrict each detection/extraction set to approved source paths before merge and verify `source_file` values in the final graph. |
| Parent lifecycle behavior can become inconsistent across Area, Project, and Task. | Apply the Stage 4 cascade-provenance and coherent-restore rules; validate their data representation during Data Design. |
| Dual recurrence modes and multiple reminders create time-zone and duplication risks. | Apply the one-open-occurrence, completion-triggered generation, no-backfill, stable-time, and idempotency rules; define operational delivery during Architecture. |
| Area-specific statuses can drift from their global meaning. | Apply the approved one-mapping, per-group default, retirement-reassignment, and canonical-transition rules. |
| Global bulk status changes may select different local statuses across Areas. | Apply each Task Area's approved default mapping independently and keep the UX outcome explicit. |
| Compact Kanban interaction can become difficult to navigate or inaccessible. | Preserve named status-selection and keyboard alternatives to drag-and-drop. |
| The Stage 4 graph reports 25 weakly connected leaf nodes and two thin communities. | Source review confirmed that most are intentionally leaf-level concepts and that `Future Considerations` is the only fully isolated node; continue verifying graph gaps against source documents. |
| Conditional uniqueness for one open recurrence occurrence and one active default AreaStatus may not be expressible by a future high-level ORM schema alone. | Preserve the approved invariant through an explicit database constraint or an equally strong serialized mechanism during physical schema design. |
| Redundant ownership fields could drift from parent ownership if treated as ordinary mutable data. | Keep ownership immutable and use owner-inclusive candidate keys and referential constraints at every relationship boundary. |
| Account deletion can stall after access revocation while primary rows remain. | Track one durable deletion process, make purge steps idempotent, and do not report primary purge complete until no User-owned primary data remains. |
| Cookie sessions can introduce CSRF, fixation, and cross-origin configuration risk. | Require session-bound CSRF tokens, Origin validation, rotation after sensitive transitions, protected host-only cookies, and an explicit Architecture origin policy. |
| Authentication and private-resource errors can become account or resource enumeration oracles. | Keep public auth responses generic and collapse unavailable private resources to one ownership-first `404` outcome. |
| Client retries or stale views can duplicate commands or overwrite newer Task/lifecycle/ordering state. | Require Idempotency-Key and ETag/If-Match at the approved boundaries while retaining database/domain uniqueness and atomicity guards. |
| Generated OpenAPI and frontend transport types can drift from runtime behavior. | Generate deterministically from backend contract metadata, commit the artifact, fail CI on drift/breaking change, and regenerate/type-check the client. |
| A User can disable reminder Notifications and misunderstand the no-backfill result or race with a due reminder. | Default the preference to Enabled, explain suppression explicitly, use User version preconditions, and resolve each due reminder atomically as Triggered or Suppressed. |
| PostgreSQL-backed jobs can contend with API transactions or accumulate after worker failure. | Use bounded leasing, `SKIP LOCKED`, idempotent handlers, retry limits, queue-age metrics, one initial worker replica, and measured capacity before scaling. |
| One API replica makes in-process general rate limiting effective but not horizontally portable. | Persist authentication abuse counters in PostgreSQL and require a rate-limit design review before adding API replicas. |
| Same-origin proxy configuration can weaken CSRF, secure-cookie, or client-IP controls when forwarded headers are trusted incorrectly. | Disable production CORS, validate unsafe origins, configure an exact trusted proxy hop count, and test the deployed headers/cookies. |
| A backend-generated OpenAPI document can be syntactically valid while omitting runtime error or authorization behavior. | Combine deterministic generation and lint/diff checks with Supertest contract and cross-user isolation tests. |
| Restoring a database backup can resurrect data for accounts deleted after the restore point. | Keep backups at or below 30 days and require privacy-minimized deletion replay before restored traffic is enabled. |
| Graphify can suggest a module boundary that contradicts an authoritative rule or overemphasizes extraction density. | Treat graph communities as review input, verify every boundary against source documents, and retain explicit orchestration for cross-aggregate transactions. |

## Document index

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/PROJECT_MASTER.md` | Master planning state, decisions, risks, approvals, and document index. | Active |
| `docs/product/PRD.md` | MVP product problem, scope, users, journeys, requirements, acceptance criteria, risks, and UX entry criteria. | Approved, including Stage 3, Stage 4, and Stage 6 reconciliations |
| `docs/product/UX_FLOWS.md` | Information architecture, routes, navigation, primary flows, interaction states, responsiveness, accessibility, and PRD traceability. | Approved; Stage 4 and Stage 6 decisions reconciled |
| `docs/domain/DOMAIN_MODEL.md` | Domain language, ownership, concepts, invariants, state transitions, recurrence, lifecycle, and business rules. | Approved Stage 4 baseline with Stage 6 notification-preference amendment |
| `docs/data/DATA_MODEL.md` | Conceptual entities, relationships, identifiers, ownership, integrity, lifecycle, retention, ordering, transactions, concurrency, and candidate indexes. | Approved Stage 5 baseline with Stage 6 notification-preference amendment |
| `docs/api/API_CONTRACT.md` | Conceptual REST routes, authentication/session security, ownership, errors, pagination, idempotency, concurrency, OpenAPI responsibility, and generated-client policy. | Approved Stage 6 baseline |
| `docs/architecture/ARCHITECTURE.md` | Implementation-ready workspace, runtime, module, security, data, operations, CI, testing, accessibility, i18n, and Graphify strategy. | Approved Stage 7 baseline |
| `docs/architecture/adr/ADR-001-modular-monolith.md` | Decision record for the modular monolith and separate API/worker runtime entry points. | Accepted |
| `docs/architecture/adr/ADR-002-rest-openapi.md` | Decision record for REST, backend-owned OpenAPI, and generated frontend client. | Accepted |
| `docs/architecture/adr/ADR-003-graphify.md` | Decision record for Graphify use, source authority, update/MCP workflow, staleness, versioning, and secret controls. | Accepted |
| `.graphifyignore` | Prevent sensitive, generated, dependency, and tool-internal content from being indexed. | Active |
| `.gitignore` | Prevent secrets, generated output, local caches, Graphify cost data, and temporary Graphify files from being versioned. | Active |
| `.agents/skills/graphify/SKILL.md` | Official project-scoped Graphify workflow. | Installed |
| `.codex/config.toml` | Project-scoped Graphify stdio MCP registration. | Enabled and runtime-verified; Codex reload may be required for session tool discovery |
| `graphify-out/graph.json` | Shareable machine-readable planning knowledge graph. | Generated |
| `graphify-out/GRAPH_REPORT.md` | Human-readable graph analysis and audit report. | Generated |
| `graphify-out/graph.html` | Shareable interactive graph visualization. | Generated |
| `graphify-out/manifest.json` | Relative-path input manifest for incremental Graphify updates. | Generated |

New planning documents must be added to this index when created.

## Graphify status

- Global CLI: installed with `uv tool`.
- Project skill: installed using the official `agents` platform target at `.agents/skills/graphify`.
- Skill instructions: fully read again for Stage 7 on 2026-07-20.
- Task-relevant references read for Stage 7: `.agents/skills/graphify/references/update.md`, `.agents/skills/graphify/references/query.md`, `.agents/skills/graphify/references/extraction-spec.md`, and `.agents/skills/graphify/references/exports.md`.
- Graph generation: completed as a verified full rebuild from the ten current planning documents after the incremental shrink guard detected a net reduction during `PROJECT_MASTER` re-extraction.
- Graph health: passed with no missing endpoints, dangling edges, self-loops, duplicate endpoint collapse, or directed/undirected same-endpoint collapse after retaining 11 still-valid master decision nodes and deduplicating three reciprocal ADR reference pairs for the undirected graph.
- Source-scope control: Graphify 0.9.20 force-includes `graphify-out/memory/` despite repository ignore patterns, so detection/extraction was explicitly restricted to the ten intended `docs/` sources before the rebuild.
- Sensitive-path review: completed; the report title was sanitized, the graph contains relative document paths only, and Graphify local learning, memory, reflection, vocabulary, incremental, and cost artifacts are excluded from version control.
- Intended use: architecture discovery and impact analysis.
- Version-control policy: track the project skill and shareable `graphify-out` artifacts, excluding local/intermediate files and `cost.json`.

Verified Stage 4 graph findings:

- The Domain Model is a graph hub connected to the PRD, UX flows, Project Master, consistency boundaries, lifecycle rules, recurrence rules, traceability, risks, and the Data Design gate.
- Recurrence and notifications form a cross-document community joining PRD requirements, UX recurrence/reminder flows, and the RecurrenceSeries, RecurrenceRule, TaskReminder, and Notification domain concepts.
- Archive and Trash form a cross-document community joining PRD lifecycle requirements, UX restore/retention flows, and the Archive State, Trash State, and parent-propagation rules.
- Ownership and privacy connect the User and private planning model to PRD privacy expectations and the UX non-disclosing failure state.
- The only fully isolated final node is `Future Considerations`, which is intentionally outside the MVP Domain baseline. Weakly cross-linked persona, navigation, and acceptance nodes were checked against source documents and are covered by explicit requirement traceability; no missing required Domain concept was confirmed.

Verified Stage 5 graph findings:

- The Conceptual Data Model is the highest-connectivity graph node and bridges the Domain Model, PRD, Project Master, ownership, lifecycle, recurrence, notifications, identity, ordering, transactions, concurrency, retention, and the API Design gate.
- MCP shortest-path checks found direct one-hop EXTRACTED Domain → Data mappings for User, AuthenticationIdentity, Area, Project, Task, AreaStatus, ChecklistItem, RecurrenceSeries, RecurrenceRule, TaskReminder, Notification, Archive State, and Trash State.
- CanonicalStatus and the combined Label/TaskLabel Data entity use longer graph paths, but source review confirms their explicit Domain and requirement traceability in the Data Model; this is graph extraction density rather than a missing data decision.
- Every reviewed user-owned Data entity reaches User Data Entity through a one-to-four-hop EXTRACTED path. Notification Data Entity has only an indirect graph ownership path, while its source section explicitly requires `userId` and same-owner Task/TaskReminder relationships; no ownerless persisted user entity was confirmed.
- CanonicalStatus is intentionally system-defined rather than User-owned. It is the only reviewed reference concept that must not carry personal ownership.
- The MCP percentage summary rounds the Stage 5 graph to 100% EXTRACTED, 0% INFERRED, and 0% AMBIGUOUS. Raw graph inspection contains 329 EXTRACTED edges, one retained INFERRED semantic-similarity edge between UX Responsive Behavior and the Project Master Responsive Navigation Model, and zero AMBIGUOUS edges. All findings above were checked against the source documents rather than accepted from rounded graph statistics alone.

Verified Stage 6 graph findings:

- Authentication is connected to User-owned resources through the API session, ownership-first lookup, Domain ownership invariants, and Data same-owner boundaries; source review confirmed no authentication-to-ownership gap.
- Task status mutations and completion are connected to recurrence through the one-open-occurrence invariant, completion-triggered successor creation, idempotency, and transaction boundaries; no public mutation bypass was confirmed.
- Trash restore is connected to Area and Project lifecycle provenance. Restore requires the original valid parent chain or an explicit compatible owned destination and never guesses a parent; no restore-link gap was confirmed.
- Every user-facing Domain operation has a conceptual API route or projection. Recurrence successor creation, reminder triggering, automatic Trash expiry, and physical purge remain deliberately internal scheduled or transactional operations rather than public endpoints.
- No product endpoint lacks an approved Domain basis. Session, CSRF, OAuth transaction, and token routes are security-supporting operations grounded in User and AuthenticationIdentity; read projections do not introduce new aggregates.
- The prior UX notification-preferences gap is resolved by DEC-045. PRD, UX, Domain, Data, and API now agree on one default-Enabled User preference, due-time Triggered-or-Suppressed resolution, preserved reminder/history data, and no backfill.
- The approved Stage 6 refresh adds 11 nodes and 45 edges. The resulting graph contains 235 nodes, 475 edges, three hyperedges, and 13 communities; `Notification Preferences and Delivery` contains 22 PRD, UX, Domain, Data, API, and Project Master nodes.
- Raw inspection contains 474 EXTRACTED edges, one retained INFERRED responsive-navigation similarity edge, and zero AMBIGUOUS edges. MCP output and Graphify findings were verified against the planning sources rather than accepted as authoritative on their own.

Verified Stage 7 graph findings:

- `Architecture and Quality Strategy` is the fifth most-connected graph node with 18 edges; `Backend Module Map` has eight edges and the architecture/ADR decisions form a 22-node community with the matching Project Master decisions.
- The proposed `accounts`, `planning`, `tasks`, `notifications`, `lifecycle`, `work-views`, and `onboarding` modules form one cohesive eight-node architecture community with the module map. The graph does not directly attach every module node to every PRD/domain/API node, so source review—not extraction density—was used to verify ownership.
- Source verification confirms that accounts owns authentication and User lifecycle; planning owns Area/Project/status; tasks owns Task/checklist/label/recurrence definitions; notifications owns in-app Notification delivery state; lifecycle coordinates Archive/Trash/restore/purge; work views owns read-only Today/List/Kanban/Search projections; and onboarding coordinates owner-scoped sample creation. No proposed module is without an authoritative responsibility.
- No approved product operation or conceptual endpoint group lacks an architecture owner. Automatic recurrence successor creation remains a tasks transaction, due reminder materialization is notifications/worker work, lifecycle expiry/purge is lifecycle/worker work, and browser views remain web plus read-model responsibilities rather than new aggregates.
- Cross-module recurrence completion and restore behavior remain explicit application-coordinator transactions using shared Prisma transaction context. Ownership is enforced in each application use case and owner-scoped repository boundary; the non-enumerating API policy remains unchanged.
- The full rebuild consolidated the prior 59 Project Master extraction nodes into 22 current master nodes and added 38 architecture/ADR nodes. This changed the graph from 235 nodes/475 edges to 236 nodes/396 edges; the approval-only refresh added one extracted approval relationship for a final 236 nodes/397 edges. Twelve inbound references exposed by the health gate were preserved through 11 still-valid decision-node IDs; no stale decision was retained merely to prevent graph shrinkage.
- MCP reports rounded percentages of 100% EXTRACTED, 0% INFERRED, and 0% AMBIGUOUS. Raw inspection contains 396 EXTRACTED edges, one retained INFERRED responsive-navigation similarity edge, and zero AMBIGUOUS edges. All module conclusions were checked against the source documents.

## Graphify version

- Package: `graphifyy`
- Pinned version: `0.9.20`
- Installed CLI version: `graphify 0.9.20`
- Installed MCP dependency version: `mcp 1.28.1`
- Reproducible installation command: `uv tool install 'graphifyy[mcp]==0.9.20'`
- Python tool environment: Python 3.12.13
- uv version at installation: 0.11.29
- Project skill version stamp: `.agents/skills/graphify/.graphify_version`

The recorded version must not be changed without a decision-log entry and revalidation of the project skill and MCP behavior.

## MCP status

- Transport: local stdio.
- Server module: `python -m graphify.serve`.
- Graph argument: `graphify-out/graph.json` using an absolute repository path.
- Codex configuration scope: project `.codex/config.toml`.
- Registration status: configured and enabled in Codex.
- Runtime status: operational with the pinned `graphifyy[mcp]==0.9.20` installation.
- Verification: the registered MCP successfully called `graph_stats`, `get_community`, `god_nodes`, and targeted `query_graph` operations against the Stage 7 graph. The graph was regenerated on 2026-07-20T14:11:25Z after explicit Stage 7 and ADR approval; the approval-only refresh preserved the previously verified module-boundary conclusions.
- Verified graph response: 236 nodes, 397 edges, and 13 communities. MCP reports rounded percentages of 100% extracted, 0% inferred, and 0% ambiguous; raw counts are 396 EXTRACTED, 1 INFERRED, and 0 AMBIGUOUS edges.
- Available read-oriented tools: `query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, and `shortest_path`.
- Session note: an already-running Codex desktop session may require a reload before the registered MCP tools appear in its dynamic tool list; this does not affect the successful direct stdio runtime verification.

## Last graph generation metadata

| Field | Value |
| --- | --- |
| Status | Successful |
| Generated at | 2026-07-20T14:11:25Z |
| Graphify version | 0.9.20 |
| Source commit at generation | `6c22b063bf47045c99af74e939d59feee32e191d` |
| Input scope | `docs/PROJECT_MASTER.md`, `docs/product/PRD.md`, `docs/product/UX_FLOWS.md`, `docs/domain/DOMAIN_MODEL.md`, `docs/data/DATA_MODEL.md`, `docs/api/API_CONTRACT.md`, `docs/architecture/ARCHITECTURE.md`, and ADR-001 through ADR-003 |
| Output path | `graphify-out/graph.json` |
| Nodes | 236 |
| Edges | 397 |
| Hyperedges | 4 |
| Communities | 13 |
| Graph health | Passed after full-rebuild shrink audit, current-decision node retention, and reciprocal undirected-reference deduplication |
| Recorded semantic tokens | 0 input / 0 output; the collaboration extraction tool did not expose token usage, so this is an unavailable measurement rather than evidence of zero model usage. |
| Reason | Record explicit Stage 7 approval, change ADR-001 through ADR-003 to Accepted, preserve the verified module-boundary findings, and close the architecture phase before publication to `develop`. |

Update this section after every successful graph generation.

## Skill usage policy

- Read a skill's complete `SKILL.md` before using that skill.
- Read only the referenced files required for the current task, but read each selected reference completely.
- Tell the user which skill is being used and why.
- When `graphify-out/graph.json` exists, use Graphify first for architecture and impact-analysis questions unless an explicit rebuild is requested.
- Do not invent graph relationships or hide Graphify integrity warnings.
- Do not use Graphify output as a substitute for source inspection, tests, type checking, or other verification.
- Do not index secrets, credentials, private keys, environment files, dependencies, build output, or Graphify's own output.
- Do not generate an empty or meaningless graph.
- Review Graphify outputs for sensitive or machine-local data before version control.

## Phase approval history

| Date | Phase | Approval state | Evidence |
| --- | --- | --- | --- |
| 2026-07-19 | Workspace and repository inspection | Completed and accepted for continuation | User requested the planning-infrastructure stage after the inspection report. |
| 2026-07-19 | Planning infrastructure and Graphify integration | Completed and approved | User instructed Codex to commit, push to `develop`, and complete the phase. |
| 2026-07-19 | Stage 2 — Product requirements / PRD | Completed and approved | User reviewed the PRD controls, published the artifact, and explicitly instructed progression to Stage 3. |
| 2026-07-19 | Stage 3 — UX flows and information architecture | Completed and approved | User explicitly instructed Codex to accept the phase as complete and publish it to `develop`. |
| 2026-07-19 | Stage 4 — Domain analysis | Completed and approved | User explicitly declared the stage complete and requested publication to `develop`. |
| 2026-07-20 | Stage 5 — Data design | Completed and approved | User explicitly confirmed Stage 5 approval after publication to `develop`. |
| 2026-07-20 | Stage 6 — API design | Completed and approved | User selected persisted in-app Notification preferences through option 4B and explicitly approved Stage 6. |
| 2026-07-20 | Stage 7 — Solution architecture | Completed and approved | User explicitly accepted ADR-001, ADR-002, and ADR-003 and instructed Codex to approve and publish the stage. |

## Current planning stage

Stage 7 — Solution Architecture — is completed and approved. `docs/architecture/ARCHITECTURE.md` is the approved baseline and ADR-001 through ADR-003 are Accepted; no production implementation, Prisma schema, migration, SQL, controller, React component, or OpenAPI artifact has been created.

## Next required action

Await explicit user instruction to begin Stage 8 — Backlog Planning. Do not create production application code while the planning sequence remains active.
