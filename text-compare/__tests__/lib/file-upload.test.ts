import { validateFile } from "@/lib/file-upload";

function makeFile(name: string, size: number): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type: "text/plain" });
}

describe("validateFile", () => {
  it("accepts a valid .txt file under 5 MB", () => {
    const file = makeFile("test.txt", 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts .json files", () => {
    const file = makeFile("data.json", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .md files", () => {
    const file = makeFile("readme.md", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .ts files", () => {
    const file = makeFile("index.ts", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .yaml files", () => {
    const file = makeFile("config.yaml", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .yml files", () => {
    const file = makeFile("config.yml", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .xml files", () => {
    const file = makeFile("data.xml", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .csv files", () => {
    const file = makeFile("data.csv", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .log files", () => {
    const file = makeFile("app.log", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .html files", () => {
    const file = makeFile("page.html", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .css files", () => {
    const file = makeFile("style.css", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("accepts .js files", () => {
    const file = makeFile("app.js", 100);
    expect(validateFile(file).valid).toBe(true);
  });

  it("rejects unsupported extension (.exe)", () => {
    const file = makeFile("malware.exe", 100);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Unsupported file type");
  });

  it("rejects file exceeding 5 MB", () => {
    const file = makeFile("big.txt", 6 * 1024 * 1024);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("5 MB");
  });

  it("rejects file with no extension", () => {
    const file = makeFile("noext", 100);
    const result = validateFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("no extension");
  });

  it("accepts an empty file (0 bytes)", () => {
    const file = makeFile("empty.txt", 0);
    const result = validateFile(file);
    expect(result.valid).toBe(true);
  });
});
