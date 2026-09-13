# AGENTS.md — Permanent Rules

## Branch Strategy

**Work output is pushed directly to `opencode/develop` (origin).**

- **Always commit and push completed work to `opencode/develop`** — do not create feature branches or open pull requests; `opencode/develop` is the single integration branch.
- **NEVER push, merge, or open PRs targeting `origin/develop` or `origin/main`.** They are protected release branches. Do not modify them directly.
- Before pushing, inspect `git status`/`git diff`, commit with a repo-style message, and verify the remote `opencode/develop` fast-forwards cleanly.
