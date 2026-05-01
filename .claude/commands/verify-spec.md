---
description: Spawn a fresh-context subagent to verify a bd issue's acceptance criteria
disable-model-invocation: true
allowed-tools: Bash(bd *)
---

Verify bd issue `$ARGUMENTS` against its EARS acceptance criteria using a fresh-context verifier subagent. The main agent cannot self-certify completion.

If `$ARGUMENTS` is empty, ask for an issue ID and halt.

Steps:

1. Spawn an Agent with `subagent_type=general-purpose` and the following self-contained prompt (substitute the actual issue ID):

   ---
   You are an independent verifier. Do not trust any prior context. Re-read everything yourself.

   Verify bd issue `<id>` against its acceptance criteria.

   Steps:
   1. Run `bd show <id>` and read the body in full.
   2. For each numbered EARS criterion under `## Acceptance Criteria`, identify the relevant code paths via Grep / Glob / Read. Cite file:line.
   3. Run each command listed under `## Verification Commands` exactly as written. Capture stdout/stderr and exit code.
   4. For each criterion, mark PASS / FAIL / PARTIAL with concrete evidence (file:line, test names, exit codes). PARTIAL = behavior partially implemented or only some sub-clauses verified.
   5. If `## Files Likely Touched` is present, verify the diff stayed within that list. Edits outside it are a scope-creep flag.

   Output format (markdown):
   ```
   ## Result: PASS | FAIL | PARTIAL

   ### Per-criterion
   1. <criterion text> — PASS — <evidence>
   2. <criterion text> — FAIL — <evidence>
   ...

   ### Verification commands
   - `<cmd>` — exit <N> — <one-line summary>

   ### Scope
   - Edits stayed within Files Likely Touched: yes | no (list out-of-scope files)
   ```

   Aggregate: PASS only if every criterion is PASS AND every verification command exited 0 AND scope was respected. Otherwise FAIL or PARTIAL.

   Do NOT call `bd close` or `bd update`. Verification is read-only.
   ---

2. Append the verifier output as a bd note for audit trail:

   ```bash
   bd note $ARGUMENTS "<verifier output>"
   ```

3. Branch on the result:
   - **PASS** — main agent MAY proceed to `bd close $ARGUMENTS --reason "verified by /verify-spec" --suggest-next`.
   - **FAIL** or **PARTIAL** — DO NOT call `bd close`. Report the failing criteria to the user. Address them in this session or file follow-ups via /discover.

4. If the verifier could not run (subagent failed, timed out, etc.), report the failure and do NOT close. The default path is "verification did not complete → issue stays open".
