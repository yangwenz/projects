"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { DiffProvider, useDiff } from "@/context/DiffContext";
import EditorPanel from "./EditorPanel";
import Toolbar from "./Toolbar";
import StatsBar from "./StatsBar";
import WarningBanner from "./WarningBanner";
import UndoToast from "./UndoToast";
import { mapScrollPosition, buildAlignmentAnchors } from "@/lib/scroll-sync";

export default function CompareView() {
  return (
    <DiffProvider>
      <CompareViewInner />
    </DiffProvider>
  );
}

function CompareViewInner() {
  const {
    leftText,
    rightText,
    setLeftText,
    setRightText,
    chunks,
    currentChangeIndex,
    settings,
    syncScroll,
    navigationTrigger,
  } = useDiff();

  const [showToast, setShowToast] = useState(false);
  const [leftLabel, setLeftLabel] = useState("Original");
  const [rightLabel, setRightLabel] = useState("Modified");
  const [leftFilename, setLeftFilename] = useState<string | null>(null);
  const [rightFilename, setRightFilename] = useState<string | null>(null);
  const previousContentRef = useRef<{ left: string; right: string } | null>(
    null
  );
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const scrollGuardRef = useRef(false);

  const handleSwap = useCallback(() => {
    setLeftText(rightText);
    setRightText(leftText);
    setLeftLabel(rightLabel);
    setRightLabel(leftLabel);
    setLeftFilename(rightFilename);
    setRightFilename(leftFilename);
  }, [leftText, rightText, setLeftText, setRightText, leftLabel, rightLabel, leftFilename, rightFilename]);

  const handleClear = useCallback(() => {
    if (leftText || rightText) {
      previousContentRef.current = { left: leftText, right: rightText };
      setLeftText("");
      setRightText("");
      setShowToast(true);
    }
  }, [leftText, rightText, setLeftText, setRightText]);

  const handleUndo = useCallback(() => {
    if (previousContentRef.current) {
      setLeftText(previousContentRef.current.left);
      setRightText(previousContentRef.current.right);
      previousContentRef.current = null;
    }
    setShowToast(false);
  }, [setLeftText, setRightText]);

  const handleDismissToast = useCallback(() => {
    setShowToast(false);
    previousContentRef.current = null;
  }, []);

  const anchors = buildAlignmentAnchors(chunks);

  const buildOffsets = (text: string): number[] => {
    const lines = text.split("\n");
    const lineHeight = 24;
    return lines.map((_, i) => i * lineHeight);
  };

  const handleLeftScroll = useCallback(
    (scrollTop: number) => {
      if (!syncScroll || scrollGuardRef.current) return;
      scrollGuardRef.current = true;
      const leftOffsets = buildOffsets(leftText);
      const rightOffsets = buildOffsets(rightText);
      const targetScroll = mapScrollPosition(
        scrollTop,
        "left",
        anchors,
        leftOffsets,
        rightOffsets
      );
      if (rightScrollRef.current) {
        rightScrollRef.current.scrollTop = targetScroll;
      }
      requestAnimationFrame(() => {
        scrollGuardRef.current = false;
      });
    },
    [syncScroll, anchors, leftText, rightText]
  );

  const handleRightScroll = useCallback(
    (scrollTop: number) => {
      if (!syncScroll || scrollGuardRef.current) return;
      scrollGuardRef.current = true;
      const leftOffsets = buildOffsets(leftText);
      const rightOffsets = buildOffsets(rightText);
      const targetScroll = mapScrollPosition(
        scrollTop,
        "right",
        anchors,
        leftOffsets,
        rightOffsets
      );
      if (leftScrollRef.current) {
        leftScrollRef.current.scrollTop = targetScroll;
      }
      requestAnimationFrame(() => {
        scrollGuardRef.current = false;
      });
    },
    [syncScroll, anchors, leftText, rightText]
  );

  useEffect(() => {
    if (chunks.length === 0) return;
    const chunk = chunks[currentChangeIndex];
    if (!chunk) return;

    const lineHeight = 24;

    if (leftScrollRef.current) {
      const container = leftScrollRef.current;
      const lineTop = chunk.leftLineStart * lineHeight;
      const chunkHeight = chunk.leftLineCount * lineHeight;
      const target = lineTop + chunkHeight / 2 - container.clientHeight / 2;
      container.scrollTop = Math.max(0, target);
    }

    if (rightScrollRef.current) {
      const container = rightScrollRef.current;
      const lineTop = chunk.rightLineStart * lineHeight;
      const chunkHeight = chunk.rightLineCount * lineHeight;
      const target = lineTop + chunkHeight / 2 - container.clientHeight / 2;
      container.scrollTop = Math.max(0, target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigationTrigger]);

  return (
    <div className="flex flex-col h-full">
      <Toolbar onSwap={handleSwap} onClear={handleClear} />
      <WarningBanner />
      <div className="flex flex-1 gap-2 p-2 min-h-0 overflow-hidden">
        <EditorPanel
          side="left"
          label={leftLabel}
          text={leftText}
          setText={setLeftText}
          filename={leftFilename}
          setFilename={setLeftFilename}
          chunks={chunks}
          currentChangeIndex={currentChangeIndex}
          showWhitespace={settings.showWhitespace}
          placeholder="Paste original text here…"
          scrollRef={leftScrollRef}
          onScroll={handleLeftScroll}
        />
        <EditorPanel
          side="right"
          label={rightLabel}
          text={rightText}
          setText={setRightText}
          filename={rightFilename}
          setFilename={setRightFilename}
          chunks={chunks}
          currentChangeIndex={currentChangeIndex}
          showWhitespace={settings.showWhitespace}
          placeholder="Paste modified text here…"
          scrollRef={rightScrollRef}
          onScroll={handleRightScroll}
        />
      </div>
      <StatsBar />
      <UndoToast
        visible={showToast}
        onUndo={handleUndo}
        onDismiss={handleDismissToast}
      />
    </div>
  );
}
