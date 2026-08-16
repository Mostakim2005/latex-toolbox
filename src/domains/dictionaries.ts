import type { ScienceDomain } from '../types';

export const MATH_TERMS: Record<string, string> = {
  'natural logarithm': '\\ln', logarithm: '\\log', log: '\\log', ln: '\\ln',
  sine: '\\sin', cosine: '\\cos', tangent: '\\tan', sin: '\\sin', cos: '\\cos', tan: '\\tan',
  cotangent: '\\cot', secant: '\\sec', cosecant: '\\csc',
  derivative: '\\frac{d}{dx}', partial: '\\partial', gradient: '\\nabla',
  determinant: '\\det', trace: '\\operatorname{tr}',
  expectation: '\\mathbb{E}', variance: '\\operatorname{Var}',
  'standard deviation': '\\sigma',
  'real numbers': '\\mathbb{R}', 'integers': '\\mathbb{Z}', 'natural numbers': '\\mathbb{N}',
  'rational numbers': '\\mathbb{Q}', 'complex numbers': '\\mathbb{C}',
};

export const SYMBOLS: Record<string, string> = {
  alpha: '\\alpha', beta: '\\beta', gamma: '\\gamma', delta: '\\delta', epsilon: '\\epsilon', varepsilon: '\\varepsilon', zeta: '\\zeta', eta: '\\eta', theta: '\\theta', vartheta: '\\vartheta', iota: '\\iota', kappa: '\\kappa', lambda: '\\lambda', mu: '\\mu', nu: '\\nu', xi: '\\xi', pi: '\\pi', rho: '\\rho', sigma: '\\sigma', tau: '\\tau', phi: '\\phi', varphi: '\\varphi', chi: '\\chi', psi: '\\psi', omega: '\\omega',
  Gamma: '\\Gamma', Delta: '\\Delta', Theta: '\\Theta', Lambda: '\\Lambda', Xi: '\\Xi', Pi: '\\Pi', Sigma: '\\Sigma', Phi: '\\Phi', Psi: '\\Psi', Omega: '\\Omega',
  infinity: '\\infty', infty: '\\infty', partial: '\\partial', nabla: '\\nabla', hbar: '\\hbar', times: '\\times', cdot: '\\cdot', degree: '^{\\circ}', plusminus: '\\pm',
  implies: '\\Rightarrow', iff: '\\iff', therefore: '\\therefore', because: '\\because', proportional: '\\propto', approximately: '\\approx', 'not equal': '\\neq', 'less than or equal': '\\leq', 'greater than or equal': '\\geq',
  'much less than': '\\ll', 'much greater than': '\\gg', in: '\\in', 'not in': '\\notin', subset: '\\subset', subseteq: '\\subseteq', union: '\\cup', intersection: '\\cap', 'empty set': '\\varnothing', forall: '\\forall', exists: '\\exists',
};

export const PHYSICS_TERMS: Record<string, string> = {
  'electric field': '\\mathbf{E}', 'magnetic field': '\\mathbf{B}', force: 'F', momentum: 'p', energy: 'E', mass: 'm', velocity: 'v', acceleration: 'a', charge: 'q', current: 'I', voltage: 'V', resistance: 'R',
  'planck constant': 'h', 'reduced planck constant': '\\hbar', 'speed of light': 'c', 'gravitational constant': 'G', 'boltzmann constant': 'k_B', 'coulomb constant': 'k_e', 'permittivity of free space': '\\varepsilon_0', 'permeability of free space': '\\mu_0',
};

export const CHEMISTRY_TERMS: Record<string, string> = {
  water: '\\mathrm{H_2O}', hydrogen: '\\mathrm{H_2}', oxygen: '\\mathrm{O_2}', nitrogen: '\\mathrm{N_2}', 'carbon dioxide': '\\mathrm{CO_2}', 'sodium chloride': '\\mathrm{NaCl}', ammonia: '\\mathrm{NH_3}', methane: '\\mathrm{CH_4}',
  'hydrogen ion': '\\mathrm{H^+}', 'hydroxide ion': '\\mathrm{OH^-}', 'sodium ion': '\\mathrm{Na^+}', 'chloride ion': '\\mathrm{Cl^-}', 'sulfate ion': '\\mathrm{SO_4^{2-}}', 'carbonate ion': '\\mathrm{CO_3^{2-}}',
};

export const ELECTRONICS_TERMS: Record<string, string> = {
  'ohm law': 'V = IR', "ohm's law": 'V = IR', 'kirchhoff current law': '\\sum I = 0', 'kirchhoff voltage law': '\\sum V = 0', 'inductive reactance': 'X_L = \\omega L', 'capacitive reactance': 'X_C = \\frac{1}{\\omega C}',
  impedance: 'Z', admittance: 'Y', 'angular frequency': '\\omega', capacitance: 'C', inductance: 'L', 'impedance formula': 'Z = R + jX',
};

export const DOMAIN_LABELS: Record<ScienceDomain, string> = {
  general: 'General science', math: 'Mathematics', physics: 'Physics', chemistry: 'Chemistry', electronics: 'Electrical & electronics',
};
