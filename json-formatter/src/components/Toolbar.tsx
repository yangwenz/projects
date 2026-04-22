"use client";

import {
  Upload,
  ClipboardPaste,
  Trash2,
  Copy,
  Download,
  Minimize2,
} from "lucide-react";

interface ToolbarProps {
  onUpload: () => void;
  onPaste: () => void;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onMinify: () => void;
  isMinified: boolean;
}

function ToolbarButton({
  onClick,
  icon: Icon,
  label,
  active,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition-all ${
        active
          ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 dark:active:bg-blue-800"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:active:bg-zinc-600"
      }`}
    >
      <Icon
        size={14}
        className={
          active
            ? "text-blue-500 dark:text-blue-400"
            : "text-zinc-400 dark:text-zinc-500"
        }
      />
      {label}
    </button>
  );
}

export default function Toolbar({
  onUpload,
  onPaste,
  onClear,
  onCopy,
  onDownload,
  onMinify,
  isMinified,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center gap-1.5">
        <ToolbarButton onClick={onUpload} icon={Upload} label="Upload" />
        <ToolbarButton onClick={onPaste} icon={ClipboardPaste} label="Paste" />
        <ToolbarButton onClick={onClear} icon={Trash2} label="Clear" />
      </div>
      <div className="flex items-center gap-1.5">
        <ToolbarButton onClick={onCopy} icon={Copy} label="Copy" />
        <ToolbarButton onClick={onDownload} icon={Download} label="Download" />
        <ToolbarButton
          onClick={onMinify}
          icon={Minimize2}
          label="Minify"
          active={isMinified}
        />
      </div>
    </div>
  );
}
