export type IndentOption = 2 | 4 | "tab";
export type SortKeysOption = "off" | "asc" | "desc";

export interface Settings {
  indent: IndentOption;
  sortKeys: SortKeysOption;
  autoFormatOnPaste: boolean;
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; line: number; column: number; message: string };

export type HighlightToken = {
  text: string;
  type: "key" | "string" | "number" | "boolean" | "null" | "punctuation";
};

export interface Stats {
  byteSize: number;
  lineCount: number;
  keyCount: number;
  maxDepth: number;
}

export interface FormatResult {
  formatted: string;
  tokens: HighlightToken[];
  parsed: unknown;
  validation: ValidationResult;
  stats: Stats;
}

export interface MinifyResult {
  minified: string;
  originalSize: number;
  minifiedSize: number;
}

export type WorkerRequest =
  | {
      id: string;
      type: "format";
      payload: { input: string; indent: IndentOption; sortKeys: SortKeysOption };
    }
  | { id: string; type: "minify"; payload: { input: string } };

export type WorkerResponse =
  | { id: string; type: "format"; result: FormatResult }
  | { id: string; type: "minify"; result: MinifyResult }
  | { id: string; type: "error"; error: string };

export interface TreeNode {
  key: string;
  path: string;
  type: "string" | "number" | "boolean" | "null" | "object" | "array";
  value?: unknown;
  children?: TreeNode[];
}
