import * as Diff from "diff";
import type {
  DiffMode,
  DiffOptions,
  DiffChunk,
  DiffSegment,
  DiffStats,
  DiffResponse,
  DiffError,
} from "@/types/diff";

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_LINES = 100_000;

export function computeDiff(
  id: number,
  leftText: string,
  rightText: string,
  mode: DiffMode,
  options: DiffOptions
): DiffResponse | DiffError {
  if (leftText.length > MAX_SIZE || rightText.length > MAX_SIZE) {
    return { id, error: "Input exceeds 5 MB limit" };
  }
  if (
    leftText.split("\n").length > MAX_LINES ||
    rightText.split("\n").length > MAX_LINES
  ) {
    return { id, error: "Input exceeds 100,000 line limit" };
  }

  let left = leftText;
  let right = rightText;
  if (options.ignoreCase) {
    left = left.toLowerCase();
    right = right.toLowerCase();
  }

  if (options.ignoreEmptyLines) {
    const filterEmpty = (text: string) =>
      text
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("\n");
    left = filterEmpty(left);
    right = filterEmpty(right);
  }

  if (options.ignoreWhitespace) {
    const normalizeWs = (text: string) =>
      text
        .split("\n")
        .map((line) => line.trim().replace(/\s+/g, " "))
        .join("\n");
    left = normalizeWs(left);
    right = normalizeWs(right);
  }

  if (mode === "line") {
    return computeLineDiff(id, left, right);
  } else if (mode === "word") {
    return computeWordDiff(id, left, right);
  } else {
    return computeCharDiff(id, left, right);
  }
}

function computeLineDiff(
  id: number,
  left: string,
  right: string
): DiffResponse {
  const changes = Diff.diffLines(left, right);
  const chunks: DiffChunk[] = [];
  const stats: DiffStats = { additions: 0, deletions: 0 };
  let leftLine = 0;
  let rightLine = 0;

  let i = 0;
  while (i < changes.length) {
    const change = changes[i];
    const lines = change.value.replace(/\n$/, "").split("\n");
    const lineCount = change.count ?? lines.length;

    if (!change.added && !change.removed) {
      leftLine += lineCount;
      rightLine += lineCount;
      i++;
    } else if (
      change.removed &&
      i + 1 < changes.length &&
      changes[i + 1].added
    ) {
      const removedLines = lines;
      const removedCount = lineCount;
      const addedChange = changes[i + 1];
      const addedLines = addedChange.value.replace(/\n$/, "").split("\n");
      const addedCount = addedChange.count ?? addedLines.length;

      const segments: DiffSegment[] = [
        ...removedLines.map((line) => ({
          value: line,
          type: "removed" as const,
        })),
        ...addedLines.map((line) => ({
          value: line,
          type: "added" as const,
        })),
      ];

      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: removedCount,
        rightLineStart: rightLine,
        rightLineCount: addedCount,
        segments,
      });
      stats.deletions += removedCount;
      stats.additions += addedCount;
      leftLine += removedCount;
      rightLine += addedCount;
      i += 2;
    } else if (change.added) {
      const segments: DiffSegment[] = lines.map((line) => ({
        value: line,
        type: "added" as const,
      }));
      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: 0,
        rightLineStart: rightLine,
        rightLineCount: lineCount,
        segments,
      });
      stats.additions += lineCount;
      rightLine += lineCount;
      i++;
    } else {
      const segments: DiffSegment[] = lines.map((line) => ({
        value: line,
        type: "removed" as const,
      }));
      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: lineCount,
        rightLineStart: rightLine,
        rightLineCount: 0,
        segments,
      });
      stats.deletions += lineCount;
      leftLine += lineCount;
      i++;
    }
  }

  return { id, chunks, stats };
}

function computeWordDiff(
  id: number,
  left: string,
  right: string
): DiffResponse {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const lineChanges = Diff.diffLines(left, right);

  const chunks: DiffChunk[] = [];
  const stats: DiffStats = { additions: 0, deletions: 0 };
  let leftLine = 0;
  let rightLine = 0;

  let i = 0;
  while (i < lineChanges.length) {
    const change = lineChanges[i];
    const lines = change.value.replace(/\n$/, "").split("\n");
    const lineCount = change.count ?? lines.length;

    if (!change.added && !change.removed) {
      leftLine += lineCount;
      rightLine += lineCount;
      i++;
    } else if (
      change.removed &&
      i + 1 < lineChanges.length &&
      lineChanges[i + 1].added
    ) {
      const removedLines = lines;
      const addedChange = lineChanges[i + 1];
      const addedLines = addedChange.value.replace(/\n$/, "").split("\n");
      const removedCount = lineCount;
      const addedCount = addedChange.count ?? addedLines.length;

      const segments: DiffSegment[] = [];
      const maxLines = Math.max(removedCount, addedCount);
      for (let j = 0; j < maxLines; j++) {
        const leftContent = j < removedCount ? removedLines[j] : "";
        const rightContent = j < addedCount ? addedLines[j] : "";
        if (j < removedCount && j < addedCount) {
          const wordDiffs = Diff.diffWords(leftContent, rightContent);
          for (const wd of wordDiffs) {
            if (!wd.added && !wd.removed) {
              segments.push({ value: wd.value, type: "equal" });
            } else if (wd.removed) {
              segments.push({ value: wd.value, type: "removed" });
            } else if (wd.added) {
              segments.push({ value: wd.value, type: "added" });
            }
          }
          stats.deletions++;
          stats.additions++;
        } else if (j >= removedCount) {
          segments.push({ value: rightContent, type: "added" });
          stats.additions++;
        } else {
          segments.push({ value: leftContent, type: "removed" });
          stats.deletions++;
        }
        if (j < maxLines - 1) {
          segments.push({ value: "\n", type: "equal" });
        }
      }

      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: removedCount,
        rightLineStart: rightLine,
        rightLineCount: addedCount,
        segments,
      });
      leftLine += removedCount;
      rightLine += addedCount;
      i += 2;
    } else if (change.added) {
      const segments: DiffSegment[] = lines.map((line) => ({
        value: line,
        type: "added" as const,
      }));
      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: 0,
        rightLineStart: rightLine,
        rightLineCount: lineCount,
        segments,
      });
      stats.additions += lineCount;
      rightLine += lineCount;
      i++;
    } else {
      const segments: DiffSegment[] = lines.map((line) => ({
        value: line,
        type: "removed" as const,
      }));
      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: lineCount,
        rightLineStart: rightLine,
        rightLineCount: 0,
        segments,
      });
      stats.deletions += lineCount;
      leftLine += lineCount;
      i++;
    }
  }

  void leftLines;
  void rightLines;
  return { id, chunks, stats };
}

function computeCharDiff(
  id: number,
  left: string,
  right: string
): DiffResponse {
  const lineChanges = Diff.diffLines(left, right);

  const chunks: DiffChunk[] = [];
  const stats: DiffStats = { additions: 0, deletions: 0 };
  let leftLine = 0;
  let rightLine = 0;

  let i = 0;
  while (i < lineChanges.length) {
    const change = lineChanges[i];
    const lines = change.value.replace(/\n$/, "").split("\n");
    const lineCount = change.count ?? lines.length;

    if (!change.added && !change.removed) {
      leftLine += lineCount;
      rightLine += lineCount;
      i++;
    } else if (
      change.removed &&
      i + 1 < lineChanges.length &&
      lineChanges[i + 1].added
    ) {
      const removedLines = lines;
      const addedChange = lineChanges[i + 1];
      const addedLines = addedChange.value.replace(/\n$/, "").split("\n");
      const removedCount = lineCount;
      const addedCount = addedChange.count ?? addedLines.length;

      const segments: DiffSegment[] = [];
      const maxLines = Math.max(removedCount, addedCount);
      for (let j = 0; j < maxLines; j++) {
        const leftContent = j < removedCount ? removedLines[j] : "";
        const rightContent = j < addedCount ? addedLines[j] : "";
        if (j < removedCount && j < addedCount) {
          const charDiffs = Diff.diffChars(leftContent, rightContent);
          for (const cd of charDiffs) {
            if (!cd.added && !cd.removed) {
              segments.push({ value: cd.value, type: "equal" });
            } else if (cd.removed) {
              segments.push({ value: cd.value, type: "removed" });
            } else if (cd.added) {
              segments.push({ value: cd.value, type: "added" });
            }
          }
          stats.deletions++;
          stats.additions++;
        } else if (j >= removedCount) {
          segments.push({ value: rightContent, type: "added" });
          stats.additions++;
        } else {
          segments.push({ value: leftContent, type: "removed" });
          stats.deletions++;
        }
        if (j < maxLines - 1) {
          segments.push({ value: "\n", type: "equal" });
        }
      }

      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: removedCount,
        rightLineStart: rightLine,
        rightLineCount: addedCount,
        segments,
      });
      leftLine += removedCount;
      rightLine += addedCount;
      i += 2;
    } else if (change.added) {
      const segments: DiffSegment[] = lines.map((line) => ({
        value: line,
        type: "added" as const,
      }));
      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: 0,
        rightLineStart: rightLine,
        rightLineCount: lineCount,
        segments,
      });
      stats.additions += lineCount;
      rightLine += lineCount;
      i++;
    } else {
      const segments: DiffSegment[] = lines.map((line) => ({
        value: line,
        type: "removed" as const,
      }));
      chunks.push({
        leftLineStart: leftLine,
        leftLineCount: lineCount,
        rightLineStart: rightLine,
        rightLineCount: 0,
        segments,
      });
      stats.deletions += lineCount;
      leftLine += lineCount;
      i++;
    }
  }

  return { id, chunks, stats };
}
