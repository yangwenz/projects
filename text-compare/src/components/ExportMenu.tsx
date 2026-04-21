"use client";

import { useState, useRef, useEffect } from "react";
import { useDiff } from "@/context/DiffContext";
import {
  generateUnifiedDiff,
  generatePlainTextDiff,
  generateHtmlDiff,
} from "@/lib/export";

export default function ExportMenu() {
  const { chunks, leftText, rightText } = useDiff();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyClipboard = () => {
    const text = generateUnifiedDiff(chunks, leftText, rightText);
    navigator.clipboard.writeText(text);
    setOpen(false);
  };

  const handleDownloadDiff = () => {
    const text = generateUnifiedDiff(chunks, leftText, rightText);
    download(text, "diff.diff", "text/plain");
    setOpen(false);
  };

  const handleDownloadTxt = () => {
    const text = generatePlainTextDiff(chunks, leftText, rightText);
    download(text, "diff.txt", "text/plain");
    setOpen(false);
  };

  const handleDownloadHtml = () => {
    const text = generateHtmlDiff(chunks, leftText, rightText);
    download(text, "diff.html", "text/html");
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
      >
        Export ▾
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <button
            onClick={handleCopyClipboard}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
          >
            Copy to clipboard
          </button>
          <button
            onClick={handleDownloadDiff}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
          >
            Download as .diff
          </button>
          <button
            onClick={handleDownloadTxt}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
          >
            Download as .txt
          </button>
          <button
            onClick={handleDownloadHtml}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
          >
            Download as .html
          </button>
        </div>
      )}
    </div>
  );
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
