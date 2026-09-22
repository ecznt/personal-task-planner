# L-032 — Takvim Sürükleme-Rozomlama + Görev Süresi

| Field | Value |
| --- | --- |
| Slice | L-032 |
| Goal | Görevlere `durationMinutes` (süre) ekle + Takvim'de görev çipini günden güne sürükleyerek taşı (reschedule) |
| Status | Tamamlandı — uygulandı (2026-09-21) |
| Created | 2026-09-21 |
| Dependencies | L-011 (Takvim), L-020 (Area Status), L-026 (Kanban dnd), L-031 (shared board) |

## 1. Story Goal

Kullanıcı takvimde bir görevin kaç dakika süreceğini görebilmek ve gününü değiştirebilmek ister. Bu slice iki şeyi teslim eder:

1. **Görev süresi (`durationMinutes`):** DB + API (create/edit) + web (oluşturma formu, gün-hızlı ekleme, görev detayı, takvim çipi) boyunca yeni opsiyonel alan; takvim/upcoming/today/kanban/liste yanıtlarında taşınır.
2. **Takvim sürükle-rozomlama:** takvim aylık ızgarasında görev çipi hedef gün hücresine sürüklenince `plannedAt` günü, mevcut saat korunarak değişir (If-Match + optimistic).

## 2. Acceptance Criteria

1. `Task.durationMinutes` kalıcı alanı; `POST /api/v1/tasks`, `POST /api/v1/areas/:areaId/tasks`, `PATCH /api/v1/tasks/:taskId` ile yazılır/silinir (`1..1440` aralığı doğrulanır).
2. Tüm görev yanıtları (global/upcoming/calendar/today/kanban/detail/create/edit/move/snooze) `durationMinutes` döner.
3. Takvim çipinde `plannedAt` saati + süre görünür (örn. "09:00 · 45dk"); süre yoksa yalnızca saat.
4. Görev çipini hedef güne sürükleyince `plannedAt` günü değişir, **saat korunur**; loading/optimistic; hata halinde geri alınır.
5. Süre, gün-hızlı ekleme ve detay paneli (InlineNumber) ile düzenlenebilir.
6. OpenAPI + api-client regen; unit/API/component/contract green.

## 3. Scope

**Includes:**

- DB: `Task.durationMinutes Int?` + migration.
- API: domain `Task`/`TaskSummary`, zod create/edit schema, commands, repo (create/update + 6 summary mapping), DTO'lar, controller literal'leri, kanban mapper.
- Web: `task-schema` (create/edit), `create-task-fields` (Süre field), `day-quick-create-dialog` (Süre input), görev detayı `InlineNumber`, takvim çipleri + dnd reschedule.
- OpenAPI/client regen, testler.

**Excludes:**

- Zaman aralığı çakışma tespiti / gün çoklu-görev layout (agenda view), süre planlama (auto-schedule), draggable resize (çip sağ kenarından süre uzatma) — sonraki slice adayları.
- Bandlar/bölge (günde birden çok zaman bandı çizimi) — grid korunur.

## 4. Design Notes

### 4.1 API contract

- `durationMinutes: int (1–1440), nullable` — create/edit body'lerine opsiyonel; sanitize: `null` ile silme, `undefined` = değişmiyor.
- DTO'lar: `TaskDataDto`, `TaskSummaryDto`, `TodayTaskSummaryDto`, `CalendarTaskSummaryDto`, `KanbanTaskDto`, `CreateTaskRequestDto`, `EditTaskRequestDto` — her biri `@ApiProperty({ type: Number, required: false, minimum: 1, maximum: 1440 })`.
- Reschedule tek PATCH `plannedAt` ile yapılır (yeni gün + mevcut saat) — yeni endpoint yok; If-Match `version` mevcut akış.

### 4.2 Repository

- `createTask` input + insert `data`'ya `durationMinutes`.
- `updateTask` input tipine `durationMinutes: number | null | undefined` + `if (input.durationMinutes !== undefined)` koruması (mevcut alan deseni).
- TaskSummary üreten 6 literal: `listByArea`(:368), `listGlobal`(:608), `findTodayTasks`(:686), `findUpcomingTasks`(:741), `toKanbanTaskSummary`(:886), `searchTasks`(:1332) → `durationMinutes: task.durationMinutes`.
- Tüm sorgular `select` kullanmadığından kolon otomatik döner; post-write `findUnique` tam satır — DTO'ya eklemek yeterli.

### 4.3 Frontend

- Takvim dnd: L-026/L-031 `@dnd-kit/react` deseni — `DragDropProvider` (PointerSensor + KeyboardSensor), her çip `useDraggable` (data `{taskId, version, plannedAt}`), her gün hücresi `useDroppable` (id = date key). Drop → `PATCH /api/v1/tasks/:taskId` `{ plannedAt }` (hedef gün `T` + kaynak `plannedAt` saat z; yoksa `T09:00`), `If-Match: version`. Optimistic olarak cache'de gün grupları arası taşınır; hata → geri alınır.
- Çip: `plannedAt` saat başına `formatTime` (tr-TR HH:mm) + `durationMinutes` varsa `· 45dk` rozeti.

## 5. Implementation Steps

1. **DB (S1):** `schema.prisma` `durationMinutes Int?` → `prisma migrate dev --name add_task_duration_minutes` → `generate`.
2. **API (S2):** entity, schema, command'ler, repo, dto, controller, mapper; api test factory'lerine alan; calendar/upcoming DTO assertion.
3. **Web (S3):** `task-schema` + form + quick-add + inspector + takvim çipi/dnd; component testleri (chip render, cache-optimistic unit, patch çağrısı).
4. **Contract (S4):** `test:contract` (openapi + api-client regen), web typecheck/lint/prettier, `test:unit`/`test:api`/`test:component`, build.
5. **Docs (S5):** BACKLOG + PROJECT_MASTER + bu plan. Commit + push `opencode/develop`.

## 6. Verification

- API: `typecheck`, `test:unit` (create/edit/calendar durationMinutes devri), `test:api` (calendar DTO), contract deterministik.
- Web: `typecheck`, `lint`, Prettier, `vitest run` (calendar-view, task-schema, quick-add, inspector).
- Regression: mevcut kanban/takvim/upcoming spec'leri yeşil.

## 7. Decisions Recorded

- `durationMinutes` repoya **zorunlu alan tipi** (`number | null`) olarak eklenir; api/test factory'leri güncellenir (opsiyonel değil) — tüm assembly noktaları typecheck ile zorlanır.
- Reschedule **gün-anlık**: sürükleme saat değiştirmez (agenda/time-grid yok); saat korunur, yoksa 09:00.
- DnD kalıtımı `@dnd-kit/react`; keyboard sensor dahil (çipler yine de tıklanınca inspector açar).
- `durationMinutes` kanban DTO'suna da taşınır (parity) ancak kanban UI'sinde gösterilmez — F-04 kapsamında takvim çipinde gösterilir.

## 8. Delivered Scope (2026-09-21)

- **DB (S1):** `Task.durationMinutes Int?` (after `dueAt`) + migration `20260921110906_add_task_duration_minutes`, applied; Prisma client regenerated.
- **API (S2):** `Task`/`TaskSummary` entities gain `durationMinutes: number | null` (required in domain — all assembly points enforced via typecheck); zod create/edit schemas add `durationMinutes: int 1..1440, nullable, optional`; `CreateTaskCommand`/`EditTaskCommand` carry it (`null` clears, `undefined` unchanged); repo create input + insert data, `updateTask` guarded passthrough, 6 summary literals; `TaskDataDto`, `TaskSummaryDto`, `TodayTaskSummaryDto`, `CalendarTaskSummaryDto`, `KanbanTaskDto`, `CreateTaskRequestDto`, `EditTaskRequestDto` all expose the field; task/area/project/task-template controller response literals and kanban mapper updated. All api unit (172) + api (157) + typecheck green.
- **Web (S3):** `task-schema` create/edit gain the field; `create-task-fields` "Süre (dk)" number input (1–1440, step 5); `day-quick-create-dialog` "Süre (dk)" input + create body; `inline-field` new `InlineNumber` (Enter/blur commit, Esc cancel, 1–1440 guard); `task-inspector` "Süre (dk)" row via `InlineNumber`; `calendar-view.tsx` rewritten with `@dnd-kit/react` drag-reschedule — `DraggableCalendarTask` (PointerSensor distance 4 + KeyboardSensor), `DroppableCalendarDay`, chip shows `formatTime(plannedAt)` + `· Xdk` badge, `PATCH /api/v1/tasks/:taskId { plannedAt }` (hedef gün + kaynak saat, yoksa `T09:00`) with If-Match + optimistic cache move/rollback/toasts. Component tests 245/245, web typecheck/lint/build green; contract deterministic.
- **Docs (S5):** BACKLOG row L-032 added under §6a; this plan finalized.