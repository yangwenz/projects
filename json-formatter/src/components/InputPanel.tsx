"use client";

import { useRef, useMemo, useState, useLayoutEffect, useEffect, useCallback } from "react";

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
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lineHeights, setLineHeights] = useState<number[]>([]);

  const lines = useMemo(() => (value ? value.split("\n") : [""]), [value]);

  const lineNumbers = useMemo(
    () => Array.from({ length: lines.length }, (_, i) => i + 1),
    [lines],
  );

  const measureLines = useCallback(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;

    const cs = getComputedStyle(textarea);
    const contentWidth =
      textarea.clientWidth -
      parseFloat(cs.paddingLeft) -
      parseFloat(cs.paddingRight);
    mirror.style.width = `${contentWidth}px`;

    const heights: number[] = [];
    const children = mirror.children;
    for (let i = 0; i < children.length; i++) {
      heights.push((children[i] as HTMLElement).offsetHeight);
    }
    setLineHeights(heights);
  }, []);

  useLayoutEffect(() => {
    measureLines();
  }, [value, measureLines]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const observer = new ResizeObserver(() => measureLines());
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [measureLines]);

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
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/80 dark:border-blue-600 dark:bg-blue-950/80">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
            Drop JSON file here
          </span>
        </div>
      )}
      <div
        ref={mirrorRef}
        aria-hidden
        className="font-mono text-sm leading-5"
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
        }}
      >
        {lines.map((line, i) => (
          <div key={i}>{line || "\u00a0"}</div>
        ))}
      </div>
      <div className="flex flex-1 overflow-auto font-mono text-sm">
        <div className="select-none border-r border-zinc-100 bg-zinc-50/50 px-2 py-3 text-right text-zinc-400 leading-5 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-600">
          {lineNumbers.map((n, i) => (
            <div
              key={n}
              style={lineHeights[i] ? { height: lineHeights[i] } : undefined}
              className={`px-1 ${
                errorLine === n
                  ? "rounded bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-400"
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
          className="flex-1 resize-none bg-white p-3 leading-5 outline-none placeholder:text-zinc-400 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          placeholder="Paste or type JSON here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}
