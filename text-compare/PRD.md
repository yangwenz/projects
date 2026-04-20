# Text Comparer — Product Requirements Document

## Overview

A web-based text comparison tool that provides real-time, side-by-side diffing with multiple granularity modes, file upload support, and export capabilities. Built as a single-page application with no backend dependencies.

---

## Goals

- Provide instant visual feedback on text differences without requiring a manual "Compare" action
- Support multiple diff granularity levels for different use cases
- Offer a clean, accessible interface that works across modern browsers
- Persist user preferences across sessions

---

## Features

### 1. Side-by-Side Editors

Two text editor panels displayed horizontally:

- **Left panel**: Original text
- **Right panel**: Modified text
- Both editors include:
  - Line numbers in a gutter
  - Line wrapping enabled by default
  - Monospace font for alignment
  - Placeholder text indicating purpose ("Paste original text here…" / "Paste modified text here…")

### 2. Real-Time Diffing

- Diff computation triggers automatically as the user types (debounced ~300ms)
- No "Compare" button — results update live
- Efficient diffing algorithm that handles large texts without blocking the UI (web worker if needed)

### 3. Diff Granularity Modes

Toggle between three levels via a segmented control:

| Mode | Description |
|------|-------------|
| **Line** | Compares full lines; highlights entire lines that differ |
| **Word** | Compares word-by-word within changed lines |
| **Character** | Compares character-by-character within changed lines |

Default mode: **Word**

### 4. Color-Coded Diff View

A unified or side-by-side diff output area below or overlaid on the editors:

| Color | Meaning |
|-------|---------|
| Green (background) | Added content |
| Red (background) | Removed content |
| Yellow (background) | Modified content (word/char level changes within a line) |

- Colors must meet WCAG AA contrast requirements
- Optional dark mode support (future consideration)

### 5. Synced Scrolling

- Both editor panels scroll together vertically
- Scroll sync can be toggled on/off via a button/icon
- Default: enabled

### 6. Change Navigation

- **Previous** / **Next** buttons to jump between differences
- Counter display showing current position: e.g., "3 / 7"
- Keyboard shortcuts: `Alt+Up` (previous), `Alt+Down` (next)
- Current change is highlighted with a stronger border or outline

### 7. Swap and Clear Operations

- **Swap**: Exchanges content between left and right editors (button with swap icon)
- **Clear**: Clears both editors and resets diff state (with confirmation if content exists)

### 8. File Upload

Support loading files into either editor panel:

- **Button**: "Upload" button on each panel header
- **Drag-and-drop**: Drop zone on each panel
- Supported file types: `.txt`, `.json`, `.xml`, `.csv`, `.md`, `.log`, `.yaml`, `.yml`, `.html`, `.css`, `.js`, `.ts`
- Max file size: 5 MB
- Show filename after upload
- Error handling for unsupported types or oversized files

### 9. Export

Export the diff result in multiple formats:

| Action | Output |
|--------|--------|
| **Copy to clipboard** | Plain-text unified diff |
| **Download as .diff** | Standard unified diff format |
| **Download as .txt** | Plain-text diff with +/- markers |
| **Download as .html** | Styled HTML with color-coded diff |

Export button with dropdown menu for format selection.

### 10. Settings

Persisted via `localStorage`. Accessible via a gear icon / settings panel:

| Setting | Default | Description |
|---------|---------|-------------|
| Ignore case | Off | Treat uppercase/lowercase as equal |
| Ignore whitespace | Off | Ignore leading/trailing/extra whitespace |
| Ignore empty lines | Off | Skip blank lines in comparison |
| Show whitespace characters | Off | Render spaces (·), tabs (→), newlines (¶) |

Settings changes trigger an immediate re-diff.

### 11. Statistics

Displayed in a stats bar (below the editors or in a footer):

- **Additions**: Number of added lines/words/chars (depending on mode)
- **Deletions**: Number of removed lines/words/chars
- **Modifications**: Number of modified lines
- **Line counts**: Total lines in each editor
- **Status message**: e.g., "Texts are identical", "4 differences found", "Comparing…"

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: Title | Granularity Toggle | Settings | Export  │
├────────────────────────┬────────────────────────────────┤
│  Original Editor       │  Modified Editor               │
│  [Upload] [Clear]      │  [Upload] [Clear]              │
│                        │                                │
│  (line numbers)        │  (line numbers)                │
│  (editable text area)  │  (editable text area)          │
│                        │                                │
├────────────────────────┴────────────────────────────────┤
│  Navigation: [◀ Prev] [3 / 7] [Next ▶]  |  [Swap]     │
├─────────────────────────────────────────────────────────┤
│  Stats: +12 added | -3 removed | ~5 modified | 45 lines │
└─────────────────────────────────────────────────────────┘
```

---

## Technical Constraints

- **Framework**: Next.js (as per project setup)
- **Diff library**: Use `diff` (npm) or equivalent for computing diffs
- **No backend**: All processing happens client-side
- **Performance**: Handle files up to 5 MB / ~100k lines without freezing the UI
- **Browser support**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Responsive**: Functional on tablet-width screens; editors stack vertically on mobile

---

## Non-Goals (Out of Scope)

- Syntax highlighting for code
- Three-way merge
- Collaborative editing
- File versioning or history
- Backend storage or user accounts
