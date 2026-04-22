"use client";

import { useDiff } from "@/context/DiffContext";
import { AlertTriangle, X } from "lucide-react";

export default function WarningBanner() {
  const { error, dismissError } = useDiff();

  if (!error) return null;

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/40 text-sm text-amber-800 dark:text-amber-300">
      <AlertTriangle size={15} className="shrink-0" />
      <span className="flex-1">{error}</span>
      <button
        onClick={dismissError}
        className="p-1 rounded-md text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-700 dark:hover:text-amber-200 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
