# L-023 — Release Readiness

| Field | Value |
| --- | --- |
| Slice | L-023 |
| Goal | Final traceability, CI evidence, migration/deploy rehearsal, known risks, rollback note |
| Status | Implemented (commits `b0518df`, `942bfc6`) |
| Created | 2026-09-05 |
| Dependencies | L-022 (completed, commits `4ccb4d0`, `608febe`) |

## 1. Story Goal

Prepare the MVP for release. L-023 adds no product functionality; it closes the quality-pipeline and documentation gaps, produces a release-ready evidence set, and rehearses the deployment path.

## 2. In-Scope Work Items

### 2.1 Dependency hygiene and security audit cleanup

- **RESOLVED in commit `608febe`**: added `fast-uri 3.1.6`, `mysql2 >=3.22.0`, and `deepmerge-ts >=8.0.0` overrides to `pnpm-workspace.yaml` (this repo's override source of truth), re-resolved the lockfile, and validated against the real consumers: `prisma generate` and `pnpm --filter @planner/api build` both pass on the overridden set.
- `pnpm audit --audit-level high` now exits clean (3 moderate remain, 0 high); `pnpm test:security` (audit + `scan-secrets.mjs`) passes in CI run `33992498866`. No accepted-risk record needed.

### 2.2 Full CI evidence on opencode/develop

- CI runs `33989414398` (L-022 push, commit `4ccb4d0`) and `33992498866` (E2E/security repair, commit `608febe`) both completed `success` on `opencode/develop`, covering lint, format, typecheck, unit, component, api, db, contract, build, security, and Playwright E2E. The L-022-era E2E failures (stale assertions vs. the shared-shell UI, missing session/tasks mocks) were diagnosed and fixed hermetically in commit `608febe`; the suite also runs green locally against the standalone web server with mocked API routes (13 tests).
- Conclusion: no red steps on the branch; no deferral required.

### 2.3 Final traceability

- **Done**: decision log extended through L-023 (DEC-102 in `docs/PROJECT_MASTER.md`), phase-approval history current, `docs/planning/BACKLOG.md` baseline and next-slice pointer current.
- **Done**: Graphify incremental update executed per section 6 — one bounded depth-2 query scope, one incremental update (no full rebuild) shipped as commit `942bfc6` (2775 nodes / 5479 edges / 195 labeled communities; manifest advanced).

### 2.4 Migration and deploy rehearsal

- **Rehearsal is automated in CI on every `opencode/develop` push** (run `33992498866` verified): against a disposable `postgres:18.3` service container with `DATABASE_URL=postgresql://planner:planner_test@127.0.0.1:5432/personal_task_planner_test`, CI executes the exact release-deploy sequence:
  1. `pnpm prisma:validate`
  2. `pnpm prisma:migrate:deploy` (applies all 10 `apps/api/prisma/migrations/*` in order)
  3. `pnpm test:db` (DB-backed specs on the migrated schema)
  4. `pnpm build` (API nest build + web standalone, incl. `prepare-standalone.mjs`)
  5. `pnpm test:contract` (redocly lint + generated-client regression + OpenAPI determinism)
- The migration list (oldest first): `20260723120000_foundation_jobs`, `20260725143000_email_password_registration`, `20260725170000_email_verification`, `20260726120000_login_sessions`, `20260728120000_password_reset`, `20260730090000_account_deletion_initiation`, `20260817090000_start_empty_onboarding`, `20260817100000_private_sample_data`, `20260820183043_add_label_version`, `20260826120000_add_recurrence_models`, `20260827120000_add_reminder_notification_models`, `20260828120000_add_lifecycle_operations`, `20260829120000_add_deletion_receipts`.
- **Deploy env expectations**: `NODE_ENV=production`; `DATABASE_URL` (privileged migration user for deploy, runtime role for apps); session cookie `__Host-` secure + HttpOnly; CSRF double-submit with strict same-origin; AMBER_SMTP_HOST/PORT/USER/PASS for the email/SMTP worker; worker and API share the same DMZ origin behind a trusted proxy (cookie+rate-limit trust). Local rehearsal of the full DB path is not possible on this host (no running Postgres); CI is the authoritative rehearsal.

### 2.5 Release checklist and rollback note

- **Release checklist** (artifact order, all verified green in CI run `33992498866`):
  1. `pnpm build` → API (`dist/`) + web standalone artifacts (web runs `prepare-standalone.mjs`).
  2. `DATABASE_URL=$(migrate-role) pnpm prisma:migrate:deploy` → apply migrations idempotently.
  3. Deploy API (port 3001) with `NODE_ENV=production` + env block from 2.4.
  4. Deploy worker (same bundle, worker entrypoint) with SMTP env.
  5. Deploy web standalone (port 3000), route `/api/*` to the API, same origin.
  6. Smoke `/login` (email/password + CSRF cookie round-trip), `/verify-email` manual flow, `/forgot-password`.
  7. Smoke `/app/today` (session-boundary redirect → login → workspace load), quick-create sheet, sign-out.
- **Rollback note**: the primary data migration is additive (new columns/tables; no destructive rewrite). Rollback = schema rewind to the prior migration + redeploy the previous artifacts; the planner is personal-use with no committed SLAs, so a **30-day re-audit window** applies to post-release findings. Account-deletion/trash purges are the only destructively privileged paths and are gated behind re-authentication + `purgeAfter`.

## 3. Out of Scope

- New product features, redesign, second language, collaboration, mobile apps, billing.
- Changes to the execution model (no new micro-stories unless a demonstrated delivery problem appears).

## 4. Known Risks / Pre-Existing Deviations

| Item | Status | Resolution |
| --- | --- | --- |
| `pnpm audit` high findings (indirect dev-deps) | Resolved in commit `608febe` via `pnpm-workspace.yaml` overrides | Item 2.1; 0 high, 3 moderate |
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

1. CI green on `opencode/develop` including all suites. **Done** — runs `33992498866`, `33992751977`, `33997579621` all `success`.
2. `pnpm audit --audit-level high` passes or accepted-risk record exists. **Done** — passes (0 high, 3 moderate).
3. Migration deploy rehearsal succeeds on a disposable database. **Done in CI** — `prisma:validate` + `prisma:migrate:deploy` + `test:db` against disposable `postgres:18.3` (run `33992498866`).
4. Decision log + phase history + backlog reflect L-009 through L-022 implemented and L-023 current. **Done** — DEC-102, backlog L-022 entry updated, L-022/L-023 plans updated.
5. Self-review cover: no secrets, no `develop`/`main` push, no bypassed gates. **Done** — all pushes confined to `opencode/develop`; `test:security` gated by real override fix, not suppression.