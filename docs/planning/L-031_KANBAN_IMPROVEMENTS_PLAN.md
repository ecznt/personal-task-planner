# L-031 — Kanban Geliştirme: Alan Board İyileştirmesi + Proje Bazlı Kanban

| Field | Value |
| --- | --- |
| Slice | L-031 |
| Goal | Mevcut Alan Kanban'ı iyileştir + her Proje için kendi Kanban board'unu ekle |
| Status | Planlı — uygulanmadı |
| Created | 2026-09-20 |
| Dependencies | L-012 (Area Kanban), L-026 (Kanban v2), L-008 (Projects) |

## 1. Story Goal

Kullanıcı bir Projeye odaklanmak istediğinde yalnızca Area board'a erişebiliyor; `/app/projects/[projectId]` sayfasında Kanban görünümü yok. Bu slice iki şeyi teslim eder:

1. **Alan Kanban iyileştirmeleri:** mevcut Area board'un eksik/fricke parçaları (URL-persist filtre paritesi, ilgili DTO/kart nitelikleri, kolaylıklar) bir pasla kapatılır.
2. **Proje Kanban (yeni):** project-scoped Kanban endpoint'i + proje sayfasında list/kanban toggle, Area board ile aynı toolbale/dnd/behaviouru paylaşır.

## 2. Acceptance Criteria

1. `GET /api/v1/projects/:projectId/kanban` — proje altındaki ACTIVE Task'ları ilgili Area'nın `canonicalStatus` gruplarına (TO_DO/IN_PROGRESS/COMPLETED) göre döner; `q`, `priority`, `labelId` filtreleri tanır; enriched `KanbanTaskDto`.
2. `POST /api/v1/projects/:projectId/kanban-moves` — görevi status grupları arasında taşır; If-Match + optimistic; `targetAreaStatusId` ile Area paritesi (proje → tek Area'dır).
3. `/app/projects/[projectId]` sayfasında **Liste / Kanban** geçişi; Kanban'da draggable kartlar + toolbar (q/priority/label) + boş kolonlar.
4. Alan Kanban iyileştirmeleri:
   - Area board filtreleri global board gibi **URL'e persist** edilir (`/app/areas/:id?q=&priority=&labelId=&projectId=`) — global paritesi.
   - Area board'da toolbale her kolon başı `count` korunur; kart DTO'su `areaName` farkı giderilir (proje ile aynı zenginlikte).
5. Area ve Proje board'ları ortak toolbar/kart/dnd bileşenlerini paylaşır (tek implementasyon).
6. OpenAPI + api-client regen; unit/API/DB/component/e2e green.

## 3. Scope

**Includes:**

- Yeni endpoint'ler: project kanban list + moves.
- Repo: proje-scoped kanban sorgu (owner-isolation), enriched DTO, If-Match döngüsü.
- Web: `/app/projects/[projectId]`'de view toggle (area-detail deseni kopyalanır), `useKanbanBoardFilters`'a `mode:'url'  proje board'u.
- Alan iyileştirme: URL persistence + ortak kart/toolbar refactor (action + tip zenginliği).
- OpenAPI/client regen, testler.

**Excludes:**

- Proje board'unda özelleştirilmiş status/kanban sütunları (her Area kendi status'lerini zaten tanımlıyor; proje board kendi Area'sının canonical gruplarını gösterir — proje `areaStatusId`-bazlı motion yok).
- Column collapse, WIP limit, intra-column reorder (L-026 dışarıda bıraktığı gibi korunur).
- Proje → global board'a benzer başka bir agrege görünüm.
- Sub-task (L-027) ile etkileşim — bu slice'ta parent/child board davranışı tanımlanmaz, L-027'ye bırakılır.

## 4. Design Notes

### 4.1 API contract

**List**

```
GET /api/v1/projects/:projectId/kanban?q=&priority=&labelId=&timezone=
```

- Owner-isolation: `project.userId === session.userId`; ayrıca ACTIVE proje şartı.
- Gruplama: `canonicalStatus` (Task → areaStatus → canonical). Geçerli timezone param opsiyonel (sadece date-state gerekiyorsa; kanban'da kullanılmaz).
- Yanıt `KanbanResponseDto` (L-026), enriched `KanbanTaskDto` (labels, project, areaName, version, dates, areaId).

**Moves**

```
POST /api/v1/projects/:projectId/kanban-moves
{ taskId, targetAreaStatusId }   ; If-Match: <task.version>
```

- Proje tek Area'ya bağlı olduğundan `targetAreaStatusId` Area status id'si, Area board ile aynı mantık; grup (TO_DO/IN_PROGRESS/COMPLETED) status'tan çözülür.
- If-Match yoksa 428 (area controller paritesi); `targetAreaStatusId` projenin Area'sına ait değilse 422 `INVALID_TARGET_STATUS`.

### 4.2 Repository

- `listProjectKanbanTasks(userId, projectId, filters)` → kanban grubu `groupBy canonicalStatus` + enriched include (labels, project, area).
- `buildKanbanWhere` L-026'dan yeniden kullanılabilir; sadece `projectId` sabitlenir, `areaId`/`projectId` param SI çıkarılır.

### 4.3 Frontend

- `ProjectDetail`'e `view` state (`'list'|'kanban'`) + buton; `area-detail.tsx:43` deseni.
- Ortak `KanbanToolbar` + `KanbanTaskCard`; area board `useKanbanBoardFilters({ mode:'url' })`'a geçer; proje board aynı hook'u local veya URL parametresiyle (area ile tutarlı URL tercih edilir).
- Proje board dnd: L-026 `DragDropProvider` doğrudan kullanılır; moves endpoint'i proje-scoped'a işaret eder.

### 4.4 Area iyileştirmeleri (somut liste)

- Filtreler URL'e persist (`?q=&priority=&labelId=&projectId=`) — deep-link + geri tuşu.
- Kart DTO'sunda `areaName`/`project` zenginliği area board'da da garanti edilir (parity, tek dto).
- Eşlenen query key prefix: `['areas', areaId, 'kanban', ...]` — mevcut invalidation korunur.

## 5. Implementation Steps

1. **API (S1):** repo `listProjectKanbanTasks` + move servis; controller + schemas + DTO genişletme, If-Match/CSRF, OpenAPI + api-client regen, tests (DB/service/contract).
2. **Web (S2):** proje sayfası toggle + board, ortak toolbar/kart, area URL-persistence, component tests.
3. **Web (S3):** optimistik drag ile proje kanban-moves; e2e.
4. **Docs:** bu plan + `BACKLOG.md` + `PROJECT_MASTER.md`.

## 6. Verification

- API: `typecheck`, `test:unit`, `test:api`, `test:db` (proje-scoped kanban + parite), contract.
- Web: `typecheck`, `lint`, Prettier, `vitest run`, live-stack e2e (proje kanban load + drag move).
- Area board regression: mevcut area e2e spec'i URL filtresiyle koşar.

## 7. Decisions Recorded

- Proje board **Area'nın canonical status gruplarını** kullanır (proje → tek Area; özel proje status'leri yok) — L-020'daki Area status modeliyle tutarlı ve en az kod yüzeyi.
- Area filtreleri URL-persist'e geçer; global board ile parite — kullanıcı sayfa dışındayken filtre kaybolmaz.
- DnD/optimistic/kart/toolbar tüm board'larda tek implementasyon (DRY) — proje board Area bazlı akışa mirasçıdır.