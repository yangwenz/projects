# Text Comparer — Technical Design

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js App Shell                     │
│                   (App Router, SSR=off)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────┐   ┌──────────────┐   ┌─────────────┐  │
│  │  EditorPanel  │   │   Toolbar    │   │ EditorPanel │  │
│  │   (Left)      │   │  (controls)  │   │  (Right)    │  │
│  └───────┬───────┘   └──────┬───────┘   └─────┬───────┘  │
│          │                  │                 │          │
│          └───────────┬──────┘─────────────────┘          │
│                      │                                   │
│              ┌───────▼────────┐                          │
│              │  DiffProvider  │  (React Context)         │
│              └───────┬────────┘                          │
│                      │ postMessage                       │
├──────────────────────┼───────────────────────────────────┤
│              ┌───────▼────────┐                          │
│              │   Web Worker   │  (diff computation)      │
│              └────────────────┘                          │
└──────────────────────────────────────────────────────────┘
```

**Modules:**

| Module | Responsibility |
|--------|---------------|
| `DiffProvider` | Holds editor content, diff results, settings, mode, and navigation state (current change index, total change count). Dispatches work to the Web Worker. Exposes state and navigation actions (`goToNext`, `goToPrev`) via context. |
| `EditorPanel` | Textarea with line numbers, inline diff highlights, file upload drop zone. |
| `Toolbar` | Granularity toggle, navigation buttons, swap/clear, export dropdown, settings popover. |
| `Web Worker` | Receives text pairs + options, runs the diff algorithm, posts results back. Validates input size limits. |
| `ScrollSync` | Coordinates scroll positions between the two panels using a line-offset mapping derived from alignment anchors. |
| `export` | Generates unified diff, .txt, and .html exports from diff results (pure functions in `src/lib/export.ts`). |

---

## UI Design

### Layout

```
┌───────────────────────────────────────────────────────┐
│  [Logo]   [Line|Word|Char]   [⇄ Swap] [✕ Clear]       │
│           [◀ Prev] 3/7 [Next ▶]   [Export ▾] [⚙]      │
├───────────────────────────────────────────────────────┤
│  ⚠ Warning banner (shown when input exceeds limits)   │
├──────────────────────────┬────────────────────────────┤
│  ┌─── Original ────────┐ │ ┌─── Modified ───────────┐ │
│  │ [Upload] filename   │ │ │ [Upload] filename      │ │
│  ├─────────────────────┤ │ ├────────────────────────┤ │
│  │ 1 │ unchanged line  │ │ │ 1 │ unchanged line     │ │
│  │ 2 │▓removed text▓   │ │ │ 2 │▒added text▒        │ │
│  │ 3 │ some ▓old▓ word │ │ │ 3 │ some ▒new▒ word    │ │
│  │ 4 │ unchanged       │ │ │ 4 │▒inserted line▒     │ │
│  │   │                 │ │ │ 5 │ unchanged          │ │
│  └─────────────────────┘ │ └────────────────────────┘ │
├──────────────────────────┴────────────────────────────┤
│  +3 additions  -1 deletion  ~2 modifications  │ 12L   │
└───────────────────────────────────────────────────────┘
```

The warning banner is hidden by default and only appears when the worker returns a `DiffError` (e.g., input exceeds 5 MB or 100k lines). It displays the error message with a dismiss button.

### Inline Diff Highlighting

Each `EditorPanel` renders its content as a list of line elements. Highlighting is applied via `<span>` elements with background classes:

- **Line mode**: Entire line gets `bg-diff-added` or `bg-diff-removed`. Each chunk segment has type `"added"`, `"removed"`, or `"equal"` — one segment per line.
- **Word/Char mode**: The line is split into fine-grained segments. Each segment is wrapped in a span: unchanged (`"equal"`, no class), added (`"added"`, `bg-diff-added`), removed (`"removed"`, `bg-diff-removed`), or modified (`"modified"`, `bg-diff-modified` — yellow background for content that changed between sides).

The left panel renders `"removed"` and `"modified"` highlights; the right panel renders `"added"` and `"modified"` highlights. `"equal"` segments render unstyled on both sides.

### Interactions

- **Typing** → debounced diff trigger (300ms)
- **Granularity toggle** → triggers a full re-compute via the worker (each mode calls a different diff algorithm: `diffLines`, `diffWords`, `diffChars`)
- **Nav buttons** → scroll both panels to center the target diff chunk, apply a highlight ring
- **Swap** → swap left/right text, re-diff
- **Clear** → empty both, show undo toast (5s timer, stores previous content in ref)
- **File drop/upload** → read via FileReader, validate type/size, populate panel

---

## File Structure

```
text-compare/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout, font loading, metadata
│   │   ├── page.tsx                # Main page — renders CompareView
│   │   └── globals.css             # Tailwind base + diff color tokens
│   ├── components/
│   │   ├── CompareView.tsx         # Top-level orchestrator (client component)
│   │   ├── EditorPanel.tsx         # Single editor panel (textarea + overlay)
│   │   ├── DiffLine.tsx            # Single rendered line with highlight spans
│   │   ├── Toolbar.tsx             # Controls bar (mode, nav, actions)
│   │   ├── ExportMenu.tsx          # Export dropdown
│   │   ├── SettingsPopover.tsx     # Settings panel
│   │   ├── StatsBar.tsx            # Footer statistics
│   │   ├── WarningBanner.tsx       # Inline error/warning display
│   │   └── UndoToast.tsx           # Clear undo notification
│   ├── context/
│   │   └── DiffContext.tsx         # DiffProvider + useDiff hook
│   ├── workers/
│   │   └── diff.worker.ts          # Web Worker entry point
│   ├── lib/
│   │   ├── diff-computation.ts     # Pure diff logic (called by worker, independently testable)
│   │   ├── diff-protocol.ts        # Message types for worker communication
│   │   ├── scroll-sync.ts          # Scroll synchronization logic (exports mapScrollPosition, findEnclosingAnchor)
│   │   ├── export.ts               # Export format generators (functions, not a class)
│   │   ├── file-upload.ts          # File validation and reading
│   │   └── settings.ts             # localStorage persistence helpers
│   └── types/
│       └── diff.ts                 # Shared type definitions
├── __tests__/
│   ├── lib/
│   │   ├── diff-computation.test.ts
│   │   ├── scroll-sync.test.ts
│   │   ├── export.test.ts
│   │   ├── file-upload.test.ts
│   │   └── settings.test.ts
│   └── workers/
│       └── diff.worker.test.ts
├── public/
│   └── ...
├── jest.config.ts
├── next.config.ts
├── tsconfig.json              # paths: { "@/*": ["./src/*"] }
├── tailwind.config.ts
└── package.json
```

---

## Web Worker Design

### Why a Worker

The `diff` library's algorithm is O(n*d) where d is the edit distance. For large files (~100k lines) this can take hundreds of milliseconds — enough to drop frames. Offloading to a worker keeps the main thread free for typing and scrolling.

### Message Protocol

```typescript
// src/lib/diff-protocol.ts

type DiffMode = "line" | "word" | "character";

interface DiffRequest {
  id: number;               // monotonically increasing, for stale-result rejection
  leftText: string;
  rightText: string;
  mode: DiffMode;
  options: {
    ignoreCase: boolean;
    ignoreWhitespace: boolean;
    ignoreEmptyLines: boolean;
  };
}

interface DiffSegment {
  value: string;
  type: "equal" | "added" | "removed" | "modified";
}

interface DiffChunk {
  leftLineStart: number;
  leftLineCount: number;
  rightLineStart: number;
  rightLineCount: number;
  // In Line mode: one segment per line (type is "added", "removed", or "equal")
  // In Word/Char mode: fine-grained segments within the chunk.
  //   "modified" marks content that changed between sides (adjacent remove+add
  //   pairs are merged into a single "modified" segment for each side).
  segments: DiffSegment[];
}

interface DiffResponse {
  id: number;               // matches request id
  chunks: DiffChunk[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

interface DiffError {
  id: number;
  error: string;
}

type WorkerIncoming = DiffRequest;
type WorkerOutgoing = DiffResponse | DiffError;
```

### Input Validation & Error Handling

Before computing the diff, the worker validates the input:

1. **Size check**: If either `leftText.length` or `rightText.length` exceeds `5 * 1024 * 1024` (5 MB per side), post a `DiffError` with message "Input exceeds 5 MB limit". This matches the per-file upload limit enforced by `file-upload.ts`, ensuring consistency whether text is typed or uploaded.
2. **Line count check**: If either text exceeds 100,000 lines, post a `DiffError` with message "Input exceeds 100,000 line limit".

On the main thread, `DiffProvider` handles `DiffError` responses by setting an `error` state. The `WarningBanner` component renders above the editor panels when this state is non-null, showing the error message with a dismiss action.

### Mode-Specific Algorithm Calls

Each mode invokes a different function from the `diff` library:

| Mode | Function | Granularity |
|------|----------|-------------|
| Line | `diffLines()` | Full lines |
| Word | `diffWords()` | Whitespace-delimited tokens |
| Character | `diffChars()` | Individual characters |

Switching between any two modes always triggers a new `DiffRequest` to the worker since the underlying algorithm and output differ.

### Debouncing & Stale Rejection

Debouncing lives in `DiffProvider`, not the worker:

1. User types → state updates immediately (controlled textarea).
2. A 300ms debounce timer resets on each keystroke.
3. When the timer fires, `DiffProvider` increments a request counter and posts a `DiffRequest` to the worker.
4. The worker computes the diff and posts back the `DiffResponse` with the same `id`.
5. `DiffProvider` ignores any response whose `id` < the latest sent `id` (stale result from a previous, slower computation).

If a new request arrives while the worker is busy, the worker finishes the current job and immediately starts the new one. Since we use stale rejection, there's no need for cancellation — the outdated result is simply discarded.

### Worker Lifecycle

- Created once on mount via `new Worker(new URL('../workers/diff.worker.ts', import.meta.url))`.
- Terminated on unmount (cleanup in useEffect).
- No shared memory — communication is pure message passing (structured clone).
- The worker's `onmessage` handler validates input, then delegates to `computeDiff()` from `src/lib/diff-computation.ts`. This keeps the pure diff logic independently importable and testable without a worker environment.

---

## Scroll Sync Strategy

### Problem

When one side has insertions the other doesn't, line numbers diverge. Naive pixel-based scroll sync causes misalignment — matching content drifts apart.

### Solution: Line-Offset Mapping from Alignment Anchors

**Step 1 — Build alignment anchors from diff chunks:**

Each `DiffChunk` defines a correspondence between line ranges on both sides. From the chunks we derive an ordered list of alignment anchors:

```typescript
interface AlignmentAnchor {
  leftLine: number;   // line index in left panel
  rightLine: number;  // corresponding line index in right panel
}
```

Equal regions produce 1:1 anchors (one per line). Change regions produce a single anchor at their start, mapping the first line of the left range to the first line of the right range.

**Step 2 — Build a cumulative offset table:**

Since line wrapping is enabled by default, lines may have variable rendered heights. Each panel maintains a `lineOffsets: number[]` array where `lineOffsets[i]` is the pixel offset of line `i` from the top of the panel (measured from DOM elements via `offsetTop`). This table is recomputed when content or container width changes (debounced via ResizeObserver).

From the anchors and offset tables, build a mapping function:

```typescript
function mapScrollPosition(
  sourceScrollTop: number,
  sourceSide: "left" | "right",
  anchors: AlignmentAnchor[],
  leftOffsets: number[],
  rightOffsets: number[]
): number {
  const sourceOffsets = sourceSide === "left" ? leftOffsets : rightOffsets;
  const targetOffsets = sourceSide === "left" ? rightOffsets : leftOffsets;

  // Binary search to find the source line at this scroll position
  const sourceLine = findLineAtOffset(sourceOffsets, sourceScrollTop);

  // Find the enclosing anchor to determine the corresponding target line
  const anchor = findEnclosingAnchor(anchors, sourceSide, sourceLine);
  const targetLine = sourceSide === "left"
    ? anchor.rightLine + (sourceLine - anchor.leftLine)
    : anchor.leftLine + (sourceLine - anchor.rightLine);

  // Map sub-line pixel offset (for partial scroll within a wrapped line)
  const sourceLineTop = sourceOffsets[sourceLine] ?? 0;
  const pixelWithinLine = sourceScrollTop - sourceLineTop;
  const targetLineTop = targetOffsets[targetLine] ?? 0;

  return targetLineTop + pixelWithinLine;
}
```

This handles line wrapping naturally: even if one side wraps a line to 3 visual rows while the other doesn't, the offset tables reflect the actual rendered height.

**Step 3 — Apply on scroll events:**

```typescript
function handleScroll(source: "left" | "right", scrollTop: number) {
  if (!syncEnabled) return;
  const targetScrollTop = mapScrollPosition(scrollTop, source, anchors, lineHeight);
  const target = source === "left" ? rightPanel : leftPanel;
  target.scrollTop = targetScrollTop;
}
```

A guard flag prevents infinite scroll loops (panel A scrolls → sets panel B → B's event fires → guard blocks re-setting A).

All pure functions (`mapScrollPosition`, `findEnclosingAnchor`, `findLineAtOffset`) are exported from `src/lib/scroll-sync.ts` for direct unit testing.

**Step 4 — Toggle:**

Users can disable sync via a toggle button. When disabled, panels scroll independently. Re-enabling snaps the inactive panel to match the active panel's mapped position.

### Performance Considerations

- The alignment anchor list is recomputed only when diff results change, not on every scroll event.
- `lineOffsets` tables are rebuilt on content change and container resize (debounced 100ms via ResizeObserver). Not rebuilt on every scroll.
- `findEnclosingAnchor` and `findLineAtOffset` use binary search — O(log n) per scroll event.
- Scroll handlers use `requestAnimationFrame` to coalesce rapid events.

---

## Testing

### Framework

**Jest** with `ts-jest` for TypeScript transformation. Tests live in `__tests__/` at the project root, mirroring the `src/` structure they cover.

### Configuration

```typescript
// jest.config.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/__tests__"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default config;
```

### Test Coverage

#### `__tests__/lib/diff-computation.test.ts`

Tests the pure `computeDiff()` function exported from `src/lib/diff-computation.ts`:

| Case | Description |
|------|-------------|
| Identical inputs | Returns zero chunks, stats all zero |
| Single line added | One chunk with `rightLineCount=1`, `leftLineCount=0` |
| Single line removed | One chunk with `leftLineCount=1`, `rightLineCount=0` |
| Word-level diff | Segments within a chunk reflect word boundaries |
| Character-level diff | Segments reflect individual character changes |
| `ignoreCase` option | "Hello" vs "hello" treated as equal |
| `ignoreWhitespace` option | Leading/trailing spaces ignored |
| `ignoreEmptyLines` option | Blank lines skipped in comparison |
| Input exceeding 5 MB | Returns a `DiffError` with size limit message |
| Input exceeding 100k lines | Returns a `DiffError` with line limit message |

#### `__tests__/lib/export.test.ts`

Tests export format generators:

| Case | Description |
|------|-------------|
| Unified diff format | Output matches standard unified diff with `---`/`+++` headers and `@@` hunks |
| Plain text with markers | Added lines prefixed `+`, removed prefixed `-` |
| HTML export | Contains styled `<span>` elements with correct class names |
| Empty diff (identical) | Produces minimal output indicating no differences |
| Multi-chunk diff | Hunks are ordered and separated correctly |

#### `__tests__/lib/scroll-sync.test.ts`

Tests `mapScrollPosition`, `findEnclosingAnchor`, and `findLineAtOffset`:

| Case | Description |
|------|-------------|
| No diff (1:1 mapping) | Returns same scrollTop for both sides |
| Insertion on right | Left scroll maps to offset position on right accounting for inserted lines |
| Deletion on left | Right scroll maps backward to correct left position |
| Multiple anchors | Binary search finds correct enclosing region |
| Scroll at exact anchor boundary | No off-by-one; maps to precise target line |
| Empty anchor list | Returns input scrollTop unchanged |
| Variable line heights (wrapping) | Correctly maps when offset tables have non-uniform spacing |
| `findLineAtOffset` edge cases | Returns 0 for scrollTop=0, last line for scrollTop beyond content |

#### `__tests__/lib/file-upload.test.ts`

Tests file validation logic:

| Case | Description |
|------|-------------|
| Valid `.txt` file under 5 MB | Accepted |
| Valid `.json`, `.md`, `.ts`, etc. | All supported extensions accepted |
| Unsupported extension (`.exe`) | Rejected with error message |
| File exceeding 5 MB | Rejected with size error |
| File with no extension | Rejected |
| Empty file | Accepted (valid edge case) |

#### `__tests__/lib/settings.test.ts`

Tests localStorage persistence helpers (uses a mock `localStorage`):

| Case | Description |
|------|-------------|
| Save and load settings | Round-trips all setting fields correctly |
| Missing localStorage key | Returns default settings |
| Corrupted JSON in storage | Returns default settings, does not throw |
| Partial settings object | Merges with defaults for missing fields |
| Each setting toggle | Individual fields persist independently |

#### `__tests__/workers/diff.worker.test.ts`

Tests the worker's message handling layer (worker instantiated directly, not via `postMessage` in a browser):

| Case | Description |
|------|-------------|
| Valid request → response | Posts back `DiffResponse` with matching `id` |
| Oversized input | Posts back `DiffError` without attempting computation |
| Mode switching | Different modes produce structurally different segment outputs |

### Running Tests

```bash
npm test              # run all tests
npm test -- --watch   # watch mode during development
npm test -- --coverage # generate coverage report
```
