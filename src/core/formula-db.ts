import { ComputeEngine } from "@cortex-js/compute-engine";
import * as math from "mathjs";
import type { FormulaEntry, FormulaVariable } from "../types";
import rawDb from "../data/stem-formula-db.json";
import defaultPresets from "../presets/default-presets.json";

export interface ExtendedFormulaEntry extends FormulaEntry {
  wolfram?: string;
  matlab?: string;
  source?: "curated" | "presets";
  originalLevel?: string;
}

interface RawPresetSnippet {
  id?: string;
  name?: string;
  label?: string;
  trigger?: string;
  aliases?: string[];
  latex?: string;
  domain?: string;
  topic?: string;
  subtopic?: string;
  level?: string;
  wolfram?: string;
  matlab?: string;
  description?: string;
}

function mapPresetBranch(domain?: string): FormulaEntry["branch"] | null {
  const d = (domain ?? "").toLowerCase();
  if (d === "math") return "math";
  if (d === "physics") return "physics";
  if (d === "chemistry") return "chemistry";
  if (d === "electronics" || d === "eee" || d === "electrical") return "eee";
  return null;
}

function mapPresetLevel(level?: string, branch?: FormulaEntry["branch"]): FormulaEntry["level"] {
  if (branch === "eee") return "eee-basics";
  const l = (level ?? "").toLowerCase();
  if (l.includes("o-level") || l.includes("grade 9") || l.includes("grade 10")) return "o-level";
  if (l.includes("basic ee") || l.includes("eng yr") || l.includes("uni")) return "eee-basics";
  return "a-level-ib";
}

function extractAutoVariables(latex: string): { outputSymbol: string; rhsLatex: string; vars: FormulaVariable[] } {
  const clean = latex.replace(/\$\{\d+:([^}]+)\}/g, "$1").replace(/\$\{\d+\}/g, "x");
  const eqParts = clean.split("=");
  const outputSymbol = eqParts.length >= 2 && eqParts[0]!.trim().length <= 16 ? eqParts[0]!.trim() : "y";
  const rhsLatex = eqParts.length >= 2 ? eqParts.slice(1).join("=").trim() : clean.trim();

  // Extract single-letter or simple subscript variable tokens from RHS
  const stripped = rhsLatex
    .replace(/\\(?:sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|log|ln|exp|sqrt|frac|left|right|text|mathrm|mathbf|operatorname|cdot|times|pm|mp|pi|infty|int|sum|prod|lim|partial|ce|quad|qquad|begin|end|aligned|pmatrix|bmatrix)\b/g, " ")
    .replace(/\\(?:alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|lambda|mu|nu|xi|rho|sigma|tau|phi|psi|omega)\b/g, (m) => ` ${m.slice(1)} `);

  const seen = new Set<string>();
  const vars: FormulaVariable[] = [];
  const matches = stripped.match(/\b[a-zA-Z]\b/g) ?? [];
  for (const m of matches) {
    if (["e", "i", "j", "d"].includes(m) || seen.has(m)) continue;
    seen.add(m);
    vars.push({ key: m, symbol: m, meaning: `Variable ${m}`, defaultValue: 1 });
    if (vars.length >= 6) break;
  }
  return { outputSymbol, rhsLatex, vars };
}

function buildUnifiedDatabase(): readonly ExtendedFormulaEntry[] {
  const curated: ExtendedFormulaEntry[] = (rawDb as FormulaEntry[]).map((e) => ({
    ...e,
    source: "curated",
  }));

  const seenNames = new Set(curated.map((c) => c.name.toLowerCase()));
  const seenIds = new Set(curated.map((c) => c.id.toLowerCase()));

  const rawSnippets = (defaultPresets as { snippets?: RawPresetSnippet[]; templates?: RawPresetSnippet[] }).snippets ?? [];
  const rawTemplates = (defaultPresets as { snippets?: RawPresetSnippet[]; templates?: RawPresetSnippet[] }).templates ?? [];
  const allPresets = [...rawSnippets, ...rawTemplates];

  const merged: ExtendedFormulaEntry[] = [...curated];

  for (const item of allPresets) {
    const branch = mapPresetBranch(item.domain);
    if (!branch) continue; // Skip non-STEM (e.g. english)
    const name = (item.name || item.label || item.trigger || "").trim();
    const latex = (item.latex || "").trim();
    if (!name || !latex) continue;

    const id = `preset-${item.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (seenIds.has(id) || seenNames.has(name.toLowerCase())) continue;
    seenIds.add(id);
    seenNames.add(name.toLowerCase());

    const auto = extractAutoVariables(latex);
    const topic = item.subtopic || item.topic || branch.toUpperCase();
    const defParts: string[] = [];
    if (item.description) defParts.push(item.description);
    else if (item.label && item.label !== name) defParts.push(item.label);
    else defParts.push(`${topic} formula (${item.level || "STEM"}).`);
    if (item.wolfram) defParts.push(`Wolfram: ${item.wolfram}`);

    const tags = [
      ...(item.aliases ?? []),
      item.trigger ?? "",
      item.topic ?? "",
      item.subtopic ?? "",
      item.wolfram ?? "",
      item.matlab ?? "",
    ].filter(Boolean);

    merged.push({
      id,
      name,
      branch,
      level: mapPresetLevel(item.level, branch),
      originalLevel: item.level,
      topic,
      latex,
      definition: defParts.join(" — "),
      outputSymbol: auto.outputSymbol,
      calcExpr: "", // Evaluated dynamically via Compute Engine when empty
      variables: auto.vars,
      tags,
      wolfram: item.wolfram,
      matlab: item.matlab,
      source: "presets",
    });
  }

  return Object.freeze(merged.map((entry) => Object.freeze(entry)));
}

const READONLY_DB: readonly ExtendedFormulaEntry[] = buildUnifiedDatabase();

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

export function getAllFormulas(): readonly ExtendedFormulaEntry[] {
  return READONLY_DB;
}

/**
 * Classifies a formula by its visual mathematical structure ("picture" patterns).
 */
export function classifyFormulaShapes(entry: ExtendedFormulaEntry): FormulaVisualShape[] {
  const shapes: FormulaVisualShape[] = [];
  const src = `${entry.latex} ${entry.calcExpr} ${entry.wolfram ?? ""}`;
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
  curatedOnly?: boolean;
}

export function searchFormulaDatabase(filter: FormulaSearchFilter = {}): ExtendedFormulaEntry[] {
  const q = (filter.query ?? "").trim();
  const branch = (filter.branch ?? "all").toLowerCase();
  const level = (filter.level ?? "all").toLowerCase();
  const visualShape = filter.visualShape ?? "all";
  const sortBy = filter.sortBy ?? "relevance";
  const queryTokens = normalizeMathQuery(q);
  const qLower = q.toLowerCase();
  const qCompact = qLower.replace(/\s+/g, "").replace(/\*\*/g, "^");

  const scored = READONLY_DB.filter((item) => {
    if (filter.curatedOnly && item.source !== "curated") return false;
    if (branch !== "all" && item.branch !== branch) return false;
    if (level !== "all" && item.level !== level) return false;
    if (visualShape !== "all" && !classifyFormulaShapes(item).includes(visualShape)) return false;
    return true;
  })
    .map((item) => {
      if (!q) return { item, score: item.source === "curated" ? 2 : 1 };

      const exprCompact = `${item.calcExpr} ${item.wolfram ?? ""} ${item.matlab ?? ""}`.toLowerCase().replace(/\s+/g, "");
      const latexCompact = item.latex.toLowerCase().replace(/\$\{\d+:|\}|\s+/g, "");
      const hay = [
        item.name,
        item.topic,
        item.definition,
        item.latex,
        item.calcExpr,
        item.wolfram ?? "",
        item.matlab ?? "",
        item.originalLevel ?? "",
        item.outputSymbol,
        item.outputUnit ?? "",
        ...(item.tags ?? []),
        ...(item.variables.map((v) => `${v.key} ${v.symbol} ${v.meaning} ${v.unit ?? ""}`)),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      if (item.name.toLowerCase().includes(qLower)) score += 12;
      if (qCompact && (exprCompact.includes(qCompact) || latexCompact.includes(qCompact))) score += 16;
      if (item.wolfram && item.wolfram.toLowerCase().includes(qLower)) score += 14;
      if (item.matlab && item.matlab.toLowerCase().includes(qLower)) score += 12;
      if (item.topic.toLowerCase().includes(qLower)) score += 6;
      if ((item.tags ?? []).some((t) => t.toLowerCase() === qLower)) score += 10;

      for (const tok of queryTokens) {
        if (tok.length < 1) continue;
        if (exprCompact.includes(tok) || latexCompact.includes(tok)) score += 4;
        else if (hay.includes(tok)) score += 2;
      }

      if (score > 0 && item.source === "curated") score += 1;
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

let ceEvalSingleton: ComputeEngine | null = null;
function getCe(): ComputeEngine {
  if (!ceEvalSingleton) ceEvalSingleton = new ComputeEngine();
  return ceEvalSingleton;
}

/**
 * Evaluates both curated formulas (via Math.js calcExpr) and merged preset formulas
 * (dynamically via CortexJS Compute Engine substitution on the RHS LaTeX).
 */
export function evaluateFormulaEntry(
  entry: ExtendedFormulaEntry,
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

    if (entry.calcExpr) {
      const rawVal: unknown = math.evaluate(entry.calcExpr, scope);
      const formatted = math.format(rawVal, { precision: 6 });
      const unitPart = entry.outputUnit ? `\\text{ ${entry.outputUnit}}` : "";
      const latexResult = `${entry.outputSymbol} = ${formatted}${unitPart}`;
      return { ok: true, formatted, latexResult };
    }

    // Dynamic symbolic evaluation for merged preset formulas via Compute Engine
    const { rhsLatex } = extractAutoVariables(entry.latex);
    const ce = getCe();
    const parsed = ce.parse(rhsLatex);
    const substituted = parsed.subs(scope).N();
    const formatted = substituted.latex;
    return {
      ok: true,
      formatted,
      latexResult: `${entry.outputSymbol} = ${formatted}`,
    };
  } catch (err) {
    return {
      ok: false,
      formatted: "",
      latexResult: "",
      error: `Calculation error: ${String(err)}`,
    };
  }
}
