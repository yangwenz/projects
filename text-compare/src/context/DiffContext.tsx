"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  DiffMode,
  DiffChunk,
  DiffStats,
  DiffResponse,
  DiffError,
  Settings,
} from "@/types/diff";
import { loadSettings, saveSettings } from "@/lib/settings";

interface DiffContextValue {
  leftText: string;
  rightText: string;
  setLeftText: (text: string) => void;
  setRightText: (text: string) => void;
  mode: DiffMode;
  setMode: (mode: DiffMode) => void;
  chunks: DiffChunk[];
  stats: DiffStats;
  error: string | null;
  dismissError: () => void;
  settings: Settings;
  updateSettings: (settings: Settings) => void;
  currentChangeIndex: number;
  totalChanges: number;
  goToNext: () => void;
  goToPrev: () => void;
  syncScroll: boolean;
  setSyncScroll: (enabled: boolean) => void;
  isComputing: boolean;
}

const DiffContext = createContext<DiffContextValue | null>(null);

export function useDiff(): DiffContextValue {
  const ctx = useContext(DiffContext);
  if (!ctx) throw new Error("useDiff must be used within DiffProvider");
  return ctx;
}

export function DiffProvider({ children }: { children: ReactNode }) {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [mode, setMode] = useState<DiffMode>("word");
  const [chunks, setChunks] = useState<DiffChunk[]>([]);
  const [stats, setStats] = useState<DiffStats>({
    additions: 0,
    deletions: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [syncScroll, setSyncScroll] = useState(true);
  const [isComputing, setIsComputing] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/diff.worker.ts", import.meta.url)
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<DiffResponse | DiffError>) => {
      const data = event.data;
      if (data.id < requestIdRef.current) return;

      if ("error" in data) {
        setError(data.error);
        setChunks([]);
        setStats({ additions: 0, deletions: 0 });
      } else {
        setError(null);
        setChunks(data.chunks);
        setStats(data.stats);
      }
      setIsComputing(false);
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const triggerDiff = useCallback(() => {
    if (!workerRef.current) return;
    const id = ++requestIdRef.current;
    setIsComputing(true);
    workerRef.current.postMessage({
      id,
      leftText,
      rightText,
      mode,
      options: {
        ignoreCase: settings.ignoreCase,
        ignoreWhitespace: settings.ignoreWhitespace,
        ignoreEmptyLines: settings.ignoreEmptyLines,
      },
    });
  }, [leftText, rightText, mode, settings]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(triggerDiff, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [triggerDiff]);

  const dismissError = useCallback(() => setError(null), []);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const totalChanges = chunks.length;

  const clampedChangeIndex =
    totalChanges === 0 ? 0 : Math.min(currentChangeIndex, totalChanges - 1);

  const goToNext = useCallback(() => {
    if (totalChanges === 0) return;
    setCurrentChangeIndex((prev) => (prev + 1) % totalChanges);
  }, [totalChanges]);

  const goToPrev = useCallback(() => {
    if (totalChanges === 0) return;
    setCurrentChangeIndex((prev) => (prev - 1 + totalChanges) % totalChanges);
  }, [totalChanges]);

  return (
    <DiffContext.Provider
      value={{
        leftText,
        rightText,
        setLeftText,
        setRightText,
        mode,
        setMode,
        chunks,
        stats,
        error,
        dismissError,
        settings,
        updateSettings,
        currentChangeIndex: clampedChangeIndex,
        totalChanges,
        goToNext,
        goToPrev,
        syncScroll,
        setSyncScroll,
        isComputing,
      }}
    >
      {children}
    </DiffContext.Provider>
  );
}
