export type DiffMode = "line" | "word" | "character";

export interface DiffOptions {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  ignoreEmptyLines: boolean;
}

export interface DiffSegment {
  value: string;
  type: "equal" | "added" | "removed" | "modified";
}

export interface DiffChunk {
  leftLineStart: number;
  leftLineCount: number;
  rightLineStart: number;
  rightLineCount: number;
  segments: DiffSegment[];
}

export interface DiffRequest {
  id: number;
  leftText: string;
  rightText: string;
  mode: DiffMode;
  options: DiffOptions;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
}

export interface DiffResponse {
  id: number;
  chunks: DiffChunk[];
  stats: DiffStats;
}

export interface DiffError {
  id: number;
  error: string;
}

export type WorkerIncoming = DiffRequest;
export type WorkerOutgoing = DiffResponse | DiffError;

export interface Settings {
  ignoreCase: boolean;
  ignoreWhitespace: boolean;
  ignoreEmptyLines: boolean;
  showWhitespace: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  ignoreCase: false,
  ignoreWhitespace: false,
  ignoreEmptyLines: false,
  showWhitespace: false,
};
