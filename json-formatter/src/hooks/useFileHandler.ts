"use client";

import { useCallback, useRef } from "react";

interface UseFileHandlerOptions {
  onFileContent: (content: string) => void;
  getOutput: () => string;
}

export function useFileHandler({
  onFileContent,
  getOutput,
}: UseFileHandlerOptions) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onFileContent(reader.result as string);
      };
      reader.readAsText(file);
    };
    input.click();
    fileInputRef.current = input;
  }, [onFileContent]);

  const onDownload = useCallback(() => {
    const output = getOutput();
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "download.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [getOutput]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        onFileContent(reader.result as string);
      };
      reader.readAsText(file);
    },
    [onFileContent]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return { onUpload, onDownload, onDrop, onDragOver };
}
