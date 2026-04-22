# Projects

Tutorial projects for [WiseBuilder](https://wisebuilder.dev). Each project is a standalone client-side Next.js 16 app with React 19, TypeScript, and Tailwind CSS v4.

## Apps

### [JSON Formatter](json-formatter/)

A browser-based tool for formatting, validating, minifying, and exploring JSON data. Features syntax-highlighted code view, collapsible tree view with click-to-copy JSON paths, and real-time validation with error reporting. All processing happens client-side via a Web Worker.

### [Text Comparer](text-compare/)

A real-time side-by-side text comparison tool. Supports line, word, and character-level diffing with synchronized scrolling, change navigation, and export to `.diff`, `.txt`, or `.html`. Diff computation runs off the main thread in a Web Worker.

## Getting Started

Each project is independent. To run one:

```bash
cd <project-dir>
npm install
npm run dev
```
