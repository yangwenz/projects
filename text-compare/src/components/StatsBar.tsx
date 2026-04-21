"use client";

import { useDiff } from "@/context/DiffContext";

export default function StatsBar() {
  const { stats, totalChanges, leftText, rightText, isComputing, mode } =
    useDiff();

  const leftLines = leftText ? leftText.split("\n").length : 0;
  const rightLines = rightText ? rightText.split("\n").length : 0;

  let statusMessage: string;
  if (isComputing) {
    statusMessage = "Comparing…";
  } else if (!leftText && !rightText) {
    statusMessage = "Enter text to compare";
  } else if (totalChanges === 0) {
    statusMessage = "Texts are identical";
  } else {
    statusMessage = `${totalChanges} difference${totalChanges !== 1 ? "s" : ""} found`;
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
      <span className="text-green-700">+{stats.additions} additions</span>
      <span className="text-red-700">-{stats.deletions} deletions</span>
      {mode !== "line" && (
        <span className="text-yellow-700">
          ~{stats.modifications} modifications
        </span>
      )}
      <span className="ml-auto text-gray-500">
        {leftLines}L / {rightLines}L
      </span>
      <span className="text-gray-500">{statusMessage}</span>
    </div>
  );
}
