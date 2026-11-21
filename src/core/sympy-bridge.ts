import { Platform } from "obsidian";
import type { CASOperation, CASResult } from "../types";

export interface SymPyStatus {
  available: boolean;
  pythonVersion?: string;
  sympyVersion?: string;
  error?: string;
}

const SYMPY_RUNNER_SCRIPT = `
import json, sys
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor

payload = json.loads(sys.stdin.read())
op = payload.get("op", "simplify")
raw = payload.get("expr", "")
var_name = payload.get("variable", "x") or "x"
lower = payload.get("lower", "")
upper = payload.get("upper", "")
point = payload.get("point", "0") or "0"
order = int(payload.get("order", 6) or 6)

try:
    from sympy.parsing.latex import parse_latex
    try:
        expr = parse_latex(raw)
    except Exception:
        expr = None
except Exception:
    expr = None

if expr is None:
    trans = standard_transformations + (implicit_multiplication_application, convert_xor)
    expr = parse_expr(raw, transformations=trans)

x = sp.Symbol(var_name)
t = sp.Symbol("t", positive=True)
s = sp.Symbol("s")
w = sp.Symbol("w", real=True)

if op == "simplify":
    res = sp.simplify(expr)
elif op == "expand":
    res = sp.expand(expr)
elif op == "factor":
    res = sp.factor(expr)
elif op == "solve":
    res = sp.solve(expr, x)
elif op == "diff":
    res = sp.diff(expr, x)
elif op == "integrate":
    res = sp.integrate(expr, x)
elif op == "defint":
    a = sp.sympify(lower) if lower else 0
    b = sp.sympify(upper) if upper else 1
    res = sp.integrate(expr, (x, a, b))
elif op == "limit":
    res = sp.limit(expr, x, sp.sympify(point))
elif op == "series":
    res = sp.series(expr, x, sp.sympify(point), order).removeO()
elif op == "apart":
    res = sp.apart(expr, x)
elif op == "laplace":
    target = expr.subs(x, t) if var_name != "t" else expr
    res = sp.laplace_transform(target, t, s, noconds=True)
elif op == "ilaplace":
    target = expr.subs(x, s) if var_name != "s" else expr
    res = sp.inverse_laplace_transform(target, s, t)
elif op == "fourier":
    target = expr.subs(x, t) if var_name != "t" else expr
    res = sp.fourier_transform(target, t, w)
elif op == "dsolve":
    y = sp.Function("y")
    res = sp.dsolve(expr, y(x))
elif op == "numeric":
    res = sp.N(expr, 10)
else:
    res = sp.simplify(expr)

num_val = None
try:
    if hasattr(res, "evalf"):
        ev = res.evalf(8)
        if ev.is_number:
            num_val = sp.latex(ev)
except Exception:
    num_val = None

print(json.dumps({
    "ok": True,
    "latex": sp.latex(res),
    "numeric": num_val,
    "engine": f"Python SymPy {sp.__version__}"
}))
`;

function getChildProcess(): {
  spawn?: (cmd: string, args: string[], opts?: Record<string, unknown>) => {
    stdin: { write: (d: string) => void; end: () => void };
    stdout: { on: (ev: string, cb: (chunk: Buffer | string) => void) => void };
    stderr: { on: (ev: string, cb: (chunk: Buffer | string) => void) => void };
    on: (ev: string, cb: (arg: unknown) => void) => void;
    kill: () => void;
  };
} | null {
  if (!Platform.isDesktopApp) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("child_process");
  } catch {
    return null;
  }
}

export async function checkSymPyStatus(pythonExecutable = "python"): Promise<SymPyStatus> {
  const cp = getChildProcess();
  if (!cp?.spawn) {
    return { available: false, error: "Desktop Obsidian required for local Python/SymPy bridge." };
  }

  return new Promise((resolve) => {
    const proc = cp.spawn!(pythonExecutable, [
      "-c",
      "import sys, json, sympy; print(json.dumps({'py': sys.version.split()[0], 'sympy': sympy.__version__}))",
    ]);
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ available: false, error: "Timed out checking Python/SymPy." });
    }, 6000);

    proc.stdout.on("data", (d) => (out += String(d)));
    proc.stderr.on("data", (d) => (err += String(d)));
    proc.on("error", (e) => {
      clearTimeout(timer);
      resolve({ available: false, error: String(e) });
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        resolve({ available: false, error: err.trim() || `Exit code ${String(code)}` });
        return;
      }
      try {
        const parsed = JSON.parse(out.trim()) as { py?: string; sympy?: string };
        resolve({ available: true, pythonVersion: parsed.py, sympyVersion: parsed.sympy });
      } catch {
        resolve({ available: false, error: out.trim() || err.trim() });
      }
    });
  });
}

export async function runSymPyOperation(
  op: CASOperation,
  expr: string,
  opts: {
    pythonExecutable?: string;
    variable?: string;
    lower?: string;
    upper?: string;
    point?: string;
    order?: number;
  } = {}
): Promise<CASResult> {
  const cp = getChildProcess();
  if (!cp?.spawn) {
    return {
      ok: false,
      latex: expr,
      error: "Local Python/SymPy bridge is only available on Desktop Obsidian. Switch CAS backend to JS-only on mobile.",
    };
  }

  return new Promise((resolve) => {
    const py = opts.pythonExecutable || "python";
    const proc = cp.spawn!(py, ["-c", SYMPY_RUNNER_SCRIPT]);
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      proc.kill();
      resolve({ ok: false, latex: expr, error: "SymPy computation timed out (15s)." });
    }, 15000);

    proc.stdout.on("data", (d) => (out += String(d)));
    proc.stderr.on("data", (d) => (err += String(d)));
    proc.on("error", (e) => {
      clearTimeout(timer);
      resolve({ ok: false, latex: expr, error: `Could not launch '${py}': ${String(e)}` });
    });
    proc.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        resolve({ ok: false, latex: expr, error: err.trim() || `SymPy exited with code ${String(code)}` });
        return;
      }
      try {
        const parsed = JSON.parse(out.trim()) as CASResult;
        resolve(parsed);
      } catch (e) {
        resolve({ ok: false, latex: expr, error: `Invalid SymPy JSON: ${String(e)}` });
      }
    });

    proc.stdin.write(
      JSON.stringify({
        op,
        expr,
        variable: opts.variable ?? "x",
        lower: opts.lower ?? "",
        upper: opts.upper ?? "",
        point: opts.point ?? "0",
        order: opts.order ?? 6,
      })
    );
    proc.stdin.end();
  });
}
