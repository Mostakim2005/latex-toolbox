import { normalizeChemicalFormulaInput } from "../taxonomy";

export interface ChemBalanceResult {
  ok: boolean;
  latex: string;
  balancedText: string;
  error?: string;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return Math.abs((a * b) / gcd(a, b));
}

export function parseChemicalFormulaCounts(rawFormula: string): Record<string, number> {
  const formula = normalizeChemicalFormulaInput(rawFormula).replace(/[_{}]/g, "");
  const stack: Array<Record<string, number>> = [{}];
  let i = 0;

  while (i < formula.length) {
    const ch = formula[i]!;
    if (ch === "(" || ch === "[") {
      stack.push({});
      i++;
    } else if (ch === ")" || ch === "]") {
      i++;
      let numStr = "";
      while (i < formula.length && /\d/.test(formula[i]!)) {
        numStr += formula[i]!;
        i++;
      }
      const mult = numStr ? parseInt(numStr, 10) : 1;
      const top = stack.pop() ?? {};
      const parent = stack[stack.length - 1]!;
      for (const [el, cnt] of Object.entries(top)) {
        parent[el] = (parent[el] ?? 0) + cnt * mult;
      }
    } else if (/[A-Z]/.test(ch)) {
      let el = ch;
      i++;
      if (i < formula.length && /[a-z]/.test(formula[i]!)) {
        el += formula[i]!;
        i++;
      }
      let numStr = "";
      while (i < formula.length && /\d/.test(formula[i]!)) {
        numStr += formula[i]!;
        i++;
      }
      const cnt = numStr ? parseInt(numStr, 10) : 1;
      const cur = stack[stack.length - 1]!;
      cur[el] = (cur[el] ?? 0) + cnt;
    } else {
      i++;
    }
  }
  return stack[0] ?? {};
}

/**
 * Exact rational Gaussian elimination to find the integer nullspace vector
 * for chemical reaction stoichiometry balancing.
 */
function solveStoichiometryNullspace(matrix: number[][], nCols: number): number[] | null {
  const m = matrix.length;
  if (m === 0 || nCols < 2) return null;

  // Use exact rational pairs [num, den]
  type Frac = [number, number];
  const norm = (a: number, b: number): Frac => {
    if (a === 0) return [0, 1];
    const sign = b < 0 ? -1 : 1;
    const g = gcd(a, b);
    return [(sign * a) / g, Math.abs(b) / g];
  };
  const add = (x: Frac, y: Frac): Frac => norm(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
  const sub = (x: Frac, y: Frac): Frac => norm(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
  const mul = (x: Frac, y: Frac): Frac => norm(x[0] * y[0], x[1] * y[1]);
  const div = (x: Frac, y: Frac): Frac => norm(x[0] * y[1], x[1] * y[0]);

  const A: Frac[][] = matrix.map((row) => row.map((v) => [v, 1]));
  const pivotCols: number[] = [];
  let rowIdx = 0;

  for (let col = 0; col < nCols && rowIdx < m; col++) {
    let pivot = -1;
    for (let r = rowIdx; r < m; r++) {
      if (A[r]![col]![0] !== 0) {
        pivot = r;
        break;
      }
    }
    if (pivot === -1) continue;
    [A[rowIdx], A[pivot]] = [A[pivot]!, A[rowIdx]!];
    const pivVal = A[rowIdx]![col]!;
    for (let c = col; c < nCols; c++) {
      A[rowIdx]![c] = div(A[rowIdx]![c]!, pivVal);
    }
    for (let r = 0; r < m; r++) {
      if (r === rowIdx) continue;
      const factor = A[r]![col]!;
      if (factor[0] === 0) continue;
      for (let c = col; c < nCols; c++) {
        A[r]![c] = sub(A[r]![c]!, mul(factor, A[rowIdx]![c]!));
      }
    }
    pivotCols.push(col);
    rowIdx++;
  }

  const pivotSet = new Set(pivotCols);
  const freeCols: number[] = [];
  for (let c = 0; c < nCols; c++) {
    if (!pivotSet.has(c)) freeCols.push(c);
  }
  if (freeCols.length !== 1) return null;

  const freeCol = freeCols[0]!;
  const sol: Frac[] = Array.from({ length: nCols }, () => [0, 1] as Frac);
  sol[freeCol] = [1, 1];
  for (let r = 0; r < pivotCols.length; r++) {
    const pCol = pivotCols[r]!;
    const coeff = A[r]![freeCol]!;
    sol[pCol] = add([0, 1], [-coeff[0], coeff[1]]);
  }

  let commonDen = 1;
  for (const [, den] of sol) {
    commonDen = lcm(commonDen, den);
  }
  const ints = sol.map(([num, den]) => Math.round((num * commonDen) / den));
  if (ints.some((v) => v <= 0)) {
    const flipped = ints.map((v) => -v);
    if (flipped.some((v) => v <= 0)) return null;
    const g = flipped.reduce((acc, v) => gcd(acc, v));
    return flipped.map((v) => v / g);
  }
  const g = ints.reduce((acc, v) => gcd(acc, v));
  return ints.map((v) => v / g);
}

/**
 * Balances a chemical reaction such as "H2SO4 + NaOH -> Na2SO4 + H2O"
 * and returns Obsidian-native mhchem LaTeX: \ce{H2SO4 + 2NaOH -> Na2SO4 + 2H2O}
 */
export function balanceChemicalEquation(rawReaction: string): ChemBalanceResult {
  const cleaned = (rawReaction || "")
    .replace(/^\\ce\{|\}$/g, "")
    .replace(/\\rightarrow|\\to|-->|=>|=/g, "->")
    .replace(/\\rightleftharpoons|<->|<=>/g, "<->")
    .trim();

  const arrow = cleaned.includes("<->") ? "<->" : "->";
  const parts = cleaned.split(arrow);
  if (parts.length !== 2) {
    return { ok: false, latex: rawReaction, balancedText: rawReaction, error: "Expected 'Reactants -> Products'." };
  }

  const stripLeadingCoeff = (s: string) => s.trim().replace(/^\d+\s*/, "");
  const reactants = parts[0]!.split("+").map(stripLeadingCoeff).filter(Boolean);
  const products = parts[1]!.split("+").map(stripLeadingCoeff).filter(Boolean);
  if (reactants.length === 0 || products.length === 0) {
    return { ok: false, latex: rawReaction, balancedText: rawReaction, error: "Both reactants and products are required." };
  }

  const species = [...reactants, ...products];
  const countsList = species.map(parseChemicalFormulaCounts);
  const elementSet = new Set<string>();
  for (const counts of countsList) {
    for (const el of Object.keys(counts)) elementSet.add(el);
  }
  const elements = Array.from(elementSet);
  const matrix: number[][] = elements.map((el) =>
    countsList.map((counts, idx) => {
      const c = counts[el] ?? 0;
      return idx < reactants.length ? c : -c;
    })
  );

  const coeffs = solveStoichiometryNullspace(matrix, species.length);
  if (!coeffs) {
    return {
      ok: false,
      latex: `\\ce{${cleaned}}`,
      balancedText: cleaned,
      error: "Could not find a unique positive integer stoichiometric balance.",
    };
  }

  const fmtSide = (items: string[], offset: number) =>
    items
      .map((sp, idx) => {
        const c = coeffs[offset + idx] ?? 1;
        const normSp = normalizeChemicalFormulaInput(sp).replace(/[_{}]/g, "");
        return c === 1 ? normSp : `${c}${normSp}`;
      })
      .join(" + ");

  const balancedText = `${fmtSide(reactants, 0)} ${arrow} ${fmtSide(products, reactants.length)}`;
  return {
    ok: true,
    latex: `\\ce{${balancedText}}`,
    balancedText,
  };
}
