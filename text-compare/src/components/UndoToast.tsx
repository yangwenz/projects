"use client";

import { useEffect } from "react";
import { Undo2 } from "lucide-react";

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
    <div className="fixed bottom-4 right-4 bg-surface-raised border border-border-default text-foreground px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50">
      <span className="text-sm">Content cleared</span>
      <button
        onClick={onUndo}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
      >
        <Undo2 size={14} />
        Undo
      </button>
    </div>
  );
}
