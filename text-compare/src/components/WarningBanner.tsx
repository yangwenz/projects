"use client";

import { useDiff } from "@/context/DiffContext";

export default function WarningBanner() {
  const { error, dismissError } = useDiff();

  if (!error) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800">
      <span>⚠</span>
      <span className="flex-1">{error}</span>
      <button
        onClick={dismissError}
        className="text-yellow-600 hover:text-yellow-800 font-medium"
      >
        Dismiss
      </button>
    </div>
  );
}
