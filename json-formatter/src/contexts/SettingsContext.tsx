"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Settings, IndentOption, SortKeysOption } from "@/lib/types";

const DEFAULT_SETTINGS: Settings = {
  indent: 2,
  sortKeys: "off",
  autoFormatOnPaste: true,
};

const STORAGE_KEY = "json-formatter-settings";

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

let cachedSnapshot: Settings = DEFAULT_SETTINGS;
let cachedRaw: string | null = null;

function getSnapshot(): Settings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = loadSettings();
  }
  return cachedSnapshot;
}

function getServerSnapshot(): Settings {
  return DEFAULT_SETTINGS;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

interface SettingsContextValue {
  settings: Settings;
  setIndent: (v: IndentOption) => void;
  setSortKeys: (v: SortKeysOption) => void;
  setAutoFormatOnPaste: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const externalSettings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [settings, setSettings] = useState<Settings>(externalSettings);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setIndent = useCallback(
    (v: IndentOption) => persist({ ...settings, indent: v }),
    [settings, persist]
  );
  const setSortKeys = useCallback(
    (v: SortKeysOption) => persist({ ...settings, sortKeys: v }),
    [settings, persist]
  );
  const setAutoFormatOnPaste = useCallback(
    (v: boolean) => persist({ ...settings, autoFormatOnPaste: v }),
    [settings, persist]
  );

  return (
    <SettingsContext.Provider
      value={{ settings, setIndent, setSortKeys, setAutoFormatOnPaste }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used within SettingsProvider");
  return ctx;
}
