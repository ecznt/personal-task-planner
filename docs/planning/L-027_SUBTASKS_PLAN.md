# L-027 — Alt Görevler (Sub-tasks / Nested Tasks) Implementation Plan

| Field | Value |
| --- | --- |
| Slice | L-027 |
| Goal | Gerçek görev hiyerarşisi: bir görevin altında, kendi tarih/öncelik/etiket/status'ü olan başka Task'lar |
| Status | Planlı — uygulanmadı |
| Created | 2026-09-20 |
| Dependencies | L-006 (Task CRUD), L-007 (Checklist/Labels), L-009 (List), L-010 (Today), L-026 (Kanban v2) |

## 1. Story Goal

Mevcut `ChecklistItem` yalnızca "adım" (tarihsiz satır) sunar; bir görevin altında kendi `plannedAt`/`dueAt`/`priority`/`labels`/`areaStatusId`'sine sahip bağımsız Task'lar kurulamaz. Bu slice, Todoist/TickTick/MS To Do/Linear'da standart olan **gerçek alt görev** modelini getirir: parent Task altında ağaç sıralaması, List/Today/Kanban görünümlerinde hiyerarşi, ve parent'ta tamamlanan alt görev ilerlemesi.

## 2. Acceptance Criteria

1. Bir Task başka bir Task'ın altına taşınabilir; alt görev, parent ile **aynı Area** içinde kalır (Area değişince invariant korunur).
2. Görünümler (List, Today, Upcoming, Calendar, Kanban) alt görevi parent'ın altında iliştirilmiş/rolleriyle gösterir.
3. Alt görev kendi dates/priority/labels/using/status/reminder/recurrence alanlarını korur; parent'ın kapatılması alt görevleri otomatik kapatmaz.
4. Parent Task DTO'su `subtaskCount` ve `completedSubtaskCount` döner; List/Kanban kartı ilerlemeyi gösterir.
5. Parent arşivleme/çöpe atma **alt görevlere cascade olur** (mevcut lifecycle-provenance kuralı); restore tersini düzeltir.
6. Ağaç derinliği tek seviyeyle sınırlanır (alt görevin altı olmaz) — v1 karmaşıklık sınırı.
7. `format:check`, `typecheck`, `lint`, `test:unit`, `test:api`, `test:db`, `test:component`, contract/openapi regeneration green.

## 3. Scope

**Includes:**

- `Task.parentTaskId` self-relation + `@@index` ; cascade ve orphaning kuralları.
- API: `POST /tasks` + `PATCH /tasks/:taskId` `parentTaskId` kabulü; `GET /tasks/:taskId` alt görev özeti; parent taşıma/kapama kuralları; TaskSummary + KanbanTaskDto'ya `parentTaskId`, `subtaskCount`, `completedSubtaskCount`.
- List/Today/Calendar/Upcoming/Kanban DTO'larında alt görev rollup'ı.
- Frontend: task-inspector'da "Alt görev ekle", liste/karton alt görev rozetleri, parent progres bar.
- Parent arşiv/trash → alt görev cascade (mevcut `lifecycle.service` mantığına subtask-provenance eklenir).
- OpenAPI + api-client regeneration; unit/API/DB/component tests.

**Excludes:**

- Çok seviyeli iç içe (torun görev) — tek seviye.
- Alt görevlerin kendi içinde sıralanması (sıralama bu slice'ta yok).
- Parent görev tamamlandığında alt görevlerin otomatik completion'ı.
- Subtask için ayrı "sections" kavramı.
- Drag ile alt göreve dönüştürme; sadece explicit form/şema alanı.

## 4. Design Notes

### 4.1 Schema

```prisma
taskId         String?  @db.Uuid
parentTask     Task?    @relation("SubtaskHierarchy", fields: [parentTaskId], references: [id], onDelete: Restrict)
subtasks       Task[]   @relation("SubtaskHierarchy")
parentTaskId   String?  @db.Uuid
@@index([userId, parentTaskId], map: "task_user_parent_idx")
```

- `onDelete: Restrict`: parent kalıcı silinirse alt görevler de lifecycle üzerinden ayrıca hak edilir; veritabanı düzeyinde orphan bırakmaz.
- Derinlik engeli **application katmanında** ($`parentNode.parentTaskId === null` şartı) — DB kısıtı eklenmez (v1).

### 4.2 Invariants

- `subtask.areaId === parent.areaId` (Area taşıma doğrudan olmadığı için proje/alan invariant otomatik korunur; Proje taşınırken `moveProject` parent/alt arası kopmaları validate eder).
- `subtask.parentTaskId ≠ subtask.id`; chain null (tek seviye).
- Parent tamamlandığında alt görev `ACTIVE` kalır; parent `ARCHIVED/TRASHED` ise alt görevler `TO_DO`→`ARCHIVED`/`TRASHED` provenance `SUBTASK_CASCADE` ile; restore parent'a bağlı alt görevleri sadece kendi cascade kaydıyla döndürür.

### 4.3 API shapes

- `POST /api/v1/tasks` body: mevcut alanlara + `parentTaskId?`
- `PATCH /api/v1/tasks/:taskId` body: + `parentTaskId` (null → köke taşı; farklı Area altında taşımaya izin verilmez — 422 `INVALID_PARENT`)
- `GET /api/v1/tasks/:taskId` `data`: + `parentTaskId`, `subtaskCount`, `completedSubtaskCount`
- `TaskSummary` + `KanbanTaskDto`: + `parentTaskId`, `subtaskCount`, `completedSubtaskCount`

### 4.4 Rollup mantığı

- List/Kanban: alt görevler parent kartın altında tek satır/kart olarak gruplanır; parent kartta `${completed}/${total}` rozeti.
- Today/Upcoming/Calendar: alt görevler kendi tarihlerine göre görünür; parent da görünür (kendi tarihi varsa). Sadece "leaf" görev "today" sayılır; parent sadece kendi dueAt'i ile.
- Passthrough: tüm sorgular `subtasks: { where: { lifecycleState: ACTIVE }, orderBy: {...} }` include'u yürütür.

## 5. Implementation Steps

1. **DB (S1):** `parentTaskId` migration + index + `task.repository` include/select güncellemeleri + `test:db` buildWhere örnekleri.
2. **API (S2):** domain entity + task.service `createTask`/`editTask` parent validasyonu, moveNode parent/area kontrolü, DTO genişletme, KV rollup sorguları, `lifecycle.service` subtask-cascade, OpenAPI/client regen, unit/API/contract tests.
3. **Web (S3):** DTO tipleri (api-client), task-inspector "Alt görev ekle", List/Kanban/Today kart rozetleri ve progres, parent tamamlandı mesajı, component tests.
4. **Docs:** bu plan + `BACKLOG.md` + `PROJECT_MASTER.md` (document index + DEC girdisi).

## 6. Verification

- API: `typecheck`, `test:unit`, `test:api`, `test:db` (testcontainers), OpenAPI + `redocly lint`, api-client regen.
- Web: `typecheck`, `lint`, Prettier, `vitest run`, ilgili Playwright e2e (`tests/e2e/*`).
- `pnpm build`, `pnpm test:e2e` hedefli çalıştırma, `test:security` (yeni invalidation/CSRF yüzeyi yok beklenir).
- Not: belirtilen Node 24.18.0 pin + `--config.engine-strict=false` notu L-026'da belgelendiği gibi uygulanır.

## 7. Decisions Recorded

- Tek seviye derinlik (toruna kapalı) — orman kurallarını ve cascade karmaşıklığını sınırlar (Lean felsefesine uyum).
- Subtask cascade `SUBTASK_CASCADE` provenance'ı mevcut lifecycle sistemiyle çakışmaz; restore yalnızca kendi efektlerini geri alır.
- Parent completion alt görevleri kapatmaz — Todoist paritesi; kullanıcının niyetine bırakılır.
- `onDelete: Restrict` + application-level derinlik koruması; DB'de complex trigger yok.