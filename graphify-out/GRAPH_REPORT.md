# Graph Report - .  (2026-07-21)

## Corpus Check
- 2 files · ~67,604 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 272 nodes · 504 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Vertical Slice Backlog
- Data Lifecycle and Security
- Domain Time and Reminders
- Product and UX Requirements
- REST API Contract
- Task Planning Data Model
- Stage 8 Approval Governance
- Accounts and Preferences
- Architecture and Quality
- UX and Navigation
- Architecture Decision Records
- Backend Module Boundaries
- HTTP Conventions
- Future Scope

## God Nodes (most connected - your core abstractions)
1. `Conceptual REST API, Authentication, and Security Contract` - 27 edges
2. `Personal Task Planner Vertical-Slice Backlog` - 27 edges
3. `Personal Task Planner Conceptual Data Model` - 24 edges
4. `Personal Task Planner Product Requirements Document` - 20 edges
5. `Personal Task Planner Domain Model and Business Rules` - 19 edges
6. `MVP Requirement Ownership Map` - 19 edges
7. `Architecture and Quality Strategy` - 18 edges
8. `EPIC-007 Area-Specific Statuses` - 11 edges
9. `Task Data Entity` - 10 edges
10. `Stage 8 Backlog Planning` - 10 edges

## Surprising Connections (you probably didn't know these)
- `RecurrenceRuleVersion and Future Template` --references--> `RecurrenceRule`  [EXTRACTED]
  docs/data/DATA_MODEL.md → docs/domain/DOMAIN_MODEL.md
- `Conceptual REST API, Authentication, and Security Contract` --references--> `Personal Task Planner Conceptual Data Model`  [EXTRACTED]
  docs/api/API_CONTRACT.md → docs/data/DATA_MODEL.md
- `Conceptual REST API, Authentication, and Security Contract` --references--> `Personal Task Planner Project Master`  [EXTRACTED]
  docs/api/API_CONTRACT.md → docs/PROJECT_MASTER.md
- `Independently Atomic Bulk Task Actions` --references--> `Data Transaction Boundaries`  [EXTRACTED]
  docs/api/API_CONTRACT.md → docs/data/DATA_MODEL.md
- `Google OIDC and Explicit Identity Linking` --references--> `Authentication Identity and Email Relationships`  [EXTRACTED]
  docs/api/API_CONTRACT.md → docs/data/DATA_MODEL.md

## Hyperedges (group relationships)
- **Ordered Vertical Epic Sequence** — docs_planning_backlog_epic_001_repository_foundation, docs_planning_backlog_epic_002_authentication, docs_planning_backlog_epic_003_onboarding, docs_planning_backlog_epic_004_area_management, docs_planning_backlog_epic_005_basic_task_management, docs_planning_backlog_epic_006_project_management, docs_planning_backlog_epic_007_area_statuses, docs_planning_backlog_epic_008_list_view, docs_planning_backlog_epic_009_global_kanban, docs_planning_backlog_epic_010_area_kanban, docs_planning_backlog_epic_011_today_planning, docs_planning_backlog_epic_012_recurring_tasks, docs_planning_backlog_epic_013_search_filters, docs_planning_backlog_epic_014_bulk_actions, docs_planning_backlog_epic_015_notifications, docs_planning_backlog_epic_016_archive_trash, docs_planning_backlog_epic_017_responsive_accessibility, docs_planning_backlog_epic_018_release_readiness [EXTRACTED 1.00]
- **Architecture Runtime Release Topology** — docs_architecture_architecture_runtime_topology, docs_architecture_architecture_next_js_frontend_boundary, docs_architecture_architecture_postgresql_backed_worker [EXTRACTED 1.00]
- **Architecture Domain Module Set** — docs_architecture_architecture_accounts_module, docs_architecture_architecture_planning_module, docs_architecture_architecture_tasks_module, docs_architecture_architecture_notifications_module, docs_architecture_architecture_lifecycle_module, docs_architecture_architecture_work_views_module, docs_architecture_architecture_onboarding_module [EXTRACTED 1.00]
- **Due Reminder Terminal Outcome** — docs_domain_domain_model_reminder_terminal_resolution, docs_data_data_model_reminder_suppression_state, docs_api_api_contract_due_reminder_resolution [EXTRACTED 1.00]

## Communities (14 total, 2 thin omitted)

### Community 0 - "Vertical Slice Backlog"
Cohesion: 0.16
Nodes (36): Accounts Module, Continuous Security, Accessibility, Localization, Contract, and Test Baseline, BD-001 through BD-013 Cross-Epic Dependency Decisions, Cross-Layer Vertical Story Impact, EPIC-001 Repository Foundation and Quality Gates, EPIC-002 Authentication, EPIC-003 Onboarding and Sample Area, EPIC-004 Area Management (+28 more)

### Community 1 - "Data Lifecycle and Security"
Cohesion: 0.09
Nodes (34): Remaining Architecture and Privacy Handoffs, Archive, Trash, Restore, and Permanent-Deletion Endpoints, Independently Atomic Bulk Task Actions, Strong ETag and If-Match Preconditions, Idempotency-Key Replay Contract, API Retry Safety, Owner-Scoped Task Search Endpoints, API Design Entry Gate (+26 more)

### Community 2 - "Domain Time and Reminders"
Cohesion: 0.10
Nodes (29): Due Reminder Trigger-or-Suppress Resolution, Checklist, Label, Reminder, and Notification Endpoints, Label and TaskLabel Data Entities, Notification Data Entity, Reminder and Notification Relationships, TaskReminder Suppression State, TaskReminder Data Entity, Timestamp and Temporal-Value Strategy (+21 more)

### Community 3 - "Product and UX Requirements"
Cohesion: 0.09
Nodes (29): Ownership and Isolation Rules, Workflow State Rules, Accessibility Expectations, Area Workflow Status Requirements, Localization and Responsive Requirements, Non-Functional Requirements, Onboarding Requirements, Personal Planner Personas (+21 more)

### Community 4 - "REST API Contract"
Cohesion: 0.11
Nodes (28): Conceptual REST API, Authentication, and Security Contract, API Risks and Responses, API v1 Base Path and Versioning, Authentication Endpoints, API Contract Goals and Boundaries, CSRF and Browser-Origin Protection, Opaque Cursor Pagination, Domain Operation to API Coverage (+20 more)

### Community 5 - "Task Planning Data Model"
Cohesion: 0.17
Nodes (22): Area, Project, and Workflow Endpoints, Task Projection, Mutation, Recurrence, and Kanban Endpoints, Area Data Entity, AreaStatus Data Entity, CanonicalStatus Reference Values, ChecklistItem Data Entity, Checklist, Status, and Kanban Ordering Fields, Project Data Entity (+14 more)

### Community 6 - "Stage 8 Approval Governance"
Cohesion: 0.10
Nodes (22): Approved Stage 8 Backlog Baseline, Full Private Onboarding Sample Set, Stage 8 Approval Criteria BL-AC-001 through BL-AC-009, Stage 9 Implementation Readiness Entry Criteria, Current Stage 8 Completed and Approved State, DEC-055 User-Directed 18-Epic Sequence, DEC-056 Vertical Story Decomposition, DEC-057 Continuous Acceptance Concerns and Bounded Spikes (+14 more)

### Community 7 - "Accounts and Preferences"
Cohesion: 0.15
Nodes (20): In-App Reminder Notification Preference Contract, Current User and Account Endpoints, AccountDeletionProcess, AuthenticationIdentity Data Entity, Authentication Identity and Email Relationships, Persisted User Notification Preference, Entity Relationship Overview, User Data Entity (+12 more)

### Community 8 - "Architecture and Quality"
Cohesion: 0.14
Nodes (19): Accessibility Quality Gate, Architecture and Quality Strategy, CI Pipeline, Configuration Policy, Deployment Shape, Graphify Workflow, Internal Module Dependency Direction, Internationalization Strategy (+11 more)

### Community 9 - "UX and Navigation"
Cohesion: 0.18
Nodes (12): Area, Desktop Sidebar Navigation, Application Information Architecture, Mobile Bottom Navigation, Project, Public, Authentication, and Application Routes, Stage 3 Approval Gate, Task (+4 more)

### Community 10 - "Architecture Decision Records"
Cohesion: 0.20
Nodes (11): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing, Deterministic OpenAPI Contract Pipeline, Generated Fetch Client, ADR-002: REST API with Backend-Owned OpenAPI and Generated Client, Graph Secret Controls, Graph Staleness Detection (+3 more)

### Community 11 - "Backend Module Boundaries"
Cohesion: 0.57
Nodes (8): Accounts Module, Backend Module Map, Lifecycle Module, Notifications Module, Onboarding Module, Planning Module, Tasks Module, Work Views Module

## Knowledge Gaps
- **50 isolated node(s):** `API v1 Base Path and Versioning`, `Email and Password API Lifecycle`, `HTTP and Representation Conventions`, `Task Filtering, Sorting, and Search Semantics`, `Deployment Shape` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Conceptual REST API, Authentication, and Security Contract` connect `REST API Contract` to `Data Lifecycle and Security`, `Domain Time and Reminders`, `Task Planning Data Model`, `Stage 8 Approval Governance`, `Accounts and Preferences`?**
  _High betweenness centrality (0.381) - this node is a cross-community bridge._
- **Why does `Personal Task Planner Project Master` connect `Stage 8 Approval Governance` to `Vertical Slice Backlog`, `REST API Contract`?**
  _High betweenness centrality (0.274) - this node is a cross-community bridge._
- **Why does `Personal Task Planner Vertical-Slice Backlog` connect `Vertical Slice Backlog` to `Stage 8 Approval Governance`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **What connects `API v1 Base Path and Versioning`, `Email and Password API Lifecycle`, `HTTP and Representation Conventions` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Data Lifecycle and Security` be split into smaller, more focused modules?**
  _Cohesion score 0.0944741532976827 - nodes in this community are weakly interconnected._
- **Should `Domain Time and Reminders` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Should `Product and UX Requirements` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._