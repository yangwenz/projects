import { validate, format, minify, computeStats } from "@/lib/json-engine";

describe("validate", () => {
  it("returns valid for correct JSON", () => {
    expect(validate('{"a":1}')).toEqual({ valid: true });
  });

  it("returns error with line/column for missing closing brace", () => {
    const result = validate('{"a":1');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.line).toBeGreaterThanOrEqual(1);
      expect(result.column).toBeGreaterThanOrEqual(1);
      expect(result.message).toBeTruthy();
    }
  });

  it("returns error for trailing comma", () => {
    const result = validate('{"a":1,}');
    expect(result.valid).toBe(false);
  });

  it("returns error for empty string", () => {
    const result = validate("");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message).toBe("Empty input");
    }
  });

  it("returns error for bare words like undefined", () => {
    expect(validate("undefined").valid).toBe(false);
  });
});

describe("format", () => {
  it("formats minified JSON with 2-space indent", () => {
    const result = format('{"a":1,"b":2}', 2);
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("formats with 4-space indent", () => {
    const result = format('{"a":1}', 4);
    expect(result).toBe('{\n    "a": 1\n}');
  });

  it("formats with tab indent", () => {
    const result = format('{"a":1}', "tab");
    expect(result).toBe('{\n\t"a": 1\n}');
  });

  it("sorts keys ascending", () => {
    const result = format('{"b":1,"a":2}', 2, "asc");
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(["a", "b"]);
  });

  it("sorts keys descending", () => {
    const result = format('{"a":1,"b":2}', 2, "desc");
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(["b", "a"]);
  });

  it("preserves all JSON types", () => {
    const input = JSON.stringify({
      s: "hello",
      n: 42,
      f: 3.14,
      t: true,
      fa: false,
      nu: null,
      o: { nested: 1 },
      a: [1, 2, 3],
    });
    const result = format(input);
    const parsed = JSON.parse(result);
    expect(parsed.s).toBe("hello");
    expect(parsed.n).toBe(42);
    expect(parsed.f).toBe(3.14);
    expect(parsed.t).toBe(true);
    expect(parsed.fa).toBe(false);
    expect(parsed.nu).toBe(null);
    expect(parsed.o).toEqual({ nested: 1 });
    expect(parsed.a).toEqual([1, 2, 3]);
  });

  it("handles deeply nested structures", () => {
    let obj: Record<string, unknown> = { value: "deep" };
    for (let i = 0; i < 12; i++) {
      obj = { nested: obj };
    }
    const input = JSON.stringify(obj);
    const result = format(input);
    expect(JSON.parse(result)).toEqual(obj);
  });
});

describe("minify", () => {
  it("strips all whitespace from formatted JSON", () => {
    const formatted = '{\n  "a": 1,\n  "b": 2\n}';
    const { minified } = minify(formatted);
    expect(minified).toBe('{"a":1,"b":2}');
  });

  it("returns correct original and minified byte counts", () => {
    const input = '{\n  "a": 1\n}';
    const result = minify(input);
    expect(result.originalSize).toBe(new Blob([input]).size);
    expect(result.minifiedSize).toBe(new Blob([result.minified]).size);
    expect(result.minifiedSize).toBeLessThan(result.originalSize);
  });

  it("round-trips: minify(format(input)) === minify(input)", () => {
    const raw = '{"a":1,"b":[2,3]}';
    const formatted = format(raw);
    expect(minify(formatted).minified).toBe(minify(raw).minified);
  });
});

describe("computeStats", () => {
  it("computes correct byte size including multi-byte UTF-8", () => {
    const input = '{"emoji":"😀"}';
    const formatted = format(input);
    const stats = computeStats(input, formatted);
    expect(stats.byteSize).toBe(new Blob([input]).size);
  });

  it("counts lines in formatted output", () => {
    const input = '{"a":1,"b":2}';
    const formatted = format(input);
    const stats = computeStats(input, formatted);
    expect(stats.lineCount).toBe(formatted.split("\n").length);
  });

  it("counts all keys across nested objects", () => {
    const input = '{"a":{"b":1,"c":2},"d":3}';
    const formatted = format(input);
    const stats = computeStats(input, formatted);
    expect(stats.keyCount).toBe(4);
  });

  it("reports correct max depth", () => {
    const input = '{"a":{"b":{"c":1}}}';
    const formatted = format(input);
    const stats = computeStats(input, formatted);
    expect(stats.maxDepth).toBe(3);
  });

  it("empty object returns keyCount 0, depth 1", () => {
    const input = "{}";
    const formatted = format(input);
    const stats = computeStats(input, formatted);
    expect(stats.keyCount).toBe(0);
    expect(stats.maxDepth).toBe(1);
  });

  it("empty array returns keyCount 0, depth 1", () => {
    const input = "[]";
    const formatted = format(input);
    const stats = computeStats(input, formatted);
    expect(stats.keyCount).toBe(0);
    expect(stats.maxDepth).toBe(1);
  });
});
