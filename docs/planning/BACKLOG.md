# Personal Task Planner — Vertical-Slice Backlog

| Field | Value |
| --- | --- |
| Status | Approved Stage 8 baseline; MVP scope revised to defer social authentication |
| Planning stage | Stage 8 — Backlog planning |
| Product scope | MVP |
| Document language | English |
| Last updated | 2026-07-27 |
| Implementation status | EPIC-001 and BL-007 through BL-010 complete, accepted, published, and CI-verified; BL-011 decision-complete handoff prepared; BL-011 implementation not started |

This backlog converts the approved product, UX, domain, data, API, and architecture baselines into small, independently verifiable delivery slices. It defines future implementation work only; it contains no production code, schema, migration, OpenAPI artifact, or framework scaffold.

## 1. Backlog operating rules

- Epics are ordered by the earliest coherent user value they unlock, not by frontend, backend, or database layers.
- A story produces one observable outcome and may include web, API, database, generated-client, worker, security, and test work when those parts are necessary for that outcome.
- Story acceptance criteria are mandatory and independently demonstrable. A story is not complete when only one technical layer exists.
- The target story size is a few focused implementation hours. Split a story before implementation if it cannot be completed and reviewed in roughly one working day.
- Each story preserves owner-scoped access and the non-disclosing `404 RESOURCE_NOT_FOUND` policy whenever user-owned data is involved.
- Every unsafe cookie-authenticated mutation uses the approved CSRF, ETag/precondition, and idempotency behavior where the API contract requires it.
- Generated OpenAPI/client artifacts are part of the story that changes a contract; they are not deferred to a later horizontal task.
- Accessibility, Turkish localization, responsive semantics, error states, logging redaction, and tests are continuous acceptance concerns. Epic 17 hardens the integrated product rather than introducing these concerns for the first time.
- A spike answers a bounded uncertainty and ends with evidence plus a decision. A spike does not count as production behavior or satisfy a feature acceptance criterion.
- Graphify findings guide impact analysis only. Exact rules are verified in the cited approved documents before implementation.

### Test notation

| Code | Test level |
| --- | --- |
| `U` | Unit |
| `C` | Frontend component |
| `API` | HTTP integration through NestJS/Express and Supertest |
| `DB` | PostgreSQL integration with Testcontainers |
| `E2E` | Playwright browser journey |
| `CT` | OpenAPI/contract and generated-client check |
| `SEC` | Security, ownership, secret, dependency, or container check |
| `A11Y` | Automated and manual accessibility verification |

## 2. Final epic sequence and dependency summary

| Order | Epic | Primary prerequisite | Value unlocked |
| --- | --- | --- | --- |
| 1 | EPIC-001 Repository foundation and quality gates | Approved Stage 7 architecture | Reproducible, guarded delivery path |
| 2 | EPIC-002 Authentication | EPIC-001 | Private account access |
| 3 | EPIC-003 Onboarding and sample Area | EPIC-002 | First usable private planning state |
| 4 | EPIC-004 Area management | EPIC-003 narrow Area slice | Durable responsibility contexts |
| 5 | EPIC-005 Basic Task creation and management | EPIC-004 | Direct Area-based work tracking |
| 6 | EPIC-006 Project management | EPIC-005 | Optional grouping without weakening Area ownership |
| 7 | EPIC-007 Area-specific statuses | EPIC-004, EPIC-005 | Custom local workflow with canonical meaning |
| 8 | EPIC-008 List view | EPIC-005, EPIC-007 | Scan and automatically sort all work |
| 9 | EPIC-009 Global Kanban | EPIC-007, EPIC-008 | Canonical cross-Area board |
| 10 | EPIC-010 Area Kanban | EPIC-007, EPIC-009 ordering primitives | Local workflow board |
| 11 | EPIC-011 Today planning | EPIC-005, EPIC-008 | Daily planning and execution |
| 12 | EPIC-012 Recurring Tasks | EPIC-005, EPIC-007, EPIC-011 time semantics | Reliable repeated work |
| 13 | EPIC-013 Search and filters | EPIC-008 and core Task relationships | Fast discovery |
| 14 | EPIC-014 Bulk actions | EPIC-007, EPIC-008, EPIC-013 selection/filter semantics | Efficient multi-Task maintenance |
| 15 | EPIC-015 Notifications | EPIC-005, EPIC-011, worker foundation | Date-based in-app reminders |
| 16 | EPIC-016 Archive and Trash | EPIC-004–EPIC-007, worker foundation | Recoverable lifecycle and purge |
| 17 | EPIC-017 Responsive and accessibility hardening | Integrated EPIC-002–EPIC-016 journeys | Supported compact/wide accessible UX |
| 18 | EPIC-018 Release readiness | All prior epics | Auditable MVP release candidate |

### Requirement ownership map

| Requirement set | Primary owning epic(s) |
| --- | --- |
| US-001, US-003, FR-001–FR-004, FR-007–FR-012 | EPIC-002 |
| US-004, FR-013–FR-016 | EPIC-003 |
| US-005, FR-017–FR-019 | EPIC-004 |
| US-006, US-008, FR-020–FR-026 | EPIC-006, with lifecycle completion in EPIC-016 |
| US-007, US-009–US-010, FR-027–FR-046 | EPIC-005, with status expansion in EPIC-007 |
| US-011–US-012, FR-047–FR-053 | EPIC-012 |
| US-013, US-027, FR-054–FR-058, FR-091–FR-093 | EPIC-015 |
| US-014, FR-061–FR-062 | EPIC-011 |
| US-015, FR-059 | EPIC-008 |
| US-016, FR-060, FR-087–FR-090 | EPIC-007, EPIC-009, EPIC-010 |
| US-017–US-018, FR-063–FR-069 | EPIC-013, with active-scope foundations in EPIC-008/EPIC-011 |
| US-019, FR-070–FR-072 | EPIC-014 |
| US-020–US-022, US-026, FR-073–FR-082 | EPIC-016, with deletion initiation in EPIC-002 |
| US-023–US-024, FR-083–FR-086 | EPIC-017 and continuously every UI epic |
| US-025 | EPIC-002 and every owner-scoped feature epic; release matrix in EPIC-018 |
| NFR-001–NFR-015 | EPIC-001 plus the relevant feature epic; consolidated proof in EPIC-018 |
| PRV-001–PRV-004, PRV-006–PRV-010 | EPIC-002, EPIC-003, EPIC-013, EPIC-015, EPIC-016, EPIC-018 |
| A11Y-001–A11Y-010 | Continuous story acceptance; integrated proof in EPIC-017/EPIC-018 |
| SC-001–SC-011, AC-001–AC-016 | Feature epics named above; complete evidence matrix in EPIC-018 |

## 3. Epic backlog

## EPIC-001 — Repository foundation and quality gates

**Goal:** Establish the reproducible workspace, runtime topology, contract pipeline, local infrastructure, and CI gates required to deliver every later slice safely.

**User value:** Changes that reach the product are consistently built, validated, isolated, and reviewable; the user is not exposed to avoidable drift or unsafe releases.

**Dependencies:** Approved Architecture and ADR-001 through ADR-003; Node.js 24 LTS and pnpm availability.

**Related requirement IDs:** NFR-002–NFR-005, NFR-008–NFR-015, PRV-009–PRV-010, A11Y-001, AC-015.

**Related domain concepts:** User ownership boundary; typed domain errors; transaction and concurrency boundaries.

**API impact:** Establish `/api/v1`, health endpoints outside the product contract, RFC 9457 base errors, OpenAPI generation, and generated-client workflow without prematurely implementing feature endpoints.

**Data impact:** Establish PostgreSQL/Prisma ownership, migration discipline, Testcontainers, and empty baseline migration capability; no product schema is created by this planning story definition.

**Frontend impact:** Establish the Next.js shell boundary, Turkish catalog infrastructure, generated-client consumption, and shared loading/error primitives.

**Backend impact:** Establish NestJS API and worker composition roots, domain-aligned module boundaries, configuration validation, Pino redaction, and PostgreSQL job infrastructure boundary.

**Security considerations:** Secret-safe configuration, frozen dependencies, protected branches, same-origin assumptions, redacted logs, least-privilege CI, dependency and secret scanning.

**Graphify queries to run before implementation:** `What approved decisions constrain the workspace and runtime topology?`; `Which modules may import Prisma or the generated API client?`; `Which quality gates protect ownership, recurrence, lifecycle, accessibility, and OpenAPI?`

### Stories

| ID | User/contributor outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-001 | A contributor can install and validate the pinned workspace from a clean checkout. | Node 24 and pnpm are pinned; frozen install succeeds; strict TypeScript and root scripts discover every workspace; no application feature is implied. | CT, SEC |
| BL-002 | A contributor can start PostgreSQL locally and see API, worker, and web composition roots validate configuration. | Docker Compose health is observable; invalid configuration fails before listening/claiming work; valid processes expose only their intended entry points. | API, DB |
| BL-003 | The browser can use one generated transport package for a minimal version/health contract. | OpenAPI 3.1 is generated deterministically, committed, linted, used to generate the Fetch client, and produces no diff after a second generation. | CT |
| BL-004 | Operators receive privacy-safe request and worker diagnostics. | Correlation/job IDs appear; configured sensitive fields and authored Task content are redacted; unknown HTTP errors use the approved Problem Details base shape. | U, API, SEC |
| BL-005 | Pull requests cannot merge when a foundational contract or boundary is broken. | CI runs format, lint, strict type-check, unit/component tests, OpenAPI drift, builds, migration validation, integration/E2E placeholders where applicable, secret/dependency checks, and forbidden-import/cycle checks. | CT, SEC |
| BL-006 | A worker can lease and complete one synthetic durable job without double execution. | PostgreSQL leasing is recoverable after lease expiry, two claim attempts produce one committed outcome, and bounded retry metadata is visible without personal content. | U, DB |
| SPIKE-001 | The team has evidence that the selected OpenAPI generator supports the approved contract shapes before generated transport work begins. | As the first non-production work of EPIC-001 and before BL-003, a written proof records results for OpenAPI 3.1, cookie auth, RFC 9457 unions, nullable fields, response headers, operation IDs, and Fetch credentials, then pins compatible versions/configuration; failure opens a generator decision without shipping generated feature code. | CT |

**Progress (2026-07-23):** `SPIKE-001` and `BL-001` through `BL-006` are implemented and locally verified. The pinned Node 24/pnpm workspace, strict TypeScript boundaries, minimal Turkish Next.js shell, NestJS API/worker composition roots, PostgreSQL 18/Prisma migration and recoverable synthetic job lease, deterministic OpenAPI 3.1/Fetch-client pipeline, privacy-safe logging and Problem Details base, CI/security/architecture gates, and contributor runbook are present. Frozen install, formatting, lint, type-check, unit/component/API/PostgreSQL integration/contract/E2E tests, production builds, Compose validation, dependency audit, and secret scan pass. No authentication, Task behavior, product table, or other product feature was introduced. EPIC-001 is complete; EPIC-002 remains unstarted and must not begin without explicit User instruction.

**Epic acceptance criteria:** A clean checkout reaches a green protected-branch pipeline; web/API/worker boundaries start with validated configuration; contract generation is deterministic; architecture checks reject at least one known forbidden import fixture; secrets and authored planning content are absent from logs and generated artifacts.

**Required tests:** CT for generation/drift; API for base error/header behavior; DB for migrations and leasing; SEC for secrets, dependencies, boundaries, and container baseline; one production-topology smoke E2E.

**Definition of done:** Complete as of 2026-07-23. BL-001 through BL-006 and SPIKE-001 meet their acceptance criteria; README commands match CI; the known forbidden-import fixture is rejected; the committed OpenAPI/client artifacts regenerate deterministically; the dependency audit reports no known vulnerabilities; and no required check, generated contract, or foundation migration is bypassed.

**Explicitly excluded work:** Product feature endpoints, product tables, final visual styling, Redis, message brokers, microservices, production provider selection, and a shared `packages/ui`.

## EPIC-002 — Authentication

**Goal:** Let one person securely create, verify, access, recover, manage, and end a private account through email/password.

**User value:** The user can reach only their own planning space through safe, recoverable authentication flows.

**Dependencies:** EPIC-001 and a local email-capture boundary for development/testing.

**Related requirement IDs:** US-001, US-003, US-025–US-026, FR-001–FR-004, FR-007–FR-012, FR-083–FR-086, NFR-001–NFR-004, PRV-001, PRV-004, PRV-007, PRV-010, AC-001–AC-002, AC-014.

**Related domain concepts:** User, AuthenticationIdentity, session, AccountDeletionProcess, ownership and isolation rules.

**API impact:** Email/password authentication, session, CSRF, `/users/me`, password, reauthentication, and account-deletion initiation endpoints.

**Data impact:** User, one email/password AuthenticationIdentity per User, hashed session/token records, abuse counters, and AccountDeletionProcess initiation.

**Frontend impact:** Public landing, privacy, and terms routes; registration, verification, login, password recovery/reset, password settings, safe session restoration, and account-deletion confirmation.

**Backend impact:** `accounts` module, session/CSRF guards, credential hashing, token expiry, generic public outcomes, and immediate access revocation.

**Security considerations:** Enumeration resistance, Argon2id, hashed single-use tokens, secure host-only cookies, CSRF/origin validation, session rotation, rate limits, and no reusable browser tokens.

**Graphify queries to run before implementation:** `How does Accounts Module connect to User, AuthenticationIdentity, session security, and ownership?`; `Which auth outcomes must be non-enumerating?`; `What operations revoke every session?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-007 | A person can submit email/password registration without learning whether an account already exists. | Valid and retained-email submissions return the same public next-step shape; password is never echoed/logged; one pending identity is created at most once. | U, API, DB, SEC, CT |
| BL-008 | A registrant can verify email with a single-use action. | A manual eight-digit code is accepted only in the dedicated body; a valid action activates the identity once without creating a session; expired, invalid, and replayed actions are safe; resend is non-enumerating and invalidates every earlier unused challenge; durable delivery retries are bounded. | U, C, API, DB, E2E, CT, SEC, A11Y |
| BL-009 | A verified user can sign in and resume a safe requested route. | Correct credentials create a rotated opaque cookie session; invalid credentials are generic; unverified recovery appears only after credential proof; unsafe return destinations are rejected. | API, E2E, SEC |
| BL-010 | A signed-in user can sign out from the current device. | Server state is invalidated before cookie clearing; repeating logout is safe; private routes require authentication afterward. | API, E2E |
| BL-011 | A person can request and complete password recovery without account enumeration. | Request responses are identical; a valid token changes the password once, revokes all sessions, and expires; token/password data is absent from telemetry. | API, DB, E2E, SEC |
| BL-014 | An authenticated user can inspect current account/session-safe profile state. | `/users/me` exposes only approved fields and ETag; no arbitrary User route exists; foreign identifiers cannot be used to select a User. | API, CT |
| BL-015 | A user can begin permanent account deletion and immediately lose access. | Recent re-auth and explicit confirmation are required; one durable deletion process is created/found idempotently; every session is revoked in the accepted boundary; full planning-data purge is completed in EPIC-016. | API, DB, E2E, SEC |
| BL-121 | A person can reach the public product, privacy, and terms entry points without authentication. | `/` explains the private personal-planning purpose and offers Login/Register; `/privacy` and `/terms` are reachable before and after authentication and from registration; authenticated `/` offers entry to Today; every route is Turkish, responsive, keyboard accessible, and reveals no account or resource existence. | C, E2E, A11Y, SEC |

`BL-012` and `BL-013` are reserved historical IDs for the deferred Google sign-in and provider-linking stories. They are not active MVP work and must not be reassigned.

**BL-007 progress (2026-07-25):** Complete, locally verified, and accepted for publication. The slice provides a Turkish accessible registration form, anonymous CSRF/origin protection, persistent privacy-safe identity/network rate limits, Argon2id password hashing, atomic pending User/AuthenticationIdentity/challenge creation, a non-enumerating `202` result, generated OpenAPI/Fetch-client updates, and unit/component/API/PostgreSQL integration/contract/security coverage. Email delivery and verification-token consumption remain BL-008. Login, sessions, password recovery, account deletion, social authentication, and planning data were not started.

**BL-008 progress (2026-07-25):** Complete, accepted, published to `develop`, and CI-verified. Registration and resend atomically queue a challenge-ID-only PostgreSQL job. The worker derives the eight-digit code at delivery time, sends through configurable SMTP, and retries at most five times with bounded exponential backoff and jitter; Mailpit is the loopback-bound local/CI capture service. The Turkish responsive form accepts email plus code and supports non-enumerating resend; after BL-009 it offers the implemented login route on success. Confirmation requires anonymous CSRF and `Idempotency-Key`, stores only purpose-bound HMAC values, rate-limits privacy-safe identity/network keys, activates one pending identity exactly once, and creates no session. Unit, component/accessibility, API, PostgreSQL/Testcontainers, OpenAPI/client, build, E2E, SMTP smoke, dependency, and secret checks pass.

**BL-009 progress (2026-07-26):** Complete, accepted, published to `develop`, and CI-verified in commit `1fc5514` and run `30177705743`. A verified identity can sign in through the Turkish responsive form and resume only a normalized `/app/*` path, defaulting to `/app/today`. Invalid credentials are generic; verification guidance appears only after correct credential proof. The API rotates an opaque host-only cookie token, persists only a purpose-bound HMAC, enforces 12-hour idle and seven-day absolute expiry, caps active sessions at five, and applies persisted identity/network abuse limits. The generated OpenAPI client, unit/component/accessibility/API/PostgreSQL/Testcontainers/contract/E2E tests, builds, dependency audit, secret scan, and bounded Graphify impact review pass. BL-010 and every later story remain unimplemented.

**BL-010 progress (2026-07-26):** Complete, accepted, published to `develop`, and CI-verified in commit `636c373` and run `30179467625`. The CSRF-protected `DELETE /auth/session` operation conditionally revokes only the presented session before clearing its cookie and returns the same idempotent result for missing, expired, or already-revoked sessions. The generated client and accessible authenticated-handoff control use a full-document transition to a neutral signed-out login state; a revocation failure keeps the cookie and offers retry. Unit, API, PostgreSQL/Testcontainers, component/accessibility, E2E, type-check, lint, architecture, contract, build, Docker/PostgreSQL, dependency, secret, and bounded Graphify impact checks pass. No schema migration or later authentication/planning behavior was introduced.

**BL-011 planning progress (2026-07-27):** Decision-complete handoff prepared; production implementation not started. The User approved reset links with the secret token carried in the URL fragment and latest-token-only invalidation for new recovery requests. `docs/planning/BL-011_PASSWORD_RECOVERY_PLAN.md` records the next-session start point, expected backend/frontend/data/API changes, required tests, security checks, and Graphify usage.

**Epic acceptance criteria:** All active AC-001 lifecycle paths work; public landing/privacy/terms entry points are accessible in supported layouts; two-owner tests show no cross-account planning/session leakage; public responses do not reveal email/account existence; deletion initiation revokes access immediately.

**Required tests:** U for credential/session decisions; API/DB for cookies, CSRF, token/session rotation, uniqueness, idempotency, and enumeration; E2E for email/password paths; CT for security/error shapes; SEC for redaction and abuse controls.

**Definition of done:** All authentication stories pass automated and exploratory security checks; the generated client covers the routes; Turkish states are complete; session/token durations and limits match Architecture; threat-review findings are resolved or recorded.

**Explicitly excluded work:** Every social authentication provider including Google, provider identity linking, organization roles, shared accounts, bearer/mobile tokens, third-party provider data access, email marketing, MFA, and restoring a deleted account.

## EPIC-003 — Onboarding and sample Area

**Goal:** Move a newly authenticated User into one understandable, private, usable starting state through an explicit sample-or-empty choice.

**User value:** First use teaches the Area model without forcing sample content or creating duplicates.

**Dependencies:** EPIC-002; narrow owner-scoped creation ports for the sample Area, Project, Tasks, Label, Checklist items, and default-status invariant. EPIC-004 through EPIC-006 later expand those ports into general management behavior.

**Related requirement IDs:** US-004, FR-013–FR-016, FR-045–FR-046, PRV-003, SC-001, AC-003, RA-001, RA-007.

**Related domain concepts:** User onboarding state, Area, AreaStatus, Project, Task, Label, TaskLabel, ChecklistItem, and sample content as ordinary owner data.

**API impact:** `POST /users/me/onboarding-completions` and current User onboarding state.

**Data impact:** Onboarding completion marker, confirmed time zone, and one optional sample set containing an Area with its three canonical defaults, one Project, representative direct and Project Tasks, one Label assignment, and ordered Checklist items; no privileged sample flag is required.

**Frontend impact:** Welcome, time-zone confirmation, sample-or-empty choice, retry/continue-empty failure state, Today handoff, dismissible hint.

**Backend impact:** `onboarding` coordinator invoking approved `accounts`, `planning`, and `tasks` application ports in one idempotent transaction without direct cross-module repository access.

**Security considerations:** Sample content is owner-scoped ordinary data; idempotency prevents duplicates; device time zone is a proposal, not trusted ownership input.

**Graphify queries to run before implementation:** `What requirements govern onboarding choice and sample ownership?`; `Which modules collaborate to complete onboarding?`; `What Area invariants must the sample transaction preserve?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-016 | A first-time user understands the private Area → optional Project → Task model. | Welcome content is Turkish, keyboard accessible, private-space focused, and contains no team/collaboration concept. | C, E2E |
| BL-017 | A first-time user can confirm or change the proposed account time zone. | A valid IANA zone is persisted with User ETag protection; invalid zones are rejected with field guidance; the confirmed zone appears in the next step. | C, API, E2E, CT |
| BL-018 | A user can explicitly start empty. | The action completes onboarding once, creates no sample Area, opens Today, and remains safe on retry. | API, DB, E2E |
| BL-019 | A user can explicitly create the private sample planning structure. | Exactly one editable sample Area, its three valid default statuses, and one editable Project in that Area are created for the current owner; replay returns the same records; all records behave like ordinary content. | U, API, DB, E2E |
| BL-020 | A user receives representative work inside the private sample structure. | The same atomic completion creates at least one direct-Area Task and one Project Task, applies one editable Label, and includes ordered Checklist items on a sample Task; every relationship satisfies Area ownership and same-Area Project invariants; replay creates no duplicate. | U, API, DB, E2E |
| BL-122 | A user can recover when full sample creation fails. | No partial sample Area, workflow, Project, Task, Label, Checklist, or onboarding completion remains; retry is available; continuing empty completes onboarding without sample data; input and focus are preserved. | C, API, DB, E2E |

**Epic acceptance criteria:** Each new User makes one explicit choice; full sample-set creation is private, atomic, and idempotent; start-empty creates no sample records; a failure leaves no partial sample aggregate; both paths end on Today.

**Required tests:** U for onboarding choice rules; API/DB for transaction/idempotency/ownership; C/E2E for time zone, both choices, loading/error/focus behavior.

**Definition of done:** AC-003 passes; onboarding cannot repeat after completion except through safe help content; every sample record is localized, private, and editable through the same domain behavior as user-created data; Graphify impact findings are source-verified.

**Explicitly excluded work:** Automatic sample creation, multiple sample packs, tutorial gamification, shared templates, recurring sample Tasks, sample reminders/Notifications, and final visual-brand refinement.

## EPIC-004 — Area management

**Goal:** Let a User create, list, inspect, and rename their own durable responsibility contexts.

**User value:** Every future Task has a stable, private place without requiring a Project.

**Dependencies:** EPIC-003's valid Area/default-workflow slice.

**Related requirement IDs:** US-005, FR-017–FR-019, FR-026 display preconditions, FR-063–FR-064, NFR-001, AC-002, AC-004.

**Related domain concepts:** Area, AreaStatus defaults, User ownership, active lifecycle.

**API impact:** `GET/POST /areas`, `GET/PATCH /areas/{areaId}` with cursor, ETag, idempotency, and non-disclosing errors.

**Data impact:** Area identity, owner, name, version, timestamps, and atomic three-default-status creation.

**Frontend impact:** Area list, create form, detail/overview shell, rename, counts-ready empty/loading/error states.

**Backend impact:** `planning` module Area use cases and owner-scoped repository.

**Security considerations:** Owner-leading queries, no caller-supplied `userId`, foreign/missing parity, safe names in logs, CSRF and ETag protection.

**Graphify queries to run before implementation:** `Which Area requirements enforce Task context and ownership?`; `What must be created atomically with an Area?`; `Which later epics depend on Area identity and defaults?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-021 | A user with no Areas sees why one is required and can start creation. | Empty state names the Area rule, offers Create Area, and exposes no sample or foreign count. | C, E2E |
| BL-022 | A user can create an Area by name. | A non-blank valid name creates one owned Area plus three defaults atomically; duplicate submission returns one Area; success updates navigation/list. | U, API, DB, C, E2E, CT |
| BL-023 | A user can browse only their active Areas. | Cursor paging and deterministic sort return only owned active Areas; foreign data does not affect rows or counts. | API, DB, E2E |
| BL-024 | A user can open an Area overview with its workflow context. | Owned Area returns its three defaults and safe summary; missing/foreign/wrong-state identifiers show the same unavailable UX/API outcome. | API, C, E2E, SEC |
| BL-025 | A user can rename an Area without overwriting a newer edit. | Rename requires current ETag, validates non-blank name, updates visible contexts, and returns `412` for stale input without data loss. | API, DB, C, E2E |

**Epic acceptance criteria:** An owned Area is created with a valid workflow, appears in list/detail, can be renamed, and cannot be read or changed by another User; active views do not include inactive states.

**Required tests:** U for Area invariants; API/DB for atomic creation, owner scopes, cursor, ETag; C/E2E for empty/create/list/detail/rename and unavailable states; CT for route/error metadata.

**Definition of done:** US-005 and the active subset of FR-017 pass; the default workflow is reusable by Task creation; no archive/trash shortcut bypasses EPIC-016.

**Explicitly excluded work:** Area visual metadata, custom statuses, Area Kanban, Archive, Trash, sharing, name uniqueness, and Task implementation.

## EPIC-005 — Basic Task creation and management

**Goal:** Let a User capture and maintain one actionable Task directly under an Area with its core execution details.

**User value:** The product becomes a usable private task tracker without requiring Projects or advanced workflows.

**Dependencies:** EPIC-004; generated client and ownership/error foundations.

**Related requirement IDs:** US-007, US-009–US-010, FR-018–FR-019, FR-022, FR-027–FR-046, FR-063–FR-064, NFR-001, NFR-005, NFR-012–NFR-013, AC-004–AC-005, AC-014.

**Related domain concepts:** Task, Area, default AreaStatus, CanonicalStatus, Label, TaskLabel, ChecklistItem, date/time rules.

**API impact:** Task create/detail/update/status transition; checklist and Label endpoints needed by the accepted slice.

**Data impact:** Task required Area/status, optional core fields, date-only versus instant values, completion/version fields, Label/TaskLabel, ChecklistItem order.

**Frontend impact:** Global/contextual quick create, Task detail/edit surface, labels, checklist, completion/reopen, unsaved-change and conflict states.

**Backend impact:** `tasks` module using owned planning references; atomic Task child changes; no recurrence/reminder behavior yet.

**Security considerations:** Same-owner Area/status/Label checks; no cross-user lookup detail; content redaction; input bounds; ETag/idempotency/CSRF.

**Graphify queries to run before implementation:** `What invariants must every Task creation preserve?`; `How are Task, Area, status, Label, checklist, and date rules connected?`; `Which views must invalidate after a Task mutation?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-026 | A user can quickly create a titled Task in an Area without a Project. | Area is required; the owned Area default To Do status is selected; idempotent replay returns one Task; it appears in Area and global collections. | U, API, DB, C, E2E, CT |
| BL-027 | A user can add description, priority, planned value, and due value. | Omitted fields remain optional; date-only and timed meanings round-trip distinctly; due-before-planned is rejected; changing time zone does not rewrite stored meaning. | U, API, DB, C, E2E |
| BL-028 | A user can create and assign a private Label. | Label names are normalized unique per owner; owned Labels can be assigned once; foreign Labels return non-disclosing failure; deleting a Label leaves Tasks intact. | U, API, DB, C |
| BL-029 | A user can add, edit, complete, remove, and reorder checklist items. | Order is deterministic and unique; completion is independent of Task completion; stale reorder fails without mixed positions; keyboard operation is available. | U, API, DB, C, E2E |
| BL-030 | A user can open and edit Task detail from wide or compact flow. | Approved fields and Area context are shown; changes require current ETag; stale state offers refresh/reapply; unsaved input is protected. | API, C, E2E, CT |
| BL-031 | A user can complete and reopen a non-recurring Task. | Completion sets a Completed-mapped status/time; reopen requires To Do or In Progress and clears completion time; all visible collections reflect the change. | U, API, DB, C, E2E |
| BL-032 | A user can move a non-recurring Task to another owned Area. | Target Area/status is explicit; incompatible Project is not retained; canonical meaning is preserved through target default; the move is atomic and stale-safe. | U, API, DB, E2E |

**Epic acceptance criteria:** Every retained Task has exactly one owned Area and compatible status; core fields, labels, checklist, completion, reopen, edit, and Area move work; date semantics survive round-trip; another User receives no content or distinguishing error.

**Required tests:** U for Task/date/status/checklist rules; API/DB for ownership, constraints, idempotency, ETag, transactions; C/E2E for quick create/detail/edit/complete/move and responsive presentation; CT for generated shapes.

**Definition of done:** AC-004 and the non-Project/non-recurrence/non-reminder subset of AC-005 pass; mutation cache updates are consistent; two-owner builders are used by default; accessibility checks accompany every form/control.

**Explicitly excluded work:** Project membership, custom Area statuses, recurrence, reminders, Kanban, bulk actions, lifecycle operations, attachments, and rich text.

## EPIC-006 — Project management

**Goal:** Let a User optionally group Tasks in one Project inside an Area and move that grouping coherently.

**User value:** Related work can be organized without making Project use mandatory.

**Dependencies:** EPIC-004 and EPIC-005.

**Related requirement IDs:** US-006, US-008, FR-020–FR-026, FR-063–FR-064, NFR-001, NFR-005, NFR-007, AC-004, AC-011 dependency.

**Related domain concepts:** Project, Area, Task, Project Area move, compatible AreaStatus.

**API impact:** Project list/create/detail/rename/area-move and Task Project assignment through compatible Task mutations.

**Data impact:** Required Project Area/owner, optional Task Project triple, atomic Project-and-Tasks Area move.

**Frontend impact:** Project list/detail, Area-grouped presentation, contextual Task creation, Project assignment, move preview/confirmation.

**Backend impact:** `planning` Project use cases coordinating with `tasks` through declared ports and a shared transaction.

**Security considerations:** Same-owner and same-Area composite references; affected counts contain owned data only; no partial move; ETag/idempotency.

**Graphify queries to run before implementation:** `Which rules make Project optional but Area mandatory?`; `What changes atomically when a Project moves Area?`; `Which endpoints and views expose Project context?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-033 | A user can create a Project inside an owned Area. | Area is required and active; owner input is impossible; idempotent replay returns one Project; foreign Area returns non-disclosing failure. | U, API, DB, C, E2E |
| BL-034 | A user can browse Projects grouped or filtered by Area. | Only owned active Projects appear; cursor/filter behavior is deterministic; each result names its owned Area and safe Task counts. | API, DB, C, E2E |
| BL-035 | A user can open and rename a Project. | Detail retains Area context; rename uses ETag; missing/foreign/wrong-parent states are indistinguishable; stale writes do not overwrite. | API, C, E2E |
| BL-036 | A user can create or assign a Task inside a compatible Project. | Project choices are limited to the selected Area; changing Area clears incompatible Project with explanation; persisted Task and Project share owner/Area. | U, API, DB, C, E2E |
| BL-037 | A user can move a Project and all its Tasks to another owned active Area. | Preview names affected owned count; one transaction changes Project/Tasks; each Task keeps canonical group through target default; any conflict leaves everything unchanged. | U, API, DB, C, E2E |

**Epic acceptance criteria:** Project remains optional; every Project has one owned Area; Project Tasks share that Area; list/detail/rename/assignment work; Area move is all-or-nothing and preserves canonical meaning.

**Required tests:** U for compatibility/mapping; API/DB for composite references and atomic move races; C/E2E for lists, contextual creation, assignment, and move confirmation; CT for command contract.

**Definition of done:** US-006/US-008 and AC-004 pass for both direct and Project Tasks; no cross-module repository import is introduced; Graphify source paths confirm planning/tasks collaboration.

**Explicitly excluded work:** Mandatory Projects, Project templates, cross-user sharing, Project-specific custom statuses, lifecycle operations, and separate Project Kanban.

## EPIC-007 — Area-specific statuses

**Goal:** Let a User define a local Area workflow while preserving fixed canonical meaning everywhere else.

**User value:** Personal workflows can use meaningful local status names without fragmenting global planning.

**Dependencies:** EPIC-004 and EPIC-005; EPIC-006 for Project Task coverage.

**Related requirement IDs:** US-016, FR-034–FR-040, FR-087–FR-090, NFR-005, AC-006, RA-006.

**Related domain concepts:** AreaStatus, CanonicalStatus, Area workflow boundary, Task status transition, defaults and retirement.

**API impact:** Area status read, atomic workflow replacement, Task exact/canonical status transitions.

**Data impact:** Ordered active/retired AreaStatuses, one mapping and one default per canonical group, compatible Task references, workflow version.

**Frontend impact:** Workflow editor, mapping/default controls, retirement reassignment, exact status selection in Area contexts, canonical explanation.

**Backend impact:** `planning` workflow use case and `tasks` reassignment/status ports within one transaction.

**Security considerations:** Every referenced status/Task belongs to the same owner and Area; workflow conflict/affected counts disclose no foreign data; stale workflow changes fail.

**Graphify queries to run before implementation:** `How do AreaStatus and CanonicalStatus connect to Task transitions?`; `Which rules protect one default per canonical group?`; `What must be reassigned when a status is retired?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-038 | A user can see an Area's ordered workflow and canonical mappings. | Active and retired statuses, defaults, order, mapping, and workflow ETag are owner-scoped and understandable without color alone. | API, C, E2E, CT |
| BL-039 | A user can add and rename a local status. | Name is normalized unique inside the Area; exactly one canonical mapping is required; another Area/User status cannot be referenced. | U, API, DB, C |
| BL-040 | A user can reorder statuses and choose one default per canonical group. | Complete workflow save is atomic; every canonical group retains at least one active status and exactly one default; stale save leaves prior workflow intact. | U, API, DB, C, E2E |
| BL-041 | A user can retire an in-use status by selecting a valid replacement. | Replacement is active, same Area, and same canonical group; every affected owned Task is reassigned atomically; no partial retirement commits. | U, API, DB, C, E2E |
| BL-042 | A user can change a Task's exact Area status from detail and Area collections. | The status belongs to the Task Area; derived canonical group and completion time remain consistent; all projections invalidate/update. | U, API, DB, C, E2E |
| BL-043 | A user can issue a canonical status change from a global context. | The Task Area's current default is chosen; invalid workflow blocks safely; completion/reopen semantics match Domain rules. | U, API, DB, E2E |

**Epic acceptance criteria:** Each Area always has a valid workflow; local statuses map exactly once; defaults are unique; retirement cannot orphan Tasks; exact and canonical transitions remain consistent across Task detail and collections.

**Required tests:** U for status/default/transition rules; API/DB for full workflow replacement, uniqueness, reassignment, stale/race behavior; C/E2E for editor, non-color mapping, confirmation, and status changes; CT for workflow command.

**Definition of done:** FR-087–FR-089 and the transition foundation for FR-090 pass; architecture tests preserve planning/tasks boundaries; every status action has keyboard access and localized guidance.

**Explicitly excluded work:** User-defined global canonical groups, workflow automation, Project-specific statuses, WIP limits, collaboration approvals, and Area Kanban presentation until EPIC-010.

## EPIC-008 — List view

**Goal:** Provide one owner-scoped, automatically sorted global and Area Task review experience.

**User value:** The User can scan structured work efficiently without changing Task or Kanban order.

**Dependencies:** EPIC-005 and EPIC-007; EPIC-006 for Project context.

**Related requirement IDs:** US-015, FR-039–FR-040, FR-044, FR-059, FR-063–FR-064, NFR-005, NFR-008, AC-006.

**Related domain concepts:** Task projection, CanonicalStatus/AreaStatus, date values, independent List sorting.

**API impact:** `GET /tasks` and `GET /areas/{areaId}/tasks` cursor/filter/sort projections.

**Data impact:** Owner-leading List/date/status candidate indexes; no new mutable ordering field.

**Frontend impact:** Global/Area List, automatic sort controls, pagination, row context, preserved detail-return state, empty/loading/error states.

**Backend impact:** `work-views` owner-scoped read models using planning/tasks ports or read adapters.

**Security considerations:** Owner filters precede pagination/counts; cursors bind to owner/filter/sort; no foreign placeholders; authored content is escaped and not logged.

**Graphify queries to run before implementation:** `Which requirements define List sorting and context?`; `How does Work Views Module read Task and Planning data without owning aggregates?`; `What states are excluded from active List?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-044 | A user can scan active Tasks from all Areas in one List. | Each Task appears once with Area/optional Project/status/date context; only owned active data appears; the default sort matches UXF-015. | API, DB, C, E2E |
| BL-045 | A user can choose an approved automatic sort. | Planned, due, priority, title, created, updated, and canonical sorts are stable with Task-ID tie-break; missing dates follow approved placement; sorting mutates no Task/rank. | U, API, DB, C |
| BL-046 | A user can page through a stable List. | Cursor is opaque and bound to the current query; malformed/mismatched cursor returns safe error; refresh restarts cleanly without cross-user data. | API, DB, C |
| BL-047 | A user can review the same List inside an Area. | Results include direct and Project Tasks from only that Area; Project context is visible; wrong/foreign Area is non-disclosing. | API, DB, C, E2E |
| BL-048 | A user returns from Task detail to the same List context. | Sort, pagination position, scroll, and current query state are retained for the session; changed Task data refreshes consistently. | C, E2E |
| BL-049 | A user receives distinct no-Task, no-match, loading, and recoverable error states. | Each state has the approved action, preserves focus/query where applicable, and announces status accessibly. | C, E2E, A11Y |

**Epic acceptance criteria:** Global and Area Lists are owner-safe, deterministic, automatically sorted, cursor-paged, context-preserving, and consistent after mutations; List actions never modify board ranks.

**Required tests:** U for sort tuples; API/DB for owner/cursor/sort/index behavior; C/E2E for rows, detail return, states, and keyboard use; CT for filter/sort/cursor contract.

**Definition of done:** US-015 and FR-059 pass; measured query plans are recorded for the reference fixture without claiming final scale; loading/empty/error states satisfy UX IDs.

**Explicitly excluded work:** Free-text search, full filter composition, bulk selection, manual List ordering, saved views, Archive/Trash rows, and Kanban presentation.

## EPIC-009 — Global Kanban

**Goal:** Provide one cross-Area board using exactly the fixed canonical groups and an independent manual order.

**User value:** The User can visualize and move all active work through a consistent global workflow.

**Dependencies:** EPIC-007 and EPIC-008; opaque rank support from the Data Model.

**Related requirement IDs:** US-016, FR-034–FR-040, FR-060, FR-063, FR-087–FR-089, NFR-005, A11Y-002–A11Y-005, A11Y-008, AC-006.

**Related domain concepts:** CanonicalStatus, AreaStatus default mapping, Task Global Kanban rank, completion/reopen rules.

**API impact:** Global Kanban read and `POST /tasks/kanban-moves`.

**Data impact:** Global rank scoped by User/canonical group, deterministic Task-ID tie-break, versioned reorder.

**Frontend impact:** Three-column board, manual reorder/status movement, Project/Area card context, filters-ready board state, action-menu and keyboard alternatives.

**Backend impact:** `work-views` board projection and `tasks` canonical transition/reorder use case using planning defaults.

**Security considerations:** Anchors/destination defaults must be owned; rank values remain opaque; foreign/missing anchors collapse to `404`; optimistic rollback cannot expose stale foreign data.

**Graphify queries to run before implementation:** `What makes Global Kanban canonical rather than Area-specific?`; `Which defaults resolve a cross-group move?`; `How are global and Area ranks kept independent?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-050 | A user sees exactly To Do, In Progress, and Completed columns. | Every owned active Task appears once under its derived canonical group with Area/Project context; local status names do not create global columns. | API, DB, C, E2E |
| BL-051 | A user can manually reorder a Task within a canonical column. | Move accepts owned anchors and current ETag; visible order changes only on Global board; equal ranks resolve by Task ID; stale move rolls back visibly. | U, API, DB, C, E2E |
| BL-052 | A user can move a Task between canonical groups. | Target resolves to that Area's default status; completion/reopen rules apply; one atomic response updates status/rank/ETag and all views. | U, API, DB, C, E2E |
| BL-053 | A keyboard/touch user can move and position a card without drag-and-drop. | Named destination and before/after controls produce the same command; focus/result announcement is predictable; no pointer-only outcome exists. | C, E2E, A11Y |
| BL-054 | A user can recover from a concurrent board change. | `412` refreshes the affected context, explains the conflict, preserves intended selection, and never silently overwrites the newer order. | API, C, E2E |

**Epic acceptance criteria:** The board always has three canonical groups; each active owned Task appears once; cross-group moves use local defaults; global ordering is manual, independent, accessible, deterministic, and conflict-safe.

**Required tests:** U for mapping/rank calculations; API/DB for owner anchors, conflicts, completion, tie-breaks; C/E2E for drag, menu, keyboard, touch-equivalent, loading/empty/error; CT for move command.

**Definition of done:** Global portion of AC-006 passes; accessible non-drag flow is not deferred; List and Area ranks remain unchanged by within-column Global reorder.

**Explicitly excluded work:** Custom global columns, cross-user boards, WIP limits, swimlanes, automation, Area-specific columns, and saved board presets.

## EPIC-010 — Area Kanban

**Goal:** Provide an Area-local board using that Area's ordered statuses and a separate manual order.

**User value:** The User can run a tailored local workflow while retaining canonical meaning in global views.

**Dependencies:** EPIC-007 and EPIC-009 ordering/concurrency patterns.

**Related requirement IDs:** US-016, FR-017–FR-024, FR-034–FR-040, FR-087–FR-090, NFR-005, A11Y-004, A11Y-008, AC-004, AC-006.

**Related domain concepts:** Area, AreaStatus, CanonicalStatus mapping, Task Area Kanban rank, Project context.

**API impact:** `GET /areas/{areaId}/kanban` and `POST /areas/{areaId}/kanban-moves`.

**Data impact:** Area rank scoped by Area/status; no mutation of Global rank for local-only reorder.

**Frontend impact:** Dynamic ordered columns, canonical mapping labels, Project card context, workflow settings link, accessible move/position alternatives.

**Backend impact:** `work-views` Area board projection and `tasks` exact-status/reorder use case.

**Security considerations:** Area, Task, status, and anchors share owner/Area; wrong-parent paths are non-disclosing; dynamic column labels are escaped and redacted from telemetry.

**Graphify queries to run before implementation:** `Which rules distinguish Area Kanban from Global Kanban?`; `How do Area status order and Area Task rank interact?`; `What validates an Area board move?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-055 | A user sees an Area board with its active statuses in configured order. | Columns match the owned workflow exactly; canonical mapping is communicated without color alone; direct and Project Tasks appear once. | API, DB, C, E2E |
| BL-056 | A user can reorder a Task within an Area status. | Only Area rank changes; destination/anchors are same Area/status and owner; stale state is rejected and recoverable. | U, API, DB, C |
| BL-057 | A user can move a Task to another named Area status. | Exact target status and derived canonical group update atomically; Area rank changes; Global rank changes only as required for entering its new canonical scope, not for local-only reorder. | U, API, DB, C, E2E |
| BL-058 | A keyboard/touch user can move and position an Area card without dragging. | The menu names local status and canonical meaning; before/after placement is keyboard operable; focus/result announcement matches Global board quality. | C, E2E, A11Y |
| BL-059 | A user can reach workflow repair when the Area configuration is invalid. | Move is blocked without partial change; safe explanation links to owned workflow settings; foreign workflow facts are not exposed. | API, C, E2E |

**Epic acceptance criteria:** Area columns follow configured status order; each Task preserves Area/Project context; exact status and canonical meaning stay consistent; Area rank is independent and accessible; invalid workflows fail safely.

**Required tests:** U for exact/canonical/rank effects; API/DB for same-Area anchors and conflict/race cases; C/E2E for dynamic columns, accessible alternatives, empty/error states; CT for board response and move command.

**Definition of done:** FR-090 and the Area half of AC-006 pass; Global and List views reflect status changes without inheriting local reorder; workflow settings remain the sole configuration authority.

**Explicitly excluded work:** Cross-Area cards on an Area board, Project Kanban, arbitrary canonical groups, WIP limits, automation, and collaborative assignment.

## EPIC-011 — Today planning

**Goal:** Make Today the primary daily planning and execution surface using the User's account-local date.

**User value:** The User can immediately see overdue, planned-today, and due-today work and act without duplicate rows.

**Dependencies:** EPIC-005 and EPIC-008; EPIC-007 for status choices; confirmed time zone from EPIC-003.

**Related requirement IDs:** US-014, FR-039–FR-046, FR-061–FR-064, NFR-005, NFR-008, NFR-012, SC-003, AC-009, RA-002.

**Related domain concepts:** Task, account time zone, date-only/timed values, overdue classification, completion.

**API impact:** `GET /tasks/today` and existing Task/checklist/status mutations.

**Data impact:** Owner/lifecycle/date candidate indexes; no separate Today persistence.

**Frontend impact:** Today sections/reason badges, quick add defaulting planned date, automatic sort, completed-today collapsed section, time-zone discoverability.

**Backend impact:** `work-views` Today projection using `accounts` time zone and `tasks` state.

**Security considerations:** Owner and active-lifecycle scope before date classification; no foreign counts; deterministic clock; time zone cannot be overridden per request to probe data.

**Graphify queries to run before implementation:** `Which date and time rules determine Today and overdue?`; `How must duplicate inclusion reasons be presented?`; `Which Task mutations are available from Today?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-060 | A user lands on Today with the account-local date and zone discoverable. | Authenticated default route is Today; date derives from confirmed account zone; boundary tests cover before/after midnight and DST behavior. | U, API, C, E2E |
| BL-061 | A user sees overdue Tasks first with explicit reasons. | Only non-completed active owned Tasks past due appear; date-only and timed comparisons follow Domain rules; order is deterministic. | U, API, DB, C |
| BL-062 | A user sees planned-today and due-today Tasks without duplicates. | A multi-match Task appears once in the precedence section and displays every applicable reason; due-today excludes rows already rendered. | U, API, C, E2E |
| BL-063 | A user can review completed-today work without losing focus on active work. | Completed-today is collapsed by default, expandable, owner-scoped, and excluded from overdue/planned/due active sections. | API, C, E2E |
| BL-064 | A user can create a Task planned for today quickly. | Planned date defaults to Today but can be cleared; Area remains required; success appears in the correct section and other views. | API, C, E2E |
| BL-065 | A user can update status, checklist, and dates from Today. | Existing versioned mutations work without losing section context; a Task moves/removes correctly after its inclusion reason changes; announcements are accessible. | API, C, E2E |

**Epic acceptance criteria:** Today uses account-local semantics, has unique Task display with multiple reasons, approved section precedence/sort, quick capture, core actions, and consistent mutation results.

**Required tests:** U with deterministic clocks for classification; API/DB for owner/date/index behavior; C/E2E for all sections, multi-reason, quick add, mutations, empty/loading/error; CT for Today projection.

**Definition of done:** AC-009 passes across representative time zones and DST edges; Today is not a separate data store; compact and wide semantics are present before hardening.

**Explicitly excluded work:** Calendar UI, manual Today ordering, daily notes, time tracking, capacity planning, reminder delivery, and analytics.

## EPIC-012 — Recurring Tasks

**Goal:** Let a User configure calendar-based or completion-based recurrence that creates exactly one next open occurrence after completion.

**User value:** Repeated obligations continue reliably without manual recreation or historical backfill.

**Dependencies:** EPIC-005, EPIC-007 completion/status semantics, EPIC-011 time rules; worker foundation for recovery, though normal successor creation is transactional with completion.

**Related requirement IDs:** US-011–US-012, FR-047–FR-053, NFR-005–NFR-007, NFR-012, SC-004, AC-007, RA-003.

**Related domain concepts:** RecurrenceSeries, RecurrenceRuleVersion, Task occurrence, one-open invariant, predecessor/generation key, future template.

**API impact:** Recurrence create/replace/stop and recurring completion through Task status transition.

**Data impact:** Series, immutable rule versions, occurrence/predecessor/generation uniqueness, open-occurrence guard, copied future template.

**Frontend impact:** Mode/preset/custom editor, plain-language preview, edit scope, series state, completion successor feedback, conflict recovery.

**Backend impact:** `tasks` recurrence engine and transactional successor generation; recovery-safe idempotency.

**Security considerations:** Series/rule/template/Area/Project/Labels share owner; request cannot select successor ID; retries return existing successor; recurrence content is redacted.

**Graphify queries to run before implementation:** `What links Task completion to recurrence generation?`; `Which rules enforce one open occurrence and no backfill?`; `What is copied or never copied to a successor?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-066 | A user can configure and preview a Calendar Based rule. | Valid daily/weekday/weekly/monthly/yearly/custom patterns produce deterministic account-local previews; missing/invalid selections are rejected; a planned or due anchor exists. | U, API, C, CT |
| BL-067 | A user can configure and preview a Completion Based rule. | Positive day/week/month interval is required; preview explains completion anchoring; calendar and completion modes cannot coexist. | U, API, C |
| BL-068 | Completing the open occurrence creates exactly one successor. | Completion and successor commit together; successor uses one future slot, default To Do status, copied approved template, reset checklist, no Notification history; response returns created/found successor. | U, API, DB, E2E |
| BL-069 | Retrying concurrent completion cannot create a duplicate. | Two requests/workers produce one successor, one occurrence number, one predecessor/generation key, and the same semantic replay result. | U, API, DB |
| BL-070 | A delayed Calendar occurrence skips missed slots. | The first eligible slot is strictly after the approved anchor/completion boundary; historical missed Tasks are not created; fixed calendar meaning remains. | U, DB, E2E |
| BL-071 | A user can change this occurrence without rewriting future history. | Current-only changes affect one Task; completed historical occurrences and producing rule version remain unchanged. | U, API, DB, C |
| BL-072 | A user can change this and future occurrences through a new version. | A later immutable rule/template version is created; future generation uses it; completed history keeps prior meaning; owner/Area/Project remain compatible. | U, API, DB, C, E2E |
| BL-073 | A user can stop future recurrence. | Stop is explicit and versioned; current/history remain Tasks; no future successor is generated after valid stop; retry is safe. | U, API, DB, C |
| BL-074 | A user receives a safe response when reopening conflicts with an existing successor. | Reopen is rejected without mutation while another open occurrence exists; explanation offers valid stop/remove-future path without rewriting history. | U, API, C, E2E |
| SPIKE-002 | The team proves the physical one-open constraint and race strategy with Prisma/PostgreSQL. | A written experiment compares conditional uniqueness/custom migration and serialized alternatives, includes two-writer evidence, and selects a constraint/locking approach without treating the experiment as production code. | DB |

**Epic acceptance criteria:** Both modes are distinct; at most one open occurrence exists; next generation happens only after completion; no missed-slot backfill occurs; retries produce one successor; edits version future behavior; history remains stable.

**Required tests:** Extensive U calendar/time/DST matrix; API/DB concurrency/idempotency/ownership and constraint tests; C/E2E for mode selection, preview, completion, edit scopes, stop/conflict; CT for closed mode and error shapes.

**Definition of done:** AC-007 and SC-004 pass; SPIKE-002 evidence is converted into reviewed migration/transaction implementation inside the relevant stories; recurrence tests use deterministic clocks and two owners.

**Explicitly excluded work:** Multiple simultaneous open occurrences, schedule-driven pre-generation, historical backfill, count/end-date termination, cron text entry, workflow automation, and cross-user series.

## EPIC-013 — Search and filters

**Goal:** Let a User find active Tasks by remembered text and combine approved filters consistently across discovery views.

**User value:** Work remains discoverable as the private Task set grows.

**Dependencies:** EPIC-008; EPIC-006/EPIC-007 for Project/status facets; EPIC-011 for date-state semantics.

**Related requirement IDs:** US-017–US-018, FR-063–FR-069, NFR-001, NFR-005, NFR-008, SC-006, AC-002, AC-010.

**Related domain concepts:** Task, Label, Area, Project, CanonicalStatus, AreaStatus, date-state projection.

**API impact:** `GET /search/tasks` plus approved filters on Task/List/Kanban/Today routes.

**Data impact:** Owner-leading PostgreSQL full-text search projection/index and owner/facet/date indexes validated by query plans.

**Frontend impact:** Global lightweight search, full results route, filter sheet/inline controls, AND/OR semantics, removable tokens, Clear All, preserved state.

**Backend impact:** `work-views` search/filter projections without introducing a search service.

**Security considerations:** `userId` constrains candidates before result/snippet/count; query/cursor is bounded and not logged; foreign content never influences suggestions; snippets are escaped.

**Graphify queries to run before implementation:** `Which requirements define search scope and filter composition?`; `What owner and lifecycle constraints apply before search ranking?`; `Which facets depend on Area or Project compatibility?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-075 | A user can search owned active Task titles and descriptions. | Bounded query returns only owned active Tasks with safe context/snippets; archived/trashed/foreign content contributes no result, suggestion, or count. | API, DB, C, E2E, SEC |
| BL-076 | A user can open full paged search results and return to context. | Cursor binds to owner/query/filter/sort; detail return preserves search state; malformed cursor/query gives safe recovery. | API, C, E2E |
| BL-077 | A user can filter by Area, Project, canonical status, and coherent Area status. | Categories combine with AND, multiple values within one category use OR; incompatible owned relationships return empty or documented validation without leakage. | U, API, DB, C |
| BL-078 | A user can filter by priority, Labels, planned state, due state, and overdue state. | Date evaluation uses account zone; Label matches are owner-scoped; multiple facets produce deterministic results and stable pagination. | U, API, DB, C, E2E |
| BL-079 | A user can understand and clear active criteria. | Removable tokens and count reflect effective filters; Clear All restores active unfiltered view; compact sheet and wide controls have equivalent semantics. | C, E2E, A11Y |
| SPIKE-003 | The team knows PostgreSQL search meets the bounded MVP target on a reference dataset. | A documented representative dataset/machine/query suite measures correctness and p95; query plans prove owner-leading scope; failure identifies a tuning decision without introducing an external search service. | DB |

**Epic acceptance criteria:** Search covers title/description only, filters compose exactly as approved, cursors are stable/opaque, current-owner active scope is absolute, and the reference dataset meets or explicitly gates the approved target.

**Required tests:** U for filter/date semantics; API/DB for query, owner scope, cursors, plans; C/E2E for search/filter/clear/detail-return/compact sheet; SEC for query/log redaction; CT for filter enums.

**Definition of done:** US-017/US-018 and search/filter portion of AC-010 pass; SPIKE-003 evidence sets the release measurement baseline; no dedicated search infrastructure is added without a new decision.

**Explicitly excluded work:** Archived/Trash global search, saved searches, fuzzy semantic search, analytics, attachments, Label free-text matching, external search engines, and cross-user discovery.

## EPIC-014 — Bulk actions

**Goal:** Let a User select several Tasks and safely apply supported maintenance actions with per-item outcomes.

**User value:** Routine changes take one understandable action without sacrificing correctness or privacy.

**Dependencies:** EPIC-007, EPIC-008, EPIC-013; lifecycle commands from EPIC-016 are integrated when that epic lands.

**Related requirement IDs:** US-019, FR-036, FR-067–FR-072, FR-073–FR-076, NFR-001, NFR-005, NFR-013, SC-006, AC-010, AC-014.

**Related domain concepts:** Task bulk command, per-item ownership/atomicity, AreaStatus defaults, Label/TaskLabel, lifecycle state.

**API impact:** `POST /tasks/bulk-actions` with ordered items, per-item ETags, idempotency, and safe result problems.

**Data impact:** One transaction per Task, batch idempotency record, no batch-wide partial mutation inside one item.

**Frontend impact:** Selection mode, count/scope, action bar, confirmation, partial-result summary, failed-item retry, keyboard operation.

**Backend impact:** `tasks` bulk coordinator delegating each action to existing use cases; lifecycle integration through declared port.

**Security considerations:** Each item owner is checked independently; foreign/missing parity; max 100 items; result order reveals no foreign distinction; idempotency fingerprints minimize content.

**Graphify queries to run before implementation:** `Which bulk actions are in MVP and what is each atomic boundary?`; `How do global and Area status bulk changes differ?`; `Which failures may be reported per item without enumeration?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-080 | A user can enter keyboard-operable selection mode in supported collections. | Selected count and visible scope remain explicit; duplicate IDs are impossible; leaving mode restores focus; selection survives a safe background refresh. | C, E2E, A11Y |
| BL-081 | A user can bulk-change canonical status across Areas. | Each Task uses its own Area default; each item is atomic/stale-checked; full and partial outcomes are reported in input order. | U, API, DB, C, E2E |
| BL-082 | A user can bulk-change exact status inside one Area. | Only Tasks in the owned Area are eligible; target status is exact and compatible; incoherent mixed scope is blocked before mutation. | U, API, DB, C |
| BL-083 | A user can bulk-add or remove owned Labels. | Duplicate links are avoided; removal is safe when absent; foreign Labels/Tasks use non-disclosing item failures; retries do not duplicate assignments. | U, API, DB, C |
| BL-084 | A user receives actionable partial-result feedback. | Success/failed counts match ordered results; failed Tasks remain selected; safe reason/refresh/retry is available; successful Tasks are not rerun accidentally. | API, C, E2E |
| BL-085 | A user can bulk-Archive or move Tasks to Trash after lifecycle integration. | Confirmation names scope; each Task uses the approved lifecycle command; retries are idempotent; unavailable items do not disclose ownership; active views update. | API, DB, C, E2E |

**Epic acceptance criteria:** Supported views select Tasks accessibly; canonical/exact status and Label operations work; lifecycle actions integrate when available; each item is atomic; partial outcomes are safe, ordered, and retryable.

**Required tests:** U for action compatibility; API/DB for per-item ownership, ETags, idempotency, partial success, max/duplicate validation; C/E2E for selection, confirmation, result/retry/focus; CT for result union.

**Definition of done:** AC-010 passes including partial failures and two-owner attempts; no “backend-only bulk” route lacks a usable UI outcome; BL-085 is completed with EPIC-016 before MVP completion.

**Explicitly excluded work:** Bulk edit of arbitrary fields, cross-resource Project/Area bulk actions, one giant all-or-nothing batch, selection across hidden pages without explicit scope, scheduled bulk work, and collaboration assignment.

## EPIC-015 — Notifications

**Goal:** Let a User define date-based Task reminders and receive/read private in-app Notifications according to one persisted preference.

**User value:** Important planned or due work is surfaced at the intended account-local time without requiring email or push.

**Dependencies:** EPIC-005 Task dates, EPIC-011 time semantics, EPIC-001 worker leasing; EPIC-012 for copying reminder definitions to successors.

**Related requirement IDs:** US-013, US-027, FR-054–FR-058, FR-091–FR-093, NFR-001, NFR-004–NFR-006, NFR-012, SC-005, AC-008, AC-016, RA-005, RA-013.

**Related domain concepts:** TaskReminder, Notification, User notification preference, Triggered/Suppressed states.

**API impact:** Task reminder CRUD, Notification list/summary/read actions, `/users/me` preference mutation; Notification creation remains internal.

**Data impact:** Reminder schedule/state, unique Notification source, User preference, due-work/job rows, read/version fields.

**Frontend impact:** Reminder editor/preview, bell/unread count, notification panel/route, unavailable target, read actions, preference setting and suppression copy.

**Backend impact:** `tasks` reminder definitions, `notifications` delivery/read state, worker due processing, `accounts` preference port.

**Security considerations:** Same-owner Task/reminder/Notification; preference read and due transition serialize; no email/SMS/push fields; personal text redaction; unavailable targets are generic.

**Graphify queries to run before implementation:** `How do TaskReminder, Notification, User preference, and worker connect?`; `What prevents duplicate or backfilled Notifications?`; `Which lifecycle states pause reminder delivery?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-086 | A user can add one planned/due reminder with a preview. | Anchor must contain time; approved preset/custom offset resolves one UTC instant and account-local preview; equivalent active duplicate is rejected. | U, API, DB, C, E2E |
| BL-087 | A user can manage multiple reminder definitions independently. | Reminders list chronologically; edit recalculates schedule; delete affects only that definition; stale Task ETag prevents mixed changes. | API, DB, C, E2E |
| BL-088 | A due reminder creates at most one unread Notification when preference is Enabled. | Concurrent workers transition once, insert/find one source Notification, meet retry rules, and record safe operational timing without authored content. | U, DB, API |
| BL-089 | A due reminder is Suppressed without Notification when preference is Disabled. | Preference read and terminal transition commit atomically; reminder definition/history remain; re-enable never backfills the Suppressed instant. | U, DB, API, E2E |
| BL-090 | A user can enable or disable future in-app reminder Notifications. | Default is Enabled; mutation uses User ETag and explicit consequence acknowledgement; settings and Notification empty state reflect the current value. | API, C, E2E, CT |
| BL-091 | A user can review private Notifications and unread count. | Owner-scoped cursor list/summary is ordered; unread count has accessible text; unavailable Task target shows generic state with no leaked title/context. | API, DB, C, E2E, A11Y |
| BL-092 | A user can mark one or visible Notifications read. | Read is one-way in MVP; one/all-visible actions are idempotent and stale-safe; count and list update consistently; foreign IDs are non-disclosing. | API, DB, C, E2E |
| BL-093 | A recurring successor receives reminder definitions but no delivery history. | Copied definitions resolve against the new occurrence; Triggered/Suppressed/read states and Notifications are never copied; duplicates remain impossible. | U, DB, E2E |

**Epic acceptance criteria:** Multiple reminders validate/preview correctly; Enabled produces one Notification, Disabled produces none and Suppressed is never replayed; read state/count are consistent; recurring copy and ownership rules hold.

**Required tests:** U for schedules/time zones/preferences; DB concurrency/lease/source uniqueness; API for CRUD/read/owner/errors; C/E2E for editor, bell, center, settings, unavailable/empty states; SEC for redaction; CT for preference and Notification shapes.

**Definition of done:** AC-008 and AC-016 pass under deterministic clocks and concurrent-worker tests; normal materialization target is measured; worker failure is observable and bounded; no out-of-scope channel exists.

**Explicitly excluded work:** Email, SMS, native push, browser push, notification actions beyond opening/reading, backfill, snooze, arbitrary reminder channels, and marketing messages.

## EPIC-016 — Archive and Trash

**Goal:** Provide distinct recoverable Archive and 30-day Trash lifecycles for Areas, Projects, and Tasks, plus coherent restore and irreversible purge.

**User value:** Inactive or accidentally removed work can be recovered, while permanent deletion is explicit and predictable.

**Dependencies:** EPIC-004–EPIC-007, EPIC-012 recurrence pause behavior, EPIC-015 reminder pause behavior, EPIC-001 worker; EPIC-002 account-deletion initiation.

**Related requirement IDs:** US-020–US-022, US-026, FR-008–FR-010, FR-026, FR-063, FR-073–FR-082, NFR-001, NFR-005, NFR-007, PRV-006–PRV-008, SC-007, AC-001, AC-011, AC-014.

**Related domain concepts:** Archive State, Trash State, LifecycleOperation/Effect, cascade provenance, coherent restore, AccountDeletionProcess.

**API impact:** Archive/Trash collections/details, per-resource archive/trash, restore, permanent-deletion commands; account purge remains internal durable processing after initiation.

**Data impact:** Lifecycle fields, operation/effect provenance, immutable first Trash deadline, dependent-first purge, deletion replay, worker eligibility.

**Frontend impact:** Archive/Trash routes, type filters, scope previews, expiry, destination selection, irreversible confirmations, safe unavailable/result states.

**Backend impact:** `lifecycle` coordinator spanning planning/tasks/notifications/accounts; worker expiry/account-purge handlers; read projections.

**Security considerations:** Owner/cascade scope first; restore destinations are explicit and owned; recent re-auth for permanent deletion; idempotent purge; no title/content in deletion receipts; backup replay policy.

**Graphify queries to run before implementation:** `How do lifecycle cascades affect Area, Project, Task, recurrence, reminders, and Notifications?`; `What restore choices are valid when parents are unavailable?`; `What is removed by permanent Task, Project, Area, or User deletion?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-094 | A user can Archive and restore one Task. | Archive excludes active views, pauses reminder/recurrence eligibility, retains data indefinitely; restore returns prior coherent state/ranks and no reminder backfill. | U, API, DB, C, E2E |
| BL-095 | A user can Archive/restore a Project with matching descendant effects. | Preview/confirmation names owned Task count; only Tasks archived by that operation are restored; independently archived Tasks remain archived. | U, API, DB, C, E2E |
| BL-096 | A user can Archive/restore an Area with matching descendant effects. | Area/eligible Projects/Tasks change atomically; operation/effects preserve prior states; independently archived descendants remain unchanged on restore. | U, API, DB, E2E |
| BL-097 | A user can browse Archive by resource type. | Only owned archived roots appear with safe original context; cursor/sort are deterministic; active/trashed/foreign content contributes no rows/counts. | API, DB, C, E2E |
| BL-098 | A user can move a Task to Trash and restore before 30 days. | First `purgeAfter` is exactly 30 days and never extends; active/Archive views exclude it; restore uses original or explicit compatible owned destination and canonical mapping. | U, API, DB, C, E2E |
| BL-099 | A user can Trash/restore a Project with coherent descendants. | Matching Tasks share cascade deadline unless earlier independently trashed; restore reverses only matching effects; unavailable Area requires explicit restore chain or target Area. | U, API, DB, C, E2E |
| BL-100 | A user can Trash/restore an Area with coherent descendants. | Required children cannot be active below it; one atomic operation records scope/prior states; restore never guesses and keeps earlier child deadlines. | U, API, DB, C, E2E |
| BL-101 | A user can browse Trash and understand deletion timing. | Only owned items appear with `purgeAfter`/remaining time; sorting by Trash/deadline is stable; empty state explains recovery without hidden counts. | API, C, E2E, A11Y |
| BL-102 | A reauthenticated user can permanently delete a trashed root. | Confirmation names type/descendant scope; dependent-first removal is idempotent; Project/Area deletion removes contained Tasks rather than orphaning/detaching; result cannot be restored. | U, API, DB, E2E, SEC |
| BL-103 | Eligible Trash expires automatically and races safely with restore. | Worker and restore compete through one conditional state/version outcome; expiry has the same effects as manual deletion; read requests never extend deadline. | U, DB, API |
| BL-104 | Confirmed account deletion purges all primary owned data and preserves only approved minimal replay evidence. | Access never reopens; retryable process ends only when no primary owned row remains; receipt has no email/content; backup restore replay is tested before traffic. | U, DB, E2E, SEC |

**Epic acceptance criteria:** Archive and Trash are distinct; cascades record cause/prior state; restores reverse only matching effects and require coherent parents; deadlines are 30 days and not extended; manual/automatic purge match; account purge removes all primary owned data.

**Required tests:** U lifecycle matrices; API/DB transactions, provenance, restore races, purge order/idempotency, two owners; C/E2E previews, filters, expiry, destination choice, confirmations, focus/announcements; SEC deletion receipt/log/backup-replay review; CT lifecycle unions.

**Definition of done:** AC-011 and full account-deletion behavior pass; BL-085 bulk lifecycle integration passes; deterministic clocks cover deadline boundaries; recovery runbook proves deletion replay; no required orphan can be constructed.

**Explicitly excluded work:** User-configurable Trash duration, restore after permanent deletion, soft-deleted permanent rows, public recovery links, audit-history product UI, legal hold, data export, and collaboration recovery.

## EPIC-017 — Responsive and accessibility hardening

**Goal:** Validate and close cross-journey responsive, keyboard, assistive-technology, and WCAG 2.2 AA gaps across the integrated MVP.

**User value:** Core planning remains understandable and operable on supported desktop/mobile-sized browsers and without pointer-only interaction.

**Dependencies:** Integrated primary journeys from EPIC-002–EPIC-016; continuous accessibility work already performed in each story.

**Related requirement IDs:** US-023–US-024, FR-083–FR-086, NFR-008, NFR-010–NFR-014, A11Y-001–A11Y-010, SC-009–SC-010, AC-012–AC-014.

**Related domain concepts:** No new aggregate; stable status/date/error meanings must survive presentation changes.

**API impact:** No new product behavior expected; verify stable codes/structured parameters support localized accessible feedback.

**Data impact:** None expected; locale/time-zone preferences remain approved User data.

**Frontend impact:** Compact/medium/wide navigation, reflow, focus, landmarks, names/roles/states, live regions, contrast, reduced motion, text expansion, Kanban alternatives.

**Backend impact:** Ensure localized prose is not the only API meaning and diagnostic/error content remains safe.

**Security considerations:** Responsive shells/history/breadcrumbs never leak unavailable names; focus/error summaries do not echo secrets; accessibility tooling uses non-production test data.

**Graphify queries to run before implementation:** `Which core journeys have explicit responsive and accessibility requirements?`; `Where are non-drag Kanban alternatives required?`; `Which dynamic states need assistive announcements?`

### Stories

| ID | User outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-105 | A compact user can reach every approved destination and core action. | Bottom navigation/More, top utilities, full-screen detail, safe areas, and virtual keyboard preserve actions with no page-level horizontal scroll. | C, E2E, A11Y |
| BL-106 | A medium/wide user has stable sidebar, overlays, and detail context. | Approved breakpoints preserve route/selection/unsaved input; collapsed navigation retains names/tooltips; wide panel close restores focus. | C, E2E, A11Y |
| BL-107 | A keyboard user can complete every primary journey. | Logical tab order, Escape/focus restoration, forms, selection, dialogs/sheets, checklist, notifications, lifecycle, and both Kanbans pass the manual/automated keyboard matrix. | C, E2E, A11Y |
| BL-108 | A screen-reader user receives meaningful structure and dynamic feedback. | Page titles/landmarks/headings/names/roles/states are correct; validation/success/error/reminder/bulk feedback is announced without disruptive focus; unavailable states are safe. | C, E2E, A11Y |
| BL-109 | Visual state remains perceivable without color or motion. | Status/priority/date/unread/destructive/mapping have text/icon labels; contrast and visible focus pass; reduced motion is respected; no serious/critical axe findings. | C, E2E, A11Y |
| BL-110 | Turkish content reflows at zoom and remains i18n-ready. | Core pages pass 200% text resize/reflow and representative longer-message expansion; dates/numbers/plurals use locale APIs; semantic keys contain no embedded domain logic. | C, E2E, A11Y |
| BL-111 | Supported browser/viewports execute critical paths. | Latest-two policy is documented; Chromium, Firefox, and WebKit pass compact/wide paths, selected medium paths, and current iOS Safari manual smoke without blocking defects. | E2E, A11Y |

**Epic acceptance criteria:** Every primary journey passes compact/medium/wide, keyboard, non-color, focus, announcement, reflow/zoom, reduced-motion, and browser matrices; no serious/critical automated violation remains; manual screen-reader blockers are zero.

**Required tests:** C with role/label queries and axe; E2E in Chromium/Firefox/WebKit at reference widths; explicit A11Y manual keyboard/screen-reader/contrast/reflow checklist; regression tests for every fixed blocker.

**Definition of done:** AC-012/AC-013 pass; accessibility is a release gate, not a report-only activity; all exceptions have owner, severity, rationale, expiry and explicit approval—MVP core-flow blockers have no exception path.

**Explicitly excluded work:** Native mobile application, platform-specific gestures, a second shipped language, visual redesign, advanced personalization, and WCAG claims beyond tested MVP scope.

## EPIC-018 — Release readiness

**Goal:** Reconcile requirements, secure and measure the complete build, exercise recovery, and produce an auditable MVP release candidate.

**User value:** The released product behaves consistently, protects private data, and can be operated and recovered with known limits.

**Dependencies:** EPIC-001 through EPIC-017 and Stage 9 implementation-readiness approval before production implementation begins.

**Related requirement IDs:** All MVP US/FR/NFR/PRV/A11Y/SC/AC IDs, especially NFR-009, NFR-014–NFR-015, PRV-010, SC-001–SC-011, AC-001–AC-016.

**Related domain concepts:** All approved concepts; emphasis on User isolation, recurrence, lifecycle, Notification, and deletion invariants.

**API impact:** Freeze/review v1 OpenAPI, compatibility baseline, endpoint/error/security coverage, rate and size limits.

**Data impact:** Migration history, representative indexes/plans, backup/restore/deletion replay, retention jobs, production-like seed/reference data only.

**Frontend impact:** Complete Turkish copy review, browser/accessibility matrix, critical-path smoke, privacy/terms disclosures, no unresolved generated-client drift.

**Backend impact:** Capacity/reliability/security review of API/worker, alerts/runbooks, migration/deployment/rollback behavior.

**Security considerations:** Threat-model closure, owner-isolation matrix, secret/dependency/container scans, trusted proxy/cookie/CSRF headers, abuse limits, log/metric privacy, recovery deletion replay.

**Graphify queries to run before implementation:** `Which MVP requirements lack a backlog story, test, endpoint, module, or data concept?`; `Which god nodes have unreviewed change impact?`; `Are any endpoint, entity, module, or production operation orphaned?`

### Stories

| ID | User/operator outcome | Independently verifiable acceptance criteria | Required tests |
| --- | --- | --- | --- |
| BL-112 | Every accepted MVP requirement is traceable to implemented evidence. | A generated/reviewed matrix maps each US/FR/NFR/PRV/A11Y/AC to epic/story, code owner/module, test, and result; no accepted ID is blank or contradicted. | CT, SEC |
| BL-113 | The v1 API and generated client are release-frozen and compatible. | OpenAPI is valid, deterministic, security-complete, drift-free, and compared to baseline; web strict type-check/build uses only the generated transport contract. | CT, API |
| BL-114 | Cross-user access attempts fail uniformly across every endpoint group. | Two-owner positive/negative matrix covers item/nested/list/search/count/bulk/lifecycle/background work; missing/foreign behavior is indistinguishable and leaks no metadata. | API, DB, E2E, SEC |
| BL-115 | Recurrence, reminders, lifecycle, and account purge survive retries and races. | Concurrency suite produces one successor/Notification/terminal lifecycle outcome; restore/expiry race has one winner; purge is resumable and complete. | U, DB, API |
| BL-116 | Measured performance meets the approved operating profile or blocks release. | Reference dataset/machine are published; common API p95, bounded search, reminder delay, queue age, and DB pool metrics meet approved gates; failures have no silent waiver. | API, DB, E2E |
| BL-117 | Operators can deploy, migrate, observe, roll back safely, and restore. | Fresh/upgrade migration, immutable images, readiness, alerts, rollback compatibility, encrypted backup restore, and deletion replay are exercised in a production-like rehearsal. | DB, E2E, SEC |
| BL-118 | The production edge/session configuration matches the security contract. | Same origin, TLS, trusted proxy hops, cookies, CSRF/origin, headers, CORS disabled, request/bulk limits, rate limits, and redaction pass deployed smoke/security checks. | API, E2E, SEC |
| BL-119 | The User sees complete Turkish privacy-safe release content. | Core copy, errors, privacy/terms, Trash/account-deletion disclosures, time-zone/no-backfill behavior, and notification suppression are reviewed in all supported layouts. | C, E2E, A11Y |
| BL-120 | The release candidate has a reviewed operational and product sign-off record. | Known risks, deferred items, artifact SHAs, migration/OpenAPI versions, Graphify freshness, test results, runbooks, and rollback decision are recorded; no critical/high blocker remains. | CT, SEC |

**Epic acceptance criteria:** All AC-001–AC-016 pass; requirement coverage is complete; security/quality/accessibility/performance/recovery gates are green; OpenAPI/client/migrations/graph are fresh; production configuration and runbooks are rehearsed.

**Required tests:** Full U/C/API/DB/E2E/CT/SEC/A11Y portfolio; production-like smoke; manual security/privacy/accessibility review; restore/deletion-replay drill; measured performance suite.

**Definition of done:** A specific immutable revision is promotion-ready from `develop` to `main`; no accepted requirement or critical risk is unresolved; all artifacts and evidence are reviewable; explicit release approval is recorded.

**Explicitly excluded work:** Collaboration, organizations, billing, native mobile, public sharing, email/SMS/push reminders, third-party productivity integrations, data export, microservices, GraphQL, and post-MVP analytics.

## 4. Cross-epic dependency decisions

- **BD-001 — Foundation first:** EPIC-001 creates the enforceable delivery path; no feature story bypasses generated-contract, strict-type, migration, ownership, or test gates.
- **BD-002 — Authentication before personal data:** EPIC-002 establishes the authenticated actor and owner scope before onboarding or planning records are exposed.
- **BD-003 — Narrow onboarding dependency:** EPIC-003 may implement only the owner-scoped creation ports needed for the approved sample Area, defaults, Project, Tasks, Label, and Checklist items; EPIC-004 through EPIC-006 expand those ports into general management behavior.
- **BD-004 — Required hierarchy before views:** Area and core Task behavior precede Project, status customization, List, Kanban, Today, search, bulk, notifications, and lifecycle projections.
- **BD-005 — Canonical status foundation:** EPIC-007 precedes both Kanbans and status bulk actions so every global transition can resolve through a valid local default.
- **BD-006 — Independent ordering:** List sorting never changes Task state; Global and Area Kanban ranks are introduced and tested independently in EPIC-009 and EPIC-010.
- **BD-007 — Time before automation:** Today/date semantics precede recurrence and reminder delivery; deterministic clock and time-zone tests are reused by EPIC-012 and EPIC-015.
- **BD-008 — One worker foundation, later business handlers:** Leasing is proven in EPIC-001; reminder, Trash-expiry, and account-purge handlers are delivered only with their vertical feature epics.
- **BD-009 — Lifecycle integrates existing behavior:** EPIC-016 lands after core aggregates, recurrence, and reminders so pause/restore/purge effects can be validated end to end rather than stubbed.
- **BD-010 — Continuous accessibility:** Each epic includes accessible behavior; EPIC-017 closes integrated cross-journey and browser gaps, not deferred basic semantics.
- **BD-011 — Release evidence, not feature catch-up:** EPIC-018 may fix discovered defects but cannot be used to postpone known requirement work from an earlier epic.
- **BD-012 — Spikes are bounded just-in-time evidence:** SPIKE-001, SPIKE-002, and SPIKE-003 run as the first work of EPIC-001, EPIC-012, and EPIC-013 respectively, before affected production stories. Each must produce a documented decision and follow-up story impact; experiments are not production artifacts.
- **BD-013 — Account deletion crosses two delivery slices:** EPIC-002 owns recent re-authentication, explicit confirmation, durable process initiation, and immediate session/access revocation. EPIC-016 owns the idempotent full primary-data purge, retries, deletion replay, and terminal evidence.

## 5. Coverage and sequencing controls

Before an epic starts:

1. its owning spike, if any, is run just in time and its decision is reflected in affected production stories;
2. all dependency stories required for its first vertical slice are accepted;
3. its Graphify queries are run against a current graph and every material result is source-verified;
4. related requirement, domain, API, data, security, and test references are reviewed;
5. story scope is rechecked against the few-hours target and split without becoming a horizontal layer task;
6. acceptance examples include a second User for every user-owned read or mutation.

Before an epic is accepted:

1. every story produces its complete observable outcome across required layers;
2. the required test levels pass and the generated OpenAPI/client are synchronized when affected;
3. Turkish, responsive, loading, empty, error, conflict, and accessibility states required by the slice are present;
4. logs, metrics, idempotency records, and Graphify outputs contain no secret or unnecessary user-authored content;
5. Graphify is refreshed for meaningful changes and source review confirms no orphan requirement, domain concept, endpoint, entity, module, or test introduced by the epic.

## 6. Stage 8 approval criteria

Stage 8 may be approved only when:

- **BL-AC-001:** The 18-epic sequence and BD-001 through BD-013 dependency decisions are accepted.
- **BL-AC-002:** Every epic contains all required impact, security, Graphify, acceptance, test, done, and exclusion fields.
- **BL-AC-003:** Every story represents one independently verifiable outcome and no story is a standalone frontend/backend/database layer task.
- **BL-AC-004:** Every MVP requirement is assigned to one or more epics and release traceability explicitly prevents unowned requirement IDs.
- **BL-AC-005:** Risky generator, recurrence-constraint, and PostgreSQL-search uncertainties have bounded spikes that do not count as production behavior.
- **BL-AC-006:** Ownership isolation, non-disclosing errors, concurrency, idempotency, accessibility, localization, and responsive behavior remain continuous acceptance concerns.
- **BL-AC-007:** Graphify is updated with this backlog; module/requirement relationships and graph gaps are verified against source documents.
- **BL-AC-008:** Before approval, `PROJECT_MASTER.md` records the draft backlog sequence, dependencies, Graphify metadata, and Stage 8 gate without prematurely closing the stage; after explicit approval, it records the accepted baseline and approval history.
- **BL-AC-009:** No production code, Prisma schema, migration, SQL, controller, React component, or OpenAPI artifact has been created during backlog planning.

## 7. Next-stage entry criteria

Stage 9 — Implementation readiness — may begin only after:

- the User explicitly approves this backlog or its revisions;
- all accepted product requirements have epic/story/test traceability with no blocking contradiction;
- the dependency order and spike outcomes required before implementation are accepted;
- Graphify outputs are current, integrity-checked, secret-reviewed, and source-verified;
- `PROJECT_MASTER.md` records Stage 8 as completed and approved;
- planning remains non-production until Stage 9 is also completed and explicitly approved.
