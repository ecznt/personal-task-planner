# L-034 — Görev Bağımlılıkları (blocked-by)

> Slice #9 · Kapsam: **Orta — Block + görünürlük** · Onaylandı
> Created: 2026-09-23 · Branch: `opencode/develop`
> Dependencies: L-033 (briefing/today), L-031 (kanban v2), L-026 (kanban v1), L-020 (kanban board)

## 1. Goal

Bir görevin tamamlanması için **önce bitirilmesi gereken görevler** (`blockedByTaskIds`) tanımlansın. Bu görevlerden biri bile `COMPLETED` değilse görev "bloke" sayılır. MVP'de:

1. Her yerde görünürlük: kanban kartında 🔒 rozeti + today briefing'de "Seni bekleyen bağımlı görevler" + odak kartında bloke olmayanlara öncelik.
2. Veri + API: `blockedByTaskIds: string[]` create/update'te setlenebilir; döngü (A→B→A) + self-reference engellenir.
3. **Explicit MVP:** mevcut görevi bloke eden döngü kontrolü BFS ile (_MVP ile sınırlı: tek seferlik Set tabanlı, 50 görev derinlik koruması_).

**Excludes (MVP dışı):** otomatik `BLOCKED` kanonik durumu / lifecycle state machine değişikliği; recurrence/predecessor mantığına dokunma (`predecessorTaskId` recurrence'a aittir, bu özellikten **farklı** kavramdır); kanban v2'de bloke sütunu; bildirim/push.

## 2. Kullanıcı öyküsü

> "Bir görevi başka bir görev tamamlanmadan yapamam. Bugün gördüğüm listede hangisinin beklediğini bileyim ve kartımda 'bloke' görünsün."

## 3. API Veri Modeli

**Prisma `Task`** (`apps/api/prisma/schema.prisma`):
```prisma
blockedByTaskIds String[]      @default([])
```

**Veritabanı migration** `apps/api/prisma/migrations/20260923150000_add_task_blocked_by/migration.sql`:
```sql
ALTER TABLE "Task" ADD COLUMN "blockedByTaskIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
```

**DTO/Entity** (`planning/domain/task.entity.ts` + `planning/application/task.service.ts`):
- `Task.blockedByTaskIds: readonly string[]`
- `TaskSummary.blockedByTaskIds: readonly string[]`
- `TaskDetail.blockedByTaskIds: readonly string[]` + hesaplanmış `isBlocked: boolean`
- `KanbanTaskSummary.isBlocked: boolean`
- `CreateTaskCommand.blockedByTaskIds?: readonly string[]`
- `EditTaskCommand.blockedByTaskIds?: readonly string[]`

## 4. Implementation Steps

### Step 1 — Prisma + migration
`schema.prisma` Task modeline `blockedByTaskIds String[] @default([])`; migration dosyası yukarıdaki gibi; `prisma generate`.

### Step 2 — API entity
`task.entity.ts`:
- `Task`, `TaskSummary`, `TaskDetail`'a `readonly blockedByTaskIds: readonly string[]` ekle.
- `TaskDetail` + `KanbanTaskSummary`'ya türetilmiş `readonly isBlocked: boolean`.

### Step 3 — API repository
`task.repository.ts` `createTask` / `updateTask`:
- alan giriş tiplerine `blockedByTaskIds: readonly string[]`
- INSERT/UPDATE data bloğuna `blockedByTaskIds: input.blockedByTaskIds`
- `toTaskSummary`/`toTaskDetail`/`toKanbanTaskSummary` eşlemesine `blockedByTaskIds` + `isBlocked` (summary: summary'daki bloke görevlerden biri `canonicalStatus !== 'COMPLETED'` ise).

`isBlocked` hesabı repository'de değil **application tarafında** yapılacak (çünkü bloğun durumunu bilmek için bloke eden görev durumları gerekir; tek sorguda join ile toplanır). -> repo `blockedByTaskIds`'i döndürür; `isBlocked`, `KanbanTaskSummary` DTO'sunda servis tarafında bir `Map<taskId, canonicalStatus>` ile hesaplanır.

### Step 4 — API servis (task.service.ts)
- `createTask`: `blockedByTaskIds` doğrulaması:
  - `self-reference` (kendi taskId'sini bloke ediyorsa) → `VALIDATION_ERROR`
  - döngü kontrolü (BFS): A bloke B'yi, B bloke A'yı → `VALIDATION_ERROR`
  - tüm id'ler geçerli (userId + lifecycle `ACTIVE` + `canonicalStatus`) → yoksa `VALIDATION_ERROR`
- `editTask`: aynı doğrulama + `blockedByTaskIds`'i güncelle.
- `getTaskDetail`/`list*`: `tasksListQuery`'ye bloke durumunu ekle (`blockedByTaskIds` toplanır, `isBlocked` hesaplanır).

### Step 5 — Web DTO + briefing + kanban
**Web tipleri** (`apps/web/src/features/tasks/task.detail.ts` / `task.summary.ts`) + OpenAPI client regen:
- `TaskDetail.dependency/blockedByTaskIds` + `isBlocked`
- `TaskSummary.blockedByTaskIds`
- `KanbanTaskSummary.isBlocked`

**Kanban kartı** (`kanban-task-card.tsx`, `kanban-v2` kartı, `status-kanban-board.tsx` kartı):
- `isBlocked` ise 🔒 **Bloke** rozeti + "🔗 N göreve bağlı".

**Today briefing** (`today-briefing.tsx`):
- briefing'e yeni bölüm: **"Seni bekleyen bağımlı görevler"** — `isBlocked` görevler listelenir (başlık). Bolse boşsa bölüm gizli.

**Odak kartı** (`next-action-card.tsx`):
- `remaining` prioriteleri hesaplanırken bloke olmayanlara öncelik; bloke olan görevler `isBlocked=true` gösterilir ama atlamaya neden olmaz (şu an briefing'te zaten "completedToday" vb. dışındayken sadece sıralama değişir).

**Görev formu** (`create-task-form.tsx` + `task-detail.tsx`):
- "Bağlı görevler" multi-select (mevcut kullanıcının `ACTIVE`/`TO_DO|IN_PROGRESS` görevleri arasından seçim) — create + edit.

### Step 6 — Testler
- **API unit:** create blooe + self-reference reddi + döngü reddi; edit güncelleme; getTaskDetail `isBlocked`.
- **API integration (api):** migration sonrası durchgehend blok rotası.
- **Web component:** kanban kart rozeti render; briefing bölümü render; form select alanı.
- Bozuk çıktı/regresyon yok: `pnpm lint`, `pnpm typecheck`, `pnpm build`, tailwind.

## 5. Files Touched

| Katman | Dosya | Açıklama |
| --- | --- | --- |
| DB | `apps/api/prisma/schema.prisma` | Task `blockedByTaskIds String[]` |
| DB | `apps/api/prisma/migrations/20260923150000_add_task_blocked_by/` | migration.sql |
| API | `apps/api/src/modules/planning/domain/task.entity.ts` | alan + türetilmiş `isBlocked` |
| API | `apps/api/src/modules/planning/application/task.service.ts` | DTO + doğrulama (self/döngü/geçerli id) + briefing |
| API | `apps/api/src/modules/planning/infrastructure/task.repository.ts` | create/update INSERT/UPDATE + summary |
| API | `apps/api/src/modules/planning/infrastructure/task.repository.ts` (kanban) | `KanbanTaskSummary.isBlocked` |
| Web | `apps/web/src/features/tasks/*` | DTO, form multi-select |
| Web | `apps/web/src/features/today/today-briefing.tsx` | "Seni bekleyen bağımlı görevler" |
| Web | `apps/web/src/features/kanban/*` (+ v2 + status) | 🔒 Bloke rozeti |
| Web | `apps/web/src/features/today/next-action-card.tsx` | bloke sıralaması |

## 6. Rollout order

1. Prisma migration + generate.
2. API entity + repository + service (doğrulama + briefing).
3. OpenAPI + client regen (web dtos).
4. Web form multi-select + briefing bölümü + kanban rozeti.
5. Testler + lint + typecheck + build → commit + push `opencode/develop`.

## 7. Riskler
- **Döngü izleme** MVP BFS ile sınırlı; çok derin zincirler (>50) MVP dışı.
- **`isBlocked` sorgu sayısı:** kanban listesi için tasarımda tek ek sorgu hedefi (N+1 yok) — `IN` join + `Map`.
- **Migration Postgres `TEXT[]`:** drizzle değil Prisma kullanıldığı için `String[]` → `TEXT[]`; uygunsuz env'de migration çalıştırmak için `prisma db push` yedek.
