# L-006 — Task Creation and Editing Implementation Plan

| Field | Value |
| --- | --- |
| Slice | L-006 |
| Goal | User creates and edits basic Tasks directly under an Area |
| Status | Ready for implementation |
| Created | 2026-08-19 |
| Dependencies | L-005 (completed) |

## 1. Story Goal

A user can create, view, list, and edit basic Tasks directly under an owned Area. Tasks have a title, optional description, dates, priority, and status defaulting to the Area's default To Do status. All operations are owner-isolated with optimistic concurrency.

## 2. Acceptance Criteria

1. User can create a Task with a non-blank title under an owned Area
2. System defaults new Tasks to the Area's default To Do AreaStatus
3. User can optionally set description, planned date, due date, and priority
4. User can view Task detail with all fields and ETag
5. User can edit Task title, description, dates, priority via PATCH with If-Match
6. User can list Tasks within an Area with cursor pagination
7. All operations are owner-isolated and use CSRF/ETag where required
8. Generated OpenAPI/client artifacts expose all new operations
9. Frontend provides task creation form and task detail/edit view within Area context
10. No Projects, recurrence, reminders, Kanban, bulk actions, or search is introduced

## 3. Scope

**Includes:**
- Create/view/list/edit basic Tasks under an Area
- Title, description, planned/due dates, priority, status default
- Owner isolation and security (CSRF, ETag, idempotency)
- Area-scoped task listing
- Default status resolution from Area's default To Do status
- Generated OpenAPI/client artifacts
- Frontend routes and components (create form, detail, edit)

**Excludes:**
- Project assignment (L-008)
- Checklist items (L-007)
- Labels assignment (L-007)
- Recurrence (L-015)
- Reminders (L-018)
- Kanban views (L-011, L-012)
- Status transitions / workflow editing (L-014)
- Bulk actions (L-017)
- Search and filtering (L-016)
- Archive/Trash (L-019, L-020)

## 4. API Endpoints

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `POST /areas/{areaId}/tasks` | Create Task under Area | Session + CSRF + Idempotency-Key |
| `GET /areas/{areaId}/tasks` | List Tasks within Area | Session |
| `GET /tasks/{taskId}` | Get Task detail | Session |
| `PATCH /tasks/{taskId}` | Edit Task fields | Session + CSRF + If-Match |

### 4.1 POST /areas/{areaId}/tasks

**Request:**
```json
{
  "title": "string (1-500 chars, non-blank)",
  "description": "string | null (max 5000 chars)",
  "plannedAt": "2026-08-20T09:00:00.000Z | null",
  "dueAt": "2026-08-22T17:00:00.000Z | null",
  "priority": "LOW | MEDIUM | HIGH (default MEDIUM)"
}
```

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "areaId": "uuid",
    "title": "string",
    "description": "string | null",
    "plannedAt": "ISO datetime | null",
    "dueAt": "ISO datetime | null",
    "priority": "LOW | MEDIUM | HIGH",
    "areaStatusId": "uuid (default To Do status)",
    "canonicalStatus": "TO_DO | IN_PROGRESS | COMPLETED",
    "lifecycleState": "ACTIVE",
    "version": 1
  }
}
```
Headers: `ETag: "1"`, `Location: /api/v1/tasks/{taskId}`

**Resolution logic:**
- Area must be owned and active
- `areaStatusId` defaults to the Area's active status where `canonicalStatus = TO_DO` and `isDefault = true`
- `globalRank` and `areaRank` generated as midpoints between existing ranks (simple append: max rank + fixed increment for L-006)

**Errors:** `401`, `404` (area not found), `422` (validation), `429`

### 4.2 GET /areas/{areaId}/tasks

**Query params:** `cursor?`, `limit?` (default 20, max 50)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "priority": "LOW | MEDIUM | HIGH",
      "canonicalStatus": "TO_DO | IN_PROGRESS | COMPLETED",
      "dueAt": "ISO datetime | null",
      "plannedAt": "ISO datetime | null",
      "lifecycleState": "ACTIVE"
    }
  ],
  "meta": {
    "nextCursor": "uuid | undefined"
  }
}
```

### 4.3 GET /tasks/{taskId}

**Response 200:** Full Task detail (same shape as POST response)
Headers: `ETag: "{version}"`

**Errors:** `401`, `404`

### 4.4 PATCH /tasks/{taskId}

**Request (partial):**
```json
{
  "title": "string | null (clear not allowed)",
  "description": "string | null (null clears)",
  "plannedAt": "ISO datetime | null (null clears)",
  "dueAt": "ISO datetime | null (null clears)",
  "priority": "LOW | MEDIUM | HIGH | null (null resets to MEDIUM)",
  "areaStatusId": "uuid | null (null keeps current)"
}
```

**Validation:**
- `dueAt` must not precede `plannedAt` when both provided
- `areaStatusId` must belong to same Area and be active

**Response 200:** Updated Task + new `ETag`

**Errors:** `401`, `404`, `412` (version mismatch), `422` (validation), `428` (missing If-Match)

## 5. Database Schema

No schema changes required. The Task model already has all necessary fields from the initial schema:

- `id`, `userId`, `areaId`, `projectId` (nullable, unused in L-006), `areaStatusId`
- `title`, `description`, `plannedAt`, `dueAt`, `priority`
- `completedAt`, `lifecycleState`, `globalRank`, `areaRank`, `version`
- `createdAt`, `updatedAt`

Key indexes already exist:
- `task_user_lifecycle_idx` for general owned queries
- `task_area_rank_idx` for Area-scoped listing
- `area_status_default_lookup_idx` for resolving default status

## 6. Backend Implementation

### 6.1 Module Structure

Create `apps/api/src/modules/tasks/` following the Area module pattern:

```
tasks/
  tasks.module.ts
  domain/
    task.entity.ts
  application/
    task.service.ts
  infrastructure/
    task.repository.ts
  transport/
    task.controller.ts
    task.dto.ts
    task.schema.ts
```

### 6.2 Domain Entity (`task.entity.ts`)

```typescript
export type Task = {
  readonly id: string;
  readonly userId: string;
  readonly areaId: string;
  readonly projectId: string | null;
  readonly areaStatusId: string;
  readonly title: string;
  readonly description: string | null;
  readonly plannedAt: Date | null;
  readonly dueAt: Date | null;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly completedAt: Date | null;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  readonly globalRank: string;
  readonly areaRank: string;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type TaskSummary = {
  readonly id: string;
  readonly title: string;
  readonly priority: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly dueAt: Date | null;
  readonly plannedAt: Date | null;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
};

export type TaskDetail = {
  readonly task: Task;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly areaName: string;
};
```

### 6.3 Service (`task.service.ts`)

Commands/queries with discriminated union results:
- `createTask(userId, areaId, input)` → `SUCCESS | NOT_FOUND | VALIDATION_ERROR | UNAUTHENTICATED`
- `getTask(userId, taskId)` → `SUCCESS | NOT_FOUND | UNAUTHENTICATED`
- `listTasksByArea(userId, areaId, query)` → `SUCCESS | NOT_FOUND | UNAUTHENTICATED`
- `editTask(userId, taskId, input, version)` → `SUCCESS | NOT_FOUND | STALE_VERSION | VALIDATION_ERROR | UNAUTHENTICATED`

### 6.4 Repository (`task.repository.ts`)

- `createTask(userId, areaId, input, defaultStatusId)` — transaction: create task + compute rank
- `findById(userId, taskId)` — join AreaStatus for canonicalStatus
- `listByArea(userId, areaId, cursor, limit)` — cursor pagination
- `updateTask(userId, taskId, input, version)` — `updateMany` + re-read pattern (same as Area rename)

### 6.5 Controller (`task.controller.ts`)

- Inject `TaskService`, `AccountsRepository`, `AuthSecurityService`
- Reuse `resolveUserId(request)` pattern from AreaController
- ETag/If-Match/Idempotency-Key handling identical to Area endpoints

### 6.6 Module Registration

Add `TasksModule` to `app.module.ts` imports. Tasks live in the `planning` domain but get their own module to keep boundaries clean.

## 7. Frontend Implementation

### 7.1 Routes

```
apps/web/src/app/app/areas/[areaId]/tasks/
  new/page.tsx                   -- Task creation form (within Area context)
apps/web/src/app/app/tasks/[taskId]/
  page.tsx                       -- Task detail/edit
```

### 7.2 Feature Components

```
apps/web/src/features/tasks/
  create-task-form.tsx           -- Create Task form (title, description, dates, priority)
  create-task-form.test.tsx
  task-detail.tsx                -- Task detail view with inline edit
  task-detail.test.tsx
  edit-task-form.tsx             -- Edit form (PATCH with ETag)
  edit-task-form.test.tsx
  task-schema.ts                 -- Zod validation for task forms
```

### 7.3 UX Behavior

- **Create form:** Pre-filled Area context from URL. Shows title (required), description (optional), plannedAt/dueAt (optional datetime pickers), priority (select, default MEDIUM). Save sends POST with Idempotency-Key.
- **Task detail:** Displays all fields. Inline edit for title, description, dates, priority. PATCH sends If-Match with current version.
- **List:** Area detail page shows task list with title, priority badge, status, due date. Empty state: "Henüz görev yok."
- **Navigation:** Area detail page links to task creation and individual tasks.

## 8. Rank Strategy (L-006 simplified)

For L-006, use simple append-only ranking:
- New tasks get `globalRank` and `areaRank` = max existing rank for that scope + fixed increment `'000100'`
- No midpoint splitting needed until L-011/L-012 Kanban ordering
- This is sufficient for list display ordered by `areaRank`

## 9. Tests

### Backend
- **Unit tests:** `task.service.spec.ts` — command validation, result discrimination, default status resolution
- **API integration tests:** `test/api/tasks.spec.ts` — full HTTP cycle for create, get, list, edit, error cases
- **Contract tests:** OpenAPI spec regeneration, client determinism

### Frontend
- **Component tests:** `create-task-form.test.tsx`, `task-detail.test.tsx`, `edit-task-form.test.tsx`

### E2E
- Extend or create E2E test for task creation flow within Area context

## 10. Quality Gates

1. `pnpm format:check`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test:unit`
5. `pnpm test:component`
6. `pnpm test:api`
7. `pnpm test:contract`
8. `pnpm build`
9. Manual verification: create task under area, view detail, edit fields

## 11. Risks

| Risk | Mitigation |
|------|------------|
| Rank computation complexity deferred to L-011/L-012 | Use simple append-only ranks; no midpoint logic needed yet |
| completedAt must match canonicalStatus | Validate in service; auto-set/clear on status change |
| dueAt before plannedAt edge case | Explicit validation: dueAt must not precede plannedAt |
| Area default status lookup may return null | Validate Area has active default To Do status before task creation |

## 12. Implementation Order

1. Backend domain entity and types
2. Backend repository (Prisma queries)
3. Backend service (business logic + validation)
4. Backend controller + schema + DTOs
5. Register TasksModule in AppModule
6. Regenerate OpenAPI spec and client
7. Frontend task schema (Zod)
8. Frontend create-task-form
9. Frontend task-detail and edit-task-form
10. Frontend routes (new task, task detail)
11. Update Area detail page to show task list
12. Backend tests (unit, API)
13. Frontend component tests
14. Quality gates (format, typecheck, lint, build)
15. Manual verification
