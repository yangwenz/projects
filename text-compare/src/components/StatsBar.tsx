"use client";

import { useDiff } from "@/context/DiffContext";
import { Plus, Minus } from "lucide-react";

export default function StatsBar() {
  const { stats, totalChanges, leftText, rightText, isComputing } =
    useDiff();

  const leftLines = leftText ? leftText.split("\n").length : 0;
  const rightLines = rightText ? rightText.split("\n").length : 0;

  let statusMessage: string;
  if (isComputing) {
    statusMessage = "Comparing...";
  } else if (!leftText && !rightText) {
    statusMessage = "Enter text to compare";
  } else if (totalChanges === 0) {
    statusMessage = "Texts are identical";
  } else {
    statusMessage = `${totalChanges} difference${totalChanges !== 1 ? "s" : ""} found`;
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-surface border-t border-border-default text-xs">
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
        <Plus size={12} />
        {stats.additions}
      </span>
      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
        <Minus size={12} />
        {stats.deletions}
      </span>
      <span className="ml-auto text-foreground/40 tabular-nums">
        {leftLines}L / {rightLines}L
      </span>
      <span className="text-foreground/50">{statusMessage}</span>
    </div>
  );
}
