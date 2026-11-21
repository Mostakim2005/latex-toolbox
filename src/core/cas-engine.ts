import { ComputeEngine } from "@cortex-js/compute-engine";
import * as math from "mathjs";
import type { CASBackendMode, CASOperation, CASResult } from "../types";
import { runSymPyOperation } from "./sympy-bridge";

// Lazy-loaded Nerdamer with Algebra, Calculus, and Solve modules
interface NerdamerExpr {
  toTeX: () => string;
  text: () => string;
  evaluate: () => NerdamerExpr;
}
interface NerdamerLib {
  (expr: string): NerdamerExpr;
  convertFromLaTeX: (latex: string) => NerdamerExpr;
  integrate: (expr: string, variable: string) => NerdamerExpr;
  diff: (expr: string, variable: string) => NerdamerExpr;
  solve: (expr: string, variable: string) => NerdamerExpr;
  factor: (expr: string) => NerdamerExpr;
  expand: (expr: string) => NerdamerExpr;
  partfrac: (expr: string, variable: string) => NerdamerExpr;
  limit: (expr: string, variable: string, point: string) => NerdamerExpr;
}

let engineSingleton: ComputeEngine | null = null;
let nerdamerSingleton: NerdamerLib | null = null;

function getEngine(): ComputeEngine {
  if (!engineSingleton) {
    engineSingleton = new ComputeEngine();
  }
  return engineSingleton;
}

function getNerdamer(): NerdamerLib | null {
  if (nerdamerSingleton) return nerdamerSingleton;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nerdamer exposes CommonJS entry point for lazy loading
    const nerdamer = require("nerdamer") as NerdamerLib;
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nerdamer Algebra submodule registers via CommonJS side effect
    require("nerdamer/Algebra");
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nerdamer Calculus submodule registers via CommonJS side effect
    require("nerdamer/Calculus");
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Nerdamer Solve submodule registers via CommonJS side effect
    require("nerdamer/Solve");
    nerdamerSingleton = nerdamer;
    return nerdamerSingleton;
  } catch {
    return null;
  }
}

/**
 * Smart variable detector: inspects LaTeX and returns the most likely independent variable
 * (e.g., t, s, x, y, theta, omega) instead of hardcoding x.
 */
export function detectPrimaryVariable(latex: string): string {
  const cleaned = (latex || "")
    .replace(/\\(?:sin|cos|tan|cot|sec|csc|log|ln|exp|sqrt|frac|left|right|text|operatorname|cdot|times|pi|infty|int|sum|prod|lim|partial|mathrm|mathbf|ce)\b/g, " ")
    .replace(/\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|omega|phi|psi|sigma|tau)\b/g, (m) => ` ${m.slice(1)} `);

  // Check differential dx / dt / ds first
  const diffMatch = cleaned.match(/\bd([a-zA-Z])\b/);
  if (diffMatch?.[1] && !["e", "i", "j"].includes(diffMatch[1])) {
    return diffMatch[1];
  }

  const preferredOrder = ["x", "t", "s", "y", "z", "u", "v", "n", "k", "theta", "omega"];
  const tokens = cleaned.match(/\b[a-zA-Z]+\b/g) ?? [];
  const tokenSet = new Set(tokens);
  for (const v of preferredOrder) {
    if (tokenSet.has(v)) return v;
  }
  for (const tok of tokens) {
    if (tok.length === 1 && !["e", "i", "j", "d"].includes(tok)) return tok;
  }
  return "x";
}

function latexToNerdamerText(latex: string): string {
  const nerdamer = getNerdamer();
  if (!nerdamer) return latex;
  try {
    return nerdamer.convertFromLaTeX(latex).text();
  } catch {
    return latex
      .replace(/\\cdot/g, "*")
      .replace(/\\times/g, "*")
      .replace(/\\left|\\right/g, "")
      .replace(/\\pi/g, "pi");
  }
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
      engine: "CortexJS Compute Engine",
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
      engine: "CortexJS Compute Engine",
      steps: [
        { rel: "\\text{Input:}", expr: latex, note: "Original expression" },
        { rel: "=", expr: expanded.latex, note: "Expanded form" },
      ],
    };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}

export function casFactor(latex: string): CASResult {
  const nerdamer = getNerdamer();
  if (!nerdamer) return { ok: false, latex, error: "Nerdamer CAS module unavailable." };
  try {
    const src = latexToNerdamerText(latex);
    const factored = nerdamer.factor(src);
    return {
      ok: true,
      latex: factored.toTeX(),
      engine: "Nerdamer Algebra",
      steps: [
        { rel: "\\text{Input:}", expr: latex, note: "Original expression" },
        { rel: "=", expr: factored.toTeX(), note: "Factored form" },
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
    if (roots && roots.length > 0) {
      const solLatex = roots.map((r) => `${variable} = ${r.latex}`).join(",\\quad ");
      return {
        ok: true,
        latex: solLatex,
        engine: "CortexJS Compute Engine",
        steps: [
          { rel: "\\text{Equation:}", expr: latex, note: `Solve for ${variable}` },
          { rel: "\\implies", expr: solLatex, note: "Symbolic solution" },
        ],
      };
    }
  } catch {
    // Fall through to Nerdamer solver
  }

  const nerdamer = getNerdamer();
  if (nerdamer) {
    try {
      const src = latexToNerdamerText(latex);
      const sol = nerdamer.solve(src, variable);
      return {
        ok: true,
        latex: `${variable} = ${sol.toTeX()}`,
        engine: "Nerdamer Solve",
      };
    } catch (err) {
      return { ok: false, latex, error: String(err) };
    }
  }
  return { ok: false, latex, error: `No symbolic solution found for ${variable}.` };
}

export function casDifferentiate(latex: string, variable = "x"): CASResult {
  try {
    const ce = getEngine();
    const expr = ce.parse(latex);
    const deriv = ce.box(["D", expr, variable]).evaluate();
    return {
      ok: true,
      latex: deriv.latex,
      engine: "CortexJS Compute Engine",
      steps: [
        { rel: "\\text{Given:}", expr: latex, note: `Differentiate w.r.t. ${variable}` },
        { rel: "\\implies", expr: `\\frac{d}{d${variable}}\\left(${latex}\\right) = ${deriv.latex}`, note: "Derivative" },
      ],
    };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}

export function casIntegrate(latex: string, variable = "x", bounds?: { lower: string; upper: string }): CASResult {
  const nerdamer = getNerdamer();
  if (!nerdamer) {
    return { ok: false, latex, error: "Nerdamer Calculus module unavailable." };
  }
  try {
    const src = latexToNerdamerText(latex);
    if (bounds && bounds.lower.trim() && bounds.upper.trim()) {
      const defCmd = `defint(${src}, ${bounds.lower.trim()}, ${bounds.upper.trim()}, ${variable})`;
      const res = nerdamer(defCmd);
      const num = res.evaluate().text();
      return {
        ok: true,
        latex: res.toTeX(),
        numeric: num !== res.text() ? num : undefined,
        engine: "Nerdamer Calculus",
        steps: [
          { rel: "\\text{Definite Integral:}", expr: `\\int_{${bounds.lower}}^{${bounds.upper}} ${latex}\\,d${variable}`, note: `Integrate w.r.t. ${variable}` },
          { rel: "=", expr: res.toTeX(), note: "Evaluated definite integral" },
        ],
      };
    }

    const anti = nerdamer.integrate(src, variable);
    const outLatex = `${anti.toTeX()} + C`;
    return {
      ok: true,
      latex: outLatex,
      engine: "Nerdamer Calculus",
      steps: [
        { rel: "\\text{Integral:}", expr: `\\int ${latex}\\,d${variable}`, note: `Indefinite integral w.r.t. ${variable}` },
        { rel: "=", expr: outLatex, note: "Antiderivative" },
      ],
    };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}

export function casPartialFractions(latex: string, variable = "x"): CASResult {
  const nerdamer = getNerdamer();
  if (!nerdamer) return { ok: false, latex, error: "Nerdamer Algebra module unavailable." };
  try {
    const src = latexToNerdamerText(latex);
    const res = nerdamer.partfrac(src, variable);
    return { ok: true, latex: res.toTeX(), engine: "Nerdamer Algebra" };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}

export function casLimit(latex: string, variable = "x", point = "0"): CASResult {
  const nerdamer = getNerdamer();
  if (!nerdamer) return { ok: false, latex, error: "Nerdamer Calculus module unavailable." };
  try {
    const src = latexToNerdamerText(latex);
    const res = nerdamer.limit(src, variable, point);
    return { ok: true, latex: res.toTeX(), engine: "Nerdamer Calculus" };
  } catch (err) {
    return { ok: false, latex, error: String(err) };
  }
}

export function casNumeric(latex: string): CASResult {
  try {
    const ce = getEngine();
    const num = ce.parse(latex).N();
    return { ok: true, latex: num.latex, numeric: num.latex, engine: "CortexJS Compute Engine" };
  } catch {
    try {
      const val: unknown = math.evaluate(latexToNerdamerText(latex));
      const str = math.format(val, { precision: 10 });
      return { ok: true, latex: str, numeric: str, engine: "Math.js" };
    } catch (err) {
      return { ok: false, latex, error: String(err) };
    }
  }
}

/**
 * EEE Phasor Converter: converts rectangular (3 + 4j) <-> polar (5∠53.13°)
 */
export function casPhasorConvert(input: string, imagUnit: "j" | "i" = "j"): CASResult {
  try {
    const cleaned = input.replace(/\\angle/g, "∠").replace(/\^?\\circ|°/g, "").trim();
    const polarMatch = cleaned.match(/^([-+]?\d*\.?\d+)\s*(?:∠|<)\s*([-+]?\d*\.?\d+)$/);
    if (polarMatch?.[1] && polarMatch[2]) {
      const r = parseFloat(polarMatch[1]);
      const deg = parseFloat(polarMatch[2]);
      const rad = (deg * Math.PI) / 180;
      const re = Number((r * Math.cos(rad)).toFixed(4));
      const im = Number((r * Math.sin(rad)).toFixed(4));
      const sign = im >= 0 ? "+" : "-";
      const rectLatex = `${re} ${sign} ${imagUnit}${Math.abs(im)}`;
      return { ok: true, latex: rectLatex, engine: "Math.js Phasor" };
    }

    // Parse rectangular a + bj or a + jb
    const normalized = cleaned.replace(/j(\d)/g, "$1i").replace(/j\b/g, "i");
    const evaluated = math.evaluate(normalized) as math.Complex | number;
    const c = typeof evaluated === "number" ? math.complex(evaluated, 0) : math.complex(evaluated);
    const polar = c.toPolar();
    const mag = Number(polar.r.toFixed(4));
    const deg = Number(((polar.phi * 180) / Math.PI).toFixed(2));
    return {
      ok: true,
      latex: `${mag}\\angle ${deg}^{\\circ}`,
      numeric: `${c.re.toFixed(4)} ${c.im >= 0 ? "+" : "-"} ${imagUnit}${Math.abs(c.im).toFixed(4)}`,
      engine: "Math.js Phasor",
    };
  } catch (err) {
    return { ok: false, latex: input, error: `Phasor parse error: ${String(err)}` };
  }
}

/**
 * Unit evaluator / converter using Math.js (e.g. "5 kOhm * 2 mA to V" or "100 km/h to m/s")
 */
export function casUnitConvert(input: string): CASResult {
  try {
    const res: unknown = math.evaluate(input);
    const formatted = math.format(res, { precision: 6 });
    return { ok: true, latex: `\\text{${formatted}}`, numeric: formatted, engine: "Math.js Units" };
  } catch (err) {
    return { ok: false, latex: input, error: `Unit evaluation error: ${String(err)}` };
  }
}

/**
 * Matrix operations (det, inv) from LaTeX matrix or MATLAB syntax [[1,2],[3,4]]
 */
export function casMatrixOp(input: string, op: "matrix_det" | "matrix_inv"): CASResult {
  try {
    let rows: number[][];
    if (input.includes("\\begin{")) {
      const inner = input.replace(/\\begin\{[pbvB]?matrix\}/g, "").replace(/\\end\{[pbvB]?matrix\}/g, "").trim();
      rows = inner.split("\\\\").map((r) => r.split("&").map((c) => Number(math.evaluate(c.trim()))));
    } else {
      rows = math.evaluate(input) as number[][];
    }

    if (op === "matrix_det") {
      const d = math.det(rows);
      return { ok: true, latex: String(Number(d.toFixed(6))), engine: "Math.js Matrix" };
    }
    const inv = math.inv(rows);
    const latexRows = inv.map((r) => r.map((v) => Number(v.toFixed(4))).join(" & ")).join(" \\\\ ");
    return { ok: true, latex: `\\begin{pmatrix} ${latexRows} \\end{pmatrix}`, engine: "Math.js Matrix" };
  } catch (err) {
    return { ok: false, latex: input, error: `Matrix error: ${String(err)}` };
  }
}

export interface RunCASOptions {
  variable?: string;
  lower?: string;
  upper?: string;
  point?: string;
  order?: number;
  backend?: CASBackendMode;
  pythonExecutable?: string;
  imagUnit?: "j" | "i";
}

const SYMPY_ONLY_OPS = new Set<CASOperation>(["laplace", "ilaplace", "fourier", "dsolve", "series", "matrix_eig"]);

/**
 * Unified Two-Tier CAS Dispatcher:
 * - Tier 1 (Bundled JS): Instant offline evaluation via Compute Engine + Nerdamer + Math.js
 * - Tier 2 (Local Python/SymPy): Full university/engineering CAS for Laplace, Fourier, ODEs, Series, Eigenvalues
 */
export async function runCASOperation(
  op: CASOperation,
  latex: string,
  opts: RunCASOptions = {}
): Promise<CASResult> {
  const variable = opts.variable || detectPrimaryVariable(latex);
  const backend = opts.backend ?? "js-only";

  if (SYMPY_ONLY_OPS.has(op)) {
    if (backend !== "hybrid-python") {
      return {
        ok: false,
        latex,
        error: `'${op}' requires the Full Desktop CAS (Python + SymPy). Enable 'Hybrid Python/SymPy' in LaTeX Toolbox Settings.`,
      };
    }
    return runSymPyOperation(op, latex, {
      pythonExecutable: opts.pythonExecutable,
      variable,
      lower: opts.lower,
      upper: opts.upper,
      point: opts.point,
      order: opts.order,
    });
  }

  let res: CASResult;
  switch (op) {
    case "simplify":
      res = casSimplify(latex);
      break;
    case "expand":
      res = casExpand(latex);
      break;
    case "factor":
      res = casFactor(latex);
      break;
    case "solve":
      res = casSolve(latex, variable);
      break;
    case "diff":
      res = casDifferentiate(latex, variable);
      break;
    case "integrate":
      res = casIntegrate(latex, variable);
      break;
    case "defint":
      res = casIntegrate(latex, variable, { lower: opts.lower ?? "0", upper: opts.upper ?? "1" });
      break;
    case "limit":
      res = casLimit(latex, variable, opts.point ?? "0");
      break;
    case "apart":
      res = casPartialFractions(latex, variable);
      break;
    case "numeric":
      res = casNumeric(latex);
      break;
    case "phasor":
      res = casPhasorConvert(latex, opts.imagUnit ?? "j");
      break;
    case "units":
      res = casUnitConvert(latex);
      break;
    case "matrix_det":
    case "matrix_inv":
      res = casMatrixOp(latex, op);
      break;
    default:
      res = casSimplify(latex);
      break;
  }

  // Fallback to Python/SymPy if Tier 1 JS failed and hybrid-python is enabled
  if (!res.ok && backend === "hybrid-python") {
    return runSymPyOperation(op, latex, {
      pythonExecutable: opts.pythonExecutable,
      variable,
      lower: opts.lower,
      upper: opts.upper,
      point: opts.point,
      order: opts.order,
    });
  }
  return res;
}
