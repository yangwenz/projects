"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import DiffLine from "./DiffLine";
import { validateFile, readFileAsText } from "@/lib/file-upload";
import type { DiffChunk, DiffSegment } from "@/types/diff";

interface EditorPanelProps {
  side: "left" | "right";
  text: string;
  setText: (text: string) => void;
  chunks: DiffChunk[];
  currentChangeIndex: number;
  showWhitespace: boolean;
  placeholder: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: (scrollTop: number) => void;
}

export default function EditorPanel({
  side,
  text,
  setText,
  chunks,
  currentChangeIndex,
  showWhitespace,
  placeholder,
  scrollRef,
  onScroll,
}: EditorPanelProps) {
  const [filename, setFilename] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [gutterWidth, setGutterWidth] = useState(49);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gutterRef = useRef<HTMLSpanElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      try {
        const content = await readFileAsText(file);
        setText(content);
        setFilename(file.name);
        setUploadError(null);
      } catch {
        setUploadError("Failed to read file");
      }
    },
    [setText]
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
      if (textareaRef.current && scrollRef.current) {
        textareaRef.current.style.top = `${scrollRef.current.scrollTop}px`;
      }
    },
    [onScroll, scrollRef]
  );

  const lines = text.split("\n");
  const renderedLines = buildRenderedLines(lines, chunks, side);

  const isChunkOnSide = (chunk: DiffChunk, chunkSide: "left" | "right") => {
    if (chunkSide === "left") return chunk.leftLineCount > 0;
    return chunk.rightLineCount > 0;
  };

  return (
    <div
      className={`flex-1 flex flex-col border rounded-lg overflow-hidden ${isDragging ? "ring-2 ring-blue-400 bg-blue-50" : "border-gray-300"}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">
          {side === "left" ? "Original" : "Modified"}
        </span>
        {filename && (
          <span className="text-xs text-gray-500 truncate">{filename}</span>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="ml-auto text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      </div>
      {uploadError && (
        <div className="px-3 py-1 bg-red-50 text-red-700 text-xs">
          {uploadError}
        </div>
      )}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollRef}
          onScroll={handleScrollEvent}
          className="absolute inset-0 overflow-auto"
        >
          <div className="relative">
            {/* Highlight overlay with line numbers */}
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
            {/* Textarea aligned precisely over the text content area */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setFilename(null);
              }}
              placeholder={placeholder}
              className="absolute top-0 bottom-0 resize-none font-mono text-sm leading-6 pl-2 py-0 m-0 bg-transparent text-transparent caret-black z-10 outline-none border-none whitespace-pre-wrap break-all"
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

    const hasModified = chunk.segments.some((s) => s.type === "modified");
    const isSimple =
      !hasModified &&
      chunk.segments.every(
        (s) => s.type === "added" || s.type === "removed" || s.type === "equal"
      );

    if (isSimple) {
      for (let i = 0; i < count && start + i < result.length; i++) {
        const type =
          side === "left" ? ("removed" as const) : ("added" as const);
        result[start + i] = [{ value: lines[start + i] ?? "", type }];
      }
    } else {
      const segmentLines = splitSegmentsByNewline(chunk.segments);
      const relevantLines =
        side === "left"
          ? segmentLines.slice(0, chunk.leftLineCount)
          : segmentLines.slice(
              chunk.leftLineCount,
              chunk.leftLineCount + chunk.rightLineCount
            );

      for (let i = 0; i < count && start + i < result.length; i++) {
        if (i < relevantLines.length) {
          const filtered = relevantLines[i].filter((seg) => {
            if (side === "left") {
              return seg.type === "equal" || seg.type === "removed" || seg.type === "modified";
            }
            return seg.type === "equal" || seg.type === "added" || seg.type === "modified";
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
