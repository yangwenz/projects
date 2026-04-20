"use client";

import { useEffect, useRef } from "react";
import { useSettingsContext } from "@/contexts/SettingsContext";
import { IndentOption, SortKeysOption } from "@/lib/types";

interface SettingsPopoverProps {
  open: boolean;
  onClose: () => void;
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-sm transition-colors ${
        active
          ? "bg-blue-100 text-blue-700 font-medium"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsPopover({ open, onClose }: SettingsPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { settings, setIndent, setSortKeys, setAutoFormatOnPaste } =
    useSettingsContext();

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const indentOptions: { label: string; value: IndentOption }[] = [
    { label: "2", value: 2 },
    { label: "4", value: 4 },
    { label: "Tab", value: "tab" },
  ];

  const sortOptions: { label: string; value: SortKeysOption }[] = [
    { label: "Off", value: "off" },
    { label: "A-Z", value: "asc" },
    { label: "Z-A", value: "desc" },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-4 top-14 z-40 w-72 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg"
    >
      <h3 className="mb-3 text-sm font-semibold text-zinc-800">Settings</h3>

      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
          Indent
        </label>
        <div className="flex gap-1.5">
          {indentOptions.map((opt) => (
            <OptionButton
              key={String(opt.value)}
              active={settings.indent === opt.value}
              onClick={() => setIndent(opt.value)}
            >
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
          Sort keys
        </label>
        <div className="flex gap-1.5">
          {sortOptions.map((opt) => (
            <OptionButton
              key={opt.value}
              active={settings.sortKeys === opt.value}
              onClick={() => setSortKeys(opt.value)}
            >
              {opt.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-500">
          Auto-format on paste
        </label>
        <button
          onClick={() => setAutoFormatOnPaste(!settings.autoFormatOnPaste)}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            settings.autoFormatOnPaste ? "bg-blue-500" : "bg-zinc-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              settings.autoFormatOnPaste ? "translate-x-4" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
