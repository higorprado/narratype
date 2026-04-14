# Testing

## Running Tests

```bash
# All tests
npx vitest run

# Single test file
npx vitest run src/hooks/__tests__/useTypingEngine.test.ts

# Watch mode
npx vitest

# Coverage report
npx vitest run --coverage
```

## Test Configuration

- Config in `vite.config.ts` under `test: {}`.
- Environment: `jsdom`.
- Setup file: `src/test/setup.ts`.
- Path alias `@/` resolved to `src/`.
- CSS modules loaded (not mocked).

## Test Patterns

### Hooks
```ts
import { renderHook, act } from '@testing-library/react'

const { result } = renderHook(() => useMyHook(param))

act(() => {
  result.current.doSomething()
})

expect(result.current.value).toBe(expected)
```

### Components
```ts
import { render, screen, fireEvent } from '@testing-library/react'

render(<MyComponent prop="value" />)
const button = screen.getByRole('button', { name: /click/i })
fireEvent.click(button)
expect(screen.getByText('Done')).toBeInTheDocument()
```

### Pages with Routing
```ts
import { MemoryRouter, Routes, Route } from 'react-router-dom'

render(
  <SettingsProvider>
    <ProgressProvider>
      <MemoryRouter initialEntries={['/path']}>
        <Routes>
          <Route path="/path" element={<MyPage />} />
        </Routes>
      </MemoryRouter>
    </ProgressProvider>
  </SettingsProvider>,
)
```

## What to Mock

| Boundary | How |
|----------|-----|
| `localStorage` | `vi.spyOn(Storage.prototype, 'getItem')` or Map-based fake |
| `IndexedDB` | `fake-indexeddb/auto` polyfill (installed as dev dependency) |
| `Date.now()` | `vi.spyOn(Date, 'now').mockReturnValue(timestamp)` |
| `fetch` / external APIs | `vi.fn()` |
| Storage modules | `vi.mock('@/storage/importedBooks', ...)` |

## What NOT to Mock

- Internal module functions (e.g., don't mock `calculateWPM` when testing `TypingArea`).
- React state or hooks (use the real ones).
- Utility functions that are pure (e.g., `splitTextIntoPages`).
- CSS modules (Vitest handles them).

## Coverage Target

- **Line coverage: >80%**
- Check with `npx vitest run --coverage`
- All new code must maintain or improve the coverage ratio.

## jsdom Limitations

- `Element.prototype.scrollIntoView` is not implemented. Mock it in tests:
  ```ts
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn()
  })
  ```
- `ResizeObserver` is not available. Mock if needed:
  ```ts
  global.ResizeObserver = vi.fn().mockImplementation(() => ({ observe: vi.fn(), unobserve: vi.fn() }))
  ```
