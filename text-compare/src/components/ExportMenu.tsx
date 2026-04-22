"use client";

import { useState, useRef, useEffect } from "react";
import { useDiff } from "@/context/DiffContext";
import {
  generateUnifiedDiff,
  generatePlainTextDiff,
  generateHtmlDiff,
} from "@/lib/export";
import {
  Download,
  ClipboardCopy,
  FileText,
  FileCode,
  Globe,
  ChevronDown,
} from "lucide-react";

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
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
      >
        <Download size={14} />
        Export
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          <button
            onClick={handleCopyClipboard}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ClipboardCopy size={14} className="text-gray-400" />
            Copy to clipboard
          </button>
          <button
            onClick={handleDownloadDiff}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <FileCode size={14} className="text-gray-400" />
            Download as .diff
          </button>
          <button
            onClick={handleDownloadTxt}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <FileText size={14} className="text-gray-400" />
            Download as .txt
          </button>
          <button
            onClick={handleDownloadHtml}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <Globe size={14} className="text-gray-400" />
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
