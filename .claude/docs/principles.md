## Code Quality & Strictness

- No `any` / no raw error suppression (@ts-ignore, unwrap, ignored errors)
- No magic numbers — extract to named constants
- Early returns over nested conditionals
- Meaningful names — no generic terms like `data`, `info`, `item`, `manager`, `handler`, `util`, `helper`, `tmp`
- No abbreviations unless universal (id, url, db)
- DRY at 2 occurrences — if you write it twice, extract it

## Architecture

**Deep modules over shallow ones** (Ousterhout):
- A module's interface should be much simpler than its implementation
- Information hiding is the goal — hide complexity behind simple APIs
- Red flags: pass-through methods, shallow modules that leak implementation details

**Layer discipline** (Clean Architecture):
- Domain/core layer cannot import from infrastructure/framework layer
- Dependencies point inward toward the core
- Enforced by dependency-cruiser (TS) or depguard (Go) or crate boundaries (Rust)

**File size limits**: max 300 lines per file, max 50 lines per function. Split if exceeded.

**Folder naming**: kebab-case for all folder names.

## Testing

**Test-driven development** (Kent Beck's red/green/refactor):
1. Write a failing test first
2. Write the minimum code to make it pass
3. Refactor for quality — tests keep you safe

**Co-locate tests** with source (e.g., `foo.ts` + `foo.test.ts`).

**Property-based testing** for non-trivial logic — use fast-check (TS), proptest (Rust), rapid (Go) to generate edge cases automatically.

**No deletion to pass**: never delete or weaken a test to make it pass. Fix the code, not the test.

**Mutation testing** measures test quality beyond coverage. Run periodically.

**Proof of work**: Run the test command and show passing output before reporting done. Never write "the tests should pass" — run them and confirm they do.

## AI Behavior

**Uncertainty & Verification**

When you're about to write code that uses an external API, library function, or package feature you haven't verified in THIS session, you MUST:
1. Say explicitly: "I need to verify <X>"
2. Use Read/Grep/Glob to check the actual source or installed package
3. If confirmed, proceed; if not, ask or use the actual API

Never state an API exists based on training data alone. Verify or abstain. Confident wrong answers are worse than honest uncertainty.

**No completion claims without proof**: Never write "this works", "this should work", or "tests should pass" as a terminal statement. Run the test command, observe the output, include it in your response. The Stop hook checks the session transcript — it will block you if you claim completion without evidence.

**User Constraints Are Hard Requirements**

When the user gives explicit constraints ("use X", "don't do Y", "no Z"), those are non-negotiable. Do not reinterpret, simplify, or substitute. If a constraint is unclear, ask ONCE. Otherwise follow it exactly.

**No Follow-Up Questions**

Do not end responses with "Want me to...", "Should I also...", or similar follow-up prompts. If the work is done, state what changed and stop. If there's genuine ambiguity about next steps, name the specific decision rather than open-ended questions.

**Read Before Editing**

Before modifying any non-trivial code, trace the full data flow. Don't apply frontend band-aids when the root cause is backend (or vice versa).

**No Destructive Operations Without Permission**

Never run `git reset --hard`, `rm -rf`, `git push --force`, `DROP TABLE`, or publish commands without explicit user approval.

**No Co-Authored-By**

Do not add "Co-Authored-By: Claude" to commit messages.

## Component Patterns

- Function components only, no classes
- Every component has an explicit Props interface
- Each component owns its own state — do NOT centralize all state in a parent and pass it down
- No prop drilling — a prop should be directly consumed by the component that receives it, never passed through as a relay
- Layout shells use named snippets/slots (Svelte 5) or render props/children (React) — they define structure only, touch no data
- Shared types live in a `types.ts` file — never redefine types that already exist in the codebase
- Do not use framework-internal stores (`$page.data`, context API) in shared `$lib` components — they are loosely typed
- Error boundaries on every route

**Before writing a component, answer:**
1. What state does it own? (If none, say so explicitly)
2. What props does it consume directly? (If a prop just passes through, it doesn't belong here)
3. Do the types already exist somewhere? (Use them — don't redefine)

## State Management

- Each component owns the state it is responsible for — do not hoist state to a parent unless two siblings genuinely need to share it
- When siblings must share reactive state, use the framework's appropriate primitive (Svelte 5 `$state` in a `.svelte.ts` module; Jotai atoms in React) — not a fat parent component
- Simple local UI state (open/closed, hover, loading) lives in the component that controls it
- Feature-scoped shared state lives in co-located store files (`feature/store/`)
- Cross-feature communication via shared atoms or events, not prop chains

## Styling & UI

- Use shadcn/ui primitives with defaults — never override unless required
- No arbitrary Tailwind values (`w-[347px]`) — use theme tokens
- No color-specific classes (`bg-blue-500`) — use design tokens (`bg-primary`)
- No inline styles (`style={{}}`) — use Tailwind
- No className concatenation — use `cn()` or `clsx()`
- No className soup: 1-3 utility classes per element, not 20+
- No empty `<div>` or `<span>` elements
- Semantic HTML everywhere

## Performance

- Avoid inline arrow functions in hot paths — extract to named functions
- Avoid inline object/array literals in props — extract to variables
- Stable references for callbacks
- Keys: stable unique identifiers, never array indices
- Lazy load routes and heavy components
