---
description: Record an architecture/process decision in bd as the source of truth
disable-model-invocation: true
allowed-tools: Bash(bd *)
---

Record a decision for `$ARGUMENTS` in bd. Replaces `docs/adr/` markdown files.

Steps:

1. If `$ARGUMENTS` is empty, ask for a decision title and halt.

2. Draft, then run:

   ```bash
   bd decision record --title="$ARGUMENTS" \
     --rationale="<why this option>" \
     --alternatives-considered="<other options + why rejected>"
   ```

3. If the decision is project-wide (constitution-level), pin it:

   ```bash
   bd decision pin <decision-id>
   ```

4. Print the decision ID. List with `bd decision list`.

Do NOT create `docs/adr/` or any markdown file. All decisions live in bd.
