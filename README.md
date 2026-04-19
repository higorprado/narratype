# Narratype

Practice typing by retyping classic literature and imported books.

## Features

- Typing practice with classic literature (built-in books)
- Import your own EPUB and PDF files
- 20 color themes (including Catppuccin Latte, Frappe, Macchiato, Mocha)
- 8 font choices (including dyslexia-friendly options)
- Multiple cursor styles (box, line, underline, dot, highlight variants)
- Reading mode, auto-advance, auto-scroll
- Per-page progress tracking with session persistence
- WPM and accuracy statistics
- International mode and punctuation skipping
- Responsive design

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router** for navigation
- **IndexedDB** for imported book storage
- **@lingo-reader/epub-parser** for EPUB import
- **pdfjs-dist** for PDF import
- **Vitest** + **Testing Library** for tests

## Data Persistence

All data is stored locally in the browser. Nothing is sent to any server.

| Data | Storage | Key / Store |
|------|---------|-------------|
| Imported books (metadata + chapter text) | IndexedDB (`narratype-imported`) | `books`, `chapters` object stores |
| Typing progress (completed pages, last page) | localStorage | `narratype-progress` |
| Settings (theme, font, cursor, etc.) | localStorage | `narratype-settings` |
| Typing session state (position, char states) | localStorage | `narratype-session-*` |
| Cookie consent preference | localStorage | `narratype-consent` |

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd narratype

# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  components/     # React UI components (one .tsx + .module.css per component)
    __tests__/    # Component tests
  context/        # React context providers (Settings, Progress)
  data/           # Book data registry and built-in book definitions
  hooks/          # Custom React hooks
  pages/          # Page-level components (route targets)
  storage/        # IndexedDB storage layer for imported books
  styles/         # Global CSS, reset, fonts, theme definitions
    themes/       # Per-theme CSS files
  types/          # Shared TypeScript type definitions
  utils/          # Pure utility functions
  App.tsx         # Route definitions
  main.tsx        # Entry point
```

## Themes

20 themes available:

| Category | Themes |
|----------|--------|
| Classic | classic-dark, classic-light |
| Warm | timber, terracotta, mellow, beachside, cinder |
| Cool | ocean, lagoon, surf |
| Vibrant | bubblegum, bumblebee, pulse |
| Nature | canopy, platoon |
| Print | newsprint |
| Catppuccin | catppuccin-latte (light), catppuccin-frappe, catppuccin-macchiato, catppuccin-mocha |

## License

MIT License. See [LICENSE](LICENSE).
