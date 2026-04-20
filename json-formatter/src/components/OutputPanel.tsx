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
      <div className="flex items-center border-b border-zinc-200 bg-zinc-50 px-3">
        <button
          onClick={() => setActiveTab("code")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "code"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Code View
        </button>
        <button
          onClick={() => setActiveTab("tree")}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "tree"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Tree View
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "code" ? (
          minifiedOutput ? (
            <pre className="flex-1 overflow-auto p-3 font-mono text-sm leading-5 text-zinc-700">
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
