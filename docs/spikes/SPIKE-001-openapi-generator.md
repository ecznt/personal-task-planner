# SPIKE-001: OpenAPI TypeScript Generator Compatibility

| Field | Result |
| --- | --- |
| Status | Completed — supported profile confirmed |
| Date | 2026-07-23 |
| Scope | Non-production EPIC-001 evidence |
| Decision owner | ADR-002 |
| Production behavior delivered | None |

## Question

Can the selected Fetch-based OpenAPI generator represent and compile the approved browser contract shapes on Node.js 24 LTS without creating production endpoints or transport artifacts?

The proof covers OpenAPI 3.1, an HttpOnly session-cookie security scheme, a required CSRF header, RFC 9457 base and validation errors, optional and nullable properties, response-header access, stable `operationId` names, Fetch credentials, deterministic generation, and strict TypeScript compilation.

## Confirmed profile

| Component | Exact tested version or setting |
| --- | --- |
| Node.js | `24.18.0` LTS |
| pnpm used for the proof | `11.9.0` |
| Generator | `@hey-api/openapi-ts` `0.99.0` |
| TypeScript | `5.9.3` |
| Contract validator | `@redocly/cli` `2.39.0` |
| Fetch plugin | Bundled `@hey-api/client-fetch` output |
| Client credentials | Explicit `credentials: 'same-origin'` in the hand-written client bootstrap |
| Generator auth callback | Not configured for the HttpOnly session cookie |
| Security override | `js-yaml` `4.3.0` through `pnpm-workspace.yaml` |

The generator and TypeScript versions must remain exact until a dedicated dependency-update change reruns this proof. The security override is required while the pinned generator dependency tree otherwise resolves a vulnerable `js-yaml` version.

## Reproducible fixture

The non-production fixture is in `docs/spikes/SPIKE-001/`. Its generated directory and dependencies are ignored. From a shell already running Node.js 24:

```sh
cd docs/spikes/SPIKE-001
pnpm install --frozen-lockfile --ignore-scripts
REDOCLY_TELEMETRY=off REDOCLY_SUPPRESS_UPDATE_NOTICE=true pnpm run lint:contract
pnpm run generate
pnpm run typecheck
pnpm run verify
pnpm run generate
pnpm run verify
pnpm audit --audit-level=high
```

The second generation must report the same combined digest as the first. Generated files are disposable evidence and are never hand-edited or committed.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| OpenAPI 3.1 input | PASS | Redocly spec validation and successful generation from `openapi: 3.1.0`. |
| Cookie authentication | PASS with bootstrap rule | The SDK retains the cookie security descriptor. The browser bootstrap supplies Fetch credentials and does not attempt to read or inject the HttpOnly cookie. |
| CSRF header | PASS | `X-CSRF-Token` is a required generated request-header property. |
| RFC 9457 errors | PASS | The generated error union distinguishes the validation extension from the base Problem Details shape and covers the declared status responses. |
| Optional versus nullable | PASS | Strict compile-time assertions preserve optional-nullable input, required-nullable output, and optional-nullable Project linkage. |
| Response headers | PASS with typed-name limitation | The contract retains `ETag` and `X-Request-Id`; the generated result exposes native `Response.headers`. Header names and values are not generated as a named TypeScript map. |
| Stable operation ID | PASS | `operationId: updateTask` generates `updateTask`. |
| Fetch credentials | PASS | The generated configuration extends `RequestInit`; strict compilation accepts global and per-call credentials settings. |
| Deterministic generation | PASS | Two clean-equivalent generations produced 16 files with combined SHA-256 `9c8c178ef540e3fa0179993e8e3c8f90b7fa8761ff0624f20a15deeca15e459b`. |
| Strict TypeScript | PASS for pinned profile | All generated files and the fixture assertions compile with `strict: true`, `skipLibCheck: false`, and TypeScript `5.9.3`. |
| Dependency audit | PASS after override | `pnpm audit --audit-level=high` reports no known vulnerabilities with `js-yaml` pinned to `4.3.0`. |

## Compatibility findings

1. Running the generator as a bare `pnpm dlx` package is insufficient because `typescript` is a peer dependency. The production workspace must install both exact packages.
2. TypeScript `6.0.3` generated the client but failed strict checking in the generator-owned `core/params.gen.ts` helper (`unknown` was assigned to `Record<string, unknown>`). TypeScript `5.9.3` passed without suppressions. TypeScript 6 or later is therefore not approved until the proof is rerun successfully.
3. The root generated barrel does not export the singleton client. The permitted hand-written bootstrap imports it from the generated `client.gen` entry and owns credentials/error configuration; generated files remain untouched.
4. A configured generator `auth` callback would try to materialize cookie credentials. The approved HttpOnly model instead relies on the browser cookie jar with explicit same-origin Fetch credentials, so no session-cookie auth callback is configured.
5. Named response-header types are not generated. Native `Response.headers` access is sufficient for the approved ETag and request-ID behavior, but callers use reviewed constants or wrappers rather than expecting generator-enforced header-name typing.

## Decision

`@hey-api/openapi-ts` remains the approved generator. The initial production profile is `@hey-api/openapi-ts@0.99.0` with `typescript@5.9.3`, the Fetch client, explicit same-origin credentials, stable operation IDs, and the `js-yaml@4.3.0` security override. `BL-003` may use this profile after the workspace foundation exists.

This decision does not create an API endpoint, OpenAPI production artifact, generated production client, application module, database schema, migration, or user-visible behavior.

## Sources

- [Hey API package and exact-version guidance](https://www.npmjs.com/package/@hey-api/openapi-ts)
- [Hey API Fetch client configuration](https://heyapi.dev/docs/openapi/typescript/clients/fetch)
- [Node.js 24 release line](https://nodejs.org/en/download/archive/v24)
- [Redocly OpenAPI lint command](https://redocly.com/docs/cli/commands/lint)
- [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m)
