---
name: workflow
description: Workflow methodology for this project
---

# Workflow: bd is the source of truth

All specs, plans, research, decisions, and acceptance criteria live in bd.
Never write standalone markdown files for these — no on-disk
spec / plan / research / ADR directories.

## The loop (one ticket per session)

1. `/epic <slug>` — drafts an EARS-format epic body and creates the bd
   epic + child tickets via `bd create`.
2. `/work-next` — `bd ready --json` picks the highest-priority unblocked
   issue, runs `bd update <id> --claim`, and echoes the acceptance criteria.
3. **TDD** — write failing test → make it pass → refactor. Enforced by
   `tdd-guard.sh` at the lefthook layer.
4. `/verify-spec <id>` — fresh-context subagent re-reads the bd issue,
   runs each Verification Command, returns PASS/FAIL/PARTIAL.
5. `bd close <id> --reason "<why>" --suggest-next` — only after PASS.
6. **Discoveries** — `/discover <description>` creates a child issue
   with `--deps=discovered-from:<current>`. Never expand scope silently.

## Other artifacts

- **Plans** — `/plan <id>` writes to the issue's `--design` field.
- **Research** — `/research <topic>` either `bd remember` (cross-session
  knowledge) or `bd create --type=spike` (issue-bound research).
- **Decisions / ADRs** — `/decision <topic>` runs `bd decision record`.
- **Hygiene** — `/bd-hygiene` runs `bd doctor`, `bd stale`, `bd lint`,
  `bd count --status open` (Yegge: keep ≤200 open).

Reference issues in commits: `Implements bd-XXXX`. No spec paths in commit
messages — the bd ID resolves.
