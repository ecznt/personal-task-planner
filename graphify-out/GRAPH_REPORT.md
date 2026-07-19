# Graph Report - Personal Task Planner (2026-07-19)

## Corpus Check
- 4 files total (2 incrementally re-extracted) · ~23,486 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 122 nodes · 200 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Domain Approval and Rules
- Product Requirements and Accessibility
- Core Domain Hierarchy
- Recurrence and Notifications
- Graphify Governance and Artifacts
- Task Workflow and Discovery
- Application Information Architecture
- Privacy and Responsive Experience
- Content Lifecycle
- Authentication and Identity
- Risks and Open Questions
- MVP Success and Acceptance
- Future Scope

## God Nodes (most connected - your core abstractions)
1. `Personal Task Planner Product Requirements Document` - 21 edges
2. `Personal Task Planner Domain Model and Business Rules` - 21 edges
3. `Verified Stage 4 Graph Findings` - 10 edges
4. `Dates, Recurrence, and Reminders Requirements` - 9 edges
5. `Task` - 8 edges
6. `Domain Model Artifact` - 8 edges
7. `Conceptual Consistency Boundaries` - 7 edges
8. `Parent Lifecycle Propagation` - 7 edges
9. `Full Stage 4 Graph Generation Metadata` - 7 edges
10. `Personal Task Planner Project Master` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Archive and Trash Requirements` --references--> `Archive and 30-Day Trash Lifecycle`  [EXTRACTED]
  docs/product/PRD.md → docs/PROJECT_MASTER.md
- `Preferences, Authentication, and Account Deletion Settings` --references--> `Authentication and Account Lifecycle Requirements`  [EXTRACTED]
  docs/product/UX_FLOWS.md → docs/product/PRD.md
- `Responsive Behavior` --semantically_similar_to--> `Responsive Navigation Model`  [INFERRED] [semantically similar]
  docs/product/UX_FLOWS.md → docs/PROJECT_MASTER.md
- `Area Workflow Status Requirements` --references--> `Canonical Groups and Area-Local Statuses`  [EXTRACTED]
  docs/product/PRD.md → docs/PROJECT_MASTER.md
- `Dates, Recurrence, and Reminders Requirements` --references--> `Calendar and Completion Recurrence Modes`  [EXTRACTED]
  docs/product/PRD.md → docs/PROJECT_MASTER.md

## Hyperedges (group relationships)
- **Domain Private Area–Project–Task Hierarchy** — docs_domain_domain_model_user, docs_domain_domain_model_area, docs_domain_domain_model_project, docs_domain_domain_model_task [EXTRACTED 1.00]
- **Completion-Gated Recurrence Generation Unit** — docs_domain_domain_model_task, docs_domain_domain_model_recurrenceseries, docs_domain_domain_model_recurrencerule, docs_domain_domain_model_taskreminder [EXTRACTED 1.00]
- **Completed and Approved Stage 4 Domain Baseline** — docs_project_master_stage_4_domain_analysis, docs_project_master_approved_stage_4_domain_baseline, docs_project_master_domain_model_artifact, docs_domain_domain_model_domain_model, docs_domain_domain_model_approved_stage_4_baseline [EXTRACTED 1.00]

## Communities (13 total, 2 thin omitted)

### Community 0 - "Domain Approval and Rules"
Cohesion: 0.16
Nodes (16): Approved Stage 4 Domain Baseline, Allowed and Forbidden Cross-Concept Operations, Data Design Entry Gate, Personal Task Planner Domain Model and Business Rules, Domain Scope and Principles, Domain Risks and Mitigations, Remaining Non-Domain Handoffs, Domain Requirements Traceability (+8 more)

### Community 1 - "Product Requirements and Accessibility"
Cohesion: 0.13
Nodes (15): Accessibility Expectations, Non-Functional Requirements, Onboarding Requirements, Personal Planner Personas, Primary User Journeys, Fragmented Personal Planning Problem, MVP Product Principles, Personal Task Planner Product Requirements Document (+7 more)

### Community 2 - "Core Domain Hierarchy"
Cohesion: 0.24
Nodes (14): Area, AreaStatus, CanonicalStatus, ChecklistItem, Conceptual Consistency Boundaries, Label, Project, RecurrenceSeries (+6 more)

### Community 3 - "Recurrence and Notifications"
Cohesion: 0.20
Nodes (14): Date and Time Rules, Notification, Recurrence Generation Examples, RecurrenceRule, TaskReminder, Dates, Recurrence, and Reminders Requirements, Notification Center, Recurrence Editing (+6 more)

### Community 4 - "Graphify Governance and Artifacts"
Cohesion: 0.29
Nodes (14): Domain Model Artifact, Fixed Technology Stack, Full Stage 4 Graph Generation Metadata, Graph Health Validation, Graphify Governance, Pinned Graphify Version 0.9.20, Modular Monolith Architecture, Operational Graphify MCP (+6 more)

### Community 5 - "Task Workflow and Discovery"
Cohesion: 0.24
Nodes (12): Workflow State Rules, Area Workflow Status Requirements, Views and Work Discovery Requirements, Area-Specific Kanban, Multi-Task Bulk Actions, Canonical Global Kanban, Global List Review and Sorting, Global Search and Filters (+4 more)

### Community 6 - "Application Information Architecture"
Cohesion: 0.18
Nodes (12): Area, Desktop Sidebar Navigation, Application Information Architecture, Mobile Bottom Navigation, Project, Public, Authentication, and Application Routes, Stage 3 Approval Gate, Task (+4 more)

### Community 7 - "Privacy and Responsive Experience"
Cohesion: 0.28
Nodes (9): Ownership and Isolation Rules, Localization and Responsive Requirements, Privacy Expectations, Non-Disclosing Content Unavailable State, Responsive Behavior, Private Multi-User Model, Focused Personal Work-Tracking Vision, Responsive Navigation Model (+1 more)

### Community 8 - "Content Lifecycle"
Cohesion: 0.67
Nodes (6): Archive State, Parent Lifecycle Propagation, Trash State, Archive and Trash Requirements, Archive, Trash, and Retention UX, Lifecycle Cascade Provenance Policy

### Community 9 - "Authentication and Identity"
Cohesion: 1.00
Nodes (4): AuthenticationIdentity, Authentication and Account Lifecycle Requirements, Registration, Login, Recovery, and Google Authentication, Explicit Authentication Identity Linking

### Community 10 - "Risks and Open Questions"
Cohesion: 0.67
Nodes (3): Cross-Stage Open Questions, Product Risks and Assumptions, Remaining Domain, Data, Privacy, and Architecture Decisions

## Knowledge Gaps
- **25 isolated node(s):** `MVP Acceptance Criteria`, `Future Considerations`, `Personal Planner Personas`, `Primary User Journeys`, `Fragmented Personal Planning Problem` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Personal Task Planner Product Requirements Document` connect `Product Requirements and Accessibility` to `Domain Approval and Rules`, `Core Domain Hierarchy`, `Recurrence and Notifications`, `Graphify Governance and Artifacts`, `Task Workflow and Discovery`, `Application Information Architecture`, `Privacy and Responsive Experience`, `Content Lifecycle`, `Authentication and Identity`?**
  _High betweenness centrality (0.435) - this node is a cross-community bridge._
- **Why does `Personal Task Planner Domain Model and Business Rules` connect `Domain Approval and Rules` to `Product Requirements and Accessibility`, `Core Domain Hierarchy`, `Recurrence and Notifications`, `Graphify Governance and Artifacts`, `Task Workflow and Discovery`, `Application Information Architecture`, `Privacy and Responsive Experience`, `Content Lifecycle`?**
  _High betweenness centrality (0.346) - this node is a cross-community bridge._
- **Why does `UX Flows and Information Architecture` connect `Application Information Architecture` to `Domain Approval and Rules`, `Product Requirements and Accessibility`, `Graphify Governance and Artifacts`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **What connects `MVP Acceptance Criteria`, `Future Considerations`, `Personal Planner Personas` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Product Requirements and Accessibility` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
