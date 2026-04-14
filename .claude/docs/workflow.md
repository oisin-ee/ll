## Workflow: Intent-Driven Development (IDD)

**Core tagline:** Humans define WHAT and WHY. AI determines HOW and WHEN.

**The workflow:**
```
Intent → Tests → Code → Sync
```

1. **Intent**: Write a short, high-level intent doc in `.claude/specs/YYYY-MM-DD-<slug>.md`. Focus on WHAT and WHY, not implementation detail.
2. **Tests**: Write tests that verify the intent (behavior, not implementation).
3. **Code**: Implement the minimum needed to satisfy the tests. Trust the AI to resolve ambiguities.
4. **Sync**: If code drifts from intent, update the intent first. Intent is source of truth, code is output.

**When to write a spec:** Any task larger than a single-file change.
