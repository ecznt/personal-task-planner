# Graph Report - personal-task-planner  (2026-07-20)

## Corpus Check
- 10 files · ~53,648 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 236 nodes · 397 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Ownership, Data, and Concurrency
- API Authentication Contracts
- Recurrence and Notifications
- Domain Rules and Traceability
- Core Planning Model
- Architecture Decisions and Graphify
- Product, UX, Privacy, and Quality
- Runtime Quality Architecture
- UX Navigation and Structure
- Archive and Trash Lifecycle
- Backend Module Boundaries
- HTTP Representation Conventions
- Future Considerations

## God Nodes (most connected - your core abstractions)
1. `Conceptual REST API, Authentication, and Security Contract` - 27 edges
2. `Personal Task Planner Conceptual Data Model` - 24 edges
3. `Personal Task Planner Product Requirements Document` - 20 edges
4. `Architecture and Quality Strategy` - 19 edges
5. `Personal Task Planner Domain Model and Business Rules` - 19 edges
6. `Task Data Entity` - 10 edges
7. `Data Transaction Boundaries` - 9 edges
8. `User Data Entity` - 9 edges
9. `Task` - 9 edges
10. `Stage 7 — Solution Architecture` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Responsive Behavior` --semantically_similar_to--> `Responsive Navigation Model`  [INFERRED] [semantically similar]
  docs/product/UX_FLOWS.md → docs/PROJECT_MASTER.md
- `Stage 7 — Solution Architecture` --references--> `Architecture and Quality Strategy`  [EXTRACTED]
  docs/PROJECT_MASTER.md → docs/architecture/ARCHITECTURE.md
- `Graphify Status` --references--> `ADR-003: Graphify for Architecture Discovery and Impact Analysis`  [EXTRACTED]
  docs/PROJECT_MASTER.md → docs/architecture/adr/ADR-003-graphify.md
- `Conceptual REST API, Authentication, and Security Contract` --references--> `Personal Task Planner Conceptual Data Model`  [EXTRACTED]
  docs/api/API_CONTRACT.md → docs/data/DATA_MODEL.md
- `Conceptual REST API, Authentication, and Security Contract` --references--> `Personal Task Planner Project Master`  [EXTRACTED]
  docs/api/API_CONTRACT.md → docs/PROJECT_MASTER.md

## Hyperedges (group relationships)
- **Stage 7 Architecture Decision Records** — docs_architecture_adr_adr_001_modular_monolith_modular_monolith_with_separate_runtime_entry_points, docs_architecture_adr_adr_002_rest_openapi_rest_api_with_backend_owned_openapi_and_generated_client, docs_architecture_adr_adr_003_graphify_graphify_for_architecture_discovery_and_impact_analysis [EXTRACTED 1.00]
- **Architecture Runtime Release Topology** — docs_architecture_architecture_runtime_topology, docs_architecture_architecture_next_js_frontend_boundary, docs_architecture_architecture_postgresql_backed_worker [EXTRACTED 1.00]
- **Architecture Domain Module Set** — docs_architecture_architecture_accounts_module, docs_architecture_architecture_planning_module, docs_architecture_architecture_tasks_module, docs_architecture_architecture_notifications_module, docs_architecture_architecture_lifecycle_module, docs_architecture_architecture_work_views_module, docs_architecture_architecture_onboarding_module [EXTRACTED 1.00]
- **Due Reminder Terminal Outcome** — docs_domain_domain_model_reminder_terminal_resolution, docs_data_data_model_reminder_suppression_state, docs_api_api_contract_due_reminder_resolution [EXTRACTED 1.00]

## Communities (13 total, 2 thin omitted)

### Community 0 - "Ownership, Data, and Concurrency"
Cohesion: 0.09
Nodes (35): Remaining Architecture and Privacy Handoffs, Independently Atomic Bulk Task Actions, Strong ETag and If-Match Preconditions, Idempotency-Key Replay Contract, API Retry Safety, Owner-Scoped Task Search Endpoints, Current User and Account Endpoints, AccountDeletionProcess (+27 more)

### Community 1 - "API Authentication Contracts"
Cohesion: 0.10
Nodes (30): Conceptual REST API, Authentication, and Security Contract, API Risks and Responses, API v1 Base Path and Versioning, Authentication Endpoints, API Contract Goals and Boundaries, CSRF and Browser-Origin Protection, Opaque Cursor Pagination, Domain Operation to API Coverage (+22 more)

### Community 2 - "Recurrence and Notifications"
Cohesion: 0.11
Nodes (29): Due Reminder Trigger-or-Suppress Resolution, In-App Reminder Notification Preference Contract, Checklist, Label, Reminder, and Notification Endpoints, Label and TaskLabel Data Entities, Notification Data Entity, Persisted User Notification Preference, RecurrenceRuleVersion and Future Template, Reminder and Notification Relationships (+21 more)

### Community 3 - "Domain Rules and Traceability"
Cohesion: 0.12
Nodes (24): Timestamp and Temporal-Value Strategy, Approved Stage 4 Domain Baseline, Allowed and Forbidden Cross-Concept Operations, Data Design Entry Gate, Date and Time Rules, Personal Task Planner Domain Model and Business Rules, Domain Scope and Principles, Domain Risks and Mitigations (+16 more)

### Community 4 - "Core Planning Model"
Cohesion: 0.17
Nodes (22): Area, Project, and Workflow Endpoints, Task Projection, Mutation, Recurrence, and Kanban Endpoints, Area Data Entity, AreaStatus Data Entity, CanonicalStatus Reference Values, ChecklistItem Data Entity, Checklist, Status, and Kanban Ordering Fields, Project Data Entity (+14 more)

### Community 5 - "Architecture Decisions and Graphify"
Cohesion: 0.10
Nodes (22): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing, Deterministic OpenAPI Contract Pipeline, Generated Fetch Client, ADR-002: REST API with Backend-Owned OpenAPI and Generated Client, Graph Secret Controls, Graph Staleness Detection (+14 more)

### Community 6 - "Product, UX, Privacy, and Quality"
Cohesion: 0.10
Nodes (22): Ownership and Isolation Rules, Accessibility Expectations, Localization and Responsive Requirements, Non-Functional Requirements, Onboarding Requirements, Personal Planner Personas, Primary User Journeys, Privacy Expectations (+14 more)

### Community 7 - "Runtime Quality Architecture"
Cohesion: 0.14
Nodes (19): Accessibility Quality Gate, Architecture and Quality Strategy, CI Pipeline, Configuration Policy, Deployment Shape, Graphify Workflow, Internal Module Dependency Direction, Internationalization Strategy (+11 more)

### Community 8 - "UX Navigation and Structure"
Cohesion: 0.18
Nodes (12): Area, Desktop Sidebar Navigation, Application Information Architecture, Mobile Bottom Navigation, Project, Public, Authentication, and Application Routes, Stage 3 Approval Gate, Task (+4 more)

### Community 9 - "Archive and Trash Lifecycle"
Cohesion: 0.27
Nodes (11): Archive, Trash, Restore, and Permanent-Deletion Endpoints, Archive and Trash Data Representation, Delete and Restore Effects, LifecycleOperation and LifecycleEffect, Data Retention Assumptions, Archive State, Parent Lifecycle Propagation, Trash State (+3 more)

### Community 10 - "Backend Module Boundaries"
Cohesion: 0.57
Nodes (8): Accounts Module, Backend Module Map, Lifecycle Module, Notifications Module, Onboarding Module, Planning Module, Tasks Module, Work Views Module

## Knowledge Gaps
- **49 isolated node(s):** `Fixed Technology Decisions`, `Separate Runtime Entry Points Decision`, `PostgreSQL Operational State Decision`, `Same-Origin Container Deployment Decision`, `Backup Retention and Deletion Replay Decision` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Personal Task Planner Domain Model and Business Rules` connect `Domain Rules and Traceability` to `API Authentication Contracts`, `Recurrence and Notifications`, `Core Planning Model`, `Product, UX, Privacy, and Quality`, `UX Navigation and Structure`, `Archive and Trash Lifecycle`?**
  _High betweenness centrality (0.205) - this node is a cross-community bridge._
- **Why does `Personal Task Planner Product Requirements Document` connect `Product, UX, Privacy, and Quality` to `Ownership, Data, and Concurrency`, `Recurrence and Notifications`, `Domain Rules and Traceability`, `Core Planning Model`, `UX Navigation and Structure`, `Archive and Trash Lifecycle`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `Conceptual REST API, Authentication, and Security Contract` connect `API Authentication Contracts` to `Ownership, Data, and Concurrency`, `Archive and Trash Lifecycle`, `Recurrence and Notifications`, `Core Planning Model`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **What connects `Fixed Technology Decisions`, `Separate Runtime Entry Points Decision`, `PostgreSQL Operational State Decision` to the rest of the system?**
  _49 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Ownership, Data, and Concurrency` be split into smaller, more focused modules?**
  _Cohesion score 0.0907563025210084 - nodes in this community are weakly interconnected._
- **Should `API Authentication Contracts` be split into smaller, more focused modules?**
  _Cohesion score 0.10114942528735632 - nodes in this community are weakly interconnected._
- **Should `Recurrence and Notifications` be split into smaller, more focused modules?**
  _Cohesion score 0.11083743842364532 - nodes in this community are weakly interconnected._
