# Repository Map

## Top-Level Layout

```
src/
  components/     # React UI components (one .tsx + .module.css per component)
    __tests__/    # Component tests
  context/        # React context providers (Settings, Progress)
    __tests__/    # Context tests
  data/           # Book data registry and built-in book definitions
    __tests__/    # Data layer tests
  hooks/          # Custom React hooks
    __tests__/    # Hook tests
  pages/          # Page-level components (route targets)
    __tests__/    # Page tests
  storage/        # IndexedDB storage layer for imported books
    __tests__/    # Storage tests
  styles/         # Global CSS, reset, fonts, theme definitions
    themes/       # Per-theme CSS files (classic-light, ocean, etc.)
  test/           # Test setup (setup.ts)
  types/          # Shared TypeScript type definitions
  utils/          # Pure utility functions
    __tests__/    # Utility tests
  App.tsx         # Route definitions
  main.tsx        # Entry point
```

## Key Files and Ownership

| File | Responsibility |
|------|---------------|
| `src/hooks/useTypingEngine.ts` | Typing state machine: chars, cursor, completion. Pure presentation. |
| `src/hooks/useStatsAccumulator.ts` | Accumulates char counts and elapsed time across sessions. |
| `src/hooks/useImportedBooks.ts` | Book import flow: dispatches to EPUB or PDF parser, stores, refreshes. |
| `src/hooks/useTheme.ts` | Theme switching (CSS class on document root). |
| `src/hooks/useFont.ts` | Font selection. |
| `src/hooks/useDocumentTitle.ts` | Updates `document.title`. |
| `src/components/TypingArea.tsx` | Main typing orchestrator. Merges engine + accumulator. |
| `src/components/StatsBar.tsx` | Displays WPM, accuracy, time. |
| `src/components/SettingsModal.tsx` | User preferences UI. |
| `src/components/ImportButton.tsx` | File picker for EPUB and PDF import. Shows config modal for PDFs. |
| `src/components/ImportConfigModal.tsx` | PDF import configuration dialog (words per chapter). |
| `src/pages/TypingConsolePage.tsx` | Primary page: book/chapter/page routing, stats display, navigation. |
| `src/pages/ChaptersPage.tsx` | Chapter list for a book. |
| `src/pages/HomePage.tsx` | Landing page with book grid. |
| `src/data/index.ts` | Book registry: built-in + imported books, chapter/page lookup. |
| `src/data/books.ts` | Built-in book definitions (The Art of War, etc.). |
| `src/storage/importedBooks.ts` | IndexedDB CRUD for imported EPUB books. |
| `src/utils/typingSessionStorage.ts` | localStorage save/load for typing session state. |
| `src/utils/textSplitter.ts` | Splits chapter text into pages by word count. |
| `src/utils/stats.ts` | WPM and accuracy calculations. |
| `src/utils/textNormalizer.ts` | Text normalization for built-in books. |
| `src/utils/charComparator.ts` | Character comparison (case-insensitive, international mode). |
| `src/utils/pdfImporter.ts` | PDF file parsing using pdfjs-dist. Extracts text, splits into chapters by word count. |
| `src/utils/slugify.ts` | Shared URL-safe slug generation from title + author. |
| `src/context/SettingsContext.tsx` | Settings state with localStorage persistence. |
| `src/context/ProgressContext.tsx` | Reading progress tracking with localStorage persistence. |
| `src/types/book.ts` | Book, Chapter, Page, ImportedBookMeta, ImportedChapter. |
| `src/types/typing.ts` | CharState, TypingChar, TypingPage, TypingStats. |
| `src/types/settings.ts` | Settings, CursorStyle, ThemeName, FontName, etc. |

## Config Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite + Vitest configuration. Path alias `@/`, jsdom environment. |
| `tsconfig.json` | TypeScript project references. |
| `tsconfig.app.json` | App source compilation config. |
| `package.json` | Dependencies and scripts. |
