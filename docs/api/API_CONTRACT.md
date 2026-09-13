# Personal Task Planner — Conceptual REST API, Authentication, and Security Contract

| Field | Value |
| --- | --- |
| Status | Approved — Stage 6 completed; MVP scope revised to defer social authentication |
| Planning stage | Stage 6 — API design |
| Product scope | MVP |
| Document language | English |
| Last updated | 2026-07-25 |
| Implementation status | Partially implemented through BL-008; remaining contract groups are unstarted |

This document defines the conceptual HTTP contract for the approved MVP. It describes observable REST resources, commands, authentication and session behavior, ownership enforcement, concurrency, idempotency, errors, collection semantics, and OpenAPI/client responsibilities. It does not create an OpenAPI file, controller, DTO class, backend module, persistence schema, migration, SQL statement, or production application code.

Normative terms such as **must**, **must not**, **should**, and **may** express contract obligations. Route templates below are relative to the versioned base path and describe externally observable behavior rather than framework structure.

## 1. Contract goals and boundaries

- **API-G-001 — Private by construction:** Every private request resolves its User from the authenticated server-side session and scopes all resource access to that User before returning data.
- **API-G-002 — Domain-preserving commands:** API operations preserve the approved Area, Project, Task, status, recurrence, reminder, lifecycle, and restore invariants; request shape never weakens a domain rule.
- **API-G-003 — Retry safety:** Client retries cannot create duplicate resources, recurring successors, Notifications, lifecycle effects, sample data, or account-deletion processes.
- **API-G-004 — Explicit concurrency:** Stale writes fail visibly; last-write-wins is not the default for mutable aggregates.
- **API-G-005 — Stable client contract:** Machine-readable codes, resource fields, routes, and pagination tokens are stable within v1; human-readable text may be localized.
- **API-G-006 — Web-focused authentication:** The responsive first-party web application authenticates with an opaque server-side session. Reusable bearer credentials are not exposed to browser JavaScript.
- **API-G-007 — No accidental expansion:** Collaboration, organizations, sharing, billing, public resources, GraphQL, native mobile APIs, and social authentication providers including Google remain outside MVP.

## 2. Approved Stage 6 decisions

| ID | Decision | Basis |
| --- | --- | --- |
| API-D-001 | Use `/api/v1` as the base path. A breaking contract requires a new major path; additive compatible changes remain in v1. | User-approved Stage 6 decision package; REST baseline |
| API-D-002 | Use opaque server-side sessions transported only by a production `Secure`, `HttpOnly`, `SameSite=Lax`, host-only cookie. Do not place session IDs or reusable tokens in browser storage or JSON responses. | User choice 1A; NFR-002–NFR-004 |
| API-D-003 | Protect every unsafe cookie-authenticated request with a session-bound CSRF token and strict Origin/host validation. | User choice 1A; NFR-002–NFR-003 |
| API-D-004 | Reserved beyond MVP. The former Google OpenID Connect decision is superseded for the current scope and must be replanned before any social provider is introduced. | DEC-066; deferred FR-005–FR-006 and PRV-005 |
| API-D-005 | Reserved beyond MVP. Provider identity linking and unlinking have no active MVP endpoint or workflow. | DEC-066; deferred BR-AUTH-001 |
| API-D-006 | Use strong `ETag` validators and require `If-Match` for single-resource mutations that can overwrite concurrent state. Return `428` when required preconditions are absent and `412` when stale. | User choice 2A; DD-032 |
| API-D-007 | Require `Idempotency-Key` for resource-creating requests and retry-sensitive commands. Replay an identical completed request; reject a key reused with a different request fingerprint. | User choice 2A; DD-026–DD-030, DD-034 |
| API-D-008 | Treat bulk Tasks as independently atomic items and return one result per submitted Task without disclosing whether an unavailable ID is missing or foreign-owned. | User choice 2A; BR-OWN-011, DD-033 |
| API-D-009 | Use opaque cursor pagination for potentially growing top-level collections; return bounded unpaginated collections only for small aggregate-contained sets such as one Area workflow or one Task checklist/reminder set. | User choice 3A |
| API-D-010 | Use one non-disclosing `404` policy for a missing, foreign-owned, permanently deleted, or otherwise unavailable private resource. | Mandatory user security rule; BR-OWN-010, UXF-027 |
| API-D-011 | Use RFC 9457-style `application/problem+json` errors extended with stable application codes, an opaque trace ID, and field validation details. | NFR-013, AC-014 |
| API-D-012 | The backend owns deterministic OpenAPI generation; a committed generated contract becomes the only input to the generated frontend client. Handwritten transport types and endpoint duplication are forbidden. | Fixed OpenAPI/generated-client decisions |
| API-D-013 | Persist a default-Enabled account preference for future in-app reminder Notifications. A due reminder resolves atomically to Triggered-with-Notification or Suppressed-without-Notification; disabling preserves definitions/history and re-enabling never backfills Suppressed reminders. | User choice 4B; FR-091–FR-093, BR-NOTIF-001–BR-NOTIF-003, DD-036 |

## 3. API conventions

### 3.1 Base path and versioning

- All JSON API routes use `/api/v1`.
- Health, metrics, or infrastructure endpoints are not part of this product contract and must not share private resource behavior without an Architecture decision.
- Compatible additions include new optional response fields, new endpoints, and new enum values only where the contract explicitly marks an enum extensible.
- Removing or renaming a route/field, changing meaning, making optional input required, or narrowing accepted behavior is breaking and requires `/api/v2` unless a documented migration preserves v1.
- Clients must ignore unknown response object fields but must not invent behavior for unknown stable machine codes or closed domain enums.
- Canonical statuses are a closed v1 set: `TO_DO`, `IN_PROGRESS`, and `COMPLETED`.
- Deprecated operations must remain functional for a documented transition period; exact lifecycle and support duration are an Architecture/governance decision before implementation readiness.

### 3.2 HTTP and representation conventions

- Requests and successful responses use JSON encoded as UTF-8 unless a route intentionally has no body.
- Error responses use `application/problem+json`.
- JSON property names use `camelCase`; stable machine enum values and error codes use `UPPER_SNAKE_CASE`.
- Primary identifiers are opaque strings. Clients must not parse, sort, or derive ownership from them.
- UTC instants use RFC 3339 strings with an explicit offset, normalized to `Z` in server output.
- Calendar dates use ISO `YYYY-MM-DD` strings and are never silently converted to instants.
- A nullable field explicitly sent as `null` clears the value when the operation permits clearing. An omitted PATCH field remains unchanged.
- Unknown request fields are rejected rather than silently ignored.
- User-authored strings are returned as authored after approved normalization; the API does not return HTML created from that content.
- Single-resource success bodies use `{ "data": <resource> }`. Collection bodies use `{ "data": [<resource>], "page": <page metadata> }`.
- A collection item that supports an immediate versioned mutation includes its opaque current ETag as response metadata so the client can place that exact value in `If-Match` or a bulk item precondition. This metadata is not domain data and is never parsed.
- Resource creation returns `201 Created`, a `Location` header, the representation, and an `ETag` when the resource is concurrency-controlled.
- Successful mutation normally returns `200 OK` with the resulting representation or command result and the new `ETag`. `204 No Content` is reserved for successful removals with no useful representation.
- Accepted durable work that is not physically complete, specifically account purge, returns `202 Accepted` with a privacy-safe operation state.
- The API returns an opaque request/trace identifier in errors and response metadata where needed; it never exposes stack traces, database IDs beyond resource IDs, secrets, or internal topology.

### 3.3 Request semantics

- `GET` is safe and does not mutate read state. A notification is not marked read merely by listing it.
- `PATCH` changes a subset of one resource and requires `If-Match` where listed.
- `PUT` replaces one complete subordinate configuration or sets a complete value where partial updates could violate invariants, such as an Area workflow.
- `POST` creates resources or invokes explicitly named domain commands that do not map safely to a simple resource replacement.
- Ordinary `DELETE` removes only resources whose approved lifecycle permits direct deletion, such as a Label or ChecklistItem. Area, Project, and Task permanent deletion is available only through a confirmed Trash command.
- A command must not report success until its required atomic boundary has committed. A later background effect is represented explicitly as accepted/pending rather than hidden behind a false success.

## 4. Authentication and session contract

### 4.1 Opaque session model

- A successful email/password login creates a cryptographically random opaque session identifier whose security state is stored server-side.
- In production the identifier is transported only in a host-only cookie with a `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`; no `Domain` attribute is allowed.
- The cookie value contains no User data, role, email, credential material, or authorization claims.
- Session identifiers rotate after authentication, re-authentication, password reset/change, and other privilege-sensitive transitions. Rotation invalidates the prior identifier.
- Logout invalidates the server-side session before clearing the cookie. Confirmed account deletion invalidates all sessions immediately.
- Password reset invalidates all existing sessions. Password change invalidates all other sessions and rotates the current session after successful re-authentication.
- Sessions have both idle and absolute expiry. Exact durations, renewal windows, and concurrent-session limits are Solution Architecture decisions and must be fixed before implementation readiness.
- The API never returns a bearer access token, refresh token, session ID, or password verifier to the frontend.

### 4.2 CSRF and browser-origin protection

- All unsafe methods (`POST`, `PUT`, `PATCH`, and `DELETE`) using cookie authentication require a valid `X-CSRF-Token` bound to the browser interaction and current session or anonymous auth transaction.
- A public CSRF bootstrap endpoint may return a non-secret token, but the token is useful only with its bound server/browser state.
- The server validates `Origin` for unsafe browser requests and rejects an absent or unapproved origin according to the deployed same-origin/cross-origin policy. `Referer` may be a defense-in-depth fallback, not the primary authority.
- `SameSite` is defense in depth and does not replace the CSRF token.
- CORS is disabled unless deployment requires a distinct trusted frontend origin. If enabled, it uses an explicit allowlist, permits credentials only for that allowlist, exposes required contract headers such as `ETag`, and never combines credentialed requests with `*` origins.

### 4.3 Email/password lifecycle

- Registration accepts a normalized email candidate, password, password confirmation, and required terms acknowledgement. Passwords are write-only and excluded from logs, traces, idempotency snapshots, and error echoes.
- Registration and verification-request responses do not confirm whether the email already belongs to a retained account.
- An email/password identity remains unable to complete ordinary login until verification succeeds.
- A login failure uses one generic credential error. A caller who proves the correct password for an unverified identity may receive the safe `EMAIL_VERIFICATION_REQUIRED` recovery state.
- Verification and password-reset actions use random, single-use, purpose-bound, expiring tokens. The API receives the raw token only for confirmation; durable storage must not retain a reusable plaintext token.
- Password-reset request responses are identical for existing and non-existing accounts.
- Password policy details and token/session expiry durations remain Security/Architecture parameters, but the contract requires server-side validation, a non-secret stable validation code, and no account enumeration.

### 4.4 Deferred social authentication

Google and every other social authentication provider are outside the MVP. The API exposes no provider authorization, callback, identity-linking, or identity-unlinking route. Deferred IDs `FR-005`, `FR-006`, and `PRV-005` remain reserved and are not active contract obligations. Introducing a provider later requires a fresh product, UX, domain, data, API, security, architecture, and backlog decision; the former provider-specific design is not implicitly approved for future implementation.

## 5. Ownership, authorization, and enumeration resistance

- Authentication is evaluated before any private resource lookup. An absent, expired, or invalid session returns `401` without probing a supplied private identifier.
- After authentication, every repository/query scope begins with `session.userId` and follows owner-inclusive relationships. A request body cannot select or override `userId`.
- For an item route, these cases have exactly the same public result: unknown ID, another User's ID, permanently deleted ID, incompatible parent path, or private resource otherwise unavailable to the requester. The result is `404` with code `RESOURCE_NOT_FOUND` and no distinguishing metadata.
- Nested routes verify both the child and owned parent path. A User cannot use a valid owned child under a foreign or incorrect parent path to learn relationship facts.
- Collections, counts, search, filters, Kanban, Archive, Trash, and notifications include only the current User's eligible data; they never return redacted foreign placeholders or foreign totals.
- Bulk item failures use the same `RESOURCE_NOT_FOUND` result for missing and foreign IDs. They do not state which unavailable condition occurred.
- `403 Forbidden` is reserved for a known authenticated/session-level prohibition that does not reveal private resource existence, such as invalid CSRF/origin or a disabled account policy. Domain-state conflicts use `409`, validation uses `422`, and foreign private objects do not use `403`.
- Ownership denial is evaluated before disclosing version, lifecycle, parent, recurrence, retention, or validation details about the requested private resource.
- Background recurrence, reminder, Trash expiry, and account-deletion work applies the same owner consistency rules even though it is not driven by a browser session.

**Traceability:** FR-007, FR-011–FR-012, FR-066, NFR-001–NFR-004, PRV-001–PRV-004, PRV-008–PRV-009, AC-002, AC-014; BR-OWN-001–BR-OWN-012; DD-002–DD-003; UXF-027.

## 6. Error response contract

### 6.1 Problem Details shape

Every non-empty error body follows this conceptual shape:

| Member | Required | Meaning |
| --- | --- | --- |
| `type` | Yes | Stable URI identifying the problem category. It contains no private resource identifier. |
| `title` | Yes | Short human-readable summary, localizable and stable for the problem type. |
| `status` | Yes | HTTP status and equal to the actual response status. |
| `detail` | No | Safe corrective explanation for this occurrence; clients do not parse it for control flow. |
| `instance` | No | Opaque occurrence URI/reference that exposes no internal path or private identifier. |
| `code` | Yes | Stable application machine code. |
| `traceId` | Yes | Opaque support correlation value; never a credential. |
| `errors` | Validation only | Ordered field/item validation details. |
| `retryAfterSeconds` | Rate/temporary errors only | Non-negative delay consistent with `Retry-After` when supplied. |

Human-readable `title`, `detail`, and validation `message` may be localized. `type`, `code`, `path`, and HTTP status remain locale-independent. Error text never includes password input, tokens, cookie values, foreign content, stack traces, SQL, or raw dependency responses.

### 6.2 Validation errors

Semantic validation returns `422 Unprocessable Content` and `code: VALIDATION_FAILED`. Each `errors` entry contains:

| Member | Required | Meaning |
| --- | --- | --- |
| `code` | Yes | Stable rule code such as `REQUIRED`, `INVALID_FORMAT`, `INCOMPATIBLE_PROJECT`, or `REMINDER_REQUIRES_TIME`. |
| `path` | Yes | JSON Pointer to the request field or submitted item. |
| `message` | Yes | Safe localized correction guidance. |
| `meta` | No | Non-sensitive structured limits or allowed stable enum values. |

Rejected password/token values are never echoed. A foreign identifier is not reported as an ownership validation error; it follows the non-disclosing `404` policy.

### 6.3 Standard status and code policy

| HTTP | Representative code | Contract meaning |
| --- | --- | --- |
| `400` | `MALFORMED_REQUEST` | Invalid JSON, unsupported content type, malformed query syntax, or structurally unreadable request. |
| `401` | `AUTHENTICATION_REQUIRED` | No valid session. Login failure uses `AUTHENTICATION_FAILED` without account detail. |
| `403` | `REQUEST_FORBIDDEN` | CSRF/origin/session-level policy failure that does not depend on private resource ownership. |
| `404` | `RESOURCE_NOT_FOUND` | Missing, foreign-owned, deleted, wrong-parent, or unavailable private resource. |
| `409` | `DOMAIN_CONFLICT` | Current valid state prevents the command: duplicate normalized name, invalid recurrence reopening, lifecycle race, or idempotency still in progress. |
| `412` | `PRECONDITION_FAILED` | Supplied `If-Match` or submitted bulk item ETag is stale. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Unsupported request representation. |
| `422` | `VALIDATION_FAILED` | Well-formed input violates field or cross-field rules; includes safe validation entries. |
| `428` | `PRECONDITION_REQUIRED` | A required `If-Match` or item precondition was omitted. |
| `429` | `RATE_LIMITED` | Request exceeds an abuse/quota policy; uses generic non-enumerating detail and `Retry-After`. |
| `500` | `INTERNAL_ERROR` | Unexpected failure with only a trace ID and neutral detail. |
| `503` | `SERVICE_UNAVAILABLE` | Temporary dependency/service inability where retry is appropriate and safe. |

## 7. Collection, pagination, filtering, sorting, and search

### 7.1 Cursor pagination

- Potentially growing top-level collections use `limit` and `cursor` query parameters.
- Default `limit` is 50 and maximum `limit` is 100 unless a later measured endpoint-specific limit is documented without weakening client compatibility.
- `cursor` is opaque, tamper-evident, scoped to the authenticated User, and bound to the endpoint, effective filters, search expression, and sort tuple. Clients only store and return it.
- Results use a stable final Task/resource-ID tie-breaker after the documented sort keys.
- A page response contains `page.nextCursor` (nullable) and `page.hasMore`. Exact total counts are not returned by default because they are expensive, race-prone, and unnecessary for approved flows.
- A cursor used with changed filters/sort, an expired cursor, or a malformed cursor returns `400 INVALID_CURSOR` without exposing cursor contents.
- Pagination does not guarantee a frozen snapshot across a long browsing session. Stable ordering and cursor semantics minimize duplicates/skips; a client refresh starts from the first page.
- One Area's workflow statuses and one Task's checklist/reminder collection are returned as bounded unpaginated aggregate-contained sets. A future measured limit may require a version-compatible pagination addition.

### 7.2 Filtering

- Repeated values within one filter category use OR semantics; different categories combine with AND semantics, matching the approved UX.
- Supported Task filters are Area, Project, canonical status, Area status when scoped coherently, priority, Label, planned-date state, due-date state, overdue state, and lifecycle scope where the endpoint allows it.
- Active Tasks are the default for ordinary Task/List/Kanban/Today/search endpoints. Archive and Trash require their dedicated endpoints.
- Project filters are valid only with compatible owned Area context. An incompatible owned combination returns an empty collection rather than revealing a foreign relationship; malformed combinations return `422`.
- Filter values are allowlisted. Arbitrary field names, raw database predicates, SQL-like expressions, and owner selectors are forbidden.
- Date filters use the authenticated User's confirmed account time zone and approved date-only/instant semantics.

### 7.3 Sorting

- Global Task List supports `sort=plannedDate|dueDate|priority|title|createdAt|updatedAt|canonicalStatus` and `order=asc|desc`.
- Default List sorting is planned date ascending, due date ascending, priority, title, then Task ID; missing date values appear after dated values unless a documented sort says otherwise.
- Today uses the approved section precedence and within-section automatic ordering; it does not accept manual Kanban rank as a List sort.
- Global and Area Kanban endpoints sort by their independent opaque rank followed by Task ID. The rank itself need not be exposed.
- Archive and Trash default to lifecycle timestamp descending; Trash also supports purge deadline ascending.
- Notifications default to created time descending.
- Sorting never mutates data. Reordering requires an explicit Kanban/checklist/workflow command.

### 7.4 Search

- MVP full search covers Task title and description in the current User's active data. Labels are applied as filters rather than implicit free-text matches.
- Search accepts a bounded `q` value, cursor pagination, supported Task filters, and an approved relevance or deterministic field sort.
- Search result snippets, when provided, contain only the current User's content and are safely escaped. They never reveal archived/trashed content unless the dedicated lifecycle scope explicitly owns the query.
- Empty results reveal nothing about other Users. Search suggestions and counts use the same owner and lifecycle scope as results.

**Traceability:** FR-044, FR-059–FR-069, FR-077, FR-090, NFR-001, NFR-005, AC-006, AC-009–AC-010; UXF-006, UXF-015–UXF-019; DD-020–DD-022, DD-035.

## 8. Concurrency, idempotency, and bulk behavior

### 8.1 ETag and preconditions

- A concurrency-controlled item response emits a strong opaque `ETag` representing the current mutable version.
- `PATCH`, `PUT`, and single-resource state-changing commands listed as versioned require `If-Match` with the most recently observed ETag.
- A missing required validator returns `428 PRECONDITION_REQUIRED`; a non-matching validator returns `412 PRECONDITION_FAILED` and does not apply any mutation.
- A successful mutation returns the new representation and ETag. Clients refresh and reapply intent after `412`; they must not automatically overwrite with a wildcard.
- Ownership is resolved before ETag detail. A foreign resource returns the same `404` as missing, never `412` or a current ETag.
- Multi-resource commands that cannot use one header validator carry per-item opaque ETags in the command body. This is the only approved exception to header-based single-resource preconditions.
- Server-side uniqueness, serialization, and domain guards remain authoritative. ETags prevent lost updates but are not the only recurrence, lifecycle, or ownership safeguard.

### 8.2 Idempotency-Key

- `Idempotency-Key` is required on resource-creating POSTs and commands explicitly marked `Idem` in the endpoint catalog.
- The key is an opaque high-entropy client value, scoped by authenticated User (or by the anonymous auth transaction where applicable), HTTP method, and normalized route.
- The server fingerprints the validated request body and relevant command parameters without storing raw passwords, tokens, cookies, or unnecessary authored content in idempotency metadata.
- Repeating the same key and fingerprint during the minimum 24-hour replay window returns the original committed status and semantic response, including the same created resource identity.
- Reusing a key with a different fingerprint returns `422 IDEMPOTENCY_KEY_REUSED`. A concurrent duplicate still processing returns `409 IDEMPOTENCY_IN_PROGRESS` with a safe retry hint.
- Failed authentication, malformed requests, CSRF failures, and pre-validation failures do not create a reusable success record. Once business execution begins, the endpoint defines whether a deterministic failed result is replayed.
- Domain uniqueness remains the final correctness guard: recurrence successor generation uses predecessor/generation identity; Notification creation uses TaskReminder identity; account deletion uses its durable process identity.

### 8.3 Bulk Task actions

- `POST /tasks/bulk-actions` accepts an operation, an explicit ordered list of Task IDs with each Task's observed ETag, and operation-specific parameters.
- Supported MVP operations are canonical/Area status change where coherent, Label add/remove, Archive, and move to Trash.
- A global canonical status command resolves the target default independently for each Task's Area. An Area-status command is valid only for Tasks in that Area.
- The request requires `Idempotency-Key`; each item is atomic and independently authorized and validated.
- The response is `200` when the batch request was processed, even if some items failed. It includes one result per submitted item in request order with `SUCCEEDED` or `FAILED`, the resulting representation/ETag when successful, and a safe Problem summary when failed.
- A completely malformed batch returns a top-level `400`/`422`; it does not begin item work. A valid batch may report partial success as approved by the UX and data model.
- Duplicate Task IDs in one request are rejected before execution. Maximum batch size is an Architecture capacity parameter, documented and represented by stable validation metadata before implementation readiness.
- Missing and foreign IDs receive identical item-level `404 RESOURCE_NOT_FOUND`; foreign existence is never confirmed.

**Traceability:** FR-036, FR-050, FR-070–FR-082, FR-087–FR-090, NFR-005–NFR-007, NFR-013, AC-007, AC-010–AC-011; BR-OWN-011, BR-REC-007; DD-026–DD-034.

## 9. Rate limiting and abuse-resistance expectations

- Unauthenticated registration, login, email verification request, password-reset request, and token-confirmation routes receive stricter per-network, per-transaction, and privacy-safe identity-derived controls.
- Authenticated APIs receive per-User and endpoint-class controls, with stricter limits for search, bulk commands, lifecycle cascades, identity changes, and account deletion than for ordinary reads.
- Limits must slow credential stuffing, enumeration, email flooding, replay, and resource-exhaustion attempts without using a response that reveals whether an account or private resource exists.
- A rate-limited request returns `429 RATE_LIMITED` and `Retry-After`; exact quota counters or partition keys are omitted when their disclosure could aid enumeration or traffic analysis.
- Rate limiting is not authorization, ownership enforcement, CSRF protection, or idempotency and cannot replace any of them.
- Successful login does not reset evidence needed for abuse detection. Conversely, a simple permanent lockout based only on attacker-controlled failed attempts is forbidden.

The MVP baseline applies the most restrictive matching class:

| Class | Initial limit |
| --- | --- |
| Public login and token-confirmation attempts | 5 per 15 minutes per privacy-safe normalized identity key and 30 per 15 minutes per trusted network prefix |
| Registration, verification-email request, and password-reset request | 3 per hour per privacy-safe normalized identity key and 20 per hour per trusted network prefix |
| Authenticated ordinary reads | 120 per minute per User, with a burst ceiling of 30 per 10 seconds |
| Authenticated ordinary mutations | 60 per minute per User, with a burst ceiling of 15 per 10 seconds |
| Search | 30 per minute per User |
| Bulk commands and lifecycle cascades | 10 per minute per User, with the separate 100-item request maximum |
| Identity changes and account deletion | 5 per 15 minutes per User |

Sensitive public-authentication counters are persisted in PostgreSQL; general per-User endpoint counters may remain process-local while the approved topology has one API replica. The API trusts only the validated environment-specific ingress hop count. Operations alert when a route class exceeds both 20 limited requests and a 10% limited-request ratio for five consecutive minutes. Emergency relaxation is documented, attributable, expires within 60 minutes, and cannot disable authorization, CSRF, ownership, enumeration resistance, or idempotency; tightening may be applied immediately. These parameters are configuration defaults and must be represented in tests and deployment smoke checks.

**Traceability:** FR-007, FR-012, NFR-001–NFR-004, NFR-008, PRV-004, PRV-009, AC-001–AC-002, AC-014.

## 10. Endpoint catalog conventions

Endpoint paths in the following sections are relative to `/api/v1`.

| Marker | Meaning |
| --- | --- |
| `Public` | No authenticated User required; CSRF and abuse controls still apply where stated. |
| `Session` | Valid first-party opaque session required. |
| `Recent re-auth` | Valid session plus a short-lived re-authentication proof bound to the current session and action. |
| `If-Match` | Current single-resource ETag required. |
| `Idem` | `Idempotency-Key` required. |

All private endpoints inherit the ownership and non-disclosure rules in Section 5 even when the row below abbreviates them.

## 11. Authentication endpoints

**Purpose:** Establish, recover, rotate, inspect, or end a first-party email/password authenticated session.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /auth/csrf` | Public or Session | Token binds only to the caller's anonymous transaction/session. | None. | `200` CSRF token and expiry metadata; no session ID. | `429`, `503`. | NFR-002–NFR-003 |
| `GET /auth/session` | Public; no private lookup without valid cookie | Returns only the current valid session state. | None. | `200` authenticated boolean and, when authenticated, safe User/session-expiry summary. | `429`, `503`. Invalid cookie is represented as unauthenticated. | FR-003, FR-010, FR-012 |
| `POST /auth/register` | Public + CSRF; abuse-limited | Never confirms whether normalized email is retained. | Email, password, confirmation, terms acceptance. | `202` generic verification-next-step result. | `422` safe policy errors, `429`, `503`; no duplicate-account disclosure. | FR-001–FR-002, FR-007, AC-001 |
| `POST /auth/email-verification-requests` | Public + CSRF | Same response for existing, verified, pending, or absent email. | Email. | `202` generic result. | `422` format only, `429`, `503`. | FR-002, FR-007, NFR-002 |
| `POST /auth/email-verifications` | Public + CSRF; `Idem` | The manual code is purpose-bound and submitted only in the dedicated body; response does not reveal unrelated identity state. | Normalized email and single-use eight-digit verification code; never a URL/query credential. | `200` verified result and safe login next step without creating a session. | `409` already-consumed or in-progress semantic replay when not idempotently resolved, `422` invalid/expired code or idempotency-key reuse, `429`. | FR-002–FR-003, AC-001; DEC-071 |
| `POST /auth/sessions` | Public + CSRF | Credential lookup and error are non-enumerating. | Email, password, safe allowlisted return intent. | `200` safe User/session summary; opaque cookie set and rotated. | `401 AUTHENTICATION_FAILED`, `409 EMAIL_VERIFICATION_REQUIRED` only after correct credential proof, `429`. | FR-003, FR-007, NFR-002, AC-001 |
| `DELETE /auth/session` | CSRF; the current session is used when present, while a missing or already-invalid session remains idempotent. | If a valid token exists, invalidates only that current session. Missing, expired, or already-revoked tokens produce the same non-disclosing outcome. | None. | `204` after server-side revocation commits; the cookie is then cleared with matching scope. | `403` CSRF, `429`, `503`; a server-side failure does not clear the cookie. | FR-003, FR-010, FR-012, NFR-002 |
| `POST /auth/password-reset-requests` | Public + CSRF | Same response regardless of account or identity existence. | Email. | `202` generic result. | `422` format only, `429`, `503`. | FR-004, FR-007, NFR-002 |
| `POST /auth/password-resets` | Public + CSRF; `Idem` | Token grants only its purpose; success invalidates all sessions for that User. | Single-use token, new password, confirmation. | `204`; existing sessions revoked. | `422` invalid/expired token or password policy, `429`. | FR-004, FR-007, FR-010, AC-001 |
| `POST /auth/reauthentications` | Session + CSRF | Acts only on current User. | Current password. | `200` short-lived action-bound re-auth proof metadata; no reusable secret body. | `401`, `409` credential unavailable, `429`. | FR-004, FR-008–FR-010, NFR-002, BR-AUTH-002–BR-AUTH-003, UXF-026 |

## 12. Current User and account endpoints

**Purpose:** Read and update the authenticated account, preferences, onboarding, password credential, and irreversible account-deletion process.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /users/me` | Session | Always resolves from session; no arbitrary User ID route exists. | None. | `200` current User profile/preferences/onboarding/account state, including the in-app reminder Notification preference, + `ETag`. | `401`, `429`, `503`. | FR-011–FR-012, FR-045–FR-046, FR-091 |
| `PATCH /users/me` | Session + CSRF + `If-Match` | Current User only. | Display name, confirmed account time zone, and/or `inAppReminderNotificationsEnabled`; no email/owner field. Disabling requires explicit acknowledged consequences. | `200` updated User + new `ETag`; timed display changes do not rewrite stored instants, and preference changes do not delete reminders or Notification history. | `401`, `412`, `422`, `428`, `429`. | FR-045–FR-046, FR-091–FR-093, NFR-012, UXF-024, AC-016 |
| `POST /users/me/onboarding-completions` | Session + CSRF + `If-Match`; `Idem` | Sample data belongs only to current User. | Confirmed `CREATE_SAMPLE_DATA` or `START_EMPTY`, confirmed time zone when pending. | `200` completed onboarding summary and created owned resource links when applicable; new User `ETag`. | `409` already completed with incompatible choice, `412`, `422`, `428`, `429`, `503`. | FR-013–FR-016, PRV-003, AC-003 |
| `PUT /users/me/password` | Session + CSRF + recent re-auth + `If-Match` | Current User's eligible email/password identity only. | New password and confirmation; current proof supplied through re-auth, not echoed. | `204`; other sessions revoked and current session rotated. | `401`, `404`, `409` identity unavailable, `412`, `422`, `428`, `429`. | FR-004, NFR-002, UXF-025 |
| `POST /users/me/account-deletions` | Session + CSRF + recent re-auth + `If-Match`; `Idem` | Current User only; repeated confirmation resolves to one process. | Explicit irreversible confirmation. | `202` privacy-safe deletion-process state; all access revoked immediately. | `401`, `409` process conflict, `412`, `422`, `428`, `429`, `503`. | FR-008–FR-010, PRV-007, DD-030–DD-031, UXF-026 |

## 13. Area endpoints

**Purpose:** Manage the required top-level responsibility contexts without bypassing lifecycle or workflow invariants.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /areas` | Session | Current User only. | Cursor, limit; lifecycle defaults to active; allowed automatic sort. | `200` Area summaries and page metadata. | `400` cursor/query, `401`, `429`. | FR-017, FR-063, UXF-007 |
| `POST /areas` | Session + CSRF; `Idem` | New Area is owned by current User; owner input forbidden. | Non-blank name. | `201` Area with three valid default statuses, `Location`, `ETag`. | `401`, `422`, `429`, `503`. | FR-017–FR-019, FR-087–FR-089, DD-034 |
| `GET /areas/{areaId}` | Session | Owned Area; foreign/missing/unavailable is `404`. | None. | `200` Area detail/summary + `ETag`. | `401`, `404`, `429`. | FR-017, FR-064 |
| `PATCH /areas/{areaId}` | Session + CSRF + `If-Match` | Owned Area only. | Rename only in MVP; lifecycle/workflow excluded. | `200` updated Area + new `ETag`. | `401`, `404`, `412`, `422`, `428`, `429`. | FR-017, NFR-005 |

Area Archive, Trash, restore, and permanent deletion are defined in Sections 21 and 22. There is no ordinary Area `DELETE` route.

## 14. Area status and workflow endpoints

**Purpose:** Read and atomically replace one Area's local workflow while retaining exactly one default status in each canonical group and reconciling affected Tasks.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /areas/{areaId}/statuses` | Session | Area and statuses must belong to current User. | None; bounded/unpaginated. | `200` ordered active/retired status summaries, canonical mappings, defaults, workflow `ETag`. | `401`, `404`, `429`. | FR-087–FR-090, BR-STATUS-001–BR-STATUS-005 |
| `PUT /areas/{areaId}/workflow` | Session + CSRF + `If-Match`; `Idem` | Owned active Area; every referenced Task/status is same Area/User. | Complete desired active status set/order/mappings/defaults, retained/retired IDs, and replacement mapping for affected Tasks. | `200` committed workflow and affected counts + new Area/workflow `ETag`. | `401`, `404`, `409` concurrent/in-use conflict, `412`, `422` missing group/default or invalid replacement, `428`, `429`. | FR-034–FR-040, FR-087–FR-090, DD-010–DD-011, DD-034 |

Independent status deletion or isolated canonical-mapping mutation is intentionally absent because it could transiently violate Area workflow invariants.

## 15. Project endpoints

**Purpose:** Manage optional Task grouping within an owned Area, including the approved atomic Project-and-Task Area move.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /projects` | Session | Current User only. | Cursor, limit, optional owned Area filter, lifecycle active by default, default sort. | `200` Project summaries (with task/completed counts) and page metadata. | `400`, `401`, `429`. | FR-020–FR-023, UXF-009 |
| `POST /projects` | Session + CSRF; `Idem` | Target active Area belongs to current User. | Area ID and non-blank name. | `201` Project + `Location` + `ETag`. | `401`, `404` Area unavailable, `422`, `429`. | FR-020–FR-021, AC-004 |
| `GET /projects/{projectId}` | Session | Owned Project; foreign/missing/unavailable is `404`. | None. | `200` Project detail/summary + `ETag`. | `401`, `404`, `429`. | FR-020–FR-023, FR-064 |
| `PATCH /projects/{projectId}` | Session + CSRF + `If-Match` | Owned Project only. | Exactly one of `name` (rename) or `areaId` (move to another owned active Area). | `200` updated Project + new `ETag`; moves also include `movedTasks` count. | `401`, `404`, `412`, `422`, `428`, `429`. | FR-020, FR-023–FR-026, BR-PROJ-001–BR-PROJ-003, DD-034, NFR-005 |

Project lifecycle endpoints are defined in Sections 21 and 22. There is no ordinary Project `DELETE` route. The atomic Area move is modeled on the Project itself (Section 15); it is not a separate `/area-moves` route.

## 16. Task, Today, List, Kanban, recurrence, and bulk endpoints

**Purpose:** Expose one consistent owned Task resource across capture, detail, automatic List/Today projections, manual boards, status transitions, moves, recurrence, and bulk maintenance.

### 16.1 Task collections and projections

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /tasks` | Session | Current User active Tasks only. | Cursor, limit, approved filters, List sort/order. | `200` Task summaries and page metadata. | `400` query/cursor, `401`, `422` incoherent owned filters, `429`. | FR-059, FR-063–FR-069, UXF-015 |
| `GET /tasks/today` | Session | Current User active eligible Tasks only. | Cursor/limit per section or bounded section options, approved filters/sort. | `200` account-local date/time zone and Overdue, Planned Today, Due Today, Completed Today projections with unique Task inclusion/reason badges. | `400`, `401`, `422`, `429`. | FR-041–FR-046, FR-061–FR-062, AC-009, UXF-006 |
| `GET /tasks/kanban` | Session | Current User active Tasks only. | Per-group cursor/limit and approved filters. | `200` exactly three canonical groups; cards ordered by Global rank then Task ID. | `400`, `401`, `422`, `429`. | FR-060, FR-067–FR-069, UXF-016 |
| `GET /areas/{areaId}/tasks` | Session | Owned active Area and its current User Tasks only. | Cursor, limit, Project/status/Label/date filters, List sort. | `200` Area-scoped Task summaries and page metadata. | `400`, `401`, `404`, `422`, `429`. | FR-017–FR-024, FR-059, UXF-008 |
| `GET /areas/{areaId}/kanban` | Session | Owned active Area and its Tasks/statuses only. | Per-status cursor/limit and approved filters. | `200` ordered AreaStatus columns and cards ordered by Area rank then Task ID. | `400`, `401`, `404`, `422`, `429`. | FR-087–FR-090, UXF-017 |

### 16.2 Task resource and mutation commands

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /tasks` | Session + CSRF; `Idem` | Area required and owned; optional Project and AreaStatus must match User/Area; Labels same User. | Title, Area, optional compatible Project/status, description, planned/due values, priority, Label IDs, checklist items, optional recurrence/reminders. | `201` complete Task representation + `Location` + `ETag`. | `401`, `404` unavailable relationship, `409` duplicate recurrence conflict, `422`, `429`. | FR-018–FR-058, AC-004–AC-008, DD-008–DD-010 |
| `GET /tasks/{taskId}` | Session | Owned retained Task visible in the route's lifecycle context; foreign/missing is `404`. | None. | `200` Task detail including safe relationship links, recurrence/reminder/checklist/Label state + `ETag`. | `401`, `404`, `429`. | FR-027–FR-058, FR-064 |
| `PATCH /tasks/{taskId}` | Session + CSRF + `If-Match` | Owned, effectively active Task. Cross-boundary Area/status/recurrence/lifecycle changes excluded. | Title, description, planned/due values, priority, and compatible Label-set changes; null clears nullable values. | `200` updated Task + new `ETag`; reminders are atomically revalidated/recalculated when anchors change. | `401`, `404`, `409` reminder/recurrence conflict, `412`, `422`, `428`, `429`. | FR-027–FR-055, NFR-005–NFR-006, DD-029 |
| `POST /tasks/{taskId}/area-moves` | Session + CSRF + `If-Match`; `Idem` | Task, target Area, optional Project/status same User; recurring scope owned. | Target Area, optional compatible Project, optional target status, and recurrence scope where applicable. | `200` atomically reconciled Task/future context + new `ETag`. | `401`, `404`, `409` invalid series/parent state, `412`, `422`, `428`, `429`. | FR-023–FR-025, BR-TASK-003–BR-TASK-004, DD-034 |
| `POST /tasks/{taskId}/status-transitions` | Session + CSRF + `If-Match`; `Idem` | Owned active Task; target exact AreaStatus or canonical target resolves within owned Area. | Exactly one target form: `areaStatusId` or `canonicalStatus`; optional completion metadata contains no client-selected successor ID. | `200` transitioned Task + new `ETag`; when completion is recurring, response includes the one created/found successor summary and its ETag. | `401`, `404`, `409` reopen/successor or workflow conflict, `412`, `422`, `428`, `429`. | FR-034–FR-040, FR-050–FR-053, BR-WF-001–BR-WF-004, DD-026–DD-027 |
| `PUT /tasks/{taskId}/recurrence` | Session + CSRF + `If-Match`; `Idem` | Owned active Task/Series; future relationships remain same User and compatible Area. | Calendar- or completion-based complete rule, recurrence anchor/template, edit scope `THIS_OCCURRENCE` or `THIS_AND_FUTURE` where valid. | `200` Task/Series recurrence summary, rule preview, rule version, new `ETag`. | `401`, `404`, `409` series/open-occurrence conflict, `412`, `422`, `428`, `429`. | FR-047–FR-053, BR-REC-001–BR-REC-012, DD-023–DD-027 |
| `DELETE /tasks/{taskId}/recurrence` | Session + CSRF + `If-Match` | Owned active Task/Series only. | Explicit future-stop scope conveyed as documented query/confirmation input. | `200` Task with stopped future recurrence + new `ETag`; history unchanged. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-053, BR-REC-010–BR-REC-011 |
| `POST /tasks/bulk-actions` | Session + CSRF; `Idem` + per-item ETags | Every item independently scoped to current User. | Operation, ordered unique Task items, operation-specific status/Label/lifecycle input. | `200` per-item success/failure results; successful representations carry new ETags. | Top-level `400`/`422`; item `404`, `409`, `412`, `422`; `401`, `429`. | FR-070–FR-072, BR-OWN-011, DD-033 |

### 16.3 Kanban movement commands

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /tasks/kanban-moves` | Session + CSRF; `Idem` + submitted Task ETag | Task belongs to current User; destination canonical group resolves via that Task's owned Area default. | Task ID/ETag, target canonical status, optional before/after owned Task anchors from the same destination group. | `200` Task status/global order result + new `ETag`; recurrence completion result when applicable. | `401`, `404`, `409` invalid anchors/workflow/reopen, `412`, `422`, `429`. | FR-034–FR-040, FR-060, BR-STATUS-002, DD-020–DD-021 |
| `POST /areas/{areaId}/kanban-moves` | Session + CSRF; `Idem` + submitted Task ETag | Area, Task, target status, and anchors all belong to current User and same Area. | Task ID/ETag, target AreaStatus, optional before/after Task anchors. | `200` Task status/Area order result + new `ETag`; derived canonical state updated atomically. | `401`, `404`, `409`, `412`, `422`, `429`. | FR-087–FR-090, BR-STATUS-003, DD-020–DD-021 |

Task Archive/Trash/permanent-deletion behavior is defined only in Sections 21 and 22. There is no ordinary Task `DELETE` route.

## 17. Checklist endpoints

**Purpose:** Manage the ordered checklist contained by one owned Task without allowing independent lifecycle or cross-Task ownership changes.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /tasks/{taskId}/checklist-items` | Session | Owned Task; items inherit Task visibility. | None; bounded/unpaginated ordered set. | `200` checklist in position order and Task `ETag`. | `401`, `404`, `429`. | FR-032–FR-033, AC-005 |
| `POST /tasks/{taskId}/checklist-items` | Session + CSRF + Task `If-Match`; `Idem` | Owned active Task; owner input forbidden. | Non-blank text and optional insertion anchor/position intent. | `201` item and updated Task `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-032–FR-033, DD-019 |
| `PATCH /tasks/{taskId}/checklist-items/{checklistItemId}` | Session + CSRF + Task `If-Match` | Item must belong to the owned Task path; mismatch is `404`. | Text and/or completed state. | `200` item and updated Task `ETag`. | `401`, `404`, `412`, `422`, `428`, `429`. | FR-033, ChecklistItem invariants |
| `DELETE /tasks/{taskId}/checklist-items/{checklistItemId}` | Session + CSRF + Task `If-Match` | Same owned Task containment. | None. | `204` and updated Task ETag response metadata. | `401`, `404`, `412`, `428`, `429`. | FR-033, DD-019 |
| `PUT /tasks/{taskId}/checklist-order` | Session + CSRF + Task `If-Match`; `Idem` | Submitted set contains only items of the owned Task. | Complete ordered item-ID sequence or equivalent deterministic move. | `200` reordered checklist and updated Task `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-033, DD-019, DD-032 |

## 18. Label endpoints

**Purpose:** Manage reusable User-wide Labels and allow Task assignment only through same-owner relationships.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /labels` | Session | Current User Labels only. | Cursor, limit, normalized-name query/sort. | `200` Label page. | `400`, `401`, `429`. | FR-031, FR-067 |
| `POST /labels` | Session + CSRF; `Idem` | New Label belongs to current User. | Non-blank display name. | `201` Label + `Location` + `ETag`. | `401`, `409 LABEL_NAME_CONFLICT`, `422`, `429`. | FR-031, DD-017 |
| `GET /labels/{labelId}` | Session | Owned Label; foreign/missing is `404`. | None. | `200` Label + `ETag`. | `401`, `404`, `429`. | FR-031, NFR-001 |
| `PATCH /labels/{labelId}` | Session + CSRF + `If-Match` | Owned Label. | New display name. | `200` renamed Label + new `ETag`. | `401`, `404`, `409` normalized duplicate, `412`, `422`, `428`, `429`. | FR-031, DD-017 |
| `DELETE /labels/{labelId}` | Session + CSRF + `If-Match` | Owned Label only. | Explicit confirmation when assignments exist. | `204`; TaskLabel associations removed, Tasks retained. | `401`, `404`, `412`, `428`, `429`. | FR-031, FR-081, DD-018 |

Task Label assignment is accepted only through Task mutation/bulk action with compatible owned Label IDs. A Label route never accepts a Task belonging to another User.

## 19. Task reminder endpoints

**Purpose:** Manage date/time-dependent in-app reminder definitions contained by one owned Task; delivery history remains Notification data.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /tasks/{taskId}/reminders` | Session | Owned Task; reminders inherit visibility. | None; bounded/unpaginated chronological set. | `200` reminder definitions/schedules and Task `ETag`. | `401`, `404`, `429`. | FR-054–FR-058, AC-008 |
| `POST /tasks/{taskId}/reminders` | Session + CSRF + Task `If-Match`; `Idem` | Owned active Task. | Planned/due anchor kind and approved at-time/offset rule. | `201` resolved reminder and updated Task `ETag`. | `401`, `404`, `409` equivalent reminder, `412`, `422 REMINDER_REQUIRES_TIME`, `428`, `429`. | FR-054–FR-055, DD-028–DD-029 |
| `PATCH /tasks/{taskId}/reminders/{reminderId}` | Session + CSRF + Task `If-Match` | Reminder must belong to owned Task path. | Anchor/rule changes. | `200` recalculated reminder and updated Task `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | BR-REM-001, DD-029 |
| `DELETE /tasks/{taskId}/reminders/{reminderId}` | Session + CSRF + Task `If-Match` | Same owned Task containment. | None. | `204` and updated Task ETag response metadata. | `401`, `404`, `412`, `428`, `429`. | FR-054, BR-REM-001 |

No email, SMS, native-push, or arbitrary delivery-channel field is accepted in MVP.

## 20. Notification endpoints

**Purpose:** List private in-app reminder delivery records and update read state without disclosing unavailable Task content.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /notifications` | Session | Current User Notifications only. | Cursor, limit, read-state filter; created-time sort. | `200` Notification page; unavailable retained Task target uses generic metadata. | `400`, `401`, `429`. | FR-056–FR-057, UXF-021 |
| `GET /notifications/summary` | Session | Current User only. | None. | `200` unread count and latest safe timestamp. | `401`, `429`. | FR-057, A11Y-009 |
| `PATCH /notifications/{notificationId}` | Session + CSRF + `If-Match` | Owned Notification; foreign/missing is `404`. | Read state may move only to Read in MVP. | `200` Notification + new `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-057, Notification invariants |
| `POST /notifications/read-actions` | Session + CSRF; `Idem` + per-item ETags when IDs supplied | Only current User's explicit IDs or current owned visible filter scope. | Unique Notification IDs/ETags or an explicit owned visible-scope selector. | `200` affected count and safe per-item failures where applicable. | `400`, `401`, item `404`/`412`, `422`, `429`. | FR-057, UXF-021 |

Notification creation is an internal idempotent reminder-trigger operation, not a public client endpoint. Clients cannot forge a Notification or select another TaskReminder source.

At the due-time consistency boundary, the internal operation reads the current User preference. Enabled transitions the reminder to Triggered and creates or returns its unique Notification. Disabled transitions it to Suppressed and returns no Notification. Preference changes never delete existing Notification records, and Suppressed reminders are not backfilled after re-enabling.

## 21. Archive endpoints

**Purpose:** List recoverable archived roots and perform explicit Archive/restore commands with cascade provenance; Archive has no expiry and is distinct from Trash.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /archive` | Session | Current User archived Areas, Projects, and Tasks only. | Cursor, limit, `resourceType` filter, allowed sort. | `200` typed archived-resource summaries and page metadata. | `400`, `401`, `429`. | FR-073–FR-074, PRV-008 |
| `GET /archive/{resourceType}/{resourceId}` | Session | Typed archived resource belongs to current User; wrong type/foreign/missing is `404`. | None. | `200` archive detail, cascade/parent preview data, and `ETag`. | `401`, `404`, `429`. | FR-073–FR-074, FR-081–FR-082, UXF-022 |
| `POST /areas/{areaId}/archive` | Session + CSRF + `If-Match`; `Idem` | Owned Area and owned descendants only. | Explicit cascade-scope confirmation. | `200` archived Area, affected counts, lifecycle operation ID, new `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-026, FR-073–FR-074, BR-LC-001–BR-LC-004 |
| `POST /projects/{projectId}/archive` | Session + CSRF + `If-Match`; `Idem` | Owned Project and member Tasks only. | Explicit cascade-scope confirmation. | `200` archived Project, affected count, operation ID, new `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-026, FR-073–FR-074, BR-LC-001–BR-LC-004 |
| `POST /tasks/{taskId}/archive` | Session + CSRF + `If-Match`; `Idem` | Owned Task only; children inherit visibility. | Explicit confirmation. | `200` archived Task, paused reminder/recurrence summary, operation ID, new `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-073–FR-074, BR-REC-011, BR-REM-002 |
| `POST /archive/{resourceType}/{resourceId}/restore` | Session + CSRF + `If-Match`; `Idem` | Typed resource and any selected parent destination must belong to current User. | Restore confirmation; explicit destination chain only when original parents are unavailable; no guessed destination. | `200` restored resource, matching cascade effects, destination summary, new `ETag`. | `401`, `404`, `409` parent/concurrency conflict, `412`, `422`, `428`, `429`. | FR-073, FR-081–FR-082, BR-LC-002, BR-LC-004–BR-LC-008 |

`resourceType` is the closed MVP set `areas|projects|tasks`. A wrong type/ID pairing receives the same `404` as an unavailable resource.

## 22. Trash endpoints

**Purpose:** List retained Trash, expose the 30-day deadline, restore coherently, and perform explicitly confirmed irreversible deletion.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /trash` | Session | Current User trashed Areas, Projects, and Tasks only. | Cursor, limit, `resourceType`, trashed-time/purge-deadline sort. | `200` typed Trash summaries including `purgeAfter` and remaining-time presentation data. | `400`, `401`, `429`. | FR-075–FR-079, PRV-006 |
| `GET /trash/{resourceType}/{resourceId}` | Session | Typed trashed resource belongs to current User; wrong type/foreign/missing is `404`. | None. | `200` Trash detail, deadline, cascade/restore-destination preview data, and `ETag`. | `401`, `404`, `429`. | FR-077–FR-082, UXF-023 |
| `POST /areas/{areaId}/trash` | Session + CSRF + `If-Match`; `Idem` | Owned Area and owned descendants only. | Explicit cascade/deadline confirmation. | `200` trashed Area, effective deadline, affected counts, operation ID, new `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-026, FR-075–FR-082, BR-LC-001–BR-LC-004 |
| `POST /projects/{projectId}/trash` | Session + CSRF + `If-Match`; `Idem` | Owned Project and member Tasks only. | Explicit cascade/deadline confirmation. | `200` trashed Project, deadline, affected count, operation ID, new `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-026, FR-075–FR-082, BR-LC-001–BR-LC-004 |
| `POST /tasks/{taskId}/trash` | Session + CSRF + `If-Match`; `Idem` | Owned Task only. | Explicit confirmation. | `200` trashed Task, deadline, paused reminder/recurrence summary, operation ID, new `ETag`. | `401`, `404`, `409`, `412`, `422`, `428`, `429`. | FR-075–FR-079, BR-REC-011, BR-REM-002 |
| `POST /trash/{resourceType}/{resourceId}/restore` | Session + CSRF + `If-Match`; `Idem` | Resource/destination chain must belong to current User; restored child cannot be active under inactive parent. | Restore confirmation; optionally restore original chain or choose explicit compatible active Area/Project/status destination. | `200` restored resource/cascade result, mapped status/rank/reminder-recurrence eligibility, new `ETag`. | `401`, `404`, `409` expiry/parent/race conflict, `412`, `422`, `428`, `429`. | FR-078, FR-081–FR-082, BR-LC-005–BR-LC-008, DD-015–DD-016 |
| `POST /trash/{resourceType}/{resourceId}/permanent-deletions` | Session + CSRF + recent re-auth + `If-Match`; `Idem` | Owned trashed resource only; owned required descendants follow the same operation. | Explicit irreversible confirmation naming type/scope. | `204` after logical permanent delete commits; retry confirms the same outcome without revealing prior foreign existence. | `401`, `404`, `409` expiry/restore race, `412`, `422`, `428`, `429`, `503`. | FR-079–FR-082, BR-LC-009, DD-014–DD-016 |

Automatic Trash expiry is internal processing with the same permanent-delete effects. It is not triggered by a public client route, and a read request cannot extend `purgeAfter`.

## 23. Search endpoints

**Purpose:** Find only the current User's eligible Task content with stable filters, sorting, and pagination.

| Method and route | Auth / preconditions | Ownership rule | Conceptual input | Successful output | Expected errors | Requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /search/tasks` | Session | Current User active Tasks only by default; no cross-user suggestions/counts. | Bounded `q`, cursor, limit, supported Task filters, relevance or allowed deterministic sort. | `200` Task search results with safe owned snippets/context and page metadata. | `400` query/cursor, `401`, `422` invalid filter combination, `429`, `503`. | FR-065–FR-069, PRV-001–PRV-002, UXF-018–UXF-019 |

Archive and Trash searches use their dedicated collection endpoints and explicit lifecycle filters; the global search endpoint never silently broadens into those scopes.

## 24. Request and response security principles

- Production API traffic is HTTPS-only. Authentication cookies are never accepted over plaintext transport in production.
- Request bodies, query strings, URLs, problem details, and telemetry must not contain session IDs, password/reset/verification tokens except at their dedicated confirmation body, or credential verifiers.
- Passwords and one-time tokens use dedicated write-only fields. They are redacted before structured logging, tracing, validation capture, or idempotency fingerprint persistence.
- Resource names, Task titles/descriptions, checklist text, search queries, and Notification snapshots are personal content. Logs minimize or omit them by default in accordance with PRV-009.
- Server validation is authoritative even when the generated client and UI validate first. Validation includes type/shape, bounded size, closed enums, cross-field dates, ownership-compatible relationships, lifecycle eligibility, and domain invariants.
- Successful responses expose only fields needed for approved product behavior. Internal lifecycle implementation details, password state, worker status, row locks, raw rank keys, and private operational metadata are omitted.
- Caching of private responses defaults to `Cache-Control: no-store` unless a later reviewed endpoint-specific policy safely permits private validation caching. Authentication and token responses are always `no-store`.
- Browser security headers, CSP, HSTS, proxy trust, upload limits, and deployment edge controls are finalized in Solution Architecture; they cannot weaken this session, CSRF, CORS, or ownership contract.
- API error and success behavior is deterministic enough for generated-client handling but does not become an oracle for account/resource existence.

## 25. OpenAPI generation responsibility

### 25.1 Source and ownership

- The NestJS backend is responsible for generating the normative OpenAPI 3.1 contract from the same authoritative route, request, response, validation, authentication, error, and operation metadata used by the server implementation.
- This conceptual document is the approved design baseline. It is not itself parsed as an OpenAPI source and does not authorize implementation until all planning stages are approved.
- When implementation begins, the generated OpenAPI artifact is committed and versioned. Manual edits to generated output are forbidden because they would drift from runtime behavior.
- Every operation has a stable, intention-revealing `operationId`, documented security requirement, parameters/body, success response, Problem Details responses, ETag/idempotency headers, and requirement references where supported by tooling.
- Cookie session authentication and the CSRF header are represented explicitly.

### 25.2 Verification and change control

- CI regenerates and validates OpenAPI deterministically, then fails when committed output differs.
- CI detects breaking changes against the approved v1 baseline and requires an explicit versioning/decision review.
- Contract tests verify representative runtime responses and headers against the generated document, including errors and authentication behavior.
- Security-sensitive routes must not be omitted from the specification merely because they are browser redirects or return no JSON.
- Implementation readiness accepts `@hey-api/openapi-ts` as the candidate generator under ADR-002. `SPIKE-001` runs as the first non-production work of EPIC-001, before `BL-003` or any generated production transport artifact, and pins the exact OpenAPI 3.1 patch level plus generator/validator versions after compatibility evaluation. A failed proof reopens only the generator choice and does not count as production implementation.

## 26. Generated frontend client strategy

- The committed OpenAPI artifact is the sole source for generated frontend transport types and endpoint functions in a versioned internal pnpm workspace package.
- Generated files are reproducible and not hand-edited. Product-specific query keys, cache invalidation, optimistic UI, and view models may wrap the generated client but may not duplicate request/response types or change transport semantics.
- The browser client sends credentials only to the configured first-party API origin, uses `credentials: include` where deployment requires it, and obtains/injects the CSRF token for unsafe calls without reading the HttpOnly session cookie.
- Client functions expose response metadata required by the contract, especially `ETag`, `Location`, `Retry-After`, and request trace information.
- Problem Details and field validation entries are generated as typed error contracts. UI code switches on stable `code`/validation codes, not localized `detail` text.
- Cursor values remain opaque strings. The client does not decode rank keys, ETags, session state, resource IDs, or pagination cursors.
- TanStack Query consumes the generated client. Successful mutations invalidate or update Today, List, Kanban, search, Archive, Trash, Notification, and detail state consistently according to the returned resource/command result.
- A generated-client build and TypeScript strict type-check run in CI after OpenAPI generation; Graphify output never substitutes for either.

**Traceability:** Fixed OpenAPI, generated-client, TypeScript strict, pnpm workspace, TanStack Query, and modular-monolith decisions; NFR-005, NFR-013, NFR-015, AC-015.

## 27. Domain operation to API coverage

| Approved domain operation | API surface | Coverage decision |
| --- | --- | --- |
| Register, verify, login, logout, recover password | `/auth/*` | Covered with enumeration-resistant public outcomes and opaque session rotation. |
| Social authentication and provider identity linking | None in MVP | Deferred. No provider route or persisted provider identity is authorized by this contract. |
| Complete onboarding/sample-data choice | `POST /users/me/onboarding-completions` | Covered idempotently; sample content is private ordinary content. |
| Create/rename Area and valid default workflow | `/areas`, `/areas/{id}`, `/areas/{id}/workflow` | Covered; Area creation and workflow mutation preserve all canonical defaults atomically. |
| Create/rename/move Project | `/projects*` | Covered; Area move via `PATCH /projects/{id}` with `areaId` includes all contained Tasks atomically. |
| Create/edit/move/status-transition Task | `/tasks*`, `/tasks/{id}/area-moves`, `/tasks/{id}/status-transitions` | Covered; cross-boundary changes are explicit commands. |
| Complete recurring occurrence exactly once | `POST /tasks/{id}/status-transitions` | Covered by `If-Match`, `Idempotency-Key`, and domain predecessor/generation uniqueness; response returns created/found successor. |
| Edit/stop recurrence without rewriting history | `PUT`/`DELETE /tasks/{id}/recurrence` | Covered with explicit scope and immutable history. |
| Manage reminders and produce Notifications | `/tasks/{id}/reminders`, internal trigger, `/notifications` | Client reminder management is covered; Notification production remains an internal idempotent operation. |
| Enable or disable future in-app reminder Notifications | `PATCH /users/me` | Covered as an ETag-protected User preference; reminder definitions/history remain and due-time suppression is terminal without backfill. |
| Manage Labels and checklist order | `/labels*`, `/tasks/{id}/checklist-*` | Covered with same-owner validation and Task ETag. |
| Global/Area manual board ordering | `/tasks/kanban-moves`, `/areas/{id}/kanban-moves` | Covered with separate ranks and destination-context validation. |
| Search/filter/sort/Today/List/Kanban reads | `/search/tasks`, `/tasks`, `/tasks/today`, Kanban collection endpoints | Covered with owner-scoped cursor projections. |
| Bulk Task status/Label/Archive/Trash | `POST /tasks/bulk-actions` | Covered with per-item authorization, ETag, atomicity, and results. |
| Archive/Trash cascades and coherent restore | Resource lifecycle commands plus `/archive/*` and `/trash/*` restore routes | Covered with provenance, explicit destination, and no guessed parent. |
| Manual permanent deletion from Trash | `/trash/{type}/{id}/permanent-deletions` | Covered with recent re-auth, confirmation, idempotency, and required descendant purge. |
| Automatic Trash expiry | Internal lifecycle processing | Intentionally no client trigger; public API only exposes deadline/state. |
| Account deletion | `POST /users/me/account-deletions` | Covered as immediate access revocation plus durable idempotent purge process. |

No approved domain operation requires a public collaboration, organization, membership, sharing, billing, or public-resource endpoint. No endpoint in this contract creates such a domain concept.

## 28. Requirement traceability summary

| Contract area | Primary product/UX coverage | Domain/data coverage |
| --- | --- | --- |
| Authentication, session, recovery | FR-001–FR-004, FR-007–FR-012, NFR-002–NFR-004, PRV-004, AC-001, UXF-002–UXF-004, UXF-025–UXF-026 | BR-AUTH-002–BR-AUTH-003, DD-004–DD-007, DD-030–DD-032 |
| Ownership and non-disclosure | FR-011–FR-012, FR-066, NFR-001–NFR-004, PRV-001–PRV-003, PRV-008–PRV-009, AC-002, AC-014, UXF-027 | BR-OWN-001–BR-OWN-012, DD-002–DD-003 |
| Areas, Projects, statuses | FR-017–FR-026, FR-034–FR-040, FR-087–FR-090, AC-004, AC-006, UXF-007–UXF-010 | BR-PROJ-001–BR-PROJ-003, BR-STATUS-001–BR-STATUS-005, DD-008–DD-011, DD-034 |
| Tasks, dates, recurrence, reminders | FR-027–FR-058, NFR-006, NFR-012, AC-005, AC-007–AC-008, UXF-011–UXF-014 | BR-TASK-001–BR-TASK-007, BR-REC-001–BR-REC-012, BR-REM-001–BR-REM-003, DD-022–DD-029 |
| Today, List, Kanban, search/filter | FR-059–FR-069, FR-090, AC-006, AC-009–AC-010, UXF-006, UXF-015–UXF-019 | BR-TIME-001–BR-TIME-009, DD-020–DD-022, DD-035 |
| Bulk actions | FR-070–FR-072, NFR-013, AC-010, UXF-020 | BR-OWN-011, BR-STATUS-005, DD-033 |
| Archive, Trash, restore, deletion | FR-073–FR-082, NFR-007, PRV-006–PRV-008, AC-011, UXF-022–UXF-023 | BR-LC-001–BR-LC-010, DD-012–DD-016, DD-030–DD-031, DD-034 |
| Notifications and preference | FR-054–FR-058, FR-091–FR-093, AC-008, AC-016, UXF-021, UXF-024 | BR-REM-003, BR-NOTIF-001–BR-NOTIF-003, Notification invariants, DD-028, DD-036 |
| Errors, accessibility, localization | FR-007, FR-083–FR-086, NFR-011, NFR-013, A11Y-006, A11Y-009, AC-012–AC-014 | BR-OWN-010–BR-OWN-011 |
| OpenAPI and generated client | NFR-005, NFR-015, AC-015 | Fixed technology decisions; DD-032–DD-035 |

## 29. Standards and security guidance basis

The contract aligns conceptually with these current primary/authoritative specifications and guidance; the approved product/domain rules remain authoritative when they are stricter:

- RFC 9110 HTTP Semantics for methods, ETags, `If-Match`, `412`, and conditional requests.
- RFC 9457 Problem Details for HTTP APIs for the error media type and base members.
- OWASP Session Management, CSRF Prevention, and REST Security guidance for opaque cookie protection, session rotation/invalidation, CSRF defense, transport security, validation, and safe error/log behavior.
- OpenAPI Specification 3.1 for the future generated machine-readable contract and cookie/security-scheme description.

This list informs the contract but is not a substitute for dependency-specific security review during implementation.

## 30. Remaining Architecture and Privacy handoffs

The following operational parameters do not block the conceptual API contract and must not be silently selected during implementation:

- exact session idle/absolute expiry, renewal behavior, and concurrent-session policy;
- password policy parameters and email verification/password-reset token lifetimes;
- email delivery provider, retry behavior, and security-event notification policy;
- environment overrides for the approved rate-limit baseline and the exact trusted proxy hop count;
- production frontend/API origin topology, CORS allowlist if required, CSP/HSTS, and edge security controls;
- idempotency-record storage, cleanup after the minimum replay window, and privacy-safe fingerprint implementation;
- reminder polling/retry/latency, Trash-expiry scheduling, and account-purge operational guarantees;
- account-deletion backup expiry, deletion evidence, and privacy-minimized receipt retention;
- maximum bulk size and endpoint-specific collection limits based on measured capacity;
- exact versions selected by the approved just-in-time `SPIKE-001`;
- deployment-provider selection and provider-specific disaster recovery; internal availability, browser support, performance targets, and the observability baseline are resolved by Architecture.

These handoffs may refine operational values but cannot weaken opaque sessions, CSRF protection, enumeration resistance, ownership enforcement, ETag preconditions, idempotency, or approved domain invariants.

## 31. API risks and responses

| ID | Risk | Contract response |
| --- | --- | --- |
| API-R-001 | Cookie authentication introduces CSRF risk. | Require session-bound CSRF tokens, Origin validation, SameSite cookies, and explicit CORS policy. |
| API-R-002 | Different missing/foreign errors can enumerate private resources. | Use one `404 RESOURCE_NOT_FOUND` before returning ownership, version, or relationship detail. |
| API-R-003 | Retry of Task completion can create duplicate recurrence successors. | Combine ETag, Idempotency-Key, atomic completion, predecessor/generation uniqueness, and return existing successor on replay. |
| API-R-004 | A future social-authentication design could create account-takeover paths if it reuses obsolete assumptions. | Keep social authentication outside MVP and require a fresh cross-document security decision before introducing any provider. |
| API-R-005 | ETags alone may not protect multi-resource commands. | Carry per-item ETags where one header is insufficient and preserve server-side transaction/uniqueness guards. |
| API-R-006 | Bulk partial success can confuse clients or leak ownership. | Return ordered per-item results, keep each item atomic, and collapse missing/foreign into the same safe failure. |
| API-R-007 | Cursor behavior can become unstable under arbitrary sorting. | Bind cursor to owner/filter/sort tuple and use a stable resource-ID tie-breaker. |
| API-R-008 | Lifecycle endpoints may guess restore parents or understate cascade scope. | Require previewed explicit destinations and domain-validated operation effects; reject stale/incoherent restore. |
| API-R-009 | Generated OpenAPI/client can drift from runtime. | Generate deterministically from backend contract metadata, commit output, diff in CI, and run contract/client type checks. |
| API-R-010 | Rate-limit responses can reveal account existence. | Apply generic outcomes, aggregate privacy-safe keys, and avoid identity-specific quota detail. |
| API-R-011 | Idempotency records can retain secrets or authored content. | Exclude secrets and minimize stored fingerprints/results; define cleanup and privacy review before implementation. |
| API-R-012 | Session/account deletion races can allow post-confirmation writes. | Revoke all sessions in the accepted deletion transaction and reject all later planning mutations. |
| API-R-013 | A preference toggle can race with reminder delivery or imply later replay. | Use `If-Match` for the User mutation, resolve the due reminder atomically against one committed preference value, and never backfill Suppressed outcomes. |

## 32. Stage 6 approval criteria

Stage 6 may be approved only when:

- **API-AC-001:** Base path, versioning, request/response conventions, errors, validation, pagination, filtering, sorting, and search are accepted.
- **API-AC-002:** Opaque session, cookie attributes, CSRF, and the email/password lifecycle are accepted; social authentication is explicitly outside MVP.
- **API-AC-003:** Missing and foreign user-owned resources have one non-disclosing behavior across item, nested, search, collection, lifecycle, and bulk operations.
- **API-AC-004:** Every requested resource group has purpose, method/route, authentication, ownership, input, success, expected errors, and requirement traceability.
- **API-AC-005:** Task completion and recurrence generation, Trash restore parent choices, lifecycle cascades, and Project moves preserve approved atomic/domain behavior.
- **API-AC-006:** ETag/`If-Match`, idempotency, bulk partial results, and cursor semantics are decision-complete at the conceptual contract level.
- **API-AC-007:** OpenAPI generation ownership and generated frontend client policy are explicit without producing the OpenAPI artifact early.
- **API-AC-008:** Graphify authentication/ownership, Task/recurrence, Trash/parent, domain-operation, and endpoint/domain gap findings are verified against source documents.
- **API-AC-009:** `PROJECT_MASTER.md` records Stage 6 decisions, document status, graph metadata, open handoffs, risks, and approval state without silently approving the phase.
- **API-AC-010:** No controller, backend/frontend production code, OpenAPI document, Prisma schema, migration, or SQL has been created.

## 33. Next-stage entry criteria

Solution Architecture may begin only after:

- the user explicitly approves this API Contract or its revisions;
- `PROJECT_MASTER.md`, PRD, UX Flows, Domain Model, Data Model, and this document contain no unresolved API/domain contradiction;
- the incremental Graphify graph includes this API Contract and the required gap queries have been verified against the source documents;
- remaining Security, Privacy, Architecture, deployment, operations, and physical-schema handoffs remain explicit rather than treated as settled implementation choices;
- no production implementation or OpenAPI artifact is started before that approval.
