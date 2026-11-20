// LaTeX Toolbox taxonomy & chemical formula normalizer
import type { SolverPreset } from "./types";

export const TAXONOMY: Record<string, { label: string; icon: string; topics: Record<string, { label: string; subtopics: string[] }> }> = {
  math: {
    label: "Mathematics",
    icon: "∑",
    topics: {
      algebra: { label: "Algebra & Functions", subtopics: ["Quadratics & Polynomials", "Logarithms & Exponentials", "Sequences & Series", "Complex Numbers", "Binomial Theorem"] },
      trigonometry: { label: "Trigonometry", subtopics: ["Basic Ratios", "Pythagorean & Angle Identities", "Double & Half Angle", "Sum-to-Product", "Inverse Trig", "Law of Sines & Cosines"] },
    },
  },
  physics: {
    label: "Physics",
    icon: "⚛",
    topics: {
      mechanics: { label: "Mechanics & Gravitation", subtopics: ["Kinematics", "Newton's Laws & Friction", "Work, Energy & Power"] },
    },
  },
  chemistry: {
    label: "Chemistry",
    icon: "⚗",
    topics: {
      stoichiometry: { label: "Stoichiometry", subtopics: ["Balancing Equations", "Mole Calculations", "Concentration"] },
    },
  },
};

export function getCategoryTree() {
  return TAXONOMY;
}

export const loadFormulaTaxonomy = getCategoryTree;

const ELEMENTS_LIST = [
  "He","Li","Be","Ne","Na","Mg","Al","Si","Cl","Ar","Ca","Sc","Ti","Cr","Mn","Fe","Co","Ni","Cu","Zn",
  "Ga","Ge","As","Se","Br","Kr","Rb","Sr","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb",
  "Te","Xe","Cs","Ba","La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu","Hf",
  "Ta","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn","Fr","Ra","Ac","Th","Pa","Np","Pu",
  "Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr","Rf","Db","Sg","Bh","Hs","Mt","Ds","Rg","Cn","Nh","Fl",
  "Mc","Lv","Ts","Og",
  "H","B","C","N","O","F","P","S","K","V","Y","I","W","U","e",
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
    if ("()[]+.*·".includes(ch)) {
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
      out += num.length > 1 ? `_{${num}}` : `_${num}`;
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
