"use client";

import { useState, useRef, useEffect } from "react";
import { useDiff } from "@/context/DiffContext";
import { Settings } from "lucide-react";

export default function SettingsPopover() {
  const { settings, updateSettings } = useDiff();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (key: keyof typeof settings) => {
    updateSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        title="Settings"
      >
        <Settings size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Settings
          </h3>
          <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ignoreCase}
              onChange={() => toggle("ignoreCase")}
              className="rounded"
            />
            Ignore case
          </label>
          <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ignoreWhitespace}
              onChange={() => toggle("ignoreWhitespace")}
              className="rounded"
            />
            Ignore whitespace
          </label>
          <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ignoreEmptyLines}
              onChange={() => toggle("ignoreEmptyLines")}
              className="rounded"
            />
            Ignore empty lines
          </label>
          <label className="flex items-center gap-2 text-sm py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showWhitespace}
              onChange={() => toggle("showWhitespace")}
              className="rounded"
            />
            Show whitespace characters
          </label>
        </div>
      )}
    </div>
  );
}
