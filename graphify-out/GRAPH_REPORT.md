# Graph Report - .  (2026-09-06)

## Corpus Check
- 201 files · ~192,335 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2775 nodes · 5479 edges · 195 communities (159 shown, 36 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 75 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Request Response DTOs
- CI Pipeline & Readiness
- Navigation Icon Assets
- Shared DI Bootstrap
- Area Transport DTOs
- NestJS Injectable Services
- Area Detail Flow
- App Bootstrap Entry
- Module Wiring & Send
- Auth Login Rate Limit
- Injectable Service Layer
- List Trash Restore Ops
- UI Card Metadata Pages
- UI Form Primitives
- Component Test Mocks
- Zod Pg Database Primitives
- Reopen Lifecycle Ops
- Dev Tooling Run Scripts
- CRUD Controller Handlers
- Task Edit Operations
- Auth REST Handlers
- Update REST Handlers
- Put REST Handlers
- Retrieve REST Handlers
- Trash Restore Services
- Injectable Service Core
- Label Query Services
- Validation Class Helpers
- ESLint Config Rules
- Project Config Meta
- Body REST Handlers
- Queue Job Execution
- Task Result Controllers
- Session REST Handlers
- Query REST Handlers
- Checklist DTO Schemas
- Label DTO Controllers
- Delete Operations
- Injectable Lifecycle Services
- Create REST Handlers
- Env Config Schema
- Vitest ESLint Tooling
- Workspace Scripts
- Zod Schema Modules
- Get REST Handlers
- Area Schema Validation
- UI Framework Primitives
- Page Metadata Mocks
- User Profile Services
- Task Reminder Services
- Session Body Handlers
- JSON Body Handlers
- Task Edit Schema
- Leased Job Executor
- Task Page Render
- Update Body Handlers
- Button Page Layout
- TSConfig Targets
- Report Handler Mocks
- Dependency Security Decisions
- Post REST Handlers
- Lifecycle Action Types
- Task Detail Page
- Notification Services
- Today Task Page
- TSConfig Paths
- Runner Tooling Config
- DOM Type Libraries
- Module Controllers
- Etag Profile Services
- Notification Read Ops
- Project Detail DTOs
- Task List Page
- JSX Type Libraries
- Package Build Scripts
- Query REST Handlers
- Compiler OutConfig
- React Input OTP
- Task Card Summary Page
- Controller Registry
- Bulk Action Items
- Checklist Add Reorder
- Task Query Commands
- Task Response DTOs
- Project Query Models
- Worker Module Wiring
- Label Schema Validation
- Project Schema Validation
- Test Config Include
- Metadata Pages
- Area List Page
- User Profile DTOs
- Search Schema Validation
- Global Provider Modules
- App Scripts Meta
- New Task Page
- Auth Form Tests
- Task Card Components
- Idempotent CSRF Commands
- ESLint Config Presets
- User Schema Validation
- Label Query Models
- Job Queue Enqueue
- Search Result Services
- Planning Domain Entities
- Phase 2 Readiness Audit
- Node Type Libraries
- Task List Services
- Post Body Handlers
- Area Status Data
- Project Manager Form
- Recurrence Business Rules
- Bulk Actions Schema
- Area Rename Schema
- Checklist Components
- Product Requirements
- Package Manager Meta
- TSConfig Project Ref
- Cli Source Config
- Recurrence Set Schema
- Label Manager Components
- Recurrence Rule DTOs
- Reminder Manager UI
- Architecture Strategy
- Account Deletion Domain
- Package JSON Meta
- Small Controller Cluster
- Bulk Transport Cluster
- Constructor Controllers
- Logger Redaction
- Test Repo Mocks
- Root Layout Providers
- Prettier Formatting
- Generated Root Checks
- Secret Scan Patterns
- Package Private Meta
- Error Controller Health
- Next Config Web Env
- Registration Form Schema
- Security Architecture ADRs
- Dependabot Updates
- Standalone Prepare
- Account Settings Page
- Runtimes & ADR Decisions
- Reminder Notification Semantics
- Redocly OpenAPI Lint
- Nest Common Deps
- Nest Pino Deps
- RxJS Deps
- Nest Testing Deps
- ESLint Config Package
- Typescript Config Package
- Prisma Deps
- Node Types Deps
- Nodemailer Types Deps
- Next Env Note
- React Hook Form Deps
- Tailwind Merge Deps
- Tw Animate CSS Deps
- Jsdom Deps
- Planner ESLint Deps
- Planner TSConfig Deps
- Tailwind CSS Deps
- TypeScript Deps
- Vite React Plugin
- Translation Messages
- Conceptual Data Model
- Domain Model Rules
- ESLint Tool Deps
- Planner ESLint Tooling
- Forbidden Import Check
- Workspace Verify Check
- Argon2 Options
- UseGuards Decorator
- Log Redaction Paths
- Requirement IDs
- Patch Resource
- Forbidden Value

## God Nodes (most connected - your core abstractions)
1. `AccountsRepository` - 102 edges
2. `AuthSecurityService` - 46 edges
3. `TaskRepository` - 41 edges
4. `LifecycleRepository` - 40 edges
5. `cn()` - 35 edges
6. `AreaController` - 34 edges
7. `TaskService` - 28 edges
8. `Button()` - 26 edges
9. `scripts` - 23 edges
10. `ReminderRepository` - 23 edges

## Surprising Connections (you probably didn't know these)
- `CI Pipeline` --conceptually_related_to--> `Branch Strategy (opencode/* -> opencode/develop)`  [INFERRED]
  .github/workflows/ci.yml → AGENTS.md
- `Repository README / Start Here` --implements--> `CI Pipeline`  [INFERRED]
  README.md → .github/workflows/ci.yml
- `CI Quality Job (Postgres + Mailpit)` --shares_data_with--> `Local Infrastructure (Docker Compose postgres, mailpit)`  [INFERRED]
  .github/workflows/ci.yml → compose.yaml
- `L-023 Release Readiness Plan` --references--> `CI Quality Job (Postgres + Mailpit)`  [EXTRACTED]
  docs/planning/L-023_RELEASE_READINESS_PLAN.md → .github/workflows/ci.yml
- `Repository README / Start Here` --references--> `Local Infrastructure (Docker Compose postgres, mailpit)`  [EXTRACTED]
  README.md → compose.yaml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Authentication, CSRF, Ownership and Non-Disclosure Security Model** — docs_api_api_contract_opaque_server_side_session, docs_api_api_contract_csrf_origin_protection, docs_api_api_contract_ownership_isolation, docs_api_api_contract_non_disclosing_404 [EXTRACTED 1.00]
- **Vertical Implementation Slice Delivery Chain** — docs_planning_backlog_lean_backlog, docs_planning_bl_011_password_recovery_plan, docs_planning_l_005_area_management_plan, docs_planning_l_006_task_creation_plan, docs_planning_l_022_hardening_plan, docs_planning_l_023_release_readiness_plan [EXTRACTED 1.00]
- **Quality Gate Pipeline across CI, README and Hardening Slices** — _github_workflows_ci_ci_pipeline, _github_workflows_ci_quality_job, readme_repo_overview, docs_planning_l_022_hardening_plan, docs_planning_l_023_release_readiness_plan [INFERRED 0.85]
- **Requirements endpoint rows stories and spikes form the active MVP coverage baseline** — docs_planning_readiness_report_active_mvp_baseline_counts, docs_planning_readiness_report_requirement_traceability, docs_planning_readiness_report_no_coverage_gaps [EXTRACTED 1.00]
- **Pinned OpenAPI generator compatibility profile** — docs_spikes_spike_001_openapi_generator_hey_api_0_99_0, docs_spikes_spike_001_openapi_generator_typescript_5_9_3, docs_spikes_spike_001_openapi_generator_same_origin_fetch_credentials, docs_spikes_spike_001_openapi_generator_js_yaml_security_override [EXTRACTED 1.00]
- **Architecture decision spike evidence and backlog story participate in the OpenAPI delivery chain** — docs_architecture_architecture_arc_013_openapi_ownership, docs_architecture_adr_adr_002_rest_openapi_rest_openapi_adr, docs_spikes_spike_001_openapi_generator_openapi_generator_compatibility_spike [EXTRACTED 1.00]
- **Required Area optional Project and Task form the preserved personal-planning core** — docs_domain_domain_model_area, docs_domain_domain_model_project, docs_domain_domain_model_task [EXTRACTED 1.00]

## Communities (195 total, 36 thin omitted)

### Community 0 - "Request Response DTOs"
Cohesion: 0.07
Nodes (57): ApiBody, ApiHeader, ApiOperation, ApiResponse, Body, Get, Header, Headers (+49 more)

### Community 1 - "CI Pipeline & Readiness"
Cohesion: 0.06
Nodes (63): CI Pipeline, CI Quality Job (Postgres + Mailpit), Branch Strategy (opencode/* -> opencode/develop), Local Infrastructure (Docker Compose postgres, mailpit), Authentication Endpoint Cluster, API Contract Goals and Boundaries, CSRF and Origin Protection, Opaque Cursor Pagination (+55 more)

### Community 2 - "Navigation Icon Assets"
Cohesion: 0.06
Nodes (33): metadata, Sheet(), SheetClose(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetTitle() (+25 more)

### Community 3 - "Shared DI Bootstrap"
Cohesion: 0.11
Nodes (34): CsrfService, Injectable, ReauthenticateService, ReauthenticationCommand, ReauthenticationResult, Injectable, RegisterAccountCommand, RegisterAccountService (+26 more)

### Community 4 - "Area Transport DTOs"
Cohesion: 0.08
Nodes (35): ActivateAreaStatusResult, CreateAreaResult, CreateAreaStatusResult, GetAreaResult, ListAreasResult, RenameAreaResult, ReorderAreaStatusesResult, RetireAreaStatusResult (+27 more)

### Community 5 - "NestJS Injectable Services"
Cohesion: 0.07
Nodes (32): LoginCommand, LoginResult, LoginService, Inject, Injectable, LogoutService, Inject, Injectable (+24 more)

### Community 6 - "Area Detail Flow"
Cohesion: 0.07
Nodes (20): ActivateAreaStatusCommand, AreaService, CreateAreaCommand, CreateAreaStatusCommand, GetAreaQuery, ListAreasQuery, RenameAreaCommand, ReorderAreaStatusesCommand (+12 more)

### Community 7 - "App Bootstrap Entry"
Cohesion: 0.07
Nodes (32): generateOpenApi(), sortRecursively(), AppModule, Module, bootstrapApi(), AccountDeletionInput, accountDeletionSchema, etagSchema (+24 more)

### Community 8 - "Module Wiring & Send"
Cohesion: 0.09
Nodes (21): AccountsWorkerModule, Module, EmailVerificationJobHandler, Inject, Injectable, PasswordResetEmailDelivery, PasswordResetEmailMessage, RESET_PASSWORD_EMAIL_DELIVERY (+13 more)

### Community 9 - "Auth Login Rate Limit"
Cohesion: 0.06
Nodes (36): InitiateAccountDeletionCommand, InitiateAccountDeletionResult, AccountDeletionIdempotencyReplayResult, AccountDeletionProcessState, AnonymousAuthTransactionInput, AuthCounterInput, AuthenticatedSession, CompleteOnboardingInput (+28 more)

### Community 10 - "Injectable Service Layer"
Cohesion: 0.06
Nodes (16): Inject, InitiateAccountDeletionService, Inject, Injectable, Inject, Inject, Inject, Inject (+8 more)

### Community 11 - "List Trash Restore Ops"
Cohesion: 0.10
Nodes (16): LifecycleCommandResult, LifecycleDetailResult, LifecycleListResult, LifecycleService, Inject, Injectable, LifecycleAddressedListEntry, LifecycleCascadeCounts (+8 more)

### Community 12 - "UI Card Metadata Pages"
Cohesion: 0.13
Nodes (19): metadata, metadata, metadata, HomePage(), metadata, metadata, PrivacyPage(), metadata (+11 more)

### Community 13 - "UI Form Primitives"
Cohesion: 0.17
Nodes (24): Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants, Checkbox(), Field(), FieldContent() (+16 more)

### Community 14 - "Component Test Mocks"
Cohesion: 0.09
Nodes (20): AccountDeletionForm(), createIdempotencyKey(), CurrentUserForDeletion, readCurrentUserForDeletion(), mocks, AccountDeletionFormValues, accountDeletionSchema, apiError() (+12 more)

### Community 15 - "Zod Pg Database Primitives"
Cohesion: 0.06
Nodes (33): dependencies, class-transformer, class-validator, dotenv, helmet, @nestjs/core, @nestjs/platform-express, @nestjs/swagger (+25 more)

### Community 16 - "Reopen Lifecycle Ops"
Cohesion: 0.11
Nodes (9): ChecklistItemService, Inject, Injectable, ChecklistItem, TaskDetail, ChecklistItemRepository, Inject, Injectable (+1 more)

### Community 17 - "Dev Tooling Run Scripts"
Cohesion: 0.06
Nodes (31): devDependencies, eslint, jest, @jest/globals, @nestjs/cli, pino-pretty, @redocly/cli, supertest (+23 more)

### Community 18 - "CRUD Controller Handlers"
Cohesion: 0.19
Nodes (21): CompleteChecklistItemResult, EditChecklistItemResult, ReopenChecklistItemResult, ChecklistController, ApiBody, ApiOperation, ApiParam, ApiResponse (+13 more)

### Community 19 - "Task Edit Operations"
Cohesion: 0.11
Nodes (9): Task, TaskSummary, buildGlobalSort(), extractSnippet(), incrementRank(), SORT_FIELDS, TaskRepository, Inject (+1 more)

### Community 20 - "Auth REST Handlers"
Cohesion: 0.17
Nodes (24): handleLifecycleCommandResult(), resolveUserId(), toKind(), parseListLifecycleQuery(), parseResourceType(), parseRestoreInput(), TrashController, ApiBody (+16 more)

### Community 21 - "Update REST Handlers"
Cohesion: 0.14
Nodes (22): GetRecurrenceResult, SetRecurrenceResult, StopRecurrenceResult, RecurrenceController, ApiBody, ApiOperation, ApiParam, ApiResponse (+14 more)

### Community 22 - "Put REST Handlers"
Cohesion: 0.32
Nodes (16): ApiBody, ApiOperation, ApiParam, ApiResponse, Body, Get, Header, Headers (+8 more)

### Community 23 - "Retrieve REST Handlers"
Cohesion: 0.12
Nodes (18): safeOrigin(), anonymousCsrfCookieName(), parseCookieValue(), safelyDecodeCookieValue(), sessionCookieName(), ApiBody, ApiHeader, ApiOperation (+10 more)

### Community 24 - "Trash Restore Services"
Cohesion: 0.19
Nodes (3): LifecycleRepository, Inject, Injectable

### Community 25 - "Injectable Service Core"
Cohesion: 0.09
Nodes (8): GetRecurrenceQuery, RecurrenceService, SetRecurrenceCommand, StopRecurrenceCommand, Injectable, Inject, RecurrenceSeriesDetail, Inject

### Community 26 - "Label Query Services"
Cohesion: 0.10
Nodes (13): Inject, buildGenerationKey(), RecurrenceFrequency, RecurrenceMode, RecurrenceRule, RecurrenceRuleState, RecurrenceSeries, RecurrenceSeriesState (+5 more)

### Community 27 - "Validation Class Helpers"
Cohesion: 0.07
Nodes (27): dependencies, class-variance-authority, clsx, @dnd-kit/react, @hookform/resolvers, input-otp, lucide-react, next (+19 more)

### Community 28 - "ESLint Config Rules"
Cohesion: 0.07
Nodes (26): eslint-plugin-jsx-a11y, eslint-plugin-react-hooks, globals, @next/eslint-plugin-next, dependencies, @eslint/js, eslint-plugin-jsx-a11y, eslint-plugin-react-hooks (+18 more)

### Community 29 - "Project Config Meta"
Cohesion: 0.07
Nodes (26): @hey-api/openapi-ts, devDependencies, eslint, @hey-api/openapi-ts, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+18 more)

### Community 30 - "Body REST Handlers"
Cohesion: 0.15
Nodes (20): CreateProjectResult, ProjectController, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags (+12 more)

### Community 31 - "Queue Job Execution"
Cohesion: 0.20
Nodes (3): secondsUntilWindowEnd(), secondsUntilNextUtcHour(), normalizeEmail()

### Community 32 - "Task Result Controllers"
Cohesion: 0.13
Nodes (13): EditTaskResult, GetTaskResult, ListGlobalTasksResult, ListKanbanTasksResult, ListTodayTasksResult, MoveKanbanTaskResult, TaskController, ApiTags (+5 more)

### Community 33 - "Session REST Handlers"
Cohesion: 0.16
Nodes (19): NotificationController, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags (+11 more)

### Community 34 - "Query REST Handlers"
Cohesion: 0.20
Nodes (17): ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, Body, Get, Header (+9 more)

### Community 35 - "Checklist DTO Schemas"
Cohesion: 0.15
Nodes (19): ListChecklistItemsResult, AddChecklistItemRequestDto, ChecklistItemDataDto, ChecklistItemListResponseDto, EditChecklistItemRequestDto, ReorderChecklistRequestDto, ApiProperty, AddChecklistItemInput (+11 more)

### Community 36 - "Label DTO Controllers"
Cohesion: 0.16
Nodes (16): CreateLabelResult, DeleteLabelResult, GetLabelResult, ListLabelsResult, RenameLabelResult, LabelController, ApiTags, Controller (+8 more)

### Community 37 - "Delete Operations"
Cohesion: 0.13
Nodes (8): LabelService, normalizeLabelName(), Inject, Injectable, LabelRepository, Inject, Injectable, Inject

### Community 38 - "Injectable Lifecycle Services"
Cohesion: 0.12
Nodes (8): ProjectService, Inject, Injectable, normalizeProjectName(), ProjectRepository, Inject, Injectable, Inject

### Community 39 - "Create REST Handlers"
Cohesion: 0.33
Nodes (15): LifecycleActionsController, ApiOperation, ApiParam, ApiResponse, ApiTags, Body, Controller, Header (+7 more)

### Community 40 - "Env Config Schema"
Cohesion: 0.11
Nodes (20): ApiEnvironment, apiEnvironmentSchema, databaseUrl, EmailEnvironment, emailEnvironmentSchema, emailEnvironmentShape, logLevel, parseEmailEnvironment() (+12 more)

### Community 41 - "Vitest ESLint Tooling"
Cohesion: 0.09
Nodes (23): devDependencies, eslint, postcss, @tailwindcss/postcss, @testing-library/dom, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event (+15 more)

### Community 42 - "Workspace Scripts"
Cohesion: 0.09
Nodes (23): scripts, api-client:generate, build, dev, format, format:check, lint, openapi:check (+15 more)

### Community 43 - "Zod Schema Modules"
Cohesion: 0.09
Nodes (22): dependencies, zod, devDependencies, eslint, @planner/eslint-config, @planner/typescript-config, @types/node, typescript (+14 more)

### Community 44 - "Get REST Handlers"
Cohesion: 0.15
Nodes (18): ArchiveController, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, Body, Controller (+10 more)

### Community 45 - "Area Schema Validation"
Cohesion: 0.13
Nodes (21): CreateAreaInput, createAreaSchema, CreateAreaStatusInput, createAreaStatusSchema, ListAreasQueryInput, listAreasQuerySchema, parseCreateAreaInput(), parseCreateAreaStatusInput() (+13 more)

### Community 46 - "UI Framework Primitives"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 47 - "Page Metadata Mocks"
Cohesion: 0.14
Nodes (14): metadata, CurrentUserForOnboarding, detectedBrowserTimeZone(), fallbackTimeZones, isSupportedTimeZone(), OnboardingPreferenceForm(), readCurrentUserForOnboarding(), submitLabel() (+6 more)

### Community 48 - "User Profile Services"
Cohesion: 0.12
Nodes (10): AccountsModule, Module, CompleteOnboardingCommand, CompleteOnboardingResult, CompleteOnboardingService, Inject, Injectable, CompleteOnboardingPersistenceResult (+2 more)

### Community 49 - "Task Reminder Services"
Cohesion: 0.13
Nodes (10): CreateReminderCommand, CreateReminderResult, ReminderService, Injectable, NotificationReadState, ReminderAnchorType, ReminderRuleType, ReminderState (+2 more)

### Community 50 - "Session Body Handlers"
Cohesion: 0.22
Nodes (15): ApiBody, ApiOperation, ApiParam, ApiResponse, Body, Delete, Get, Header (+7 more)

### Community 51 - "JSON Body Handlers"
Cohesion: 0.19
Nodes (17): ReminderController, ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags, Body (+9 more)

### Community 52 - "Task Edit Schema"
Cohesion: 0.12
Nodes (20): CreateTaskInput, createTaskSchema, EditTaskInput, editTaskSchema, ListGlobalTasksQueryInput, listGlobalTasksQuerySchema, ListTasksQueryInput, listTasksQuerySchema (+12 more)

### Community 53 - "Leased Job Executor"
Cohesion: 0.15
Nodes (9): JobQueueService, LeasedJob, Inject, Injectable, JobRunnerService, parseChallengeId(), safeErrorCategory(), Inject (+1 more)

### Community 54 - "Task Page Render"
Cohesion: 0.11
Nodes (15): metadata, BulkActionBar(), BulkActionBarProps, BulkActionResult, BulkActionsResponse, STATUS_OPTIONS, TaskItem, formatDate() (+7 more)

### Community 55 - "Update Body Handlers"
Cohesion: 0.12
Nodes (16): ChecklistOrderResponseDto, ChecklistOrderController, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, Body (+8 more)

### Community 56 - "Button Page Layout"
Cohesion: 0.14
Nodes (13): metadata, metadata, Button(), buttonVariants, formatDate(), NotificationItem, NotificationsPageData, NotificationsView() (+5 more)

### Community 57 - "TSConfig Targets"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, declaration, declarationMap, esModuleInterop, exactOptionalPropertyTypes, forceConsistentCasingInFileNames, isolatedModules (+11 more)

### Community 58 - "Report Handler Mocks"
Cohesion: 0.18
Nodes (8): PurgeJobHandler, Inject, Injectable, PurgeService, Inject, Injectable, MutableCounts, PERMANENT_DELETE_ENTITY_KIND

### Community 59 - "Dependency Security Decisions"
Cohesion: 0.11
Nodes (19): NestJS controllers and DTO schemas own the implemented HTTP contract, Same-origin browser credentials without HttpOnly cookie auth callback, Committed deterministic OpenAPI 3.1 artifact, OpenAPI lint compatibility Supertest ownership and generated-client verification, Pinned generated Fetch client without parallel transport types, ADR-002 REST API with Backend-Owned OpenAPI and Generated Client, Stable operation IDs as generated method names, Approved pinned generator profile for BL-003 (+11 more)

### Community 60 - "Post REST Handlers"
Cohesion: 0.27
Nodes (14): ApiBody, ApiHeader, ApiOperation, ApiResponse, Body, Get, Header, Headers (+6 more)

### Community 61 - "Lifecycle Action Types"
Cohesion: 0.14
Nodes (15): PlanningModule, Module, ActionKind, ConfirmActionInput, confirmActionSchema, ListLifecycleQuery, listLifecycleQuerySchema, parseConfirmAction() (+7 more)

### Community 62 - "Task Detail Page"
Cohesion: 0.14
Nodes (14): metadata, ChecklistItem, describeRecurrence(), formatDate(), FREQUENCY_LABELS, LabelSummary, PRIORITY_LABELS, RecurrenceInfo (+6 more)

### Community 63 - "Notification Services"
Cohesion: 0.13
Nodes (5): Inject, Notification, ReminderRepository, Inject, Injectable

### Community 64 - "Today Task Page"
Cohesion: 0.15
Nodes (11): metadata, formatDate(), formatTime(), PRIORITY_LABELS, REASON_LABELS, TaskCard(), mockedApiClient, TodayResponse (+3 more)

### Community 65 - "TSConfig Paths"
Cohesion: 0.12
Nodes (16): compilerOptions, baseUrl, paths, exclude, extends, include, next-env.d.ts, .next/types/**/* 2.ts (+8 more)

### Community 66 - "Runner Tooling Config"
Cohesion: 0.12
Nodes (17): devDependencies, dependency-cruiser, @eslint/js, @playwright/test, prettier, tsx, @types/node, typescript (+9 more)

### Community 67 - "DOM Type Libraries"
Cohesion: 0.12
Nodes (16): compilerOptions, exactOptionalPropertyTypes, lib, module, moduleResolution, outDir, rootDir, types (+8 more)

### Community 68 - "Module Controllers"
Cohesion: 0.18
Nodes (9): ApiExcludeController, HealthController, Controller, Get, Inject, HealthModule, Module, HealthService (+1 more)

### Community 69 - "Etag Profile Services"
Cohesion: 0.16
Nodes (7): Inject, Injectable, UpdateCurrentUserCommand, UpdateCurrentUserResult, UpdateCurrentUserService, CurrentUserProfile, profile

### Community 70 - "Notification Read Ops"
Cohesion: 0.15
Nodes (6): NotificationService, NotificationSummary, Inject, Injectable, NotificationDetail, Inject

### Community 71 - "Project Detail DTOs"
Cohesion: 0.24
Nodes (11): GetProjectResult, ListProjectsResult, RenameProjectResult, CreateProjectRequestDto, ProjectDataDto, ProjectListMetaDto, ProjectListResponseDto, ProjectResponseDto (+3 more)

### Community 72 - "Task List Page"
Cohesion: 0.15
Nodes (10): metadata, AreaDetail(), AreaDetailData, AreaDetailProps, AreaStatusData, RenameAreaForm(), PRIORITY_LABELS, TaskList() (+2 more)

### Community 73 - "JSX Type Libraries"
Cohesion: 0.12
Nodes (15): compilerOptions, allowJs, incremental, jsx, lib, module, moduleResolution, noEmit (+7 more)

### Community 74 - "Package Build Scripts"
Cohesion: 0.13
Nodes (15): scripts, build, dev, dev:worker, lint, openapi:generate, prisma:generate, prisma:migrate:deploy (+7 more)

### Community 75 - "Query REST Handlers"
Cohesion: 0.14
Nodes (11): SearchController, ApiOperation, ApiQuery, ApiResponse, ApiTags, Controller, Get, Header (+3 more)

### Community 76 - "Compiler OutConfig"
Cohesion: 0.13
Nodes (14): compilerOptions, emitDecoratorMetadata, experimentalDecorators, outDir, rootDir, sourceMap, strictPropertyInitialization, extends (+6 more)

### Community 77 - "React Input OTP"
Cohesion: 0.19
Nodes (9): react, InputOTP(), InputOTPGroup(), InputOTPSlot(), mocks, EmailVerificationFormValues, emailVerificationSchema, verificationEmailRequestSchema (+1 more)

### Community 78 - "Task Card Summary Page"
Cohesion: 0.15
Nodes (8): metadata, COLUMN_LABELS, KanbanBoard(), KanbanColumn, KanbanResponse, PRIORITY_LABELS, TaskSummary, mockedApiClient

### Community 80 - "Controller Registry"
Cohesion: 0.18
Nodes (10): ApiOkResponse, ApiOperation, ApiTags, Controller, Get, VersionController, ApiProperty, VersionResponseDto (+2 more)

### Community 81 - "Bulk Action Items"
Cohesion: 0.16
Nodes (8): BulkActionItem, BulkActionResult, BulkActionService, findDuplicateIds(), LabelChangeCommand, StatusChangeCommand, Inject, Injectable

### Community 82 - "Checklist Add Reorder"
Cohesion: 0.15
Nodes (10): AddChecklistItemCommand, AddChecklistItemResult, CompleteChecklistItemCommand, DeleteChecklistItemCommand, DeleteChecklistItemResult, EditChecklistItemCommand, ListChecklistItemsQuery, ReopenChecklistItemCommand (+2 more)

### Community 83 - "Task Query Commands"
Cohesion: 0.14
Nodes (12): AreaKanbanColumn, AreaKanbanStatusColumn, CreateTaskCommand, EditTaskCommand, GetTaskQuery, ListGlobalTasksQuery, ListTasksQuery, ListTodayTasksQuery (+4 more)

### Community 84 - "Task Response DTOs"
Cohesion: 0.26
Nodes (13): AreaKanbanColumnDto, AreaKanbanStatusDto, CreateTaskRequestDto, EditTaskRequestDto, KanbanColumnDto, MoveAreaKanbanTaskRequestDto, MoveKanbanTaskRequestDto, TaskDataDto (+5 more)

### Community 85 - "Project Query Models"
Cohesion: 0.26
Nodes (7): CreateProjectCommand, GetProjectQuery, ListProjectsQuery, RenameProjectCommand, Project, ProjectDetail, ProjectSummary

### Community 86 - "Worker Module Wiring"
Cohesion: 0.21
Nodes (9): PlanningWorkerModule, Module, parseWorkerEnvironment(), JobsModule, Module, bootstrapWorker(), Module, WorkerModule (+1 more)

### Community 87 - "Label Schema Validation"
Cohesion: 0.22
Nodes (12): CreateLabelInput, createLabelSchema, ListLabelsQueryInput, listLabelsQuerySchema, parseCreateLabelInput(), parseListLabelsQuery(), parseRenameLabelInput(), RenameLabelInput (+4 more)

### Community 88 - "Project Schema Validation"
Cohesion: 0.22
Nodes (12): CreateProjectInput, createProjectSchema, ListProjectsQueryInput, listProjectsQuerySchema, parseCreateProjectInput(), parseListProjectsQuery(), parseRenameProjectInput(), RenameProjectInput (+4 more)

### Community 89 - "Test Config Include"
Cohesion: 0.15
Nodes (12): compilerOptions, declaration, declarationMap, rootDir, exclude, extends, include, src/**/*.ts (+4 more)

### Community 90 - "Metadata Pages"
Cohesion: 0.21
Nodes (8): metadata, metadata, ResourceType, formatDate(), LifecycleEntry, LifecycleListResponse, LifecycleListView(), resourceLabel()

### Community 91 - "Area List Page"
Cohesion: 0.21
Nodes (5): metadata, AreaList(), AreaSummary, CreateAreaData, CreateAreaForm()

### Community 92 - "User Profile DTOs"
Cohesion: 0.38
Nodes (10): AccountDeletionProcessDataDto, AccountDeletionProcessResponseDto, AccountDeletionRequestDto, CurrentUserProfileDataDto, CurrentUserProfileResponseDto, OnboardingCompletionDataDto, OnboardingCompletionRequestDto, OnboardingCompletionResponseDto (+2 more)

### Community 93 - "Search Schema Validation"
Cohesion: 0.24
Nodes (9): SearchTaskResultDto, SearchTasksResponseDto, ApiProperty, ApiPropertyOptional, parseSearchTasksQuery(), SearchTasksQueryInput, searchTasksQuerySchema, toJsonPointer() (+1 more)

### Community 94 - "Global Provider Modules"
Cohesion: 0.20
Nodes (6): DatabaseModule, Module, PrismaService, Injectable, Inject, Global

### Community 95 - "App Scripts Meta"
Cohesion: 0.17
Nodes (11): name, private, scripts, build, dev, lint, pretest:component, start (+3 more)

### Community 96 - "New Task Page"
Cohesion: 0.21
Nodes (8): metadata, CreateTaskData, CreateTaskForm(), CreateTaskFormProps, CreateTaskFormValues, createTaskSchema, EditTaskFormValues, editTaskSchema

### Community 97 - "Auth Form Tests"
Cohesion: 0.23
Nodes (8): mocks, passwordResetRequestFormSchema, PasswordResetRequestFormValues, passwordSchema, resetPasswordFormSchema, ResetPasswordFormValues, readInitialResetToken(), ResetPasswordForm()

### Community 98 - "Task Card Components"
Cohesion: 0.18
Nodes (7): AreaKanbanBoard(), AreaKanbanColumn, AreaKanbanResponse, AreaKanbanStatus, PRIORITY_LABELS, TaskSummary, mockedApiClient

### Community 99 - "Idempotent CSRF Commands"
Cohesion: 0.38
Nodes (10): archiveResource(), CommandOptions, idemKey(), permanentDeleteResource(), restoreFromTrashResource(), restoreResource(), trashResource(), withCsrf() (+2 more)

### Community 100 - "ESLint Config Presets"
Cohesion: 0.31
Nodes (3): baseConfig, nextConfig, nodeConfig

### Community 101 - "User Schema Validation"
Cohesion: 0.24
Nodes (9): OnboardingCompletionInput, onboardingCompletionSchema, parseOnboardingCompletion(), parseUserProfilePatch(), toJsonPointer(), toValidationProblem(), UserProfilePatchInput, userProfilePatchSchema (+1 more)

### Community 102 - "Label Query Models"
Cohesion: 0.31
Nodes (8): CreateLabelCommand, DeleteLabelCommand, GetLabelQuery, ListLabelsQuery, RenameLabelCommand, Label, LabelDetail, LabelSummary

### Community 103 - "Job Queue Enqueue"
Cohesion: 0.22
Nodes (4): PurgeSchedulerService, safeError(), Inject, Injectable

### Community 104 - "Search Result Services"
Cohesion: 0.18
Nodes (7): SearchResult, SearchService, SearchTasksQuery, SearchTasksResult, Inject, Injectable, Inject

### Community 105 - "Planning Domain Entities"
Cohesion: 0.20
Nodes (11): LifecycleOperation and LifecycleEffect cascade provenance, Recurrence occurrence predecessor and generation uniqueness constraints, Task entity with required owner Area and AreaStatus relationships, Distinct recoverable Archive and 30-day Trash lifecycles, Area, AreaStatus, CanonicalStatus, One open recurrence occurrence with no missed-slot backfill (+3 more)

### Community 106 - "Phase 2 Readiness Audit"
Cohesion: 0.18
Nodes (11): 178 accepted requirements 73 endpoint rows 120 active stories and 3 bounded spikes, SPIKE-001 done then BL-001 begins production work, Go with zero BLOCKER and zero HIGH findings, Restricted graph health with 118 nodes 117 edges 6 hyperedges and 16 communities, DEC-066 closes the fourth original HIGH readiness finding, Project Master and confirmed generator profile are expected cross-community governance bridges, No orphan requirement unsupported endpoint ownerless entity or backlog-less MVP feature, Phase 2 Final Readiness Audit (+3 more)

### Community 107 - "Node Type Libraries"
Cohesion: 0.18
Nodes (10): compilerOptions, lib, module, moduleResolution, types, extends, ./base.json, ES2024 (+2 more)

### Community 108 - "Task List Services"
Cohesion: 0.24
Nodes (3): TaskService, Injectable, Inject

### Community 109 - "Post Body Handlers"
Cohesion: 0.20
Nodes (9): ApiBody, ApiHeader, ApiOperation, ApiResponse, Body, Header, Post, Req (+1 more)

### Community 110 - "Area Status Data"
Cohesion: 0.24
Nodes (7): AreaDetailData, canonicalLabel(), SortableStatusItem(), StatusData, StatusEditor(), StatusEditorProps, BASE_DATA

### Community 111 - "Project Manager Form"
Cohesion: 0.27
Nodes (5): ProjectManager(), ProjectManagerProps, ProjectSummary, CreateProjectFormValues, createProjectSchema

### Community 112 - "Recurrence Business Rules"
Cohesion: 0.42
Nodes (8): addDays(), calculateNextOccurrence(), isWeekend(), nextMonthlyMatch(), nextWeekday(), nextWeeklyMatch(), nextYearlyMatch(), RecurrenceInput

### Community 113 - "Bulk Actions Schema"
Cohesion: 0.28
Nodes (8): BulkActionsInput, bulkActionsSchema, bulkTaskItemSchema, labelChangeSchema, parseBulkActionsInput(), statusChangeSchema, toJsonPointer(), zodIssueCode()

### Community 114 - "Area Rename Schema"
Cohesion: 0.32
Nodes (6): CreateAreaFormValues, createAreaSchema, RenameAreaFormValues, renameAreaSchema, RenameAreaData, RenameAreaFormProps

### Community 115 - "Checklist Components"
Cohesion: 0.32
Nodes (5): Checklist(), ChecklistItem, ChecklistProps, AddChecklistItemFormValues, addChecklistItemSchema

### Community 116 - "Product Requirements"
Cohesion: 0.25
Nodes (8): Archive Trash 30-day retention and permanent account deletion, Required Area optional same-Area Project and Task model, Reserved deferred Google-authentication IDs US-002 FR-005 FR-006 PRV-005 RA-008, Email/password registration verification login recovery and deletion lifecycle, Future social authentication requires fresh cross-document planning, Personal Task Planner Product Requirements Document, Calendar and completion recurrence with multiple in-app reminders, Today List Global Kanban and Area Kanban work views

### Community 117 - "Package Manager Meta"
Cohesion: 0.25
Nodes (7): engines, node, pnpm, name, packageManager, private, version

### Community 118 - "TSConfig Project Ref"
Cohesion: 0.25
Nodes (7): compilerOptions, outDir, rootDir, extends, include, @planner/typescript-config/node.json, src/**/*.ts

### Community 119 - "Cli Source Config"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, tsConfigPath, $schema, sourceRoot

### Community 120 - "Recurrence Set Schema"
Cohesion: 0.43
Nodes (6): parseSetRecurrenceInput(), SetRecurrenceInput, setRecurrenceSchema, toJsonPointer(), toValidationProblem(), zodIssueCode()

### Community 121 - "Label Manager Components"
Cohesion: 0.33
Nodes (5): LabelManager(), LabelManagerProps, LabelSummary, CreateLabelFormValues, createLabelSchema

### Community 122 - "Recurrence Rule DTOs"
Cohesion: 0.60
Nodes (5): RecurrenceResponseDto, RecurrenceRuleDto, RecurrenceSeriesDto, ApiProperty, ApiPropertyOptional

### Community 123 - "Reminder Manager UI"
Cohesion: 0.40
Nodes (5): ANCHOR_LABELS, formatScheduledAt(), ReminderManager(), ReminderManagerProps, TaskReminder

### Community 124 - "Architecture Strategy"
Cohesion: 0.33
Nodes (6): ARC-001 Web API and Worker runtime topology, ARC-005 Domain-aligned backend module map, ARC-009 PostgreSQL-backed durable worker without Redis, ARC-030 Architecture knowledge graph workflow, Architecture and Quality Strategy, TypeScript modular monolith with one pnpm workspace

### Community 125 - "Account Deletion Domain"
Cohesion: 0.33
Nodes (6): AccountDeletionProcess durable idempotent purge coordination, AuthenticationIdentity entity with one email/password identity per active User, User entity, Confirmed account deletion and immediate access revocation, AuthenticationIdentity, User

### Community 126 - "Package JSON Meta"
Cohesion: 0.33
Nodes (5): files, name, private, version, *.json

### Community 127 - "Small Controller Cluster"
Cohesion: 0.40
Nodes (4): ApiTags, Controller, Inject, UserController

### Community 128 - "Bulk Transport Cluster"
Cohesion: 0.60
Nodes (3): BulkActionItemResultDto, BulkActionsResponseDto, ApiProperty

### Community 129 - "Constructor Controllers"
Cohesion: 0.40
Nodes (4): BulkActionController, ApiTags, Controller, Inject

### Community 130 - "Logger Redaction"
Cohesion: 0.60
Nodes (3): createLoggerParameters(), createPinoOptions(), redactPaths

### Community 133 - "Prettier Formatting"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

### Community 134 - "Generated Root Checks"
Cohesion: 0.50
Nodes (4): collectFiles(), digestGeneratedFiles(), generatedExtensions, generatedRoots

### Community 135 - "Secret Scan Patterns"
Cohesion: 0.40
Nodes (4): excluded, findings, patterns, trackedFiles

### Community 136 - "Package Private Meta"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 137 - "Error Controller Health"
Cohesion: 0.50
Nodes (3): ThrowingController, Controller, Get

### Community 138 - "Next Config Web Env"
Cohesion: 0.50
Nodes (3): environment, nextConfig, webEnvironmentSchema

### Community 139 - "Registration Form Schema"
Cohesion: 0.50
Nodes (3): passwordSchema, registrationFormSchema, RegistrationFormValues

### Community 141 - "Security Architecture ADRs"
Cohesion: 0.50
Nodes (4): ARC-010 Opaque HttpOnly cookie session strategy, ARC-013 Backend-owned deterministic OpenAPI and generated-client pipeline, ARC-025 OpenAPI generated-client and architecture drift gates, Confirmed @hey-api/openapi-ts 0.99.0 TypeScript 5.9.3 Fetch profile

### Community 142 - "Dependabot Updates"
Cohesion: 0.67
Nodes (3): Dependabot Configuration, Dependabot updates target develop, Weekly npm GitHub Actions and Docker dependency updates

### Community 145 - "Runtimes & ADR Decisions"
Cohesion: 0.67
Nodes (3): Domain-Aligned Modular Monolith, ADR-001: Modular Monolith with Separate Runtime Entry Points, PostgreSQL Job Leasing

### Community 146 - "Reminder Notification Semantics"
Cohesion: 0.67
Nodes (3): Default-enabled in-app reminder Notification preference and suppression semantics, Notification, TaskReminder

### Community 147 - "Redocly OpenAPI Lint"
Cohesion: 0.67
Nodes (3): Reviewed foundation OpenAPI lint exceptions, Redocly recommended-strict ruleset, Redocly OpenAPI Lint Configuration

## Knowledge Gaps
- **696 isolated node(s):** `printWidth`, `semi`, `singleQuote`, `trailingComma`, `$schema` (+691 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccountsRepository` connect `Injectable Service Layer` to `Bulk Transport Cluster`, `Constructor Controllers`, `Shared DI Bootstrap`, `Area Transport DTOs`, `NestJS Injectable Services`, `Area Detail Flow`, `App Bootstrap Entry`, `Module Wiring & Send`, `Auth Login Rate Limit`, `List Trash Restore Ops`, `Reopen Lifecycle Ops`, `Auth REST Handlers`, `Update REST Handlers`, `Retrieve REST Handlers`, `Injectable Service Core`, `Queue Job Execution`, `Task Result Controllers`, `Checklist DTO Schemas`, `Label DTO Controllers`, `Delete Operations`, `Injectable Lifecycle Services`, `Create REST Handlers`, `Get REST Handlers`, `User Profile Services`, `Task Reminder Services`, `Update Body Handlers`, `Lifecycle Action Types`, `Etag Profile Services`, `Notification Read Ops`, `Project Detail DTOs`, `Query REST Handlers`, `Checklist Add Reorder`, `Search Schema Validation`, `Search Result Services`, `Task List Services`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `LifecycleRepository` connect `Trash Restore Services` to `Report Handler Mocks`, `List Trash Restore Ops`, `Test Repo Mocks`, `Lifecycle Action Types`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `ProjectRepository` connect `Injectable Lifecycle Services` to `Lifecycle Action Types`, `Project Query Models`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `singleQuote` to the rest of the system?**
  _696 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Request Response DTOs` be split into smaller, more focused modules?**
  _Cohesion score 0.06829488919041157 - nodes in this community are weakly interconnected._
- **Should `CI Pipeline & Readiness` be split into smaller, more focused modules?**
  _Cohesion score 0.055811571940604196 - nodes in this community are weakly interconnected._
- **Should `Navigation Icon Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.0593990216631726 - nodes in this community are weakly interconnected._