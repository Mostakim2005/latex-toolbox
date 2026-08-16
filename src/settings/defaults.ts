import type { LatexToolboxSettings, Shortcut, Snippet, Template } from '../types';

const shortcuts: Shortcut[] = [
  { id: 'alpha', trigger: 'alpha', latex: '\\alpha', domain: 'all' },
  { id: 'beta', trigger: 'beta', latex: '\\beta', domain: 'all' },
  { id: 'gamma', trigger: 'gamma', latex: '\\gamma', domain: 'all' },
  { id: 'delta', trigger: 'delta', latex: '\\delta', domain: 'all' },
  { id: 'Delta', trigger: 'Delta', latex: '\\Delta', domain: 'all' },
  { id: 'infinity', trigger: 'infinity', latex: '\\infty', domain: 'all' },
  { id: 'partial', trigger: 'partial', latex: '\\partial', domain: 'all' },
  { id: 'nabla', trigger: 'nabla', latex: '\\nabla', domain: 'physics' },
  { id: 'hbar', trigger: 'hbar', latex: '\\hbar', domain: 'physics' },
  { id: 'epsilon0', trigger: 'eps0', latex: '\\varepsilon_0', domain: 'physics' },
  { id: 'mu0', trigger: 'mu0', latex: '\\mu_0', domain: 'physics' },
  { id: 'rightarrow', trigger: '->', latex: '\\rightarrow', domain: 'all' },
  { id: 'leftrightarrow', trigger: '<->', latex: '\\leftrightarrow', domain: 'all' },
  { id: 'degree', trigger: 'degree', latex: '^{\\circ}', domain: 'all' },
  { id: 'angstrom', trigger: 'angstrom', latex: '\\AA', domain: 'chemistry' },
];

const snippets: Snippet[] = [
  { id: 'frac', name: 'Fraction', trigger: 'frac', latex: '\\frac{${1:numerator}}{${2:denominator}}', domain: 'math' },
  { id: 'sqrt', name: 'Square root', trigger: 'sqrt', latex: '\\sqrt{${1:x}}', domain: 'math' },
  { id: 'integral', name: 'Integral', trigger: 'int', latex: '\\int_{${1:a}}^{${2:b}} ${3:f(x)}\\,dx', domain: 'math' },
  { id: 'sum', name: 'Summation', trigger: 'sum', latex: '\\sum_{${1:n=1}}^{${2:\\infty}} ${3:a_n}', domain: 'math' },
  { id: 'matrix', name: 'Matrix', trigger: 'matrix', latex: '\\begin{bmatrix}\n${1:a} & ${2:b} \\\\\n${3:c} & ${4:d}\n\\end{bmatrix}', domain: 'math' },
  { id: 'derivative', name: 'Derivative', trigger: 'deriv', latex: '\\frac{d${1:y}}{d${2:x}}', domain: 'math' },
  { id: 'partial-derivative', name: 'Partial derivative', trigger: 'pderiv', latex: '\\frac{\\partial ${1:f}}{\\partial ${2:x}}', domain: 'math' },
  { id: 'chem-equation', name: 'Chemical equation', trigger: 'chem', latex: '${1:reactant} \\rightarrow ${2:product}', domain: 'chemistry' },
  { id: 'vector', name: 'Vector', trigger: 'vec', latex: '\\vec{${1:v}}', domain: 'physics' },
  { id: 'ohms-law', name: "Ohm's law", trigger: 'ohm', latex: 'V = IR', domain: 'electronics' },
  { id: 'impedance-r', name: 'Resistor impedance', trigger: 'zr', latex: 'Z_R = R', domain: 'electronics' },
  { id: 'impedance-c', name: 'Capacitor impedance', trigger: 'zc', latex: 'Z_C = \\frac{1}{j\\omega C}', domain: 'electronics' },
  { id: 'impedance-l', name: 'Inductor impedance', trigger: 'zl', latex: 'Z_L = j\\omega L', domain: 'electronics' },
  { id: 'kcl', name: "Kirchhoff's current law", trigger: 'kcl', latex: '\\sum I = 0', domain: 'electronics' },
  { id: 'kvl', name: "Kirchhoff's voltage law", trigger: 'kvl', latex: '\\sum V = 0', domain: 'electronics' },
  { id: 'phasor', name: 'Phasor', trigger: 'phasor', latex: '\\underline{V} = V\\angle\\phi', domain: 'electronics' },
];

const templates: Template[] = [
  { id: 'align', name: 'Aligned equations', trigger: 'align', description: 'Multi-line aligned equation block.', latex: '\\begin{aligned}\n${1:a} &= ${2:b} \\\\\n${3:c} &= ${4:d}\n\\end{aligned}', domain: 'math' },
  { id: 'cases', name: 'Piecewise function', trigger: 'cases', description: 'Two-branch piecewise definition.', latex: '${1:f(x)} = \\begin{cases} ${2:x^2}, & ${3:x>0} \\\\\n${4:0}, & \\text{otherwise} \\end{cases}', domain: 'math' },
  { id: 'maxwell', name: 'Maxwell equations', trigger: 'maxwell', description: 'Compact Maxwell-equation template.', latex: '\\begin{aligned}\n\\nabla\\cdot\\mathbf{E} &= ${1:\\frac{\\rho}{\\varepsilon_0}} \\\\\n\\nabla\\cdot\\mathbf{B} &= 0 \\\\\n\\nabla\\times\\mathbf{E} &= -${2:\\frac{\\partial\\mathbf{B}}{\\partial t}} \\\\\n\\nabla\\times\\mathbf{B} &= ${3:\\mu_0\\mathbf{J}+\\mu_0\\varepsilon_0\\frac{\\partial\\mathbf{E}}{\\partial t}}\n\\end{aligned}', domain: 'physics' },
  { id: 'schrodinger', name: 'Schrodinger equation', trigger: 'schrodinger', description: 'Time-dependent Schrodinger equation.', latex: 'i\\hbar\\frac{\\partial ${1:\\Psi}}{\\partial t} = ${2:\\hat{H}}${1:\\Psi}', domain: 'physics' },
  { id: 'reaction', name: 'Chemical reaction', trigger: 'reaction', description: 'Reaction with conditions and states.', latex: '${1:\\mathrm{A(aq)}} + ${2:\\mathrm{B(aq)}} \\xrightarrow{${3:condition}} ${4:\\mathrm{C(aq)}}', domain: 'chemistry' },
  { id: 'rc-circuit', name: 'RC circuit', trigger: 'rc', description: 'RC charging/discharging template.', latex: '${1:V_C(t)} = ${2:V_0}\\left(1-e^{-t/${3:RC}}\\right)', domain: 'electronics' },
  { id: 'transfer-function', name: 'Transfer function', trigger: 'tf', description: 'Generic transfer-function template.', latex: '${1:H(s)} = \\frac{${2:Y(s)}}{${3:X(s)}}', domain: 'electronics' },
];

export const DEFAULT_SETTINGS: LatexToolboxSettings = {
  wrapStyle: 'block',
  convertParens: true,
  forceDisplayMath: false,
  autoWrapBareMath: false,
  defaultDomain: 'general',
  customShortcuts: shortcuts,
  customSnippets: snippets,
  customTemplates: templates,
  recentEquations: [],
  favoriteEquations: [],
  autocompleteEnabled: true,
  autocompleteMaxResults: 10,
  maxInputLength: 1600,
  livePreview: true,
  semanticReviewThreshold: 'medium',
};
