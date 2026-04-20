# Text Comparer — Technical Design

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js App Shell                     │
│                   (App Router, SSR=off)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────┐   ┌──────────────┐   ┌────────────┐   │
│  │  EditorPanel  │   │   Toolbar    │   │ EditorPanel│   │
│  │   (Left)      │   │  (controls)  │   │  (Right)   │   │
│  └───────┬───────┘   └──────┬───────┘   └─────┬──────┘   │
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
| `DiffProvider` | Holds editor content, diff results, settings, and mode. Dispatches work to the Web Worker. Exposes state via context. |
| `EditorPanel` | Textarea with line numbers, inline diff highlights, file upload drop zone. |
| `Toolbar` | Granularity toggle, navigation buttons, swap/clear, export dropdown, settings popover. |
| `Web Worker` | Receives text pairs + options, runs the diff algorithm, posts results back. |
| `ScrollSync` | Coordinates scroll positions between the two panels using diff chunk mapping. |
| `ExportService` | Generates unified diff, .txt, and .html exports from diff results. |

---

## UI Design

### Layout

```
┌───────────────────────────────────────────────────────┐
│  [Logo]   [Line|Word|Char]   [⇄ Swap] [✕ Clear]       │
│           [◀ Prev] 3/7 [Next ▶]   [Export ▾] [⚙]      │
├──────────────────────────┬────────────────────────────┤
│  ┌─── Original ────────┐ │ ┌─── Modified ───────────┐ │
│  │ [Upload] filename   │ │ │ [Upload] filename      │ │
│  ├─────────────────────┤ │ ├────────────────────────┤ │
│  │ 1 │ unchanged line  │ │ │ 1 │ unchanged line     │ │
│  │ 2 │▓removed text▓   │ │ │ 2 │▒added text▒        │ │
│  │ 3 │ some ▓old▓ word │ │ │ 3 │ some ▒new▒ word    │ │
│  │   │ (padding line)  │ │ │ 4 │▒inserted line▒     │ │
│  │ 4 │ unchanged       │ │ │ 5 │ unchanged          │ │
│  └─────────────────────┘ │ └────────────────────────┘ │
├──────────────────────────┴────────────────────────────┤
│  +3 additions  -1 deletion  ~2 modifications  │ 12L   │
└───────────────────────────────────────────────────────┘
```

### Inline Diff Highlighting

Each `EditorPanel` renders its content as a list of line elements. Highlighting is applied via `<span>` elements with background classes:

- **Line mode**: Entire line gets `bg-diff-added` or `bg-diff-removed`.
- **Word/Char mode**: The line is split into segments. Each segment is wrapped in a span: unchanged (no class), added (`bg-diff-added`), removed (`bg-diff-removed`), or modified (`bg-diff-modified`).

The left panel only shows removals/modifications; the right panel only shows additions/modifications. This keeps each side clean.

### Interactions

- **Typing** → debounced diff trigger (300ms)
- **Granularity toggle** → immediate re-render with existing diff data (Word/Char share the same diff result, just rendered differently) or re-compute if switching to/from Line mode
- **Nav buttons** → scroll both panels to center the target diff chunk, apply a highlight ring
- **Swap** → swap left/right text, re-diff
- **Clear** → empty both, show undo toast (5s timer, stores previous content in ref)
- **File drop/upload** → read via FileReader, validate type/size, populate panel

---

## File Structure

```
text-compare/
├── app/
│   ├── layout.tsx              # Root layout, font loading, metadata
│   ├── page.tsx                # Main page — renders CompareView
│   └── globals.css             # Tailwind base + diff color tokens
├── components/
│   ├── CompareView.tsx         # Top-level orchestrator (client component)
│   ├── EditorPanel.tsx         # Single editor panel (textarea + overlay)
│   ├── DiffLine.tsx            # Single rendered line with highlight spans
│   ├── Toolbar.tsx             # Controls bar (mode, nav, actions)
│   ├── ExportMenu.tsx          # Export dropdown
│   ├── SettingsPopover.tsx     # Settings panel
│   ├── StatsBar.tsx            # Footer statistics
│   └── UndoToast.tsx           # Clear undo notification
├── context/
│   └── DiffContext.tsx         # DiffProvider + useDiff hook
├── workers/
│   └── diff.worker.ts          # Web Worker entry point
├── lib/
│   ├── diff-protocol.ts        # Message types for worker communication
│   ├── scroll-sync.ts          # Scroll synchronization logic
│   ├── export.ts               # Export format generators
│   ├── file-upload.ts          # File validation and reading
│   └── settings.ts             # localStorage persistence helpers
├── types/
│   └── diff.ts                 # Shared type definitions
├── public/
│   └── ...
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## Web Worker Design

### Why a Worker

The `diff` library's algorithm is O(n*d) where d is the edit distance. For large files (~100k lines) this can take hundreds of milliseconds — enough to drop frames. Offloading to a worker keeps the main thread free for typing and scrolling.

### Message Protocol

```typescript
// diff-protocol.ts

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
  type: "equal" | "added" | "removed";
}

interface DiffChunk {
  leftLineStart: number;
  leftLineCount: number;
  rightLineStart: number;
  rightLineCount: number;
  segments: DiffSegment[];  // word/char-level breakdown within the chunk
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

---

## Scroll Sync Strategy

### Problem

When one side has insertions the other doesn't, line numbers diverge. Naive pixel-based scroll sync causes misalignment — matching content drifts apart.

### Solution: Chunk-Based Alignment with Padding Lines

**Step 1 — Build an alignment map from diff chunks:**

Each `DiffChunk` defines a correspondence between line ranges. From the chunks we derive an ordered list of "alignment anchors":

```typescript
interface AlignmentAnchor {
  leftLine: number;
  rightLine: number;
  type: "equal" | "change";
}
```

Equal regions have a 1:1 line mapping. Change regions may differ in height (e.g., 3 lines on the left, 5 on the right).

**Step 2 — Insert virtual padding lines:**

For each change chunk, the shorter side gets padding lines (empty, non-editable, visually distinct with a subtle background) to match the taller side's height. This guarantees that after padding, both panels have the same total rendered height and every equal region starts at the same vertical offset.

```
Left (original)          Right (modified)
─────────────────        ─────────────────
line 1 (equal)           line 1 (equal)
line 2 (removed)         ░░░ padding ░░░
line 3 (removed)         ░░░ padding ░░░
░░░ padding ░░░          line 2 (added)
░░░ padding ░░░          line 3 (added)
░░░ padding ░░░          line 4 (added)
line 4 (equal)           line 5 (equal)
```

**Step 3 — Synchronized scrolling:**

With padding in place, both panels have identical total height. Scroll sync becomes trivial:

```typescript
function handleScroll(source: "left" | "right", scrollTop: number) {
  if (!syncEnabled) return;
  const target = source === "left" ? rightPanel : leftPanel;
  target.scrollTop = scrollTop;
}
```

We attach `onscroll` listeners to both panels. A guard flag prevents infinite loops (panel A scrolls → sets panel B → B's scroll event fires → would set A → guard blocks it).

**Step 4 — Toggle:**

Users can disable sync via a toggle button. When disabled, panels scroll independently. Re-enabling snaps the inactive panel to match the active panel's position.

### Performance Considerations

- Padding lines are virtual (rendered via a CSS `height` spacer or minimal DOM element), not real textarea rows.
- The alignment map is recomputed only when diff results change, not on every scroll event.
- Scroll handlers use `requestAnimationFrame` to coalesce rapid events.
