# JSON Formatter - Technical Design

## High-Level Architecture

The app is a single-route Next.js client-side application. All components are `"use client"` -- there is no server-side data fetching or processing. Heavy JSON operations run in a **Web Worker** to keep the UI responsive.

```
┌─────────────────────────────────────────────────────┐
│                    page.tsx                         │
│  ┌───────────────────┐  ┌────────────────────────┐  │
│  │  InputPanel       │  │   OutputPanel          │  │
│  │ - textarea editor │  │  - CodeView (default)  │  │
│  │ - file drop zone  │  │  - TreeView            │  │
│  │ - line numbers    │  │  - StatsPanel          │  │
│  └────────┬──────────┘  └────────▲───────────────┘  │
│           │                      │                  │
│           ▼                      │                  │
│  ┌─────────────────────────────────────────────┐    │
│  │         useJsonWorker (hook)                │    │
│  │   debounce 300ms → postMessage → onmessage  │    │
│  └──────────────────┬──────────────────────────┘    │
└─────────────────────┼───────────────────────────────┘
                      │ Worker thread
              ┌───────▼───────┐
              │ json.worker   │
              │  - parse      │
              │  - format     │
              │  - minify     │
              │  - validate   │
              │  - stats      │
              └───────────────┘
```

### Module Overview

| Module | Responsibility |
|---|---|
| **JSON Worker** | Parse, validate, format, minify, compute stats. Runs off the main thread. |
| **InputPanel** | Text editor with line numbers, error highlighting, file upload/drag-drop. |
| **CodeView** | Syntax-highlighted formatted JSON output with line numbers. |
| **TreeView** | Collapsible tree explorer. Click a node to copy its JSON path. |
| **StatsPanel** | Displays input size, line count, key count, max depth. |
| **SettingsDrawer** | Indent size, key sorting, auto-format toggle. Persists to localStorage. |

---

## UI Design

### Layout

Desktop (1024px+): side-by-side two-panel layout. Tablet/mobile: stacked vertically, input on top.

```
┌───────────────────────────────────────────────────────┐
│  [JSON Formatter]                            [⚙]      │  ← Header
├──────────────────────────┬────────────────────────────┤
│  Input                   │  Output                    │
│  ┌────────────────────┐  │  [Code View] [Tree View]   │  ← View toggle tabs
│  │ 1 │ {              │  │  ┌──────────────────────┐  │
│  │ 2 │   "name": ...  │  │  │ syntax-highlighted   │  │
│  │ 3 │ }              │  │  │ output or tree view  │  │
│  │   │                │  │  │                      │  │
│  └────────────────────┘  │  └──────────────────────┘  │
│  [Upload] [Paste] [Clear]│  [Copy] [Download] [Minify]│  ← Toolbars
│                          │                            │
│  ● Valid JSON            │  ▼ Stats                   │  ← Status / Stats
│                          │    Size: 1.2 KB            │
│                          │    Keys: 24  Depth: 4      │
├──────────────────────────┴────────────────────────────┤
│                    Settings Drawer (slides from right)│
│  Indent: [2] [4] [Tab]   Sort keys: [Off] [A-Z] [Z-A] │
│  Auto-format on paste: [On]                           │
└───────────────────────────────────────────────────────┘
```

### Input Panel

- A `<textarea>` with a gutter showing line numbers, rendered via a synchronized overlay div.
- On validation error, the error line is highlighted with a red background in the gutter.
- Drag-and-drop: the entire panel is a drop zone. On dragover, show a visual overlay. On drop, read the file and populate the editor.
- File upload button opens a native file picker filtered to `.json`.
- Paste detection: on the `paste` event, if auto-format is enabled, trigger a worker format after the debounce.

### Output Panel

- **Code View** (default): A read-only div with syntax-highlighted HTML spans. Each token type (key, string, number, boolean, null, punctuation) gets a distinct color via Tailwind classes. Line numbers in a gutter.
- **Tree View**: A recursive component. Each node shows: expand/collapse toggle (for objects/arrays), the key or index label, a type badge, and the value (for leaves). Click a node row to copy its path (`$.foo.bar[0]`) and show a toast.
- **Minify button**: Sends a minify request to the worker. Output switches to the minified string. Any subsequent input change reverts to formatted mode.
- **Stats panel**: Collapsible via a chevron toggle. Shows input size (B/KB/MB), line count, key count, max depth. Updated on every successful parse.

### Settings Drawer

- Triggered by the gear icon in the header. Slides in from the right as an overlay panel.
- All settings are stored in a React context backed by `localStorage`. Changes take effect immediately -- the current output re-formats with the new settings.

### Interactions Summary

| User Action | System Response |
|---|---|
| Type in input | Debounce 300ms, then send to worker for validate + format. Update output + status. |
| Paste into input | If auto-format on, same as typing but immediate (paste replaces content). |
| Drop/upload file | Read file contents into input textarea. Trigger validate + format. |
| Click Minify | Send minify request to worker. Show minified output + size comparison. |
| Click Copy | Copy output text to clipboard. Show toast. |
| Click Download | Trigger a download of the output as `.json`. |
| Click Clear | Reset input, output, stats, status to empty state. |
| Click tree node | Copy JSON path to clipboard. Show toast. |
| Change settings | Re-format current input with new settings. Persist to localStorage. |

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, font setup, global providers
│   ├── page.tsx                # Single route. Composes all panels.
│   ├── globals.css             # Tailwind base + custom token colors
│   └── favicon.ico
│
├── components/
│   ├── Header.tsx              # App title + settings gear icon
│   ├── InputPanel.tsx          # Textarea editor, line numbers, drop zone
│   ├── OutputPanel.tsx         # Wraps CodeView/TreeView + tabs + toolbar
│   ├── CodeView.tsx            # Syntax-highlighted formatted output
│   ├── TreeView.tsx            # Recursive collapsible tree
│   ├── TreeNode.tsx            # Single node in the tree
│   ├── StatsPanel.tsx          # Collapsible stats display
│   ├── StatusBar.tsx           # Valid/invalid indicator with error details
│   ├── SettingsDrawer.tsx      # Slide-out settings panel
│   └── Toast.tsx               # Notification toast for copy confirmations
│
├── workers/
│   └── json.worker.ts          # Web Worker: all JSON processing
│
├── hooks/
│   ├── useJsonWorker.ts        # Manages worker lifecycle + message passing
│   ├── useSettings.ts          # Settings state + localStorage sync
│   └── useFileHandler.ts       # File upload, drag-drop, download logic
│
├── lib/
│   ├── json-engine.ts          # Pure functions: parse, format, minify, validate, stats
│   ├── syntax-highlight.ts     # Tokenizes JSON string → array of typed spans
│   ├── tree-builder.ts         # Converts parsed JSON → tree node structure
│   └── types.ts                # Shared TypeScript interfaces
│
└── contexts/
    └── SettingsContext.tsx      # React context + provider for settings
```

### Key Decisions

- **No external editor library.** A plain `<textarea>` with a line-number overlay keeps the bundle small and avoids complexity. The input panel doesn't need syntax highlighting -- that's only on the output side.
- **No external syntax highlighting library.** The JSON grammar is simple enough that a hand-written tokenizer (~100 lines) produces the spans we need for CodeView. This avoids pulling in a large library for a single language.
- **`json-engine.ts` contains the pure logic, `json.worker.ts` is the thin worker shell.** This separation lets us unit-test the engine directly without worker plumbing, and makes it easy to call the engine synchronously for small inputs if needed.

---

## Web Worker Design

### Why a Worker

JSON.parse and JSON.stringify are synchronous and block the main thread. For a 5 MB file, `JSON.parse` alone can take 200-400ms. Adding formatting, stats computation, and key sorting on top of that pushes well past a frame budget. The worker keeps the UI responsive.

### Worker Protocol

The main thread and worker communicate via `postMessage` with a typed message protocol:

```typescript
// Main thread → Worker
type WorkerRequest =
  | { id: string; type: "format"; payload: { input: string; indent: IndentOption; sortKeys: SortKeysOption } }
  | { id: string; type: "minify"; payload: { input: string } }
  | { id: string; type: "validate"; payload: { input: string } };

// Worker → Main thread
type WorkerResponse =
  | { id: string; type: "format"; result: FormatResult }
  | { id: string; type: "minify"; result: MinifyResult }
  | { id: string; type: "validate"; result: ValidateResult }
  | { id: string; type: "error"; error: string };
```

Each request includes a unique `id` so the main thread can correlate responses. The `useJsonWorker` hook generates IDs and discards stale responses (if a newer request has been sent).

### Message Flow

```
User types → 300ms debounce → useJsonWorker.format(input, settings)
  → postMessage({ id, type: "format", payload })
  → Worker: parse → validate → sort keys → format → compute stats
  → postMessage({ id, type: "format", result: { formatted, stats, validation } })
  → Hook updates state → React re-renders output
```

A single `format` request returns everything: the formatted string, validation result, and stats. This avoids multiple round-trips for what is always needed together.

The `minify` request is separate because it's user-triggered (button click), not automatic.

### Worker Lifecycle

- The worker is created once when `useJsonWorker` mounts and terminated on unmount.
- Instantiated via `new Worker(new URL("../workers/json.worker.ts", import.meta.url))`. Next.js/webpack handles bundling this as a separate chunk.
- If the worker crashes, the hook catches the `error` event and recreates it.

### Operations Detail

**Parse + Validate:** Uses native `JSON.parse` inside a try/catch. On error, extracts the line/column from the error message (browsers include position info in SyntaxError messages). Returns a `ValidationError` with `{ line, column, message }`.

**Format:** After parsing, serializes back to a string with the specified indent. If key sorting is enabled, walks the parsed object recursively to build a new object with sorted keys before serializing. Uses `JSON.stringify(value, null, indent)` for the base case, with a custom replacer for sorted keys.

**Minify:** `JSON.stringify(JSON.parse(input))` -- no indent argument produces a single-line output. Returns both the minified string and the original/minified byte counts for the size comparison display.

**Stats:** Computed in a single recursive walk of the parsed value:
- **Input size**: `new Blob([input]).size` for accurate byte count.
- **Line count**: Count newlines in the formatted output.
- **Key count**: Increment for every object key encountered during the walk.
- **Max depth**: Track depth during the walk, record the maximum.

All operations run in a single pass where possible. A `format` request does: parse → validate → sort → stringify → stats, returning one combined result object.
