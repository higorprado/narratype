# Operating Rules

Non-negotiable constraints for every change to this codebase.

## Before Every Commit

1. `npx tsc -b --noEmit` must pass with zero errors.
2. `npx vitest run` must pass with zero failures.
3. One logical change per commit. No mixed concerns.

## Code Rules

- **No mocks that invent behaviors.** Mock only external boundaries (localStorage, fetch, IndexedDB, Date.now). Never mock internal module functions or React state.
- **Test new features.** Every new hook, utility, or component must have corresponding test coverage. Untested code is a bug waiting to ship.
- **Separation of concerns.** The TypingEngine handles presentation (chars, cursor, visual state). The StatsAccumulator handles raw numbers (totalChars, totalTimeMs, sessionChars). TypingArea orchestrates both. Do not mix these responsibilities.
- **CSS modules co-located.** Every component has a `.module.css` file in the same directory. No global CSS except `src/styles/`.
- **Types centralized.** All shared types live in `src/types/`. Do not define interfaces inline in component files if they are used elsewhere.
- **Path alias `@/`** maps to `src/`. Use it for all cross-directory imports.

## What Not To Do

- Do not create compatibility shims, forwarding addresses, or "temporary" bridges.
- Do not leave commented-out code, `// TODO` markers without a tracking issue, or `console.log` statements.
- Do not add abstractions until the same pattern appears at least twice (DRY at 2).
- Do not commit generated files or coverage output.
