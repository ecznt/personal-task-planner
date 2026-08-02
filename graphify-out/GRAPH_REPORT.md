# Graph Report - /Users/enescanzenit/Documents/personal-task-planner  (2026-07-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1353 nodes · 1820 edges · 125 communities (91 shown, 34 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2d0cbf84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth.controller.ts
- environment.ts
- app.module.ts
- password-reset.spec.ts
- dependencies
- .initiateDeletion
- cn
- devDependencies
- EPIC-001 Repository Foundation and Quality Gates
- devDependencies
- .createSession
- Confirmed non-production OpenAPI generator profile
- accounts.repository.ts
- package.json
- package.json
- AccountsRepository
- Personal Task Planner Conceptual REST API Authentication and Security Contract
- scripts
- package.json
- components.json
- password-reset-schema.ts
- auth-api.ts
- compilerOptions
- verify-email.service.ts
- email-verification-job.handler.ts
- devDependencies
- compilerOptions
- auth-security.service.ts
- compilerOptions
- scripts
- AuthSecurityService
- compilerOptions
- account-deletion-form.tsx
- email-verification.schema.ts
- dependencies
- password-reset.schema.ts
- tsconfig.build.json
- tsconfig.json
- anonymous-csrf.guard.ts
- node.mjs
- .execute
- page.tsx
- Task
- Phase 2 Final Readiness Audit
- compilerOptions
- register-account.service.ts
- reset-password.service.ts
- page.tsx
- package.json
- tsconfig.json
- ApiProperty
- nest-cli.json
- request-password-reset.service.ts
- Graphify repository-local discovery and impact analysis
- ReadSessionService
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
- generate-openapi.ts
- prepare-standalone.mjs
- page.tsx
- login-schema.ts
- Domain-Aligned Modular Monolith
- Notification
- @prisma/client
- class-validator
- dotenv
- helmet
- @nestjs/common
- @nestjs/core
- nestjs-pino
- @nestjs/platform-express
- nodemailer
- @prisma/adapter-pg
- reflect-metadata
- rxjs
- zod
- next-env.d.ts
- Personal Task Planner Domain Model and Business Rules
- eslint
- @planner/eslint-config
- verify-forbidden-import.mjs
- verify-workspace.mjs
- Module
- ARGON2ID_OPTIONS
- Inject
- Injectable
- LOG_REDACTION_PATHS
- 178 active accepted MVP requirement IDs
- Headers
- forbiddenValue

## God Nodes (most connected - your core abstractions)
1. `AccountsRepository` - 58 edges
2. `cn()` - 37 edges
3. `AuthSecurityService` - 37 edges
4. `scripts` - 23 edges
5. `compilerOptions` - 18 edges
6. `AuthController` - 16 edges
7. `scripts` - 15 edges
8. `ReauthenticateService` - 12 edges
9. `EPIC-001 Repository Foundation and Quality Gates` - 11 edges
10. `compilerOptions` - 9 edges

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

## Communities (125 total, 34 thin omitted)

### Community 0 - "auth.controller.ts"
Cohesion: 0.08
Nodes (46): ReauthenticateService, ReauthenticationCommand, ReauthenticationResult, Inject, Injectable, AuthController, ApiBody, ApiHeader (+38 more)

### Community 1 - "environment.ts"
Cohesion: 0.05
Nodes (42): AppModule, Module, bootstrapApi(), parseRegistrationInput(), passwordSchema, RegistrationInput, registrationSchema, toJsonPointer() (+34 more)

### Community 2 - "app.module.ts"
Cohesion: 0.06
Nodes (30): ApiExcludeController, ApiOkResponse, AccountsModule, DatabaseModule, Module, PrismaService, Injectable, HealthController (+22 more)

### Community 3 - "password-reset.spec.ts"
Cohesion: 0.07
Nodes (21): AccountsWorkerModule, Module, PasswordResetEmailDelivery, PasswordResetEmailMessage, RESET_PASSWORD_EMAIL_DELIVERY, PasswordResetJobHandler, Inject, Injectable (+13 more)

### Community 4 - "dependencies"
Cohesion: 0.04
Nodes (43): dependencies, class-variance-authority, clsx, @hookform/resolvers, input-otp, lucide-react, next, @planner/api-client (+35 more)

### Community 5 - ".initiateDeletion"
Cohesion: 0.07
Nodes (36): InitiateAccountDeletionCommand, InitiateAccountDeletionResult, InitiateAccountDeletionService, Inject, Injectable, InitiateAccountDeletionPersistenceResult, AccountDeletionInput, accountDeletionSchema (+28 more)

### Community 6 - "cn"
Cohesion: 0.10
Nodes (32): metadata, Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants, Button(), buttonVariants (+24 more)

### Community 7 - "devDependencies"
Cohesion: 0.05
Nodes (43): devDependencies, eslint, jest, @jest/globals, @nestjs/cli, @nestjs/testing, pino-pretty, @planner/eslint-config (+35 more)

### Community 8 - "EPIC-001 Repository Foundation and Quality Gates"
Cohesion: 0.06
Nodes (35): GitHub Actions CI Workflow, Pinned Node.js 24.18.0 and pnpm 11.9.0 CI toolchain, PostgreSQL 18.3 Alpine CI test service, CI Quality Job, Gitleaks and security verification gates, Unit component API database contract E2E and security test portfolio, Workspace architecture Prisma OpenAPI and contract gates, Loopback-bound configurable PostgreSQL port (+27 more)

### Community 9 - "devDependencies"
Cohesion: 0.06
Nodes (35): devDependencies, eslint, jsdom, @planner/eslint-config, @planner/typescript-config, postcss, tailwindcss, @tailwindcss/postcss (+27 more)

### Community 10 - ".createSession"
Cohesion: 0.11
Nodes (20): ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags, LogoutService, Inject, Injectable (+12 more)

### Community 11 - "Confirmed non-production OpenAPI generator profile"
Cohesion: 0.07
Nodes (30): NestJS controllers and DTO schemas own the implemented HTTP contract, Same-origin browser credentials without HttpOnly cookie auth callback, Committed deterministic OpenAPI 3.1 artifact, OpenAPI lint compatibility Supertest ownership and generated-client verification, Pinned generated Fetch client without parallel transport types, ADR-002 REST API with Backend-Owned OpenAPI and Generated Client, Stable operation IDs as generated method names, BL-003 Deterministic OpenAPI and generated Fetch transport (+22 more)

### Community 12 - "accounts.repository.ts"
Cohesion: 0.08
Nodes (23): CurrentUserState, AccountDeletionIdempotencyReplayResult, AccountDeletionProcessState, AnonymousAuthTransactionInput, AuthCounterInput, AuthenticatedSession, CreateLoginSessionInput, CurrentUserProfile (+15 more)

### Community 13 - "package.json"
Cohesion: 0.07
Nodes (26): eslint-plugin-jsx-a11y, eslint-plugin-react-hooks, globals, @next/eslint-plugin-next, dependencies, @eslint/js, eslint-plugin-jsx-a11y, eslint-plugin-react-hooks (+18 more)

### Community 14 - "package.json"
Cohesion: 0.07
Nodes (26): @hey-api/openapi-ts, devDependencies, eslint, @hey-api/openapi-ts, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+18 more)

### Community 15 - "AccountsRepository"
Cohesion: 0.10
Nodes (7): CsrfService, Inject, Injectable, AccountsRepository, isUniqueConstraintError(), Inject, Injectable

### Community 16 - "Personal Task Planner Conceptual REST API Authentication and Security Contract"
Cohesion: 0.09
Nodes (23): Personal Task Planner Conceptual REST API Authentication and Security Contract, ETag If-Match and Idempotency-Key mutation contract, No provider authorization callback linking or unlinking endpoints in MVP, 73 active conceptual endpoint rows, Non-disclosing 404 RESOURCE_NOT_FOUND private-resource policy, Opaque server-side cookie session with CSRF and origin protection, Backend-owned OpenAPI contract and generated frontend client, Personal Task Planner Conceptual Data Model (+15 more)

### Community 17 - "scripts"
Cohesion: 0.09
Nodes (23): scripts, api-client:generate, build, dev, format, format:check, lint, openapi:check (+15 more)

### Community 18 - "package.json"
Cohesion: 0.09
Nodes (22): dependencies, zod, devDependencies, eslint, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+14 more)

### Community 19 - "components.json"
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

### Community 23 - "verify-email.service.ts"
Cohesion: 0.13
Nodes (12): secondsUntilWindowEnd(), RequestEmailVerificationCommand, RequestEmailVerificationResult, RequestEmailVerificationService, Inject, Injectable, Inject, Injectable (+4 more)

### Community 24 - "email-verification-job.handler.ts"
Cohesion: 0.19
Nodes (8): EmailVerificationJobHandler, Inject, Injectable, VERIFICATION_EMAIL_DELIVERY, VerificationEmailDelivery, VerificationEmailMessage, SmtpVerificationEmailAdapter, Injectable

### Community 25 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dependency-cruiser, @eslint/js, @playwright/test, prettier, tsx, @types/node, typescript (+9 more)

### Community 26 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, exactOptionalPropertyTypes, lib, module, moduleResolution, outDir, rootDir, types (+8 more)

### Community 27 - "auth-security.service.ts"
Cohesion: 0.15
Nodes (9): LoginCommand, LoginResult, LoginService, Inject, Injectable, SessionState, argon2idOptions, expandIpv6() (+1 more)

### Community 28 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, incremental, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 29 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:worker, lint, openapi:generate, prisma:generate, prisma:migrate:deploy (+7 more)

### Community 31 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, experimentalDecorators, outDir, rootDir, sourceMap, strictPropertyInitialization, extends (+6 more)

### Community 32 - "account-deletion-form.tsx"
Cohesion: 0.19
Nodes (8): metadata, AccountDeletionForm(), createIdempotencyKey(), CurrentUserForDeletion, readCurrentUserForDeletion(), mocks, AccountDeletionFormValues, accountDeletionSchema

### Community 33 - "email-verification.schema.ts"
Cohesion: 0.21
Nodes (13): emailSchema, EmailVerificationRequestInput, emailVerificationRequestSchema, idempotencyKeySchema, issueCode(), jsonPointer(), parseBody(), parseEmailVerificationRequest() (+5 more)

### Community 34 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, class-transformer, @nestjs/swagger, @node-rs/argon2, pg, pino, @planner/config, class-transformer (+5 more)

### Community 35 - "password-reset.schema.ts"
Cohesion: 0.22
Nodes (12): emailSchema, issueCode(), jsonPointer(), parseBody(), parsePasswordResetRequest(), parseResetPassword(), PasswordResetRequestInput, passwordResetRequestSchema (+4 more)

### Community 36 - "tsconfig.build.json"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, declarationMap, rootDir, exclude, extends, include, src/**/*.ts (+4 more)

### Community 37 - "tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, paths, exclude, extends, include, next-env.d.ts, .next/types/**/*.ts (+4 more)

### Community 38 - "anonymous-csrf.guard.ts"
Cohesion: 0.26
Nodes (7): AnonymousCsrfGuard, safeOrigin(), Inject, Injectable, anonymousCsrfCookieName(), parseCookieValue(), safelyDecodeCookieValue()

### Community 39 - "node.mjs"
Cohesion: 0.31
Nodes (3): baseConfig, nextConfig, nodeConfig

### Community 40 - ".execute"
Cohesion: 0.22
Nodes (5): ReadCurrentUserService, Inject, Injectable, isAccountDeletionFailure(), isAccountDeletionResponse()

### Community 41 - "page.tsx"
Cohesion: 0.24
Nodes (4): metadata, SessionBoundary(), SignOutButton(), mocks

### Community 42 - "Task"
Cohesion: 0.20
Nodes (11): LifecycleOperation and LifecycleEffect cascade provenance, Recurrence occurrence predecessor and generation uniqueness constraints, Task entity with required owner Area and AreaStatus relationships, Distinct recoverable Archive and 30-day Trash lifecycles, Area, AreaStatus, CanonicalStatus, One open recurrence occurrence with no missed-slot backfill (+3 more)

### Community 43 - "Phase 2 Final Readiness Audit"
Cohesion: 0.18
Nodes (11): 178 accepted requirements 73 endpoint rows 120 active stories and 3 bounded spikes, SPIKE-001 done then BL-001 begins production work, Go with zero BLOCKER and zero HIGH findings, Restricted graph health with 118 nodes 117 edges 6 hyperedges and 16 communities, DEC-066 closes the fourth original HIGH readiness finding, Project Master and confirmed generator profile are expected cross-community governance bridges, No orphan requirement unsupported endpoint ownerless entity or backlog-less MVP feature, Phase 2 Final Readiness Audit (+3 more)

### Community 44 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, lib, module, moduleResolution, types, extends, ./base.json, ES2024 (+2 more)

### Community 45 - "register-account.service.ts"
Cohesion: 0.25
Nodes (6): RegisterAccountCommand, RegisterAccountService, RegistrationResult, secondsUntilNextUtcHour(), Inject, Injectable

### Community 46 - "reset-password.service.ts"
Cohesion: 0.25
Nodes (6): ResetPasswordCommand, ResetPasswordResult, ResetPasswordService, Inject, Injectable, ResetPasswordPersistenceResult

### Community 47 - "page.tsx"
Cohesion: 0.32
Nodes (3): metadata, LoginForm(), mocks

### Community 48 - "package.json"
Cohesion: 0.25
Nodes (7): engines, node, pnpm, name, packageManager, private, version

### Community 49 - "tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, @planner/typescript-config/node.json, src/**/*.ts

### Community 50 - "ApiProperty"
Cohesion: 0.48
Nodes (6): ApiProperty, AuthenticatedSessionDataDto, LoginRequestDto, LoginResponseDto, SessionStateDataDto, SessionStateResponseDto

### Community 51 - "nest-cli.json"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, tsConfigPath, $schema, sourceRoot

### Community 52 - "request-password-reset.service.ts"
Cohesion: 0.29
Nodes (5): RequestPasswordResetCommand, RequestPasswordResetResult, RequestPasswordResetService, Inject, Injectable

### Community 53 - "Graphify repository-local discovery and impact analysis"
Cohesion: 0.29
Nodes (7): Direct source remains authoritative over graph inference, Graphify repository-local discovery and impact analysis, Explicit full graph rebuild triggers, Graph staleness detection and reporting, ADR-003 Graphify for Architecture Discovery and Impact Analysis, Targeted query first and smallest material incremental extraction policy, Graph extraction secret and absolute-path controls

### Community 54 - "ReadSessionService"
Cohesion: 0.33
Nodes (3): ReadSessionService, Inject, Injectable

### Community 55 - "Architecture and Quality Strategy"
Cohesion: 0.33
Nodes (6): ARC-001 Web API and Worker runtime topology, ARC-005 Domain-aligned backend module map, ARC-009 PostgreSQL-backed durable worker without Redis, ARC-030 Architecture knowledge graph workflow, Architecture and Quality Strategy, TypeScript modular monolith with one pnpm workspace

### Community 56 - "User"
Cohesion: 0.33
Nodes (6): AccountDeletionProcess durable idempotent purge coordination, AuthenticationIdentity entity with one email/password identity per active User, User entity, Confirmed account deletion and immediate access revocation, AuthenticationIdentity, User

### Community 57 - "index.ts"
Cohesion: 0.33
Nodes (3): booleanFromEnvironment, FALSE_VALUES, TRUE_VALUES

### Community 58 - "package.json"
Cohesion: 0.33
Nodes (5): files, name, private, version, *.json

### Community 59 - "session.schema.ts"
Cohesion: 0.50
Nodes (4): LoginInput, loginSchema, parseLoginInput(), safeReturnPath()

### Community 62 - "Q: Authentication ile user-owned resources bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Authentication ile user-owned resources bağlantısı, Source Nodes

### Community 63 - "Q: API ile karşılığı olmayan domain operasyonları"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: API ile karşılığı olmayan domain operasyonları, Source Nodes

### Community 64 - "Q: Domain karşılığı olmayan API endpointleri"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Domain karşılığı olmayan API endpointleri, Source Nodes

### Community 65 - "Q: Task mutations ile recurrence bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Task mutations ile recurrence bağlantısı, Source Nodes

### Community 66 - "Q: Trash restore ile Area ve Project bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trash restore ile Area ve Project bağlantısı, Source Nodes

### Community 67 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 68 - "check-generated.mjs"
Cohesion: 0.50
Nodes (4): collectFiles(), digestGeneratedFiles(), generatedExtensions, generatedRoots

### Community 69 - "scan-secrets.mjs"
Cohesion: 0.40
Nodes (4): excluded, findings, patterns, trackedFiles

### Community 70 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 71 - "next.config.ts"
Cohesion: 0.50
Nodes (3): environment, nextConfig, webEnvironmentSchema

### Community 72 - "email-verification-schema.ts"
Cohesion: 0.50
Nodes (3): EmailVerificationFormValues, emailVerificationSchema, verificationEmailRequestSchema

### Community 73 - "registration-schema.ts"
Cohesion: 0.50
Nodes (3): passwordSchema, registrationFormSchema, RegistrationFormValues

### Community 75 - "ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline"
Cohesion: 0.50
Nodes (4): ARC-010 Opaque HttpOnly cookie session strategy, ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline, ARC-025 OpenAPI generated-client and architecture drift gates, Confirmed @hey-api/openapi-ts 0.99.0 TypeScript 5.9.3 Fetch profile

### Community 76 - "Weekly npm GitHub Actions and Docker dependency updates"
Cohesion: 0.67
Nodes (3): Dependabot Configuration, Dependabot updates target develop, Weekly npm GitHub Actions and Docker dependency updates

### Community 82 - "Domain-Aligned Modular Monolith"
Cohesion: 0.67
Nodes (3): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing

### Community 83 - "Notification"
Cohesion: 0.67
Nodes (3): Default-enabled in-app reminder Notification preference and suppression semantics, Notification, TaskReminder

## Knowledge Gaps
- **491 isolated node(s):** `printWidth`, `semi`, `singleQuote`, `trailingComma`, `$schema` (+486 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `Domain Operation to API Coverage` (2× useful, score=1.850829142) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccountsRepository` connect `AccountsRepository` to `auth.controller.ts`, `password-reset.spec.ts`, `.initiateDeletion`, `.execute`, `.createSession`, `accounts.repository.ts`, `register-account.service.ts`, `reset-password.service.ts`, `request-password-reset.service.ts`, `ReadSessionService`, `verify-email.service.ts`, `email-verification-job.handler.ts`, `auth-security.service.ts`, `AuthSecurityService`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `UserController` connect `.initiateDeletion` to `auth.controller.ts`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `singleQuote` to the rest of the system?**
  _491 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08413461538461539 - nodes in this community are weakly interconnected._
- **Should `environment.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05185185185185185 - nodes in this community are weakly interconnected._
- **Should `app.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058673469387755105 - nodes in this community are weakly interconnected._
- **Should `password-reset.spec.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0663265306122449 - nodes in this community are weakly interconnected._