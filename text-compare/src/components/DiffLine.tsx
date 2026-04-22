"use client";

import type { DiffSegment } from "@/types/diff";
import type { RefObject } from "react";

interface DiffLineProps {
  lineNumber: number;
  segments: DiffSegment[];
  side: "left" | "right";
  isCurrentChange?: boolean;
  showWhitespace?: boolean;
  gutterRef?: RefObject<HTMLSpanElement | null>;
}

export default function DiffLine({
  lineNumber,
  segments,
  side,
  isCurrentChange,
  showWhitespace,
  gutterRef,
}: DiffLineProps) {
  const lineBg = getLineBg(segments, side);

  return (
    <div
      className={`flex min-h-[1.5rem] ${lineBg} ${isCurrentChange ? "ring-2 ring-blue-400" : ""}`}
    >
      <span
        ref={gutterRef}
        className="w-12 shrink-0 text-right pr-2 text-xs text-gray-400 select-none border-r border-gray-200 leading-6"
      >
        {lineNumber}
      </span>
      <span className="pl-2 whitespace-pre-wrap break-all font-mono text-sm leading-6 flex-1 min-w-0">
        {segments.map((seg, i) => (
          <span key={i} className={getSegmentClass(seg, side)}>
            {showWhitespace ? renderWhitespace(seg.value) : seg.value}
          </span>
        ))}
      </span>
    </div>
  );
}

function getLineBg(segments: DiffSegment[], side: "left" | "right"): string {
  if (segments.length === 1) {
    const type = segments[0].type;
    if (type === "added" && side === "right") return "bg-green-50";
    if (type === "removed" && side === "left") return "bg-red-50";
  }
  const hasChange = segments.some(
    (s) => s.type === "added" || s.type === "removed" || s.type === "modified"
  );
  if (hasChange) return side === "left" ? "bg-red-50/50" : "bg-green-50/50";
  return "";
}

function getSegmentClass(seg: DiffSegment, side: "left" | "right"): string {
  switch (seg.type) {
    case "equal":
      return "";
    case "added":
      return side === "right" ? "bg-green-200" : "";
    case "removed":
      return side === "left" ? "bg-red-200" : "";
    case "modified":
      return "bg-yellow-200";
    default:
      return "";
  }
}

function renderWhitespace(value: string): string {
  return value.replace(/ /g, "·").replace(/\t/g, "→").replace(/\n/g, "¶\n");
}
