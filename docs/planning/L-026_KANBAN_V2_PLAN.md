# L-026 — Kanban v2 (Search/Filter Toolbar + Drag-and-Drop) Implementation Plan

| Field | Value |
| --- | --- |
| Slice | L-026 |
| Goal | Server-side search/filter + drag-and-drop between columns on global and per-area Kanban boards |
| Status | Implemented and published to `opencode/develop` |
| Created | 2026-09-15 |
| Dependencies | L-011 / L-012 (Kanban boards), L-025 (Quick Add) — completed |

## 1. Story Goal

The global Kanban board (`/app/kanban`) and the per-area Kanban view currently load every task for the user or area and offer only arrow-button column moves. This slice makes both boards narrow a large backlog down to the task you are looking for (server-side search + filters) and lets you move tasks between columns directly with drag-and-drop, optimistic UI, and keyboard-accessible fallbacks.

## 2. Acceptance Criteria

1. Global board filters tasks by query (`q`), area (`areaId`), project (`projectId`), priority (`priority`), and label (`labelId`); the area board filters by query, project, priority, and label only.
2. `/app/kanban` URL persists `q`, `areaId`, `projectId`, `priority`, `label` params; the area board keeps filters in local state.
3. Cards render labels, project name, area name (global), and planned/due dates.
4. Tasks can be dragged from one column to another (including empty columns); moves are optimistic with rollback on error, and the existing arrow buttons still work.
5. All filtering happens server-side; no client-side slicing of the result set.
6. Generated OpenAPI/client artifacts cover the new query params and the enriched task DTO.
7. Lint, typecheck, component tests, API contract/unit tests, and DB integration tests pass.

## 3. Scope

**Includes:**

- API query params + enriched kanban DTOs, repository filtering, OpenAPI/client regeneration
- Shared toolbar (debounced search + area/project/priority/label selects) and enriched card
- URL persistence for the global board, local state for the area board
- Drag-and-drop between columns with optimistic move + rollback
- Fixing pre-existing bugs encountered on the way (`taskLabels` Prisma key; missing `If-Match` on area moves)

**Excludes:**

- Dragging to reorder tasks *within* a column (no ordering parameter exists in the move endpoints)
- Full-text search over descriptions; `q` matches the task title only (parity with `searchTasks`)
- `canonicalStatus` / `dateState` filters (columns already encode status)
- Client-side filtering or pagination inside columns
- Custom status column collapsing

## 4. Design Notes

### 4.1 Filter contract

| Param | Global board | Area board | Validation |
| --- | --- | --- | --- |
| `q` | yes | yes | max 80 chars, trimmed |
| `areaId` | yes | — | UUID |
| `projectId` | yes | yes | UUID |
| `priority` | yes | yes | LOW | MEDIUM | HIGH |
| `labelId` | yes | yes | UUID |

`q` uses the same Turkish-aware term splitter and sanitizer as `searchTasks` (`/[^\wğüşıöçĞÜŞİÖÇ]/g`) and ANDs all terms against the title (case-insensitive `contains`).

### 4.2 Enriched DTO

`KanbanTaskDto` extends the task summary with `labels: {id,name}[]`, `project: {id,name}|null`, and `areaName`. Both boards' responses move from the lean `TaskSummary` to this richer shape so the card can render chips/badges without N+1 lookups. `version` (already present) is now used by the area board for `If-Match`.

### 4.3 Repository filtering

`findKanbanTasks(userId, filters)` / `findAreaKanbanTasks(userId, areaId, filters)` route through a shared `buildKanbanWhere` helper. Both endpoints bucket into columns by `canonicalStatus` inside SQL (`groupBy`) exactly as before — filtering happens in the WHERE clause and every column counts only matching tasks.

Important Prisma detail: the Task↔label relation's include/where key is **`labels`** (not `taskLabels`). `taskLabels` in a `where` is a runtime validation error, which silently affected `findTodayTasks`, `listGlobal`, and `searchTasks` for label-filtered requests; all were corrected to `labels: { some: { labelId } }`.

### 4.4 Frontend wiring

- `useKanbanBoardFilters({ mode: 'url'|'local' })` returns `{ filters, setQ, setFilter, clearAll }`; URL mode reuses `useUrlTaskFilters` for the four selects and mirrors the debounced `q` into the URL (same pattern as the search view).
- Query keys stay prefix-compatible: `['tasks','kanban', filters]` and `['areas', areaId, 'kanban', filters]` still invalidate under `['tasks','kanban']` / `['areas', areaId, 'kanban']`.
- Toolbar is presentational: 300 ms debounce, area select only on the global board, project select scoped to the chosen area (global) or the board's area.
- `KanbanTaskCard` is shared by both boards.

### 4.5 Drag-and-drop

`@dnd-kit/react` (already a dependency, used by `status-editor.tsx`):

- `DragDropProvider` wraps the column strip; `useDraggable` on each card (whole card is the activator, move buttons stay clickable), `useDroppable` on each column including empty ones, `DragOverlay` shows the dragged card.
- `onDragEnd` → `resolveDragMove(source.data, target.id)` is a pure decision function → maps a drop onto `{ taskId, target, version, fromColumn }`.
- Move mutation runs `onMutate` → `moveTaskBetweenColumns` (pure, immutable) for optimistic reorder; `onError` restores the cached snapshot; `onSettled` invalidates.
- Arrow buttons remain as the keyboard/AT path and share the same mutation variables.
- The area board now sends `If-Match: version` (the endpoint rejects requests without it — the previous web client did not send it, so area moves would have been 422 against a real server).

## 5. Implementation Steps

1. **API (S1):** domain types (`KanbanTaskSummary`, `KanbanTaskFilter`), repo `buildKanbanWhere` + enrich includes, service signatures, zod query schemas + parsers, `KanbanTaskDto` + mapper, controller `@ApiQuery` + wiring, `taskLabels`→`labels` fix, OpenAPI + api-client regeneration, tests (DB/service/contract).
2. **Web toolbar + card (S2):** `kanban-toolbar.tsx` (hook + select/input), `kanban-task-card.tsx`, wire both boards' queries with filter params, URL persistence for global board, component tests.
3. **Web drag-and-drop (S3):** `kanban-dnd.tsx` (primitives + pure helpers), provider/overlay integration in both boards, optimistic moves with rollback, `If-Match` on area moves, unit tests for the pure helpers.
4. **Docs:** this plan + `BACKLOG.md` entry.

## 6. Verification

- API: `typecheck`, `test:unit` (150/152 — two pre-existing date-rollover tests fail), `test:api` 131/131, `test:db` kanban suite 6/6 (testcontainers; needs `DOCKER_HOST=unix://$HOME/.colima/default/docker.sock` + `TESTCONTAINERS_RYUK_DISABLED=true` in this environment), OpenAPI + `redocly lint`.
- Web: `typecheck`, `lint`, Prettier, `vitest run` 176/176 (depended on `next/navigation` mock for URL-mode tests).
- Note: root-level scripts that spawn `pnpm` without `--config.engine-strict=false` fail under Node 24.19 (workspace pins 24.18.0); package-level commands run with the flag pass.

## 7. Decisions Recorded

- `q` matches title only (not snippets), mirroring existing search semantics — avoids scope creep into a new relevance layer.
- No `canonicalStatus`/`dateState` filters — columns already encode state; the toolbar stays focused.
- Area board filters are local state; global board uses URL params — consistent with the search view and deep-linkability of the main board.
- DnD replaces only the "move" gesture; intra-column sorting is out of scope because the move endpoints are status-only.