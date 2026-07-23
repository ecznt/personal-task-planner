# Graph Report - personal-task-planner  (2026-07-23)

## Corpus Check
- 12 files · ~69,187 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 86 nodes · 91 edges · 10 communities
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Architecture ADRs and Graphify
- Phase 2 Scope Governance
- Task Lifecycle and Recurrence
- Private UX and Work Views
- Backlog Coverage Baseline
- Product Scope and Authentication
- REST Security and OpenAPI
- Modular Monolith Quality
- Account Identity and Deletion
- Reminder Notifications

## God Nodes (most connected - your core abstractions)
1. `DEC-066 Remove all social authentication from MVP and reserve historical IDs` - 8 edges
2. `ADR-003: Graphify for Architecture Discovery and Impact Analysis` - 6 edges
3. `Personal Task Planner Product Requirements Document` - 6 edges
4. `Task` - 6 edges
5. `Personal Task Planner Conceptual REST API Authentication and Security Contract` - 6 edges
6. `Personal Task Planner Project Master` - 5 edges
7. `Personal Task Planner UX Flows and Information Architecture` - 5 edges
8. `178 requirements 73 endpoint rows 120 stories and 3 spikes` - 5 edges
9. `ADR-001: Modular Monolith with Separate Runtime Entry Points` - 3 edges
10. `ADR-002: REST API with Backend-Owned OpenAPI and Generated Client` - 3 edges

## Surprising Connections (you probably didn't know these)
- `DEC-066 Remove all social authentication from MVP and reserve historical IDs` --rationale_for--> `No provider authorization callback linking or unlinking endpoints in MVP`  [EXTRACTED]
  docs/PROJECT_MASTER.md → docs/api/API_CONTRACT.md
- `DEC-066 Remove all social authentication from MVP and reserve historical IDs` --rationale_for--> `Reserved deferred BL-012 and BL-013 social-authentication stories`  [EXTRACTED]
  docs/PROJECT_MASTER.md → docs/planning/BACKLOG.md
- `DEC-066 Remove all social authentication from MVP and reserve historical IDs` --rationale_for--> `UXF-005 deferred social authentication flow`  [EXTRACTED]
  docs/PROJECT_MASTER.md → docs/product/UX_FLOWS.md
- `178 active accepted MVP requirement IDs` --conceptually_related_to--> `178 requirements 73 endpoint rows 120 stories and 3 spikes`  [INFERRED]
  docs/product/PRD.md → docs/planning/READINESS_REPORT.md
- `Task` --shares_data_with--> `Task entity with required owner Area and AreaStatus relationships`  [INFERRED]
  docs/domain/DOMAIN_MODEL.md → docs/data/DATA_MODEL.md

## Hyperedges (group relationships)
- **DEC-066 aligns product UX API architecture and backlog around email/password-only MVP authentication** — docs_project_master_dec_066, docs_product_prd_deferred_google_authentication_ids, docs_product_ux_flows_uxf_005_deferred_social_authentication, docs_api_api_contract_deferred_social_authentication, docs_architecture_architecture_email_password_security_boundary, docs_planning_backlog_reserved_bl_012_bl_013 [EXTRACTED 1.00]
- **Active accepted requirements map to supported API endpoint rows and active backlog stories** — docs_product_prd_active_mvp_requirements, docs_api_api_contract_endpoint_catalog, docs_planning_backlog_active_story_baseline, docs_planning_readiness_report_active_planning_counts [EXTRACTED 1.00]
- **Required Area optional Project and Task form the preserved personal-planning core** — docs_domain_domain_model_area, docs_domain_domain_model_project, docs_domain_domain_model_task [EXTRACTED 1.00]

## Communities (10 total, 0 thin omitted)

### Community 0 - "Architecture ADRs and Graphify"
Cohesion: 0.20
Nodes (11): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing, Deterministic OpenAPI Contract Pipeline, Generated Fetch Client, ADR-002: REST API with Backend-Owned OpenAPI and Generated Client, Graph Secret Controls, Graph Staleness Detection (+3 more)

### Community 1 - "Phase 2 Scope Governance"
Cohesion: 0.22
Nodes (11): Email/password-only session security boundary, GO for Phase 2 Complete and NO-GO for implementation pending final approval, Phase 2 Final Readiness Audit, Zero BLOCKER and zero HIGH readiness findings, DEC-066 Remove all social authentication from MVP and reserve historical IDs, Fixed TypeScript modular-monolith technology stack, Frozen Phase 2 MVP scope with email/password authentication only, Planning stages require approval before production implementation (+3 more)

### Community 2 - "Task Lifecycle and Recurrence"
Cohesion: 0.20
Nodes (11): LifecycleOperation and LifecycleEffect cascade provenance, Recurrence occurrence predecessor and generation uniqueness constraints, Task entity with required owner Area and AreaStatus relationships, Distinct recoverable Archive and 30-day Trash lifecycles, Area, AreaStatus, CanonicalStatus, One open recurrence occurrence with no missed-slot backfill (+3 more)

### Community 3 - "Private UX and Work Views"
Cohesion: 0.20
Nodes (10): Non-disclosing 404 RESOURCE_NOT_FOUND private-resource policy, Personal Task Planner Conceptual Data Model, Owner-inclusive relationship keys and cross-user access prevention, Today List Global Kanban and Area Kanban work views, Email/password registration login and password-recovery UX flows, Authenticated personal-planning information architecture, UXF-027 non-disclosing unavailable private-resource state, Today List Global Kanban and Area Kanban UX flows (+2 more)

### Community 4 - "Backlog Coverage Baseline"
Cohesion: 0.25
Nodes (9): 73 active conceptual endpoint rows, 120 active backlog stories, BD-001 through BD-013 cross-epic dependency decisions, 18-epic delivery sequence from foundation through release readiness, Three bounded non-production spikes, Personal Task Planner Vertical-Slice Backlog, Small independently verifiable vertical stories across required layers, 178 requirements 73 endpoint rows 120 stories and 3 spikes (+1 more)

### Community 5 - "Product Scope and Authentication"
Cohesion: 0.22
Nodes (9): EPIC-002 Email/password Authentication, Reserved deferred BL-012 and BL-013 social-authentication stories, Archive Trash 30-day retention and permanent account deletion, Required Area optional same-Area Project and Task model, Reserved deferred Google-authentication IDs US-002 FR-005 FR-006 PRV-005 RA-008, Email/password registration verification login recovery and deletion lifecycle, Future social authentication requires fresh cross-document planning, Personal Task Planner Product Requirements Document (+1 more)

### Community 6 - "REST Security and OpenAPI"
Cohesion: 0.25
Nodes (8): Personal Task Planner Conceptual REST API Authentication and Security Contract, ETag If-Match and Idempotency-Key mutation contract, No provider authorization callback linking or unlinking endpoints in MVP, Opaque server-side cookie session with CSRF and origin protection, Backend-owned OpenAPI contract and generated frontend client, Deterministic OpenAPI 3.1 and Fetch client generation pipeline, SPIKE-001 OpenAPI generator evidence before BL-003, SPIKE-001 first non-production work then BL-001 first production story

### Community 7 - "Modular Monolith Quality"
Cohesion: 0.25
Nodes (8): Architecture and Quality Strategy, Accounts planning tasks notifications lifecycle work-views and onboarding modules, TypeScript modular monolith in one pnpm workspace, PostgreSQL-backed durable idempotent worker without Redis, Contract security accessibility isolation and lifecycle quality gates, Separate Web API and Worker processes from one release, Personal Task Planner Domain Model and Business Rules, Owner-first authorization and strict private-space isolation

### Community 8 - "Account Identity and Deletion"
Cohesion: 0.33
Nodes (6): AccountDeletionProcess durable idempotent purge coordination, AuthenticationIdentity entity with one email/password identity per active User, User entity, Confirmed account deletion and immediate access revocation, AuthenticationIdentity, User

### Community 9 - "Reminder Notifications"
Cohesion: 0.67
Nodes (3): Default-enabled in-app reminder Notification preference and suppression semantics, Notification, TaskReminder

## Knowledge Gaps
- **22 isolated node(s):** `PostgreSQL Job Leasing`, `Generated Fetch Client`, `Graph Staleness Detection`, `Graph Secret Controls`, `Local stdio MCP` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DEC-066 Remove all social authentication from MVP and reserve historical IDs` connect `Phase 2 Scope Governance` to `Private UX and Work Views`, `Product Scope and Authentication`, `REST Security and OpenAPI`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Why does `Personal Task Planner Conceptual REST API Authentication and Security Contract` connect `REST Security and OpenAPI` to `Private UX and Work Views`, `Backlog Coverage Baseline`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `Personal Task Planner Product Requirements Document` connect `Product Scope and Authentication` to `Private UX and Work Views`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `PostgreSQL Job Leasing`, `Generated Fetch Client`, `Graph Staleness Detection` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
