"use client";

import { useMemo } from "react";
import { HighlightToken } from "@/lib/types";

const tokenColors: Record<HighlightToken["type"], string> = {
  key: "text-purple-700 dark:text-purple-400",
  string: "text-green-700 dark:text-green-400",
  number: "text-blue-600 dark:text-blue-400",
  boolean: "text-orange-600 dark:text-orange-400",
  null: "text-red-500 dark:text-red-400",
  punctuation: "text-zinc-500 dark:text-zinc-500",
};

interface CodeViewProps {
  tokens: HighlightToken[];
}

export default function CodeView({ tokens }: CodeViewProps) {
  const lines = useMemo(() => {
    const result: HighlightToken[][] = [[]];
    for (const token of tokens) {
      const parts = token.text.split("\n");
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) result.push([]);
        if (parts[i]) {
          result[result.length - 1].push({ text: parts[i], type: token.type });
        }
      }
    }
    return result;
  }, [tokens]);

  if (tokens.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-zinc-400 dark:text-zinc-600">
        Output will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto bg-white font-mono text-sm dark:bg-zinc-900">
      <div className="select-none border-r border-zinc-100 bg-zinc-50/50 px-2 py-3 text-right text-zinc-400 leading-5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-600">
        {lines.map((_, i) => (
          <div key={i} className="px-1">
            {i + 1}
          </div>
        ))}
      </div>
      <pre className="flex-1 overflow-x-auto p-3 leading-5">
        {lines.map((lineTokens, lineIdx) => (
          <div key={lineIdx}>
            {lineTokens.length === 0 ? (
              "\n"
            ) : (
              lineTokens.map((t, tIdx) => (
                <span key={tIdx} className={tokenColors[t.type]}>
                  {t.text}
                </span>
              ))
            )}
          </div>
        ))}
      </pre>
    </div>
  );
}
