# JSON Formatter

A browser-based tool for formatting, validating, minifying, and exploring JSON data. Built with Next.js 16, React 19, and TypeScript. All processing happens client-side — nothing leaves your browser.

## Features

- **Format** — configurable indentation (2 spaces, 4 spaces, tabs) and optional key sorting (A-Z / Z-A)
- **Validate** — real-time validation with line/column error reporting
- **Minify** — one-click minification with before/after size comparison
- **Code View** — syntax-highlighted output with line numbers
- **Tree View** — collapsible hierarchy with click-to-copy JSON paths (e.g. `$.store.books[0].title`)
- **File I/O** — upload, drag-and-drop, download, copy to clipboard
- **Statistics** — input size, line count, key count, max nesting depth
- **Settings** — indent size, key sort order, auto-format on paste, persisted in localStorage
- **Responsive** — desktop (side-by-side), tablet/mobile (stacked), dark mode

## Tech Stack

- **Next.js 16** / **React 19** / **TypeScript 5**
- **Tailwind CSS 4** for styling
- **Web Worker** for off-main-thread JSON processing
- **Jest 30** + **ts-jest** for testing
- No external runtime dependencies beyond React and Next.js

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |

## Project Structure

```
src/
  app/
    page.tsx                 # Main component, orchestrates all state
    layout.tsx               # Next.js layout
  components/                # UI components (Header, Toolbar, InputPanel, OutputPanel, etc.)
  contexts/
    SettingsContext.tsx       # Settings via React Context + localStorage
  hooks/
    useJsonWorker.ts         # Worker lifecycle, message passing, debounce
    useFileHandler.ts        # File upload, download, drag-and-drop
  lib/
    json-engine.ts           # Pure functions: validate, format, minify, stats
    syntax-highlight.ts      # Hand-written tokenizer for code view
    tree-builder.ts          # Builds collapsible TreeNode structure
    types.ts                 # Shared TypeScript types (discriminated unions)
  workers/
    json.worker.ts           # Web Worker entry point
  __tests__/                 # Unit tests for lib/ modules
```

## Architecture

All components use `"use client"` — there is no server-side logic.

**Data flow:** User input -> 300ms debounce -> Web Worker (json-engine + syntax-highlight) -> structured result -> React renders Code View, Tree View, and stats.

Worker messages use discriminated unions (`WorkerRequest` / `WorkerResponse`) keyed on `type` (`"format"` | `"minify"` | `"error"`), with a unique `id` for correlation.

## Testing

Tests cover pure functions in `src/lib/` (json-engine, syntax-highlight, tree-builder). Components are validated through manual browser testing.

```bash
npm test
npx jest src/__tests__/json-engine.test.ts   # single file
```

## License

MIT
