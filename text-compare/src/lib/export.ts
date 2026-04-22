import type { DiffChunk } from "@/types/diff";

export function generateUnifiedDiff(
  chunks: DiffChunk[],
  leftText: string,
  rightText: string
): string {
  const leftLines = leftText.split("\n");
  const rightLines = rightText.split("\n");
  const output: string[] = [];

  output.push("--- original");
  output.push("+++ modified");

  if (chunks.length === 0) {
    return output.join("\n");
  }

  let leftPos = 0;
  let rightPos = 0;

  for (const chunk of chunks) {
    const contextBefore = Math.min(3, chunk.leftLineStart - leftPos);
    const hunkLeftStart = chunk.leftLineStart - contextBefore;
    const hunkRightStart = chunk.rightLineStart - contextBefore;

    const contextAfterEnd = Math.min(
      chunk.leftLineStart + chunk.leftLineCount + 3,
      leftLines.length
    );
    const hunkLeftCount =
      chunk.leftLineCount + contextBefore + (contextAfterEnd - (chunk.leftLineStart + chunk.leftLineCount));
    const hunkRightCount =
      chunk.rightLineCount + contextBefore + (contextAfterEnd - (chunk.leftLineStart + chunk.leftLineCount));

    output.push(
      `@@ -${hunkLeftStart + 1},${hunkLeftCount} +${hunkRightStart + 1},${hunkRightCount} @@`
    );

    for (let i = hunkLeftStart; i < chunk.leftLineStart; i++) {
      output.push(` ${leftLines[i] ?? ""}`);
    }

    for (let i = chunk.leftLineStart; i < chunk.leftLineStart + chunk.leftLineCount; i++) {
      output.push(`-${leftLines[i] ?? ""}`);
    }
    for (let i = chunk.rightLineStart; i < chunk.rightLineStart + chunk.rightLineCount; i++) {
      output.push(`+${rightLines[i] ?? ""}`);
    }

    for (
      let i = chunk.leftLineStart + chunk.leftLineCount;
      i < contextAfterEnd;
      i++
    ) {
      output.push(` ${leftLines[i] ?? ""}`);
    }

    leftPos = contextAfterEnd;
    rightPos = chunk.rightLineStart + chunk.rightLineCount;
  }

  void rightPos;
  return output.join("\n");
}

export function generatePlainTextDiff(
  chunks: DiffChunk[],
  leftText: string,
  rightText: string
): string {
  const leftLines = leftText.split("\n");
  const rightLines = rightText.split("\n");
  const output: string[] = [];

  let leftPos = 0;

  for (const chunk of chunks) {
    for (let i = leftPos; i < chunk.leftLineStart; i++) {
      output.push(` ${leftLines[i]}`);
    }

    for (let i = chunk.leftLineStart; i < chunk.leftLineStart + chunk.leftLineCount; i++) {
      output.push(`-${leftLines[i] ?? ""}`);
    }
    for (let i = chunk.rightLineStart; i < chunk.rightLineStart + chunk.rightLineCount; i++) {
      output.push(`+${rightLines[i] ?? ""}`);
    }

    leftPos = chunk.leftLineStart + chunk.leftLineCount;
  }

  for (let i = leftPos; i < leftLines.length; i++) {
    output.push(` ${leftLines[i]}`);
  }

  void rightLines;
  return output.join("\n");
}

export function generateHtmlDiff(
  chunks: DiffChunk[],
  leftText: string,
  rightText: string
): string {
  const leftLines = leftText.split("\n");
  const rightLines = rightText.split("\n");
  const htmlLines: string[] = [];

  htmlLines.push("<!DOCTYPE html>");
  htmlLines.push("<html><head><style>");
  htmlLines.push(
    ".added { background-color: #d4edda; } .removed { background-color: #f8d7da; } pre { font-family: monospace; line-height: 1.5; }"
  );
  htmlLines.push("</style></head><body><pre>");

  let leftPos = 0;

  for (const chunk of chunks) {
    for (let i = leftPos; i < chunk.leftLineStart; i++) {
      htmlLines.push(escapeHtml(leftLines[i]));
    }

    for (let i = chunk.leftLineStart; i < chunk.leftLineStart + chunk.leftLineCount; i++) {
      htmlLines.push(
        `<span class="removed">-${escapeHtml(leftLines[i] ?? "")}</span>`
      );
    }
    for (let i = chunk.rightLineStart; i < chunk.rightLineStart + chunk.rightLineCount; i++) {
      htmlLines.push(
        `<span class="added">+${escapeHtml(rightLines[i] ?? "")}</span>`
      );
    }

    leftPos = chunk.leftLineStart + chunk.leftLineCount;
  }

  for (let i = leftPos; i < leftLines.length; i++) {
    htmlLines.push(escapeHtml(leftLines[i]));
  }

  htmlLines.push("</pre></body></html>");
  return htmlLines.join("\n");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
