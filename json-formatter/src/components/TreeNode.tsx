"use client";

import { useState, useCallback } from "react";
import { TreeNode as TreeNodeType } from "@/lib/types";

const typeBadgeColors: Record<string, string> = {
  string: "bg-green-100 text-green-700",
  number: "bg-blue-100 text-blue-700",
  boolean: "bg-orange-100 text-orange-700",
  null: "bg-red-100 text-red-600",
  object: "bg-purple-100 text-purple-700",
  array: "bg-yellow-100 text-yellow-700",
};

interface TreeNodeProps {
  node: TreeNodeType;
  onCopyPath: (path: string) => void;
  defaultExpanded?: boolean;
}

export default function TreeNodeComponent({
  node,
  onCopyPath,
  defaultExpanded = true,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = useCallback(() => {
    onCopyPath(node.path);
  }, [node.path, onCopyPath]);

  const formatValue = (value: unknown): string => {
    if (typeof value === "string") return `"${value}"`;
    return String(value);
  };

  const childCount =
    node.type === "object" || node.type === "array"
      ? node.children?.length ?? 0
      : 0;

  return (
    <div className="ml-4">
      <div
        className="group flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-zinc-100 cursor-pointer"
        onClick={handleClick}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex h-4 w-4 items-center justify-center text-zinc-400 hover:text-zinc-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ) : (
          <span className="w-4" />
        )}

        <span className="text-sm font-medium text-zinc-700">{node.key}</span>

        <span
          className={`rounded px-1 py-0.5 text-xs ${typeBadgeColors[node.type] ?? ""}`}
        >
          {node.type}
        </span>

        {hasChildren && !expanded && (
          <span className="text-xs text-zinc-400">
            {node.type === "array" ? `[${childCount}]` : `{${childCount}}`}
          </span>
        )}

        {!hasChildren && node.value !== undefined && (
          <span className="text-sm text-zinc-500 truncate max-w-xs">
            {formatValue(node.value)}
          </span>
        )}

        <span className="ml-auto hidden text-xs text-zinc-400 group-hover:inline">
          click to copy path
        </span>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child, idx) => (
            <TreeNodeComponent
              key={idx}
              node={child}
              onCopyPath={onCopyPath}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
