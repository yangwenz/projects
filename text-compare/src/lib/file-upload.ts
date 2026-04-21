const SUPPORTED_EXTENSIONS = new Set([
  ".txt",
  ".json",
  ".xml",
  ".csv",
  ".md",
  ".log",
  ".yaml",
  ".yml",
  ".html",
  ".css",
  ".js",
  ".ts",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult {
  const name = file.name;
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex === -1) {
    return { valid: false, error: "File has no extension" };
  }
  const ext = name.slice(dotIndex).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Unsupported file type: ${ext}. Supported: ${[...SUPPORTED_EXTENSIONS].join(", ")}`,
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    };
  }
  return { valid: true };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
