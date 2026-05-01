---
description: Write a plan into a bd issue's design field (no markdown files on disk)
disable-model-invocation: true
allowed-tools: Bash(bd *)
---

Draft a plan for bd issue `$ARGUMENTS` and store it in the issue's design field. No file is written to `.claude/plans/` or anywhere else on disk.

Steps:

1. If `$ARGUMENTS` is empty, ask for an issue ID and halt.

2. Read the issue: `bd show $ARGUMENTS`.

3. Draft the plan in conversation. Required sections:
   - **Goal** — one sentence outcome.
   - **Root cause / requirement** — why, not symptoms.
   - **Files to change** — every file with a one-line reason.
   - **Order of operations** — which edit first, why.
   - **What you verified** — docs read (URLs), code traced (file:line), commands run.
   - **Risks** — what could go wrong, mitigation.

4. Write the plan into the issue:

   ```bash
   bd update $ARGUMENTS --design "<plan markdown>"
   ```

5. Print the bd show URL or `bd show $ARGUMENTS --field design` to confirm.

Do NOT create `.claude/plans/` or any markdown file in the working tree. The plan lives in bd's design field.
