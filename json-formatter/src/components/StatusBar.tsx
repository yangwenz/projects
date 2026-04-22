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
    <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50/80 px-5 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-2">
        {!hasInput ? (
          <span className="text-zinc-400 dark:text-zinc-600">
            Enter JSON to validate
          </span>
        ) : isValid ? (
          <>
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_rgb(34_197_94/0.4)]" />
            <span className="text-green-700 dark:text-green-400">
              Valid JSON
            </span>
          </>
        ) : validation ? (
          <>
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_rgb(239_68_68/0.4)]" />
            <span className="text-red-600 dark:text-red-400">
              Error at line {validation.valid === false ? validation.line : ""}:
              {validation.valid === false ? validation.column : ""}{" "}
              {validation.valid === false ? `— ${validation.message}` : ""}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        {stats && isValid ? (
          <>
            <span>
              {minifyResult
                ? `${formatSize(minifyResult.originalSize)} → ${formatSize(minifyResult.minifiedSize)}`
                : formatSize(stats.byteSize)}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{stats.lineCount} lines</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>{stats.keyCount} keys</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>depth {stats.maxDepth}</span>
          </>
        ) : (
          <span className="text-zinc-300 dark:text-zinc-700">
            — · — · — · —
          </span>
        )}
      </div>
    </div>
  );
}
