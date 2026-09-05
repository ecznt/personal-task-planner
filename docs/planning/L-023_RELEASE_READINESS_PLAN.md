# L-023 — Release Readiness

| Field | Value |
| --- | --- |
| Slice | L-023 |
| Goal | Final traceability, CI evidence, migration/deploy rehearsal, known risks, rollback note |
| Status | Planned |
| Created | 2026-09-05 |
| Dependencies | L-022 (completed, commit `4ccb4d0`) |

## 1. Story Goal

Prepare the MVP for release. L-023 adds no product functionality; it closes the quality-pipeline and documentation gaps, produces a release-ready evidence set, and rehearses the deployment path.

## 2. In-Scope Work Items

### 2.1 Dependency hygiene and security audit cleanup

- Resolve the pre-existing `pnpm audit` findings (10 advisories, all indirect dev-tooling transitive paths) via targeted upgrades or reviewed PRISMA/NestJS-CLI `pnpm.overrides` re-audit.
- Goal: `pnpm audit --audit-level high` passes (0 high) or changes are registered in `docs/spikes` with an explicit accepted-risk record.
- Re-run `pnpm test:security` and confirm `scan-secrets.mjs` remains clean.

### 2.2 Full CI evidence on opencode/develop

- Confirm CI run `33989414398` (L-022 push) and all subsequent branch runs complete green, including `test:api`, `test:db`, `test:contract`, and Playwright E2E which are not exercised locally.
- Fix or explicitly defer any red step with a written reason and owner.

### 2.3 Final traceability

- Complete the decision log through L-022 and update the phase-approval history in `docs/PROJECT_MASTER.md`.
- Confirm `docs/planning/BACKLOG.md` status, completed baseline, and next-slice pointer (L-023) are current.
- Verify Graphify incremental update reflects the L-009–L-022 source state (see section 6).

### 2.4 Migration and deploy rehearsal

- Record the exact migration list from `apps/api/prisma/migrations` and rehearsal steps:
  1. `prisma validate`
  2. `prisma migrate deploy` against a disposable database
  3. `pnpm build` for api + web (standalone) artifacts
  4. `pnpm test:contract` against the generated OpenAPI and client
- Verify deploy env expectations: `NODE_ENV=production`, session/CSRF cookie settings, SMTP worker env, DATABASE_URL, trusted-proxy/rate-limit settings.

### 2.5 Release checklist and rollback note

- Produce the release checklist (build → migrate → deploy api → deploy worker → deploy web → smoke `/login` → smoke `/app/today`).
- Rollback note: primary data migration is additive; rollback is database-schema rewind plus redeploy prior artifacts. Since the MVP is personal-use with no committed SLAs, a documented 30-day re-audit window applies.

## 3. Out of Scope

- New product features, redesign, second language, collaboration, mobile apps, billing.
- Changes to the execution model (no new micro-stories unless a demonstrated delivery problem appears).

## 4. Known Risks / Pre-Existing Deviations

| Item | Status | Resolution |
| --- | --- | --- |
| `pnpm audit` high findings (indirect dev-deps) | Open since committed baseline | Item 2.1 |
| L-009–L-021 shipped as locally-verified unbatched work without per-slice CI | Closed by L-022 CI change + branch publishing | Evidence in 2.2 |
| Some component suites flaky under full-parallel vitest forks on this host | Observed | Keep `fileParallelism` conservative in local runs; CI is authoritative |
| Docs were stale (backlog claimed next = L-012 while code reached L-021) | Closed in this session's sync | Section 2.3 |

## 5. Verification Evidence Expected Out

- Green CI run(s) on `opencode/develop` covering lint, format, typecheck, unit, component, api, db, contract, build, security, E2E.
- Zero `format:check`/lint/typecheck regressions on a clean clone.
- Migration deploy rehearsal log on a disposable database.
- Updated `docs/PROJECT_MASTER.md`, `docs/planning/BACKLOG.md`, graphify-out, and this plan marked implemented.

## 6. Graphify Usage (bounded, per DEC-072)

- One targeted depth-2 query into the changed planning/navigation area before finalizing L-023 decisions.
- One incremental update after the L-022 source/push settles (no full rebuild).
- Do not re-extract unchanged approved planning documents.

## 7. Definition of Done

1. CI green on `opencode/develop` including all suites.
2. `pnpm audit --audit-level high` passes or accepted-risk record exists.
3. Migration deploy rehearsal succeeds on a disposable database.
4. Decision log + phase history + backlog reflect L-009 through L-022 implemented and L-023 current.
5. Self-review cover: no secrets, no `develop`/`main` push, no bypassed gates.