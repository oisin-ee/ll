---
description: Research a topic and store the dossier in bd (memory or spike), never on disk
disable-model-invocation: true
allowed-tools: WebFetch WebSearch Read Grep Glob Bash(bd *)
---

Produce a cited research dossier for `$ARGUMENTS` and store it in bd. No file is written to `docs/research/` or anywhere on disk.

Steps:

1. If `$ARGUMENTS` is empty, ask for a topic and halt.

2. Ask the user: **memory** or **spike**?
   - **memory** — cross-session reusable knowledge (e.g., "how Context7 MCP works"). Stored via `bd remember`, retrievable across sessions.
   - **spike** — issue-bound research (e.g., "options for fixing bd-42"). Stored as a `--type=spike` issue linked via `blocks:` to the work it gates.

3. Produce the dossier with these sections:
   - Problem statement
   - External facts (each claim cited via WebFetch URL — no claims from training data)
   - Options with tradeoffs
   - Recommendation
   - Open questions

4. Store:
   - **memory**: `bd remember "<dossier>" --tags=research,$ARGUMENTS`
   - **spike**: `bd create --type=spike --priority=2 --title="$ARGUMENTS" --silent --body-file=- <<'EOF' ...EOF`. If user names a parent issue, add `--deps "blocks:<parent-id>"`.

5. Print the new memory ID or spike issue ID.

Do NOT create `docs/research/` or any markdown file. All research lives in bd.
