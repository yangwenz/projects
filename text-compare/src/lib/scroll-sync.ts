import type { DiffChunk } from "@/types/diff";

export interface AlignmentAnchor {
  leftLine: number;
  rightLine: number;
}

export function buildAlignmentAnchors(chunks: DiffChunk[]): AlignmentAnchor[] {
  const anchors: AlignmentAnchor[] = [{ leftLine: 0, rightLine: 0 }];
  let leftLine = 0;
  let rightLine = 0;

  for (const chunk of chunks) {
    if (chunk.leftLineStart > leftLine || chunk.rightLineStart > rightLine) {
      const equalLeft = chunk.leftLineStart - leftLine;
      const equalRight = chunk.rightLineStart - rightLine;
      const equalCount = Math.min(equalLeft, equalRight);
      for (let i = 0; i < equalCount; i++) {
        anchors.push({
          leftLine: leftLine + i,
          rightLine: rightLine + i,
        });
      }
      leftLine = chunk.leftLineStart;
      rightLine = chunk.rightLineStart;
    }

    anchors.push({ leftLine, rightLine });
    leftLine += chunk.leftLineCount;
    rightLine += chunk.rightLineCount;
  }

  return anchors;
}

export function findLineAtOffset(
  offsets: number[],
  scrollTop: number
): number {
  if (offsets.length === 0) return 0;
  if (scrollTop <= 0) return 0;

  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (offsets[mid] <= scrollTop) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

export function findEnclosingAnchor(
  anchors: AlignmentAnchor[],
  sourceSide: "left" | "right",
  sourceLine: number
): AlignmentAnchor {
  if (anchors.length === 0) return { leftLine: 0, rightLine: 0 };

  let lo = 0;
  let hi = anchors.length - 1;
  const key = sourceSide === "left" ? "leftLine" : "rightLine";

  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (anchors[mid][key] <= sourceLine) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return anchors[lo];
}

export function mapScrollPosition(
  sourceScrollTop: number,
  sourceSide: "left" | "right",
  anchors: AlignmentAnchor[],
  leftOffsets: number[],
  rightOffsets: number[]
): number {
  const sourceOffsets = sourceSide === "left" ? leftOffsets : rightOffsets;
  const targetOffsets = sourceSide === "left" ? rightOffsets : leftOffsets;

  if (sourceOffsets.length === 0 || targetOffsets.length === 0) {
    return sourceScrollTop;
  }

  const sourceLine = findLineAtOffset(sourceOffsets, sourceScrollTop);
  const anchor = findEnclosingAnchor(anchors, sourceSide, sourceLine);

  const lineOffset = sourceSide === "left"
    ? sourceLine - anchor.leftLine
    : sourceLine - anchor.rightLine;

  const targetLine = sourceSide === "left"
    ? anchor.rightLine + lineOffset
    : anchor.leftLine + lineOffset;

  const clampedTargetLine = Math.min(targetLine, targetOffsets.length - 1);
  const sourceLineTop = sourceOffsets[sourceLine] ?? 0;
  const pixelWithinLine = sourceScrollTop - sourceLineTop;
  const targetLineTop = targetOffsets[Math.max(0, clampedTargetLine)] ?? 0;

  return targetLineTop + pixelWithinLine;
}
