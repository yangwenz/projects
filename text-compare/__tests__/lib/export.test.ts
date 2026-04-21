import {
  generateUnifiedDiff,
  generatePlainTextDiff,
  generateHtmlDiff,
} from "@/lib/export";
import { computeDiff } from "@/lib/diff-computation";
import type { DiffChunk } from "@/types/diff";

function getChunks(left: string, right: string): DiffChunk[] {
  const result = computeDiff(1, left, right, "line", {
    ignoreCase: false,
    ignoreWhitespace: false,
    ignoreEmptyLines: false,
  });
  if ("error" in result) return [];
  return result.chunks;
}

describe("generateUnifiedDiff", () => {
  it("produces standard unified diff format with headers and @@ hunks", () => {
    const left = "line1\nline2\nline3";
    const right = "line1\nmodified\nline3";
    const chunks = getChunks(left, right);
    const output = generateUnifiedDiff(chunks, left, right);

    expect(output).toContain("--- original");
    expect(output).toContain("+++ modified");
    expect(output).toContain("@@");
    expect(output).toContain("-line2");
    expect(output).toContain("+modified");
  });

  it("produces minimal output for identical texts", () => {
    const text = "same\ncontent";
    const chunks = getChunks(text, text);
    const output = generateUnifiedDiff(chunks, text, text);

    expect(output).toContain("--- original");
    expect(output).toContain("+++ modified");
    expect(output).not.toContain("@@");
  });

  it("handles multi-chunk diffs in order", () => {
    const left = "a\nb\nc\nd\ne\nf\ng";
    const right = "a\nB\nc\nd\ne\nF\ng";
    const chunks = getChunks(left, right);
    const output = generateUnifiedDiff(chunks, left, right);

    const hunkMatches = output.match(/@@/g);
    expect(hunkMatches).not.toBeNull();
    expect(hunkMatches!.length).toBeGreaterThanOrEqual(1);
  });
});

describe("generatePlainTextDiff", () => {
  it("prefixes added lines with + and removed with -", () => {
    const left = "hello\nworld";
    const right = "hello\nearth";
    const chunks = getChunks(left, right);
    const output = generatePlainTextDiff(chunks, left, right);

    expect(output).toContain("-world");
    expect(output).toContain("+earth");
  });

  it("leaves unchanged lines prefixed with space", () => {
    const left = "hello\nworld";
    const right = "hello\nearth";
    const chunks = getChunks(left, right);
    const output = generatePlainTextDiff(chunks, left, right);

    expect(output).toContain(" hello");
  });
});

describe("generateHtmlDiff", () => {
  it("contains styled span elements with correct class names", () => {
    const left = "hello\nworld";
    const right = "hello\nearth";
    const chunks = getChunks(left, right);
    const output = generateHtmlDiff(chunks, left, right);

    expect(output).toContain('class="removed"');
    expect(output).toContain('class="added"');
    expect(output).toContain("<html>");
    expect(output).toContain("<style>");
  });

  it("escapes HTML characters in content", () => {
    const left = "<div>hello</div>";
    const right = "<div>world</div>";
    const chunks = getChunks(left, right);
    const output = generateHtmlDiff(chunks, left, right);

    expect(output).toContain("&lt;div&gt;");
  });

  it("produces valid HTML for identical texts", () => {
    const text = "same";
    const chunks = getChunks(text, text);
    const output = generateHtmlDiff(chunks, text, text);

    expect(output).toContain("<!DOCTYPE html>");
    expect(output).toContain("</html>");
  });
});
