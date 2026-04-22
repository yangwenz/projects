# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, eslint.config.mjs)
npm test             # Run all Jest tests
npm test -- --watch  # Watch mode
npm test -- __tests__/lib/diff-computation.test.ts  # Run a single test file
```

## Architecture

Client-only Next.js 16 app (no backend) for real-time side-by-side text diffing. Uses the `diff` npm package for comparison and offloads computation to a Web Worker to keep the UI responsive.

**Data flow:** User types in `EditorPanel` -> `DiffProvider` (React Context) debounces 300ms -> posts `DiffRequest` to Web Worker -> worker calls `computeDiff()` from `src/lib/diff-computation.ts` -> posts `DiffResponse` back -> `DiffProvider` updates state (with stale-result rejection via monotonic request IDs) -> components re-render with diff highlights.

**Key modules:**
- `src/context/DiffContext.tsx` — Central state: editor content, diff results, settings, diff mode, change navigation. Owns the worker lifecycle and debounce logic.
- `src/lib/diff-computation.ts` — Pure diff logic (independently testable, also called by worker). Validates input limits (5 MB / 100k lines).
- `src/lib/scroll-sync.ts` — Alignment-anchor-based scroll synchronization between panels. Uses binary search over line offset tables.
- `src/lib/export.ts` — Pure functions generating unified diff, plain text, and HTML export formats.
- `src/workers/diff.worker.ts` — Web Worker entry point; thin wrapper around `diff-computation.ts`.

**Three diff modes** (line/word/character) each call a different `diff` library function (`diffLines`/`diffWords`/`diffChars`). Switching modes always triggers a full re-compute.

## Tech Stack

- Next.js 16 with App Router, React 19, TypeScript (strict)
- Tailwind CSS v4 (via `@tailwindcss/postcss` plugin, `@theme inline` in globals.css)
- Jest 30 + ts-jest for testing (test environment: node)
- Path alias: `@/*` maps to `./src/*`

## Testing

Tests live in `__tests__/` mirroring `src/` structure. All tests target pure logic in `src/lib/` and the worker message layer — no component/DOM tests. The worker test imports the handler directly rather than using `postMessage`.

## CSS Tokens

Diff highlight colors and UI theme tokens are CSS custom properties defined in `src/app/globals.css` with automatic dark mode via `prefers-color-scheme`. Tailwind theme references them via `@theme inline` (e.g., `bg-diff-added-bg`, `text-gutter-text`).
