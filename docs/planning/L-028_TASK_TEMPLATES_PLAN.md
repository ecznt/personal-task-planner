# L-028 — Görev Şablonları (Task Templates) Implementation Plan

| Field | Value |
| --- | --- |
| Slice | L-028 |
| Goal | Tekrar eden iş kalıplarını tek tıkla yeni Task olarak anında çoğaltma |
| Status | Uygulandı (2026-09-20) |
| Created | 2026-09-20 |
| Dependencies | L-007 (Checklist/Labels), L-025 (Quick Add), L-006 (Task CRUD) |

## 1. Story Goal

Kullanıcı sık kullandığı görev şablonlarını kaydedip (başlık, açıklama, öncelik, kontrol listesi, etiketler) her seferinde çiğden yazmak yerine seçip anında yeni bir Task elde etmek ister. Todoist (task/project templates), TickTick (task templates, slash-menu), Linear (issue templates) paritesi hedeflenir.

## 2. Acceptance Criteria

1. Kullanıcı bir Task şablonu tanımlar: `title`, `description`, `priority`, sıralı checklist adımları, önerilen etiketler, optional `defaultPlannedAtOffsetDays`.
2. Şablon uygulandığında yeni Task; seçilen Area + (opsiyonel) Project altında, şablon alanlarıyla, default status ile oluşturulur.
3. Uygulama sırasında oluşan Task, normal görev kurallarına (CSRF, Idempotency-Key, If-Match) uyar.
4. Şablonlar listelenir, güncellenir, silinir (owner-scoped, `version` ile).
5. Etiketler şablonda ad (name) ile tutulur; uygulama anında label DB'de bulunamazsa sessizce atlanır (name → id çözümleme).
6. `format:check`, `typecheck`, `lint`, unit, API, DB, component, contract green.

## 3. Scope

**Includes:**

- Yeni domain `TaskTemplate`: `userId`, `title`, `description`, `priority`, `checklistSteps[]` (sıralı string), `labelNames[]`, `defaultPlannedAtOffsetDays?`, `version`.
- API: `GET/POST/PATCH/DELETE /api/v1/task-templates`; `POST /api/v1/task-templates/:id/apply` (yeni Task oluşturur; areaId + projectId + optional plannedAt override alır).
- `apply` davranışı: `TaskService.createTask`'ı çağırır; checklist + label name→id çözümleme; `defaultPlannedAtOffsetDays` varsa `now + offset` ile plannedAt set edilir.
- Frontend: `/app/templates` yönetim sayfası (liste + oluştur/edit/delete + "Uygula"), şablon seçici (header quick-add'dan "Şablon" sekmesi).
- OpenAPI + api-client regen; unit/API/DB/component tests.

**Excludes:**

- Proje şablonları (Area + birden fazla Task + statuses; gelecek).
- Şablon kütüphanesi/import/export, paylaşım.
- Recurrence ile birleştirme (şablon → tek seferlik Task).
- Template variables/placeholders (örn. `{date}`) — v1 sade düz metin.

## 4. Design Notes

### 4.1 Schema

```prisma
model TaskTemplate {
  id                          String   @id @default(uuid()) @db.Uuid
  userId                      String   @db.Uuid
  title                       String
  description                 String?
  priority                    TaskPriority @default(MEDIUM)
  checklistSteps              String[] @default([])
  labelNames                  String[] @default([])
  defaultPlannedAtOffsetDays  Int?
  version                     Int      @default(1)
  createdAt                   DateTime @default(now()) @db.Timestamptz(3)
  updatedAt                   DateTime @updatedAt @db.Timestamptz(3)
  user                        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, updatedAt], map: "task_template_user_updated_idx")
  @@map("task_templates")
}
```

### 4.2 API contract

- `GET /api/v1/task-templates` → `{ data: TaskTemplateSummary[], meta: { nextCursor? } }` (cursor paging)
- `POST /api/v1/task-templates` (Idempotency-Key, CSRF) → 201 `TaskTemplateDto`
- `PATCH /api/v1/task-templates/:id` (If-Match, CSRF) → 200 `TaskTemplateDto`
- `DELETE /api/v1/task-templates/:id` (If-Match, CSRF) → 204
- `POST /api/v1/task-templates/:id/apply` body `{ areaId?, projectId?, plannedAt? }` (Idempotency-Key, CSRF) → 201 Task DTO; `areaId` zorunlu değilse Inbox/global kuralı (L-025 global quick-add gibi).

### 4.3 Label çözümleme

`labelNames` DB'de unique (owner-scoped). `apply` içinde:

```
labels = findLabels({ userId, names: template.labelNames })
attached = labels.filter(l => l !== null).map(l => l.id)
```

Bulunamayan isimler atlanır, hata üretilmez; görev adı korunur.

### 4.4 Frontend

- `/app/templates` — sidebar'a "Şablonlar" girdisi; liste + form (title, description, priority, checklist editor, label multi-select).
- "Uygula" → area/project seçim sheet (mevcut CreateTask form mantığı kullanılır).
- Header quick-add dialog'a "Şablon" sekmesi: şablon seçilince alanlar dolu gelir (apply endpoint çağrılır).

## 5. Implementation Steps

1. **DB (S1):** `TaskTemplate` migration + repo.
2. **API (S2):** domain/application/transport (controller, zod schema, DTO, mapper), `apply` servis yolu, OpenAPI/client regen, tests.
3. **Web (S3):** api-client tipleri, templates page + components, quick-add sekmesi, component tests.
4. **Docs:** plan + `BACKLOG.md` + `PROJECT_MASTER.md`.

## 6. Verification

- API: `typecheck`, `test:unit`, `test:api`, `test:db`, contract redocly lint.
- Web: `typecheck`, `lint`, Prettier, `vitest run`, ilgili e2e.
- `pnpm build`, `test:security`.

## 7. Decisions Recorded

- Label'lar şablonda **name** ile saklanır — silinen label durumunda bozuk referans sorununu önler (id tutulmayacak).
- Şablon = tek Task; "proje şablonu" gelecek slice olarak ertelendi.
- `apply` ayrı bir endpoint olur; mevcut `createTask` DRY bırakılır, şablon mantığı servis katmanında genişletilir.