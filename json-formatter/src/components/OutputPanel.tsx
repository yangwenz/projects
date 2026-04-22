"use client";

import { useState } from "react";
import { HighlightToken } from "@/lib/types";
import CodeView from "./CodeView";
import TreeView from "./TreeView";

type ViewTab = "code" | "tree";

interface OutputPanelProps {
  tokens: HighlightToken[];
  parsed: unknown;
  minifiedOutput: string | null;
  onCopyPath: (path: string) => void;
}

export default function OutputPanel({
  tokens,
  parsed,
  minifiedOutput,
  onCopyPath,
}: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>("code");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center border-b border-zinc-200 bg-zinc-50/80 px-3 dark:border-zinc-800 dark:bg-zinc-900/50">
        <button
          onClick={() => setActiveTab("code")}
          className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "code"
              ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Code View
        </button>
        <button
          onClick={() => setActiveTab("tree")}
          className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "tree"
              ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
              : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Tree View
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "code" ? (
          minifiedOutput ? (
            <pre className="flex-1 overflow-auto bg-white p-3 font-mono text-sm leading-5 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {minifiedOutput}
            </pre>
          ) : (
            <CodeView tokens={tokens} />
          )
        ) : (
          <TreeView parsed={parsed} onCopyPath={onCopyPath} />
        )}
      </div>
    </div>
  );
}
