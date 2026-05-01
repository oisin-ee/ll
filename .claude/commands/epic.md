---
description: Draft an EARS-format epic and create it in bd as the source of truth
disable-model-invocation: true
allowed-tools: Bash(bd *) Bash(cat *)
---

Draft an EARS-format epic for `$ARGUMENTS` and create it in bd. No markdown file is written outside of bd's database.

If `$ARGUMENTS` is empty, ask for a kebab-case slug and halt.

Steps:

1. Draft the epic body in conversation using EARS Success Criteria. Required sections:

   ```markdown
   ## User story
   As a <role> I want <capability> so that <benefit>.

   ## Success Criteria
   1. WHEN <event> THE SYSTEM SHALL <response>
   2. IF <precondition> THEN THE SYSTEM SHALL <response>
   3. WHILE <state>, WHEN <event> THE SYSTEM SHALL <response>

   ## Out of Scope
   - <non-goal>

   ## [NEEDS CLARIFICATION: ...]
   <Block creation until resolved.>
   ```

2. If any `[NEEDS CLARIFICATION: ...]` markers remain, halt and ask the user. Do not create the epic until they are resolved.

3. Create the epic via stdin (no temp file on disk):

   ```bash
   bd create --type=epic --priority=1 --title="<title>" --silent --body-file=- <<'EOF'
   <body markdown>
   EOF
   ```

   Capture the returned issue ID (e.g. `<prefix>-N`).

4. Propose the child-task breakdown to the user — one task per unit of work. For each, draft a body with sections: User story, Acceptance Criteria (EARS), Files Likely Touched, Verification Commands, Out of Scope.

5. After the user confirms the breakdown, create each child via:

   ```bash
   bd create --type=task --parent=<epic-id> --priority=N --title="<title>" --silent --body-file=- <<'EOF'
   <body markdown>
   EOF
   ```

6. Add inter-ticket `bd dep add <blocked> <blocker>` for ordering dependencies between siblings.

7. Run `bd lint` on the epic and children — confirm zero template warnings.

Do NOT call `bd update <id> --claim`. Claiming is an explicit user action via /work-next.

Do NOT write the spec body to a file in the working tree. The body lives in bd via stdin only.
