# Validation Gates

Every change must pass all of these before committing.

## Gate 1: Type Safety

```bash
npx tsc -b --noEmit
```

Zero errors. Zero warnings. No `@ts-ignore` suppressions without a documented reason.

## Gate 2: Tests

```bash
npx vitest run
```

All tests pass. No skipped tests. No `xit` or `test.skip` without a tracking issue.

## Gate 3: Lint

```bash
npx eslint .
```

Zero errors. Warnings are acceptable only if the rule is overly broad for the specific case.

## Gate 4: Coverage

```bash
npx vitest run --coverage
```

Line coverage must remain above 80%. If a change lowers coverage, add tests to compensate.

## Gate 5: Manual Smoke Test

For UI changes that cannot be fully verified by automated tests:

1. Run `npm run dev`
2. Navigate to the affected page
3. Verify the change works as expected
4. Verify no regressions in adjacent functionality

## Commit Checklist

Before committing, verify:

- [ ] `npx tsc -b --noEmit` passes
- [ ] `npx vitest run` passes
- [ ] New code has test coverage
- [ ] No commented-out code or debug logging
- [ ] Commit message follows convention (`feat(scope):`, `fix(scope):`, etc.)
- [ ] One logical change per commit
