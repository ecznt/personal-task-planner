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
- The Task workflow uses the fixed statuses To Do, In Progress, and Completed.
- The MVP provides List, Kanban, and Today-focused views, plus search, filtering, and basic bulk actions.
- Archive and Trash apply to Tasks, Projects, and Areas.
- Trash content is permanently deleted after 30 days.
- Authentication supports email/password and Google; the email/password lifecycle includes email verification and password reset.
- Users can request permanent account deletion through an explicitly confirmed flow.
- The product is a responsive web application.
- The first user interface language is Turkish, and the system is designed to remain ready for internationalization.
- First-time users may explicitly choose to create private sample data or start empty.
- Task dates and reminders use the user's account time zone.
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
| 0. Planning infrastructure | Establish the master document, decision controls, and Graphify integration. | Completed |
| 1. Product definition | Define target problems, goals, users, scope, and success criteria through the PRD. | In progress — PRD drafted; approval pending |
| 2. Domain analysis | Define domain language, concepts, rules, workflows, and boundaries. | Not started |
| 3. Data design | Define the conceptual and logical data model, ownership, lifecycle, and constraints. | Not started |
| 4. API design | Define REST resources, operations, errors, versioning, and the OpenAPI approach. | Not started |
| 5. Solution architecture | Define modular-monolith boundaries, runtime topology, security, observability, and deployment approach. | Not started |
| 6. Backlog planning | Produce prioritized epics, stories, acceptance criteria, dependencies, and delivery slices. | Not started |
| 7. Implementation readiness | Reconcile all decisions and confirm that implementation can begin. | Not started |

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
| DEC-009 | 2026-07-19 | Complete Stage 0 and publish its planning artifacts to the remote `develop` branch. | Approved | User instruction |
| DEC-010 | 2026-07-19 | Treat the system as multi-user with strictly isolated personal data and no MVP collaboration, team, or organization model. | Approved | User instruction |
| DEC-011 | 2026-07-19 | Require every Task to belong to an Area; keep Projects optional and contained within one Area. | Approved | User instruction |
| DEC-012 | 2026-07-19 | Support Task descriptions, independent planned and due dates, priority, labels, checklists, recurrence, and multiple in-app reminders. | Approved | User instruction and clarification |
| DEC-013 | 2026-07-19 | Support both calendar-based and completion-based recurrence. | Approved | User clarification |
| DEC-014 | 2026-07-19 | Use the account time zone for Task dates and reminders. | Approved | User clarification |
| DEC-015 | 2026-07-19 | Use the fixed Task statuses To Do, In Progress, and Completed for the MVP Kanban workflow. | Approved | User clarification |
| DEC-016 | 2026-07-19 | Apply Archive and Trash to Tasks, Projects, and Areas, with automatic permanent deletion after 30 days in Trash. | Approved | User clarification |
| DEC-017 | 2026-07-19 | Include email verification, password reset, Google authentication, and confirmed account deletion in the MVP account lifecycle. | Approved | User instruction and clarification |
| DEC-018 | 2026-07-19 | Offer first-time users an explicit choice to create private sample data or start empty. | Approved | User clarification |
| DEC-019 | 2026-07-19 | Draft `docs/product/PRD.md` as the product-definition artifact without implementation detail or technical schemas. | Proposed; phase approval pending | User instruction |

## Open questions

The product boundary is defined in the draft PRD. The following decisions are intentionally deferred to their relevant planning stages and must not be silently assumed:

- What navigation model, responsive breakpoints, sorting, grouping, and interaction patterns should the UX use?
- Which concrete recurrence presets and reminder choices are required?
- How do Archive, Trash, restore, and permanent deletion propagate through Area, Project, and Task relationships?
- How are recurring Task history and future recurrence-definition changes related?
- What backup treatment and operational completion rules apply to account deletion and 30-day Trash expiry?
- What deployment, browser-support, performance, availability, and operating model should be used?
- Should UX become a newly numbered stage before Domain Analysis, or remain an activity within the existing planning sequence?
- Should `develop` become the long-lived default integration branch, or was it only the publication branch for Stage 0?

## Risks

| Risk | Current response |
| --- | --- |
| The active Node.js version is 25.8.1 rather than the fixed Node.js 24 LTS version. | Resolve and pin the runtime before application scaffolding. |
| The new PRD is meaningful Graphify input but remains unapproved and may change. | Defer the first graph generation until the PRD is approved or a graph is explicitly requested. |
| The Graphify MCP server cannot start before `graphify-out/graph.json` exists. | Keep the project MCP entry disabled until the first successful graph generation. |
| Project-scoped Codex configuration is loaded only for trusted repositories. | Confirm repository trust and restart Codex after enabling MCP. |
| The MCP registration contains machine-local absolute paths required by the current stdio setup. | Revalidate or update those paths when the repository is used on another machine. |
| A global Graphify tool installation can drift if upgraded outside the project. | Record and reproduce the approved version explicitly. |
| Shareable Graphify output could accidentally include local or sensitive artifacts. | Apply `.graphifyignore` and Git ignore rules; review generated artifacts before version control. |
| Parent lifecycle behavior can become inconsistent across Area, Project, and Task. | Define propagation and restoration invariants during Domain Analysis before data design. |
| Dual recurrence modes and multiple reminders create time-zone and duplication risks. | Define recurrence identity, time semantics, and failure behavior during Domain and Architecture stages. |
| The requested next UX phase is not represented as a separate stage in the existing planning-stage numbering. | Obtain explicit sequencing approval before moving beyond the PRD phase. |

## Document index

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/PROJECT_MASTER.md` | Master planning state, decisions, risks, approvals, and document index. | Active |
| `docs/product/PRD.md` | MVP product problem, scope, users, journeys, requirements, acceptance criteria, risks, and UX entry criteria. | Draft; phase approval pending |
| `.graphifyignore` | Prevent sensitive, generated, dependency, and tool-internal content from being indexed. | Active |
| `.gitignore` | Prevent secrets, generated output, local caches, Graphify cost data, and temporary Graphify files from being versioned. | Active |
| `.agents/skills/graphify/SKILL.md` | Official project-scoped Graphify workflow. | Installed |
| `.codex/config.toml` | Project-scoped Graphify stdio MCP registration. | Prepared; disabled until a graph exists |

New planning documents must be added to this index when created.

## Graphify status

- Global CLI: installed with `uv tool`.
- Project skill: installed using the official `agents` platform target at `.agents/skills/graphify`.
- Skill instructions: fully read on 2026-07-19.
- Task-relevant reference read: `.agents/skills/graphify/references/exports.md`.
- Graph generation: not run. The PRD now provides meaningful input but remains pending phase approval.
- Intended use: architecture discovery and impact analysis.
- Version-control policy: track the project skill and shareable `graphify-out` artifacts, excluding local/intermediate files and `cost.json`.

## Graphify version

- Package: `graphifyy`
- Pinned version: `0.9.20`
- Installed CLI version: `graphify 0.9.20`
- Reproducible installation command: `uv tool install graphifyy==0.9.20`
- Python tool environment: Python 3.12.13
- uv version at installation: 0.11.29
- Project skill version stamp: `.agents/skills/graphify/.graphify_version`

The recorded version must not be changed without a decision-log entry and revalidation of the project skill and MCP behavior.

## MCP status

- Transport: local stdio.
- Server module: `python -m graphify.serve`.
- Planned graph argument: `graphify-out/graph.json` using an absolute repository path.
- Codex configuration scope: project `.codex/config.toml`.
- Registration status: prepared but disabled until the first graph exists.
- Activation requirements: successful graph generation, `enabled = true`, trusted repository, and Codex restart or reload.
- Expected read-oriented tools: `query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, and `shortest_path`.

## Last graph generation metadata

| Field | Value |
| --- | --- |
| Status | Never generated |
| Generated at | Not applicable |
| Graphify version | Not applicable |
| Input scope | Not applicable |
| Output path | `graphify-out/graph.json` (planned) |
| Nodes | Not applicable |
| Edges | Not applicable |
| Reason | The first meaningful product document is still pending phase approval; generation has been deferred. |

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
| 2026-07-19 | Product definition / PRD | In progress; approval pending | User initiated the PRD phase and approved its material product clarifications. |

## Current planning stage

Stage 1 — Product definition — is in progress. The user referred to it as Planning Phase 2 because it follows the planning-infrastructure phase. The PRD is drafted and awaits explicit approval. Implementation work has not started.

## Next required action

Review `docs/product/PRD.md`, resolve any requested revisions, and obtain explicit approval to complete Product Definition. Before beginning UX work, explicitly decide whether UX is inserted as a newly numbered stage before Domain Analysis or remains an activity within the existing stage sequence.
