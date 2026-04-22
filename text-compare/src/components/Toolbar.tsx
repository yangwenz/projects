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
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 bg-surface border-b border-border-default shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <span className="text-base font-semibold tracking-tight text-foreground">
        Text Comparer
      </span>

      <div className="h-5 w-px bg-border-default mx-1" />

      <div className="flex bg-border-subtle rounded-lg p-0.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              mode === m.value
                ? "bg-surface text-accent shadow-sm"
                : "text-foreground/50 hover:text-foreground/70"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-border-default mx-1" />

      <div className="flex items-center gap-1">
        <button
          onClick={goToPrev}
          disabled={totalChanges === 0}
          className="p-1.5 rounded-md text-foreground/60 hover:bg-border-subtle hover:text-foreground active:bg-border-default disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous change"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs font-medium text-foreground/50 min-w-[3.5rem] text-center tabular-nums">
          {totalChanges > 0
            ? `${currentChangeIndex + 1} / ${totalChanges}`
            : "0 / 0"}
        </span>
        <button
          onClick={goToNext}
          disabled={totalChanges === 0}
          className="p-1.5 rounded-md text-foreground/60 hover:bg-border-subtle hover:text-foreground active:bg-border-default disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next change"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => setSyncScroll(!syncScroll)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            syncScroll
              ? "bg-accent-light text-accent"
              : "text-foreground/50 hover:bg-border-subtle hover:text-foreground/70"
          }`}
          title="Toggle scroll sync"
        >
          {syncScroll ? <Link size={13} /> : <Unlink size={13} />}
          Sync
        </button>
        <button
          onClick={onSwap}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-foreground/50 hover:bg-border-subtle hover:text-foreground/70 active:bg-border-default transition-colors"
          title="Swap panels"
        >
          <ArrowLeftRight size={13} />
          Swap
        </button>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-foreground/50 hover:bg-border-subtle hover:text-foreground/70 active:bg-border-default transition-colors"
          title="Clear both panels"
        >
          <Trash2 size={13} />
          Clear
        </button>

        <div className="h-5 w-px bg-border-default mx-0.5" />

        <ExportMenu />
        <SettingsPopover />
      </div>
    </div>
  );
}
