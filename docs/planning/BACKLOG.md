# Personal Task Planner — Lean Implementation Backlog

| Field | Value |
| --- | --- |
| Status | L-005 implemented and approved; L-006 implemented and ready for approval |
| Revision date | 2026-08-19 |
| Product scope | MVP, personal use only |
| Document language | English |
| Execution mode | Small vertical slices, but not one micro-story per technical concern |
| Current completed baseline | EPIC-001; BL-007 through BL-011; BL-014; BL-015; BL-121; L-001; L-002; L-003; L-004; L-005; L-006 |
| Next slice | L-007 — User adds checklist and labels to Tasks |

This document replaces the earlier over-granular execution queue. The approved PRD, UX, Domain, Data, API, Architecture, and ADR documents remain authoritative for product and technical rules. This backlog controls implementation order only.

## 1. Why the backlog was refactored

The original Stage 8 backlog decomposed the MVP into more than one hundred implementation rows. That level of granularity created planning overhead, repeated Graphify work, and disproportionate token use for changes that were often one or two focused commits.

The revised backlog keeps the same MVP boundary but changes how work is executed:

- Group adjacent micro-stories into coherent vertical slices that can be completed in one implementation cycle.
- Keep already completed stories closed; do not re-plan or re-implement them.
- Prefer one decision-complete plan per slice, then implementation, tests, bounded Graphify update, documentation, user acceptance, commit, push, and CI.
- Avoid new architecture, frameworks, services, or abstractions unless a slice cannot meet an approved requirement without them.
- Use Graphify proportionally: one targeted existing-graph query before implementation when useful, one incremental update after meaningful source changes, and no full rebuild unless the approved policy requires it.

## 2. Completed baseline — do not repeat

These items are complete, published to `develop`, and CI-verified. Future slices may build on them but must not redo them.

| Completed item | Outcome | Evidence |
| --- | --- | --- |
| EPIC-001 / BL-001–BL-006 / SPIKE-001 | Repository foundation, workspace, quality gates, OpenAPI/client pipeline, Docker/PostgreSQL, worker baseline, CI, and security gates. | Completed and published before authentication implementation. |
| BL-007 | Email/password registration with non-enumerating retained-email behavior. | Published and verified. |
| BL-008 | Email verification and resend with durable SMTP delivery. | Published and verified. |
| BL-009 | Login, safe return path, cookie session, and abuse limits. | Commit `1fc5514`, CI `30177705743`. |
| BL-010 | Current-device sign-out. | Commit `636c373`, CI `30179467625`. |
| BL-011 | Password recovery/reset. | Commit `4e33e2f`, CI `30519298773`. |
| BL-014 | Current user profile `/users/me` with ETag and no arbitrary user lookup. | Commit `b012e8a`, CI `30526911410`. |
| BL-015 | Account deletion initiation with recent reauth, explicit confirmation, durable process, and all-session revocation. | Commit `c7907ab`, CI `30738500840`. |
| BL-121 | Public product, privacy, and terms entry points. | Commit `9135165`, CI `30738996032`. |
| L-001 | Authenticated onboarding welcome and private Area → optional Project → Task model explanation. | Commit `b73836d`, CI `30791344719`. |
| L-002 | Onboarding preference and current-user time-zone confirmation. | Commit `5580a48`, CI `31682908571`. |
| L-003 | Start-empty onboarding completion and Today handoff. | Commit `1c66322`, CI `32012029837`. |
| L-004 | Private sample data creation with Area, AreaStatuses, Project, Tasks, Label, TaskLabel, ChecklistItems. | Commit `095560b`, CI `32017453871`. |
| L-005 | User manages Areas. Create/list/detail/rename active owned Areas with default workflow. | Implemented, locally verified, and approved. |
| L-006 | User creates and edits basic Tasks directly under an Area. | Implemented, locally verified, and approved. |
| L-007 | Checklist and Labels for Tasks. | Implemented, locally verified, and approved. |

Reserved/deferred IDs `BL-012` and `BL-013` remain reserved for removed social-authentication work and must not be reused.

## 3. Lean execution rules

Each slice must produce user-visible or operator-visible value and include all necessary frontend, backend, database, contract, and test work for that value.

Use this lightweight cycle:

1. Confirm the next slice from this backlog.
2. Read only the authoritative source sections needed for that slice.
3. Run one bounded Graphify query when it can reduce impact uncertainty.
4. Produce a concise implementation plan.
5. Implement only that slice.
6. Run proportionate checks:
   - UI-only: `format:check`, `typecheck`, `lint`, `test:component`, `build`, relevant E2E, `test:security`.
   - API/schema: add `test:unit`, `test:api`, `test:db`, `test:contract`, Prisma checks.
   - Worker/data-risk slices: include Testcontainers and migration deploy.
7. Run one incremental Graphify update after meaningful source changes.
8. Update `PROJECT_MASTER.md` and this backlog.
9. Ask for user acceptance.
10. Commit/push only after explicit acceptance or explicit publish instruction, then verify CI.

Do not perform these by default:

- Full document rereads when the needed decision can be verified from a targeted section.
- Full Graphify rebuilds.
- Broad architecture refactors.
- Horizontal “backend first” or “frontend first” stories.
- New shared packages.
- New infrastructure services.
- Premature custom workflow engines, automation, analytics, exports, or mobile/provider abstractions.

## 4. Revised MVP delivery sequence

### Group A — Onboarding and first usable private space

| Slice | Goal | Includes | Excludes | Primary tests |
| --- | --- | --- | --- | --- |
| L-001 | First-time user understands Area → optional Project → Task. | Authenticated onboarding welcome route, Turkish explanation, private-space framing, keyboard/responsive UI, no team/collaboration copy. | Time-zone persistence, sample data, Area/Task tables. | Component, E2E, accessibility assertions. |
| L-002 | User confirms onboarding preference and time zone. | Confirm/change IANA time zone, update User onboarding state as needed, ETag/precondition behavior, safe retry. | Sample content creation. | API, component, E2E, contract if endpoint changes. |
| L-003 | User can start with an empty private space. | Explicit “start empty”, onboarding completion, Today handoff, idempotent retry. | Sample Area/Project/Task creation. | API, DB, E2E. |
| L-004 | User can create the complete private sample set. | One sample Area with default statuses, optional Project, representative Tasks, Label, Checklist; atomic and idempotent. | General Area/Task management UI beyond sample path. | Unit, API, DB, E2E. |

### Group B — Core planning data: Areas, Projects, Tasks

| Slice | Goal | Includes | Excludes | Primary tests |
| --- | --- | --- | --- | --- |
| L-005 | User manages Areas. | Create/list/detail/rename active owned Areas with default workflow. | Archive/Trash, custom statuses, sharing. | API, DB, component, E2E, contract. |
| L-006 | User creates and edits basic Tasks directly under an Area. | Title, description, dates, priority, status default, owner isolation, optimistic/stale checks. | Projects, recurrence, reminders, Kanban. | Unit, API, DB, component, E2E, contract. |
| L-007 | User adds checklist and labels to Tasks. | Ordered checklist items, owner-scoped labels, label uniqueness, task label assignment/removal. | Search facets, bulk labels. | API, DB, component. |
| L-008 | User manages Projects inside Areas. | Create/list/detail/rename Projects, assign Task to Project, same-Area invariant. | Moving Projects between Areas if it complicates first release. | Unit, API, DB, component, E2E. |

### Group C — Work views

| Slice | Goal | Includes | Excludes | Primary tests |
| --- | --- | --- | --- | --- |
| L-009 | User can use the global active List view. | Owned active Tasks, Area/Project context, sorting options, empty/loading/error states. | Search, advanced filters, manual list ordering. | API, DB, component, E2E. |
| L-010 | User can use Today planning. | Due/overdue/today/upcoming buckets, deterministic date behavior, quick status changes. | Calendar UI, capacity planning, daily notes. | Unit, API, DB, component, E2E. |
| L-011 | User can use basic Global Kanban. | Canonical status columns, manual rank, accessible move controls, owner isolation. | Area-specific custom statuses. | Unit, API, DB, component, E2E. |
| L-012 | User can use Area Kanban. | Area-specific columns using current Area statuses, independent Area rank. | Workflow editor complexity beyond needed status setup. | API, DB, component, E2E. |

### Group D — Workflow customization

| Slice | Goal | Includes | Excludes | Primary tests |
| --- | --- | --- | --- | --- |
| L-013 | User can view and edit Area statuses safely. | Active/retired statuses, canonical mapping, one default per canonical group, reorder, stale-safe save. | Automation, WIP limits, Project-specific statuses. | Unit, API, DB, component, E2E. |
| L-014 | User can apply status changes consistently across views. | Exact Area status changes and canonical global changes resolving to Area defaults. | Bulk status changes. | Unit, API, DB, component. |

### Group E — Power features

| Slice | Goal | Includes | Excludes | Primary tests |
| --- | --- | --- | --- | --- |
| L-015 | User can create and complete recurring Tasks. | Fixed-calendar recurrence, one open occurrence, successor on completion, no backfill. | Advanced recurrence endings, cron text, multiple open occurrences. | Unit, API, DB, component, E2E. |
| L-016 | User can search and filter active work. | Title/description search, basic filters, owner-leading query scope, stable pagination. | External search engine, fuzzy semantic search, archived/trash search. | API, DB, component, E2E. |
| L-017 | User can perform basic bulk actions. | Selection mode, bulk status/label/date/lifecycle where already supported, partial result feedback. | Arbitrary field bulk edit, hidden “select all across everything”. | API, component, E2E. |
| L-018 | User receives in-app date notifications. | Reminder preference, due notification creation, read/unread list, worker idempotency. | Email/SMS/native/browser push, snooze. | Unit, API, DB, component, E2E. |

### Group F — Lifecycle and release hardening

| Slice | Goal | Includes | Excludes | Primary tests |
| --- | --- | --- | --- | --- |
| L-019 | User can Archive and restore Areas, Projects, and Tasks. | Archive lifecycle state, cascade provenance, restore rules. | Trash/permanent deletion. | Unit, API, DB, component, E2E. |
| L-020 | User can Trash and restore owned planning data. | 30-day purgeAfter, restore destination rules, no active-view leakage. | Account primary purge worker unless needed for this slice. | Unit, API, DB, component, E2E. |
| L-021 | System completes durable permanent purge. | Planning-data purge jobs, idempotent deletion replay, no title/content in receipts. | Legal hold/export. | Unit, DB, API, security. |
| L-022 | MVP responsive/accessibility hardening pass. | Keyboard/reflow/focus/semantic review across shipped flows, fixes only. | Redesign, second language. | Component, E2E, accessibility checklist. |
| L-023 | Release readiness. | Final traceability, CI evidence, migration/deploy rehearsal, known risks, rollback note. | New product functionality. | Full CI, release checklist. |

## 5. Requirement coverage checkpoint

The lean slices preserve coverage of the approved MVP:

- Authentication and account lifecycle: completed baseline plus L-021 for final purge.
- Onboarding: L-001 through L-004.
- Area/Project/Task model: L-005 through L-008.
- List, Today, Kanban, statuses: L-009 through L-014.
- Recurrence, search, filters, bulk, notifications: L-015 through L-018.
- Archive, Trash, purge, release quality: L-019 through L-023.

Before each slice, verify the exact requirement IDs from PRD and API/Domain/Data documents only for that slice. Do not repeat full-corpus traceability unless a release/readiness slice requires it.

## 6. Immediate next implementation plan

### L-001 — Onboarding welcome and model explanation

**Implementation status:** Completed, accepted, committed, published, and CI-verified on 2026-08-13.

**Story goal:** A first-time authenticated user understands the private Area → optional Project → Task model before creating or importing any planning data.

**Acceptance criteria:**

- The onboarding welcome route is reachable only through the authenticated app boundary.
- The page explains:
  - Area is the required responsibility context.
  - Project is optional and belongs under an Area.
  - Task always belongs to an Area and may optionally belong to a Project in that Area.
  - The product is personal/private; team, organization, collaboration, billing, social-authentication, and native-mobile concepts are not introduced.
- The page is Turkish, responsive, keyboard accessible, and has clear loading/error/unauthenticated behavior through the existing session boundary.
- No database schema, API endpoint, onboarding completion mutation, Area creation, Project creation, Task creation, or sample data is introduced.

**Expected files/subsystems:**

- `apps/web/src/app/app/onboarding/page.tsx`
- `apps/web/src/features/onboarding/*` or equivalent local component folder if useful.
- Existing auth/session boundary may be reused without broad refactor.
- `tests/e2e/foundation.spec.ts` or a focused onboarding E2E test.
- Component tests for onboarding copy and accessibility.
- `docs/PROJECT_MASTER.md`
- `docs/planning/BACKLOG.md`
- `graphify-out/*` after implementation.

**API and schema impact:** None expected.

**Security checks:** No user data or resource existence disclosure. Unauthenticated users must be redirected or blocked through the existing app authentication pattern.

**Required tests:** Component, E2E, type-check, lint, build, security scan. Full API/DB/contract tests are not required unless implementation unexpectedly touches backend/API/schema.

**Risks:** The main risk is scope creep into L-002/L-004. Do not persist time zone, complete onboarding, or create sample records in L-001.

### L-002 — Onboarding preference and time-zone confirmation

**Implementation status:** Completed, accepted, committed, published, and CI-verified on 2026-08-13.

**Story goal:** A first-time authenticated user confirms whether they want to start empty or later create sample data, and stores a supported IANA time zone on the current account.

**Implemented scope:**

- `PATCH /api/v1/users/me` updates only the current authenticated User time zone.
- The mutation requires CSRF protection and `If-Match` precondition handling.
- Unsupported time zones are rejected before mutation.
- The onboarding UI collects the start-empty/sample-data choice and time zone in Turkish.
- The transient onboarding choice is intentionally not persisted in L-002; onboarding completion and sample data creation remain L-003/L-004.
- No Area, Project, Task, Label, Checklist, sample data, onboarding completion, or schema migration was introduced.

**Required acceptance checks:**

- User can confirm a supported time zone from the onboarding page.
- Stale profile ETags produce a retryable precondition error.
- Generated OpenAPI/client artifacts expose the current-user update.
- Tests confirm no onboarding completion/sample-data/planning-data endpoint is called in this slice.

### L-003 — Start-empty onboarding completion and Today handoff

**Implementation status:** Completed, published, and CI-verified on 2026-08-17.

**Story goal:** A first-time authenticated user can explicitly start with an empty private space, complete onboarding idempotently, and continue to Today without creating sample planning data.

**Implemented scope:**

- `POST /api/v1/users/me/onboarding-completions` accepts only `START_EMPTY` in this slice.
- The mutation requires an authenticated session, CSRF, `If-Match`, and `Idempotency-Key`.
- The User onboarding state is set to `COMPLETED` with `onboardingCompletedAt`.
- Replaying the same idempotent request returns the same completion result.
- The onboarding UI updates the time zone first, completes `START_EMPTY`, and redirects to `/app/today`.
- Selecting `CREATE_SAMPLE_DATA` still saves only the time zone and keeps sample creation deferred to L-004.
- No Area, Project, Task, Label, Checklist, or sample data is created.

**Local verification evidence:**

- `pnpm install`
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e -- tests/e2e/foundation.spec.ts`
- `pnpm prisma:validate`
- `docker-compose config`
- `pnpm test:security`
- `graphify update .`

### L-004 — Private sample data creation

**Implementation status:** Completed, accepted, published, and CI-verified on 2026-08-17.

**Story goal:** A first-time authenticated user can create a complete private editable sample set, complete onboarding idempotently, and continue to Today.

**Implemented scope:**

- `POST /api/v1/users/me/onboarding-completions` now accepts `CREATE_SAMPLE_DATA` and `START_EMPTY`.
- `CREATE_SAMPLE_DATA` creates one owned Area, three default AreaStatuses, one Project, three representative Tasks, one Label, TaskLabel links, and ChecklistItems in one transaction.
- Sample data is ordinary user-owned planning data and has no privileged/shared status.
- The mutation keeps session, CSRF, `If-Match`, and `Idempotency-Key` requirements.
- Replaying the same sample-data request returns the same completion result without duplicate planning records.
- The onboarding UI updates time zone first, completes the selected onboarding choice, and redirects to `/app/today`.
- General Area, Project, Task, Label, Checklist, List, Kanban, Today data UI, Archive, Trash, recurrence, reminders, collaboration, and social authentication remain deferred.

**Local verification evidence:**

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e -- tests/e2e/foundation.spec.ts`
- `pnpm prisma:validate`
- `pnpm prisma:migrate:deploy`
- `pnpm test:security`

**CI evidence:** Commit `095560b`, CI run `32017453871` succeeded.

### L-005 — Area Management

**Implementation status:** Completed, locally verified, and approved on 2026-08-19.

**Story goal:** User can create, list, view details, and rename active owned Areas with default workflow.

**Implemented scope:**

- Planning module (`apps/api/src/modules/planning/`) with clean architecture: domain, application, infrastructure, transport layers.
- `GET /api/v1/areas` — list active Areas with cursor pagination and task/project/overdue counts.
- `POST /api/v1/areas` — create Area with three default AreaStatuses (To Do, In Progress, Completed).
- `GET /api/v1/areas/{areaId}` — get Area detail with statuses and counts.
- `PATCH /api/v1/areas/{areaId}` — rename Area with ETag/If-Match concurrency.
- All endpoints use session-derived owner isolation, CSRF protection, and idempotency where required.
- Generated OpenAPI spec and client updated.
- Frontend routes: `/app/areas` (list), `/app/areas/[areaId]` (detail).
- Frontend components: AreaList, AreaDetail, CreateAreaForm, RenameAreaForm.
- Unit, API integration, and component tests.

### L-006 — Basic Task Creation and Editing

**Implementation status:** Implemented, locally verified, and approved on 2026-08-19.

**Story goal:** User can create, view, list, and edit basic Tasks directly under an owned Area.

**Implemented scope:**

- Task module in planning domain: entity types, repository, service, controller, validation schema, DTOs.
- `POST /api/v1/areas/{areaId}/tasks` — create Task with title, description, dates, priority, default To Do status.
- `GET /api/v1/areas/{areaId}/tasks` — list Tasks within an Area with cursor pagination.
- `GET /api/v1/tasks/{taskId}` — get Task detail with all fields.
- `PATCH /api/v1/tasks/{taskId}` — edit Task fields with ETag/If-Match concurrency.
- Owner isolation, CSRF protection, and idempotency where required.
- Generated OpenAPI spec and client updated.
- Frontend: create task form, task detail view, task list in Area context.
- Unit, API integration, component, and contract tests.

**Plan document:** `docs/planning/L-006_TASK_CREATION_PLAN.md`

## 7. Backlog maintenance policy

Update this file only when:

- a slice is completed, accepted, published, and CI-verified;
- a slice must be split because it no longer fits one implementation cycle;
- the user explicitly changes product scope;
- a later source document creates a real contradiction.

Do not expand this backlog back into micro-stories unless there is a demonstrated delivery problem that the lean queue cannot solve.
