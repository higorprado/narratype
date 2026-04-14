# Agent Documentation

Start here. This repo uses agent-oriented documentation under `docs/for-agents/`.

## Quick Reference

| What | Command |
|------|---------|
| Type check | `npx tsc -b --noEmit` |
| Run tests | `npx vitest run` |
| Single test | `npx vitest run path/to/test.ts` |
| Coverage | `npx vitest run --coverage` |
| Lint | `npx eslint .` |
| Dev server | `npm run dev` |
| Build | `npm run build` |

## Commit Conventions

- `feat(scope): description` — new feature
- `fix(scope): description` — bug fix
- `refactor(scope): description` — restructuring without behavior change
- `test(scope): description` — test additions/changes
- `docs: description` — documentation only

One logical change per commit.

## Documentation Index

| File | Purpose |
|------|---------|
| [000-operating-rules.md](docs/for-agents/000-operating-rules.md) | Hard constraints for all changes |
| [001-repo-map.md](docs/for-agents/001-repo-map.md) | Where things live in the codebase |
| [002-architecture.md](docs/for-agents/002-architecture.md) | Data flow, state management, component hierarchy |
| [003-testing.md](docs/for-agents/003-testing.md) | How to run tests, coverage, test patterns |
| [004-validation-gates.md](docs/for-agents/004-validation-gates.md) | What must pass before committing |
| [999-lessons-learned.md](docs/for-agents/999-lessons-learned.md) | Hard-won knowledge from past bugs |
