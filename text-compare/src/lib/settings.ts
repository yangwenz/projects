import { Settings, DEFAULT_SETTINGS } from "@/types/diff";

const STORAGE_KEY = "text-compare-settings";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ignoreCase:
        typeof parsed.ignoreCase === "boolean"
          ? parsed.ignoreCase
          : DEFAULT_SETTINGS.ignoreCase,
      ignoreWhitespace:
        typeof parsed.ignoreWhitespace === "boolean"
          ? parsed.ignoreWhitespace
          : DEFAULT_SETTINGS.ignoreWhitespace,
      ignoreEmptyLines:
        typeof parsed.ignoreEmptyLines === "boolean"
          ? parsed.ignoreEmptyLines
          : DEFAULT_SETTINGS.ignoreEmptyLines,
      showWhitespace:
        typeof parsed.showWhitespace === "boolean"
          ? parsed.showWhitespace
          : DEFAULT_SETTINGS.showWhitespace,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
