"use client";

import { Stats, ValidationResult, MinifyResult } from "@/lib/types";

interface StatusBarProps {
  validation: ValidationResult | null;
  stats: Stats | null;
  minifyResult: MinifyResult | null;
  hasInput: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StatusBar({
  validation,
  stats,
  minifyResult,
  hasInput,
}: StatusBarProps) {
  const isValid = validation?.valid === true;

  return (
    <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        {!hasInput ? (
          <span className="text-zinc-400">Enter JSON to validate</span>
        ) : isValid ? (
          <>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-green-700">Valid JSON</span>
          </>
        ) : validation ? (
          <>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-red-600">
              Error at line {validation.valid === false ? validation.line : ""}:
              {validation.valid === false ? validation.column : ""}{" "}
              {validation.valid === false ? `— ${validation.message}` : ""}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-1 text-zinc-500">
        {stats && isValid ? (
          <>
            <span>
              {minifyResult
                ? `${formatSize(minifyResult.originalSize)} → ${formatSize(minifyResult.minifiedSize)}`
                : formatSize(stats.byteSize)}
            </span>
            <span>·</span>
            <span>{stats.lineCount} lines</span>
            <span>·</span>
            <span>{stats.keyCount} keys</span>
            <span>·</span>
            <span>depth {stats.maxDepth}</span>
          </>
        ) : (
          <span>— · — · — · —</span>
        )}
      </div>
    </div>
  );
}
