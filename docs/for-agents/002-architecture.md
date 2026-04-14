# Architecture

## Core Principle

The typing system is split into three layers with strict boundaries:

1. **TypingEngine** (`useTypingEngine`): Pure presentation state. Manages the characters array, cursor position, char states (UNTYPED/CORRECT/INCORRECT), and completion status. Returns char counts but does NOT compute time or WPM.

2. **StatsAccumulator** (`useStatsAccumulator`): Pure numeric state. Tracks totalChars, totalTimeMs, sessionChars, sessionStartTime. Knows nothing about the characters array or React components. Uses `useRef` (not state) to avoid re-renders on every keystroke.

3. **TypingArea** (`TypingArea.tsx`): Orchestrator component. Uses both hooks and merges their outputs into `TypingStats` (which includes wpm, accuracy, elapsedMs). Reports stats to parent via `onStatsUpdate` callback.

## Data Flow

```
Built-in books (src/data/books.ts)
        |
        v
data/index.ts -- registerImportedBooks() <-- useImportedBooks hook
        |                                         ^
        v                                         |
getPage() --> splitTextIntoPages()          storage/importedBooks.ts (IndexedDB)
        |
        v
TypingConsolePage (route handler)
        |
        v
TypingArea (orchestrator)
   |           |
   v           v
useTypingEngine   useStatsAccumulator
   |           |
   v           v
buildFullStats() --> TypingStats { wpm, accuracy, correctChars, totalTypedChars, elapsedMs }
        |
        v
StatsBar (display)
```

## Session Lifecycle

### Typing Session
1. User types first character -> TypingEngine records `startTime`, StatsAccumulator starts session (`sessionStartTime = Date.now()`, `sessionChars = 1`).
2. Each correct keystroke advances cursor. StatsAccumulator increments `sessionChars`.
3. Backspace decrements `sessionChars` (min 0).
4. On inactivity timeout or blur: StatsAccumulator pauses (accumulates session into totals, resets session).
5. On resume (next keystroke): StatsAccumulator starts new session.
6. On page complete: TypingEngine sets `isComplete = true`.

### Inactivity State Machine
```
IDLE <--[inactivity timeout / blur]-- TYPING
TYPING <--[keystroke after idle]-- IDLE
```

- Transition TYPING -> IDLE: `onPause(lastKeystrokeTime)`, `onInactivity()` callback fires.
- Transition IDLE -> TYPING: `onActivity()` callback fires, new session starts.
- `lastKeystrokeTime` (not `Date.now()`) is used for elapsed time calculation. This prevents time from ticking during inactivity.

### Blur Pause
When the typing area loses focus:
1. If typing has started and page is not complete and not already idle: pause stats accumulator, set idle, call `onInactivity()`.
2. Report frozen stats using `buildFullStatsAtTime(pauseTime)`.
3. Flush session save to localStorage.

### Session Persistence
- Debounced save (2s after cursor change) to localStorage via `typingSessionStorage.ts`.
- Immediate save on visibility change (tab hidden) and beforeunload.
- Save cleared on page completion.
- On page load: session restored if text matches (first 100 chars validation) and charStates length matches text length.

## Settings

- React context (`SettingsContext`) with localStorage persistence.
- Key settings: `cursorStyle`, `stopCursorAfterMistype`, `ignoreCapitalization`, `skipPunctuation`, `internationalMode`, `wordsPerPage`, `inactivityTimeout`, `autoAdvancePage`, `statsUpdateFrequency`, `hideUI`, `readingMode`, `smoothCursor`, `autoScroll`, `showLiteralMistypes`, `theme`, `font`.

## Progress Tracking

- React context (`ProgressContext`) with localStorage persistence.
- Tracks completed pages per book/chapter and last page viewed.

## Imported Books

- EPUB files parsed by `@lingo-reader/epub-parser` in `epubImporter.ts`.
- PDF files parsed by `pdfjs-dist` in `pdfImporter.ts`. Text extracted per page, split into chapters by word count (paragraph-aware), configured via `ImportConfigModal` at import time with global default from `pdfWordsPerChapter` setting.
- Stored in IndexedDB (`narratype-imported` database, `books` and `chapters` object stores).
- Registered in memory via `registerImportedBooks()` in `data/index.ts`.
- Displayed alongside built-in books in the home page.

### Delete Flow
1. User clicks delete button on BookCard (visible on hover for imported books).
2. `ConfirmDialog` prompts for confirmation.
3. On confirm: `useImportedBooks.deleteBook(slug)` looks up meta by slug, deletes from IndexedDB, refreshes book list.

### Edit Flow
1. User clicks edit button on BookCard (visible on hover for imported books, above delete button).
2. `EditBookDialog` opens with pre-filled title and author inputs.
3. On save: `useImportedBooks.updateBook(slug, { title, author })` looks up meta by slug, updates in IndexedDB (regenerating slug from new title+author), refreshes book list.
4. Book slug changes after edit, so progress tracking resets for the renamed book.
