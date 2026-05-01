---
description: Run weekly bd database hygiene checks (doctor, stale, lint, open count)
disable-model-invocation: true
allowed-tools: Bash(bd *)
---

Run the bd hygiene checks in order. Report findings; do not auto-fix.

1. `bd doctor` — health check (db consistency, dolt status).
2. `bd stale --days 14` — issues not updated in 14 days.
3. `bd orphans` — issues with no parent that are not root epics (skip if subcommand is unavailable).
4. `bd lint --status all` — issues missing required EARS sections per type.
5. `bd count --status open` — total open issue count.

After step 5: if the open count exceeds **200**, warn per Yegge's guidance ("agent search degrades past ~25k tokens / ~500 issues; aim for ≤200 open"). Suggest `bd cleanup` to compact closed issues, or close completed work.

Output a one-line summary per check (PASS / N issues found / WARN), then a final aggregate.

Do NOT run `bd cleanup`, `bd compact`, `bd close`, or any mutation. This command is read-only triage.
