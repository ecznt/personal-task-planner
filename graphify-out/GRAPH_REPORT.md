# Personal Task Planner — Graph Report (2026-07-20)

## Corpus Check
- Corpus is ~33,183 words - fits in a single context window. You may not need a graph.

## Summary
- 175 nodes · 330 edges · 14 communities (12 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Data Integrity and Operations
- Planning Entities and Workflow
- Domain Rules and Time
- Product Requirements and UX
- Lifecycle Privacy and Ownership
- Stage 5 Decisions and Gates
- Project Governance and Graphify
- Recurrence and Notifications
- UX Navigation and Hierarchy
- Task Views and Status Workflow
- Traceability and Graph Findings
- Open Risks and Handoffs
- MVP Acceptance and Success
- Future Considerations

## God Nodes (most connected - your core abstractions)
1. `Personal Task Planner Conceptual Data Model` - 26 edges
2. `Personal Task Planner Domain Model and Business Rules` - 23 edges
3. `Personal Task Planner Product Requirements Document` - 21 edges
4. `Verified Stage 4 Graph Findings` - 10 edges
5. `Dates, Recurrence, and Reminders Requirements` - 9 edges
6. `Task` - 9 edges
7. `Task Data Entity` - 9 edges
8. `Stage 5 Graph Generation Metadata` - 9 edges
9. `Personal Task Planner Project Master` - 9 edges
10. `Verified Stage 5 Graph Findings` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Area Workflow Status Requirements` --references--> `Canonical Groups and Area-Local Statuses`  [EXTRACTED]
  docs/product/PRD.md → docs/PROJECT_MASTER.md
- `Responsive Behavior` --semantically_similar_to--> `Responsive Navigation Model`  [INFERRED] [semantically similar]
  docs/product/UX_FLOWS.md → docs/PROJECT_MASTER.md
- `RecurrenceRuleVersion and Future Template` --references--> `RecurrenceRule`  [EXTRACTED]
  docs/data/DATA_MODEL.md → docs/domain/DOMAIN_MODEL.md
- `Archive and Trash Requirements` --references--> `Archive and 30-Day Trash Lifecycle`  [EXTRACTED]
  docs/product/PRD.md → docs/PROJECT_MASTER.md
- `Preferences, Authentication, and Account Deletion Settings` --references--> `Authentication and Account Lifecycle Requirements`  [EXTRACTED]
  docs/product/UX_FLOWS.md → docs/product/PRD.md

## Hyperedges (group relationships)
- **Approved Planning Artifact Sequence Through Stage 5 Draft** — docs_project_master_product_requirements_artifact, docs_project_master_ux_flows_artifact, docs_project_master_domain_model_artifact, docs_project_master_data_model_artifact [EXTRACTED 1.00]
- **Approved Stage 5 Data Decision Package** — docs_project_master_account_deletion_purge, docs_project_master_primary_email_uniqueness, docs_project_master_independent_kanban_rank_keys, docs_project_master_stage_5_data_decision_package [EXTRACTED 1.00]
- **Verified Stage 5 Graph Findings** — docs_project_master_verified_stage_5_graph_findings, docs_project_master_verified_direct_domain_data_mappings, docs_project_master_verified_user_data_ownership_paths, docs_project_master_system_defined_canonical_status, docs_project_master_graph_extraction_density, docs_project_master_stage_5_extracted_relationship_provenance [EXTRACTED 1.00]
- **Owner-Inclusive User Area Project Task Hierarchy** — docs_data_data_model_user, docs_data_data_model_area, docs_data_data_model_project, docs_data_data_model_task, docs_data_data_model_areastatus [EXTRACTED 1.00]
- **Transactional Recurrence Successor Consistency** — docs_data_data_model_recurrenceseries, docs_data_data_model_recurrenceruleversion, docs_data_data_model_task_recurrence_fields, docs_data_data_model_recurrence_successor_prevention, docs_data_data_model_transaction_boundaries, docs_data_data_model_concurrency_operations [EXTRACTED 1.00]
- **Lifecycle Provenance Restore and Purge Flow** — docs_data_data_model_archive_trash_representation, docs_data_data_model_lifecycle_operation_effect, docs_data_data_model_delete_restore_effects, docs_data_data_model_account_deletion_process, docs_data_data_model_retention_assumptions [EXTRACTED 1.00]
- **Domain Private Area–Project–Task Hierarchy** — docs_domain_domain_model_user, docs_domain_domain_model_area, docs_domain_domain_model_project, docs_domain_domain_model_task [EXTRACTED 1.00]
- **Completion-Gated Recurrence Generation Unit** — docs_domain_domain_model_task, docs_domain_domain_model_recurrenceseries, docs_domain_domain_model_recurrencerule, docs_domain_domain_model_taskreminder [EXTRACTED 1.00]

## Communities (14 total, 2 thin omitted)

### Community 0 - "Data Integrity and Operations"
Cohesion: 0.15
Nodes (25): AccountDeletionProcess, API Design Entry Gate, AuthenticationIdentity Data Entity, Candidate Logical Indexes, Concurrency-Sensitive Operations, Cross-User Access Prevention, Personal Task Planner Conceptual Data Model, Data Risks and Responses (+17 more)

### Community 1 - "Planning Entities and Workflow"
Cohesion: 0.19
Nodes (20): Area Data Entity, AreaStatus Data Entity, ChecklistItem Data Entity, Checklist, Status, and Kanban Ordering Fields, Project Data Entity, Task Data Entity, Area, AreaStatus (+12 more)

### Community 2 - "Domain Rules and Time"
Cohesion: 0.14
Nodes (20): Timestamp and Temporal-Value Strategy, Approved Stage 4 Domain Baseline, AuthenticationIdentity, Allowed and Forbidden Cross-Concept Operations, Data Design Entry Gate, Date and Time Rules, Personal Task Planner Domain Model and Business Rules, Domain Scope and Principles (+12 more)

### Community 3 - "Product Requirements and UX"
Cohesion: 0.11
Nodes (18): Accessibility Expectations, Localization and Responsive Requirements, Non-Functional Requirements, Onboarding Requirements, Personal Planner Personas, Primary User Journeys, Fragmented Personal Planning Problem, MVP Product Principles (+10 more)

### Community 4 - "Lifecycle Privacy and Ownership"
Cohesion: 0.20
Nodes (17): Archive and Trash Data Representation, Data Retention Assumptions, Archive State, Ownership and Isolation Rules, Parent Lifecycle Propagation, Trash State, Archive and Trash Requirements, Privacy Expectations (+9 more)

### Community 5 - "Stage 5 Decisions and Gates"
Cohesion: 0.21
Nodes (14): Stage 5 Data Decision Register, Durable Idempotent Account Deletion Purge, Authentication and Account Lifecycle, Approved Stage 4 Domain Baseline, Conceptual Data Model Artifact, Independent Opaque Kanban Rank Keys, Planning Stage Approval Gate, Normalized Primary Email Uniqueness (+6 more)

### Community 6 - "Project Governance and Graphify"
Cohesion: 0.27
Nodes (14): Domain Model Artifact, Fixed Technology Stack, Stage 5 Graph Generation Metadata, Graph Health Validation, Graphify Governance, Pinned Graphify Version 0.9.20, Modular Monolith Architecture, Operational Graphify MCP (+6 more)

### Community 7 - "Recurrence and Notifications"
Cohesion: 0.22
Nodes (13): Notification Data Entity, TaskReminder Data Entity, Notification, Recurrence Generation Examples, RecurrenceRule, TaskReminder, Dates, Recurrence, and Reminders Requirements, Notification Center (+5 more)

### Community 8 - "UX Navigation and Hierarchy"
Cohesion: 0.18
Nodes (12): Area, Desktop Sidebar Navigation, Application Information Architecture, Mobile Bottom Navigation, Project, Public, Authentication, and Application Routes, Stage 3 Approval Gate, Task (+4 more)

### Community 9 - "Task Views and Status Workflow"
Cohesion: 0.36
Nodes (9): Workflow State Rules, Area Workflow Status Requirements, Views and Work Discovery Requirements, Area-Specific Kanban, Multi-Task Bulk Actions, Canonical Global Kanban, Global List Review and Sorting, Global Search and Filters (+1 more)

### Community 10 - "Traceability and Graph Findings"
Cohesion: 0.33
Nodes (7): CanonicalStatus Reference Values, Requirement and Domain Traceability, Label and TaskLabel Data Entities, Graph Extraction Density, System-Defined CanonicalStatus, Verified Direct Domain-to-Data Mappings, Verified Stage 5 Graph Findings

### Community 11 - "Open Risks and Handoffs"
Cohesion: 0.67
Nodes (3): Cross-Stage Open Questions, Product Risks and Assumptions, Remaining Domain, Data, Privacy, and Architecture Decisions

## Knowledge Gaps
- **25 isolated node(s):** `MVP Acceptance Criteria`, `Future Considerations`, `Personal Planner Personas`, `Primary User Journeys`, `Fragmented Personal Planning Problem` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Personal Task Planner Domain Model and Business Rules` connect `Domain Rules and Time` to `Planning Entities and Workflow`, `Product Requirements and UX`, `Lifecycle Privacy and Ownership`, `Stage 5 Decisions and Gates`, `Project Governance and Graphify`, `Recurrence and Notifications`, `UX Navigation and Hierarchy`, `Task Views and Status Workflow`, `Traceability and Graph Findings`?**
  _High betweenness centrality (0.325) - this node is a cross-community bridge._
- **Why does `Personal Task Planner Product Requirements Document` connect `Product Requirements and UX` to `Planning Entities and Workflow`, `Domain Rules and Time`, `Lifecycle Privacy and Ownership`, `Project Governance and Graphify`, `Recurrence and Notifications`, `UX Navigation and Hierarchy`, `Task Views and Status Workflow`?**
  _High betweenness centrality (0.287) - this node is a cross-community bridge._
- **Why does `Personal Task Planner Conceptual Data Model` connect `Data Integrity and Operations` to `Planning Entities and Workflow`, `Domain Rules and Time`, `Lifecycle Privacy and Ownership`, `Stage 5 Decisions and Gates`, `Traceability and Graph Findings`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **What connects `MVP Acceptance Criteria`, `Future Considerations`, `Personal Planner Personas` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Domain Rules and Time` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._
- **Should `Product Requirements and UX` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._