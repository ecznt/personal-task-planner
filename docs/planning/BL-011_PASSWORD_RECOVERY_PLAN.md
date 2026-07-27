# BL-011 Password Recovery Implementation Plan

## Handoff status

- **Prepared on:** 2026-07-27
- **Current repository baseline before this handoff:** `8823d53 docs: record BL-010 publication`
- **Current branch:** `develop`
- **Completed stories:** EPIC-001 and BL-007 through BL-010 are implemented, published, and CI-green.
- **Current story:** BL-011 — A person can request and complete password recovery without account enumeration.
- **Implementation status:** Not started. This document is a planning handoff only.
- **Next session starting point:** Begin with this document, then implement only BL-011 after confirming the worktree is clean and `develop` is current.

## Approved implementation decisions

| ID | Decision | Status | Rationale |
| --- | --- | --- | --- |
| BL011-D-001 | Password reset is delivered as an email link whose secret token is carried in the URL fragment, for example `/reset-password#token=...`. | Approved by User selection `1A` on 2026-07-27 | The fragment is not sent to the server in the initial page request, reducing accidental token exposure in request logs and referrers. The frontend submits the token only in the reset request body. |
| BL011-D-002 | A new password-reset request invalidates every previous unused reset token for the same eligible email/password identity. | Approved by User selection `2A` on 2026-07-27 | Keeps only the latest recovery action valid and reduces replay surface. |

## Scope

BL-011 implements the password recovery lifecycle for email/password identities only:

- Request a password reset without revealing whether an account exists.
- Queue a durable recovery email for eligible verified email/password identities.
- Complete the reset with a single-use, 30-minute token.
- Store only purpose-bound HMAC/hash values for reset secrets.
- Change the password with the existing approved password policy and Argon2id hashing.
- Revoke all active sessions for the affected User in the same logical completion transaction.
- Preserve CSRF, Origin, rate-limit, idempotency, logging, and non-enumeration rules.

## Out of scope

- Google or any social authentication.
- Account deletion, reauthentication settings, `/users/me/password`, and multi-device session management UI.
- Task, Area, Project, onboarding, notification, archive, trash, or collaboration behavior.
- Native mobile, billing, organization, team, or sharing features.

## Requirement and source traceability

- **Backlog:** BL-011 in `docs/planning/BACKLOG.md`
- **PRD:** FR-004, FR-007, FR-010, NFR-002, NFR-003, NFR-004, AC-001
- **UX:** UXF-004, authentication routes `/forgot-password` and `/reset-password`
- **Domain:** User, AuthenticationIdentity, session lifecycle, BR-AUTH-002, BR-AUTH-003, enumeration-resistant authentication outcomes
- **Data:** User, AuthenticationIdentity, Session, IdempotencyRecord, AuthAbuseCounter, durable Job; add a reset-token persistence structure through Prisma migration
- **API:** `POST /auth/password-reset-requests`, `POST /auth/password-resets`
- **Architecture:** ARC-009, ARC-010, ARC-011, ARC-013

## Expected repository changes

- Backend application services under `apps/api/src/modules/accounts/application/`
- Accounts repository methods in `apps/api/src/modules/accounts/infrastructure/accounts.repository.ts`
- Authentication security helpers in `apps/api/src/modules/accounts/security/auth-security.service.ts`
- Auth transport schemas, DTOs, and controller routes under `apps/api/src/modules/accounts/transport/`
- Worker email delivery abstractions and handler wiring under `apps/api/src/modules/accounts/` and `apps/api/src/platform/email/`
- Prisma schema and one reversible migration under `apps/api/prisma/`
- Generated OpenAPI artifact at `apps/api/openapi/openapi.json`
- Generated client package under `packages/api-client/src/generated/` and exports in `packages/api-client/src/index.ts`
- Web auth pages/forms under `apps/web/src/app/forgot-password`, `apps/web/src/app/reset-password`, and `apps/web/src/features/auth/`
- Tests under `apps/api/test/unit`, `apps/api/test/api`, `apps/api/test/db`, `apps/web/src/features/auth`, and `tests/e2e`
- Planning status updates in `docs/PROJECT_MASTER.md` and `docs/planning/BACKLOG.md` after implementation verification
- `graphify-out/` update only after stable tests, following DEC-072

## API plan

| Operation | Route | Preconditions | Success | Required failure behavior |
| --- | --- | --- | --- | --- |
| Request password reset | `POST /api/v1/auth/password-reset-requests` | Public + anonymous CSRF + Origin validation + abuse limits | `202 Accepted` with a generic next-step body | Same public response for absent, unverified, non-email/password, and existing accounts; only format-level validation may return `422` |
| Complete password reset | `POST /api/v1/auth/password-resets` | Public + anonymous CSRF + Origin validation + `Idempotency-Key` + abuse limits | `204 No Content`; password changed and all sessions revoked | Invalid, expired, consumed, superseded, or malformed token returns a generic safe failure shape without exposing identity state |

The reset-completion transaction must consume exactly one valid latest token, update the email/password verifier, revoke every active Session for the User, and persist the idempotency result without storing the raw token or password.

## Data plan

Add a persistence model for password reset challenges with at least:

- stable identifier
- `authenticationIdentityId`
- purpose-bound `tokenHash`
- `expiresAt`
- `consumedAt`
- `invalidatedAt` or equivalent supersession marker
- timestamps

Indexes should support:

- lookup by token hash
- invalidating unused tokens by identity
- expiry cleanup by `expiresAt`
- identity and active-token checks

Do not store raw reset tokens, URL fragments, generated links, passwords, or email bodies in durable records or logs.

## Frontend plan

- Add `/forgot-password` with an email field, generic success state, pending state, retry-safe error handling, and a return link to Login.
- Add `/reset-password` that reads the fragment token client-side, removes or avoids displaying it, and submits it in the request body with new password and confirmation.
- Show invalid/expired reset states as a safe prompt to request a new recovery email.
- After success, route to `/login?passwordReset=1` with a neutral Turkish confirmation.
- Keep forms accessible, responsive, and consistent with the existing auth cards and shadcn UI primitives.

## Security checks

- Raw token and password never appear in logs, telemetry, Problem Details, database rows, Graphify output, or test snapshots.
- Request outcomes do not enumerate account existence or verification state.
- Reset token is single-use, expires after 30 minutes, and only the latest unused token for an identity remains valid.
- Completion uses `Idempotency-Key` and rejects incompatible replay.
- All active sessions for the User are revoked after a successful reset.
- Existing cookie session is not required for recovery and is not trusted for reset authority.
- CSRF and Origin protections match existing anonymous auth mutations.

## Required tests

- Unit tests for reset-token hashing, expiry, supersession, idempotency fingerprinting, password policy, and all-session revocation intent.
- API tests for non-enumerating request responses, CSRF failures, format validation, reset success, invalid/expired/superseded/replayed token handling, and no secret echo.
- PostgreSQL/Testcontainers tests for transactional token consumption, latest-token invalidation, verifier update, and session revocation.
- Component/accessibility tests for forgot/reset forms, success, pending, and error states.
- E2E test for request email, extract fragment token from captured delivery, complete reset, log in with the new password, and verify previous sessions cannot access private routes.
- Contract checks for OpenAPI determinism and generated client type-checking.
- Security checks through dependency audit, secret scan, and redaction assertions.

## Graphify handoff

The existing graph was queried once with a bounded depth-2 search. It points BL-011 toward:

- `AccountsRepository`
- `AuthSecurityService`
- `AnonymousCsrfGuard`
- `CsrfService`
- `RequestEmailVerificationService` as an implementation pattern, not a reusable recovery service
- durable PostgreSQL jobs through `JobQueueService` and `job-runner.service.ts`
- SMTP delivery boundaries currently named for verification email
- `SessionController`
- generated client wrappers and web auth form patterns

Source documents and code remain authoritative. Do not treat the graph output as a replacement for reading the referenced files.

## Implementation order

1. Confirm clean worktree and current `develop`.
2. Read this plan, the BL-011 row in `BACKLOG.md`, UXF-004, API Contract auth rows, Domain/Data authentication rules, Architecture ARC-009 through ARC-013, and current account module code.
3. Design the Prisma migration and repository transaction first.
4. Implement backend reset request/completion services and routes.
5. Extend durable email delivery for password reset links.
6. Generate OpenAPI and the frontend client.
7. Implement Turkish web forms and route handling.
8. Add the required tests at unit, API, DB, component/accessibility, E2E, contract, and security levels.
9. Run the full quality gate.
10. Run `graphify . --update --code-only` only after stable tests, then do one targeted impact query.
11. Update `PROJECT_MASTER.md`, `BACKLOG.md`, and Graphify outputs.
12. Commit and push only after the story passes its Definition of Done and the User accepts completion.

## Validation commands

Run the standard gate unless a narrower failure-first loop is being used during development:

```bash
pnpm install --frozen-lockfile
pnpm verify:workspace
pnpm format:check
pnpm lint
pnpm verify:architecture
pnpm prisma:generate
pnpm prisma:validate
pnpm prisma:migrate:deploy
pnpm typecheck
pnpm test:unit
pnpm test:component
pnpm test:api
pnpm test:db
pnpm test:contract
pnpm build
pnpm test:e2e
pnpm test:security
docker compose config
```

## Known risks

- Token-link delivery can leak if the token is placed in a query parameter instead of the URL fragment.
- Existing email delivery names are verification-specific; rename or generalize carefully without changing BL-008 behavior.
- Reset completion must update password and revoke sessions atomically enough that no old session remains usable after success.
- Non-enumerating public responses must still provide useful Turkish UX without revealing account state.
- Graphify should not be refreshed broadly during planning-only handoff work; use the next code-only update after implementation tests are stable.

