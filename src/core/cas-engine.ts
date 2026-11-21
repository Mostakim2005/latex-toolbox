import { ComputeEngine } from "@cortex-js/compute-engine";
import type { CASResult } from "../types";

let engineSingleton: ComputeEngine | null = null;

function getEngine(): ComputeEngine {
  if (!engineSingleton) {
    engineSingleton = new ComputeEngine();
  }
  return engineSingleton;
}

export function casSimplify(latex: string): CASResult {
  try {
    const ce = getEngine();
    const expr = ce.parse(latex);
    const simplified = expr.simplify();
    const numeric = expr.N();
    return {
      ok: true,
      latex: simplified.latex,
      numeric: numeric.latex !== simplified.latex ? numeric.latex : undefined,
      steps: [
        { rel: "\\text{Input:}", expr: latex, note: "Parsed expression" },
        { rel: "=", expr: simplified.latex, note: "Simplified (CortexJS Compute Engine)" },
      ],
    };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}

export function casExpand(latex: string): CASResult {
  try {
    const ce = getEngine();
    const expr = ce.parse(latex);
    const expanded = ce.box(["Expand", expr]).evaluate();
    return {
      ok: true,
      latex: expanded.latex,
      steps: [
        { rel: "\\text{Input:}", expr: latex, note: "Original expression" },
        { rel: "=", expr: expanded.latex, note: "Expanded form" },
      ],
    };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}

export function casSolve(latex: string, variable = "x"): CASResult {
  try {
    const ce = getEngine();
    const expr = ce.parse(latex);
    const roots = expr.solve(variable);
    if (!roots || roots.length === 0) {
      return { ok: false, latex, error: `No symbolic solution found for ${variable}.` };
    }
    const solLatex = roots.map((r) => `${variable} = ${r.latex}`).join(",\\quad ");
    return {
      ok: true,
      latex: solLatex,
      steps: [
        { rel: "\\text{Equation:}", expr: latex, note: `Solve for ${variable}` },
        { rel: "\\implies", expr: solLatex, note: "Symbolic solution" },
      ],
    };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}

export function casDifferentiate(latex: string, variable = "x"): CASResult {
  try {
    const ce = getEngine();
    const expr = ce.parse(latex);
    const deriv = ce.box(["D", expr, variable]).evaluate();
    return {
      ok: true,
      latex: deriv.latex,
      steps: [
        { rel: "\\text{Given:}", expr: latex, note: `Differentiate w.r.t. ${variable}` },
        { rel: "\\implies", expr: `\\frac{d}{d${variable}}\\left(${latex}\\right) = ${deriv.latex}`, note: "Derivative" },
      ],
    };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}
