import { loadSettings, saveSettings } from "@/lib/settings";
import type { Settings } from "@/types/diff";
import { DEFAULT_SETTINGS } from "@/types/diff";

const mockStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

  const storage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
  };

  Object.defineProperty(global, "localStorage", {
    value: storage,
    writable: true,
  });

  Object.defineProperty(global, "window", {
    value: { localStorage: storage },
    writable: true,
  });
});

describe("loadSettings", () => {
  it("returns default settings when no localStorage key exists", () => {
    const result = loadSettings();
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("returns default settings for corrupted JSON", () => {
    mockStorage["text-compare-settings"] = "not valid json{{{";
    const result = loadSettings();
    expect(result).toEqual(DEFAULT_SETTINGS);
  });

  it("merges with defaults for partial settings object", () => {
    mockStorage["text-compare-settings"] = JSON.stringify({ ignoreCase: true });
    const result = loadSettings();
    expect(result.ignoreCase).toBe(true);
    expect(result.ignoreWhitespace).toBe(DEFAULT_SETTINGS.ignoreWhitespace);
    expect(result.ignoreEmptyLines).toBe(DEFAULT_SETTINGS.ignoreEmptyLines);
    expect(result.showWhitespace).toBe(DEFAULT_SETTINGS.showWhitespace);
  });
});

describe("saveSettings and loadSettings round-trip", () => {
  it("round-trips all setting fields correctly", () => {
    const settings: Settings = {
      ignoreCase: true,
      ignoreWhitespace: true,
      ignoreEmptyLines: true,
      showWhitespace: true,
    };
    saveSettings(settings);
    const loaded = loadSettings();
    expect(loaded).toEqual(settings);
  });

  it("persists individual field toggles independently", () => {
    saveSettings({ ...DEFAULT_SETTINGS, ignoreCase: true });
    expect(loadSettings().ignoreCase).toBe(true);
    expect(loadSettings().ignoreWhitespace).toBe(false);

    saveSettings({ ...DEFAULT_SETTINGS, showWhitespace: true });
    expect(loadSettings().showWhitespace).toBe(true);
    expect(loadSettings().ignoreCase).toBe(false);
  });
});
