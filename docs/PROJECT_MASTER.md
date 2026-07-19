# Personal Task Planner — Project Master

| Field | Value |
| --- | --- |
| Repository | `ecznt/personal-task-planner` |
| Document role | Authoritative planning index and decision record |
| Document language | English |
| Last updated | 2026-07-19 |

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
| 5. Data design | Define the conceptual and logical data model, ownership, lifecycle, and constraints. | Not started |
| 6. API design | Define REST resources, operations, errors, versioning, and the OpenAPI approach. | Not started |
| 7. Solution architecture | Define modular-monolith boundaries, runtime topology, security, observability, and deployment approach. | Not started |
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

## Open questions

The product boundary is defined in the approved PRD, and UX decisions are recorded in the approved UX document. The following decisions are intentionally deferred and must not be silently assumed:

- What scheduling, retry, and delivery guarantees apply to reminders?
- What backup treatment and operational completion rules apply to account deletion and 30-day Trash expiry?
- What deployment, browser-support, quantitative performance, availability, and operating model should be used?
- What exact visual language, density, and final Turkish interface copy should be adopted without changing the approved UX hierarchy?
- Should `develop` become the long-lived default integration branch, or was it only the publication branch for Stage 1?

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
| Parent lifecycle behavior can become inconsistent across Area, Project, and Task. | Apply the Stage 4 cascade-provenance and coherent-restore rules; validate their data representation during Data Design. |
| Dual recurrence modes and multiple reminders create time-zone and duplication risks. | Apply the one-open-occurrence, completion-triggered generation, no-backfill, stable-time, and idempotency rules; define operational delivery during Architecture. |
| Area-specific statuses can drift from their global meaning. | Apply the approved one-mapping, per-group default, retirement-reassignment, and canonical-transition rules. |
| Global bulk status changes may select different local statuses across Areas. | Apply each Task Area's approved default mapping independently and keep the UX outcome explicit. |
| Compact Kanban interaction can become difficult to navigate or inaccessible. | Preserve named status-selection and keyboard alternatives to drag-and-drop. |
| The Stage 4 graph reports 25 weakly connected leaf nodes and two thin communities. | Source review confirmed that most are intentionally leaf-level concepts and that `Future Considerations` is the only fully isolated node; continue verifying graph gaps against source documents. |

## Document index

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/PROJECT_MASTER.md` | Master planning state, decisions, risks, approvals, and document index. | Active |
| `docs/product/PRD.md` | MVP product problem, scope, users, journeys, requirements, acceptance criteria, risks, and UX entry criteria. | Approved, including Stage 3 and Stage 4 reconciliations |
| `docs/product/UX_FLOWS.md` | Information architecture, routes, navigation, primary flows, interaction states, responsiveness, accessibility, and PRD traceability. | Approved; Stage 4 domain decisions reconciled |
| `docs/domain/DOMAIN_MODEL.md` | Domain language, ownership, concepts, invariants, state transitions, recurrence, lifecycle, and business rules. | Approved Stage 4 baseline |
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
- Skill instructions: fully read on 2026-07-19.
- Task-relevant references read: `.agents/skills/graphify/references/exports.md`, `.agents/skills/graphify/references/extraction-spec.md`, and `.agents/skills/graphify/references/update.md`.
- Graph generation: completed successfully from the four current planning documents, including the Stage 4 Domain Model.
- Graph health: passed with no missing endpoints, dangling edges, self-loops, duplicate endpoint collapse, or relation-variant collapse.
- Sensitive-path review: completed; the shareable report title was sanitized and the machine-local statistics cache was excluded from version control.
- Intended use: architecture discovery and impact analysis.
- Version-control policy: track the project skill and shareable `graphify-out` artifacts, excluding local/intermediate files and `cost.json`.

Verified Stage 4 graph findings:

- The Domain Model is a graph hub connected to the PRD, UX flows, Project Master, consistency boundaries, lifecycle rules, recurrence rules, traceability, risks, and the Data Design gate.
- Recurrence and notifications form a cross-document community joining PRD requirements, UX recurrence/reminder flows, and the RecurrenceSeries, RecurrenceRule, TaskReminder, and Notification domain concepts.
- Archive and Trash form a cross-document community joining PRD lifecycle requirements, UX restore/retention flows, and the Archive State, Trash State, and parent-propagation rules.
- Ownership and privacy connect the User and private planning model to PRD privacy expectations and the UX non-disclosing failure state.
- The only fully isolated final node is `Future Considerations`, which is intentionally outside the MVP Domain baseline. Weakly cross-linked persona, navigation, and acceptance nodes were checked against source documents and are covered by explicit requirement traceability; no missing required Domain concept was confirmed.

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
- Verification: a real stdio MCP client completed initialization and successfully called `graph_stats`, `get_community`, `god_nodes`, and `query_graph` against the configured graph on 2026-07-19T19:57:34Z.
- Verified graph response: 118 nodes, 187 edges, 13 communities, 99% extracted relationships, 1% inferred relationships, and 0% ambiguous relationships.
- Available read-oriented tools: `query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, and `shortest_path`.
- Session note: an already-running Codex desktop session may require a reload before the registered MCP tools appear in its dynamic tool list; this does not affect the successful direct stdio runtime verification.

## Last graph generation metadata

| Field | Value |
| --- | --- |
| Status | Successful |
| Generated at | 2026-07-19T20:28:16Z |
| Graphify version | 0.9.20 |
| Source commit at generation | `8caf54bf268c65ab111c90f92443659e7e59a4b3` |
| Input scope | `docs/PROJECT_MASTER.md`, `docs/product/PRD.md`, `docs/product/UX_FLOWS.md`, `docs/domain/DOMAIN_MODEL.md` |
| Output path | `graphify-out/graph.json` |
| Nodes | 122 |
| Edges | 200 |
| Hyperedges | 3 |
| Communities | 13 |
| Graph health | Passed |
| Recorded semantic tokens | 0 input / 0 output; the collaboration extraction tool did not expose token usage, so this is an unavailable measurement rather than evidence of zero model usage. |
| Reason | Synchronize explicit Stage 4 approval and the approved Domain Model baseline before publishing the completed phase. |

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

## Current planning stage

Stage 4 — Domain Analysis — is completed and approved. Stage 5 — Data Design — has not started, and implementation work has not started.

## Next required action

Wait for explicit user instruction to begin Stage 5 — Data Design. Do not create technical schemas, migrations, or production application code before that stage begins and its decisions are developed.
