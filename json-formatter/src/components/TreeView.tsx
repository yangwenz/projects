"use client";

import { useMemo, useState, useCallback } from "react";
import { buildTree } from "@/lib/tree-builder";
import TreeNodeComponent from "./TreeNode";

interface TreeViewProps {
  parsed: unknown;
  onCopyPath: (path: string) => void;
}

export default function TreeView({ parsed, onCopyPath }: TreeViewProps) {
  const [allExpanded, setAllExpanded] = useState(true);
  const [expandKey, setExpandKey] = useState(0);

  const tree = useMemo(() => {
    if (parsed === undefined || parsed === null) return null;
    return buildTree(parsed);
  }, [parsed]);

  const expandAll = useCallback(() => {
    setAllExpanded(true);
    setExpandKey((k) => k + 1);
  }, []);

  const collapseAll = useCallback(() => {
    setAllExpanded(false);
    setExpandKey((k) => k + 1);
  }, []);

  if (!tree) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-400 text-sm">
        No valid JSON to display
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-1.5">
        <button
          onClick={expandAll}
          className="rounded px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="rounded px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          Collapse All
        </button>
      </div>
      <div className="flex-1 overflow-auto p-2 text-sm">
        <TreeNodeComponent
          key={expandKey}
          node={tree}
          onCopyPath={onCopyPath}
          defaultExpanded={allExpanded}
        />
      </div>
    </div>
  );
}
