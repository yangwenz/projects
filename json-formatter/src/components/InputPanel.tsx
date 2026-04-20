"use client";

import { useRef, useMemo, useState } from "react";

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  onPaste: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  errorLine: number | null;
  autoFormatOnPaste: boolean;
}

export default function InputPanel({
  value,
  onChange,
  onPaste,
  onDrop,
  onDragOver,
  errorLine,
  autoFormatOnPaste,
}: InputPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const lineNumbers = useMemo(() => {
    const count = value ? value.split("\n").length : 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [value]);

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e);
      }}
      onDragOver={(e) => {
        setIsDragOver(true);
        onDragOver(e);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-50/80 border-2 border-dashed border-blue-300 rounded-md">
          <span className="text-blue-600 font-medium">Drop JSON file here</span>
        </div>
      )}
      <div className="flex flex-1 overflow-auto font-mono text-sm">
        <div className="select-none bg-zinc-50 px-2 py-3 text-right text-zinc-400 leading-5">
          {lineNumbers.map((n) => (
            <div
              key={n}
              className={`px-1 ${
                errorLine === n
                  ? "bg-red-100 text-red-500 rounded"
                  : ""
              }`}
            >
              {n}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={() => {
            if (autoFormatOnPaste) {
              setTimeout(onPaste, 0);
            }
          }}
          className="flex-1 resize-none bg-white p-3 leading-5 outline-none"
          placeholder="Paste or type JSON here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
