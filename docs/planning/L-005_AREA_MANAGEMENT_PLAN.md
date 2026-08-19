# L-005 — Area Management Implementation Plan

| Field | Value |
| --- | --- |
| Slice | L-005 |
| Goal | User manages Areas |
| Status | Ready for implementation |
| Created | 2026-08-17 |
| Dependencies | L-004 (completed) |

## 1. Story Goal

A user can create, list, view details, and rename active owned Areas with default workflow.

## 2. Acceptance Criteria

1. User can create an Area with a non-blank name
2. System creates three default AreaStatuses (To Do, In Progress, Completed) with one default per canonical group
3. User can list their active Areas with task/project counts
4. User can view Area detail with name, status, and metadata
5. User can rename an Area
6. All operations are owner-isolated and use CSRF/ETag where required
7. Generated OpenAPI/client artifacts expose all new operations
8. No Archive/Trash, custom status management, or sharing is introduced

## 3. Scope

**Includes:**
- Create/list/detail/rename active owned Areas with default workflow
- Area creation with three default AreaStatuses
- Owner isolation and security (CSRF, ETag, idempotency)
- Generated OpenAPI/client artifacts
- Frontend routes and components

**Excludes:**
- Archive/Trash lifecycle operations
- Custom status management (L-013)
- Sharing, collaboration
- Kanban views (L-011, L-012)
- Task management within Areas (L-006)
- Project management within Areas (L-008)

## 4. API Endpoints

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| `GET /areas` | List active Areas with cursor pagination | Session |
| `POST /areas` | Create Area with default workflow | Session + CSRF + Idempotency-Key |
| `GET /areas/{areaId}` | Get Area detail | Session |
| `PATCH /areas/{areaId}` | Rename Area | Session + CSRF + If-Match |

## 5. Implementation Steps

### Step 1: Create Planning Module Structure

Create `apps/api/src/modules/planning/` directory with:

```
apps/api/src/modules/planning/
  planning.module.ts
  application/
    area.service.ts
  domain/
    area.entity.ts
  infrastructure/
    area.repository.ts
  transport/
    area.controller.ts
    area.dto.ts
    area.schema.ts
```

### Step 2: Implement Area Entity

Create `apps/api/src/modules/planning/domain/area.entity.ts`:

```typescript
export type Area = {
  readonly areaId: string;
  readonly userId: string;
  readonly name: string;
  readonly lifecycleState: 'ACTIVE' | 'ARCHIVED' | 'TRASHED';
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type AreaStatus = {
  readonly areaStatusId: string;
  readonly areaId: string;
  readonly userId: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly canonicalStatus: 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
  readonly position: number;
  readonly isActive: boolean;
  readonly isDefault: boolean;
  readonly version: number;
};
```

### Step 3: Implement Area Repository

Create `apps/api/src/modules/planning/infrastructure/area.repository.ts`:

- `createArea(userId, name)` - Creates Area + 3 default AreaStatuses in transaction
- `findById(userId, areaId)` - Returns Area with ownership check
- `listByUser(userId, cursor?, limit?)` - Returns paginated Areas
- `updateName(userId, areaId, name, version)` - Renames Area with version check
- `countTasksByArea(userId, areaId)` - Returns task count
- `countProjectsByArea(userId, areaId)` - Returns project count

### Step 4: Implement Area Service

Create `apps/api/src/modules/planning/application/area.service.ts`:

```typescript
export type CreateAreaCommand = {
  readonly name: string;
};

export type CreateAreaResult =
  | { readonly outcome: 'SUCCESS'; readonly area: Area; readonly statuses: AreaStatus[] }
  | { readonly outcome: 'VALIDATION_ERROR'; readonly detail: string }
  | { readonly outcome: 'UNAUTHENTICATED' };

// Similar for GetArea, ListAreas, RenameArea
```

### Step 5: Implement Area Controller

Create `apps/api/src/modules/planning/transport/area.controller.ts`:

- `POST /areas` - Create Area
- `GET /areas` - List Areas
- `GET /areas/{areaId}` - Get Area detail
- `PATCH /areas/{areaId}` - Rename Area

### Step 6: Implement Validation Schemas

Create `apps/api/src/modules/planning/transport/area.schema.ts`:

- `parseCreateAreaInput(body)` - Validates name
- `parseRenameAreaInput(body)` - Validates name
- `parseListAreasQuery(query)` - Validates cursor, limit

### Step 7: Implement DTOs

Create `apps/api/src/modules/planning/transport/area.dto.ts`:

- `AreaDto` - Area response data
- `AreaStatusDto` - AreaStatus response data
- `AreaListResponseDto` - Paginated Areas response
- `CreateAreaResponseDto` - Create Area response

### Step 8: Register Planning Module

Update `apps/api/src/modules/planning/planning.module.ts`:

```typescript
@Module({
  controllers: [AreaController],
  providers: [AreaService, AreaRepository],
  exports: [AreaService],
})
export class PlanningModule {}
```

Update `apps/api/src/app.module.ts` to import PlanningModule.

### Step 9: Generate OpenAPI and Client

1. Run `pnpm prisma:generate` to ensure Prisma types are current
2. Run OpenAPI generation to update `apps/api/openapi/openapi.json`
3. Run client generation to update `packages/api-client/src/generated/`

### Step 10: Implement Frontend Routes

Create `apps/web/src/app/app/areas/page.tsx`:

```typescript
export const metadata = { title: 'Alanlar' };
export default function AreasPage() {
  return (
    <main className="...">
      <SessionBoundary>
        <AreaList />
      </SessionBoundary>
    </main>
  );
}
```

Create `apps/web/src/app/app/areas/[areaId]/page.tsx`:

```typescript
export const metadata = { title: 'Alan Detay' };
export default function AreaDetailPage({ params }) {
  return (
    <main className="...">
      <SessionBoundary>
        <AreaDetail areaId={params.areaId} />
      </SessionBoundary>
    </main>
  );
}
```

### Step 11: Implement Frontend Features

Create `apps/web/src/features/areas/` directory:

- `area-list.tsx` - Area list component
- `area-detail.tsx` - Area detail component
- `create-area-form.tsx` - Create Area form
- `rename-area-form.tsx` - Rename Area form
- `area-card.tsx` - Area card for list
- `area-api.ts` - API utilities
- `area-schema.ts` - Zod form schemas

### Step 12: Update Navigation

Update desktop sidebar to include Areas link.
Update mobile More menu to include Areas.

### Step 13: Write Tests

**Backend:**
- `apps/api/test/unit/area.service.spec.ts` - Unit tests
- `apps/api/test/api/areas.spec.ts` - API integration tests
- `apps/api/test/db/area.repository.spec.ts` - DB integration tests

**Frontend:**
- `apps/web/src/features/areas/area-list.test.tsx` - Component tests
- `apps/web/src/features/areas/area-detail.test.tsx` - Component tests
- `apps/web/src/features/areas/create-area-form.test.tsx` - Component tests

**E2E:**
- `tests/e2e/area-management.spec.ts` - E2E tests

### Step 14: Quality Gates

1. `pnpm format:check`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test`
5. `pnpm build`
6. `pnpm test:e2e -- tests/e2e/area-management.spec.ts`
7. `pnpm test:security`
8. `pnpm prisma:validate`

### Step 15: Documentation Updates

1. Update `BACKLOG.md` with L-005 completion
2. Update `PROJECT_MASTER.md` with L-005 decision
3. Run bounded Graphify update

## 6. Security Checks

- Owner isolation: All Area operations verify user ownership
- CSRF protection on state-changing operations
- ETag/If-Match for concurrency control
- Non-disclosing 404 for missing/foreign Areas
- Idempotency-Key for create operations

## 7. Required Tests

- **Unit:** Area creation, naming, ownership, default workflow
- **API:** All endpoints with auth, CSRF, idempotency, concurrency
- **DB:** Owner-scoped queries, uniqueness, default status creation
- **Component:** Area list, detail, forms, empty states
- **E2E:** Create Area, list Areas, view detail, rename Area
- **Contract:** OpenAPI spec validation

## 8. Risks

1. **Scope creep into workflow customization** - Keep L-005 to basic CRUD only
2. **Performance with many Areas** - Use cursor pagination, test with realistic data
3. **Default status creation complexity** - Ensure transactional atomicity
4. **Frontend routing complexity** - Keep routes simple, reuse existing patterns

## 9. Expected Files

**Backend:**
- `apps/api/src/modules/planning/planning.module.ts`
- `apps/api/src/modules/planning/application/area.service.ts`
- `apps/api/src/modules/planning/domain/area.entity.ts`
- `apps/api/src/modules/planning/infrastructure/area.repository.ts`
- `apps/api/src/modules/planning/transport/area.controller.ts`
- `apps/api/src/modules/planning/transport/area.dto.ts`
- `apps/api/src/modules/planning/transport/area.schema.ts`

**Frontend:**
- `apps/web/src/app/app/areas/page.tsx`
- `apps/web/src/app/app/areas/[areaId]/page.tsx`
- `apps/web/src/features/areas/area-list.tsx`
- `apps/web/src/features/areas/area-detail.tsx`
- `apps/web/src/features/areas/create-area-form.tsx`
- `apps/web/src/features/areas/rename-area-form.tsx`
- `apps/web/src/features/areas/area-card.tsx`
- `apps/web/src/features/areas/area-api.ts`
- `apps/web/src/features/areas/area-schema.ts`

**Tests:**
- `apps/api/test/unit/area.service.spec.ts`
- `apps/api/test/api/areas.spec.ts`
- `apps/api/test/db/area.repository.spec.ts`
- `apps/web/src/features/areas/area-list.test.tsx`
- `apps/web/src/features/areas/area-detail.test.tsx`
- `apps/web/src/features/areas/create-area-form.test.tsx`
- `tests/e2e/area-management.spec.ts`

**Generated:**
- `apps/api/openapi/openapi.json`
- `packages/api-client/src/generated/sdk.gen.ts`
- `packages/api-client/src/generated/types.gen.ts`

## 10. Verification Evidence

After implementation, verify:

1. `pnpm format:check` passes
2. `pnpm typecheck` passes
3. `pnpm lint` passes
4. `pnpm test` passes
5. `pnpm build` passes
6. `pnpm test:e2e -- tests/e2e/area-management.spec.ts` passes
7. `pnpm test:security` passes
8. `pnpm prisma:validate` passes
9. Generated OpenAPI spec includes new endpoints
10. Generated client includes new operations
11. Frontend routes are accessible
12. All acceptance criteria met