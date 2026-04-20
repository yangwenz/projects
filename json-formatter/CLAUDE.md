# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Production build
npm run lint       # ESLint (Next.js core-web-vitals + TypeScript)
npm test           # Run all Jest tests
npx jest src/__tests__/json-engine.test.ts   # Run a single test file
```

## Architecture

Client-side-only Next.js 16 app (single route) for JSON formatting, validation, and inspection. All components use `"use client"` — there is no server-side logic.

**Data flow:** User input → 300ms debounce → Web Worker → returns `FormatResult` (formatted string, tokens, parsed object, validation, stats) → React re-renders output panels.

### Key modules

- `src/app/page.tsx` — Main component, orchestrates all state and wires together child components.
- `src/lib/json-engine.ts` — Pure functions for validate, format, minify, stats. All JSON business logic lives here.
- `src/lib/syntax-highlight.ts` — Hand-written tokenizer (no external library). Produces `HighlightToken[]` for the code view.
- `src/lib/tree-builder.ts` — Converts parsed JSON into a collapsible `TreeNode` tree structure.
- `src/workers/json.worker.ts` — Web Worker entry point. Thin shell that delegates to json-engine and syntax-highlight.
- `src/hooks/useJsonWorker.ts` — Worker lifecycle, message passing, and debounce logic.
- `src/hooks/useFileHandler.ts` — File upload, download, drag-and-drop.
- `src/contexts/SettingsContext.tsx` — Settings state via React Context + localStorage persistence (uses `useSyncExternalStore`).
- `src/lib/types.ts` — All shared TypeScript types. Worker messages use discriminated unions (`WorkerRequest`/`WorkerResponse`).

### Worker message protocol

`WorkerRequest` and `WorkerResponse` are discriminated unions keyed on `type` ("format" | "minify"). Each request carries a unique `id` for correlation. Error responses use `type: "error"`.

## Testing

Tests cover pure functions in `src/lib/` only (json-engine, syntax-highlight, tree-builder). Components and hooks are validated through manual browser testing. Jest runs with `ts-jest` preset in Node environment. The `@/*` path alias is mapped in `jest.config.ts`.

## Styling

Tailwind CSS 4 with `@import "tailwindcss"` syntax in `globals.css`. Uses Geist Sans and Geist Mono font variables. No CSS modules or CSS-in-JS.
