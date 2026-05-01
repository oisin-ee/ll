---
description: Pick the next unblocked bd issue, claim it, and read back the acceptance criteria
disable-model-invocation: true
allowed-tools: Bash(bd *)
---

Pick the highest-priority unblocked bd issue, claim it, and echo the acceptance criteria back. Halt before any source edit until the user confirms the criteria.

Steps:

1. Run `bd ready --json`. Pick the first issue (highest priority + earliest in queue).

2. If the queue is empty, run `bd ready --explain` to surface the reason (all in_progress / blocked / no open issues), report it, and halt without claiming.

3. Run `bd show <id>` and read the body in full.

4. **Validation gate:** If the issue body is missing an `## Acceptance Criteria` section OR a `## Verification Commands` section, do NOT claim. Report the missing sections and instruct the user to run `bd update <id> --acceptance "..."` or edit the body. Halt.

5. **Validation gate:** If the body contains any unresolved `[NEEDS CLARIFICATION: ...]` marker, do NOT claim. Report and halt.

6. Run `bd update <id> --status in_progress` to claim the issue.

7. Echo back, verbatim:
   - The full `## Acceptance Criteria` section
   - The full `## Verification Commands` section
   - The full `## Files Likely Touched` section (if present)
   - The full `## Out of Scope` section (if present)

8. Halt. Do not begin any source-file edit until the user confirms the read-back matches their intent.

The require-claim.sh PreToolUse hook (when enabled) blocks source edits without an in_progress claim — this command is the canonical path to satisfy that gate.
