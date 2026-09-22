# L-033 — Today Delight Üçlüsü: Gün Özeti + Kutlama + Haftalık İstatistikler

| Field | Value |
| --- | --- |
| Slice | L-033 |
| Goal | Today'e üç "günlük keyif" özelliği ekle: **Gün Özeti** briefing kartı, görev tamamlayınca **confetti + progress ring** kutlaması ve **haftalık tamamlanan istatistikleri** bar chart |
| Status | Tamamlandı — uygulandı (2026-09-22) |
| Created | 2026-09-22 |
| Dependencies | L-011 (Takvim), L-014 (Today view), L-020 (Area Status), L-026 (Kanban move), L-032 (reschedule) |

## 1. Story Goal

Today sayfası şu ana kadar "iş listesi" gibiydi: bölümler + checkbox'lar. Kullanıcı, planlama ritüelini güçlendiren ve tamamlama hissi veren küçük bir "delight" dokunuşu istedi. Bu slice üç bileşeni Today'e ekler:

1. **Gün Özeti (briefing):** sayfanın tepesinde selamlama + rozetler (gecikmiş/planlı/bitiş/tamamlanan) + progress ring + günün en önemli 3 görevi (priority + overdue öncelikli).
2. **Tamamlama kutlaması:** Today'de bir görev `COMPLETED` hedefine taşınınca 32 parçacıklı kütüphanesiz confetti patlaması (WAAPI, reduced-motion'da kapalı).
3. **Haftalık istatistikler:** son 7 günün güne-bazlı tamamlanan görev sayısı bar chart'ı; bugün vurgulu.

## 2. Acceptance Criteria

1. `GET /api/v1/tasks/statistics/weekly?timezone=Europe%2FIstanbul` son 7 günü (bugün dahil) `{ date, count }` olarak döner; `totalCompleted` toplama değer. Doğrulama: `timezone` optional, default `Europe/Istanbul`; geçersiz timezone → 400.
2. İstatistik, `ACTIVE` + `areaStatus.canonicalStatus = COMPLETED` görevlerin `updatedAt` gününe göre sayılır (datastore'daki yerleşik "tamamlama" işaretleyicisi; `completedAt` kolonu hiçbir yerde yazılmaz).
3. Today tepesinde briefing; görev yoksa gizlenir (EmptyState'e değil, mükerrer "görev yok" olmasın diye).
4. Görev `COMPLETED` hedefine move edilince confetti tetiklenir; `prefers-reduced-motion: reduce` ise hiç çalışmaz.
5. Progress ring `role="progressbar"` ile erişilebilir; bari %100 olunca diferansiyel tamam.
6. Web component + API unit/api + contract deterministic green; e2e foundation regresyonsuz.

## 3. Scope

**Includes:**

- API: `buildPastDayRangesInTimeZone` (date-range), `findCompletedTasksBetween` (repo), `getWeeklyStatistics` (service), zod query schema, `WeeklyStatisticsResponseDto`, `GET statistics/weekly` controller.
- Web: `today-briefing.tsx`, `progress-ring.tsx` (SVG ring, gradient `#5e6ad2→#8b93e0`, 300ms ease-out), `celebration.tsx` (32 parçacık, WAAPI `animate`, reduced-motion gating), `weekly-stats.tsx` (useQuery `['tasks','statistics','weekly']`).
- `today-view.tsx` entegrasyonu: `celebrationKey` state, `moveMutation.onSuccess` → `['tasks','today']`, `['tasks','kanban']`, `['tasks','statistics']` invalidation + `COMPLETED` ise tetikleme.
- OpenAPI/client regen, testler, dokümanlar.

**Excludes:**

- SMS/push bildirim, gerçek "celebrate" ekranı kapatma, kullanıcı tanımlı hafta başlangıcı (Pazartesi sabit), gelecek hedefler (F-07 weekly goals bu slice'ta yok; istatistik yalnızca geçmiş veri).
- Çarşı-bar grafiği interaktivitesi (tooltip/gezinme), ay bazında geçmiş veri.

## 4. Design Decision — "Tamamlanma" nasıl ölçülür?

Kod tabanında `Task.completedAt` kolonu şemada var ama hiçbir yerde **yazılmıyor**. Tamamlama izlemesi bugün iki yerde şöyle yapılıyor:

- Kanban/detay `moveWorkItem` hedefi `COMPLETED` → `areaStatus.canonicalStatus = COMPLETED` yazılır.
- Today `findTodayTasks` `completedToday`'i `updatedAt >= bugün başlangıcı && canonicalStatus = COMPLETED` ile bulur.

İstatistik endpoint'i aynı deseni izler (`updatedAt` bazlı bucket): böylece mevcut davranışla tam tutarlı olur ve migration gerektirmez. `updatedAt` değişikliği, completion move'dan başka nedenlerle de olabilir (düzenleme) — bu bilinen, kabul edilen bir toleranstır ve Today'in `completedToday` bölümüyle bire bir tutarlıdır.

## 5. Delivery

- API: unit `task.service.weekly-stats.spec.ts` (3) + API `today-tasks.spec.ts` `GET /tasks/statistics/weekly` (3).
- Web: `today-view.test.tsx` URL-route'lu mock (briefing + weekly stats + mevcut 3).
- Doğrulama: api typecheck/lint, test:unit (175), test:api (160), contract deterministic, web typecheck/lint, component (247), build, e2e foundation (9/9), secret scan.