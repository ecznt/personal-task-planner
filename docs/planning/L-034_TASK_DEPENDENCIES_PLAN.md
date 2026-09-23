# L-034 — Görev Bağımlılıkları (blocked-by)

> Slice #9 · Kapsam: **Orta (Block + görünürlük)**
> Durum: Tamamlandı |
> Created: 2026-09-23 |
> Branch: `opencode/develop`

## 1. Story Goal

Bir görevin başka görevlere **bağımlı** olmasını modelle: bağımlı olduğu görevler (`blockedBy`) tamamlanmadan görev "bloke" kabul edilsin. Kullanıcı bir görevi tamamlamak için önce hangi görevleri bitirmesi gerektiğini tek bakışta görsün (Today briefing + kanban kart + detector). Veri modeli + görünürlük MVP'si; otomatik `BLOCKED` lifecycle durumu gerekmez (bloke = türetilmiş görünüm).

## 2. Acceptance Criteria

1. `Task`'ın `blockedByTaskIds: string[]` (varsayılan boş) alanı; migration + Prisma şeması + API create/update DTO'suna girer.
2. Create/update'te **döngü engeli**: bir görev kendini (doğrudan veya dolaylı) bloke edemez → `VALIDATION_ERROR`.
3. `TaskSummary` + `TaskDetail`'a `blockedByTaskIds` türetilir; `isBlocked` (bloke görevlerden en az biri `COMPLETED` değilse true) her kart/listing'de hesaplanır.
4. Today briefing'de **"Seni bekleyenler" (blocked) bölümü**: bugün blocly görevler listelenir; boşsa bölüm gizlenir (görünür boşluk yok).
5. Kanban kartlarında "Bloke" rozeti: `isBlocked` kartında 🔒 + bağlı görev sayısı (küçük, `muted`).
6. Görev formu + görev detayında **bağlı görevler** yönetimi (çoklu seçim; sadece aynı user'ın `ACTIVE` görevleri).
7. Bu, `isLoading`/error-state'leri etkilemez; mevcut tüm testler geçer.

**Excludes:** Otomatik BLOCKED lifecycle durumu / state machine değişikliği, recurrence/kanban v2'de bloke sütunu, snippet DTO optimizasyonu, açıklama-doğrulamalı doğrulama. Web'de bir görev `blockedBy` liste & eklenti.

## 3. Files Touched (odağı: dry tek `TaskSummary` üretimi)

| Katman | Dosya | Değişiklik |
| --- | --- | --- |
| API domain | `planning/domain/task.entity.ts` | `Task.blockedByTaskIds`, `TaskSummary.blockedByTaskIds`, `TaskDetail.blockedByTaskIds`, `KanbanTaskSummary.isBlocked` |
| API application | `planning/application/task.service.ts` | `CreateTaskCommand`, `EditTaskCommand`'a `blockedByTaskIds?`; `createTask`/`editTask` içinde döngü kontrolü + bağımlı id'lerin `ACTIVE` + aynı user doğrulaması; summary üretimde `withStatus`'ta bloke setini çek |
| API infrastructure | `planning/infrastructure/task.repository.ts` | `createTask` INSERT + `updateTask` UPDATE kolonlarına `blockedByTaskIds`; `toTaskSummary`/`toTaskDetail`'a bağımlı status haritası |
| API prisma | `prisma/schema.prisma` + migration `20260923150000_add_task_blocked_by` | `Task.blockedByTaskIds String[]` |
| Web domain | `features/tasks/task-summary.ts` (veya kullanılan DTO) | `blockedByTaskIds`, `isBlocked` |
| Web UI | `features/kanban/kanban-task-card.tsx` (+kanban v2/v3 kart) | `isBlocked` → 🔒 "Bloke" rozeti |
| Web UI | `features/today/today-briefing.tsx` | "Seni bekleyenler" bloke bölümü |
| Web UI | `features/tasks/create-task-fields.tsx` / `create-task-form.tsx` + `task-detail.tsx` | bağlı görev çoklu seçici |
| Migration | yukarıdaki Prisma migration | |

## 4. Implementation Steps

### Step 1 — Prisma + migration
`schema.prisma` `Task` modeline:
```prisma
blockedByTaskIds String[] @default([])
```
Migration: `npx prisma migrate dev --name add_task_blocked_by` → `20260923150000_add_task_blocked_by` dizini oluşur (DB boş değil, production migration'ı). Ayrıca `prisma generate` + OpenAPI/client regen.

### Step 2 — API domain tipleri
`task.entity.ts`:
- `Task` + `TaskSummary` + `TaskDetail` arayüzlerine `readonly blockedByTaskIds: readonly string[];`
- `KanbanTaskSummary`'ya `readonly isBlocked: boolean;`

### Step 3 — API repository
`task.repository.ts`:
- `createTask` data bloğuna `blockedByTaskIds: input.blockedByTaskIds ?? []`
- `updateTask` data bloğuna `blockedByTaskIds: input.blockedByTaskIds ?? []`
- Summary/detail'e bloke eden task'ların `canonicalStatus`'larını çekip `isBlocked` hesapla.

### Step 4 — API service (doğrulama)
`task.service.ts` `createTask` ve `editTask`:
1. `blockedByTaskIds` belirtilmişse: hepsini tek sorguyla çek (`userId` + `id IN (...)`, lifecycle `ACTIVE`).
2. Yoksa → `VALIDATION_ERROR`.
3. **Döngü engeli:** bağımlı id'ler içinde kendi `taskId` varsa → `VALIDATION_ERROR` ("kendi kendine bloke"); dolaylı döngü MVP'de DFS/BFS ile (n≤50) — `follow blockers transitively`, `taskId`'ye ulaşma → hata.
4. `blockedByTaskIds = []` → temizle.

**Not (MVP kararı):** döngü kontrolü BFS'i `n` kez çalıştırmak yerine tek seferlik geçişli `Set` ile; derinlik sınır 20.

### Step 5 — Web DTO + briefing
- web DTO `blockedByTaskIds` + `isBlocked` taşır.
- `today-briefing.tsx`: briefing'te briefing'ten sonra **"Seni bekleyenler"** başlıklı blok: bugün listelenen görevlerden `isBlocked` olanları `<li>` olarak göster (title + 🔒). Bölüm boşsa hiç render etme.
- Kanban kartlarına rozet (`kanban-task-card.tsx` ve varsa list-view kartları): `{task.isBlocked && <Badge>🔒 Bloke</Badge>}`.

### Step 6 — Web form
- `create-task-fields.tsx` / create dialog'u: "Bağlı görevler" multi-select (mevcut görev araması — basit: sadece `<select multiple>` + geçerli `plannedAt`).

### Step 7 — Testler + doğrulama
- API: unit (DTO akışı) — create blocked + logged-in; döngü engeli (A→B→A); `COMPLETED` bloke eritir (isBlocked=false).
- Web: briefing "Seni bekleyenler" bölümü + kanban rozeti.
- `pnpm --filter @planner/api test:unit && test:api`, web vitest full suite, lint, build.
- OpenAPI/client determinism hash güncellenir.

## 5. Rollout order (slice'ı kırma — istekler dışında internet aradeği)

1. Prisma migration + generate.
2. API entity + repo + service lambda (create/edit bloke + BFS döngü).
3. OpenAPI/client regen.
4. Web DTO + briefing bölümü + kanban rozeti + form seçici.
5. Testler + lint/build → commit + push `opencode/develop`.

## 6. Riskler
- **Dolaylı döngü MVP'si (BFS) yanlış pozitif:** sınırlı derinlik + sadece blokaj ilişkisinde. Test edilir.
- **Çoklu-ziyaret DB sorgusu:** sadece create/update'ta, tek sorgu + Set; listing'lerde yeni sorgu yok (summary'a derlenecek bloker statusu en fazla 1 sorgu).
- **Prisma `String[]` tahmini:** Pg `text[]`; uyumsuzlukta `@db.VarChar` değil `text[]` kullan.
