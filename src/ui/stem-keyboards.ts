import type { LaTeXSettings } from "../types";

export interface CustomKeyboardKey {
  label?: string;
  latex?: string;
  insert?: string;
  tooltip?: string;
  class?: string;
  width?: number;
  variants?: Array<string | { label?: string; latex?: string; insert?: string }>;
  command?: string | string[];
}

export interface CustomVirtualKeyboardLayout {
  label: string;
  tooltip?: string;
  rows: Array<Array<string | CustomKeyboardKey>>;
}

/**
 * Dedicated Chemistry virtual keyboard tab ("che")
 */
export const CHEM_KEYBOARD_LAYOUT: CustomVirtualKeyboardLayout = {
  label: "che",
  tooltip: "Chemistry symbols, reactions & mhchem",
  rows: [
    [
      { label: "\\ce{}", insert: "\\ce{#?}", tooltip: "mhchem formula/equation" },
      { label: "\\rightarrow", insert: "\\rightarrow ", tooltip: "Yields arrow", variants: ["\\xrightarrow{#?}", "\\xleftarrow{#?}", "\\longrightarrow"] },
      { label: "\\rightleftharpoons", insert: "\\rightleftharpoons ", tooltip: "Equilibrium" },
      { label: "\\xrightarrow{T}", insert: "\\xrightarrow{#?}", tooltip: "Reaction with condition" },
      { label: "\\uparrow", insert: "\\uparrow", tooltip: "Gas evolved" },
      { label: "\\downarrow", insert: "\\downarrow", tooltip: "Precipitate formed" },
      { label: "^{A}_{Z}X", insert: "^{#?}_{#?}\\text{#?}", tooltip: "Isotope notation" },
      { label: "[\\;]", insert: "[#0]", tooltip: "Molar concentration" },
      { label: "e^{-}", insert: "e^{-}", tooltip: "Electron" },
      { label: "H^{+}", insert: "H^{+}", tooltip: "Proton", variants: ["H_3O^{+}", "OH^{-}", "H_2O"] },
    ],
    [
      { label: "\\Delta H^{\\circ}", insert: "\\Delta H^{\\circ}", tooltip: "Standard enthalpy" },
      { label: "\\Delta G^{\\circ}", insert: "\\Delta G^{\\circ}", tooltip: "Gibbs free energy" },
      { label: "\\Delta S^{\\circ}", insert: "\\Delta S^{\\circ}", tooltip: "Standard entropy" },
      { label: "K_{eq}", insert: "K_{\\text{eq}}", tooltip: "Equilibrium constant", variants: ["K_a", "K_b", "K_{sp}", "K_w", "K_p", "K_c"] },
      { label: "pH", insert: "\\text{pH} = -\\log[#?]", tooltip: "pH formula" },
      { label: "PV=nRT", insert: "PV = nRT", tooltip: "Ideal gas law" },
      { label: "E^{\\circ}", insert: "E^{\\circ}_{\\text{cell}}", tooltip: "Cell potential" },
      { label: "k=Ae^{-E_a/RT}", insert: "k = A e^{-\\frac{E_a}{RT}}", tooltip: "Arrhenius equation" },
      { label: "^{\\circ}\\text{C}", insert: "^{\\circ}\\text{C}", tooltip: "Celsius", variants: ["\\text{K}", "\\text{atm}", "\\text{bar}"] },
      { label: "\\text{mol}", insert: "\\text{ mol}", tooltip: "Moles", variants: ["\\text{ M}", "\\text{ g/mol}", "\\text{ kJ/mol}"] },
    ],
    [
      { label: "x^{#?}", insert: "^{#?}", tooltip: "Charge / Superscript" },
      { label: "x_{#?}", insert: "_{#?}", tooltip: "Stoichiometric subscript" },
      { label: "(s)", insert: "_{(s)}", tooltip: "Solid state", variants: ["_{(l)}", "_{(g)}", "_{(aq)}"] },
      { label: "\\cdot", insert: "\\cdot ", tooltip: "Hydrate dot" },
      { label: "\\approx", insert: "\\approx ", tooltip: "Approximately" },
      { label: "\\propto", insert: "\\propto ", tooltip: "Proportional to" },
      { label: "[left]", command: "moveToPreviousChar" },
      { label: "[right]", command: "moveToNextChar" },
      { label: "[backspace]", command: "deleteBackward" },
      { label: "[return]", command: "commit" },
    ],
  ],
};

/**
 * Dedicated Electrical & Electronic Engineering virtual keyboard tab ("ee")
 */
export function buildEEKeyboardLayout(imagUnit: "j" | "i" = "j"): CustomVirtualKeyboardLayout {
  const j = imagUnit;
  return {
    label: "ee",
    tooltip: "Electrical & Electronic Engineering (Phasors, Circuits, Signals, EM)",
    rows: [
      [
        { label: `${j}\\omega`, insert: `${j}\\omega`, tooltip: "Complex angular frequency", variants: [`${j}\\omega L`, `\\frac{1}{${j}\\omega C}`, `s = \\sigma + ${j}\\omega`] },
        { label: "\\angle", insert: "\\angle #?^{\\circ}", tooltip: "Phasor angle" },
        { label: "\\Omega", insert: "\\Omega", tooltip: "Ohm", variants: ["\\text{k}\\Omega", "\\text{M}\\Omega", "\\text{m}\\Omega"] },
        { label: "\\mu", insert: "\\mu", tooltip: "Micro / Permeability", variants: ["\\mu\\text{F}", "\\mu\\text{H}", "\\mu\\text{A}", "\\mu_0"] },
        { label: "Z_{#?}", insert: "Z_{#?}", tooltip: "Impedance", variants: ["Z_{th}", "Z_L", "Z_C", "Z_0", "Y_{#?}"] },
        { label: "X_L", insert: "X_L = \\omega L", tooltip: "Inductive reactance", variants: ["X_C = \\frac{1}{\\omega C}"] },
        { label: "\\parallel", insert: "\\parallel ", tooltip: "Parallel impedance" },
        { label: "H(s)", insert: "H(s) = \\frac{#?}{#?}", tooltip: "Transfer function", variants: [`H(${j}\\omega)`, "H(z)"] },
        { label: "\\mathcal{L}", insert: "\\mathcal{L}\\left\\{#?\\right\\}", tooltip: "Laplace transform", variants: ["\\mathcal{L}^{-1}\\left\\{#?\\right\\}"] },
        { label: "\\mathcal{F}", insert: "\\mathcal{F}\\left\\{#?\\right\\}", tooltip: "Fourier transform", variants: ["\\mathcal{F}^{-1}\\left\\{#?\\right\\}"] },
      ],
      [
        { label: "V=IR", insert: "V = I\\,R", tooltip: "Ohm's Law", variants: ["V = I\\,Z", "P = V\\,I\\cos\\phi"] },
        { label: "v=L\\frac{di}{dt}", insert: "v(t) = L\\frac{di}{dt}", tooltip: "Inductor V-I", variants: ["i(t) = C\\frac{dv}{dt}"] },
        { label: "S=P+jQ", insert: `S = P + ${j}Q`, tooltip: "Complex power", variants: ["\\text{pf} = \\cos\\theta"] },
        { label: "f_0", insert: "f_0 = \\frac{1}{2\\pi\\sqrt{LC}}", tooltip: "Resonant frequency" },
        { label: "\\text{dB}", insert: "20\\log_{10}\\left|#?\\right|\\text{ dB}", tooltip: "Decibel gain" },
        { label: "\\Phi", insert: "\\Phi", tooltip: "Magnetic flux", variants: ["\\mathbf{B}", "\\mathbf{E}", "\\mathbf{H}", "\\mathbf{J}"] },
        { label: "\\nabla\\times", insert: "\\nabla \\times \\mathbf{#?}", tooltip: "Curl", variants: ["\\nabla \\cdot \\mathbf{#?}", "\\nabla #?"] },
        { label: "\\oplus", insert: "\\oplus ", tooltip: "XOR gate", variants: ["\\odot ", "\\cdot ", "\\overline{#0}"] },
        { label: "\\overline{A}", insert: "\\overline{#0}", tooltip: "Boolean NOT / Conjugate" },
        { label: "v_{rms}", insert: "V_{\\text{rms}} = \\frac{V_m}{\\sqrt{2}}", tooltip: "RMS value" },
      ],
      [
        { label: "x^{#?}", insert: "^{#?}", tooltip: "Superscript" },
        { label: "x_{#?}", insert: "_{#?}", tooltip: "Subscript" },
        { label: "\\frac{#?}{#?}", insert: "\\frac{#?}{#?}", tooltip: "Fraction" },
        { label: "\\mathbf{#?}", insert: "\\mathbf{#?}", tooltip: "Bold vector/phasor" },
        { label: "\\hat{#?}", insert: "\\hat{#?}", tooltip: "Unit vector / Phasor" },
        { label: "\\text{mH}", insert: "\\text{ mH}", tooltip: "Millihenry", variants: ["\\text{ pF}", "\\text{ nF}", "\\text{ mA}", "\\text{ kV}", "\\text{ Hz}"] },
        { label: "[left]", command: "moveToPreviousChar" },
        { label: "[right]", command: "moveToNextChar" },
        { label: "[backspace]", command: "deleteBackward" },
        { label: "[return]", command: "commit" },
      ],
    ],
  };
}

/**
 * Dedicated Mathematics virtual keyboard tab ("math")
 */
export const MATH_KEYBOARD_LAYOUT: CustomVirtualKeyboardLayout = {
  label: "math",
  tooltip: "Calculus, Linear Algebra, Sets & Logic",
  rows: [
    [
      { label: "\\int_{a}^{b}", insert: "\\int_{#?}^{#?} #? \\, d#?", tooltip: "Definite integral", variants: ["\\int #? \\, dx", "\\iint_{#?} #? \\, dA", "\\iiint_{#?} #? \\, dV", "\\oint_{#?} #? \\, d\\mathbf{r}"] },
      { label: "\\frac{d}{dx}", insert: "\\frac{d#?}{d#?}", tooltip: "Derivative", variants: ["\\frac{d^2#?}{d#?^2}"] },
      { label: "\\frac{\\partial}{\\partial x}", insert: "\\frac{\\partial #?}{\\partial #?}", tooltip: "Partial derivative" },
      { label: "\\lim", insert: "\\lim_{#? \\to #?} #?", tooltip: "Limit" },
      { label: "\\sum", insert: "\\sum_{#?=#?}^{#?} #?", tooltip: "Summation" },
      { label: "\\prod", insert: "\\prod_{#?=#?}^{#?} #?", tooltip: "Product" },
      { label: "\\frac{#?}{#?}", insert: "\\frac{#?}{#?}", tooltip: "Fraction" },
      { label: "\\sqrt{#?}", insert: "\\sqrt{#?}", tooltip: "Square root", variants: ["\\sqrt[#?]{#?}"] },
      { label: "x^{#?}", insert: "^{#?}", tooltip: "Exponent / Superscript" },
      { label: "x_{#?}", insert: "_{#?}", tooltip: "Subscript" },
    ],
    [
      { label: "\\begin{pmatrix}\\cdot\\end{pmatrix}", insert: "\\begin{pmatrix} #? & #? \\\\ #? & #? \\end{pmatrix}", tooltip: "2x2 Matrix", variants: ["\\begin{bmatrix} #? & #? \\\\ #? & #? \\end{bmatrix}", "\\begin{vmatrix} #? & #? \\\\ #? & #? \\end{vmatrix}"] },
      { label: "\\cases", insert: "\\begin{cases} #? & \\text{if } #? \\\\ #? & \\text{if } #? \\end{cases}", tooltip: "Piecewise function" },
      { label: "\\binom{n}{k}", insert: "\\binom{#?}{#?}", tooltip: "Binomial coefficient" },
      { label: "\\infty", insert: "\\infty", tooltip: "Infinity" },
      { label: "\\pm", insert: "\\pm ", tooltip: "Plus-minus", variants: ["\\mp "] },
      { label: "\\neq", insert: "\\neq ", tooltip: "Not equal", variants: ["\\leq ", "\\geq ", "\\approx ", "\\equiv "] },
      { label: "\\forall", insert: "\\forall ", tooltip: "For all", variants: ["\\exists ", "\\nexists "] },
      { label: "\\in", insert: "\\in ", tooltip: "Element of", variants: ["\\notin ", "\\subset ", "\\subseteq ", "\\cup ", "\\cap "] },
      { label: "\\mathbb{R}", insert: "\\mathbb{R}", tooltip: "Real numbers", variants: ["\\mathbb{C}", "\\mathbb{Z}", "\\mathbb{N}", "\\mathbb{Q}"] },
      { label: "\\implies", insert: "\\implies ", tooltip: "Implies", variants: ["\\iff ", "\\therefore ", "\\because "] },
    ],
    [
      { label: "\\sin", insert: "\\sin(#?)", variants: ["\\sin^{-1}(#?)", "\\sinh(#?)"] },
      { label: "\\cos", insert: "\\cos(#?)", variants: ["\\cos^{-1}(#?)", "\\cosh(#?)"] },
      { label: "\\tan", insert: "\\tan(#?)", variants: ["\\tan^{-1}(#?)", "\\tanh(#?)"] },
      { label: "\\ln", insert: "\\ln(#?)", variants: ["\\log_{#?}(#?)", "\\exp(#?)"] },
      { label: "|#?|", insert: "\\left|#?\\right|", tooltip: "Absolute value", variants: ["\\left\\|#?\\right\\|"] },
      { label: "(#?)", insert: "\\left(#?\\right)", tooltip: "Auto-sized parens" },
      { label: "[left]", command: "moveToPreviousChar" },
      { label: "[right]", command: "moveToNextChar" },
      { label: "[backspace]", command: "deleteBackward" },
      { label: "[return]", command: "commit" },
    ],
  ],
};

/**
 * Dedicated Physics virtual keyboard tab ("phy")
 */
export const PHYSICS_KEYBOARD_LAYOUT: CustomVirtualKeyboardLayout = {
  label: "phy",
  tooltip: "Physics vectors, constants, mechanics, EM & quantum",
  rows: [
    [
      { label: "\\vec{v}", insert: "\\vec{#?}", tooltip: "Vector arrow" },
      { label: "\\hat{u}", insert: "\\hat{#?}", tooltip: "Unit vector", variants: ["\\hat{i}", "\\hat{j}", "\\hat{k}"] },
      { label: "\\dot{x}", insert: "\\dot{#?}", tooltip: "First time derivative", variants: ["\\ddot{#?}"] },
      { label: "\\Delta", insert: "\\Delta ", tooltip: "Change / Delta" },
      { label: "\\nabla", insert: "\\nabla ", tooltip: "Del / Gradient", variants: ["\\nabla^2 ", "\\nabla \\cdot ", "\\nabla \\times "] },
      { label: "\\hbar", insert: "\\hbar", tooltip: "Reduced Planck constant" },
      { label: "\\varepsilon_0", insert: "\\varepsilon_0", tooltip: "Vacuum permittivity", variants: ["\\mu_0", "k_B", "N_A", "G", "c"] },
      { label: "\\lambda", insert: "\\lambda", tooltip: "Wavelength", variants: ["\\nu", "\\omega", "\\theta", "\\phi", "\\psi", "\\rho", "\\sigma", "\\tau"] },
      { label: "\\langle\\psi|\\phi\\rangle", insert: "\\langle #? | #? \\rangle", tooltip: "Bra-Ket inner product", variants: ["|#?\\rangle", "\\langle #?|"] },
      { label: "\\times", insert: "\\times ", tooltip: "Cross product", variants: ["\\cdot "] },
    ],
    [
      { label: "F=ma", insert: "\\vec{F} = m\\vec{a}", tooltip: "Newton's 2nd Law" },
      { label: "K=\\frac{1}{2}mv^2", insert: "K = \\frac{1}{2}mv^2", tooltip: "Kinetic energy" },
      { label: "E=mc^2", insert: "E = mc^2", tooltip: "Mass-energy equivalence" },
      { label: "F_e", insert: "F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}", tooltip: "Coulomb's Law" },
      { label: "F_B", insert: "\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})", tooltip: "Lorentz Force" },
      { label: "i\\hbar\\partial_t", insert: "i\\hbar\\frac{\\partial \\psi}{\\partial t} = \\hat{H}\\psi", tooltip: "Schrödinger Equation" },
      { label: "\\text{m/s}^2", insert: "\\text{ m/s}^2", tooltip: "Acceleration unit", variants: ["\\text{ m/s}", "\\text{ N}", "\\text{ J}", "\\text{ W}", "\\text{ Pa}"] },
      { label: "\\text{eV}", insert: "\\text{ eV}", tooltip: "Electron-volt", variants: ["\\text{ T}", "\\text{ Wb}", "\\text{ C}", "\\text{ K}"] },
      { label: "x^{#?}", insert: "^{#?}", tooltip: "Superscript" },
      { label: "x_{#?}", insert: "_{#?}", tooltip: "Subscript" },
    ],
    [
      { label: "\\frac{#?}{#?}", insert: "\\frac{#?}{#?}", tooltip: "Fraction" },
      { label: "\\int_{a}^{b}", insert: "\\int_{#?}^{#?} #? \\, d#?", tooltip: "Integral" },
      { label: "\\frac{d}{dt}", insert: "\\frac{d#?}{dt}", tooltip: "Time derivative" },
      { label: "\\frac{\\partial}{\\partial t}", insert: "\\frac{\\partial #?}{\\partial #?}", tooltip: "Partial derivative" },
      { label: "\\sum \\vec{F}", insert: "\\sum \\vec{F} = #?", tooltip: "Net force" },
      { label: "^{\\circ}", insert: "^{\\circ}", tooltip: "Degrees" },
      { label: "[left]", command: "moveToPreviousChar" },
      { label: "[right]", command: "moveToNextChar" },
      { label: "[backspace]", command: "deleteBackward" },
      { label: "[return]", command: "commit" },
    ],
  ],
};

/**
 * Configures MathLive's global virtual keyboard layouts based on user settings.
 * Hides redundant `numeric` (123) and `alphabetic` (abc) tabs when disabled,
 * while always keeping `symbols`, `greek`, and optional STEM tabs (`che`, `ee`, `math`, `phy`).
 */
export function applyMathLiveKeyboardConfig(settings: LaTeXSettings): void {
  const vk = (window as unknown as { mathVirtualKeyboard?: { layouts?: unknown } }).mathVirtualKeyboard;
  if (!vk) return;

  const layouts: Array<string | CustomVirtualKeyboardLayout> = [];
  if (settings.showNumericKeyboard) {
    layouts.push("numeric");
  }
  layouts.push("symbols");
  if (settings.showAlphabeticKeyboard) {
    layouts.push("alphabetic");
  }
  layouts.push("greek");

  if (settings.enableStemKeyboardTabs !== false) {
    layouts.push(
      CHEM_KEYBOARD_LAYOUT,
      buildEEKeyboardLayout(settings.eeImaginaryUnit ?? "j"),
      MATH_KEYBOARD_LAYOUT,
      PHYSICS_KEYBOARD_LAYOUT
    );
  }

  vk.layouts = layouts;
}
