# Graph Report - personal-task-planner  (2026-07-19)

## Corpus Check
- 3 files · ~14,907 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 72 nodes · 79 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Core UX Requirements
- Planning Governance
- Application Information Architecture
- Status and Content Lifecycle
- Private Responsive Experience
- Scheduling and Notifications
- Task Discovery and Execution
- Account Access and Settings
- Cross-Stage Risks
- MVP Success and Acceptance
- Future Scope

## God Nodes (most connected - your core abstractions)
1. `Personal Task Planner Product Requirements Document` - 20 edges
2. `UX Flows and Information Architecture` - 6 edges
3. `Personal Task Planner Project Master` - 5 edges
4. `Dates, Recurrence, and Reminders Requirements` - 5 edges
5. `Views and Work Discovery Requirements` - 5 edges
6. `Focused Personal Work-Tracking Vision` - 4 edges
7. `Area Workflow Status Requirements` - 4 edges
8. `Private Multi-User Model` - 3 edges
9. `Area–Project–Task Model` - 3 edges
10. `Authentication and Account Lifecycle Requirements` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Responsive Behavior` --semantically_similar_to--> `Responsive Navigation Model`  [INFERRED] [semantically similar]
  docs/product/UX_FLOWS.md → docs/PROJECT_MASTER.md
- `Personal Task Planner Project Master` --references--> `Personal Task Planner Product Requirements Document`  [EXTRACTED]
  docs/PROJECT_MASTER.md → docs/product/PRD.md
- `Dates, Recurrence, and Reminders Requirements` --references--> `Calendar and Completion Recurrence Modes`  [EXTRACTED]
  docs/product/PRD.md → docs/PROJECT_MASTER.md
- `Stage 3 UX Flows and Information Architecture` --references--> `UX Flows and Information Architecture`  [EXTRACTED]
  docs/PROJECT_MASTER.md → docs/product/UX_FLOWS.md
- `PRD-to-UX Traceability` --references--> `Personal Task Planner Product Requirements Document`  [EXTRACTED]
  docs/product/UX_FLOWS.md → docs/product/PRD.md

## Hyperedges (group relationships)
- **Private Area–Project–Task Hierarchy** — docs_product_ux_flows_user_private_space, docs_product_ux_flows_area, docs_product_ux_flows_project, docs_product_ux_flows_task [EXTRACTED 1.00]
- **Consistent Task State Across Today, List, and Kanban** — docs_product_ux_flows_today_flow, docs_product_ux_flows_global_list, docs_product_ux_flows_global_kanban, docs_product_ux_flows_area_kanban [EXTRACTED 1.00]
- **Stage 3 Cross-Document Approval** — docs_project_master_stage_3_ux, docs_product_prd_area_workflow_statuses, docs_product_ux_flows_stage_3_approval_gate [EXTRACTED 1.00]

## Communities (11 total, 2 thin omitted)

### Community 0 - "Core UX Requirements"
Cohesion: 0.12
Nodes (17): Accessibility Expectations, Areas and Projects Requirements, Non-Functional Requirements, Onboarding Requirements, Personal Planner Personas, Primary User Journeys, Fragmented Personal Planning Problem, MVP Product Principles (+9 more)

### Community 1 - "Planning Governance"
Cohesion: 0.20
Nodes (10): Stage 3 Approval Gate, UX Flows and Information Architecture, UX Principles, Domain Analysis Handoffs, Fixed Technology Stack, Graphify Governance, Modular Monolith Architecture, Planning Stage Approval Gate (+2 more)

### Community 2 - "Application Information Architecture"
Cohesion: 0.25
Nodes (9): Area, Desktop Sidebar Navigation, Application Information Architecture, Mobile Bottom Navigation, Project, Public, Authentication, and Application Routes, Task, Labels, Checklists, Recurrence, and Reminders (+1 more)

### Community 3 - "Status and Content Lifecycle"
Cohesion: 0.29
Nodes (8): Archive and Trash Requirements, Area Workflow Status Requirements, Archive, Trash, and Retention UX, Area-Specific Kanban, Canonical Global Kanban, Archive and 30-Day Trash Lifecycle, Area–Project–Task Model, Canonical Groups and Area-Local Statuses

### Community 4 - "Private Responsive Experience"
Cohesion: 0.29
Nodes (8): Localization and Responsive Requirements, Privacy Expectations, Non-Disclosing Content Unavailable State, Responsive Behavior, Private Multi-User Model, Focused Personal Work-Tracking Vision, Responsive Navigation Model, Today, List, and Kanban Views

### Community 5 - "Scheduling and Notifications"
Cohesion: 0.33
Nodes (6): Dates, Recurrence, and Reminders Requirements, Notification Center, Recurrence Editing, Reminder Editing, Authentication and Account Lifecycle, Calendar and Completion Recurrence Modes

### Community 6 - "Task Discovery and Execution"
Cohesion: 0.60
Nodes (5): Views and Work Discovery Requirements, Multi-Task Bulk Actions, Global List Review and Sorting, Global Search and Filters, Daily Planning and Execution

### Community 7 - "Account Access and Settings"
Cohesion: 0.67
Nodes (3): Authentication and Account Lifecycle Requirements, Registration, Login, Recovery, and Google Authentication, Preferences, Authentication, and Account Deletion Settings

### Community 8 - "Cross-Stage Risks"
Cohesion: 0.67
Nodes (3): Cross-Stage Open Questions, Product Risks and Assumptions, Remaining Domain, Data, Privacy, and Architecture Decisions

## Knowledge Gaps
- **27 isolated node(s):** `Authentication and Account Lifecycle`, `Domain Analysis Handoffs`, `Fragmented Personal Planning Problem`, `MVP Product Principles`, `Personal Planner Personas` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Personal Task Planner Product Requirements Document` connect `Core UX Requirements` to `Planning Governance`, `Status and Content Lifecycle`, `Private Responsive Experience`, `Scheduling and Notifications`, `Task Discovery and Execution`, `Account Access and Settings`?**
  _High betweenness centrality (0.690) - this node is a cross-community bridge._
- **Why does `UX Flows and Information Architecture` connect `Planning Governance` to `Core UX Requirements`, `Application Information Architecture`?**
  _High betweenness centrality (0.308) - this node is a cross-community bridge._
- **Why does `Application Information Architecture` connect `Application Information Architecture` to `Planning Governance`?**
  _High betweenness centrality (0.190) - this node is a cross-community bridge._
- **What connects `Authentication and Account Lifecycle`, `Domain Analysis Handoffs`, `Fragmented Personal Planning Problem` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core UX Requirements` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
