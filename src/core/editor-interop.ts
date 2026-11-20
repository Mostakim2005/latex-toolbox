import type { App, Editor } from "obsidian";

export interface CompanionLatexPlugins {
  hasLatexSuite: boolean;
  hasQuickLatex: boolean;
}

export function detectCompanionLatexPlugins(app: App): CompanionLatexPlugins {
  const enabled: Set<string> | undefined = (app as unknown as { plugins?: { enabledPlugins?: Set<string> } }).plugins?.enabledPlugins;
  return {
    hasLatexSuite: Boolean(enabled?.has("obsidian-latex-suite") || enabled?.has("latex-suite")),
    hasQuickLatex: Boolean(enabled?.has("quick-latex") || enabled?.has("obsidian-quick-latex")),
  };
}

/**
 * Lightweight math-zone detector inspired by obsidian-latex-suite.
 * Checks whether the cursor is currently inside $...$ or $$...$$ outside code fences.
 */
export function isCursorInMathZone(editor: Editor): { inMath: boolean; isDisplay: boolean } {
  const cursor = editor.getCursor();
  const docText = editor.getValue();
  const offset = editor.posToOffset(cursor);
  const before = docText.slice(0, offset);

  // Bail out inside fenced code blocks
  const fences = before.match(/^\s*(?:```|~~~)/gm);
  if (fences && fences.length % 2 === 1) {
    return { inMath: false, isDisplay: false };
  }

  // Count unescaped $$ blocks before cursor
  const displayDelims = before.match(/(?<!\\)\$\$/g);
  if (displayDelims && displayDelims.length % 2 === 1) {
    return { inMath: true, isDisplay: true };
  }

  // Check current line for inline $...$
  const line = editor.getLine(cursor.line).slice(0, cursor.ch);
  const stripped = line.replace(/(?<!\\)\$\$/g, "");
  const singleDollars = stripped.match(/(?<!\\)\$/g);
  if (singleDollars && singleDollars.length % 2 === 1) {
    return { inMath: true, isDisplay: false };
  }

  return { inMath: false, isDisplay: false };
}
