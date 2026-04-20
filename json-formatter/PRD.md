# JSON Formatter - Product Requirements Document

## Overview

JSON Formatter is a client-side web tool for formatting, minifying, validating, and exploring JSON data. It runs entirely in the browser with no server-side processing, ensuring privacy and zero-latency operations.

## Goals

- Provide a fast, intuitive interface for working with JSON data
- Support common JSON operations: format, minify, validate, explore
- Work entirely client-side with no data sent to any server
- Handle large JSON files (up to 10 MB) without freezing the UI

## Target Users

- Software developers debugging API responses
- QA engineers inspecting test data
- Data analysts exploring JSON datasets
- Anyone who needs to quickly format or validate JSON

---

## Functional Requirements

### FR-1: JSON Formatting

- **FR-1.1** Format JSON with configurable indentation (2 spaces, 4 spaces, tab)
- **FR-1.2** Optionally sort object keys alphabetically (ascending/descending)
- **FR-1.3** Preserve valid JSON data types (strings, numbers, booleans, null, arrays, objects)
- **FR-1.4** Display formatted output in real time as the user types or pastes

### FR-2: JSON Minification

- **FR-2.1** Remove all unnecessary whitespace, newlines, and indentation from JSON
- **FR-2.2** One-click minify button that replaces the output with the minified result
- **FR-2.3** Show the size reduction (original vs. minified byte count)

### FR-3: JSON Validation

- **FR-3.1** Validate JSON in real time as the user types
- **FR-3.2** Display error messages with precise line and column numbers
- **FR-3.3** Highlight the error location in the input editor
- **FR-3.4** Show a clear success indicator when the JSON is valid
- **FR-3.5** Debounce validation (300ms) to avoid excessive computation while typing

### FR-4: Tree View

- **FR-4.1** Render a navigable tree representation of the parsed JSON
- **FR-4.2** Collapsible/expandable nodes for objects and arrays
- **FR-4.3** Expand All / Collapse All controls
- **FR-4.4** Display data type indicators (string, number, boolean, null, object, array) with distinct visual styling
- **FR-4.5** Show array indices and object keys as node labels
- **FR-4.6** Click any node to copy its JSON path (e.g., `$.store.books[0].title`) to the clipboard
- **FR-4.7** Show a tooltip or toast notification confirming the path was copied
- **FR-4.8** Display value previews for leaf nodes inline

### FR-5: Code View

- **FR-5.1** Display formatted JSON with syntax highlighting
- **FR-5.2** Color-code by type: strings, numbers, booleans, null values, keys, punctuation
- **FR-5.3** Show line numbers in the gutter
- **FR-5.4** Support toggling between Tree View and Code View

### FR-6: Input/Output Operations

- **FR-6.1** Accept JSON input via a text editor area
- **FR-6.2** Support file upload (`.json` files) via a file picker and drag-and-drop
- **FR-6.3** Copy formatted/minified output to clipboard with a single click
- **FR-6.4** Download output as a `.json` file with a configurable filename
- **FR-6.5** Clear button to reset all input and output
- **FR-6.6** Paste detection with optional auto-format (see FR-7.3)

### FR-7: Settings Panel

- **FR-7.1** Indent size selector: 2 spaces (default), 4 spaces, tab
- **FR-7.2** Key sorting toggle: off (default), ascending, descending
- **FR-7.3** Auto-format on paste toggle (default: on)
- **FR-7.4** Persist settings in `localStorage` across sessions
- **FR-7.5** Settings accessible via a gear icon that opens a panel/drawer

### FR-8: Statistics

- **FR-8.1** File size (raw byte count, displayed in human-readable format: B, KB, MB)
- **FR-8.2** Line count (of the formatted output)
- **FR-8.3** Total key count (number of unique keys across all objects)
- **FR-8.4** Maximum nesting depth
- **FR-8.5** Display stats in a collapsible panel below the output area
- **FR-8.6** Update stats in real time as JSON changes

---

## Non-Functional Requirements

### NFR-1: Performance

- Format/minify operations must complete in under 200ms for files up to 1 MB
- Tree view must render in under 500ms for files up to 1 MB
- For files over 1 MB, use virtualized rendering or lazy loading to maintain responsiveness
- UI must remain responsive (no frame drops) during all operations

### NFR-2: Browser Support

- Chrome, Firefox, Safari, Edge (latest two major versions)
- Responsive layout: desktop (1024px+), tablet (768px-1023px), mobile (320px-767px)

### NFR-3: Privacy

- All processing happens client-side; no data is sent to any server
- No analytics or tracking without explicit user consent
- No cookies except for persisting user settings in `localStorage`

---

## User Flows

### Flow 1: Paste and Format

1. User pastes JSON into the input panel
2. If auto-format is enabled, JSON is automatically formatted in the output panel
3. If JSON is invalid, an error message appears with line/column info
4. If valid, the Tree View or Code View renders the formatted result
5. Stats update in real time

### Flow 2: Upload and Explore

1. User clicks Upload or drags a `.json` file onto the input panel
2. File contents load into the input editor
3. JSON is validated and formatted automatically
4. User switches to Tree View to explore the structure
5. User clicks a node to copy its path

### Flow 3: Format and Download

1. User pastes or uploads JSON
2. User adjusts settings (indent size, key sorting)
3. User clicks Format
4. User clicks Download to save the formatted file

---

## Success Metrics

- Format operation completes in under 200ms for 95% of inputs under 1 MB
- Zero data leaves the browser (verifiable via network tab)
- User can complete paste-format-copy workflow in under 5 seconds
