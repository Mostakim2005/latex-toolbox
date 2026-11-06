// LaTeX Toolbox ported from Nihon 4.6.0 (L15-750)
import type { SolverPreset } from "./types";

export const TAXONOMY: Record<string, { label: string; icon: string; topics: Record<string, { label: string; subtopics: string[] }> }> = {
  math: {
    label: "Mathematics",
    icon: "âˆ‘",
    topics: {
      algebra: { label: "Algebra & Functions", subtopics: ["Quadratics & Polynomials", "Logarithms & Exponentials", "Sequences & Series", "Complex Numbers", "Binomial Theorem"] },
      trigonometry: { label: "Trigonometry", subtopics: ["Basic Ratios", "Pythagorean & Angle Identities", "Double & Half Angle", "Sum-to-Product", "Inverse Trig", "Law of Sines & Cosines"] },
    },
  },
  physics: {
    label: "Physics",
    icon: "âš›",
    topics: {
      mechanics: { label: "Mechanics & Gravitation", subtopics: ["Kinematics", "Newton's Laws & Friction", "Work, Energy & Power"] },
    },
  },
  chemistry: {
    label: "Chemistry",
    icon: "âš—",
    topics: {
      stoichiometry: { label: "Stoichiometry", subtopics: ["Balancing Equations", "Mole Calculations", "Concentration"] },
    },
  },
};

const ELEMENTS_LIST = [
  "He", "Li", "Be", "Ne", "Na", "Mg", "Al", "Si", "Cl", "Ar", "Ca", "Sc", "Ti", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "H", "B", "C", "N", "O", "F", "P", "S", "K", "V", "Y", "I", "W", "U",
];
const VALID_ELEMENTS = new Set(ELEMENTS_LIST);

export function normalizeChemicalFormulaInput(raw: string): string {
  if (!raw) return "";
  const s = raw.trim().replace(/\s+/g, "");
  if (s === "e" || s === "e-") return "e";
  const plain = s.replace(/_/g, "").replace(/\{|\}/g, "");
  let out = "";
  let i = 0;
  while (i < plain.length) {
    const ch = plain[i]!;
    if ("()[]+.*".includes(ch)) {
      out += ch;
      i++;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let num = "";
      while (i < plain.length && /[0-9]/.test(plain[i]!)) {
        num += plain[i];
        i++;
      }
      out += "_" + num;
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      const twoChars = plain.slice(i, i + 2);
      let matchedTwo: string | null = null;
      if (twoChars.length === 2 && /[a-zA-Z]{2}/.test(twoChars)) {
        const capTwo = twoChars[0]!.toUpperCase() + twoChars[1]!.toLowerCase();
        if (VALID_ELEMENTS.has(capTwo)) matchedTwo = capTwo;
      }
      if (matchedTwo) {
        out += matchedTwo;
        i += 2;
      } else {
        out += ch.toUpperCase();
        i++;
      }
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

export const SOLVER_PRESETS: SolverPreset[] = [
  {
    id: "diff",
    name: "Differentiate",
    steps: [
      { rel: "\\text{Given:}", expr: "y = f(x)", note: "Initial equation" },
      { rel: "\\implies", expr: "\\frac{dy}{dx} = f'(x)", note: "Differentiate both sides" },
    ],
  },
];

