import { TreeNode } from "./types";

function getType(
  value: unknown
): "string" | "number" | "boolean" | "null" | "object" | "array" {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as "string" | "number" | "boolean" | "object";
}

function escapeKey(key: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return `.${key}`;
  return `["${key}"]`;
}

export function buildTree(value: unknown, key: string = "$", path: string = "$"): TreeNode {
  const type = getType(value);

  if (type === "object" && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const children = Object.keys(obj).map((k) => {
      const childPath = path + escapeKey(k);
      return buildTree(obj[k], k, childPath);
    });
    return { key, path, type: "object", children };
  }

  if (type === "array") {
    const arr = value as unknown[];
    const children = arr.map((item, idx) => {
      const childPath = `${path}[${idx}]`;
      return buildTree(item, `[${idx}]`, childPath);
    });
    return { key, path, type: "array", children };
  }

  return { key, path, type, value };
}
