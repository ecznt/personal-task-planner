# AGENTS.md — Permanent Rules

## Branch Strategy

**NEVER push, merge, or open PRs targeting `origin/develop`.**

- All work happens on `opencode/*` branches (e.g., `opencode/develop`, `opencode/feature-x`).
- `develop` and `main` are protected integration/release branches. Do not modify them directly.
- PRs must target a branch other than `develop` unless the user explicitly overrides this rule.

**PR target branch: `opencode/develop`.**

- All PRs must be created from a feature branch (e.g., `opencode/feature-x`) targeting `opencode/develop`.
- Never open PRs targeting `develop` or `main` directly.
