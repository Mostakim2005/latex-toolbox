/**
 * Fence- and inline-code-aware AI LaTeX delimiter normalizer.
 * Converts \(...\) -> $...$ and \[...\] -> $$\n...\n$$ while skipping
 * fenced code blocks (``` / ~~~), inline backtick spans, and currency ($50).
 */
export function normalizeDelimiters(content: string): string {
  if (!content) return "";
  let result = "";
  let i = 0;

  while (i < content.length) {
    // Skip fenced code blocks
    if (content.startsWith("```", i) || content.startsWith("~~~", i)) {
      const fence = content.slice(i, i + 3);
      const end = content.indexOf(fence, i + 3);
      if (end === -1) {
        result += content.slice(i);
        break;
      }
      result += content.slice(i, end + 3);
      i = end + 3;
      continue;
    }

    // Skip exact-length inline code spans on the same line
    if (content[i] === "`") {
      let tickCount = 0;
      while (i + tickCount < content.length && content[i + tickCount] === "`") tickCount++;
      const tickSeq = "`".repeat(tickCount);
      const lineEnd = content.indexOf("\n", i + tickCount);
      const endCode = content.indexOf(tickSeq, i + tickCount);
      if (endCode !== -1 && (lineEnd === -1 || endCode < lineEnd)) {
        result += content.slice(i, endCode + tickCount);
        i = endCode + tickCount;
        continue;
      }
      result += tickSeq;
      i += tickCount;
      continue;
    }

    // Display math \[ ... \] -> $$\n...\n$$
    if (content.startsWith("\\[", i)) {
      const endBlock = content.indexOf("\\]", i + 2);
      if (endBlock !== -1) {
        result += "$$\n" + content.slice(i + 2, endBlock).trim() + "\n$$";
        i = endBlock + 2;
        continue;
      }
    }

    // Inline math \( ... \) -> $...$
    if (content.startsWith("\\(", i)) {
      const endInline = content.indexOf("\\)", i + 2);
      if (endInline !== -1) {
        result += "$" + content.slice(i + 2, endInline).trim() + "$";
        i = endInline + 2;
        continue;
      }
    }

    result += content[i];
    i++;
  }

  return result;
}

export function wrapMath(latex: string, style: "inline" | "block"): string {
  const t = (latex || "").trim();
  if (!t) return "";
  if (t.startsWith("$$") && t.endsWith("$$")) return t;
  if (t.startsWith("$") && t.endsWith("$")) return t;
  return style === "inline" ? `$${t}$` : `$$\n${t}\n$$`;
}
