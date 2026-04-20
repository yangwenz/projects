"use client";

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
  children,
  active,
}: {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
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
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onUpload}>Upload</ToolbarButton>
        <ToolbarButton onClick={onPaste}>Paste</ToolbarButton>
        <ToolbarButton onClick={onClear}>Clear</ToolbarButton>
      </div>
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={onCopy}>Copy</ToolbarButton>
        <ToolbarButton onClick={onDownload}>Download</ToolbarButton>
        <ToolbarButton onClick={onMinify} active={isMinified}>
          Minify
        </ToolbarButton>
      </div>
    </div>
  );
}
