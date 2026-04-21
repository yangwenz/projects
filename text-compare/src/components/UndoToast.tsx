"use client";

import { useEffect } from "react";

interface UndoToastProps {
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoToast({ visible, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
      <span className="text-sm">Content cleared</span>
      <button
        onClick={onUndo}
        className="text-sm font-medium text-blue-300 hover:text-blue-200"
      >
        Undo
      </button>
    </div>
  );
}
