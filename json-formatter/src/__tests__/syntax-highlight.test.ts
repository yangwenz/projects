import { tokenize } from "@/lib/syntax-highlight";

describe("tokenize", () => {
  it("tokenizes string values with correct type", () => {
    const tokens = tokenize('"hello"');
    const stringTokens = tokens.filter((t) => t.type === "string");
    expect(stringTokens.length).toBe(1);
    expect(stringTokens[0].text).toBe('"hello"');
  });

  it("tokenizes integer numbers", () => {
    const tokens = tokenize("42");
    expect(tokens).toContainEqual({ text: "42", type: "number" });
  });

  it("tokenizes float numbers", () => {
    const tokens = tokenize("3.14");
    expect(tokens).toContainEqual({ text: "3.14", type: "number" });
  });

  it("tokenizes negative numbers", () => {
    const tokens = tokenize("-7");
    expect(tokens).toContainEqual({ text: "-7", type: "number" });
  });

  it("tokenizes exponent numbers", () => {
    const tokens = tokenize("1e10");
    expect(tokens).toContainEqual({ text: "1e10", type: "number" });
  });

  it("tokenizes true, false, null as distinct types", () => {
    const tokens = tokenize("true");
    expect(tokens).toContainEqual({ text: "true", type: "boolean" });

    const tokens2 = tokenize("false");
    expect(tokens2).toContainEqual({ text: "false", type: "boolean" });

    const tokens3 = tokenize("null");
    expect(tokens3).toContainEqual({ text: "null", type: "null" });
  });

  it("tokenizes object keys as key type", () => {
    const tokens = tokenize('{"name": "value"}');
    const keyTokens = tokens.filter((t) => t.type === "key");
    expect(keyTokens.length).toBe(1);
    expect(keyTokens[0].text).toBe('"name"');
  });

  it("tokenizes braces, brackets, colons, commas as punctuation", () => {
    const tokens = tokenize('{"a": [1, 2]}');
    const punctuation = tokens
      .filter((t) => t.type === "punctuation")
      .map((t) => t.text.trim())
      .filter((t) => t.length > 0);
    expect(punctuation).toContain("{");
    expect(punctuation).toContain("}");
    expect(punctuation).toContain("[");
    expect(punctuation).toContain("]");
    expect(punctuation).toContain(":");
    expect(punctuation).toContain(",");
  });

  it("full round-trip: concatenating all token texts reproduces the original", () => {
    const original = '{\n  "name": "test",\n  "count": 42,\n  "active": true,\n  "data": null\n}';
    const tokens = tokenize(original);
    const reconstructed = tokens.map((t) => t.text).join("");
    expect(reconstructed).toBe(original);
  });
});
