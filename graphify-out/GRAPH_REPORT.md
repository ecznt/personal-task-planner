# Graph Report - personal-task-planner  (2026-07-25)

## Corpus Check
- 129 files · ~83,793 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 966 nodes · 1185 edges · 80 communities (69 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b9e9c817`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PostgreSQL Job Leasing
- API Test Tooling
- NestJS Composition Roots
- Repository Quality Foundation
- API Runtime Dependencies
- Web Test Tooling
- Workspace Runtime Scripts
- OpenAPI Generator Contract
- API Client Package
- Package Build Configuration
- Product Contract Corpus
- Shared Package Scripts
- Environment Validation
- Web Workspace Scripts
- Root Quality Tooling
- Next TypeScript Policy
- ESLint Package Metadata
- API Client TypeScript
- Next TypeScript Configuration
- Config Package TypeScript
- API Build Configuration
- Web TypeScript Configuration
- Shared ESLint Configuration
- Core Task Domain
- Phase Two Readiness
- Node TypeScript Configuration
- Package TypeScript Policy
- Nest Build Configuration
- Graphify Governance
- Architecture Runtime Topology
- Account Identity Lifecycle
- Generated Client Metadata
- Web Foundation Shell
- Prettier Configuration
- Contract Drift Check
- Secret Scanning
- Security Contract Architecture
- Dependency Update Automation
- Next Runtime Configuration
- Standalone Build Preparation
- Web Root Layout
- Modular Monolith Decision
- Notification Domain
- Next Generated Types
- Domain Ownership Rules
- Forbidden Import Verification
- Workspace Verification
- Logging Redaction
- Requirement Coverage
- Forbidden Boundary Value
- auth.controller.ts
- cn
- components.json
- .register
- problem-details.filter.ts
- VersionController
- registration.schema.ts
- AppModule
- foundation.spec.ts
- Q: Authentication ile user-owned resources bağlantısı
- Q: API ile karşılığı olmayan domain operasyonları
- Q: Domain karşılığı olmayan API endpointleri
- Q: Task mutations ile recurrence bağlantısı
- Q: Trash restore ile Area ve Project bağlantısı
- DatabaseModule
- ARGON2ID_OPTIONS

## God Nodes (most connected - your core abstractions)
1. `cn()` - 37 edges
2. `scripts` - 23 edges
3. `compilerOptions` - 18 edges
4. `scripts` - 15 edges
5. `AuthSecurityService` - 15 edges
6. `PrismaService` - 15 edges
7. `AccountsRepository` - 14 edges
8. `CsrfService` - 12 edges
9. `EPIC-001 Repository Foundation and Quality Gates` - 11 edges
10. `RegisterAccountService` - 10 edges

## Surprising Connections (you probably didn't know these)
- `PostgreSQL 18.3 Alpine local service` --semantically_similar_to--> `BL-002 PostgreSQL web API and worker composition roots`  [INFERRED] [semantically similar]
  compose.yaml → docs/planning/BACKLOG.md
- `Pinned Node.js 24.18.0 and pnpm 11.9.0 CI toolchain` --semantically_similar_to--> `BL-001 Pinned reproducible workspace`  [INFERRED] [semantically similar]
  .github/workflows/ci.yml → docs/planning/BACKLOG.md
- `Workspace architecture Prisma OpenAPI and contract gates` --semantically_similar_to--> `BL-005 Foundation contract architecture and security pipeline`  [INFERRED] [semantically similar]
  .github/workflows/ci.yml → docs/planning/BACKLOG.md
- `Reviewed generated OpenAPI and API client artifacts` --semantically_similar_to--> `BL-003 Deterministic OpenAPI and generated Fetch transport`  [INFERRED] [semantically similar]
  README.md → docs/planning/BACKLOG.md
- `Reviewed transitive dependency security overrides` --conceptually_related_to--> `DEC-069 EPIC-001 repository-foundation implementation plan`  [INFERRED]
  pnpm-workspace.yaml → docs/PROJECT_MASTER.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SPIKE-001 and BL-001 through BL-006 form the completed EPIC-001 delivery set** — docs_planning_backlog_spike_001_generator_evidence, docs_planning_backlog_bl_001_pinned_workspace, docs_planning_backlog_bl_002_runtime_composition_roots, docs_planning_backlog_bl_003_generated_transport, docs_planning_backlog_bl_004_privacy_safe_diagnostics, docs_planning_backlog_bl_005_foundation_quality_pipeline, docs_planning_backlog_bl_006_recoverable_job_lease, docs_planning_backlog_epic_001_verified_completion [EXTRACTED 1.00]
- **CI workspace policy OpenAPI lint and contributor checks implement the foundation quality-gate system** — _github_workflows_ci_quality_job, readme_required_quality_checks, pnpm_workspace_strict_exact_dependency_policy, redocly_recommended_strict_ruleset, docs_planning_backlog_bl_005_foundation_quality_pipeline [INFERRED 0.95]
- **Pinned toolchain workspace PostgreSQL and separate process roots form the EPIC-001 runtime boundary** — _github_workflows_ci_pinned_node_pnpm_toolchain, pnpm_workspace_apps_and_packages_discovery, compose_postgresql_18_service, readme_web_api_worker_processes, docs_planning_backlog_bl_002_runtime_composition_roots [INFERRED 0.95]
- **Requirements endpoint rows stories and spikes form the active MVP coverage baseline** — docs_planning_readiness_report_active_mvp_baseline_counts, docs_planning_readiness_report_requirement_traceability, docs_planning_readiness_report_no_coverage_gaps [EXTRACTED 1.00]
- **Pinned OpenAPI generator compatibility profile** — docs_spikes_spike_001_openapi_generator_hey_api_0_99_0, docs_spikes_spike_001_openapi_generator_typescript_5_9_3, docs_spikes_spike_001_openapi_generator_same_origin_fetch_credentials, docs_spikes_spike_001_openapi_generator_js_yaml_security_override [EXTRACTED 1.00]
- **Architecture decision spike evidence and backlog story participate in the OpenAPI delivery chain** — docs_architecture_architecture_arc_013_openapi_ownership, docs_architecture_adr_adr_002_rest_openapi_rest_openapi_adr, docs_spikes_spike_001_openapi_generator_openapi_generator_compatibility_spike, docs_planning_backlog_bl_003_generated_transport [EXTRACTED 1.00]
- **Required Area optional Project and Task form the preserved personal-planning core** — docs_domain_domain_model_area, docs_domain_domain_model_project, docs_domain_domain_model_task [EXTRACTED 1.00]

## Communities (80 total, 11 thin omitted)

### Community 0 - "PostgreSQL Job Leasing"
Cohesion: 0.18
Nodes (8): ApiExcludeController, HealthController, Controller, Get, Inject, HealthService, Inject, Injectable

### Community 1 - "API Test Tooling"
Cohesion: 0.05
Nodes (41): devDependencies, eslint, jest, @jest/globals, @nestjs/cli, @nestjs/testing, pino-pretty, @planner/eslint-config (+33 more)

### Community 2 - "NestJS Composition Roots"
Cohesion: 0.21
Nodes (9): AccountsModule, Module, HealthModule, Module, createLoggerParameters(), createPinoOptions(), redactPaths, Module (+1 more)

### Community 3 - "Repository Quality Foundation"
Cohesion: 0.06
Nodes (35): GitHub Actions CI Workflow, Pinned Node.js 24.18.0 and pnpm 11.9.0 CI toolchain, PostgreSQL 18.3 Alpine CI test service, CI Quality Job, Gitleaks and security verification gates, Unit component API database contract E2E and security test portfolio, Workspace architecture Prisma OpenAPI and contract gates, Loopback-bound configurable PostgreSQL port (+27 more)

### Community 4 - "API Runtime Dependencies"
Cohesion: 0.05
Nodes (37): dependencies, class-transformer, class-validator, dotenv, helmet, @nestjs/common, @nestjs/core, nestjs-pino (+29 more)

### Community 5 - "Web Test Tooling"
Cohesion: 0.05
Nodes (37): devDependencies, eslint, jsdom, @planner/eslint-config, @planner/typescript-config, postcss, tailwindcss, @tailwindcss/postcss (+29 more)

### Community 6 - "Workspace Runtime Scripts"
Cohesion: 0.06
Nodes (30): engines, node, pnpm, name, packageManager, private, scripts, api-client:generate (+22 more)

### Community 7 - "OpenAPI Generator Contract"
Cohesion: 0.07
Nodes (30): NestJS controllers and DTO schemas own the implemented HTTP contract, Same-origin browser credentials without HttpOnly cookie auth callback, Committed deterministic OpenAPI 3.1 artifact, OpenAPI lint compatibility Supertest ownership and generated-client verification, Pinned generated Fetch client without parallel transport types, ADR-002 REST API with Backend-Owned OpenAPI and Generated Client, Stable operation IDs as generated method names, BL-003 Deterministic OpenAPI and generated Fetch transport (+22 more)

### Community 8 - "API Client Package"
Cohesion: 0.07
Nodes (26): eslint-plugin-jsx-a11y, eslint-plugin-react-hooks, globals, @next/eslint-plugin-next, dependencies, @eslint/js, eslint-plugin-jsx-a11y, eslint-plugin-react-hooks (+18 more)

### Community 9 - "Package Build Configuration"
Cohesion: 0.07
Nodes (26): @hey-api/openapi-ts, devDependencies, eslint, @hey-api/openapi-ts, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+18 more)

### Community 10 - "Product Contract Corpus"
Cohesion: 0.09
Nodes (23): Personal Task Planner Conceptual REST API Authentication and Security Contract, ETag If-Match and Idempotency-Key mutation contract, No provider authorization callback linking or unlinking endpoints in MVP, 73 active conceptual endpoint rows, Non-disclosing 404 RESOURCE_NOT_FOUND private-resource policy, Opaque server-side cookie session with CSRF and origin protection, Backend-owned OpenAPI contract and generated frontend client, Personal Task Planner Conceptual Data Model (+15 more)

### Community 11 - "Shared Package Scripts"
Cohesion: 0.09
Nodes (22): dependencies, zod, devDependencies, eslint, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+14 more)

### Community 12 - "Environment Validation"
Cohesion: 0.07
Nodes (26): ApiEnvironment, apiEnvironmentSchema, databaseUrl, logLevel, parseEnvironment(), parseWorkerEnvironment(), sharedEnvironmentSchema, WorkerEnvironment (+18 more)

### Community 13 - "Web Workspace Scripts"
Cohesion: 0.05
Nodes (40): dependencies, class-variance-authority, clsx, @hookform/resolvers, lucide-react, next, @planner/api-client, radix-ui (+32 more)

### Community 14 - "Root Quality Tooling"
Cohesion: 0.10
Nodes (21): devDependencies, dependency-cruiser, eslint, @eslint/js, @planner/eslint-config, @playwright/test, prettier, tsx (+13 more)

### Community 15 - "Next TypeScript Policy"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, declaration, declarationMap, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules (+11 more)

### Community 16 - "ESLint Package Metadata"
Cohesion: 0.11
Nodes (18): name, private, scripts, build, dev, dev:worker, lint, openapi:generate (+10 more)

### Community 17 - "API Client TypeScript"
Cohesion: 0.12
Nodes (16): compilerOptions, exactOptionalPropertyTypes, lib, module, moduleResolution, outDir, rootDir, types (+8 more)

### Community 18 - "Next TypeScript Configuration"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, incremental, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 19 - "Config Package TypeScript"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, experimentalDecorators, outDir, rootDir, sourceMap, strictPropertyInitialization, extends (+6 more)

### Community 20 - "API Build Configuration"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, declarationMap, rootDir, exclude, extends, include, src/**/*.ts (+4 more)

### Community 21 - "Web TypeScript Configuration"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, paths, exclude, extends, include, next-env.d.ts, .next/types/**/*.ts (+4 more)

### Community 22 - "Shared ESLint Configuration"
Cohesion: 0.31
Nodes (3): baseConfig, nextConfig, nodeConfig

### Community 23 - "Core Task Domain"
Cohesion: 0.20
Nodes (11): LifecycleOperation and LifecycleEffect cascade provenance, Recurrence occurrence predecessor and generation uniqueness constraints, Task entity with required owner Area and AreaStatus relationships, Distinct recoverable Archive and 30-day Trash lifecycles, Area, AreaStatus, CanonicalStatus, One open recurrence occurrence with no missed-slot backfill (+3 more)

### Community 24 - "Phase Two Readiness"
Cohesion: 0.18
Nodes (11): 178 accepted requirements 73 endpoint rows 120 active stories and 3 bounded spikes, SPIKE-001 done then BL-001 begins production work, Go with zero BLOCKER and zero HIGH findings, Restricted graph health with 118 nodes 117 edges 6 hyperedges and 16 communities, DEC-066 closes the fourth original HIGH readiness finding, Project Master and confirmed generator profile are expected cross-community governance bridges, No orphan requirement unsupported endpoint ownerless entity or backlog-less MVP feature, Phase 2 Final Readiness Audit (+3 more)

### Community 25 - "Node TypeScript Configuration"
Cohesion: 0.18
Nodes (10): compilerOptions, lib, module, moduleResolution, types, extends, ./base.json, ES2024 (+2 more)

### Community 26 - "Package TypeScript Policy"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, @planner/typescript-config/node.json, src/**/*.ts

### Community 27 - "Nest Build Configuration"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, tsConfigPath, $schema, sourceRoot

### Community 28 - "Graphify Governance"
Cohesion: 0.29
Nodes (7): Direct source remains authoritative over graph inference, Graphify repository-local discovery and impact analysis, Explicit full graph rebuild triggers, Graph staleness detection and reporting, ADR-003 Graphify for Architecture Discovery and Impact Analysis, Targeted query first and smallest material incremental extraction policy, Graph extraction secret and absolute-path controls

### Community 29 - "Architecture Runtime Topology"
Cohesion: 0.33
Nodes (6): ARC-001 Web API and Worker runtime topology, ARC-005 Domain-aligned backend module map, ARC-009 PostgreSQL-backed durable worker without Redis, ARC-030 Architecture knowledge graph workflow, Architecture and Quality Strategy, TypeScript modular monolith with one pnpm workspace

### Community 30 - "Account Identity Lifecycle"
Cohesion: 0.33
Nodes (6): AccountDeletionProcess durable idempotent purge coordination, AuthenticationIdentity entity with one email/password identity per active User, User entity, Confirmed account deletion and immediate access revocation, AuthenticationIdentity, User

### Community 31 - "Generated Client Metadata"
Cohesion: 0.33
Nodes (5): files, name, private, version, *.json

### Community 33 - "Prettier Configuration"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 34 - "Contract Drift Check"
Cohesion: 0.50
Nodes (4): collectFiles(), digestGeneratedFiles(), generatedExtensions, generatedRoots

### Community 35 - "Secret Scanning"
Cohesion: 0.40
Nodes (4): excluded, findings, patterns, trackedFiles

### Community 36 - "Security Contract Architecture"
Cohesion: 0.50
Nodes (4): ARC-010 Opaque HttpOnly cookie session strategy, ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline, ARC-025 OpenAPI generated-client and architecture drift gates, Confirmed @hey-api/openapi-ts 0.99.0 TypeScript 5.9.3 Fetch profile

### Community 37 - "Dependency Update Automation"
Cohesion: 0.67
Nodes (3): Dependabot Configuration, Dependabot updates target develop, Weekly npm GitHub Actions and Docker dependency updates

### Community 38 - "Next Runtime Configuration"
Cohesion: 0.50
Nodes (3): environment, nextConfig, webEnvironmentSchema

### Community 41 - "Modular Monolith Decision"
Cohesion: 0.67
Nodes (3): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing

### Community 42 - "Notification Domain"
Cohesion: 0.67
Nodes (3): Default-enabled in-app reminder Notification preference and suppression semantics, Notification, TaskReminder

### Community 64 - "auth.controller.ts"
Cohesion: 0.06
Nodes (39): CsrfService, Inject, Injectable, RegisterAccountCommand, RegisterAccountService, RegistrationResult, secondsUntilNextUtcHour(), Inject (+31 more)

### Community 65 - "cn"
Cohesion: 0.08
Nodes (42): metadata, metadata, Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants, Button() (+34 more)

### Community 66 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 67 - ".register"
Cohesion: 0.13
Nodes (18): ApiBody, ApiHeader, ApiResponse, ApiOperation, Get, CsrfTokenDataDto, CsrfTokenResponseDto, RegisterAccountRequestDto (+10 more)

### Community 68 - "problem-details.filter.ts"
Cohesion: 0.19
Nodes (8): ApiProblemException, ApiProblemOptions, ValidationProblemItem, ProblemDetails, ProblemDetailsFilter, safeDetail(), statusCodes, Catch

### Community 69 - "VersionController"
Cohesion: 0.22
Nodes (8): ApiOkResponse, ApiOperation, ApiTags, Controller, Get, VersionController, ApiProperty, VersionResponseDto

### Community 70 - "registration.schema.ts"
Cohesion: 0.36
Nodes (7): parseRegistrationInput(), passwordSchema, RegistrationInput, registrationSchema, toJsonPointer(), toValidationProblem(), zodIssueCode()

### Community 71 - "AppModule"
Cohesion: 0.43
Nodes (5): generateOpenApi(), sortRecursively(), AppModule, Module, bootstrapApi()

### Community 72 - "foundation.spec.ts"
Cohesion: 0.40
Nodes (3): ThrowingController, Controller, Get

### Community 73 - "Q: Authentication ile user-owned resources bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Authentication ile user-owned resources bağlantısı, Source Nodes

### Community 74 - "Q: API ile karşılığı olmayan domain operasyonları"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: API ile karşılığı olmayan domain operasyonları, Source Nodes

### Community 75 - "Q: Domain karşılığı olmayan API endpointleri"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Domain karşılığı olmayan API endpointleri, Source Nodes

### Community 76 - "Q: Task mutations ile recurrence bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Task mutations ile recurrence bağlantısı, Source Nodes

### Community 77 - "Q: Trash restore ile Area ve Project bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trash restore ile Area ve Project bağlantısı, Source Nodes

### Community 78 - "DatabaseModule"
Cohesion: 0.67
Nodes (3): DatabaseModule, Module, Global

## Knowledge Gaps
- **418 isolated node(s):** `printWidth`, `semi`, `singleQuote`, `trailingComma`, `$schema` (+413 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `Domain Operation to API Coverage` (2× useful, score=1.850829142) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `API Test Tooling` to `ESLint Package Metadata`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `PrismaService` connect `auth.controller.ts` to `PostgreSQL Job Leasing`, `Environment Validation`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `dependencies` connect `API Runtime Dependencies` to `ESLint Package Metadata`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `singleQuote` to the rest of the system?**
  _418 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Test Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Repository Quality Foundation` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
- **Should `API Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._