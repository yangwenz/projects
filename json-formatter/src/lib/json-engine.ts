import {
  IndentOption,
  SortKeysOption,
  ValidationResult,
  Stats,
} from "./types";

export function validate(input: string): ValidationResult {
  if (input.trim() === "") {
    return { valid: false, line: 1, column: 1, message: "Empty input" };
  }
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    const msg = (e as Error).message;
    const posMatch = msg.match(/position\s+(\d+)/i);
    let line = 1;
    let column = 1;
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const before = input.slice(0, pos);
      line = (before.match(/\n/g) || []).length + 1;
      const lastNewline = before.lastIndexOf("\n");
      column = lastNewline === -1 ? pos + 1 : pos - lastNewline;
    }
    return { valid: false, line, column, message: msg };
  }
}

function sortKeysRecursive(
  value: unknown,
  direction: "asc" | "desc"
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysRecursive(item, direction));
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    if (direction === "desc") keys.reverse();
    const sorted: Record<string, unknown> = {};
    for (const key of keys) {
      sorted[key] = sortKeysRecursive(
        (value as Record<string, unknown>)[key],
        direction
      );
    }
    return sorted;
  }
  return value;
}

export function format(
  input: string,
  indent: IndentOption = 2,
  sortKeys: SortKeysOption = "off"
): string {
  let parsed = JSON.parse(input);
  if (sortKeys !== "off") {
    parsed = sortKeysRecursive(parsed, sortKeys);
  }
  const indentValue = indent === "tab" ? "\t" : indent;
  return JSON.stringify(parsed, null, indentValue);
}

export function minify(input: string): {
  minified: string;
  originalSize: number;
  minifiedSize: number;
} {
  const minified = JSON.stringify(JSON.parse(input));
  return {
    minified,
    originalSize: new Blob([input]).size,
    minifiedSize: new Blob([minified]).size,
  };
}

export function computeStats(input: string, formatted: string): Stats {
  const byteSize = new Blob([input]).size;
  const lineCount = formatted.split("\n").length;

  let keyCount = 0;
  let maxDepth = 0;

  function walk(value: unknown, depth: number) {
    if (Array.isArray(value)) {
      if (depth > maxDepth) maxDepth = depth;
      for (const item of value) {
        walk(item, depth + 1);
      }
    } else if (value !== null && typeof value === "object") {
      if (depth > maxDepth) maxDepth = depth;
      const keys = Object.keys(value as Record<string, unknown>);
      keyCount += keys.length;
      for (const key of keys) {
        walk((value as Record<string, unknown>)[key], depth + 1);
      }
    }
  }

  const parsed = JSON.parse(formatted);
  walk(parsed, 1);

  return { byteSize, lineCount, keyCount, maxDepth };
}
