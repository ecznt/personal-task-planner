# Personal Task Planner — Project Master

| Field | Value |
| --- | --- |
| Repository | `ecznt/personal-task-planner` |
| Document role | Authoritative planning index and decision record |
| Document language | English |
| Last updated | 2026-07-25 |

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
- Authentication supports email/password; the lifecycle includes email verification and password reset.
- Users can request permanent account deletion through an explicitly confirmed flow.
- The product is a responsive web application.
- The first user interface language is Turkish, and the system is designed to remain ready for internationalization.
- First-time users may explicitly choose to create a private editable sample set or start empty; the sample set contains an Area, a Project, representative direct and Project Tasks, a Label, and Checklist items.
- Task dates and reminders use the user's account time zone.
- Date-only Task values preserve their calendar date across time-zone changes; timed values preserve their instant, while future calendar recurrence uses the newly confirmed account time zone.
- Project moves between Areas are atomic and move all contained Tasks while preserving canonical meaning through target Area defaults.
- Every active User has exactly one email/password AuthenticationIdentity in the MVP.
- A normalized verified primary email belongs to at most one retained User.
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
- Social authentication providers, including Google, and provider identity linking in the MVP.
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
| 8. Backlog planning | Produce prioritized epics, stories, acceptance criteria, dependencies, and delivery slices. | Completed and approved |
| 9. Implementation readiness | Reconcile all decisions and confirm that implementation can begin. | Phase 2 Complete — Go; approved |

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
| DEC-017 | 2026-07-19 | Include email verification, password reset, Google authentication, and confirmed account deletion in the MVP account lifecycle. | Google clause superseded by DEC-066; remaining lifecycle approved | User instruction and clarification |
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
| DEC-029 | 2026-07-19 | Require authenticated explicit AuthenticationIdentity linking and prohibit automatic linking based only on matching email addresses. | Superseded for MVP by DEC-066 | User approved the recommended Stage 4 decision package |
| DEC-030 | 2026-07-19 | Draft `docs/domain/DOMAIN_MODEL.md` as the decision-complete Stage 4 domain baseline without persistence, API, or application implementation artifacts. | Approved by DEC-033 | User instruction to begin Stage 4 |
| DEC-031 | 2026-07-19 | Reconcile the approved PRD and UX documents with the approved Stage 4 recurrence, lifecycle, Project-move, time, and identity-linking decisions without changing the MVP boundary. | Approved | Cross-document consistency requirement |
| DEC-032 | 2026-07-19 | Keep Graphify pinned at `0.9.20` and install its official MCP extra as `graphifyy[mcp]==0.9.20` so the project-scoped local stdio server is operational. | Approved and verified | User explicit instruction; stdio MCP verification |
| DEC-033 | 2026-07-19 | Adopt `docs/domain/DOMAIN_MODEL.md` and its reconciled PRD, UX, and Graphify artifacts as the completed Stage 4 domain baseline. | Approved | User explicit phase completion instruction |
| DEC-034 | 2026-07-19 | Revoke access immediately after confirmed account deletion and use a durable, idempotent process to physically purge the User and all primary owned data; defer backup expiry and deletion evidence to Privacy and Architecture. | Approved | User approved the recommended Stage 5 data decision package |
| DEC-035 | 2026-07-19 | Enforce global uniqueness for a normalized verified primary email across retained Users; a matching Google email cannot create a second User or auto-link an identity. | Email uniqueness remains approved; Google clause superseded by DEC-066 | User approved the recommended Stage 5 data decision package |
| DEC-036 | 2026-07-19 | Persist independent opaque rank keys for Global and Area Kanban ordering, with optimistic conflict checks and deterministic Task-ID tie-breaking. | Approved | User approved the recommended Stage 5 data decision package |
| DEC-037 | 2026-07-19 | Draft `docs/data/DATA_MODEL.md` as the Stage 5 conceptual data baseline without Prisma schema, migration, SQL, API schema, or production application code. | Approved by DEC-038 | User instruction to begin Stage 5 |
| DEC-038 | 2026-07-20 | Adopt `docs/data/DATA_MODEL.md` and its synchronized Graphify artifacts as the completed Stage 5 data-design baseline. | Approved | User explicitly confirmed Stage 5 approval |
| DEC-039 | 2026-07-20 | Use opaque server-side sessions in protected host-only cookies, session-bound CSRF protection, and Google Authorization Code flow with PKCE S256, state, and nonce; never expose reusable browser tokens. | Session and CSRF clauses remain approved; Google clause superseded by DEC-066 | User selected option 1A; Stage 6 approval |
| DEC-040 | 2026-07-20 | Preserve explicit re-authenticated Google identity linking and the existing prohibition on automatic email-match linking in every authentication endpoint. | Superseded for MVP by DEC-066 | User selected option 1A; DEC-029, DEC-035, and Stage 6 approval |
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
| DEC-055 | 2026-07-20 | Use the User-directed 18-epic sequence from repository foundation through release readiness as the Stage 8 delivery order, with dependencies recorded in `docs/planning/BACKLOG.md`. | Approved | User instruction; explicit Stage 8 approval |
| DEC-056 | 2026-07-20 | Decompose epics into small independently verifiable vertical stories that may span web, API, database, worker, generated contract, security, and tests; prohibit horizontal layer-only backlog items. | Approved | User instruction; explicit Stage 8 approval |
| DEC-057 | 2026-07-20 | Keep accessibility, localization, ownership, non-disclosure, concurrency, idempotency, OpenAPI/client drift, and testing as continuous story acceptance concerns; use bounded spikes only for generator, recurrence-constraint, and PostgreSQL-search evidence. | Approved | `docs/planning/BACKLOG.md`; explicit Stage 8 approval |
| DEC-058 | 2026-07-21 | Make the optional onboarding sample an ordinary private editable set containing an Area, a Project, representative direct and Project Tasks, a Label, and Checklist items; exclude recurrence and reminders from the sample. | Approved | User selected option 1A; ARC-021 |
| DEC-059 | 2026-07-21 | Split account deletion delivery: Authentication owns recent re-authentication, confirmation, durable initiation, and immediate access revocation; Lifecycle owns idempotent full primary-data purge, retries, deletion replay, and terminal evidence. | Approved | User selected option 2A; DEC-034 |
| DEC-060 | 2026-07-21 | Run each bounded technical spike just in time as the first work of its owning epic; spike experiments remain evidence and never count as production behavior. | Approved | User selected option 3A |
| DEC-061 | 2026-07-21 | Adopt `docs/planning/BACKLOG.md`, its 18-epic order, 122 vertical stories, three just-in-time spikes, dependency decisions, and synchronized Graphify artifacts as the completed Stage 8 backlog baseline. | Story count amended to 120 active MVP stories by DEC-066 | User explicit Stage 8 approval |
| DEC-062 | 2026-07-23 | Reconcile OpenAPI readiness to the approved just-in-time order: `SPIKE-001` is the first non-production work of EPIC-001 and must finish before `BL-003` or any generated production transport artifact. | Approved | User selected readiness option 1A; DEC-060; BD-012 |
| DEC-063 | 2026-07-23 | Set the MVP internal production availability objective to at least 99.5% successful readiness observations over every rolling 30-day window, measured once per minute and including planned maintenance; this is not a contractual SLA. | Approved | User selected readiness option 2A; NFR-009; ARC-017 |
| DEC-064 | 2026-07-23 | Use `docs/planning/GOOGLE_OAUTH_READINESS.md` as the non-secret provider-prerequisite record; close `RA-008` only after explicit User attestation of project administration, test-audience, redirect-registration, and secret-custody capability. | Superseded by DEC-066; readiness artifact removed | User selected readiness option 3A |
| DEC-065 | 2026-07-23 | Adopt the numeric endpoint-class rate-limit windows, persisted sensitive-auth counters, trusted-proxy rule, alert threshold, and time-bounded emergency override in API Contract section 9 and ARC-011 as the MVP implementation baseline. | Approved | User selected readiness option 4A |
| DEC-066 | 2026-07-23 | Remove Google and all other social authentication from the MVP plan. Preserve `US-002`, `FR-005`, `FR-006`, `PRV-005`, `RA-008`, `UXF-005`, `BL-012`, and `BL-013` as deferred/reserved IDs; do not reuse them. Any future provider requires fresh cross-document planning and approval. | Approved scope change | User instruction |
| DEC-067 | 2026-07-23 | Use Graphify proportionally: query the existing graph first with one targeted depth-2 query and an approximately 1,200-token output budget; expand only when insufficient, incrementally extract only materially changed graph-relevant files, and reserve full rebuilds for explicit requests, corruption/incompatibility, unusable staleness, or material repository-wide restructuring. Git-only, status, formatting, wording-only, mechanical, and isolated non-graph changes do not trigger regeneration. | Approved operating policy | User explicit instruction |
| DEC-068 | 2026-07-23 | Confirm `@hey-api/openapi-ts@0.99.0` with `typescript@5.9.3` and its Fetch client as the initial generated-client profile. Use explicit same-origin Fetch credentials without a session-cookie auth callback, read response headers through native `Response.headers`, and retain the `js-yaml@4.3.0` security override until a dedicated upgrade reruns `SPIKE-001`. | Approved by completed technical spike | `SPIKE-001`; ADR-002 |
| DEC-069 | 2026-07-23 | Implement EPIC-001 as the repository foundation only: pin Node.js 24.18.0 and pnpm 11.9.0; keep TypeScript `strict`; use the approved Next.js, NestJS, PostgreSQL 18, Prisma 7, OpenAPI/client, worker-lease, test, CI, logging, and Graphify boundaries; and defer every product feature to later epics. Pin ESLint 9.39.5 for current accessibility-plugin compatibility and use reviewed transitive overrides to keep the dependency audit clear. | Approved implementation plan; implemented and locally verified | User approval of the EPIC-001 implementation plan; BL-001–BL-006 |
| DEC-070 | 2026-07-25 | Implement BL-007 as the first Authentication vertical slice: provide Turkish email/password registration with generic retained-email outcomes, a pending User and email/password AuthenticationIdentity, a hashed 24-hour verification challenge for BL-008, Argon2id password hashing, persistent identity/network abuse counters, anonymous CSRF and strict-origin protection, generated OpenAPI/client updates, and no login, session, social-authentication, planning-data, or collaboration behavior. | Implemented, verified, and accepted | User approval of the BL-007 implementation plan and explicit completion/publish instruction; BL-007 |
| DEC-071 | 2026-07-25 | Implement BL-008 with a manual eight-digit, 24-hour verification code submitted only in the dedicated confirmation body; queue delivery atomically in PostgreSQL and send through a generic SMTP worker with bounded exponential retry and jitter; make resend non-enumerating, invalidate every earlier unused challenge, require CSRF and an idempotency key for confirmation, activate the identity exactly once, and create no session. | Implemented, verified, accepted, and published | User selections 1A, 2A, and 3A; explicit commit/push instruction; green CI; BL-008 |
| DEC-072 | 2026-07-25 | Fix Graphify's token-efficient operating profile: never dump full graph artifacts or unbounded responses; begin with one targeted depth-2 query near 1,200 tokens; project only required fields; avoid rereading unchanged approved documents; refresh at most once after stable material changes; and stop when targeted graph evidence plus direct-source verification answers the question. | Approved operating policy | User explicit instruction |
| DEC-073 | 2026-07-26 | Implement BL-009 with verified email/password login, generic invalid-credential behavior, credential-gated unverified guidance, safe `/app/*` return paths defaulting to `/app/today`, opaque host-only cookie sessions stored only as HMACs, 12-hour idle and seven-day absolute expiry, rotation, a five-session limit, and persisted identity/network abuse limits. | Implemented, verified, accepted, published, and CI-green | User-approved BL-009 implementation plan, selections 1A, 2A, and 3A, explicit implementation acceptance, commit `1fc5514`, and CI run `30177705743`; BL-009 |
| DEC-074 | 2026-07-26 | Implement BL-010 current-device sign-out with CSRF, revoke a valid presented session before clearing its cookie, and return the same idempotent `204` for missing, expired, or already-revoked sessions. Keep the temporary control on the authenticated handoff, then move it to the desktop user menu and mobile More menu; use a full-document redirect to `/login?signedOut=1`. | Implemented and locally verified; publication authorized | User selections 1A and 2A, approved implementation plan, and explicit implementation/publication instruction; BL-010 |

## Open questions

The product boundary is defined in the approved PRD, and UX decisions are recorded in the approved UX document. The following decisions are intentionally deferred and must not be silently assumed:

- What exact visual language, density, and final Turkish interface copy should be adopted without changing the approved UX hierarchy?
- Which exact production provider, region, reverse proxy/ingress, secret manager, monitoring sink, and backup/PITR features will be selected at deployment time?
- What measured reference dataset and execution environment should turn the proposed performance targets into release gates?

## Risks

| Risk | Current response |
| --- | --- |
| The active Node.js version is 25.8.1 rather than the fixed Node.js 24 LTS version. | Resolve and pin the runtime before application scaffolding. |
| The approved planning corpus can make broad Graphify extraction and bundled MCP queries disproportionately expensive. | Apply DEC-067: begin with one targeted existing-graph query, expand only when evidence is insufficient, and extract only the smallest materially changed graph-relevant source set. |
| Removing or failing to refresh `graphify-out/graph.json` would make the Graphify MCP unavailable or stale for affected questions. | Keep the graph versioned; refresh only when material graph relationships change or an explicit rebuild trigger applies, and use direct source as authority for intentionally deferred governance-only refreshes. |
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
| A vertical story can grow into a multi-day horizontal implementation package when cross-layer work is underestimated. | Recheck each story against the few-hours target before implementation and split by independently demonstrable user outcome, never by technical layer. |
| Foundational or lifecycle dependencies can tempt partial feature acceptance before the full user outcome exists. | Track cross-epic completion explicitly; do not count an API, table, worker, or UI fragment as an accepted story until the observable outcome and required tests pass. |
| The current Stage 7 graph contains cohesive module boundaries but no shortest paths from individual module nodes to their matching PRD requirement-group nodes. | Treat this as extraction-density evidence, keep source traceability authoritative, add explicit epic requirement/module/API/data links, and rerun the paths after the Stage 8 graph update. |
| Spike experiments can be mistaken for shippable behavior or silently choose a tool. | Require a written evidence result and backlog/decision impact; production acceptance remains in the implementing story and any changed fixed decision requires approval. |
| The Phase 2 readiness audit originally found four HIGH timing/decision-completeness findings. Three were resolved directly; the remaining external Google-provider dependency was removed from MVP by DEC-066. | Keep social authentication outside the frozen MVP and require a fresh cross-document decision before introducing any provider. |
| The confirmed OpenAPI generator fails strict checking of its generated helper under TypeScript 6.0.3, and its default dependency tree can resolve a vulnerable `js-yaml`. | Keep the exact TypeScript 5.9.3 pin and `js-yaml` 4.3.0 override from DEC-068; rerun the bounded proof before upgrading either the generator or TypeScript. |
| `@hey-api/openapi-ts@0.99.0` generated Fetch helpers do not compile with `exactOptionalPropertyTypes`; disabling that optional strictness flag for the generated-client package would also affect its two thin authored wrapper files. | Keep TypeScript `strict` enabled everywhere, constrain the exception to `packages/api-client`, prohibit business logic there, and rerun the generator compatibility proof before changing the generator or re-enabling the flag. |

## Document index

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/PROJECT_MASTER.md` | Master planning state, decisions, risks, approvals, and document index. | Active |
| `docs/product/PRD.md` | MVP product problem, scope, users, journeys, requirements, acceptance criteria, risks, and UX entry criteria. | Approved; DEC-066 social-authentication deferral applied |
| `docs/product/UX_FLOWS.md` | Information architecture, routes, navigation, primary flows, interaction states, responsiveness, accessibility, and PRD traceability. | Approved; DEC-066 social-authentication deferral applied |
| `docs/domain/DOMAIN_MODEL.md` | Domain language, ownership, concepts, invariants, state transitions, recurrence, lifecycle, and business rules. | Approved; DEC-066 social-authentication deferral applied |
| `docs/data/DATA_MODEL.md` | Conceptual entities, relationships, identifiers, ownership, integrity, lifecycle, retention, ordering, transactions, concurrency, and candidate indexes. | Approved; DEC-066 social-authentication deferral applied |
| `docs/api/API_CONTRACT.md` | Conceptual REST routes, authentication/session security, ownership, errors, pagination, idempotency, concurrency, OpenAPI responsibility, and generated-client policy. | Approved; DEC-066 social-authentication deferral applied |
| `docs/architecture/ARCHITECTURE.md` | Implementation-ready workspace, runtime, module, security, data, operations, CI, testing, accessibility, i18n, and Graphify strategy. | Approved; DEC-066 social-authentication deferral applied |
| `docs/architecture/adr/ADR-001-modular-monolith.md` | Decision record for the modular monolith and separate API/worker runtime entry points. | Accepted |
| `docs/architecture/adr/ADR-002-rest-openapi.md` | Decision record for REST, backend-owned OpenAPI, and generated frontend client. | Accepted |
| `docs/architecture/adr/ADR-003-graphify.md` | Decision record for Graphify use, source authority, token-efficient query/update workflow, staleness, versioning, and secret controls. | Accepted; DEC-067 operating-policy amendment applied |
| `docs/planning/BACKLOG.md` | Ordered vertical-slice epics, small stories, dependencies, requirement ownership, acceptance criteria, tests, exclusions, and Stage 8 gates. | Approved; 120 active MVP stories after DEC-066 |
| `README.md` | Contributor entry point, pinned runtime, local PostgreSQL/bootstrap commands, required quality gates, and generated-artifact workflow. | Implemented by EPIC-001 |
| `docs/planning/READINESS_REPORT.md` | Final cross-document readiness audit, severity-classified findings, traceability checks, Graphify review, and go/no-go recommendation. | Go — zero BLOCKER/HIGH; Phase 2 approved |
| `docs/spikes/SPIKE-001-openapi-generator.md` | Executed OpenAPI generator compatibility evidence, constraints, exact pins, and decision. | Completed |
| `docs/spikes/SPIKE-001/` | Reproducible non-production OpenAPI 3.1 contract, generation, strict type, determinism, and security fixture. | Completed; generated output ignored |
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
- Skill instructions and the task-relevant `update.md` reference were read completely for the BL-007 update on 2026-07-25.
- Graph generation: the required incremental command first exposed an AST subprocess permission/cache failure. The source graph was therefore rebuilt through the official local `graphify update . --force` code-update path, preserving the approved semantic planning graph without adding an LLM key.
- Graph health: passed with 1,185 valid candidate edges and no missing endpoints, dangling edges, self-loops, exact duplicates, or directed/undirected same-endpoint collapse.
- Source-scope control: dependencies, generated clients, Prisma generated output, build/test artifacts, Graphify outputs, environment files, and sensitive paths are excluded. Five previously saved Graphify memory notes force-detected by 0.9.20 were removed from the changed semantic scope and manifest.
- Extraction limitation: Graphify 0.9.20 produced no structural node for the generated OpenAPI JSON and skipped the two SQL migrations because the optional `tree_sitter_sql` extra is not installed. The BL-007 OpenAPI pipeline and PostgreSQL migration were verified from their source files, deterministic contract checks, successful Prisma migration execution, and Testcontainers evidence; no extra Graphify package was installed.
- Sensitive-path review: completed; the graph contains repository-relative source paths only, and Graphify local learning, memory, reflection, vocabulary, incremental, and cost artifacts remain excluded from version control.
- Intended use: architecture discovery and impact analysis.
- Version-control policy: track the project skill and shareable `graphify-out` artifacts, excluding local/intermediate files and `cost.json`.
- Token-efficiency policy: DEC-067 is active. The EPIC-001 refresh used local AST for code, one semantic chunk for eight changed foundation documents/configurations, and one bounded depth-2 MCP impact query; unchanged planning documents were not semantically re-extracted.

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
- No product endpoint lacks an approved Domain basis. Session, CSRF, and token routes are security-supporting operations grounded in User and AuthenticationIdentity; read projections do not introduce new aggregates.
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

Verified Stage 8 graph findings:

- The decision refresh changed the graph from 255 nodes/429 edges/14 communities to 266 nodes/488 edges/13 communities, adding 11 nodes and 61 edges while removing two replaced edges from the re-extracted documents.
- The explicit approval refresh changed the graph from 266 nodes/488 edges/13 communities to 272 nodes/504 edges/14 communities: eight approval-state nodes and 18 edges were added, while two stale draft-state nodes and two stale edges were removed.
- `Vertical Slice Backlog` is a cohesive 36-node community containing the backlog root, requirement ownership, BD-001 through BD-013, all 18 epics, three bounded just-in-time spikes, the explicit public landing/privacy/terms entry point, seven backend-module impact nodes, and the approved Stage 8 delivery decisions.
- `Stage 8 Approval Governance` is a separate 22-node community containing the approved backlog baseline, DEC-055 through DEC-058 and DEC-061, the completion state, Graphify metadata, verified findings, the Stage 8 approval gate, and the Stage 9 entry/handoff state.
- `MVP Requirement Ownership Map` is a top-six graph hub with 19 edges; `EPIC-005 Basic Task Creation and Management` remains a top-ten hub with ten edges, reflecting its central dependency role.
- The full onboarding sample set has a direct EXTRACTED graph relationship to EPIC-003 and the epic links to accounts, onboarding, planning, and tasks module impacts. Source review confirms that ARC-021 supplies the authoritative Area, Project, Task, Label, and Checklist scope and same-port rule.
- EPIC-002 and EPIC-016 have a two-hop EXTRACTED path through the backlog root. Source review confirms BD-013 and the two story definitions make the initiation/revocation versus purge/replay boundary explicit rather than relying on that coarse graph path.
- The public-route backlog node links directly to EPIC-002. Its graph path to the UX route-group node remains longer than the configured six-hop review budget; source review confirms UX routes `/`, `/privacy`, and `/terms` and BL-121 provide the intended direct backlog coverage, so this is extraction density rather than a scope gap.
- Source verification confirms accounts → EPIC-002, onboarding → EPIC-003, planning → EPIC-004/006/007, tasks → EPIC-005/007/009/010/012/014/015, work-views → EPIC-008–011/013, notifications → EPIC-015, and lifecycle → EPIC-016. Cross-module work remains expressed through approved application ports and transaction coordinators.
- Raw inspection and MCP report 504 EXTRACTED edges, zero INFERRED edges, and zero AMBIGUOUS edges. Graph findings were checked against the approved PRD, UX, Architecture, and Backlog rather than accepted as authoritative on their own.

Verified Phase 2 final-scope graph findings:

- The intentional scope refresh reduced the graph from 324 nodes/607 edges/six hyperedges/15 communities to 86 nodes/91 edges/three hyperedges/10 communities by replacing dense obsolete readiness and Google-active extraction with the current concise planning baseline. The force write was intentional because removed scope must not survive the graph.
- `DEC-066 Remove all social authentication from MVP and reserve historical IDs` is the highest-connectivity node with eight edges. Source review confirms this is the expected cross-document scope-change hub rather than a new domain aggregate.
- The `Phase 2 Scope Governance` community contains the frozen email/password-only baseline, zero BLOCKER/HIGH readiness result, and explicit prohibition on starting implementation before final User approval.
- The `Backlog Coverage Baseline` community contains the mechanically verified 178 active accepted requirement IDs, 73 conceptual endpoint rows, 120 active stories, and three bounded spikes.
- Deferred Google/social-authentication nodes connect only to exclusion, reserved-ID history, and future-planning concepts. No provider authorization, callback, linking, unlinking, provider credential, or provider test dependency remains active.
- Graph and source checks confirm no orphan active requirement, unsupported endpoint, ownerless persisted entity, or backlog-less MVP feature. The graph is intentionally concise, so source-level range expansion and direct document checks remain authoritative.
- MCP reports 82% EXTRACTED, 18% INFERRED, and 0% AMBIGUOUS relationships. Inferred cross-document similarities were reviewed against source text and were not used as sole evidence for readiness.

Verified `SPIKE-001` graph findings:

- The incremental refresh changed the graph from 86 nodes/91 edges/three hyperedges/10 communities to 108 nodes/104 edges/four hyperedges/15 communities after replacing the seven changed document slices.
- `Generator Compatibility Profile`, `REST OpenAPI Contract`, `EPIC-001 Delivery Sequence`, and `Generated Client Architecture` are distinct but connected communities. This matches the source boundary: the spike resolves a transport-tool uncertainty and enables later `BL-003` work without satisfying it.
- DEC-068 links the confirmed generator and TypeScript pins to ADR-002 and the spike evidence. The security override, same-origin credentials rule, HttpOnly-cookie constraint, RFC 9457 union, deterministic digest, and response-header limitation are visible in the graph.
- One bounded depth-2 MCP query reached the expected Architecture, ADR-002, API Contract, Backlog, User, AuthenticationIdentity, and security nodes. Direct source and Git review confirmed that the links describe constraints only: no production domain entity, endpoint, database schema, ownership operation, generated production client, or user-visible behavior was added.
- The graph contains historical 86-node readiness metadata because the approved readiness documents record that prior generation. These are audit-history nodes, not evidence that the current 108-node graph is stale.
- MCP reports 88% EXTRACTED, 12% INFERRED, and 0% AMBIGUOUS relationships. All inferred similarities were treated as navigation hints and not as sole decision evidence.

Verified EPIC-001 graph findings:

- The incremental implementation refresh produced 724 nodes, 746 edges, seven hyperedges, and 64 communities; 97% of relationships are EXTRACTED, 3% INFERRED, and 0% AMBIGUOUS.
- `EPIC-001 Repository Foundation and Quality Gates` is a top-five graph hub and connects to the implemented NestJS composition roots, PostgreSQL job leasing, OpenAPI generator/client pipeline, CI, and verified quality gates.
- `PrismaService` and `JobQueueService` are the central runtime nodes. Source and Testcontainers review confirm this is the intentionally infrastructure-only synthetic durable-job boundary, not a Task/product persistence model.
- The broad MCP query also returned planning-only `Task` and `AuthenticationIdentity` nodes because those terms were present in the exclusion question. A direct neighbor check shows the exclusion concept only supports the “foundation without product features” rationale. Source search confirms there is no authored authentication or Task implementation; the sole `auth.gen.ts` filename is a generic generated Fetch-client helper.
- No dependency cycle was detected. The known forbidden-import fixture is rejected by the static architecture gate, and Graphify findings were verified against source, type-check, tests, builds, migration execution, and security scans rather than accepted as authoritative.

Verified BL-007 graph findings:

- The forced local code refresh produced 966 nodes, 1,185 edges, seven hyperedges, and 80 communities; 98% of relationships are EXTRACTED, 2% INFERRED, and 0% AMBIGUOUS.
- `RegisterAccountService`, `AuthSecurityService`, `AccountsRepository`, `CsrfService`, `AnonymousCsrfGuard`, `AuthController`, and the Turkish `RegistrationForm` are present in the updated graph and connect through the intended accounts, API composition, generated-client, and web boundaries.
- `cn()` is the highest-connectivity node with 37 edges because generated shadcn/ui components share the class-name helper. Source review confirms this is mechanical UI composition rather than a domain abstraction or unexpected business dependency.
- `AuthSecurityService` and `AccountsRepository` are expected Authentication-slice hubs with 15 and 14 edges. Their centrality is a review signal for later authentication stories, not evidence of a new cross-module repository dependency.
- Bounded MCP queries found no BL-007 implementation path into login, sessions, social authentication, Task, Project, or collaboration behavior. Source search and changed-file review confirmed the absence of those out-of-scope operations.
- Graph findings were verified against the registration source, Prisma schema/migration, generated OpenAPI/client, automated tests, builds, dependency audit, and secret scan rather than accepted as authoritative on their own.

Verified BL-008 graph findings:

- The incremental local-AST refresh produced 1,075 nodes, 1,365 edges, and 102 communities; 98% of relationships are EXTRACTED, 2% INFERRED, and 0% AMBIGUOUS.
- `AccountsRepository`, `AuthSecurityService`, `AuthController`, `RequestEmailVerificationService`, `VerifyEmailService`, `EmailVerificationJobHandler`, `JobQueueService`, `SmtpVerificationEmailAdapter`, and the Turkish `EmailVerificationForm` are present across the expected accounts, worker, API, persistence, generated-client, and web boundaries.
- `AccountsRepository` and `AuthSecurityService` are expected Authentication hubs with 25 and 24 edges. Source review confirms that neither gained a planning-domain dependency or a cross-module repository consumer.
- `cn()` remains the highest-connectivity node because app-local shadcn/ui components share the class-name helper. It is a mechanical UI hub, not a business abstraction.
- The bounded depth-2 MCP query found the intended verification-delivery chain and no implementation path into login, sessions, social authentication, Task, Project, or collaboration behavior. Source review and architecture checks confirmed those exclusions.
- Graphify skipped the changed SQL migration because the optional SQL parser is not installed and skipped the generated OpenAPI JSON as structurally empty. Prisma validation, Testcontainers migration execution, deterministic OpenAPI/client checks, API/DB tests, and direct source review provide the authoritative evidence for those artifacts.

Verified BL-009 graph findings:

- The incremental local-AST refresh produced 1,139 nodes, 1,508 edges, and 111 communities; 98% of relationships are EXTRACTED, 2% INFERRED, and 0% AMBIGUOUS.
- One bounded depth-2 MCP query found the intended `SessionController` → `LoginService`/`ReadSessionService` → `AccountsRepository`/`AuthSecurityService` chain, the CSRF and cookie helpers, and the `LoginForm` → generated-client boundary.
- Source review confirms session tokens are returned only in the host-only cookie, persisted only as purpose-bound HMACs, owner identity state is checked when a session is read, and no planning-domain dependency or later Authentication operation entered the slice.
- Graphify's missing optional SQL parser and structurally empty generated OpenAPI limitation remain. The migration and contract are instead verified by Prisma validation, successful PostgreSQL migration execution, Testcontainers tests, Redocly, deterministic client generation, and direct source review.

Verified BL-010 graph findings:

- The incremental local-AST refresh produced 1,155 nodes, 1,494 edges, and 120 communities; 98% of relationships are EXTRACTED, 2% INFERRED, and 0% AMBIGUOUS.
- One bounded depth-2 MCP query found the intended `SessionController.deleteSession` → `LogoutService` → `AccountsRepository.revokeSession` chain, CSRF enforcement, cookie helpers, the generated client, `SignOutButton`, and `SessionBoundary`.
- Source review confirms the conditional update revokes only the presented current-session token, cookie clearing occurs only after repository success, and no planning-domain or cross-user resource dependency entered the slice.
- No Prisma schema change or migration was required. The generated OpenAPI limitation remains covered by Redocly, deterministic client generation, API tests, and direct contract review.

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
- Verification: the registered MCP successfully ran one bounded depth-2 `query_graph` against the BL-010 graph; prior `graph_stats`, `god_nodes`, `get_node`, `get_community`, `get_neighbors`, and `shortest_path` verification remains valid.
- Verified graph response: 1,155 nodes, 1,494 edges, and 120 communities. The graph contains 98% EXTRACTED, 2% INFERRED, and 0% AMBIGUOUS relationships.
- Available read-oriented tools: `query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, and `shortest_path`.
- Session note: an already-running Codex desktop session may require a reload before the registered MCP tools appear in its dynamic tool list; this does not affect the successful direct stdio runtime verification.

## Last graph generation metadata

| Field | Value |
| --- | --- |
| Status | Successful |
| Generated at | 2026-07-25T23:23:27Z |
| Graphify version | 0.9.20 |
| Source commit at generation | `800fd24bdcdf74f48409c8d98f5aed18fa5a036a` |
| Working tree at generation | Includes the uncommitted BL-010 current-device sign-out implementation, generated OpenAPI/client artifacts, Turkish web flow, tests, and Graphify outputs; contains no password recovery, account deletion, Task, Project, or collaboration behavior. |
| Input scope | Incremental local-AST `--code-only` update of 16 changed code-classified files with 140 cached/unchanged files. Thirteen documentation files were intentionally skipped without an LLM key; dependencies, generated Prisma output, build/test output, environment files, Graphify outputs/memory, and sensitive paths remain excluded. |
| Output path | `graphify-out/graph.json` |
| Nodes | 1,155 |
| Edges | 1,494 |
| Hyperedges | Not reported by the incremental CLI summary |
| Communities | 120 |
| Graph health | Incremental extraction completed; MCP statistics and bounded impact traversal succeeded. The SQL-parser and generated-OpenAPI limitations were verified through authoritative non-Graphify checks. |
| Recorded semantic tokens | 0 input / 0 output; BL-010 used local AST code extraction and no LLM API key. |
| Reason | Capture BL-010 across current-session revocation, cookie cleanup, generated client, web flow, and tests, then verify that no later Authentication or planning feature entered the slice. |

Update this section after every successful graph generation.

## Skill usage policy

- Read a skill's complete `SKILL.md` before using that skill.
- Read only the referenced files required for the current task, but read each selected reference completely.
- Tell the user which skill is being used and why.
- When `graphify-out/graph.json` exists, use Graphify first for architecture and impact-analysis questions unless an explicit rebuild is requested.
- Start routine MCP use with one targeted depth-2 query and an output budget near 1,200 tokens; expand only when the result is insufficient.
- Never read or print complete `graph.json`, `graph.html`, manifest, generated graph diffs, or unbounded MCP/API responses during routine work; project only the fields required for the current decision.
- Do not run a broad statistics, god-node, and community query suite by default. Run additional graph views only when an acceptance criterion or insufficient first result requires them.
- Filter tool output at the source to counts, identifiers, changed paths, failed checks, and bounded context.
- Do not reread unchanged approved documents merely to repeat prior Graphify analysis. Verify findings from the specific authoritative source locations needed by the current question.
- Do not regenerate Graphify for Git-only actions, status reporting, formatting, wording-only changes, mechanical checks, or isolated changes that do not alter graph-relevant relationships.
- Use incremental extraction only for the smallest materially changed set of requirements, domain, data, API, architecture, dependency, or traceability sources needed by the task.
- For an implementation story, refresh the graph once after material changes and tests are stable; repeat only after a failed/corrupt refresh or another graph-relevant source change.
- Use a full rebuild only for an explicit request, incompatible extraction/ID changes, corruption, unusable staleness, or material repository-wide restructuring.
- Phase completion triggers graph generation only when graph evidence is an explicit gate or the current graph would materially misrepresent the approved architecture.
- Stop graph exploration when the targeted query and direct-source verification answer the question; do not expand traversal for reassurance alone.
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
| 2026-07-21 | Stage 8 — Backlog planning | Completed and approved | User explicitly approved the 18-epic vertical-slice backlog and instructed Codex to commit and push it to `develop`. |
| 2026-07-23 | Stage 9 — Phase 2 readiness | Completed and approved | DEC-066 removed social authentication from MVP, the final audit reports zero BLOCKER/HIGH findings, and the User explicitly approved the Phase 2 plan. |
| 2026-07-23 | Phase 3 — EPIC-001 repository foundation and quality gates | Completed, accepted, committed, and published | BL-001 through BL-006 passed their Definition of Done and the User instructed publication before BL-007 planning began. |
| 2026-07-25 | Phase 3 — BL-007 email/password registration | Completed and accepted; publication requested | Registration behavior, persistence, OpenAPI/client, security controls, tests, Graphify impact review, and documentation passed; the User explicitly accepted completion and requested commit/push. |
| 2026-07-25 | Phase 3 — BL-008 email verification | Completed, accepted, committed, published, and CI-verified | Email verification, resend, durable SMTP delivery, exact-once activation, generated contract/client, security controls, automated tests, and Graphify impact review passed; commit `1386853` was published to `develop` and CI run `30163472149` succeeded. |
| 2026-07-26 | Phase 3 — BL-009 email/password login | Completed, accepted, committed, published, and CI-verified | Login/session behavior, generated contract/client, security controls, automated tests, Graphify impact review, and documentation passed; commit `1fc5514` was published to `develop` and CI run `30177705743` succeeded. |
| 2026-07-26 | Phase 3 — BL-010 current-device sign-out | Completed locally; implementation and publication explicitly authorized | Current-session revocation, cookie cleanup, generated contract/client, accessible web behavior, automated tests, Graphify impact review, and documentation passed; publication to `develop` is in progress. |

## Current planning stage

Phase 3 Implementation — BL-010 Implemented and Locally Verified; Publication In Progress. EPIC-001 and BL-007 through BL-009 are published and CI-verified. Current-device sign-out is implemented; password recovery, account deletion, Task behavior, and all later stories remain unimplemented.

## Next required action

Publish BL-010 to `develop`, confirm GitHub Actions is green, and then prepare the decision-complete BL-011 password-recovery implementation plan without starting its production code.
