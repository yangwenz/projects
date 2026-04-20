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
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium shadow-sm transition-colors ${
        active
          ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100"
      }`}
    >
      <Icon size={14} className={active ? "text-blue-500" : "text-zinc-400"} />
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
    <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2">
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
