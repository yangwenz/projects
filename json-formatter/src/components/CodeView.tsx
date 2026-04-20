"use client";

import { useMemo } from "react";
import { HighlightToken } from "@/lib/types";

const tokenColors: Record<HighlightToken["type"], string> = {
  key: "text-purple-700",
  string: "text-green-700",
  number: "text-blue-600",
  boolean: "text-orange-600",
  null: "text-red-500",
  punctuation: "text-zinc-500",
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
      <div className="flex flex-1 items-center justify-center text-zinc-400 text-sm">
        Output will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-auto font-mono text-sm">
      <div className="select-none bg-zinc-50 px-2 py-3 text-right text-zinc-400 leading-5">
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
