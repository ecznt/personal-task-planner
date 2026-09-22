# Feature Araştırması — Benzer Uygulamalar ve Kazandırmaya Değer Özellikler

| Alan | Değer |
| --- | --- |
| Tarih | 2026-09-20 |
| Son güncelleme | 2026-09-22 — kod kontrolü; L-027–L-032 kapsamında uygulanan özellikler işaretlendi |
| Amaç | Geliştirilen kişisel görev planlayıcıya değer katacak özellikleri sektördeki benzer uygulamalardan araştırmak, analiz etmek ve öncelikli kısa liste halinde raporlamak |
| Kapsam | Yalnızca okuma/araştırma; uygulama kodu değişmez |
| Kaynak dokümanlar | `docs/PROJECT_MASTER.md`, `docs/planning/BACKLOG.md`, `docs/product/PRD.md` |
| Rapor dili | Türkçe |

## 1. Yönetici özeti

Benchmark setindeki 9 uygulamanın (Todoist, Things 3, TickTick, Microsoft To Do, Sunsama, Motion, OmniFocus 4, Notion Tasks, Linear) feature envanteri çıkarıldı ve mevcut uygulamanın yetenekleriyle karşılaştırıldı. Mevcut uygulama temel görev yönetimi açısından güçlü: Türkçe doğal dil hızlı ekleme (`#proje`, `@etiket`, `p1`–`p3`), Today/Upcoming/Calendar/List/Kanban görünümleri, renkli etiketler, kontrol listeleri, in-app + Web Push hatırlatıcılar, tekrar eden görevler, arşiv/çöp ve ⌘K komut paleti zaten var.

Araştırma, değer/efor oranına göre **8 özelliği "kazandırmaya değer"** olarak işaretledi:

1. **Alt görevler (nested/sub-tasks)** — 9 uygulamanın 7'sinde standart; mevcut kontrol listesinin ötesinde gerçek görev hiyerarşisi. ✅ **Uygulandı (L-027)**.
2. **Erteleme / snooze** — görev ve hatırlatıcıları tek tuşla ertesi güne/akışa taşıma (Sunsama, TickTick, Linear). ✅ **Uygulandı (L-029)**.
3. **Kayıtlı filtreler / akıllı listeler** — URL filtrelerini kalıcı, isimlendirilebilir, sidebar'da liste haline getirme (Todoist, Linear, TickTick; PRD FC-007). ⬜ **Kalan aday**.
4. **Takvimde sürükle-bırak ile yeniden planlama + görev süresi** — L-024'te bilinçli olarak dışarıda bırakılan drag-reschedule, mevcut dnd altyapısıyla ucuza eklenebilir. ✅ **Uygulandı (L-032)**.
5. **Görev/proje şablonları** — tekrar eden iş akışlarını tek tıkla kopyalama (Todoist, TickTick, Linear). ✅ **Uygulandı (L-028)**.
6. **Today "Bu akşam" bölümü + gün sonu rollover** — Things/My Day benzeri, küçük ama kullanım hissini iyileştiren bir rutin özelliği. ⬜ **Kalan aday**.
7. **Haftalık hedefler + gözden geçirme (weekly review) akışı** — Sunsama/OmniFocus'tan ilham, kendi kendine üretkenlik değeri. ⬜ **Kalan aday**.
8. **Zengin not / Markdown** — açıklama metnini basit markdown zenginliğiyle geliştirme (Things, Notion; PRD FC-008'in hafif adımı). ✅ **Uygulandı (L-030)**.

Uygulanma durumu 2026-09-22'de kod kontrolüyle doğrulandı: L-027→F-01, L-028→F-05, L-029→F-02, L-030→F-08, L-032→F-04. Kalan "Adopt" adayları yalnızca F-03, F-06 ve F-07'dir (bkz. § 6).

Ertelenenler: manuel zaman bloklama (F-09; görev süresi alanı L-032 ile tamamlandı, bloklama/planning UI kaldı), e-posta ile görev alma (SMTP altyapısı mevcut ama inbound gerekli, F-10), web clipper/uzantı (F-11), harici takvim senkronu (F-12; NG-009/FC-004 kapsamı), proje bölümleri/sections (F-19). **Tamamen dışarıda bırakılanlar**: Motion tarzı AI otomatik zamanlama, pomodoro/focus timer, habit/streak, Eisenhower matrisi, "Someday" listesi ve tüm AI araçları (Ramble, Filter Assist vb.) — ya proje felsefesiyle (lean, kişisel planlama) çelişiyor ya da değer/efor oranı düşük.

## 2. Metodoloji

- **Benchmark seti (9):** 4 kişisel görev yöneticisi (Todoist, TickTick, Microsoft To Do, Things 3), 2 zaman planlama uygulaması (Sunsama, Motion), 2 "güç" aracı (OmniFocus 4, Notion Tasks), 1 tasarım/kurumsal referans (Linear sadece kişisel görev yönüyle).
- **Boyutlar (7):** Capture & giriş, organizasyon, planlama, görünümler, iş akışları, otomasyon/integration, veri & UX.
- **Karşılaştırma:** Her özellik mevcut uygulamayla eşlendi; varsa karşılığı, yoksa gap "aday özellik" olarak kaydedildi.
- **Eleme:** PRD `NG-*` (out-of-scope) ve `FC-*` (future considerations) kurallarıyla çakışanlar; proje felsefesine uymayanlar (billing, takım işbirliği, mobil, sosyal auth, AI ağırlıklı işler) analiz dışı bırakıldı.
- **Skorlama:** Her aday `Değer (1–5) × Proje uyumu (1–5) ÷ Efor (1–5)` üzerinden puanlandı; kararlar **Adopt / Adopt later / Skip**.

### Skor anahtarı

| Ölçek | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| **Değer** | marjinal | düşük | orta | yüksek | çok yüksek |
| **Uyum** | felsefe/PRD çelişkisi | zayıf | kabul edilebilir | iyi | mükemmel |
| **Efor** | çok büyük (haftalar) | büyük | orta | küçük | çok küçük |

## 3. Mevcut uygulama — referans yetenek envanteri

| Alan | Mevcut durum |
| --- | --- |
| Capture | Türkçe NLP quick-add (`#Proje`, `@Etiket`, `p1`–`p3`, tarih/saat, tekrar), header quick-create sheet, takvim günü quick-add (canlı önizleme), ⌘K palette, `N` kısayolu, `/` arama focus |
| Organizasyon | Area → (Project →) Task modeli; renkli etiketler; kontrol listeleri; alan-başına özel status'lar |
| Planlama | plannedAt + dueAt ayrımı, çoklu hatırlatıcılar (in-app + Web Push), tekrar (calendar & completion tabanlı), Today/Upcoming/Calendar bakiyeli görünümler |
| Görünümler | Today (overdue/planned/due/completed), Upcoming (günlük gruplu), Calendar (ay), global List + URL filtreleri + bulk, global + Area Kanban (dnd + toolbar filtreleri), arama sayfası, projeler, arşiv, çöp, bildirim merkezi |
| İş akışları | Kısayol seti, satır task-inspector (autosave, If-Match), blog pitch |
| Automation | Web Push (VAPID), SMTP delivery (e-posta doğrulama/sıfırlama), worker job kuyruğu |
| Veri & UX | Koyu/açık tema, Tailwind + shadcn/ui, Türkçe UI, i18n-ready |

## 4. Benchmark matrisi (özellik × uygulama varlığı)

Aşağıdaki tablo, raporun kalanındaki gap analizi için "hangi uygulamada hangi özellik var" hızlı referansını verir. ✅ = var, ◐ = sınırlı/kısmi, — = yok.

| Özellik | Todoist | Things 3 | TickTick | MS To Do | Sunsama | Motion | OmniFocus 4 | Notion Tasks | Linear |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NLP quick-add | ✅ | ◐ | ✅ | ◐ | — | ✅ (AI) | ✅ (Quick Entry) | ◐ (date parse) | ◐ |
| Alt görevler | ✅ | ✅ (checklist) | ✅ | ✅ (steps) | ✅ | ✅ | ◐ (nested actions) | ✅ (relation) | ✅ |
| Bölümler/sections | ✅ | ✅ (headings) | ✅ | — | — | — | — | ✅ (groups) | — |
| Kayıtlı filtreler / akıllı listeler | ✅ | — (bilinçli) | ✅ (smart) | ◐ (smart lists) | — | ◐ | ✅ (perspectives) | ✅ (views) | ✅ (saved views) |
| Şablonlar | ✅ | ◐ | ✅ | — | — | ✅ | — | ✅ | ✅ (issue) |
| Erteleme/snooze | ◐ | — | ✅ (postpone) | — | ✅ (`D`) | ✅ | ◐ | — | ✅ (reminder snooze) |
| Görev süresi (duration) | ✅ | — | ✅ | — | ✅ (planned vs actual) | ✅ (zorunlu) | — | — | — |
| Takvim drag-reschedule | ✅ | ✅ | ✅ | ◐ (planned) | ✅ | ✅ (auto) | ✅ (Forecast) | ✅ | — |
| Takvim entegrasyonu (harici) | — | ✅ | ✅ | — | ✅ | ✅ | ✅ (Forecast) | ✅ (Notion Calendar) | ◐ (workspace) |
| Pomodoro/focus | — | — | ✅ | — | ✅ | ◐ | — | — | — |
| Habit/streak | — | — | ✅ | — | — | — | — | ◐ (db) | — |
| Eisenhower matrisi | — | — | ✅ | — | — | — | — | ◐ (db) | — |
| Review rutini | — | → (kendi habit) | — | — | ✅ (weekly review) | — | ✅ (Review) | — | ◐ (Inbox) |
| Günlük planlama rituali | — | ✅ (Today/Evening) | ◐ (suggested) | ✅ (My Day) | ✅ (planning/shutdown) | ✅ (auto) | — | — | ◐ (My Issues) |
| Zengin not/markdown | ◐ | ✅ | ✅ | — | ◐ | ✅ (docs) | ✅ | ✅ | ✅ |
| Web clipper / uzantı | ✅ | — | ✅ | — | — | — | ◐ (clippings) | ✅ | — |
| E-posta ile görev | ✅ | ✅ (Mail to Things) | ✅ | ◐ (outlook flag) | — | ✅ | ✅ (Mail Drop) | — | ◐ (entegre) |
| AI özellikler | ✅ (Ramble, Filter Assist) | — | ✅ (voice) | — | — | ✅ (merkez rol) | — | ✅ (AI) | ✅ (Agent) |

## 5. Gap analizi — incelenen aday özellikler

Her aday; karşılığı, PRD uyumu, efor ve öneriyle tabloda. Karar sütunu: **Adopt** (kısa vade), **Later** (öncelikli değil), **Skip** (analiz dışı/kâr oranı düşük).

| # | Aday özellik | Nereden | Mevcut durum / gap | PRD uyumu | Efor | Karar |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | **Alt görevler (nested tasks)** | Todoist, TickTick, MS To Do, Sunsama, Motion, Notion, Linear | ✅ **Uygulandı (L-027)**: `Task.parentTaskId` + ağaç API, List/Kanban/Today rollup, inspector "Alt görev ekle". | FC-008 ile çakışmayan, doğal uzantı | Orta | **Uygulandı** |
| F-02 | **Ertele/snooze (görev + hatırlatıcı)** | Sunsama, TickTick, Linear, Motion | ✅ **Uygulandı (L-029)**: `POST /tasks/:id/snooze-actions` + reminder snooze, Today `D` kısayolu, `TaskSnoozeMenu`/`SnoozeDialog`. | Uyumlu | Küçük | **Uygulandı** |
| F-03 | **Kayıtlı filtreler / akıllı listeler** | Todoist, Linear, TickTick, OmniFocus | URL filtreleri (`url-task-filters.ts` + `task-filter-bar.tsx`) var; kalıcı isimli preset/sidebar sabitleme yok. | FC-007 doğrudan | Orta | **Adopt (kalan)** |
| F-04 | **Takvim drag-reschedule + görev süresi** | TickTick, OmniFocus, Notion, Sunsama | ✅ **Uygulandı (L-032)**: `durationMinutes` alanı + takvim çipi `HH:mm · Xdk`, çip → gün drag ile `plannedAt` güncelleme. | Uyumlu | Orta | **Uygulandı** |
| F-05 | **Görev/proje şablonları** | Todoist, TickTick, Linear, Notion | ✅ **Uygulandı (L-028)**: `TaskTemplate` modeli, `/api/v1/task-templates` CRUD + `/apply`, `/app/templates` sayfası, hızlı ekleme "Şablon" sekmesi. | Uyumlu | Orta | **Uygulandı** |
| F-06 | **Today "Bu akşam" bölümü + gün sonu rollover** | Things, MS To Do | Today kovaları var; akşam segmenti ve bugünün taşınması yok. | Uyumlu | Küçük | **Adopt (kalan)** |
| F-07 | **Haftalık hedefler + weekly review** | Sunsama, OmniFocus | Hedef/review akışı yok. | Uyumlu | Orta | **Adopt (kalan)** |
| F-08 | **Zengin not (markdown)** | Things, Notion, TickTick, Linear | ✅ **Uygulandı (L-030)**: render-only güvenli alt küme (`markdown-render.tsx`: başlık, kalın, kod, liste, alıntı, http/https link). | FC-008 hafif adım | Küçük-orta | **Uygulandı** |
| F-09 | Görev süresi + manuel zaman bloklama | Sunsama, Motion, TickTick | Duration üstü tam time-blocking solver gerektirir. | Uyumlu | Büyük | Later |
| F-10 | E-posta ile görev alımı | Todoist, Things, TickTick, Motion | SMTP **çıkış** altyapısı var; **giriş** (inbound) SMTP gerektirir. | NG-007 sadece "bildirim" kapsar; yakalama dışı | Büyük | Later |
| F-11 | Web clipper / tarayıcı uzantısı | Todoist, TickTick, Notion | Hiç yok; uzantı altyapısı kurulumu gerekir. | Uyumlu | Orta-büyük | Later |
| F-12 | Harici takvim senkronu (CalDAV/Google) | Things, TickTick, Sunsama, Motion | Sadece iç takvim var. | NG-009 / FC-004 ile ertelenmiş | Çok büyük | Later |
| F-13 | Pomodoro / focus timer | TickTick, Sunsama | Görev alanıyla ilgisiz yeni domain. | Uyumsuz sayılabilir | Orta | Skip |
| F-14 | Habit/streak takibi | TickTick | Yeni domain; değer ortalama. | Uyumsuz sayılabilir | Orta | Skip |
| F-15 | Eisenhower matrisi | TickTick | Mevcut priority + filtrelerle zaten ifade ediliyor. | İlave değer düşük | Küçük | Skip |
| F-16 | "Someday" listesi | Things, OmniFocus | `plannedAt = null` zaten yakalıyor; ayrı liste ek değer yok. | — | Küçük | Skip |
| F-17 | Motion tarzı AI otomatik zamanlama | Motion | Solver + sürekli re-optimizasyon; ağır mühendislik. | Lean felsefeyle çelişiyor | Çok büyük | Skip |
| F-18 | AI araçları (voice, Filter Assist, AI chat) | Todoist, Motion, Notion, Linear | Harici model/API bağımlılığı; gizlilik (kişisel veri) riski. | NG kapsamında değil; projeye uygun değil | Değişken | Skip |
| F-19 | Proje bölümleri/sections | Todoist, Notion, Things (headings) | Area → Project hiyerarşisi var; görev altı section yok. | FC-008 yakını | Orta | Later |

## 6. Skorlama ve öncelikli kısa liste

Aşağıdaki puan `Değer × Uyum ÷ Efor` üzerinden hesaplanır (her ölçek 1–5).

### Tablo — skorlanmış adaylar (Adopt + Later)

Uygulanmış özellikler (2026-09-22 kod kontrolü) puan tablosunda **tamamlandı** olarak işaretlendi; yalnızca kalan adaylar sıralamaya girer.

| Özellik | Değer (D) | Uyum (U) | Efor (E) | Puan (D×U÷E) | Karar |
| --- | --- | --- | --- | --- | --- |
| F-01 Alt görevler | 5 | 5 | 3 | 8.3 | ✅ Tamamlandı (L-027) |
| F-02 Ertele/snooze | 4 | 5 | 4 | 5.0 | ✅ Tamamlandı (L-029) |
| F-03 Kayıtlı filtreler | 4 | 4 | 3 | 5.3 | **Adopt (kalan)** |
| F-04 Drag-reschedule + süre | 4 | 5 | 3 | 6.7 | ✅ Tamamlandı (L-032) |
| F-05 Şablonlar | 3 | 4 | 3 | 4.0 | ✅ Tamamlandı (L-028) |
| F-06 Bu akşam + rollover | 3 | 5 | 4 | 3.75 | **Adopt (kalan)** |
| F-07 Haftalık hedef + review | 3 | 4 | 3 | 4.0 | **Adopt (kalan)** |
| F-08 Markdown not | 3 | 5 | 4 | 3.75 | ✅ Tamamlandı (L-030) |
| F-09 Zaman bloklama (manual) | 3 | 4 | 2 | 6.0 | Later (kalan; F-04'ün uzantısı) |
| F-10 E-posta ile görev | 3 | 3 | 1 | 9.0 | Later (altyapı) |
| F-11 Web clipper/uzantı | 3 | 4 | 2 | 6.0 | Later |
| F-12 Harici takvim senkronu | 4 | 2 | 1 | 8.0 | Later (PRD gate) |
| F-13 Pomodoro | 2 | 2 | 3 | 1.3 | Skip |
| F-14 Habit/streak | 2 | 2 | 3 | 1.3 | Skip |
| F-15 Eisenhower | 1 | 3 | 4 | 0.75 | Skip |
| F-16 Someday | 1 | 4 | 4 | 1.0 | Skip |
| F-18 AI araçları | 2 | 1 | 2 | 1.0 | Skip |
| F-19 Sections | 2 | 4 | 3 | 2.7 | Later |

### Öncelikli kısa liste (kalan adaylar, önem sırası)

1. **F-03 Kayıtlı filtreler / akıllı listeler** — Mevcut URL filtresi altyapısı kalıcı isimli presetlere dönüşür; sidebar'a sabitlenebilir. FC-007'ye doğrudan hizmet.
2. **F-07 Haftalık hedefler + weekly review** — Sunsama/OmniFocus'tan ilham; haftalık planlama ritüeli kullanıcı bağlılığını güçlendirir.
3. **F-06 Today "Bu akşam" + gün sonu rollover** — Küçük UX iyileştirmesi; gün sonunda kalan işleri otomatik ertesi güne taşıma seçeneği.

L-027 (F-01), L-028 (F-05), L-029 (F-02), L-030 (F-08), L-032 (F-04) ile özgün sekiz "Adopt" özelliğinden beşi tamamlanmıştır.

## 7. BACKLOG adayı — önerilen "next slice" paketleri

Mevcut BACKLOG "Next slice" durumunda. Rapordaki beş "Adopt" özelliği (F-01, F-02, F-04, F-05, F-08) L-027–L-030 + L-032 olarak tamamlandı; kalan net slice adayları:

| Öneri | İçerik | Gerekçe |
| --- | --- | --- |
| **Slice A — Kayıtlı filtreler / akıllı listeler** | URL filtrelerini kalıcı isimli presetlere dönüştürme + sidebar sabitleme (FC-007) | Kalan adayların en yüksek puanı (5.3); mevcut URL-filtre alt yapısı üzerine |
| **Slice B — Haftalık hedefler + weekly review** | Haftalık hedef modeli + haftalık gözden geçirme akışı | Üretkenlik ritüeli; Sunsama/OmniFocus'tan ilham |
| **Slice C — Today "Bu akşam" + gün sonu rollover** | Today'de akşam segmenti + kalan işleri ertesi güne taşıma | Küçük (3.75) ama yüksek frekanslı UX iyileştirmesi |

Bu paketlerden birinin seçimi ve detaylı implementation planı, ayrı bir onayla ayrı bir çalışma olarak yapılmalıdır. Bu doküman yalnızca araştırma/öneri niteliğindedir.

## 8. Varsayımlar ve sınırlamalar

- Özellik varlıkları, ürünlerin resmi dokümantasyon/help merkezleri ve güncel incelemelerinden derlendi; ücretli planlardaki lisans farkları dikkate alınmadı (özellik "uygulamada var" kabul edildi).
- Efor tahminleri (S/M/L) görecedir ve kesin slicing/planlama analizi bu raporun kapsamı dışındadır.
- Notion ve Linear, proje/yönetim yönleriyle değil yalnızca kişisel görev yönetimi yönleriyle alındı.
- Takım işbirliği, paylaşım, billing, mobil, sosyal auth ve tüm `NG-*` out-of-scope kuralları analiz dışıdır; seçilen özellikler mevcut "kişisel, tek kullanıcılı" ürün kapsamına uygundur.