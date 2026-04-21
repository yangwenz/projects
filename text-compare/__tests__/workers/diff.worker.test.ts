import { computeDiff } from "@/lib/diff-computation";

describe("diff worker message handling", () => {
  it("returns a DiffResponse with matching id for a valid request", () => {
    const result = computeDiff(42, "hello", "world", "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.id).toBe(42);
      expect(result.chunks).toBeDefined();
      expect(result.stats).toBeDefined();
    }
  });

  it("returns a DiffError without computing for oversized input", () => {
    const largeText = "x".repeat(6 * 1024 * 1024);
    const result = computeDiff(99, largeText, "small", "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.id).toBe(99);
      expect(result.error).toContain("5 MB");
    }
  });

  it("produces different segment structures for different modes", () => {
    const left = "hello world";
    const right = "hello earth";

    const lineResult = computeDiff(1, left, right, "line", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    const wordResult = computeDiff(2, left, right, "word", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });
    const charResult = computeDiff(3, left, right, "character", {
      ignoreCase: false,
      ignoreWhitespace: false,
      ignoreEmptyLines: false,
    });

    expect("error" in lineResult).toBe(false);
    expect("error" in wordResult).toBe(false);
    expect("error" in charResult).toBe(false);

    if (!("error" in lineResult) && !("error" in wordResult) && !("error" in charResult)) {
      const lineSegTypes = lineResult.chunks.flatMap((c) =>
        c.segments.map((s) => s.type)
      );
      const wordSegTypes = wordResult.chunks.flatMap((c) =>
        c.segments.map((s) => s.type)
      );

      expect(lineSegTypes).not.toContain("modified");
      expect(wordSegTypes).toContain("modified");
    }
  });
});
