# Graph Report - .  (2026-07-23)

## Corpus Check
- 13 files · ~71,676 words (2 re-extracted in this incremental update)
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 118 nodes · 117 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API Security Contract
- MVP Product Scope
- Task Lifecycle Data
- OpenAPI Generation Contract
- Phase 2 Readiness
- Graphify Governance
- Foundation Delivery
- Generator Compatibility
- Graphify Workflow
- Modular Monolith Architecture
- Account Identity Lifecycle
- Generated Client Pipeline
- Architecture Decisions
- Notification Delivery
- Domain Ownership Rules
- Requirement Coverage

## God Nodes (most connected - your core abstractions)
1. `Personal Task Planner Product Requirements Document` - 6 edges
2. `Task` - 6 edges
3. `Personal Task Planner Conceptual REST API Authentication and Security Contract` - 6 edges
4. `Confirmed non-production OpenAPI generator profile` - 6 edges
5. `Personal Task Planner Project Master` - 6 edges
6. `Personal Task Planner UX Flows and Information Architecture` - 5 edges
7. `Phase 2 Final Readiness Audit` - 5 edges
8. `Graphify repository-local discovery and impact analysis` - 4 edges
9. `EPIC-001 Repository Foundation and Quality Gates` - 4 edges
10. `SPIKE-001 OpenAPI generator compatibility evidence` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Task` --shares_data_with--> `Task entity with required owner Area and AreaStatus relationships`  [INFERRED]
  docs/domain/DOMAIN_MODEL.md → docs/data/DATA_MODEL.md
- `Go with zero BLOCKER and zero HIGH findings` --semantically_similar_to--> `Phase 2 Complete and approved`  [INFERRED] [semantically similar]
  docs/planning/READINESS_REPORT.md → docs/PROJECT_MASTER.md
- `SPIKE-001 done then BL-001 begins production work` --semantically_similar_to--> `SPIKE-001 completed as bounded non-production evidence`  [INFERRED] [semantically similar]
  docs/planning/READINESS_REPORT.md → docs/PROJECT_MASTER.md
- `Restricted graph health with 118 nodes 117 edges 6 hyperedges and 16 communities` --semantically_similar_to--> `Current Graphify graph has 118 nodes 117 edges 6 hyperedges and 16 communities`  [INFERRED] [semantically similar]
  docs/planning/READINESS_REPORT.md → docs/PROJECT_MASTER.md
- `Project Master and confirmed generator profile are expected cross-community governance bridges` --semantically_similar_to--> `Generator Compatibility Profile bridges ADR-002 SPIKE-001 and EPIC-001 delivery`  [INFERRED] [semantically similar]
  docs/planning/READINESS_REPORT.md → docs/PROJECT_MASTER.md

## Hyperedges (group relationships)
- **DEC-066 frozen email/password scope and zero BLOCKER HIGH result form approved Phase 2 governance** — docs_project_master_dec_066, docs_project_master_frozen_email_password_mvp, docs_project_master_phase_2_complete, docs_planning_readiness_report_approved_readiness_result [EXTRACTED 1.00]
- **Requirements endpoint rows stories and spikes form the active MVP coverage baseline** — docs_planning_readiness_report_active_mvp_baseline_counts, docs_planning_readiness_report_requirement_traceability, docs_planning_readiness_report_no_coverage_gaps [EXTRACTED 1.00]
- **Phase 2 approval and completed SPIKE-001 hand off to explicitly authorized BL-001** — docs_project_master_phase_2_complete, docs_project_master_spike_001_complete, docs_project_master_bl_001_instruction_gate, docs_planning_readiness_report_approved_execution_order [EXTRACTED 1.00]
- **Pinned OpenAPI generator compatibility profile** — docs_spikes_spike_001_openapi_generator_hey_api_0_99_0, docs_spikes_spike_001_openapi_generator_typescript_5_9_3, docs_spikes_spike_001_openapi_generator_same_origin_fetch_credentials, docs_spikes_spike_001_openapi_generator_js_yaml_security_override [EXTRACTED 1.00]
- **Architecture decision spike evidence and backlog story participate in the OpenAPI delivery chain** — docs_architecture_architecture_arc_013_openapi_ownership, docs_architecture_adr_adr_002_rest_openapi_rest_openapi_adr, docs_spikes_spike_001_openapi_generator_openapi_generator_compatibility_spike, docs_planning_backlog_bl_003_generated_transport [EXTRACTED 1.00]
- **Required Area optional Project and Task form the preserved personal-planning core** — docs_domain_domain_model_area, docs_domain_domain_model_project, docs_domain_domain_model_task [EXTRACTED 1.00]

## Communities (16 total, 2 thin omitted)

### Community 0 - "API Security Contract"
Cohesion: 0.14
Nodes (14): Personal Task Planner Conceptual REST API Authentication and Security Contract, ETag If-Match and Idempotency-Key mutation contract, No provider authorization callback linking or unlinking endpoints in MVP, 73 active conceptual endpoint rows, Non-disclosing 404 RESOURCE_NOT_FOUND private-resource policy, Opaque server-side cookie session with CSRF and origin protection, Backend-owned OpenAPI contract and generated frontend client, Personal Task Planner Conceptual Data Model (+6 more)

### Community 1 - "MVP Product Scope"
Cohesion: 0.15
Nodes (13): Archive Trash 30-day retention and permanent account deletion, Required Area optional same-Area Project and Task model, Reserved deferred Google-authentication IDs US-002 FR-005 FR-006 PRV-005 RA-008, Email/password registration verification login recovery and deletion lifecycle, Future social authentication requires fresh cross-document planning, Personal Task Planner Product Requirements Document, Calendar and completion recurrence with multiple in-app reminders, Today List Global Kanban and Area Kanban work views (+5 more)

### Community 2 - "Task Lifecycle Data"
Cohesion: 0.20
Nodes (11): LifecycleOperation and LifecycleEffect cascade provenance, Recurrence occurrence predecessor and generation uniqueness constraints, Task entity with required owner Area and AreaStatus relationships, Distinct recoverable Archive and 30-day Trash lifecycles, Area, AreaStatus, CanonicalStatus, One open recurrence occurrence with no missed-slot backfill (+3 more)

### Community 3 - "OpenAPI Generation Contract"
Cohesion: 0.20
Nodes (10): NestJS controllers and DTO schemas own the implemented HTTP contract, Same-origin browser credentials without HttpOnly cookie auth callback, Committed deterministic OpenAPI 3.1 artifact, OpenAPI lint compatibility Supertest ownership and generated-client verification, Pinned generated Fetch client without parallel transport types, ADR-002 REST API with Backend-Owned OpenAPI and Generated Client, Stable operation IDs as generated method names, Deterministic 16-file generation with stable combined SHA-256 (+2 more)

### Community 4 - "Phase 2 Readiness"
Cohesion: 0.24
Nodes (10): 178 accepted requirements 73 endpoint rows 120 active stories and 3 bounded spikes, SPIKE-001 done then BL-001 begins production work, Go with zero BLOCKER and zero HIGH findings, No orphan requirement unsupported endpoint ownerless entity or backlog-less MVP feature, Phase 2 Final Readiness Audit, Complete active requirement endpoint and backlog traceability, Owner-scoped non-disclosing cookie CSRF rate-limit and account-deletion security baseline, BL-001 awaits explicit User instruction and must precede later backlog stories (+2 more)

### Community 5 - "Graphify Governance"
Cohesion: 0.24
Nodes (10): Restricted graph health with 118 nodes 117 edges 6 hyperedges and 16 communities, Project Master and confirmed generator profile are expected cross-community governance bridges, Current Graphify graph has 118 nodes 117 edges 6 hyperedges and 16 communities, DEC-067 Proportional Graphify query and incremental extraction policy, DEC-068 Approved OpenAPI generator compatibility profile, Generator Compatibility Profile bridges ADR-002 SPIKE-001 and EPIC-001 delivery, Graphify findings are advisory and direct source remains authoritative, Historical readiness graph had 86 nodes 91 edges 3 hyperedges and 10 communities (+2 more)

### Community 6 - "Foundation Delivery"
Cohesion: 0.28
Nodes (9): BD-012 Bounded just-in-time spike evidence, BL-001 Install and validate the pinned workspace, BL-003 Deterministic OpenAPI and generated transport package, 18-epic delivery sequence, EPIC-001 Repository Foundation and Quality Gates, SPIKE-001 complete with BL-001 next and unstarted, SPIKE-001 OpenAPI generator compatibility evidence, Personal Task Planner Vertical-Slice Backlog (+1 more)

### Community 7 - "Generator Compatibility"
Cohesion: 0.22
Nodes (9): Approved pinned generator profile for BL-003, Confirmed non-production OpenAPI generator profile, @hey-api/openapi-ts 0.99.0, js-yaml 4.3.0 security override, Native Response.headers available without named header-map types, No generated auth callback for HttpOnly session cookie, Explicit same-origin Fetch credentials, TypeScript 5.9.3 strict compatibility (+1 more)

### Community 8 - "Graphify Workflow"
Cohesion: 0.29
Nodes (7): Direct source remains authoritative over graph inference, Graphify repository-local discovery and impact analysis, Explicit full graph rebuild triggers, Graph staleness detection and reporting, ADR-003 Graphify for Architecture Discovery and Impact Analysis, Targeted query first and smallest material incremental extraction policy, Graph extraction secret and absolute-path controls

### Community 9 - "Modular Monolith Architecture"
Cohesion: 0.33
Nodes (6): ARC-001 Web API and Worker runtime topology, ARC-005 Domain-aligned backend module map, ARC-009 PostgreSQL-backed durable worker without Redis, ARC-030 Architecture knowledge graph workflow, Architecture and Quality Strategy, TypeScript modular monolith with one pnpm workspace

### Community 10 - "Account Identity Lifecycle"
Cohesion: 0.33
Nodes (6): AccountDeletionProcess durable idempotent purge coordination, AuthenticationIdentity entity with one email/password identity per active User, User entity, Confirmed account deletion and immediate access revocation, AuthenticationIdentity, User

### Community 11 - "Generated Client Pipeline"
Cohesion: 0.50
Nodes (4): ARC-010 Opaque HttpOnly cookie session strategy, ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline, ARC-025 OpenAPI generated-client and architecture drift gates, Confirmed @hey-api/openapi-ts 0.99.0 TypeScript 5.9.3 Fetch profile

### Community 12 - "Architecture Decisions"
Cohesion: 0.67
Nodes (3): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing

### Community 13 - "Notification Delivery"
Cohesion: 0.67
Nodes (3): Default-enabled in-app reminder Notification preference and suppression semantics, Notification, TaskReminder

## Knowledge Gaps
- **42 isolated node(s):** `ADR-001: Modular Monolith with Separate Runtime Entry Points`, `PostgreSQL Job Leasing`, `178 active accepted MVP requirement IDs`, `Email/password registration verification login recovery and deletion lifecycle`, `Required Area optional same-Area Project and Task model` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DEC-066 Remove social authentication from MVP and preserve deferred IDs` connect `API Security Contract` to `Graphify Governance`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **What connects `ADR-001: Modular Monolith with Separate Runtime Entry Points`, `PostgreSQL Job Leasing`, `178 active accepted MVP requirement IDs` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Security Contract` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
