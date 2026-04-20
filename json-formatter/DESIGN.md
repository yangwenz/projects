# JSON Formatter - Technical Design

## High-Level Architecture

The app is a single-route Next.js client-side application. All components are `"use client"` -- there is no server-side data fetching or processing. Heavy JSON operations run in a **Web Worker** to keep the UI responsive.

```
┌──────────────────────────────────────────────────────┐
│                    page.tsx                          │
│  ┌────────────────────────────────────────────────┐  │
│  │  Toolbar (Upload, Paste, Clear, Copy, DL, Min) │  │
│  ├───────────────────┬────────────────────────────┤  │
│  │  InputPanel       │   OutputPanel              │  │
│  │ - textarea editor │  - CodeView (default)      │  │
│  │ - file drop zone  │  - TreeView                │  │
│  │ - line numbers    │                            │  │
│  ├───────────────────┴────────────────────────────┤  │
│  │  StatusBar  (validity left │ stats right)      │  │
│  └────────┬───────────────────────▲───────────────┘  │
│           │                       │                  │
│           ▼                       │                  │
│  ┌──────────────────────────────────────────────┐    │
│  │         useJsonWorker (hook)                 │    │
│  │   debounce 300ms → postMessage → onmessage   │    │
│  └──────────────────┬───────────────────────────┘    │
└─────────────────────┼────────────────────────────────┘
                      │ Worker thread
              ┌───────▼───────┐
              │ json.worker   │
              │  - parse      │
              │  - format     │
              │  - minify     │
              │  - validate   │
              │  - stats      │
              │  - highlight  │
              └───────────────┘
```

### Module Overview

| Module | Responsibility |
|---|---|
| **JSON Worker** | Parse, validate, format, minify, syntax-highlight, compute stats. Runs off the main thread. |
| **Toolbar** | Single row of action buttons above the panels: Upload, Paste, Clear, Copy, Download, Minify. |
| **InputPanel** | Text editor with line numbers, error highlighting, file drop zone. |
| **CodeView** | Syntax-highlighted formatted JSON output with line numbers. |
| **TreeView** | Collapsible tree explorer. Click a node to copy its JSON path. |
| **StatusBar** | Validation status (left) + stats: size, line count, key count, max depth (right). Always visible. |
| **SettingsPopover** | Indent size, key sorting, auto-format toggle. Persists to localStorage. |

---

## UI Design

### Layout

Desktop (1024px+): side-by-side two-panel layout. Tablet/mobile: stacked vertically, input on top.

```
┌────────────────────────────────────────────────────────────┐
│  [JSON Formatter]                                     [⚙]  │  ← Header + gear icon
├────────────────────────────────────────────────────────────┤
│  [Upload] [Paste] [Clear]  |  [Copy] [Download] [Minify]   │  ← Toolbar
├────────────────────────────┬───────────────────────────────┤
│  Input                     │  Output                       │
│  ┌──────────────────────┐  │  [Code View] [Tree View]      │  ← View toggle tabs
│  │ 1 │ {                │  │  ┌─────────────────────────┐  │
│  │ 2 │   "name": ...    │  │  │ syntax-highlighted      │  │
│  │ 3 │ }                │  │  │ output or tree view     │  │
│  │   │                  │  │  │                         │  │
│  └──────────────────────┘  │  └─────────────────────────┘  │
├────────────────────────────┴───────────────────────────────┤
│  ● Valid JSON                    1.2 KB · 42 lines · 24    │  ← StatusBar
│                                  keys · depth 4            │
├────────────────────────────────────────────────────────────┤
│  ┌─ Settings Popover (anchored to gear icon) ──────────┐   │
│  │ Indent: [2] [4] [Tab]  Sort keys: [Off] [A-Z] [Z-A] │   │
│  │ Auto-format on paste: [On]                          │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Toolbar

- A single row spanning the full width, positioned between the header and the panels.
- Left group (input actions): Upload, Paste, Clear. Right group (output actions): Copy, Download, Minify.
- Upload opens a native file picker filtered to `.json`. Paste reads from the clipboard. Clear resets all state.
- Copy writes the current output to the clipboard. Download saves it as a `.json` file. Minify toggles minified output.
- Toolbar is a stateless component. `page.tsx` assembles callbacks from `useJsonWorker` (minify), `useFileHandler` (upload, download), and local handlers (paste, copy, clear), then passes them as props.

### Input Panel

- A `<textarea>` with a gutter showing line numbers, rendered via a synchronized overlay div.
- On validation error, the error line is highlighted with a red background in the gutter.
- Drag-and-drop: the entire panel is a drop zone. On dragover, show a visual overlay. On drop, read the file and populate the editor.
- Paste detection: on the `paste` event, if auto-format is enabled, trigger a worker format after the debounce.

### Output Panel

- **Code View** (default): A read-only div that renders the `tokens` array from the worker's `FormatResult`. Each token type (key, string, number, boolean, null, punctuation) maps to a `<span>` with a distinct Tailwind color class. Line numbers in a gutter. CodeView does no parsing or tokenizing itself -- it just maps tokens to markup.
- **Tree View**: A recursive component. Each node shows: expand/collapse toggle (for objects/arrays), the key or index label, a type badge, and the value (for leaves). Click a node row to copy its path (`$.foo.bar[0]`) and show a toast. The tree is built lazily -- `tree-builder.ts` runs on the main thread only when the user switches to Tree View, using the `parsed` object from the last `FormatResult`. It does not rebuild on every keystroke while Code View is active.

### Status Bar

- A single row below the input and output panels, always visible.
- **Left side**: Validation status -- a green dot + "Valid JSON" on success, or a red dot + error message with line:column on failure.
- **Right side**: Stats -- input size (B/KB/MB), line count, key count, max depth. Separated by middot (`·`) delimiters. Updated on every successful parse. Shows dashes (`—`) when input is empty or invalid. When minified output is active, the size field shows a before/after comparison (e.g., `1.2 KB → 840 B`). This reverts to the normal input size display when the user edits the input.

### Settings Popover

- Triggered by the gear icon in the header. Renders as a popover dialog anchored below the icon.
- All settings are stored in a React context backed by `localStorage`. Changes take effect immediately -- the current output re-formats with the new settings.
- Clicking outside the popover or pressing Escape closes it.

### Interactions Summary

| User Action | System Response |
|---|---|
| Type in input | Debounce 300ms, then send to worker for validate + format. Update output + status bar. |
| Paste into input | If auto-format on, same as typing (300ms debounce, then validate + format). |
| Drop/upload file | Read file contents into input textarea. Trigger validate + format. |
| Click Minify | Send minify request to worker. Show minified output. Status bar size field shows `original → minified` comparison. |
| Click Copy | Copy output text to clipboard. Show toast. |
| Click Download | Trigger a download of the output as `.json`. |
| Click Clear | Reset input, output, status bar to empty state. |
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
│   ├── Toolbar.tsx             # Action buttons: Upload, Paste, Clear, Copy, Download, Minify
│   ├── InputPanel.tsx          # Textarea editor, line numbers, drop zone
│   ├── OutputPanel.tsx         # Wraps CodeView/TreeView + tabs
│   ├── CodeView.tsx            # Syntax-highlighted formatted output
│   ├── TreeView.tsx            # Recursive collapsible tree
│   ├── TreeNode.tsx            # Single node in the tree
│   ├── StatusBar.tsx           # Validation status (left) + stats (right), always visible
│   ├── SettingsPopover.tsx     # Popover dialog for settings
│   └── Toast.tsx               # Notification toast for copy confirmations
│
├── workers/
│   └── json.worker.ts          # Web Worker: all JSON processing
│
├── hooks/
│   ├── useJsonWorker.ts        # Manages worker lifecycle + message passing
│   ├── useSettings.ts          # Settings state + localStorage sync
│   └── useFileHandler.ts       # File I/O: returns onUpload/onDownload (→ Toolbar) and onDrop/onDragOver (→ InputPanel)
│
├── lib/
│   ├── json-engine.ts          # Pure functions: parse, format, minify, validate, stats
│   ├── syntax-highlight.ts     # Tokenizes JSON string → array of typed spans
│   ├── tree-builder.ts         # Converts parsed JSON → tree node structure
│   └── types.ts                # Shared TypeScript interfaces
│
├── contexts/
│   └── SettingsContext.tsx      # React context + provider for settings
│
└── __tests__/
    ├── json-engine.test.ts     # Tests for parse, format, minify, validate, stats
    ├── syntax-highlight.test.ts # Tests for tokenizer output
    └── tree-builder.test.ts    # Tests for tree node construction
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
  | { id: string; type: "minify"; payload: { input: string } };

// Worker → Main thread
type WorkerResponse =
  | { id: string; type: "format"; result: FormatResult }
  | { id: string; type: "minify"; result: MinifyResult }
  | { id: string; type: "error"; error: string };

type ValidationResult =
  | { valid: true }
  | { valid: false; line: number; column: number; message: string };

type HighlightToken = { text: string; type: "key" | "string" | "number" | "boolean" | "null" | "punctuation" };

type FormatResult = {
  formatted: string;
  tokens: HighlightToken[];
  parsed: unknown;
  validation: ValidationResult;
  stats: { byteSize: number; lineCount: number; keyCount: number; maxDepth: number };
};

type MinifyResult = {
  minified: string;
  originalSize: number;
  minifiedSize: number;
};
```

Each request includes a unique `id` so the main thread can correlate responses. The `useJsonWorker` hook generates IDs and discards stale responses (if a newer request has been sent).

### Message Flow

```
User types → 300ms debounce → useJsonWorker.format(input, settings)
  → postMessage({ id, type: "format", payload })
  → Worker: parse → validate → sort keys → format → highlight → compute stats
  → postMessage({ id, type: "format", result: { formatted, tokens, stats, validation, parsed } })
  → Hook updates state → React re-renders output
```

A single `format` request returns everything: the formatted string, syntax-highlighted tokens, validation result, and stats. This avoids multiple round-trips for what is always needed together. Syntax highlighting runs in the worker so that tokenizing large files does not block the main thread.

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

All operations run in a single pass where possible. A `format` request does: parse → validate → sort → stringify → highlight → stats, returning one combined result object.

---

## Testing

### Framework

Jest with `ts-jest` for TypeScript support. Tests run via `npm test`. Configuration lives in `jest.config.ts` at the project root.

### Test Location

All tests live in `src/__tests__/`, mirroring the module they cover. Only the pure functions in `lib/` are unit-tested — components and hooks are validated through manual browser testing since the app is entirely client-side and UI-driven.

### Test Coverage

#### `json-engine.test.ts`

**validate**
- Valid JSON returns `{ valid: true }` with no error
- Missing closing brace returns error with correct line and column
- Trailing comma returns parse error
- Empty string returns error
- Non-JSON primitives (bare words like `undefined`) return error

**format**
- Formats minified JSON with 2-space indent (default)
- Formats with 4-space indent
- Formats with tab indent
- Sorts keys ascending: `{"b":1,"a":2}` → `{"a":2,"b":1}` formatted
- Sorts keys descending
- Preserves all JSON types: strings, numbers, booleans, null, nested objects, arrays
- Handles deeply nested structures (10+ levels)

**minify**
- Strips all whitespace from formatted JSON
- Returns correct original and minified byte counts
- Round-trips: `minify(format(input))` produces same data as `minify(input)`

**stats**
- Computes correct byte size (including multi-byte UTF-8 characters)
- Counts lines in formatted output
- Counts all keys across nested objects (including duplicates at different levels)
- Reports max depth: flat object = 1, nested object = 2, etc.
- Empty object `{}` returns key count 0, depth 1
- Empty array `[]` returns key count 0, depth 1

#### `syntax-highlight.test.ts`

- Tokenizes string values with correct `string` type
- Tokenizes number values (integer, float, negative, exponent)
- Tokenizes `true`, `false`, `null` as distinct types
- Tokenizes object keys as `key` type
- Tokenizes braces, brackets, colons, commas as `punctuation`
- Full round-trip: concatenating all token texts reproduces the original string

#### `tree-builder.test.ts`

- Builds a single root node for a primitive value
- Object produces child nodes with key labels
- Array produces child nodes with index labels (`[0]`, `[1]`, ...)
- Nested structures produce correct parent-child hierarchy
- Each node includes the correct type tag (`string`, `number`, `boolean`, `null`, `object`, `array`)
- Generates correct JSON paths: `$.foo.bar[0].baz`
