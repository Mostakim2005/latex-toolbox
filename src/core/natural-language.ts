import { balanceChemicalEquation } from "./chem-engine";

export type DetectedDomain = "math" | "physics" | "chemistry" | "eee";

export interface NaturalParseResult {
  domain: DetectedDomain;
  latex: string;
  note: string;
}

export interface NaturalSuggestion {
  label: string;
  domain: DetectedDomain;
  latex: string;
  description: string;
}

/**
 * Automatically detects the STEM domain of a natural-language or symbolic prompt.
 */
export function detectStemDomain(input: string): DetectedDomain {
  const s = (input || "").trim();
  if (/->|<->|\\ce\{|\b(mol|molar|ph|poh|h2o|h2so4|naoh|co2|nacl|balance)\b/i.test(s)) {
    return "chemistry";
  }
  if (/\b(laplace|ilaplace|phasor|impedance|ohm|kvl|kcl|thevenin|norton|mosfet|bjt|opamp|reactance|db|rms|jw|j\*w|angle|mh|pf|nf|uf|kohm)\b/i.test(s) || /\bZ\s*=/.test(s)) {
    return "eee";
  }
  if (/\b(force|velocity|acceleration|momentum|kinetic|potential|coulomb|lorentz|maxwell|schrodinger|planck|gravity|torque|entropy|wavelength|frequency)\b/i.test(s)) {
    return "physics";
  }
  return "math";
}

function parseMatlabMatrix(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]") || !trimmed.includes(";")) return null;
  const inner = trimmed.slice(1, -1).trim();
  const rows = inner
    .split(";")
    .map((r) =>
      r
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .join(" & ")
    )
    .filter(Boolean);
  if (rows.length === 0) return null;
  return `\\begin{pmatrix} ${rows.join(" \\\\ ")} \\end{pmatrix}`;
}

/**
 * Converts WolframAlpha / MATLAB / Symbolab-style natural language expressions
 * into clean LaTeX with MathLive-ready slots where appropriate.
 */
export function naturalLanguageToLatex(rawInput: string, imagUnit: "j" | "i" = "j"): NaturalParseResult {
  const raw = (rawInput || "").trim();
  const domain = detectStemDomain(raw);
  if (!raw) return { domain, latex: "", note: "Empty input" };

  // 1. MATLAB matrix syntax: [1 2; 3 4]
  const mat = parseMatlabMatrix(raw);
  if (mat) {
    return { domain: "math", latex: mat, note: "MATLAB matrix → LaTeX" };
  }

  // 2. Chemistry reaction auto-balance: "balance H2 + O2 -> H2O" or "H2SO4 + NaOH -> Na2SO4 + H2O"
  if (domain === "chemistry" && (raw.includes("->") || raw.includes("<->"))) {
    const cleaned = raw.replace(/^balance\s+/i, "");
    const bal = balanceChemicalEquation(cleaned);
    return {
      domain: "chemistry",
      latex: bal.latex,
      note: bal.ok ? "Balanced chemical equation (mhchem)" : "Formatted as mhchem reaction",
    };
  }

  // 3. Definite integral: "integrate sin(x) from 0 to pi" or "int(x^2, x, 0, 1)"
  const defIntMatch = raw.match(/^(?:integrate|int)\s+(.+?)\s+from\s+(.+?)\s+to\s+(.+?)(?:\s+d([a-zA-Z]))?$/i);
  if (defIntMatch?.[1] && defIntMatch[2] && defIntMatch[3]) {
    const v = defIntMatch[4] || "x";
    return {
      domain: "math",
      latex: `\\int_{${formatExprTokens(defIntMatch[2])}}^{${formatExprTokens(defIntMatch[3])}} ${formatExprTokens(defIntMatch[1])} \\, d${v}`,
      note: "Definite integral",
    };
  }

  // 4. Indefinite integral: "integrate x^2 dx" or "int(sin(x), x)"
  const indefMatch = raw.match(/^(?:integrate|int)\s+(.+?)(?:\s+d([a-zA-Z])|\s+w\.?r\.?t\.?\s+([a-zA-Z]))?$/i);
  if (indefMatch?.[1]) {
    const v = indefMatch[2] || indefMatch[3] || "x";
    return {
      domain: "math",
      latex: `\\int ${formatExprTokens(indefMatch[1])} \\, d${v}`,
      note: "Indefinite integral",
    };
  }

  // 5. Derivative: "diff(x^3 + 2x, x)" or "d/dx sin(x)"
  const diffMatch = raw.match(/^(?:diff|differentiate|d\/d([a-zA-Z]))\s*\(?(.+?)(?:,\s*([a-zA-Z]))?\)?$/i);
  if (diffMatch?.[2]) {
    const v = diffMatch[1] || diffMatch[3] || "x";
    return {
      domain: "math",
      latex: `\\frac{d}{d${v}}\\left(${formatExprTokens(diffMatch[2])}\\right)`,
      note: "Derivative",
    };
  }

  // 6. Limit: "limit sin(x)/x as x -> 0"
  const limMatch = raw.match(/^(?:limit|lim)\s+(.+?)\s+(?:as\s+)?([a-zA-Z])\s*(?:->|to)\s*(.+)$/i);
  if (limMatch?.[1] && limMatch[2] && limMatch[3]) {
    return {
      domain: "math",
      latex: `\\lim_{${limMatch[2]} \\to ${formatExprTokens(limMatch[3])}} ${formatExprTokens(limMatch[1])}`,
      note: "Limit",
    };
  }

  // 7. Summation: "sum k^2 from k=1 to n"
  const sumMatch = raw.match(/^sum\s+(.+?)\s+from\s+([a-zA-Z]\s*=\s*.+?)\s+to\s+(.+)$/i);
  if (sumMatch?.[1] && sumMatch[2] && sumMatch[3]) {
    return {
      domain: "math",
      latex: `\\sum_{${formatExprTokens(sumMatch[2])}}^{${formatExprTokens(sumMatch[3])}} ${formatExprTokens(sumMatch[1])}`,
      note: "Summation",
    };
  }

  // 8. Laplace / Inverse Laplace (EEE / Control)
  const lapMatch = raw.match(/^(i?laplace)\s*\((.+)\)$/i);
  if (lapMatch?.[1] && lapMatch[2]) {
    const isInv = lapMatch[1].toLowerCase().startsWith("i");
    return {
      domain: "eee",
      latex: isInv
        ? `\\mathcal{L}^{-1}\\left\\{${formatExprTokens(lapMatch[2])}\\right\\}`
        : `\\mathcal{L}\\left\\{${formatExprTokens(lapMatch[2])}\\right\\}`,
      note: isInv ? "Inverse Laplace transform" : "Laplace transform",
    };
  }

  // 9. Phasor notation: "10 angle 30 deg" -> 10\angle 30^{\circ}
  const phasorMatch = raw.match(/^(.+?)\s+(?:angle|ang)\s+(.+?)(?:\s*deg)?$/i);
  if (phasorMatch?.[1] && phasorMatch[2]) {
    return {
      domain: "eee",
      latex: `${formatExprTokens(phasorMatch[1])}\\angle ${formatExprTokens(phasorMatch[2])}^{\\circ}`,
      note: "EEE Phasor",
    };
  }

  // 10. General token & operator normalization
  return {
    domain,
    latex: formatExprTokens(raw, imagUnit),
    note: `Symbolic conversion (${domain.toUpperCase()})`,
  };
}

function formatExprTokens(expr: string, imagUnit: "j" | "i" = "j"): string {
  let out = expr.trim();
  // Fractions a/b when parenthesized or simple tokens
  out = out.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, "\\frac{$1}{$2}");
  out = out.replace(/\b([a-zA-Z0-9]+)\s*\/\s*([a-zA-Z0-9]+)\b/g, "\\frac{$1}{$2}");
  // Functions
  out = out.replace(/\bsqrt\(([^)]+)\)/gi, "\\sqrt{$1}");
  out = out.replace(/\b(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|ln|log|exp)\b/gi, (m) => `\\${m.toLowerCase()}`);
  // Constants & Greek
  out = out.replace(/\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|nu|xi|pi|rho|sigma|tau|phi|chi|psi|omega)\b/gi, (m) => `\\${m.toLowerCase()}`);
  out = out.replace(/\binf(?:inity)?\b/gi, "\\infty");
  out = out.replace(/\bdeg\b/gi, "^{\\circ}");
  out = out.replace(/\bohm\b/gi, "\\Omega");
  out = out.replace(/\bj\*?\\omega\b/gi, `${imagUnit}\\omega`);
  out = out.replace(/\*/g, " \\cdot ");
  out = out.replace(/<=/g, " \\leq ").replace(/>=/g, " \\geq ").replace(/!=/g, " \\neq ");
  return out;
}

const BUILTIN_SUGGESTIONS: NaturalSuggestion[] = [
  { label: "Definite Integral", domain: "math", latex: "\\int_{\\placeholder[a]{0}}^{\\placeholder[b]{\\infty}} \\placeholder[f]{f(x)} \\, dx", description: "integrate f(x) from a to b" },
  { label: "Derivative d/dx", domain: "math", latex: "\\frac{d}{dx}\\left(\\placeholder[f]{x^2}\\right)", description: "diff(x^2, x)" },
  { label: "Limit", domain: "math", latex: "\\lim_{\\placeholder[v]{x} \\to \\placeholder[p]{0}} \\placeholder[f]{\\frac{\\sin x}{x}}", description: "limit sin(x)/x as x -> 0" },
  { label: "Summation", domain: "math", latex: "\\sum_{\\placeholder[k]{k=1}}^{\\placeholder[n]{n}} \\placeholder[term]{k^2}", description: "sum k^2 from k=1 to n" },
  { label: "2x2 Matrix", domain: "math", latex: "\\begin{pmatrix} \\placeholder[a]{a} & \\placeholder[b]{b} \\\\ \\placeholder[c]{c} & \\placeholder[d]{d} \\end{pmatrix}", description: "[a b; c d]" },
  { label: "RLC Impedance (EEE)", domain: "eee", latex: "Z = R + j\\left(\\omega L - \\frac{1}{\\omega C}\\right)", description: "Series RLC complex impedance" },
  { label: "Laplace Transform (EEE)", domain: "eee", latex: "\\mathcal{L}\\left\\{\\placeholder[f]{e^{-at}}\\right\\} = \\frac{1}{s + a}", description: "laplace(e^(-a*t))" },
  { label: "Phasor Form (EEE)", domain: "eee", latex: "V = \\placeholder[mag]{120}\\angle \\placeholder[ang]{30}^{\\circ}\\text{ V}", description: "120 angle 30 deg" },
  { label: "Transfer Function H(s)", domain: "eee", latex: "H(s) = \\frac{Y(s)}{X(s)} = \\frac{\\placeholder[num]{1}}{\\placeholder[den]{s^2 + 2\\zeta\\omega_n s + \\omega_n^2}}", description: "2nd-order system H(s)" },
  { label: "Chemical Reaction (mhchem)", domain: "chemistry", latex: "\\ce{\\placeholder[r]{H2SO4 + 2NaOH} -> \\placeholder[p]{Na2SO4 + 2H2O}}", description: "Auto-balanced mhchem reaction" },
  { label: "Henderson-Hasselbalch", domain: "chemistry", latex: "\\text{pH} = \\text{p}K_a + \\log\\left(\\frac{[\\text{A}^-]}{[\\text{HA}]}\\right)", description: "Buffer pH equation" },
  { label: "Lorentz Force (Physics)", domain: "physics", latex: "\\vec{F} = q\\left(\\vec{E} + \\vec{v} \\times \\vec{B}\\right)", description: "Electromagnetic force" },
  { label: "Maxwell-Faraday Law", domain: "physics", latex: "\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}", description: "Differential Faraday law" },
];

export function getNaturalSuggestions(query: string, maxResults = 6): NaturalSuggestion[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return BUILTIN_SUGGESTIONS.slice(0, maxResults);

  const scored = BUILTIN_SUGGESTIONS.map((item) => {
    const hay = `${item.label} ${item.domain} ${item.description} ${item.latex}`.toLowerCase();
    const score = hay.includes(q) ? 2 : q.split(/\s+/).filter((w) => w && hay.includes(w)).length;
    return { item, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((x) => x.item);

  return scored;
}
