"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SettingsProvider, useSettingsContext } from "@/contexts/SettingsContext";
import { useJsonWorker } from "@/hooks/useJsonWorker";
import { useFileHandler } from "@/hooks/useFileHandler";
import Header from "@/components/Header";
import Toolbar from "@/components/Toolbar";
import InputPanel from "@/components/InputPanel";
import OutputPanel from "@/components/OutputPanel";
import StatusBar from "@/components/StatusBar";
import SettingsPopover from "@/components/SettingsPopover";
import Toast from "@/components/Toast";

function JsonFormatterApp() {
  const { settings } = useSettingsContext();
  const { formatResult, minifyResult, sendFormat, sendMinify, reset } =
    useJsonWorker();

  const [input, setInput] = useState("");
  const [isMinified, setIsMinified] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef(input);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const triggerFormat = useCallback(
    (value: string) => {
      if (!value.trim()) {
        reset();
        return;
      }
      sendFormat(value, settings.indent, settings.sortKeys);
    },
    [sendFormat, settings.indent, settings.sortKeys, reset]
  );

  const debouncedFormat = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => triggerFormat(value), 300);
    },
    [triggerFormat]
  );

  // Re-format when settings change
  useEffect(() => {
    if (inputRef.current.trim()) {
      triggerFormat(inputRef.current);
    }
  }, [settings.indent, settings.sortKeys, triggerFormat]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      setIsMinified(false);
      debouncedFormat(value);
    },
    [debouncedFormat]
  );

  const handleFileContent = useCallback(
    (content: string) => {
      setInput(content);
      setIsMinified(false);
      triggerFormat(content);
    },
    [triggerFormat]
  );

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const getOutput = useCallback(() => {
    if (isMinified && minifyResult) return minifyResult.minified;
    return formatResult?.formatted ?? "";
  }, [isMinified, minifyResult, formatResult]);

  const { onUpload, onDownload, onDrop, onDragOver } = useFileHandler({
    onFileContent: handleFileContent,
    getOutput,
  });

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
      setIsMinified(false);
      triggerFormat(text);
    } catch {
      // clipboard read may fail; the user can still paste via Ctrl+V
    }
  }, [triggerFormat]);

  const handleClear = useCallback(() => {
    setInput("");
    setIsMinified(false);
    reset();
  }, [reset]);

  const handleCopy = useCallback(async () => {
    const output = getOutput();
    if (!output) return;
    await navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  }, [getOutput, showToast]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) return;
    if (isMinified) {
      setIsMinified(false);
      return;
    }
    sendMinify(input);
    setIsMinified(true);
  }, [input, isMinified, sendMinify]);

  const handleCopyPath = useCallback(
    async (path: string) => {
      await navigator.clipboard.writeText(path);
      showToast(`Copied: ${path}`);
    },
    [showToast]
  );

  const handlePasteEvent = useCallback(() => {
    // Triggered from textarea paste event — formatting happens via debounce
  }, []);

  const errorLine =
    formatResult?.validation && !formatResult.validation.valid
      ? formatResult.validation.line
      : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header onToggleSettings={() => setSettingsOpen((o) => !o)} />
      <SettingsPopover
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <Toolbar
        onUpload={onUpload}
        onPaste={handlePaste}
        onClear={handleClear}
        onCopy={handleCopy}
        onDownload={onDownload}
        onMinify={handleMinify}
        isMinified={isMinified}
      />
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex flex-1 flex-col overflow-hidden border-r border-zinc-200">
          <InputPanel
            value={input}
            onChange={handleInputChange}
            onPaste={handlePasteEvent}
            onDrop={onDrop}
            onDragOver={onDragOver}
            errorLine={errorLine}
            autoFormatOnPaste={settings.autoFormatOnPaste}
          />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <OutputPanel
            tokens={formatResult?.tokens ?? []}
            parsed={formatResult?.parsed}
            minifiedOutput={isMinified ? minifyResult?.minified ?? null : null}
            onCopyPath={handleCopyPath}
          />
        </div>
      </div>
      <StatusBar
        validation={formatResult?.validation ?? null}
        stats={formatResult?.stats ?? null}
        minifyResult={isMinified ? minifyResult ?? null : null}
        hasInput={input.trim().length > 0}
      />
      <Toast
        message={toast.message}
        visible={toast.visible}
        onHide={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}

export default function Home() {
  return (
    <SettingsProvider>
      <JsonFormatterApp />
    </SettingsProvider>
  );
}
