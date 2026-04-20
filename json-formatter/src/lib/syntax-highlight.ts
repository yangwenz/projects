import { HighlightToken } from "./types";

export function tokenize(json: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let i = 0;

  function readString(): string {
    let result = '"';
    i++; // skip opening quote
    while (i < json.length) {
      const ch = json[i];
      if (ch === "\\") {
        result += ch + (json[i + 1] ?? "");
        i += 2;
        continue;
      }
      if (ch === '"') {
        result += '"';
        i++;
        return result;
      }
      result += ch;
      i++;
    }
    return result;
  }

  function readNumber(): string {
    let result = "";
    while (
      i < json.length &&
      /[-+\d.eE]/.test(json[i])
    ) {
      result += json[i];
      i++;
    }
    return result;
  }

  function readLiteral(word: string): string {
    const slice = json.slice(i, i + word.length);
    i += word.length;
    return slice;
  }

  let expectKey = false;

  while (i < json.length) {
    const ch = json[i];

    if (/\s/.test(ch)) {
      let ws = "";
      while (i < json.length && /\s/.test(json[i])) {
        ws += json[i];
        i++;
      }
      tokens.push({ text: ws, type: "punctuation" });
      continue;
    }

    if (ch === "{") {
      tokens.push({ text: "{", type: "punctuation" });
      i++;
      expectKey = true;
      continue;
    }

    if (ch === "}") {
      tokens.push({ text: "}", type: "punctuation" });
      i++;
      expectKey = false;
      continue;
    }

    if (ch === "[") {
      tokens.push({ text: "[", type: "punctuation" });
      i++;
      expectKey = false;
      continue;
    }

    if (ch === "]") {
      tokens.push({ text: "]", type: "punctuation" });
      i++;
      expectKey = false;
      continue;
    }

    if (ch === ":") {
      tokens.push({ text: ":", type: "punctuation" });
      i++;
      expectKey = false;
      continue;
    }

    if (ch === ",") {
      tokens.push({ text: ",", type: "punctuation" });
      i++;
      // After a comma inside an object, next string is a key.
      // We look back to see if we're in an object context.
      // A simpler heuristic: expectKey stays based on the parent context.
      // We'll set expectKey based on whether the last open bracket was { or [.
      const lastOpen = findLastOpen(tokens);
      expectKey = lastOpen === "{";
      continue;
    }

    if (ch === '"') {
      const str = readString();
      if (expectKey) {
        tokens.push({ text: str, type: "key" });
        expectKey = false;
      } else {
        tokens.push({ text: str, type: "string" });
      }
      continue;
    }

    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      const num = readNumber();
      tokens.push({ text: num, type: "number" });
      continue;
    }

    if (json.slice(i, i + 4) === "true") {
      tokens.push({ text: readLiteral("true"), type: "boolean" });
      continue;
    }

    if (json.slice(i, i + 5) === "false") {
      tokens.push({ text: readLiteral("false"), type: "boolean" });
      continue;
    }

    if (json.slice(i, i + 4) === "null") {
      tokens.push({ text: readLiteral("null"), type: "null" });
      continue;
    }

    // Unknown character, consume it
    tokens.push({ text: ch, type: "punctuation" });
    i++;
  }

  return tokens;
}

function findLastOpen(tokens: HighlightToken[]): string | null {
  let depth = 0;
  for (let j = tokens.length - 1; j >= 0; j--) {
    const t = tokens[j].text;
    if (t === "}" || t === "]") depth++;
    if (t === "{" || t === "[") {
      if (depth === 0) return t;
      depth--;
    }
  }
  return null;
}
