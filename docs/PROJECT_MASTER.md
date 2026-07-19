# Personal Task Planner — Project Master

| Field | Value |
| --- | --- |
| Repository | `ecznt/personal-task-planner` |
| Document role | Authoritative planning index and decision record |
| Document language | English |
| Last updated | 2026-07-19 |

## Product vision

Create a personal-use work tracking and planning application while using current industry development practices as a learning objective.

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

- The product is focused on personal use.
- The first user interface language is Turkish.
- The system will be designed to remain ready for internationalization.
- Production implementation begins only after the planning stages have been completed and approved.

No additional product behavior, feature scope, user model, or workflow has been decided yet.

## Out-of-scope items

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
| 1. Product definition | Define target problems, goals, users, scope, and success criteria. | Not started |
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

## Open questions

The following decisions are intentionally deferred to their relevant planning stages:

- Which personal work-tracking problems should the first version solve?
- What are the product goals and measurable success criteria?
- What is the initial user and account model?
- Which workflows and capabilities belong in the first version?
- What data ownership, privacy, retention, backup, and recovery expectations apply?
- What deployment and operating model should be used?
- Should `develop` become the long-lived default integration branch, or is it only the publication branch for Stage 0?

## Risks

| Risk | Current response |
| --- | --- |
| The active Node.js version is 25.8.1 rather than the fixed Node.js 24 LTS version. | Resolve and pin the runtime before application scaffolding. |
| The repository has no meaningful corpus from which Graphify can build a useful graph. | Do not generate an empty graph; generate after planning documents become meaningful. |
| The Graphify MCP server cannot start before `graphify-out/graph.json` exists. | Keep the project MCP entry disabled until the first successful graph generation. |
| Project-scoped Codex configuration is loaded only for trusted repositories. | Confirm repository trust and restart Codex after enabling MCP. |
| The MCP registration contains machine-local absolute paths required by the current stdio setup. | Revalidate or update those paths when the repository is used on another machine. |
| A global Graphify tool installation can drift if upgraded outside the project. | Record and reproduce the approved version explicitly. |
| Shareable Graphify output could accidentally include local or sensitive artifacts. | Apply `.graphifyignore` and Git ignore rules; review generated artifacts before version control. |
| Product scope and domain rules are currently undefined. | Resolve them stage by stage with explicit approval. |

## Document index

| Document | Purpose | Status |
| --- | --- | --- |
| `docs/PROJECT_MASTER.md` | Master planning state, decisions, risks, approvals, and document index. | Active |
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
- Graph generation: not run because the repository does not yet contain a meaningful corpus.
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
| Reason | No meaningful document or source corpus exists yet. |

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

## Current planning stage

Stage 0 — Planning infrastructure and Graphify integration — is complete. Stage 1 has not started, and implementation work has not started.

## Next required action

Obtain explicit user instruction to begin Stage 1 — Product definition. After that instruction, present the first material product decision with options. Do not begin Stage 1 before approval.
