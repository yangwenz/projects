"use client";

import { useDiff } from "@/context/DiffContext";
import ExportMenu from "./ExportMenu";
import SettingsPopover from "./SettingsPopover";
import type { DiffMode } from "@/types/diff";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Link,
  Unlink,
  Trash2,
} from "lucide-react";

interface ToolbarProps {
  onSwap: () => void;
  onClear: () => void;
}

const MODES: { value: DiffMode; label: string }[] = [
  { value: "line", label: "Line" },
  { value: "word", label: "Word" },
  { value: "character", label: "Char" },
];

export default function Toolbar({ onSwap, onClear }: ToolbarProps) {
  const {
    mode,
    setMode,
    currentChangeIndex,
    totalChanges,
    goToNext,
    goToPrev,
    syncScroll,
    setSyncScroll,
  } = useDiff();

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
      <span className="text-lg font-semibold text-gray-800">Text Comparer</span>

      {/* Segmented control for diff mode */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 ml-4">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
              mode === m.value
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1 ml-4">
        <button
          onClick={goToPrev}
          disabled={totalChanges === 0}
          className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Previous change"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-gray-600 min-w-[3.5rem] text-center tabular-nums">
          {totalChanges > 0
            ? `${currentChangeIndex + 1} / ${totalChanges}`
            : "0 / 0"}
        </span>
        <button
          onClick={goToNext}
          disabled={totalChanges === 0}
          className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Next change"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => setSyncScroll(!syncScroll)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors ${
            syncScroll
              ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-150"
              : "border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200"
          }`}
          title="Toggle scroll sync"
        >
          {syncScroll ? <Link size={14} /> : <Unlink size={14} />}
          Sync
        </button>
        <button
          onClick={onSwap}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          title="Swap panels"
        >
          <ArrowLeftRight size={14} />
          Swap
        </button>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          title="Clear both panels"
        >
          <Trash2 size={14} />
          Clear
        </button>
        <ExportMenu />
        <SettingsPopover />
      </div>
    </div>
  );
}
