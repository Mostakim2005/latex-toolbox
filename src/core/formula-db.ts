import * as math from "mathjs";
import type { FormulaEntry } from "../types";
import rawDb from "../data/stem-formula-db.json";

const READONLY_DB: readonly FormulaEntry[] = Object.freeze(
  (rawDb as FormulaEntry[]).map((entry) => Object.freeze(entry))
);

export function getAllFormulas(): readonly FormulaEntry[] {
  return READONLY_DB;
}

export interface FormulaSearchFilter {
  query?: string;
  branch?: string;
  level?: string;
}

export function searchFormulaDatabase(filter: FormulaSearchFilter = {}): FormulaEntry[] {
  const q = (filter.query ?? "").trim().toLowerCase();
  const branch = (filter.branch ?? "all").toLowerCase();
  const level = (filter.level ?? "all").toLowerCase();

  return READONLY_DB.filter((item) => {
    if (branch !== "all" && item.branch !== branch) return false;
    if (level !== "all" && item.level !== level) return false;
    if (!q) return true;

    const hay = [
      item.name,
      item.topic,
      item.definition,
      item.latex,
      ...(item.tags ?? []),
      ...(item.variables?.map((v) => `${v.symbol} ${v.meaning} ${v.unit ?? ""}`) ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return q.split(/\s+/).every((word) => hay.includes(word));
  });
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
