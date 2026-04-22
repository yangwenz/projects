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
        className="p-1.5 rounded-md text-foreground/50 hover:bg-border-subtle hover:text-foreground/70 active:bg-border-default transition-colors"
        title="Settings"
      >
        <Settings size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface border border-border-default rounded-xl shadow-lg z-50 p-3 space-y-0.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">
            Settings
          </h3>
          <label className="flex items-center gap-2.5 text-sm text-foreground/80 py-1.5 px-1 rounded-md cursor-pointer hover:bg-border-subtle transition-colors">
            <input
              type="checkbox"
              checked={settings.ignoreCase}
              onChange={() => toggle("ignoreCase")}
              className="rounded accent-accent"
            />
            Ignore case
          </label>
          <label className="flex items-center gap-2.5 text-sm text-foreground/80 py-1.5 px-1 rounded-md cursor-pointer hover:bg-border-subtle transition-colors">
            <input
              type="checkbox"
              checked={settings.ignoreWhitespace}
              onChange={() => toggle("ignoreWhitespace")}
              className="rounded accent-accent"
            />
            Ignore whitespace
          </label>
          <label className="flex items-center gap-2.5 text-sm text-foreground/80 py-1.5 px-1 rounded-md cursor-pointer hover:bg-border-subtle transition-colors">
            <input
              type="checkbox"
              checked={settings.ignoreEmptyLines}
              onChange={() => toggle("ignoreEmptyLines")}
              className="rounded accent-accent"
            />
            Ignore empty lines
          </label>
          <label className="flex items-center gap-2.5 text-sm text-foreground/80 py-1.5 px-1 rounded-md cursor-pointer hover:bg-border-subtle transition-colors">
            <input
              type="checkbox"
              checked={settings.showWhitespace}
              onChange={() => toggle("showWhitespace")}
              className="rounded accent-accent"
            />
            Show whitespace
          </label>
        </div>
      )}
    </div>
  );
}
