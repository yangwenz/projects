import { computeDiff } from "@/lib/diff-computation";

describe("computeDiff", () => {
  it("returns zero chunks and zero stats for identical inputs", () => {
    const result = computeDiff(1, "hello\nworld", "hello\nworld", "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.chunks).toHaveLength(0);
      expect(result.stats).toEqual({
        additions: 0,
        deletions: 0,
      });
    }
  });

  it("detects a single line added", () => {
    const result = computeDiff(2, "line1\nline2", "line1\nline2\nline3", "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.chunks.length).toBeGreaterThan(0);
      const chunkWithAdds = result.chunks.find((c) => c.rightLineCount > 0);
      expect(chunkWithAdds).toBeDefined();
      expect(result.stats.additions).toBeGreaterThan(0);
    }
  });

  it("detects a single line removed", () => {
    const result = computeDiff(3, "line1\nline2\nline3", "line1\nline2", "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      const chunkWithRemovals = result.chunks.find((c) => c.leftLineCount > 0);
      expect(chunkWithRemovals).toBeDefined();
      expect(result.stats.deletions).toBeGreaterThan(0);
    }
  });

  it("produces word-level segments in word mode", () => {
    const result = computeDiff(4, "hello world", "hello earth", "word", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.chunks.length).toBeGreaterThan(0);
      const hasAddedOrRemoved = result.chunks.some((c) =>
        c.segments.some((s) => s.type === "added" || s.type === "removed")
      );
      expect(hasAddedOrRemoved).toBe(true);
    }
  });

  it("produces character-level segments in character mode", () => {
    const result = computeDiff(5, "cat", "car", "character", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.chunks.length).toBeGreaterThan(0);
      const hasAddedOrRemoved = result.chunks.some((c) =>
        c.segments.some((s) => s.type === "added" || s.type === "removed")
      );
      expect(hasAddedOrRemoved).toBe(true);
    }
  });

  it("treats texts as equal when ignoreCase is enabled", () => {
    const result = computeDiff(6, "Hello", "hello", "line", {
      ignoreCase: true,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.chunks).toHaveLength(0);
    }
  });

  it("ignores leading/trailing whitespace when ignoreWhitespace is enabled", () => {
    const result = computeDiff(7, "  hello  ", "hello", "line", {
      ignoreCase: false,
      ignoreWhitespace: true,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.chunks).toHaveLength(0);
    }
  });

  it("ignores empty lines when ignoreEmptyLines is enabled", () => {
    const result = computeDiff(8, "hello\n\nworld", "hello\nworld", "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: true,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.chunks).toHaveLength(0);
    }
  });

  it("returns a DiffError when input exceeds 5 MB", () => {
    const largeText = "a".repeat(6 * 1024 * 1024);
    const result = computeDiff(9, largeText, "small", "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Input exceeds 5 MB limit");
    }
  });

  it("returns a DiffError when input exceeds 100k lines", () => {
    const manyLines = Array(100_001).fill("line").join("\n");
    const result = computeDiff(10, manyLines, "small", "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error).toBe("Input exceeds 100,000 line limit");
    }
  });
});
