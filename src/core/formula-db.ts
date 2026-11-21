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
