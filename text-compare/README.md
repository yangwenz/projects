# Text Comparer

A real-time, client-side text comparison tool built with Next.js. Paste or drop files into side-by-side panels and instantly see differences highlighted with synchronized scrolling.

## Features

- **Three diff modes** -- line, word, and character-level comparison
- **Synchronized scrolling** -- alignment-anchor-based scroll sync between panels
- **Change navigation** -- step through diffs sequentially with Previous/Next controls
- **Export** -- copy or download diffs as `.diff`, `.txt`, or styled `.html`
- **File drag-and-drop** -- supports txt, json, xml, csv, md, log, yaml, html, css, js, ts
- **Comparison settings** -- ignore case, whitespace, or empty lines; toggle whitespace visualization
- **Dark mode** -- automatic light/dark theme via `prefers-color-scheme`
- **Web Worker diffing** -- computation runs off the main thread to keep the UI responsive

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |

## Tech Stack

- Next.js 16, React 19, TypeScript (strict)
- Tailwind CSS v4
- `diff` for line/word/char comparison
- Jest 30 + ts-jest for testing

## Project Structure

```
src/
  app/           -- root layout, page, and global styles
  components/    -- UI components (CompareView, EditorPanel, Toolbar, etc.)
  context/       -- DiffContext (central state, worker lifecycle, debounce)
  lib/           -- pure logic (diff computation, scroll sync, export, file upload)
  types/         -- TypeScript interfaces
  workers/       -- Web Worker entry point
__tests__/       -- unit tests mirroring src/lib and src/workers
```

## Limits

- Max 5 MB per file
- Max 100,000 lines per file
