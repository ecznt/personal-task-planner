# L-022 — MVP Responsive and Accessibility Hardening Pass

| Field | Value |
| --- | --- |
| Slice | L-022 |
| Goal | Keyboard/reflow/focus/semantic review across shipped flows, fixes only |
| Status | Implemented, committed, and published to `opencode/develop` |
| Created | 2026-09-05 |
| Commit | `4ccb4d0` |
| Dependencies | L-009 through L-021 (completed) |

## 1. Story Goal

Harden the shipped MVP UI across responsive, keyboard, focus, and semantic quality without adding product features. The pass is limited to fixes; no redesign or second language.

## 2. Acceptance Criteria

1. The authenticated app uses one shared, responsive shell that adapts across breakpoints and avoids duplicated per-page layout markup.
2. Keyboard and focus behavior is reviewable across shipped views: no `autoFocus` attributes; focus is placed deterministically on mount or on open.
3. Interactive header actions remain reachable at every breakpoint, including the global quick-create action.
4. Tooltips appear through the delayed-open pattern (not instant), and motion respects the existing global `prefers-reduced-motion` reduction.
5. Top/bottom interaction regions respect the device safe area.
6. All static pages use short metadata titles without duplicating the layout template suffix.
7. The repository-wide quality gates pass again after the pipeline gap left by the L-009–L-021 local-verification mode: `format:check`, `lint` (web, api, api-client), `typecheck` (web, api), `test:component`, `test:unit`, `build`, architecture cruise, workspace verify, and secret scan.
8. CI runs on `opencode/develop` so branch pushes verify the full suite.

## 3. Decisions

- Keep one shared `apps/web/src/app/app/layout.tsx` that renders `SessionBoundary` + `AppShell`; remove the per-page duplicated boundary/`<main>` scaffolding from the 13 app pages.
- Header quick-create is a `Sheet` (right side, full width on mobile) used from the sticky header at all breakpoints, which also deduplicates the Areas query.
- Tooltip: fade + `zoom-in-95`, gated on `data-[state=delayed-open]`. No `zoom-in-50`, no `ease-in` entrances, no scale(0). The global reduced-motion override in `globals.css` already covers these.
- Safe-area bottom padding uses `pb-[env(safe-area-inset-bottom)]` for the mobile tab bar.
- Focus-on-open uses React Hook Form `setFocus` or a DOM ref fired from `useEffect`; `autoFocus` is removed wherever the accessibility lint flagged it.
- The `dropdown-menu.tsx` primitive ships as standard shadcn/ui even though it is not yet reachable; this follows the existing precedent of shipping `separator.tsx` unused.

## 4. Implemented Scope

- `apps/web/src/app/app/layout.tsx` — shared authenticated layout (`SessionBoundary` + `AppShell`), `title.template = '%s | Kişisel İş Planlayıcı'`.
- `apps/web/src/features/navigation/` — `app-shell.tsx`, `app-nav.ts`, `nav-icon.tsx`, `search-shortcut.ts`, `app-shell.test.tsx`.
  - Sticky auto-hiding header with search, notifications (dotted indicator), and quick-create.
  - Desktop sidebar destop + mobile bottom tab bar (Today, Tasks, Kanban, More).
  - Tooltips on search and notification actions.
- `apps/web/src/components/ui/` — `sheet.tsx` (used), `tooltip.tsx` (delayed-open fade/zoom-in-95), `dropdown-menu.tsx` (standard, currently unused).
- `apps/web/src/features/tasks/quick-create-dialog.tsx` — quick-create sheet owned by the header; focus via `setFocus('title')` on open.
- 13 app pages — short metadata titles (e.g. `'Bugün'`), no duplicate suffix.
- Focus fixes across shipped views:
  - `status-editor.tsx` — edit/create inputs focus via refs; reorder drag-end typed (`DragEndEvent`) with structural casts; unused props removed from `SortableStatusItem`.
  - `search-view.tsx` — input focus on mount via ref.
  - `quick-create-dialog.tsx` — focus on open via RHF `setFocus`.
- Lint/format/type repairs:
  - `area-kanban-board.tsx` — previous/next move buttons hoist column lookups (no non-null assertion).
  - `notifications-view.tsx` — unused `Link` import removed.
  - `today-view.tsx` — unused `CANONICAL_LABELS` removed.
  - `apps/api/.../infrastructure/area.repository.ts` — seven non-null assertions replaced by invariant guards and `entries()` iteration.
  - Repo-wide `prettier --write` normalized 42 files that the L-009–L-021 slice code had left unformatted.
- `.github/workflows/ci.yml` — CI now triggers on `pull_request` and `push` for `[develop, main, opencode/develop]`.

## 5. Excluded (deliberately)

- Redesign, new themes, second language, dark-mode changes.
- New product functionality (search facets, calendar, automation).
- Dependency upgrades (deferred to L-023, see Known gaps).

## 6. Quality Gates and Evidence

| Gate | Result |
| --- | --- |
| `prettier --check .` | Pass (all files) |
| `eslint .` web | Pass |
| `eslint .` api | Pass |
| `eslint .` api-client | Pass |
| `tsc --noEmit` web | Pass |
| `tsc --noEmit` api | Pass |
| `vitest run` (component) | 19 files / 57 tests pass |
| `jest test:unit` (api) | 20 suites / 112 tests pass |
| `next build` (+standalone) | Pass, all routes compiled |
| dependency-cruiser | No violations (293 modules) |
| verify-workspace / verify-forbidden-import | Pass |
| `scan-secrets.mjs` | No high-confidence credential patterns |
| CI (branch push) | Runs `33989414398` (L-022) and `33992498866` (e2e/security repair) — both success; see acceptance notes |

Two component suites (`kanban-board.test.tsx`, `registration-form.test.tsx`) initially timed out on fork-worker startup under full-parallel load; both pass deterministically when run solo. This is host flakiness, not a code failure.

## 7. Known Gaps Deferred to L-023

1. **`test:security` audit** — **RESOLVED** in commit `608febe`: added `fast-uri 3.1.6`, `mysql2 >=3.22.0`, and `deepmerge-ts >=8.0.0` overrides to `pnpm-workspace.yaml` (override source of truth for this repo), re-resolved the lockfile, and re-verified `prisma generate` and the NestJS build. `pnpm audit --audit-level high` now exits clean (3 moderate remain; no high). `scan-secrets.mjs` stays clean.
2. **Test suites requiring infrastructure** — `test:api`, `test:db`, and `test:contract` require PostgreSQL/SMTP/testcontainers and are exercised by CI rather than locally; Playwright E2E is now also runnable locally against the standalone web server with mocked API routes (13 tests, all green).
3. **CI green confirmation** — **RESOLVED**: the L-022 push (`4ccb4d0`) ran `33989414398` and the L-022 E2E/security repair (`608febe`) ran `33992498866`; both completed `success`, including `test:e2e` and `test:security`.

## 8. Risks

- Formatting 42 previously-shipped files enlarges the L-022 diff; it is whitespace-only and restores `format:check` as a working gate.
- The audit gap was resolved with reviewed transitive overrides rather than by suppressing the `test:security` gate; validated by re-running `prisma generate` and the API build against the overridden dependency set.

## 9. Files Touched (summary)

- New: `apps/web/src/app/app/layout.tsx`, `components/ui/{sheet,tooltip,dropdown-menu}.tsx`, `features/navigation/*`, `features/tasks/quick-create-dialog.tsx`.
- Modified: 13 app pages, `features/areas/status-editor.tsx`, `features/kanban/{kanban-board,area-kanban-board}.tsx`, `features/{today/today-view,search/search-view,notifications/notification-bell,notifications/notifications-view}.tsx`, API planning module files (format-only), `area.repository.ts` (assertion cleanup), `.github/workflows/ci.yml`.

## 10. Acceptance Notes

- All acceptance criteria in section 2 are met. CI on `opencode/develop` completed green for the L-022 commit (`33989414398`) and the E2E/security repair commit `608febe` (`33992498866`), including `test:e2e` and `test:security`.
- The next slice is L-023 (release readiness), documented in `docs/planning/L-023_RELEASE_READINESS_PLAN.md`.