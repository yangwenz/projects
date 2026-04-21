"use client";

import { useDiff } from "@/context/DiffContext";
import ExportMenu from "./ExportMenu";
import SettingsPopover from "./SettingsPopover";
import type { DiffMode } from "@/types/diff";

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

      <div className="flex rounded-md border border-gray-300 overflow-hidden ml-4">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-3 py-1 text-sm ${
              mode === m.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 ml-4">
        <button
          onClick={goToPrev}
          disabled={totalChanges === 0}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          ◀ Prev
        </button>
        <span className="text-sm text-gray-600 min-w-[3rem] text-center">
          {totalChanges > 0
            ? `${currentChangeIndex + 1} / ${totalChanges}`
            : "0 / 0"}
        </span>
        <button
          onClick={goToNext}
          disabled={totalChanges === 0}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          Next ▶
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => setSyncScroll(!syncScroll)}
          className={`px-2 py-1 text-sm border rounded ${
            syncScroll
              ? "border-blue-400 bg-blue-50 text-blue-700"
              : "border-gray-300 text-gray-600 hover:bg-gray-100"
          }`}
          title="Toggle scroll sync"
        >
          ⇅ Sync
        </button>
        <button
          onClick={onSwap}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Swap panels"
        >
          ⇄ Swap
        </button>
        <button
          onClick={onClear}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          title="Clear both panels"
        >
          ✕ Clear
        </button>
        <ExportMenu />
        <SettingsPopover />
      </div>
    </div>
  );
}
