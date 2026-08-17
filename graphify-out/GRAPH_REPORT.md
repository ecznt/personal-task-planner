# Graph Report - personal-task-planner  (2026-08-17)

## Corpus Check
- 209 files · ~108,508 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1455 nodes · 2675 edges · 123 communities (97 shown, 26 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5580a48c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth.controller.ts
- app.module.ts
- cn
- dependencies
- .initiateDeletion
- devDependencies
- EPIC-001 Repository Foundation and Quality Gates
- devDependencies
- .createSession
- Confirmed non-production OpenAPI generator profile
- JobQueueService
- accounts.repository.ts
- package.json
- package.json
- password-reset.spec.ts
- AuthSecurityService
- Personal Task Planner Conceptual REST API Authentication and Security Contract
- scripts
- package.json
- components.json
- AccountsRepository
- password-reset-schema.ts
- compilerOptions
- verify-email.service.ts
- environment.ts
- devDependencies
- compilerOptions
- compilerOptions
- scripts
- email-verification-job.handler.ts
- compilerOptions
- account-deletion-form.tsx
- email-verification-form.tsx
- email-verification.schema.ts
- dependencies
- password-reset.schema.ts
- problem-details.filter.ts
- tsconfig.build.json
- tsconfig.json
- anonymous-csrf.guard.ts
- page.test.tsx
- node.mjs
- .execute
- page.tsx
- Task
- Phase 2 Final Readiness Audit
- compilerOptions
- main.ts
- auth-security.service.ts
- register-account.service.ts
- ReadSessionService
- reset-password.service.ts
- registration.schema.ts
- page.tsx
- package.json
- tsconfig.json
- ApiProperty
- nest-cli.json
- request-password-reset.service.ts
- parseWorkerEnvironment
- Graphify repository-local discovery and impact analysis
- Architecture and Quality Strategy
- User
- registration-form.tsx
- package.json
- register-account.service.ts
- layout.tsx
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
- eslint
- ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline
- Weekly npm GitHub Actions and Docker dependency updates
- @jest/globals
- @nestjs/cli
- prepare-standalone.mjs
- pino-pretty
- @planner/eslint-config
- Domain-Aligned Modular Monolith
- Notification
- @planner/typescript-config
- class-validator
- helmet
- @nestjs/common
- dotenv
- nestjs-pino
- @nestjs/platform-express
- nodemailer
- reflect-metadata
- rxjs
- zod
- next-env.d.ts
- Personal Task Planner Domain Model and Business Rules
- eslint
- @planner/eslint-config
- verify-forbidden-import.mjs
- verify-workspace.mjs
- ARGON2ID_OPTIONS
- LOG_REDACTION_PATHS
- 178 active accepted MVP requirement IDs
- forbiddenValue

## God Nodes (most connected - your core abstractions)
1. `AccountsRepository` - 67 edges
2. `AuthSecurityService` - 54 edges
3. `cn()` - 41 edges
4. `PrismaService` - 24 edges
5. `scripts` - 23 edges
6. `apiError()` - 20 edges
7. `fetchCsrf()` - 18 edges
8. `compilerOptions` - 18 edges
9. `CsrfService` - 17 edges
10. `AuthController` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Reviewed generated OpenAPI and API client artifacts` --semantically_similar_to--> `BL-003 Deterministic OpenAPI and generated Fetch transport`  [INFERRED] [semantically similar]
  README.md → docs/planning/BACKLOG.md
- `PostgreSQL 18.3 Alpine local service` --semantically_similar_to--> `BL-002 PostgreSQL web API and worker composition roots`  [INFERRED] [semantically similar]
  compose.yaml → docs/planning/BACKLOG.md
- `Pinned Node.js 24.18.0 and pnpm 11.9.0 CI toolchain` --semantically_similar_to--> `BL-001 Pinned reproducible workspace`  [INFERRED] [semantically similar]
  .github/workflows/ci.yml → docs/planning/BACKLOG.md
- `Workspace architecture Prisma OpenAPI and contract gates` --semantically_similar_to--> `BL-005 Foundation contract architecture and security pipeline`  [INFERRED] [semantically similar]
  .github/workflows/ci.yml → docs/planning/BACKLOG.md
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

## Communities (123 total, 26 thin omitted)

### Community 0 - "auth.controller.ts"
Cohesion: 0.05
Nodes (77): AuthController, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags, Body, Controller (+69 more)

### Community 1 - "app.module.ts"
Cohesion: 0.15
Nodes (4): secondsUntilNextUtcHour(), startOfWindow(), expandIpv6(), stripAddressDecoration()

### Community 2 - "cn"
Cohesion: 0.16
Nodes (14): metadata, AccountDeletionForm(), createIdempotencyKey(), CurrentUserForDeletion, readCurrentUserForDeletion(), mocks, AccountDeletionFormValues, accountDeletionSchema (+6 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (42): dependencies, class-variance-authority, clsx, @hookform/resolvers, input-otp, lucide-react, next, @planner/api-client (+34 more)

### Community 4 - ".initiateDeletion"
Cohesion: 0.08
Nodes (49): AccountDeletionInput, accountDeletionSchema, etagSchema, jsonPointer(), parseAccountDeletionInput(), parseIfMatch(), toValidationProblem(), safeOrigin() (+41 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (43): devDependencies, eslint, jest, @jest/globals, @nestjs/cli, @nestjs/testing, pino-pretty, @planner/eslint-config (+35 more)

### Community 6 - "EPIC-001 Repository Foundation and Quality Gates"
Cohesion: 0.22
Nodes (9): GitHub Actions CI Workflow, Pinned Node.js 24.18.0 and pnpm 11.9.0 CI toolchain, PostgreSQL 18.3 Alpine CI test service, CI Quality Job, Gitleaks and security verification gates, Unit component API database contract E2E and security test portfolio, Workspace architecture Prisma OpenAPI and contract gates, BL-001 Pinned reproducible workspace (+1 more)

### Community 7 - "devDependencies"
Cohesion: 0.05
Nodes (37): devDependencies, eslint, jsdom, @planner/eslint-config, @planner/typescript-config, postcss, tailwindcss, @tailwindcss/postcss (+29 more)

### Community 8 - ".createSession"
Cohesion: 0.08
Nodes (18): InitiateAccountDeletionCommand, InitiateAccountDeletionResult, InitiateAccountDeletionService, Inject, Injectable, CurrentUserState, ReadCurrentUserService, Inject (+10 more)

### Community 9 - "Confirmed non-production OpenAPI generator profile"
Cohesion: 0.20
Nodes (10): NestJS controllers and DTO schemas own the implemented HTTP contract, Same-origin browser credentials without HttpOnly cookie auth callback, Committed deterministic OpenAPI 3.1 artifact, OpenAPI lint compatibility Supertest ownership and generated-client verification, Pinned generated Fetch client without parallel transport types, ADR-002 REST API with Backend-Owned OpenAPI and Generated Client, Stable operation IDs as generated method names, Deterministic 16-file generation with stable combined SHA-256 (+2 more)

### Community 10 - "JobQueueService"
Cohesion: 0.19
Nodes (11): AccountsWorkerModule, Module, parseWorkerEnvironment(), DatabaseModule, Module, JobsModule, Module, bootstrapWorker() (+3 more)

### Community 11 - "accounts.repository.ts"
Cohesion: 0.09
Nodes (21): AccountDeletionIdempotencyReplayResult, AccountDeletionProcessState, AnonymousAuthTransactionInput, AuthCounterInput, AuthenticatedSession, CompleteStartEmptyOnboardingInput, CreateLoginSessionInput, InitiateAccountDeletionInput (+13 more)

### Community 12 - "package.json"
Cohesion: 0.07
Nodes (26): eslint-plugin-jsx-a11y, eslint-plugin-react-hooks, globals, @next/eslint-plugin-next, dependencies, @eslint/js, eslint-plugin-jsx-a11y, eslint-plugin-react-hooks (+18 more)

### Community 13 - "package.json"
Cohesion: 0.07
Nodes (26): @hey-api/openapi-ts, devDependencies, eslint, @hey-api/openapi-ts, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+18 more)

### Community 14 - "password-reset.spec.ts"
Cohesion: 0.15
Nodes (8): JobQueueService, LeasedJob, Inject, Injectable, JobRunnerService, parseChallengeId(), safeErrorCategory(), Injectable

### Community 15 - "AuthSecurityService"
Cohesion: 0.09
Nodes (26): SessionController, ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags, Body, Controller (+18 more)

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

### Community 20 - "AccountsRepository"
Cohesion: 0.08
Nodes (21): CompleteOnboardingCommand, CompleteOnboardingResult, CompleteOnboardingService, Inject, Injectable, Inject, Inject, Inject (+13 more)

### Community 21 - "password-reset-schema.ts"
Cohesion: 0.12
Nodes (16): API plan, Approved implementation decisions, BL-011 Password Recovery Implementation Plan, Data plan, Expected repository changes, Frontend plan, Graphify handoff, Handoff status (+8 more)

### Community 22 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, declaration, declarationMap, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules (+11 more)

### Community 23 - "verify-email.service.ts"
Cohesion: 0.11
Nodes (33): secondsUntilWindowEnd(), CsrfService, Injectable, ReauthenticateService, ReauthenticationCommand, ReauthenticationResult, Injectable, RegisterAccountCommand (+25 more)

### Community 24 - "environment.ts"
Cohesion: 0.11
Nodes (19): ApiEnvironment, apiEnvironmentSchema, databaseUrl, EmailEnvironment, emailEnvironmentSchema, emailEnvironmentShape, logLevel, parseEnvironment() (+11 more)

### Community 25 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dependency-cruiser, @eslint/js, @playwright/test, prettier, tsx, @types/node, typescript (+9 more)

### Community 26 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, exactOptionalPropertyTypes, lib, module, moduleResolution, outDir, rootDir, types (+8 more)

### Community 27 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, incremental, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 28 - "scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:worker, lint, openapi:generate, prisma:generate, prisma:migrate:deploy (+7 more)

### Community 29 - "email-verification-job.handler.ts"
Cohesion: 0.18
Nodes (8): ApiExcludeController, HealthController, Controller, Get, Inject, HealthService, Inject, Injectable

### Community 30 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, experimentalDecorators, outDir, rootDir, sourceMap, strictPropertyInitialization, extends (+6 more)

### Community 31 - "account-deletion-form.tsx"
Cohesion: 0.14
Nodes (8): isResetPasswordFailure(), isResetPasswordResponse(), isUniqueConstraintError(), isVerificationFailure(), isVerificationResponse(), Inject, PrismaService, Injectable

### Community 32 - "email-verification-form.tsx"
Cohesion: 0.10
Nodes (18): EmailVerificationJobHandler, Inject, Injectable, PasswordResetEmailDelivery, PasswordResetEmailMessage, RESET_PASSWORD_EMAIL_DELIVERY, PasswordResetJobHandler, Inject (+10 more)

### Community 33 - "email-verification.schema.ts"
Cohesion: 0.29
Nodes (7): BD-001 Foundation First dependency rule, BL-004 Privacy-safe request and worker diagnostics, BL-006 Recoverable synthetic PostgreSQL job lease, EPIC-001 Repository Foundation and Quality Gates, EPIC-002 Authentication depends on EPIC-001 and remains unstarted, SPIKE-001 OpenAPI generator compatibility evidence, Personal Task Planner Vertical-Slice Backlog

### Community 34 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, class-transformer, @nestjs/swagger, @node-rs/argon2, pg, pino, @planner/config, class-transformer (+5 more)

### Community 35 - "password-reset.schema.ts"
Cohesion: 0.29
Nodes (7): DEC-069 EPIC-001 repository-foundation implementation plan, Personal Task Planner Project Master, apps and packages workspace discovery, Dependency build-script allowlist and denials, pnpm Workspace Configuration, Reviewed transitive dependency security overrides, Engine-strict exact-save and strict-peer dependency policy

### Community 37 - "tsconfig.build.json"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, declarationMap, rootDir, exclude, extends, include, src/**/*.ts (+4 more)

### Community 38 - "tsconfig.json"
Cohesion: 0.15
Nodes (12): compilerOptions, baseUrl, paths, exclude, extends, include, next-env.d.ts, .next/types/**/*.ts (+4 more)

### Community 39 - "anonymous-csrf.guard.ts"
Cohesion: 0.15
Nodes (13): LoginCommand, LoginResult, LoginService, Injectable, LogoutService, Injectable, ReadSessionService, SessionState (+5 more)

### Community 40 - "page.test.tsx"
Cohesion: 0.12
Nodes (20): metadata, metadata, metadata, HomePage(), metadata, metadata, PrivacyPage(), metadata (+12 more)

### Community 41 - "node.mjs"
Cohesion: 0.31
Nodes (3): baseConfig, nextConfig, nodeConfig

### Community 42 - ".execute"
Cohesion: 0.29
Nodes (7): Confirmed non-production OpenAPI generator profile, @hey-api/openapi-ts 0.99.0, js-yaml 4.3.0 security override, No generated auth callback for HttpOnly session cookie, Explicit same-origin Fetch credentials, TypeScript 5.9.3 strict compatibility, TypeScript 6.0.3 strict-check incompatibility

### Community 43 - "page.tsx"
Cohesion: 0.29
Nodes (7): Contributor PostgreSQL install migration and process startup workflow, Foundation excludes product tables authentication and Task behavior, Reviewed generated OpenAPI and API client artifacts, Personal Task Planner Contributor README, Phase 3 modular-monolith foundation without product features, Required workspace formatting lint architecture Prisma test build E2E and security checks, Separate web API and worker development processes

### Community 44 - "Task"
Cohesion: 0.20
Nodes (11): LifecycleOperation and LifecycleEffect cascade provenance, Recurrence occurrence predecessor and generation uniqueness constraints, Task entity with required owner Area and AreaStatus relationships, Distinct recoverable Archive and 30-day Trash lifecycles, Area, AreaStatus, CanonicalStatus, One open recurrence occurrence with no missed-slot backfill (+3 more)

### Community 45 - "Phase 2 Final Readiness Audit"
Cohesion: 0.18
Nodes (11): 178 accepted requirements 73 endpoint rows 120 active stories and 3 bounded spikes, SPIKE-001 done then BL-001 begins production work, Go with zero BLOCKER and zero HIGH findings, Restricted graph health with 118 nodes 117 edges 6 hyperedges and 16 communities, DEC-066 closes the fourth original HIGH readiness finding, Project Master and confirmed generator profile are expected cross-community governance bridges, No orphan requirement unsupported endpoint ownerless entity or backlog-less MVP feature, Phase 2 Final Readiness Audit (+3 more)

### Community 46 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, lib, module, moduleResolution, types, extends, ./base.json, ES2024 (+2 more)

### Community 47 - "main.ts"
Cohesion: 0.17
Nodes (11): metadata, Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants, Spinner(), SessionBoundary() (+3 more)

### Community 48 - "auth-security.service.ts"
Cohesion: 0.21
Nodes (9): AccountsModule, Module, HealthModule, Module, createLoggerParameters(), createPinoOptions(), redactPaths, Module (+1 more)

### Community 49 - "register-account.service.ts"
Cohesion: 0.33
Nodes (6): Loopback-bound configurable PostgreSQL port, Persistent local PostgreSQL volume, PostgreSQL 18.3 Alpine local service, PostgreSQL Docker Compose Configuration, PostgreSQL readiness healthcheck, BL-002 PostgreSQL web API and worker composition roots

### Community 50 - "ReadSessionService"
Cohesion: 0.17
Nodes (12): metadata, CurrentUserForOnboarding, detectedBrowserTimeZone(), fallbackTimeZones, isSupportedTimeZone(), OnboardingPreferenceForm(), readCurrentUserForOnboarding(), submitLabel() (+4 more)

### Community 51 - "reset-password.service.ts"
Cohesion: 0.33
Nodes (6): BL-003 Deterministic OpenAPI and generated Fetch transport, Approved pinned generator profile for BL-003, Native Response.headers available without named header-map types, Reviewed foundation OpenAPI lint exceptions, Redocly recommended-strict ruleset, Redocly OpenAPI Lint Configuration

### Community 52 - "registration.schema.ts"
Cohesion: 0.33
Nodes (6): EPIC-001 local Definition of Done, SPIKE-001 and BL-001 through BL-006 locally verified complete, EPIC-001 Repository Foundation and Quality Gates complete, EPIC-002 requires explicit User instruction after EPIC-001 review, Composition roots infrastructure Prisma job migration OpenAPI client tests and quality gates, No authentication Task domain behavior product persistence model or later feature started

### Community 53 - "page.tsx"
Cohesion: 0.15
Nodes (18): CardAction(), CardFooter(), Checkbox(), Field(), FieldContent(), FieldError(), FieldLegend(), FieldSeparator() (+10 more)

### Community 54 - "package.json"
Cohesion: 0.25
Nodes (7): engines, node, pnpm, name, packageManager, private, version

### Community 55 - "tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, @planner/typescript-config/node.json, src/**/*.ts

### Community 56 - "ApiProperty"
Cohesion: 0.21
Nodes (11): Button(), buttonVariants, FieldLabel(), mocks, passwordResetRequestFormSchema, PasswordResetRequestFormValues, passwordSchema, resetPasswordFormSchema (+3 more)

### Community 57 - "nest-cli.json"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, tsConfigPath, $schema, sourceRoot

### Community 58 - "request-password-reset.service.ts"
Cohesion: 0.21
Nodes (7): FieldGroup(), AuthApiError, CsrfData, csrfQueryKey, mocks, loginFormSchema, LoginFormValues

### Community 59 - "parseWorkerEnvironment"
Cohesion: 0.36
Nodes (4): mocks, EmailVerificationFormValues, emailVerificationSchema, verificationEmailRequestSchema

### Community 60 - "Graphify repository-local discovery and impact analysis"
Cohesion: 0.29
Nodes (7): Direct source remains authoritative over graph inference, Graphify repository-local discovery and impact analysis, Explicit full graph rebuild triggers, Graph staleness detection and reporting, ADR-003 Graphify for Architecture Discovery and Impact Analysis, Targeted query first and smallest material incremental extraction policy, Graph extraction secret and absolute-path controls

### Community 61 - "Architecture and Quality Strategy"
Cohesion: 0.33
Nodes (6): ARC-001 Web API and Worker runtime topology, ARC-005 Domain-aligned backend module map, ARC-009 PostgreSQL-backed durable worker without Redis, ARC-030 Architecture knowledge graph workflow, Architecture and Quality Strategy, TypeScript modular monolith with one pnpm workspace

### Community 62 - "User"
Cohesion: 0.33
Nodes (6): AccountDeletionProcess durable idempotent purge coordination, AuthenticationIdentity entity with one email/password identity per active User, User entity, Confirmed account deletion and immediate access revocation, AuthenticationIdentity, User

### Community 63 - "registration-form.tsx"
Cohesion: 0.28
Nodes (5): FieldDescription(), mocks, passwordSchema, registrationFormSchema, RegistrationFormValues

### Community 64 - "package.json"
Cohesion: 0.33
Nodes (5): files, name, private, version, *.json

### Community 65 - "register-account.service.ts"
Cohesion: 0.22
Nodes (8): ApiOkResponse, ApiOperation, ApiTags, Controller, Get, VersionController, ApiProperty, VersionResponseDto

### Community 67 - "Q: Authentication ile user-owned resources bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Authentication ile user-owned resources bağlantısı, Source Nodes

### Community 68 - "Q: API ile karşılığı olmayan domain operasyonları"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: API ile karşılığı olmayan domain operasyonları, Source Nodes

### Community 69 - "Q: Domain karşılığı olmayan API endpointleri"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Domain karşılığı olmayan API endpointleri, Source Nodes

### Community 70 - "Q: Task mutations ile recurrence bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Task mutations ile recurrence bağlantısı, Source Nodes

### Community 71 - "Q: Trash restore ile Area ve Project bağlantısı"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Trash restore ile Area ve Project bağlantısı, Source Nodes

### Community 72 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 73 - "check-generated.mjs"
Cohesion: 0.50
Nodes (4): collectFiles(), digestGeneratedFiles(), generatedExtensions, generatedRoots

### Community 74 - "scan-secrets.mjs"
Cohesion: 0.40
Nodes (4): excluded, findings, patterns, trackedFiles

### Community 75 - "package.json"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 76 - "next.config.ts"
Cohesion: 0.50
Nodes (3): environment, nextConfig, webEnvironmentSchema

### Community 77 - "eslint"
Cohesion: 0.29
Nodes (7): generateOpenApi(), sortRecursively(), AppModule, Module, bootstrapApi(), parseApiEnvironment(), sharedEnvironment

### Community 80 - "ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline"
Cohesion: 0.50
Nodes (4): ARC-010 Opaque HttpOnly cookie session strategy, ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline, ARC-025 OpenAPI generated-client and architecture drift gates, Confirmed @hey-api/openapi-ts 0.99.0 TypeScript 5.9.3 Fetch profile

### Community 81 - "Weekly npm GitHub Actions and Docker dependency updates"
Cohesion: 0.67
Nodes (3): Dependabot Configuration, Dependabot updates target develop, Weekly npm GitHub Actions and Docker dependency updates

### Community 82 - "@jest/globals"
Cohesion: 0.47
Nodes (4): isOnboardingCompletionFailure(), isOnboardingCompletionResponse(), onboardingCompletionFromResponse(), onboardingCompletionResponse()

### Community 83 - "@nestjs/cli"
Cohesion: 0.40
Nodes (3): ThrowingController, Controller, Get

### Community 87 - "Domain-Aligned Modular Monolith"
Cohesion: 0.67
Nodes (3): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing

### Community 88 - "Notification"
Cohesion: 0.67
Nodes (3): Default-enabled in-app reminder Notification preference and suppression semantics, Notification, TaskReminder

## Knowledge Gaps
- **522 isolated node(s):** `printWidth`, `semi`, `singleQuote`, `trailingComma`, `$schema` (+517 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `Domain Operation to API Coverage` (2× useful, score=1.850829142) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthSecurityService` connect `AccountsRepository` to `email-verification-form.tsx`, `app.module.ts`, `problem-details.filter.ts`, `anonymous-csrf.guard.ts`, `.createSession`, `jest`, `verify-email.service.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `AccountsRepository` connect `AccountsRepository` to `email-verification-form.tsx`, `app.module.ts`, `problem-details.filter.ts`, `anonymous-csrf.guard.ts`, `.createSession`, `accounts.repository.ts`, `jest`, `AuthSecurityService`, `@jest/globals`, `verify-email.service.ts`, `account-deletion-form.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `singleQuote` to the rest of the system?**
  _522 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.controller.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05124685426675818 - nodes in this community are weakly interconnected._
- **Should `app.module.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14624505928853754 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `.initiateDeletion` be split into smaller, more focused modules?**
  _Cohesion score 0.07570621468926554 - nodes in this community are weakly interconnected._