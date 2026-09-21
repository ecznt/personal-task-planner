# L-029 — Erteleme / Snooze (Task + Reminder) Implementation Plan

| Field | Value |
| --- | --- |
| Slice | L-029 |
| Goal | Görev tarihlerini ve tetiklenmiş hatırlatıcıları tek eylemle ertesi zaman aralığına alma |
| Status | Tamamlandı |
| Created | 2026-09-20 |
| Completed | 2026-09-21 |
| Dependencies | L-010 (Today), L-018 (in-app notifications), L-026 (Kanban v2), Reminder worker |

## 1. Story Goal

Kullanıcı bugün/yakında görünen bir görevi (Today, Upcoming, Calendar, List) tek eylemle "yarına" (veya +15dk/+1gün/+3gün) taşıyabilmeli; tetiklenmiş bir in-app hatırlatıcıyı/bildirimi "snooze"larken görevin planlanmasını bozmadan erteleyebilmeli. Sunsama (`D` = move one day), TickTick (postpone), Linear (reminder snooze) paritesi hedeflenir.

## 2. Acceptance Criteria

1. Today/Upcoming/Calendar/List'te bir görevin "Ertele" eylemi: `plannedAt`/`dueAt`'ı seçilen aralığa öteler (offset tipi + amount), aralarındaki göreli mesafe korunur.
2. Bir in-app Notification'da "Snooze" butonu: ilgili TaskReminder'ı yeni `scheduledAt`/`atTime`'a taşır, `state`'ini `SCHEDULED`'a çevirir; mevcut Notification `READ`→ yeni zaman için yeni reminder emri; görev dates değişmez.
3. Snooze actionları CSRF + If-Match (task `version`) + Idempotency-Key gerektirir; eşzamansız double-click tolere edilir.
4. Ertelenen etkileşimler güvenli: worker `SKIP LOCKED` ile yeni schedule'ı işler; eski tetiklenmiş state geri dönmez.
5. `format:check`, `typecheck`, `lint`, unit, API, DB (testcontainers), component, contract green.

## 3. Scope

**Includes:**

- API:
  - `POST /api/v1/tasks/:taskId/snooze-actions` body `{ target: 'PLANNED'|'DUE'|'BOTH', amount, unit: 'MINUTES'|'HOURS'|'DAYS' }` (task-date erteleme).
  - `POST /api/v1/tasks/:taskId/reminders/:reminderId/snooze-actions` body `{ amount, unit }` (reminder erteleme).
- Domain: snooze cost'u hesaplayan saf fonksiyon; `plannedAt`/`dueAt` offset'i ayrı ayrı, kalan mesafeyi koruyarak.
- Frontend: Today/Upcoming/Calendar/List kartlarında "Ertele" (dropdown; +15dk/+1sa/+1gün/+3gün/+1hafta); notification action'ında "Snooze"; `D` kısayolu (Today'de).
- Worker uyumluluğu: reminder erteleme, mevcut `reminder-notification-scheduler` akışına uyar (state dönüşü + yeni schedule).
- OpenAPI + api-client regen; unit/API/DB/component tests.

**Excludes:**

- Web Push bildiriminin tarayıcı içi snooze'u (SW timer yok; push zaten gönderilmişse geri alınamaz — sadece in-app notification üzerinden erteleme).
- Görev "karmaşık yeniden planlama" (örn. recurrence serisinin tamamını öteleme).
- Kalıcı "snoozed" durumu (state makinesine yeni durum eklenmez; yalnızca zaman ötelenir).

## 4. Design Notes

### 4.1 Task-date erteleme

`target: 'BOTH'` kullanıldığında:

```
plannedAt' = plannedAt + delta
dueAt'     = dueAt + delta
```

yani ikisi de aynı delta ile kayar ve `dueAt - plannedAt` sabit kalır. Tek alan seçilirse sadece o alan kayar.

- `unit` enum: `MINUTES | HOURS | DAYS`; `amount` 1..365.
- Snooze sonrası `task.version` increment olur; yanıt yeni ETag ile döner.

### 4.2 Reminder erteleme

`TaskReminder.state` `TRIGGERED` ya da `SCHEDULED` ise snooze edilebilir:

```
newScheduledAt = (state === TRIGGERED) ? now + delta : scheduledAt + delta
```

- `anchorType`/`ruleType` korunur; `AT_TIME` ise `atTime` güncellenir; state → `SCHEDULED`.
- Mevcut `Notification` (TRIGGERED'a bağlı) → `READ` işaretlenir; yeni zamanda worker yeniden Notification/Web-Push oluşturur (BACKLOG L-018 + DEC-106 kuralı).
- Unique constraint `@@unique([taskId, anchorType, ruleType, offsetMinutes, atTime])` korunur; art arda aynı hedefe snooze → 409 `DUPLICATE_REMINDER`.

### 4.3 Frontend akışı

- `useTaskSnooze` hook'u: varsayılan `target: 'BOTH'`, seçimli dropdown; optimistic olarak `task.plannedAt/dueAt`'ı öteler, rollback `onError`.
- Notification "Snooze" → reminder endpoint; optimistik `READ` + ileride görünecek.
- `D` kısayolu yalnızca Today sayfasında fokuslu karta uygulanır (mevcut `use-keyboard-shortcut.ts` paritesi).

## 5. Implementation Steps

1. **API (S1):** domain helper (`snoozeDates`, `snoozeReminderAt`), task.service + reminder.service metotları, controllers + schemas + DTOs, OpenAPI/client regen, unit + API + DB tests.
2. **Web (S2):** api-client tipleri, `useTaskSnooze`/`useReminderSnooze`, kart dropdown "Ertele", notification "Snooze", `D` kısayolu, component tests.
3. **Docs:** plan + `BACKLOG.md` + `PROJECT_MASTER.md`.

## 6. Verification

- API: `typecheck`, `test:unit`, `test:api`, `test:db` (reminder-scheduler concurrency), contract lint.
- Web: `typecheck`, `lint`, Prettier, `vitest run`, hedefli e2e (Today snooze → yarın görünür).
- Worker integration: testcontainers ile `reminder-notification-scheduler`'ın yeniden scheduled reminder'ı tetiklemesi.

## 7. Decisions Recorded

- Snooze kalıcı state eklemez; yalnızca zaman öteler (lean, mevcut state makinesine dokunmaz).
- Push bildirimi geri çekilemez; push tabanlı "snooze" servis için yapılmaz, in-app notification üzerinden çözülür.
- Task-date snooze, `BOTH` varsayılanında aralarındaki farkı korur — kullanıcının planlama niyeti bozulmaz.