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
      className={`flex min-h-[1.5rem] ${lineBg} ${isCurrentChange ? "ring-2 ring-inset ring-diff-current-ring" : ""}`}
    >
      <span
        ref={gutterRef}
        className="w-12 shrink-0 text-right pr-2 text-xs text-gutter-text select-none border-r border-gutter-border bg-gutter-bg leading-6"
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
  const allSameType = segments.length >= 1 && segments.every((s) => s.type === segments[0].type);
  if (allSameType) {
    const type = segments[0].type;
    if (type === "added" && side === "right") return "bg-diff-added-bg";
    if (type === "removed" && side === "left") return "bg-diff-removed-bg";
  }
  return "";
}

function getSegmentClass(seg: DiffSegment, side: "left" | "right"): string {
  switch (seg.type) {
    case "equal":
      return "";
    case "added":
      return side === "right" ? "bg-diff-added-segment rounded-sm" : "";
    case "removed":
      return side === "left" ? "bg-diff-removed-segment rounded-sm" : "";
    default:
      return "";
  }
}

function renderWhitespace(value: string): string {
  return value.replace(/ /g, "\u00b7").replace(/\t/g, "\u2192").replace(/\n/g, "\u00b6\n");
}
