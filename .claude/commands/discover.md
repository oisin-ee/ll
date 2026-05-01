---
description: Create a discovered-from child issue when scope expands during work
disable-model-invocation: true
allowed-tools: Bash(bd *)
---

Create a child bd issue tagged as discovered-from the currently claimed work, so scope expansion is tracked instead of silently absorbed.

Steps:

1. Identify the currently claimed (in_progress) issue: `bd list --status in_progress --json`. If none, halt — `/discover` requires an in_progress claim.

2. Take the description from `$ARGUMENTS` (or ask for it). Use it as the new task title.

3. Create the child:

   ```bash
   bd create --type=task --deps "discovered-from:<current-id>" --priority=2 --title="<description>" --silent
   ```

4. Echo back the new ID and the parent (current) ID. Do NOT claim the new issue. Continue the current work.

Do NOT expand scope of the current ticket without filing this discovery first. The discovered-from edge is the audit trail for scope creep.
