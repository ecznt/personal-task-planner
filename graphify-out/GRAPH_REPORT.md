# Graph Report - /Users/enescanzenit/Documents/personal-task-planner  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1240 nodes · 1667 edges · 125 communities (89 shown, 36 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a31b4dcc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.module.ts
- dependencies
- accounts-worker.module.ts
- cn
- devDependencies
- AuthController
- auth.controller.ts
- EPIC-001 Repository Foundation and Quality Gates
- devDependencies
- Confirmed non-production OpenAPI generator profile
- package.json
- package.json
- auth-security.service.ts
- AccountsRepository
- accounts.repository.ts
- Personal Task Planner Conceptual REST API Authentication and Security Contract
- scripts
- package.json
- components.json
- AuthSecurityService
- password-reset-schema.ts
- auth-api.ts
- compilerOptions
- problem-details.filter.ts
- verify-email.service.ts
- environment.ts
- devDependencies
- compilerOptions
- compilerOptions
- scripts
- email-verification-job.handler.ts
- compilerOptions
- email-verification.schema.ts
- dependencies
- tsconfig.build.json
- tsconfig.json
- anonymous-csrf.guard.ts
- node.mjs
- page.tsx
- Task
- Phase 2 Final Readiness Audit
- compilerOptions
- login.spec.ts
- register-account.service.ts
- AppModule
- read-session.service.ts
- registration.schema.ts
- page.tsx
- package.json
- tsconfig.json
- nest-cli.json
- parseWorkerEnvironment
- Graphify repository-local discovery and impact analysis
- Architecture and Quality Strategy
- User
- index.ts
- package.json
- session.schema.ts
- layout.tsx
- page.tsx
- Q: Authentication ile user-owned resources bağlantısı
- Q: API ile karşılığı olmayan domain operasyonları
- Q: Domain karşılığı olmayan API endpointleri
- Q: Task mutations ile recurrence bağlantısı
- Q: Trash restore ile Area ve Project bağlantısı
- .prettierrc.json
- check-generated.mjs
- scan-secrets.mjs
- package.json
- next.config.ts
- email-verification-schema.ts
- registration-schema.ts
- ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline
- Weekly npm GitHub Actions and Docker dependency updates
- prepare-standalone.mjs
- login-schema.ts
- Domain-Aligned Modular Monolith
- Notification
- class-validator
- dotenv
- class-transformer
- @nestjs/common
- @nestjs/core
- nestjs-pino
- @nestjs/platform-express
- nodemailer
- @prisma/adapter-pg
- @prisma/client
- reflect-metadata
- rxjs
- zod
- next-env.d.ts
- Personal Task Planner Domain Model and Business Rules
- @planner/eslint-config
- eslint
- verify-forbidden-import.mjs
- verify-workspace.mjs
- ARGON2ID_OPTIONS
- ApiOperation
- ApiTags
- Controller
- Get
- ApiProperty
- Inject
- Injectable
- LOG_REDACTION_PATHS
- 178 active accepted MVP requirement IDs
- Module
- forbiddenValue

## God Nodes (most connected - your core abstractions)
1. `AccountsRepository` - 47 edges
2. `AuthSecurityService` - 39 edges
3. `cn()` - 37 edges
4. `scripts` - 23 edges
5. `compilerOptions` - 18 edges
6. `scripts` - 15 edges
7. `AuthController` - 14 edges
8. `RequestPasswordResetService` - 12 edges
9. `ResetPasswordService` - 12 edges
10. `EPIC-001 Repository Foundation and Quality Gates` - 11 edges

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

## Communities (125 total, 36 thin omitted)

### Community 0 - "app.module.ts"
Cohesion: 0.06
Nodes (30): ApiExcludeController, ApiOkResponse, AccountsModule, Module, DatabaseModule, Module, PrismaService, Injectable (+22 more)

### Community 1 - "dependencies"
Cohesion: 0.04
Nodes (43): dependencies, class-variance-authority, clsx, @hookform/resolvers, input-otp, lucide-react, next, @planner/api-client (+35 more)

### Community 2 - "accounts-worker.module.ts"
Cohesion: 0.07
Nodes (20): AccountsWorkerModule, Module, PasswordResetEmailDelivery, PasswordResetEmailMessage, RESET_PASSWORD_EMAIL_DELIVERY, PasswordResetJobHandler, Injectable, SmtpPasswordResetEmailAdapter (+12 more)

### Community 3 - "cn"
Cohesion: 0.10
Nodes (32): metadata, Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants, Button(), buttonVariants (+24 more)

### Community 4 - "devDependencies"
Cohesion: 0.05
Nodes (43): devDependencies, eslint, jest, @jest/globals, @nestjs/cli, @nestjs/testing, pino-pretty, @planner/eslint-config (+35 more)

### Community 5 - "AuthController"
Cohesion: 0.15
Nodes (22): ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags, LogoutService, Inject, Injectable (+14 more)

### Community 6 - "auth.controller.ts"
Cohesion: 0.11
Nodes (33): ApiProperty, CsrfTokenDataDto, CsrfTokenResponseDto, EmailVerificationRequestAcceptedDataDto, EmailVerificationRequestAcceptedResponseDto, EmailVerificationRequestDto, PasswordResetRequestAcceptedDataDto, PasswordResetRequestAcceptedResponseDto (+25 more)

### Community 7 - "EPIC-001 Repository Foundation and Quality Gates"
Cohesion: 0.06
Nodes (35): GitHub Actions CI Workflow, Pinned Node.js 24.18.0 and pnpm 11.9.0 CI toolchain, PostgreSQL 18.3 Alpine CI test service, CI Quality Job, Gitleaks and security verification gates, Unit component API database contract E2E and security test portfolio, Workspace architecture Prisma OpenAPI and contract gates, Loopback-bound configurable PostgreSQL port (+27 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (35): devDependencies, eslint, jsdom, @planner/eslint-config, @planner/typescript-config, postcss, tailwindcss, @tailwindcss/postcss (+27 more)

### Community 9 - "Confirmed non-production OpenAPI generator profile"
Cohesion: 0.07
Nodes (30): NestJS controllers and DTO schemas own the implemented HTTP contract, Same-origin browser credentials without HttpOnly cookie auth callback, Committed deterministic OpenAPI 3.1 artifact, OpenAPI lint compatibility Supertest ownership and generated-client verification, Pinned generated Fetch client without parallel transport types, ADR-002 REST API with Backend-Owned OpenAPI and Generated Client, Stable operation IDs as generated method names, BL-003 Deterministic OpenAPI and generated Fetch transport (+22 more)

### Community 10 - "package.json"
Cohesion: 0.07
Nodes (26): eslint-plugin-jsx-a11y, eslint-plugin-react-hooks, globals, @next/eslint-plugin-next, dependencies, @eslint/js, eslint-plugin-jsx-a11y, eslint-plugin-react-hooks (+18 more)

### Community 11 - "package.json"
Cohesion: 0.07
Nodes (26): @hey-api/openapi-ts, devDependencies, eslint, @hey-api/openapi-ts, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+18 more)

### Community 12 - "auth-security.service.ts"
Cohesion: 0.16
Nodes (12): RequestPasswordResetCommand, RequestPasswordResetResult, RequestPasswordResetService, Injectable, ResetPasswordCommand, ResetPasswordResult, ResetPasswordService, Injectable (+4 more)

### Community 13 - "AccountsRepository"
Cohesion: 0.09
Nodes (9): CsrfService, Inject, Injectable, Inject, Inject, Inject, AccountsRepository, Inject (+1 more)

### Community 14 - "accounts.repository.ts"
Cohesion: 0.09
Nodes (19): AnonymousAuthTransactionInput, AuthCounterInput, AuthenticatedSession, CreateLoginSessionInput, isResetPasswordFailure(), isResetPasswordResponse(), isUniqueConstraintError(), isVerificationFailure() (+11 more)

### Community 15 - "Personal Task Planner Conceptual REST API Authentication and Security Contract"
Cohesion: 0.09
Nodes (23): Personal Task Planner Conceptual REST API Authentication and Security Contract, ETag If-Match and Idempotency-Key mutation contract, No provider authorization callback linking or unlinking endpoints in MVP, 73 active conceptual endpoint rows, Non-disclosing 404 RESOURCE_NOT_FOUND private-resource policy, Opaque server-side cookie session with CSRF and origin protection, Backend-owned OpenAPI contract and generated frontend client, Personal Task Planner Conceptual Data Model (+15 more)

### Community 16 - "scripts"
Cohesion: 0.09
Nodes (23): scripts, api-client:generate, build, dev, format, format:check, lint, openapi:check (+15 more)

### Community 17 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, zod, devDependencies, eslint, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+14 more)

### Community 18 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 20 - "password-reset-schema.ts"
Cohesion: 0.15
Nodes (11): metadata, metadata, mocks, PasswordResetRequestForm(), passwordResetRequestFormSchema, PasswordResetRequestFormValues, passwordSchema, resetPasswordFormSchema (+3 more)

### Community 21 - "auth-api.ts"
Cohesion: 0.17
Nodes (10): metadata, apiError(), AuthApiError, CsrfData, csrfQueryKey, fetchCsrf(), EmailVerificationForm(), mocks (+2 more)

### Community 22 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, declaration, declarationMap, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules (+11 more)

### Community 23 - "problem-details.filter.ts"
Cohesion: 0.14
Nodes (11): ApiProblemException, ApiProblemOptions, ValidationProblemItem, ProblemDetails, ProblemDetailsFilter, safeDetail(), statusCodes, ThrowingController (+3 more)

### Community 24 - "verify-email.service.ts"
Cohesion: 0.13
Nodes (12): secondsUntilWindowEnd(), RequestEmailVerificationCommand, RequestEmailVerificationResult, RequestEmailVerificationService, Inject, Injectable, Inject, Injectable (+4 more)

### Community 25 - "environment.ts"
Cohesion: 0.13
Nodes (15): ApiEnvironment, apiEnvironmentSchema, databaseUrl, EmailEnvironment, emailEnvironmentSchema, emailEnvironmentShape, logLevel, parseEmailEnvironment() (+7 more)

### Community 26 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dependency-cruiser, @eslint/js, @playwright/test, prettier, tsx, @types/node, typescript (+9 more)

### Community 27 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, exactOptionalPropertyTypes, lib, module, moduleResolution, outDir, rootDir, types (+8 more)

### Community 28 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, incremental, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 29 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:worker, lint, openapi:generate, prisma:generate, prisma:migrate:deploy (+7 more)

### Community 30 - "email-verification-job.handler.ts"
Cohesion: 0.23
Nodes (8): EmailVerificationJobHandler, Inject, Injectable, VERIFICATION_EMAIL_DELIVERY, VerificationEmailDelivery, VerificationEmailMessage, SmtpVerificationEmailAdapter, Injectable

### Community 31 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, experimentalDecorators, outDir, rootDir, sourceMap, strictPropertyInitialization, extends (+6 more)

### Community 32 - "email-verification.schema.ts"
Cohesion: 0.21
Nodes (13): emailSchema, EmailVerificationRequestInput, emailVerificationRequestSchema, idempotencyKeySchema, issueCode(), jsonPointer(), parseBody(), parseEmailVerificationRequest() (+5 more)

### Community 33 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, helmet, @nestjs/swagger, @node-rs/argon2, pg, pino, @planner/config, helmet (+5 more)

### Community 34 - "tsconfig.build.json"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, declarationMap, rootDir, exclude, extends, include, src/**/*.ts (+4 more)

### Community 35 - "tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, paths, exclude, extends, include, next-env.d.ts, .next/types/**/*.ts (+4 more)

### Community 36 - "anonymous-csrf.guard.ts"
Cohesion: 0.26
Nodes (7): AnonymousCsrfGuard, safeOrigin(), Inject, Injectable, anonymousCsrfCookieName(), parseCookieValue(), safelyDecodeCookieValue()

### Community 37 - "node.mjs"
Cohesion: 0.31
Nodes (3): baseConfig, nextConfig, nodeConfig

### Community 38 - "page.tsx"
Cohesion: 0.24
Nodes (4): metadata, SessionBoundary(), SignOutButton(), mocks

### Community 39 - "Task"
Cohesion: 0.20
Nodes (11): LifecycleOperation and LifecycleEffect cascade provenance, Recurrence occurrence predecessor and generation uniqueness constraints, Task entity with required owner Area and AreaStatus relationships, Distinct recoverable Archive and 30-day Trash lifecycles, Area, AreaStatus, CanonicalStatus, One open recurrence occurrence with no missed-slot backfill (+3 more)

### Community 40 - "Phase 2 Final Readiness Audit"
Cohesion: 0.18
Nodes (11): 178 accepted requirements 73 endpoint rows 120 active stories and 3 bounded spikes, SPIKE-001 done then BL-001 begins production work, Go with zero BLOCKER and zero HIGH findings, Restricted graph health with 118 nodes 117 edges 6 hyperedges and 16 communities, DEC-066 closes the fourth original HIGH readiness finding, Project Master and confirmed generator profile are expected cross-community governance bridges, No orphan requirement unsupported endpoint ownerless entity or backlog-less MVP feature, Phase 2 Final Readiness Audit (+3 more)

### Community 41 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, lib, module, moduleResolution, types, extends, ./base.json, ES2024 (+2 more)

### Community 42 - "login.spec.ts"
Cohesion: 0.22
Nodes (5): LoginCommand, LoginResult, LoginService, Inject, Injectable

### Community 43 - "register-account.service.ts"
Cohesion: 0.25
Nodes (6): RegisterAccountCommand, RegisterAccountService, RegistrationResult, secondsUntilNextUtcHour(), Inject, Injectable

### Community 44 - "AppModule"
Cohesion: 0.39
Nodes (6): generateOpenApi(), sortRecursively(), AppModule, Module, bootstrapApi(), parseApiEnvironment()

### Community 45 - "read-session.service.ts"
Cohesion: 0.25
Nodes (4): ReadSessionService, SessionState, Inject, Injectable

### Community 46 - "registration.schema.ts"
Cohesion: 0.36
Nodes (7): parseRegistrationInput(), passwordSchema, RegistrationInput, registrationSchema, toJsonPointer(), toValidationProblem(), zodIssueCode()

### Community 47 - "page.tsx"
Cohesion: 0.32
Nodes (3): metadata, LoginForm(), mocks

### Community 48 - "package.json"
Cohesion: 0.25
Nodes (7): engines, node, pnpm, name, packageManager, private, version

### Community 49 - "tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, @planner/typescript-config/node.json, src/**/*.ts

### Community 50 - "nest-cli.json"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, tsConfigPath, $schema, sourceRoot

### Community 51 - "parseWorkerEnvironment"
Cohesion: 0.38
Nodes (5): parseWorkerEnvironment(), bootstrapWorker(), Module, WorkerModule, sharedEnvironment

### Community 52 - "Graphify repository-local discovery and impact analysis"
Cohesion: 0.29
Nodes (7): Direct source remains authoritative over graph inference, Graphify repository-local discovery and impact analysis, Explicit full graph rebuild triggers, Graph staleness detection and reporting, ADR-003 Graphify for Architecture Discovery and Impact Analysis, Targeted query first and smallest material incremental extraction policy, Graph extraction secret and absolute-path controls

### Community 53 - "Architecture and Quality Strategy"
Cohesion: 0.33
Nodes (6): ARC-001 Web API and Worker runtime topology, ARC-005 Domain-aligned backend module map, ARC-009 PostgreSQL-backed durable worker without Redis, ARC-030 Architecture knowledge graph workflow, Architecture and Quality Strategy, TypeScript modular monolith with one pnpm workspace

### Community 54 - "User"
Cohesion: 0.33
Nodes (6): AccountDeletionProcess durable idempotent purge coordination, AuthenticationIdentity entity with one email/password identity per active User, User entity, Confirmed account deletion and immediate access revocation, AuthenticationIdentity, User

### Community 55 - "index.ts"
Cohesion: 0.33
Nodes (3): booleanFromEnvironment, FALSE_VALUES, TRUE_VALUES

### Community 56 - "package.json"
Cohesion: 0.33
Nodes (5): files, name, private, version, *.json

### Community 57 - "session.schema.ts"
Cohesion: 0.50
Nodes (4): LoginInput, loginSchema, parseLoginInput(), safeReturnPath()

### Community 60 - "Q: Authentication ile user-owned resources bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Authentication ile user-owned resources bağlantısı, Source Nodes

### Community 61 - "Q: API ile karşılığı olmayan domain operasyonları"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: API ile karşılığı olmayan domain operasyonları, Source Nodes

### Community 62 - "Q: Domain karşılığı olmayan API endpointleri"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Domain karşılığı olmayan API endpointleri, Source Nodes

### Community 63 - "Q: Task mutations ile recurrence bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Task mutations ile recurrence bağlantısı, Source Nodes

### Community 64 - "Q: Trash restore ile Area ve Project bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trash restore ile Area ve Project bağlantısı, Source Nodes

### Community 65 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 66 - "check-generated.mjs"
Cohesion: 0.50
Nodes (4): collectFiles(), digestGeneratedFiles(), generatedExtensions, generatedRoots

### Community 67 - "scan-secrets.mjs"
Cohesion: 0.40
Nodes (4): excluded, findings, patterns, trackedFiles

### Community 68 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 69 - "next.config.ts"
Cohesion: 0.50
Nodes (3): environment, nextConfig, webEnvironmentSchema

### Community 70 - "email-verification-schema.ts"
Cohesion: 0.50
Nodes (3): EmailVerificationFormValues, emailVerificationSchema, verificationEmailRequestSchema

### Community 71 - "registration-schema.ts"
Cohesion: 0.50
Nodes (3): passwordSchema, registrationFormSchema, RegistrationFormValues

### Community 73 - "ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline"
Cohesion: 0.50
Nodes (4): ARC-010 Opaque HttpOnly cookie session strategy, ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline, ARC-025 OpenAPI generated-client and architecture drift gates, Confirmed @hey-api/openapi-ts 0.99.0 TypeScript 5.9.3 Fetch profile

### Community 74 - "Weekly npm GitHub Actions and Docker dependency updates"
Cohesion: 0.67
Nodes (3): Dependabot Configuration, Dependabot updates target develop, Weekly npm GitHub Actions and Docker dependency updates

### Community 78 - "Domain-Aligned Modular Monolith"
Cohesion: 0.67
Nodes (3): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing

### Community 79 - "Notification"
Cohesion: 0.67
Nodes (3): Default-enabled in-app reminder Notification preference and suppression semantics, Notification, TaskReminder

## Knowledge Gaps
- **473 isolated node(s):** `printWidth`, `semi`, `singleQuote`, `trailingComma`, `$schema` (+468 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `Domain Operation to API Coverage` (2× useful, score=1.850829142) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccountsRepository` connect `AccountsRepository` to `accounts-worker.module.ts`, `AuthController`, `login.spec.ts`, `register-account.service.ts`, `auth-security.service.ts`, `read-session.service.ts`, `accounts.repository.ts`, `AuthSecurityService`, `verify-email.service.ts`, `email-verification-job.handler.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `AuthSecurityService` connect `AuthSecurityService` to `accounts-worker.module.ts`, `login.spec.ts`, `register-account.service.ts`, `auth-security.service.ts`, `AccountsRepository`, `read-session.service.ts`, `verify-email.service.ts`, `email-verification-job.handler.ts`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `AuthController` connect `AuthController` to `auth-security.service.ts`, `auth.controller.ts`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `singleQuote` to the rest of the system?**
  _473 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058673469387755105 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `accounts-worker.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07293868921775898 - nodes in this community are weakly interconnected._