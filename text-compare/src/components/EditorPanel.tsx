"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import DiffLine from "./DiffLine";
import { validateFile, readFileAsText } from "@/lib/file-upload";
import { Upload } from "lucide-react";
import type { DiffChunk, DiffSegment } from "@/types/diff";

interface EditorPanelProps {
  side: "left" | "right";
  label: string;
  text: string;
  setText: (text: string) => void;
  filename: string | null;
  setFilename: (name: string | null) => void;
  chunks: DiffChunk[];
  currentChangeIndex: number;
  showWhitespace: boolean;
  placeholder: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (scrollTop: number) => void;
}

export default function EditorPanel({
  side,
  label,
  text,
  setText,
  filename,
  setFilename,
  chunks,
  currentChangeIndex,
  showWhitespace,
  placeholder,
  scrollRef,
  onScroll,
}: EditorPanelProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [gutterWidth, setGutterWidth] = useState(49);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gutterRef = useRef<HTMLSpanElement>(null);


  useEffect(() => {
    if (!gutterRef.current) return;
    const measure = () => {
      if (gutterRef.current) {
        setGutterWidth(gutterRef.current.getBoundingClientRect().width);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(gutterRef.current);
    return () => ro.disconnect();
  }, []);

  const handleFileUpload = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error ?? "Invalid file");
        return;
      }
      let content: string;
      try {
        content = await readFileAsText(file);
      } catch {
        setUploadError("Failed to read file");
        return;
      }
      setText(content);
      setFilename(file.name);
      setUploadError(null);
    },
    [setText, setFilename]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScrollEvent = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      onScroll(e.currentTarget.scrollTop);
    },
    [onScroll]
  );

  const lines = text.split("\n");
  const renderedLines = buildRenderedLines(lines, chunks, side);

  const isChunkOnSide = (chunk: DiffChunk, chunkSide: "left" | "right") => {
    if (chunkSide === "left") return chunk.leftLineCount > 0;
    return chunk.rightLineCount > 0;
  };

  return (
    <div
      className={`flex-1 flex flex-col rounded-lg overflow-hidden border transition-shadow ${
        isDragging
          ? "ring-2 ring-accent border-accent/40 shadow-lg"
          : "border-border-default shadow-sm"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-surface border-b border-border-default">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
          {label}
        </span>
        {filename && (
          <span className="text-xs text-foreground/50 truncate font-mono">
            {filename}
          </span>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="ml-auto inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-foreground/50 hover:bg-border-subtle hover:text-foreground/70 transition-colors"
        >
          <Upload size={12} />
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />
      </div>
      {uploadError && (
        <div className="px-3 py-1.5 bg-diff-removed-bg text-red-600 dark:text-red-400 text-xs font-medium">
          {uploadError}
        </div>
      )}
      <div className="relative flex-1 min-h-0 bg-surface">
        <div
          ref={scrollRef}
          onScroll={handleScrollEvent}
          className="absolute inset-0 overflow-auto"
        >
          <div className="relative">
            <div aria-hidden="true">
              {renderedLines.map((line, idx) => {
                const chunkIdx = chunks.findIndex((c) => {
                  const start =
                    side === "left" ? c.leftLineStart : c.rightLineStart;
                  const count =
                    side === "left" ? c.leftLineCount : c.rightLineCount;
                  return idx >= start && idx < start + count;
                });
                const isCurrentChunk =
                  chunkIdx === currentChangeIndex &&
                  chunkIdx !== -1 &&
                  isChunkOnSide(chunks[chunkIdx], side);
                return (
                  <DiffLine
                    key={idx}
                    lineNumber={idx + 1}
                    segments={line}
                    side={side}
                    isCurrentChange={isCurrentChunk}
                    showWhitespace={showWhitespace}
                    gutterRef={idx === 0 ? gutterRef : undefined}
                  />
                );
              })}
            </div>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setFilename(null);
              }}
              placeholder={placeholder}
              className="absolute top-0 bottom-0 resize-none font-mono text-sm leading-6 pl-2 py-0 m-0 bg-transparent text-transparent caret-foreground z-10 outline-none border-none whitespace-pre-wrap break-all"
              style={{
                left: `${gutterWidth}px`,
                width: `calc(100% - ${gutterWidth}px)`,
                height: `${renderedLines.length * 24}px`,
                minHeight: "100%",
              }}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function buildRenderedLines(
  lines: string[],
  chunks: DiffChunk[],
  side: "left" | "right"
): DiffSegment[][] {
  const result: DiffSegment[][] = lines.map((line) => [
    { value: line, type: "equal" as const },
  ]);

  for (const chunk of chunks) {
    const start = side === "left" ? chunk.leftLineStart : chunk.rightLineStart;
    const count = side === "left" ? chunk.leftLineCount : chunk.rightLineCount;

    if (count === 0) continue;

    const isPureAdd = chunk.leftLineCount === 0;
    const isPureRemove = chunk.rightLineCount === 0;

    if (isPureAdd || isPureRemove) {
      for (let i = 0; i < count && start + i < result.length; i++) {
        const type =
          side === "left" ? ("removed" as const) : ("added" as const);
        result[start + i] = [{ value: lines[start + i] ?? "", type }];
      }
    } else {
      const segmentLines = splitSegmentsByNewline(chunk.segments);

      for (let i = 0; i < count && start + i < result.length; i++) {
        if (i < segmentLines.length) {
          const filtered = segmentLines[i].filter((seg) => {
            if (side === "left") {
              return seg.type === "equal" || seg.type === "removed";
            }
            return seg.type === "equal" || seg.type === "added";
          });
          result[start + i] = filtered.length > 0 ? filtered : [{ value: lines[start + i] ?? "", type: "equal" }];
        }
      }
    }
  }

  return result;
}

function splitSegmentsByNewline(segments: DiffSegment[]): DiffSegment[][] {
  const lines: DiffSegment[][] = [[]];
  for (const seg of segments) {
    const parts = seg.value.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) lines.push([]);
      if (parts[i] !== "" || i === 0) {
        lines[lines.length - 1].push({ value: parts[i], type: seg.type });
      }
    }
  }
  return lines;
}
