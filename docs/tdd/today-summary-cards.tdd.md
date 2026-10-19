# TDD Evidence Report — Today Summary Cards

## 1. Source

No external `*.plan.md` was provided for this change. The user journeys and test
guarantees were derived during this TDD run, from the request to adapt the Pane
dashboard "overview KPI row" pattern onto the existing Today view.

Scope was constrained to the existing design system and data model: the summary
cards read the already-returned Today response (`overdue`, `plannedToday`,
`dueToday`, `completedToday`, `untimed`) and add no new API surface.

## 2. User journeys

- **UJ-1** — As a user, I want a compact KPI row at the top of "Bugün" so I can
  see total, today, overdue, and completed counts at a glance.
- **UJ-2** — As a user with no tasks, I want the KPI row to render zeros instead
  of disappearing, so the dashboard layout stays predictable.

## 3. Task report

| Step | Action | Command | Result |
|------|--------|---------|--------|
| RED | Implementation reverted (`git stash push -- apps/web/src/features/today/today-view.tsx`), KPI tests run | `vitest run src/features/today/today-view.test.tsx` | `Tests 2 failed | 6 passed (8)` — failures are `renders summary stat cards with derived counts` and `renders stat cards with zero counts when there are no tasks`, both because the card titles (`Toplam`) are absent. |
| GREEN | Implementation restored (`git stash pop`), same target re-run | `vitest run src/features/today/today-view.test.tsx` | `Tests 8 passed (8)` |
| Regression | Full component suite | `vitest run` | `Test Files 50 passed (50)`, `Tests 289 passed (289)` |

RED failure was caused by the intended missing implementation (absent summary
cards), not by syntax errors, broken setup, or unrelated regressions. The test
target compiled and executed in both runs.

Type check: `pnpm tsc --noEmit` — clean (no output).
Production build: `next build` — success.

## 4. Test specification

| # | What is guaranteed | Test file / test name | Type | Result | Evidence |
|---|--------------------|-----------------------|------|--------|----------|
| 1 | The KPI row renders cards titled Toplam, Bugün, Gecikmiş, Tamamlanan | `today-view.test.tsx:renders summary stat cards with derived counts` | component | PASS | `vitest run src/features/today/today-view.test.tsx` |
| 2 | Total card = overdue + plannedToday + dueToday + untimed + completedToday (2+1+3+2+4 = 12) | `today-view.test.tsx:renders summary stat cards with derived counts` | component | PASS | same run |
| 3 | Today card = plannedToday + dueToday (1+3 = 4) | `today-view.test.tsx:renders summary stat cards with derived counts` | component | PASS | same run |
| 4 | Overdue card = overdue count (2) | `today-view.test.tsx:renders summary stat cards with derived counts` | component | PASS | same run |
| 5 | Completed card = completedToday count (4) | `today-view.test.tsx:renders summary stat cards with derived counts` | component | PASS | same run |
| 6 | Cards render zeros when there are no tasks | `today-view.test.tsx:renders stat cards with zero counts when there are no tasks` | component | PASS | same run |
| 7 | Existing Today behavior (empty state, sections, briefing, weekly stats, identity bars) is unchanged | other 6 tests in `today-view.test.tsx` | component | PASS | `Tests 8 passed (8)` |

## 5. Coverage and known gaps

- `@vitest/coverage-v8` is not installed in `apps/web`, so a coverage report
  could not be generated for this run. The full component suite (289 tests) was
  run instead as the regression gate.
- No E2E test was added; the change is a presentational addition to an existing
  view and is covered at the component level.

## 6. Merge evidence

- RED: `Test Files 1 failed (1)` / `Tests 2 failed | 6 passed (8)`.
- GREEN: `Test Files 1 passed (1)` / `Tests 8 passed (8)`.
- Regression: `Test Files 50 passed (50)` / `Tests 289 passed (289)`.
- Refactor: no post-GREEN refactor was required; implementation was kept minimal.
