## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see the full workflow.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

**Rules:**
- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists (blocked by hook)
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files
