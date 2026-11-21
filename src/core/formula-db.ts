import * as math from "mathjs";
import type { FormulaEntry } from "../types";
import rawDb from "../data/stem-formula-db.json";

const READONLY_DB: readonly FormulaEntry[] = Object.freeze(
  (rawDb as FormulaEntry[]).map((entry) => Object.freeze(entry))
);

export type FormulaVisualShape =
  | "all"
  | "fraction"
  | "sqrt"
  | "exp-log"
  | "trig"
  | "greek"
  | "integral-sum";

export type FormulaSortMode =
  | "relevance"
  | "syllabus"
  | "topic"
  | "name"
  | "visual";

export function getAllFormulas(): readonly FormulaEntry[] {
  return READONLY_DB;
}

/**
 * Classifies a formula by its visual mathematical structure ("picture" patterns).
 */
export function classifyFormulaShapes(entry: FormulaEntry): FormulaVisualShape[] {
  const shapes: FormulaVisualShape[] = [];
  const src = `${entry.latex} ${entry.calcExpr}`;
  if (/\\frac|\//.test(src)) shapes.push("fraction");
  if (/\\sqrt|sqrt\(/.test(src)) shapes.push("sqrt");
  if (/\\ln|\\log|\\exp|exp\(|log10|log2|e\^|\^\{/.test(src)) shapes.push("exp-log");
  if (/\\sin|\\cos|\\tan|\\arcsin|sin\(|cos\(|tan\(|asin\(/.test(src)) shapes.push("trig");
  if (/\\(?:alpha|beta|gamma|delta|Delta|varepsilon|epsilon|zeta|eta|theta|lambda|mu|nu|pi|rho|sigma|tau|phi|omega|Omega)\b/.test(src)) {
    shapes.push("greek");
  }
  if (/\\int|\\sum|\\binom|combinations\(|factorial\(/.test(src)) shapes.push("integral-sum");
  return shapes;
}

/**
 * Normalizes natural-language, WolframAlpha, and SymPy expressions into comparable tokens.
 * e.g. "1/2*m*v**2" -> ["0.5", "m", "v^2", "1/2", "mv2"]
 */
function normalizeMathQuery(raw: string): string[] {
  const s = (raw || "")
    .trim()
    .toLowerCase()
    .replace(/\*\*/g, "^")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)")
    .replace(/\\(?:left|right|text|mathrm|mathbf|,|;|!)/g, "")
    .replace(/[{}$]/g, " ");

  const rawTokens = s.split(/[\s,;]+/).filter(Boolean);
  const expanded = new Set<string>(rawTokens);

  // Add Wolfram / SymPy / natural math aliases
  const compact = s.replace(/\s+/g, "");
  if (compact) expanded.add(compact);
  if (compact.includes("1/2") || compact.includes("0.5")) {
    expanded.add("0.5");
    expanded.add("1/2");
  }
  if (/sqrt|root|√/.test(s)) expanded.add("sqrt");
  if (/integrate|integral|∫/.test(s)) expanded.add("integral");
  if (/log|ln|ph/.test(s)) expanded.add("log");
  if (/sin|cos|tan/.test(s)) expanded.add("trig");
  if (/ohm|v=ir|ir/.test(compact)) expanded.add("ohm");
  if (/pv=nrt|nrt/.test(compact)) expanded.add("ideal");
  if (/mc|dt|heat/.test(compact)) expanded.add("heat");
  if (/lc|2pi|f0|resonan/.test(compact)) expanded.add("resonance");

  return Array.from(expanded);
}

const LEVEL_RANK: Record<string, number> = {
  "o-level": 1,
  "a-level-ib": 2,
  "eee-basics": 3,
};

const BRANCH_RANK: Record<string, number> = {
  physics: 1,
  chemistry: 2,
  math: 3,
  eee: 4,
};

export interface FormulaSearchFilter {
  query?: string;
  branch?: string;
  level?: string;
  visualShape?: FormulaVisualShape;
  sortBy?: FormulaSortMode;
}

export function searchFormulaDatabase(filter: FormulaSearchFilter = {}): FormulaEntry[] {
  const q = (filter.query ?? "").trim();
  const branch = (filter.branch ?? "all").toLowerCase();
  const level = (filter.level ?? "all").toLowerCase();
  const visualShape = filter.visualShape ?? "all";
  const sortBy = filter.sortBy ?? "relevance";
  const queryTokens = normalizeMathQuery(q);
  const qLower = q.toLowerCase();
  const qCompact = qLower.replace(/\s+/g, "").replace(/\*\*/g, "^");

  const scored = READONLY_DB.filter((item) => {
    if (branch !== "all" && item.branch !== branch) return false;
    if (level !== "all" && item.level !== level) return false;
    if (visualShape !== "all" && !classifyFormulaShapes(item).includes(visualShape)) return false;
    return true;
  })
    .map((item) => {
      if (!q) return { item, score: 1 };

      const exprCompact = item.calcExpr.toLowerCase().replace(/\s+/g, "");
      const latexCompact = item.latex.toLowerCase().replace(/\$\{\d+:|\}|\s+/g, "");
      const hay = [
        item.name,
        item.topic,
        item.definition,
        item.latex,
        item.calcExpr,
        item.outputSymbol,
        item.outputUnit ?? "",
        ...(item.tags ?? []),
        ...(item.variables.map((v) => `${v.key} ${v.symbol} ${v.meaning} ${v.unit ?? ""}`)),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      if (item.name.toLowerCase().includes(qLower)) score += 12;
      if (qCompact && (exprCompact.includes(qCompact) || latexCompact.includes(qCompact))) score += 15;
      if (item.topic.toLowerCase().includes(qLower)) score += 6;
      if ((item.tags ?? []).some((t) => t.toLowerCase() === qLower)) score += 10;

      for (const tok of queryTokens) {
        if (tok.length < 1) continue;
        if (exprCompact.includes(tok) || latexCompact.includes(tok)) score += 4;
        else if (hay.includes(tok)) score += 2;
      }

      return { item, score };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => {
    if (sortBy === "relevance" && q) {
      if (b.score !== a.score) return b.score - a.score;
    }
    if (sortBy === "syllabus" || (sortBy === "relevance" && !q)) {
      const br = (BRANCH_RANK[a.item.branch] ?? 9) - (BRANCH_RANK[b.item.branch] ?? 9);
      if (br !== 0) return br;
      const lr = (LEVEL_RANK[a.item.level] ?? 9) - (LEVEL_RANK[b.item.level] ?? 9);
      if (lr !== 0) return lr;
      return a.item.topic.localeCompare(b.item.topic) || a.item.name.localeCompare(b.item.name);
    }
    if (sortBy === "topic") {
      return a.item.topic.localeCompare(b.item.topic) || a.item.name.localeCompare(b.item.name);
    }
    if (sortBy === "name") {
      return a.item.name.localeCompare(b.item.name);
    }
    if (sortBy === "visual") {
      const sa = classifyFormulaShapes(a.item).join(",");
      const sb = classifyFormulaShapes(b.item).join(",");
      return sa.localeCompare(sb) || a.item.name.localeCompare(b.item.name);
    }
    return a.item.name.localeCompare(b.item.name);
  });

  return scored.map((x) => x.item);
}

export interface FormulaCalcResult {
  ok: boolean;
  formatted: string;
  latexResult: string;
  error?: string;
}

/**
 * Evaluates a formula entry numerically using Math.js with user-supplied variable values.
 */
export function evaluateFormulaEntry(
  entry: FormulaEntry,
  values: Record<string, number>
): FormulaCalcResult {
  try {
    const scope: Record<string, number> = {};
    for (const v of entry.variables) {
      const val = values[v.key];
      if (typeof val !== "number" || !Number.isFinite(val)) {
        return {
          ok: false,
          formatted: "",
          latexResult: "",
          error: `Missing or invalid numeric value for ${v.meaning} (${v.key}).`,
        };
      }
      scope[v.key] = val;
    }

    const rawVal: unknown = math.evaluate(entry.calcExpr, scope);
    const formatted = math.format(rawVal, { precision: 6 });
    const unitPart = entry.outputUnit ? `\\text{ ${entry.outputUnit}}` : "";
    const latexResult = `${entry.outputSymbol} = ${formatted}${unitPart}`;
    return { ok: true, formatted, latexResult };
  } catch (err) {
    return {
      ok: false,
      formatted: "",
      latexResult: "",
      error: `Calculation error: ${String(err)}`,
    };
  }
}
