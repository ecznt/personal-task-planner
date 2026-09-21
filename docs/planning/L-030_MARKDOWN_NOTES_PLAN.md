# L-030 — Markdown Destekli Zengin Notlar Implementation Plan

| Field | Value |
| --- | --- |
| Slice | L-030 |
| Goal | Task `description` alanını hafif Markdown ile zenginleştirme (okunur taraf) |
| Status | Tamamlandı — uygulandı (2026-09-21) |
| Created | 2026-09-20 |
| Dependencies | L-006 (Task CRUD), L-025 (Quick Add), DEC-110 (task sheet) |

## 1. Story Goal

Mevcut `Task.description` düz metin olarak kaydediliyor; gösterimde yapı (başlık, madde, kalın, kod) desteklenmiyor. Bu slice, Things 3 / Notion / TickTick paritesinde **hafif Markdown** gösterimi getirir: veri şeması değişmez (`description` yine düz string, kaynak olarak saklanır), yalnızca render katmanı ve input editor hafifçe güncellenir. Amaç görev notunu okunabilir/kopyalanabilir kılmak, WYSIWYG değil.

## 2. Acceptance Criteria

1. Task detail sheet (`task-sheet`/inspector) ve task detail sayfası `description`'ı güvenli Markdown olarak render eder.
2. Desteklenen sentaks: başlıklar (`#`–`###`), kalın/italic, sıralı/sırasız listeler, bağlantılar (opsiyonel `href` temizleme), `code`/çok satırlı kod blokları, alıntı (`>`), satır sonları. Task list checkbox'ı (GFM `- [ ]`) soldurulur (tamamlanabilir değil; salt görsel).
3. Render güvenli: HTML entity escape edilir; `href` `javascript:`/`data:` bloklanır; bağlantılar `target="_blank" rel="noopener noreferrer"` açar.
4. Editör: mevcut textarea korunur (Markdown kaynağı yazılır); yanında "Önizleme" geçişi.
5. Quick-capture / NLP üzerinde etkisi yok: `description` içeriği daha önce olduğu gibi düz string kalır, parselenmez.
6. Mevcut tüm listeleme kartları (`TaskSummary`) etkilenmez; yalnızca detail/sheet render katmanı değişir.
7. `format:check`, `typecheck`, `lint`, component tests, XSS-odaklı unit testler green.

## 3. Scope

**Includes:**

- `apps/web` içinde küçük, bağımsız bir Markdown renderer modülü (yeni kütüphane eklenmemesi hedeflenir — basit tokenizer + escape).
- Task detail sheet ve task detail sayfasında render + "Önizleme" geçişi.
- Bağlantı `href` sanitize + `rel` kuralları; XSS saldırı vektörüne karşı capture kod testleri.
- Renderer unit testleri, component testleri (task-sheet).

**Excludes:**

- WYSIWYG editor, araç çubuğu, live markdown highlighting — salt metin + önizleme.
- GFM task list'lerin tamamlanabilir olması (sadece görsel checkbox).
- Görsel/attachment (FC-008 tamamen kapsam dışı).
- Tablo, resim (`![]()`), HTML gömme, emoji autocomplete — desteklenmez.
- API/schema değişikliği — `description` transportu ve şema aynı kalır.

## 4. Design Notes

### 4.1 Renderer mimarisi

`apps/web/src/lib/markdown-render.ts` (veya `features/tasks/` altında):

```
renderMarkdown(source: string): MarkdownNode[]
```

- Tokenizer: satır satır bölünür; `#`, `-`/`*`/`1.`, `>`, triple-backtick, `**`/`_`/`` ` `` inline'ları tanınır.
- Çıktı: React bileşen ağacı (`<h3>`, `<ul>`, `<li>`, `<pre><code>`, `<p>`, `<a>`), literal olarak escape edilmiş metin.
- Link URL'si `new URL()` üzerinden doğrulanır; `http:`/`https:` dışındakiler düz metin olur.
- Satır sonları (`\n\n`) paragraf, tek `\n` satır içi geçer (`white-space: pre-line` benzeri davranış).

### 4.2 Editor

- Textarea değeri `description` kaynağı (kullanıcı Markdown yazar).
- Başlık çubuğunda küçük "Önizleme" toggle: renderer çıktısı gösterilir.
- Autosave akışı (DEC-110 `task-patch`) değişmez; yalnızca gösterim bileşeni seçici.

### 4.3 Güvenlik

- Render katmanı **asla** `dangerouslySetInnerHTML` kullanmaz; JSX çıktısı üretir.
- Escape: her düz metin parçası React'e string olarak geçer.
- Test seti: `javascript:alert(1)`, `data:text/html`, `<img onerror>`, `[x](bad)` → hepsi metin/engellenen link olarak render edilir.

## 5. Implementation Steps

1. **Web (S1):** `markdown-render.ts` + unit testler (XSS, syntactic cases).
2. **Web (S2):** `TaskDescription` bileşeni (render) + `task-sheet` ve task detail'e entegrasyon + editor "Önizleme" toggle.
3. **Web (S3):** component testleri (task-sheet render, preview toggle, XSS caret).
4. **Docs:** plan + `BACKLOG.md` + `PROJECT_MASTER.md`.

## 6. Verification

- Web: `typecheck`, `lint`, Prettier, `vitest run` (yeni renderer + task-sheet tests).
- E2E: mevcut task-detail e2e spec'i; description render'ı assert.
- `pnpm build`, `test:security` (DOM XSS testleri).

## 7. Decisions Recorded

- Veri şeması korunur; Markdown yalnızca render/UX katmanı — `description` kaynak olarak düz string, gelecekte export/import uyumlu.
- Kütüphane eklenmez; ~200 satırlık tokenizer proje felsefesiyle (lean, bağımsız) uyumludur. Gereksinim büyürse `react-markdown`+`rehype-sanitize`'e geçiş değerlendirilir (bu slice'ta öyle tutulmaz).
- Nokta sıralı/gerçek liste derinliği (nested list) desteklenmez — v1 kapsamını sınırlar.

## 8. Delivered Scope (2026-09-21)

- **Renderer:** `apps/web/src/features/tasks/markdown-render.tsx` — bağımsız tokenizer, `renderMarkdown(source)` React ağacı döner. Desteklenen sentaks: `#`–`###` başlıklar, `**bold**`/`*italic*`/`_italic_` (intraword `_` hariç), sıralı/sırasız listeler, GFM task list checkbox (`- [ ]`/`- [x]` — salt görsel, soldurulmuş), `>` alıntı, fenced code block (```` ``` ````), satır içi/çok satırlı `code`, `[metin](link)`.
- **Güvenlik:** React JSX çıktısı — `dangerouslySetInnerHTML` kullanılmaz; `sanitizeHref` yalnızca `http:`/`https:` mutlak bağlantıları kabul eder (`javascript:`/`data:`/`file:`/`vbscript:` ve bare text engellenir → düz metin); bağlantılar `target="_blank" rel="noopener noreferrer"`.
- **UI:** `apps/web/src/features/tasks/task-description.tsx` — Task detay sayfası ve sağ taraftaki task sheet'inde (aynı `TaskInspector`, `variant "page"|"sheet"`) `description`'ı güvenli Markdown olarak render eder. Düzenleme: mevcut textarea korunur + başlıkta **Kaynak / Önizleme** toggle'ı; otomatik kaydetme akışı (600ms debounce, blur commit, Escape iptal) `InlineText` paritesinde sürer.
- **Tests:** renderer XSS-odaklı unit/component testleri (28 yeni vitest) — `javascript:`/`data:`/malformed link, `<img onerror>`, intraword underscore; E2E `tests/e2e/task-detail.spec.ts` (markdown render + bloklanan linkler/HTML). Ayrıca tescil: `format:check`-parity prettier, `typecheck`, `lint`, `test:component` (237), `build`, `test:e2e -- task-detail`.
- **Caveat:** `pnpm audit` `multer`/NestJS advisory'i (API bağımlılığı) nedeniyle yüksek seviyede başarısız — bu slice'la ilgisiz, önceden var olan durum; `tests/scan-secrets.mjs` temiz.
- Web `test:component` kapsamı 209 → 237; card/liste kartları (TaskSummary) değişmedi.