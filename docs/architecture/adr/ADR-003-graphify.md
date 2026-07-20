# ADR-003: Graphify for Architecture Discovery and Impact Analysis

Status: Accepted
Date: 2026-07-20

## Context

The planning artifacts contain stable requirement IDs, UX flows, domain rules, conceptual entities, API operations, and architecture boundaries. These relationships become difficult to review exhaustively as the repository grows. The project also needs a repeatable way to find high-connectivity concepts, disconnected decisions, and change impact without treating generated inference as authoritative.

Graphify `0.9.20` and its project-scoped Codex skill are already pinned for this repository. Shareable graph outputs are versioned under `graphify-out`.

## Decision

Use Graphify as a repository-local discovery and impact-analysis aid for approved documents and, later, implementation source files.

### Questions Graphify should answer

- Which requirements, UX flows, domain concepts, data entities, endpoints, modules, and tests are connected to a proposed change?
- Which concepts are high-connectivity god nodes that deserve careful review?
- Are there orphan entities, endpoints without domain operations, domain operations without an API/worker path, or architecture modules without an authoritative responsibility?
- Which communities suggest cohesive business boundaries or unexpected coupling?
- Which files and concepts are on a dependency or semantic path between two decisions?
- What changed in the graph after an approved planning or implementation change?

### When direct file reading is required

Direct source documents and code remain authoritative. Read them when exact wording, requirement status, ordering, numeric limits, security behavior, data constraints, error semantics, migration behavior, or implementation correctness matters. Every Graphify finding that affects a decision must be verified in the cited source files. If graph and source conflict, report the conflict and use the source until the graph is regenerated or corrected.

### Updating the graph

After meaningful approved changes, use the project skill workflow and run an incremental update when an existing graph is present. Inspect `graph_stats`, `god_nodes`, relevant communities, and targeted queries after generation. Record Graphify version, timestamp, Git commit SHA, scope, and validation result in `docs/PROJECT_MASTER.md`.

Graphify `0.9.20` can force its own memory directory into broad scans despite ignore patterns. Until that behavior changes, graph generation must explicitly restrict detection/extraction to the intended repository source corpus and must verify that `graphify-out/memory` was not indexed.

### Versioned output

Shareable `graphify-out/graph.json`, `graph.html`, `GRAPH_REPORT.md`, labels, and manifest data are committed because they provide a reviewable architecture snapshot, allow local MCP queries without regeneration, and make graph changes visible in pull requests. Transient caches, cost data, memories, reflections, extraction intermediates, and machine-local runtime paths are ignored.

### MCP operation

The local stdio MCP server runs against the versioned graph:

```text
python -m graphify.serve graphify-out/graph.json
```

The configured Python environment must contain `graphifyy[mcp]==0.9.20`. MCP is read-only for architectural queries; graph generation remains an explicit repository workflow. A missing or stale graph must be regenerated before relying on MCP results.

### Staleness detection

A graph is stale when any of the following is true:

- the source manifest differs from tracked approved documents/source files;
- `PROJECT_MASTER.md` metadata predates relevant repository changes;
- the recorded commit SHA is not an ancestor-compatible snapshot for the question;
- new or renamed concepts are absent from graph search;
- Graphify reports changed files or its reflection command marks the graph stale.

Staleness is reported, not silently ignored. Queries may still orient investigation, but conclusions require direct file review until regeneration.

### Secret controls

- `.graphifyignore` excludes `.env*`, credentials, keys, certificates, tokens, private configuration, dependencies, coverage, build output, caches, and transient Graphify directories.
- Detection output is reviewed for skipped-sensitive files and unexpected paths before extraction.
- Graph artifacts are searched for secret patterns, absolute home paths, connection strings, tokens, and private-key markers before staging.
- `graphify-out/cost.json` and machine-local/intermediate files are never committed.
- If sensitive content is detected, generation stops; the source is excluded and affected artifacts are regenerated before any commit.

## Why Graphify does not replace tests or source checks

Graphify captures extracted and inferred relationships. It does not execute TypeScript, validate OpenAPI, apply database constraints, exercise ownership guards, test concurrency, or prove runtime behavior. Type-checking, linting, migration tests, unit/integration/E2E tests, security checks, and direct code review remain mandatory quality gates.

## Consequences

### Positive

- Cross-document and later cross-code impact becomes easier to navigate.
- Orphan concepts and unexpected hubs can be reviewed early.
- The graph snapshot is portable and reviewable with the repository.

### Negative

- Generated artifacts add repository churn and require freshness discipline.
- Semantic extraction can be incomplete or misleading.
- The pinned tool and MCP environment require maintenance.
- Secret review is necessary because graph output can reproduce indexed content.

## Alternatives considered

1. **Manual search only**: retained as an authority check but insufficient as the sole cross-document discovery method.
2. **Do not version graph outputs**: rejected because every contributor would regenerate before querying and architecture changes would not be reviewable.
3. **Treat graph output as generated truth**: rejected because extraction is probabilistic and cannot verify runtime behavior.

## Compliance and verification

- Project-scoped skill instructions are read before use.
- Graph generation metadata and scope are recorded in the master document.
- MCP queries are paired with direct-source verification.
- Secret and absolute-path scans pass before graph artifacts are staged.
- CI/test/source checks remain independent of Graphify availability.

## Related decisions

- ADR-001: Modular monolith
- ADR-002: REST/OpenAPI
- `docs/PROJECT_MASTER.md`
- `.graphifyignore`
