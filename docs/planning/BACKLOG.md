# Personal Task Planner — Lean Implementation Backlog

| Field | Value |
| --- | --- |
| Status | L-001 through L-026 implemented (incl. Kanban v2 search/filter + drag-and-drop) |
| Revision date | 2026-09-20 |
| Product scope | MVP, personal use only |
| Document language | English |
| Execution mode | Small vertical slices, but not one micro-story per technical concern |
| Current completed baseline | EPIC-001; BL-007 through BL-011; BL-014; BL-015; BL-121; L-001 through L-026 |
| Next slice | L-027 through L-031 planned (see §6) — await implementation decision |

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
| L-008 | User manages Projects inside Areas. | Implemented, locally verified, and approved. |
| L-009 | User can use the global active List view. | Implemented, locally verified, and approved. |
| L-010 | User can use Today planning. | Implemented, locally verified, and approved. |
| L-011 | User can use basic Global Kanban. | Implemented, locally verified, and approved. |
| L-012 | User can use Area Kanban. | Implemented, locally verified, committed `903a8de`. |
| L-013 | User can view and edit Area statuses safely. | Implemented, locally verified, committed `c27501b`. |
| L-014 | User can apply status changes consistently across views. | Implemented, locally verified, committed `2a3999d`. |
| L-015 | User can create and complete recurring Tasks. | Implemented, locally verified, committed `043fb87`. |
| L-016 | User can search and filter active work. | Implemented, locally verified, committed `10a825e`. |
| L-017 | User can perform basic bulk actions. | Implemented, locally verified, committed `0fc3034`. |
| L-018 | User receives in-app date notifications. | Implemented, locally verified, committed `51613e9`. |
| L-019 | User can Archive and restore Areas, Projects, and Tasks. | Implemented, locally verified, committed `54c0479` (with L-020). |
| L-020 | User can Trash and restore owned planning data. | Implemented, locally verified, committed `54c0479` (with L-019). |
| L-021 | System completes durable permanent purge. | Implemented, locally verified, committed `e3a3f81`. |
| L-022 | MVP responsive/accessibility hardening pass. | Implemented, committed `4ccb4d0`, pushed to `opencode/develop`; plan `docs/planning/L-022_HARDENING_PLAN.md`. |

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

### L-007 — Checklist and Labels for Tasks

**Implementation status:** Implemented, locally verified, and approved on 2026-08-19.

**Story goal:** User can add ordered checklist items and owner-scoped labels to Tasks.

**Implemented scope:**

- ChecklistItem and Label/TaskLabel modules: entity types, repository, service, controller, validation schema, DTOs.
- `POST /api/v1/tasks/{taskId}/checklist-items` — create ordered checklist items.
- `PATCH /api/v1/tasks/{taskId}/checklist-items/{itemId}` — toggle/rename checklist items.
- `DELETE /api/v1/tasks/{taskId}/checklist-items/{itemId}` — delete checklist items.
- `POST /api/v1/labels` — create owner-scoped labels with uniqueness.
- `GET /api/v1/labels` — list labels for authenticated user.
- `PATCH /api/v1/tasks/{taskId}/labels` — assign/remove labels on tasks.
- Owner isolation, CSRF protection, idempotency, and cursor pagination.
- Generated OpenAPI spec and client updated.
- Frontend: LabelManager component, Checklist component, task detail integration.
- Unit, API integration, component, and contract tests.

### L-008 — Project Management inside Areas

**Implementation status:** Implemented, locally verified, and approved on 2026-08-20.

**Story goal:** User can create, list, view, and rename Projects inside Areas, and assign Tasks to Projects.

**Implemented scope:**

- Project module: domain entity, repository, service, controller, validation schema, DTOs.
- `POST /api/v1/projects` — create Project in an Area with name uniqueness per Area.
- `GET /api/v1/projects?areaId=` — list active Projects with task count and cursor pagination.
- `GET /api/v1/projects/{projectId}` — get Project detail with task count.
- `PATCH /api/v1/projects/{projectId}` — rename Project with ETag/If-Match concurrency.
- Task extended with optional `projectId` for assignment; same-Area invariant enforced.
- Owner isolation, CSRF protection, idempotency, and non-disclosing 404s.
- Generated OpenAPI spec and client updated.
- Frontend: ProjectManager component (list, create, inline rename), integrated into AreaDetail.
- Task detail view shows assigned project; edit form includes project selector dropdown.
- Unit (12 tests), API integration (73 tests), component (32 tests), and contract tests.

### L-009 through L-021 — Work views, power features, and lifecycle

**Implementation status:** Each slice was implemented, locally verified, and approved on its own date; committed and pushed to `opencode/develop` as part of the batch-publish at L-022. Commits: `395fd1b` (L-009), `6d609ad` (L-010), `8e5ac4b` (L-011), `903a8de` (L-012, Area Kanban), `c27501b` (L-013, status editor with drag-and-drop reorder), `2a3999d` (L-014, consistent status changes), `043fb87` (L-015, recurrence), `10a825e` (L-016, search), `0fc3034` (L-017, bulk actions), `51613e9` (L-018, in-app notifications), `54c0479` (L-019/020, Archive and Trash), `e3a3f81` (L-021, durable permanent purge with privacy-minimized receipts). An intermediate UI polish pass (`980c6f9`) added Sonner toasts, press feedback, and entrance animations.

### L-022 — MVP responsive/accessibility hardening pass

**Implementation status:** Implemented, committed `4ccb4d0`, and pushed to `opencode/develop` on 2026-09-05. CI verified green on run `33992498866` (commit `608febe` closed the L-022 E2E/security repair).

**Plan document:** `docs/planning/L-022_HARDENING_PLAN.md`

**Implemented scope:** shared responsive `AppShell` in a single `app/app/layout.tsx` (SessionBoundary + shell) replacing per-page scaffolding; sticky header with search, notifications tooltips, and header quick-create sheet; mobile bottom tab bar with safe-area padding; new `sheet`/`tooltip` (delayed-open fade/zoom-in-95)/`dropdown-menu` primitives; short page metadata titles; `autoFocus` replaced with deterministic focus-on-open across status editor, search view, and quick-create; leftover lint/format/type failures repaired repo-wide (including seven non-null assertions in `area.repository.ts`); CI workflow now triggers on `opencode/develop` for both `pull_request` and `push`.

**E2E/security repair (commit `608febe`, run `33992498866`, all green):** restored sign-out UI in the shell (SignOutButton in sidebar + More sheet), gated quick-create csrf/areas fetches on dialog open, derived the session-boundary login return target from `usePathname()`, refit stale e2e specs to the shell-era UI (authenticated session + raw `tasks/today` mocks, exact button-name matching, detail-page count/label assertions), and closed the audit gap via `pnpm-workspace.yaml` overrides (`fast-uri` 3.1.6, `mysql2 >=3.22.0`, `deepmerge-ts >=8.0.0`). `pnpm audit --audit-level high` now exits clean (0 high, 3 moderate); no accepted-risk record required.

### L-023 — Release readiness

**Implementation status:** Implemented, committed, and CI-verified on 2026-09-06. Commits `b0518df` and `942bfc6`; CI runs `33992751977` and `33997579621` both succeeded.

**Plan document:** `docs/planning/L-023_RELEASE_READINESS_PLAN.md`

**Implemented scope:** Final traceability update (decision log extended through DEC-103); CI evidence recorded (all suites green on `opencode/develop`); migration and deploy rehearsal automated in CI against disposable `postgres:18.3` (prisma validate, migrate deploy, test:db, build, contract); `pnpm audit` gap closed via reviewed overrides (0 high, 3 moderate); release checklist and rollback note formalized; Graphify incremental update shipped (`942bfc6`, 2775 nodes / 5479 edges / 195 communities). No new product functionality.

**Definition of Done (all met):**
1. CI green on `opencode/develop` including all suites.
2. `pnpm audit --audit-level high` passes (0 high, 3 moderate).
3. Migration deploy rehearsal succeeds on disposable database in CI.
4. Decision log + phase history + backlog reflect L-001 through L-023 all implemented.
5. Self-review: no secrets, no `develop`/`main` push, no bypassed gates.

### L-024 — Calendar view (month grid + day quick-add)

**Implementation status:** Implemented and published to `opencode/develop` (commits `5208a6e`, `526617e`, `c86165b`, `a899ebf`).

**Story goal:** User can view a monthly calendar that shows tasks on both their planned and due days, navigate between months, and click a day to create a new task pre-filled with that date.

**Planned scope:**

- New API endpoint `GET /api/v1/tasks/calendar?timezone&start&end` returning day-bucketed tasks where tasks may appear on both their planned day and due day; same-day deduplication.
- Month grid UI (`/app/calendar`) with Mon–Sun header, prev/today/next month navigation, today highlighted.
- Day cells show up to 3 tasks + "+N daha" overflow; tasks displayed with priority badge.
- Click on a day opens the existing task-creation flow with `plannedAt` pre-filled to that day.
- Desktop sidebar entry "Takvim" (Calendar icon) added to `app-shell.tsx`.
- Owner isolation, CSRF protection, precondition handling, and error states.

**Excluded:**

- Week view, drag-and-drop task rescheduling, mobile bottom navigation addition, i18n of this view.

**Planned tests:**

- API unit tests for calendar service (both-planned-and-due placement, range limits, timezone).
- OpenAPI regeneration, api-client regeneration, contract tests.
- Frontend vitest for day-cell rendering/overflow, month navigation, quick-add prefill.
- Live-stack Playwright e2e verifying calendar load, task display on planned and due days, day click → quick-add creation.
- Full lint, typecheck, build, and security checks.

**Plan document:** (to be created during implementation)

### L-025 — Natural-language Quick Add v2 (#proje, @etiket, p1-p3, plannedAt routing)

**Implementation status:** Implemented and published to `opencode/develop`.

**Story goal:** Capture a task from a single line of text using Todoist-style shorthand — `#Proje` assigns the task to a matching project (and its area), `@Etiket` assigns matching labels, `p1`–`p3` set priority (in addition to existing Turkish words such as “önemli”), and parsed dates/times now schedule the task via `plannedAt` instead of `dueAt`. The calendar day quick-add dialog uses the same smart input with a live preview.

**Why:** Base Turkish natural-language capture already existed in `natural-language.ts` and the header quick-create. The competitive gap versus Todoist was the `#`/`@`/`p` shorthand, scheduling-first (`plannedAt`) semantics, and parser parity in the calendar day dialog.

**Delivered scope:**

- Parser (`apps/web/src/features/tasks/natural-language.ts`): extracts `#Project` and `@Label` tokens (kept verbatim in the title so nothing is lost), maps `p1`→HIGH, `p2`→MEDIUM, `p3`→LOW, and returns `plannedAt` instead of `dueAt`; exports `describeQuickCapture` and `namesEqual`; `hasQuickCaptureIntent` recognizes the shorthand.
- Header quick-create dialog: fetches global projects (`GET /api/v1/projects?limit=100`) and labels, resolves `#`/`@` tokens to existing entities, strips them from the title, overrides the area to the resolved project’s area, and posts `plannedAt`/`priority`/`recurrence`/`projectId`/`labelIds`. Unresolvable tokens stay in the title with an inline warning (no automatic project/label creation).
- Calendar day quick-add dialog: uses the parser — text dates/times override the pre-filled `plannedAt`, `p`/`önemli` sets priority, recurrence words apply, and a live preview chip shows recognized values.
- No API contract changes (create-task transport already accepted `plannedAt`, `projectId`, `labelIds`).

**Tests:** parser unit tests (shorthand, tokens, plannedAt routing, `#`-prefixed words not misread as keywords), header dialog resolution/unresolved/rejected-capture component tests, calendar dialog NL component test. Full web suite 167/167, typecheck, lint, Prettier, and live-stack calendar e2e all green.

**Excluded:** auto-creating missing projects/labels from capture (future slice), multi-word shorthand names, `!`-reminder syntax, quick-capture in the command palette input.

### L-026 — Kanban v2 (search/filter toolbar + drag-and-drop)

**Implementation status:** Implemented and published to `opencode/develop`.

**Story goal:** Make the global and per-area Kanban boards fast to use at scale: server-side search and filters (query, area, project, priority, label) plus direct drag-and-drop between columns instead of page-refresh moves.

**Why:** Kanban was read-only except for arrow buttons; switching boards meant leaving the page, and there was no way to narrow a large board down to a task you are looking for.

**Delivered scope:**

- **API (S1):** `GET /api/v1/tasks/kanban` accepts `q`, `areaId`, `projectId`, `priority`, `labelId`; `GET /api/v1/areas/{areaId}/kanban` accepts `q`, `projectId`, `priority`, `labelId` (no `areaId` on the scoped board). Tasks are enriched into `KanbanTaskDto` with `labels`, `project`, `areaName`, `version`, `areaId`. `q` matches the title only, with the same Turkish-aware term splitter and sanitizer as search. Filtering was done in the repository via `buildKanbanWhere`, including correct `labels: { some: { labelId } }` semantics. Also fixed a latent pre-existing bug where three list/search queries used an invalid `taskLabels` Prisma WHERE key that would have thrown at runtime for label-filtered requests. Added repository DB tests (testcontainers Postgres), service, and HTTP contract coverage; regenerated OpenAPI + api-client.
- **Web (S2):** Shared `KanbanToolbar` (300 ms-debounced search + area/project/priority/label selects) on both boards; the global board persists filters and query to `/app/kanban` URL params via the `useKanbanBoardFilters` hook (local state on the area board). Shared `KanbanTaskCard` shows label chips, project name, planned/due dates, and area name (global). Query keys stay prefix-compatible so existing invalidations still work.
- **Web (S3):** `DragDropProvider` enables whole-card dragging between columns on both boards (empty columns are valid targets), with a `DragOverlay` preview and optimistic reorder via the pure `moveTaskBetweenColumns` helper, rolled back on failure. Keyboard arrows remain for accessibility. Fixed a latent bug: area kanban-moves now send `If-Match` (the API rejects requests without it, so the earlier arrow buttons would have failed against a real server).

**Tests:** API service/contract/DB suites; web component tests for filter → query param pass-through, URL persistence, debounced search, enriched cards; unit tests for `resolveDragMove` and `moveTaskBetweenColumns`. Full web suite 176/176, API contract 131/131, DB kanban suite 6/6, typecheck, lint, and Prettier green.

**Excluded:** column collapse/expand, server-side pagination inside a column, dragging to reorder *within* a column, non-title full-text search, client-side filtering (all filtering is server-side).

## 6a. Planned next slices (L-027 through L-031)

Sourced from `docs/research/FEATURE_RESEARCH.md` and user selection on 2026-09-20. Slices are planned only; none implemented. Each has a decision-complete plan document in `docs/planning/`.

| Slice | Goal | Plan document | Implementation status |
| --- | --- | --- | --- |
| L-027 | Sub-tasks (nested Tasks under a parent Task, single level, subtask cascade) | `docs/planning/L-027_SUBTASKS_PLAN.md` | Planned — not implemented |
| L-028 | Task templates (save/apply template → instant Task with checklist, labels, priority) | `docs/planning/L-028_TASK_TEMPLATES_PLAN.md` | Planned — not implemented |
| L-029 | Snooze / postpone (task-date snooze + reminder snooze) | `docs/planning/L-029_SNOOZE_PLAN.md` | Planned — not implemented |
| L-030 | Markdown-supported rich notes on Task description (render-only, safe subset) | `docs/planning/L-030_MARKDOWN_NOTES_PLAN.md` | Planned — not implemented |
| L-031 | Kanban improvements: Area board URL-persisted filters + new Project-scoped Kanban board | `docs/planning/L-031_KANBAN_IMPROVEMENTS_PLAN.md` | Planned — not implemented |

Explicit user request on 2026-09-20: plan L-027 through L-030 plus Kanban (Area improvement + Project board). The order above is the current proposal; the user picks the next slice before implementation begins.

## 7. Backlog maintenance policy

Update this file only when:

- a slice is completed, accepted, published, and CI-verified;
- a slice must be split because it no longer fits one implementation cycle;
- the user explicitly changes product scope;
- a later source document creates a real contradiction.

Do not expand this backlog back into micro-stories unless there is a demonstrated delivery problem that the lean queue cannot solve.
