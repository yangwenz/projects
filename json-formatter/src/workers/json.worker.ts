import { WorkerRequest, WorkerResponse, FormatResult, MinifyResult } from "../lib/types";
import { validate, format, minify, computeStats } from "../lib/json-engine";
import { tokenize } from "../lib/syntax-highlight";

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;

  try {
    if (req.type === "format") {
      const { input, indent, sortKeys } = req.payload;
      const validation = validate(input);

      if (!validation.valid) {
        const response: WorkerResponse = {
          id: req.id,
          type: "format",
          result: {
            formatted: "",
            tokens: [],
            parsed: null,
            validation,
            stats: { byteSize: new Blob([input]).size, lineCount: 0, keyCount: 0, maxDepth: 0 },
          },
        };
        self.postMessage(response);
        return;
      }

      const formatted = format(input, indent, sortKeys);
      const tokens = tokenize(formatted);
      const parsed = JSON.parse(input);
      const stats = computeStats(input, formatted);

      const result: FormatResult = { formatted, tokens, parsed, validation, stats };
      const response: WorkerResponse = { id: req.id, type: "format", result };
      self.postMessage(response);
    } else if (req.type === "minify") {
      const { input } = req.payload;
      const result: MinifyResult = minify(input);
      const response: WorkerResponse = { id: req.id, type: "minify", result };
      self.postMessage(response);
    }
  } catch (err) {
    const response: WorkerResponse = {
      id: req.id,
      type: "error",
      error: (err as Error).message,
    };
    self.postMessage(response);
  }
};
