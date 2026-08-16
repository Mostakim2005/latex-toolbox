import type { ConversionResult } from '../types';
import { parseScientificExpression } from './expression-parser';

interface PhysicsPattern {
  pattern: RegExp;
  latex: string;
  explanation: string;
}

const PHYSICS_PATTERNS: PhysicsPattern[] = [
  { pattern: /^newton(?:'s)?\s+second\s+law$/i, latex: '\\mathbf{F}=m\\mathbf{a}', explanation: "Recognized Newton's second law in vector form." },
  { pattern: /^force\s*=\s*mass\s*(?:times|x|\*)\s*acceleration$/i, latex: 'F=ma', explanation: "Recognized Newton's second law." },
  { pattern: /^newton(?:'s)?\s+first\s+law$/i, latex: '\\sum\\mathbf{F}=0\\;\\Rightarrow\\;\\mathbf{a}=0', explanation: "Recognized Newton's first law." },
  { pattern: /^newton(?:'s)?\s+third\s+law$/i, latex: '\\mathbf{F}_{12}=-\\mathbf{F}_{21}', explanation: "Recognized Newton's third law." },
  { pattern: /^kinetic\s+energy$/i, latex: 'K=\\frac{1}{2}mv^2', explanation: 'Recognized kinetic energy.' },
  { pattern: /^(?:gravitational\s+)?potential\s+energy$/i, latex: 'U=mgh', explanation: 'Recognized gravitational potential energy near Earth.' },
  { pattern: /^momentum$/i, latex: '\\mathbf{p}=m\\mathbf{v}', explanation: 'Recognized linear momentum.' },
  { pattern: /^impulse$/i, latex: '\\mathbf{J}=\\Delta\\mathbf{p}=\\int\\mathbf{F}\,dt', explanation: 'Recognized impulse as change in momentum.' },
  { pattern: /^work$/i, latex: 'W=\\int\\mathbf{F}\\cdot d\\mathbf{r}', explanation: 'Recognized mechanical work.' },
  { pattern: /^power$/i, latex: 'P=\\frac{dW}{dt}=\\mathbf{F}\\cdot\\mathbf{v}', explanation: 'Recognized mechanical power.' },
  { pattern: /^centripetal\s+force$/i, latex: 'F_c=\\frac{mv^2}{r}=m\\omega^2r', explanation: 'Recognized centripetal force.' },
  { pattern: /^centripetal\s+acceleration$/i, latex: 'a_c=\\frac{v^2}{r}=\\omega^2r', explanation: 'Recognized centripetal acceleration.' },
  { pattern: /^hooke(?:'s)?\s+law$/i, latex: 'F=-kx', explanation: "Recognized Hooke's law." },
  { pattern: /^spring\s+potential\s+energy$/i, latex: 'U=\\frac{1}{2}kx^2', explanation: 'Recognized spring potential energy.' },
  { pattern: /^density$/i, latex: '\\rho=\\frac{m}{V}', explanation: 'Recognized mass density.' },
  { pattern: /^pressure$/i, latex: 'p=\\frac{F}{A}', explanation: 'Recognized pressure as force per area.' },
  { pattern: /^first\s+kinematic\s+equation$/i, latex: 'v=u+at', explanation: 'Recognized the first constant-acceleration equation.' },
  { pattern: /^second\s+kinematic\s+equation$/i, latex: 's=ut+\\frac{1}{2}at^2', explanation: 'Recognized the second constant-acceleration equation.' },
  { pattern: /^third\s+kinematic\s+equation$/i, latex: 'v^2=u^2+2as', explanation: 'Recognized the third constant-acceleration equation.' },
  { pattern: /^newton(?:'s)?\s+law\s+of\s+universal\s+gravitation$/i, latex: 'F=G\\frac{m_1m_2}{r^2}', explanation: "Recognized Newton's universal gravitation law." },
  { pattern: /^gravitational\s+field\s+strength$/i, latex: 'g=\\frac{F}{m}', explanation: 'Recognized gravitational field strength.' },
  { pattern: /^escape\s+velocity$/i, latex: 'v_e=\\sqrt{\\frac{2GM}{R}}', explanation: 'Recognized escape velocity.' },
  { pattern: /^ideal\s+gas\s+law$/i, latex: 'PV=nRT', explanation: 'Recognized the ideal-gas law.' },
  { pattern: /^pressure\s+equals\s+density\s+times\s+g\s+times\s+height$/i, latex: 'p=\\rho gh', explanation: 'Recognized hydrostatic pressure.' },
  { pattern: /^heat\s+equals\s+mass\s+times\s+specific\s+heat\s+capacity\s+times\s+change\s+in\s+temperature$/i, latex: 'Q=mc\\Delta T', explanation: 'Recognized sensible heat transfer.' },
  { pattern: /^first\s+law\s+of\s+thermodynamics$/i, latex: '\\Delta U=Q-W', explanation: 'Recognized the first law of thermodynamics using work done by the system.' },
  { pattern: /^efficiency$/i, latex: '\\eta=\\frac{\\text{useful output}}{\\text{total input}}\\times100\\%', explanation: 'Recognized efficiency.' },
  { pattern: /^wave\s+speed\s*=\s*frequency\s+\*\s+wavelength$/i, latex: 'v=f\\lambda', explanation: 'Recognized the wave-speed relation.' },
  { pattern: /^refractive\s+index$/i, latex: 'n=\\frac{c}{v}', explanation: 'Recognized refractive index in terms of wave speed.' },
  { pattern: /^snell(?:'s)?\s+law$/i, latex: 'n_1\\sin\\theta_1=n_2\\sin\\theta_2', explanation: "Recognized Snell's law." },
  { pattern: /^thin\s+lens\s+formula$/i, latex: '\\frac{1}{f}=\\frac{1}{u}+\\frac{1}{v}', explanation: 'Recognized the thin-lens formula; sign convention may depend on convention.' },
  { pattern: /^lens\s+magnification$/i, latex: 'm=\\frac{v}{u}=\\frac{h_i}{h_o}', explanation: 'Recognized lens magnification.' },
  { pattern: /^coulomb(?:'s)?\s+law$/i, latex: 'F=k_e\\frac{|q_1q_2|}{r^2}', explanation: "Recognized Coulomb's law magnitude." },
  { pattern: /^electric\s+field$/i, latex: '\\mathbf{E}=\\frac{\\mathbf{F}}{q}', explanation: 'Recognized electric field definition.' },
  { pattern: /^electric\s+potential$/i, latex: 'V=\\frac{W}{q}', explanation: 'Recognized electric potential definition.' },
  { pattern: /^electric\s+potential\s+energy$/i, latex: 'U=qV', explanation: 'Recognized electric potential energy.' },
  { pattern: /^capacitance$/i, latex: 'C=\\frac{Q}{V}', explanation: 'Recognized capacitance definition.' },
  { pattern: /^electrical\s+power$/i, latex: 'P=VI=I^2R=\\frac{V^2}{R}', explanation: 'Recognized common electrical power relations.' },
  { pattern: /^kirchhoff(?:'s)?\s+current\s+law$/i, latex: '\\sum I=0', explanation: "Recognized Kirchhoff's current law." },
  { pattern: /^kirchhoff(?:'s)?\s+voltage\s+law$/i, latex: '\\sum V=0', explanation: "Recognized Kirchhoff's voltage law." },
  { pattern: /^lorentz\s+force$/i, latex: '\\mathbf{F}=q(\\mathbf{E}+\\mathbf{v}\\times\\mathbf{B})', explanation: 'Recognized the Lorentz force law.' },
  { pattern: /^magnetic\s+force\s+on\s+a\s+charge$/i, latex: '\\mathbf{F}=q\\mathbf{v}\\times\\mathbf{B}', explanation: 'Recognized magnetic force on a moving charge.' },
  { pattern: /^magnetic\s+flux$/i, latex: '\\Phi_B=\\int\\mathbf{B}\\cdot d\\mathbf{A}', explanation: 'Recognized magnetic flux.' },
  { pattern: /^faraday(?:'s)?\s+law$/i, latex: '\\mathcal{E}=-\\frac{d\\Phi_B}{dt}', explanation: "Recognized Faraday's law of induction." },
  { pattern: /^gauss(?:'s)?\s+law$/i, latex: '\\oint\\mathbf{E}\\cdot d\\mathbf{A}=\\frac{Q_{\\mathrm{enc}}}{\\varepsilon_0}', explanation: "Recognized Gauss's law in integral form." },
  { pattern: /^ampere(?:'s)?\s+law$/i, latex: '\\oint\\mathbf{B}\\cdot d\\mathbf{l}=\\mu_0 I_{\\mathrm{enc}}', explanation: "Recognized Ampere's law in simple magnetostatic form." },
  { pattern: /^maxwell(?:'s)?\s+equations$/i, latex: '\\nabla\\cdot\\mathbf{E}=\\frac{\\rho}{\\varepsilon_0},\\quad\\nabla\\cdot\\mathbf{B}=0,\\quad\\nabla\\times\\mathbf{E}=-\\frac{\\partial\\mathbf{B}}{\\partial t},\\quad\\nabla\\times\\mathbf{B}=\\mu_0\\mathbf{J}+\\mu_0\\varepsilon_0\\frac{\\partial\\mathbf{E}}{\\partial t}', explanation: "Recognized Maxwell's equations in differential form." },
  { pattern: /^einstein(?:'s)?\s+mass.?energy\s+equivalence$/i, latex: 'E=mc^2', explanation: 'Recognized mass-energy equivalence.' },
  { pattern: /^photon\s+energy$/i, latex: 'E=hf=\\frac{hc}{\\lambda}', explanation: 'Recognized photon energy.' },
  { pattern: /^de\s+broglie\s+wavelength$/i, latex: '\\lambda=\\frac{h}{p}', explanation: 'Recognized the de Broglie relation.' },
  { pattern: /^uncertainty\s+principle$/i, latex: '\\Delta x\\,\\Delta p\\ge\\frac{\\hbar}{2}', explanation: 'Recognized the Heisenberg uncertainty principle.' },
  { pattern: /^schr(?:o|ö)dinger(?:'s)?\s+equation$/i, latex: 'i\\hbar\\frac{\\partial\\Psi}{\\partial t}=\\hat{H}\\Psi', explanation: "Recognized the time-dependent Schrödinger equation." },
  { pattern: /^compton\s+relation$/i, latex: '\\Delta\\lambda=\\frac{h}{m_ec}(1-\\cos\\theta)', explanation: 'Recognized the Compton wavelength shift relation.' },
];

const QUANTITY_ALIASES: Record<string, string> = {
  displacement: 's', distance: 's', position: 'x', time: 't', 'initial velocity': 'u', 'final velocity': 'v',
  velocity: 'v', speed: 'v', acceleration: 'a', mass: 'm', force: 'F', momentum: 'p', energy: 'E', power: 'P', work: 'W',
  charge: 'q', current: 'I', voltage: 'V', resistance: 'R', capacitance: 'C', inductance: 'L', frequency: 'f', wavelength: '\\lambda',
  'angular frequency': '\\omega', period: 'T', pressure: 'p', density: '\\rho', volume: 'V', temperature: 'T', heat: 'Q', area: 'A',
  'electric field': '\\mathbf{E}', 'magnetic field': '\\mathbf{B}', 'magnetic flux': '\\Phi_B', 'electric potential': 'V',
  'gravitational field': 'g', 'spring constant': 'k', 'refractive index': 'n', 'focal length': 'f', angle: '\\theta',
  impulse: '\\mathbf{J}', torque: '\\tau', 'angular momentum': '\\mathbf{L}',
};

const CONSTANTS: Record<string, string> = {
  'speed of light': 'c', 'vacuum speed of light': 'c', 'gravitational constant': 'G', 'planck constant': 'h',
  'reduced planck constant': '\\hbar', 'boltzmann constant': 'k_B', 'elementary charge': 'e', 'electron charge': 'e',
  'permittivity of free space': '\\varepsilon_0', 'permeability of free space': '\\mu_0', 'avogadro constant': 'N_A',
  'gas constant': 'R', 'coulomb constant': 'k_e', 'electron mass': 'm_e', 'proton mass': 'm_p', 'neutron mass': 'm_n',
};

const UNITS: Record<string, string> = {
  'meter per second': '\\mathrm{m\\,s^{-1}}', 'metre per second': '\\mathrm{m\\,s^{-1}}',
  'meters per second': '\\mathrm{m\\,s^{-1}}', 'metres per second': '\\mathrm{m\\,s^{-1}}',
  'meter per second squared': '\\mathrm{m\\,s^{-2}}', 'metre per second squared': '\\mathrm{m\\,s^{-2}}',
  'meters per second squared': '\\mathrm{m\\,s^{-2}}', 'metres per second squared': '\\mathrm{m\\,s^{-2}}',
  meter: '\\mathrm{m}', metre: '\\mathrm{m}', meters: '\\mathrm{m}', metres: '\\mathrm{m}', second: '\\mathrm{s}', seconds: '\\mathrm{s}',
  kilogram: '\\mathrm{kg}', kilograms: '\\mathrm{kg}', newton: '\\mathrm{N}', newtons: '\\mathrm{N}', joule: '\\mathrm{J}', joules: '\\mathrm{J}',
  watt: '\\mathrm{W}', watts: '\\mathrm{W}', pascal: '\\mathrm{Pa}', pascals: '\\mathrm{Pa}', coulomb: '\\mathrm{C}', coulombs: '\\mathrm{C}',
  volt: '\\mathrm{V}', volts: '\\mathrm{V}', ohm: '\\Omega', ohms: '\\Omega', ampere: '\\mathrm{A}', amperes: '\\mathrm{A}',
  tesla: '\\mathrm{T}', weber: '\\mathrm{Wb}', farad: '\\mathrm{F}', farads: '\\mathrm{F}', henry: '\\mathrm{H}', kelvin: '\\mathrm{K}',
};

export function convertPhysics(input: string): ConversionResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = normalizePhysicsText(trimmed);

  const direct = matchPhysicsPattern(normalized);
  if (direct) return direct;

  const relation = convertQuantityRelation(normalized);
  if (relation) return relation;

  const vectorRelation = convertPhysicsVectorRelation(trimmed);
  if (vectorRelation) return vectorRelation;

  const unit = UNITS[trimmed.toLowerCase()] ?? parsePrefixedUnit(trimmed);
  if (unit) return { latex: unit, confidence: 'high', explanation: `Recognized the SI unit “${trimmed}”.`, issues: [] };

  const constant = CONSTANTS[trimmed.toLowerCase()];
  if (constant) return { latex: constant, confidence: 'high', explanation: `Recognized the physics constant “${trimmed}”.`, issues: [] };

  return null;
}

function normalizePhysicsText(input: string): string {
  return input
    .normalize('NFKC')
    .replace(/[−–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/\s+equals\s+/gi, ' = ')
    .replace(/\s+times\s+/gi, ' * ')
    .replace(/\s+multiplied\s+by\s+/gi, ' * ')
    .replace(/\s+plus\s+/gi, ' + ')
    .replace(/\s+minus\s+/gi, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchPhysicsPattern(normalized: string): ConversionResult | null {
  for (const entry of PHYSICS_PATTERNS) {
    if (entry.pattern.test(normalized)) {
      return { latex: entry.latex, confidence: 'high', explanation: entry.explanation, issues: [] };
    }
  }
  return null;
}

function convertQuantityRelation(input: string): ConversionResult | null {
  const match = input.match(/^(.+?)\s*=\s*(.+)$/);
  if (!match) return null;
  const left = resolveQuantity(match[1] ?? '');
  if (!left) return null;
  const right = physicsExpression(match[2] ?? '');
  if (!right) return null;
  return { latex: `${left}=${right}`, confidence: 'high', explanation: 'Recognized a physics quantity relation and converted its terms semantically.', issues: [] };
}

function physicsExpression(input: string): string | null {
  let text = input.trim();
  for (const [phrase, latex] of Object.entries(CONSTANTS).sort((a, b) => b[0].length - a[0].length)) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi'), latex);
  }
  for (const [phrase, latex] of Object.entries(QUANTITY_ALIASES).sort((a, b) => b[0].length - a[0].length)) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'gi'), latex);
  }
  text = text.replace(/\bdelta\s+([A-Za-z])\b/gi, '\\Delta$1');
  text = text.replace(/\bdivided\s+by\b/gi, ' / ').replace(/\bover\b/gi, ' / ').replace(/\btimes\b/gi, ' * ').replace(/\bmultiplied\s+by\b/gi, ' * ');
  text = text.replace(/\bsquared\b/gi, '^2').replace(/\bcubed\b/gi, '^3');
  text = text.replace(/\s+/g, ' ').trim();

  const parsed = parseScientificExpression(text, { dictionary: {} });
  if (parsed.latex && !parsed.ambiguous && parsed.unknownWords.length === 0) return parsed.latex;
  if (/^[A-Za-z0-9\\_{}^+\-*/. ()]+$/.test(text)) return cleanupPhysicsLatex(text);
  return null;
}

function resolveQuantity(input: string): string | null {
  return QUANTITY_ALIASES[input.trim().toLowerCase()] ?? null;
}

function parsePrefixedUnit(input: string): string | null {
  const normalized = input.trim().toLowerCase();
  const prefixes: Record<string, string> = {
    kilo: 'k', mega: 'M', giga: 'G', tera: 'T', centi: 'c', milli: 'm', micro: '\\mu ', nano: 'n', pico: 'p',
  };
  const bases: Record<string, string> = {
    meter: 'm', metre: 'm', second: 's', gram: 'g', hertz: 'Hz', newton: 'N', joule: 'J', watt: 'W', pascal: 'Pa',
    coulomb: 'C', volt: 'V', ampere: 'A', ohm: '\\Omega', tesla: 'T', weber: 'Wb', farad: 'F', henry: 'H',
  };
  for (const [prefix, symbol] of Object.entries(prefixes)) {
    for (const [base, baseSymbol] of Object.entries(bases)) {
      if (normalized === `${prefix}${base}` || normalized === `${prefix}${base}s`) return `\\mathrm{${symbol}${baseSymbol}}`;
    }
  }
  return null;
}

function convertPhysicsVectorRelation(input: string): ConversionResult | null {
  const cross = input.match(/^(.+?)\s+(?:cross\s+product|cross)\s+(.+)$/i);
  if (cross) {
    const left = physicsExpression(cross[1] ?? '') ?? cross[1]?.trim() ?? '';
    const right = physicsExpression(cross[2] ?? '') ?? cross[2]?.trim() ?? '';
    return { latex: `${left}\\times${right}`, confidence: 'high', explanation: 'Recognized a vector cross-product relation.', issues: [] };
  }
  const dot = input.match(/^(.+?)\s+(?:dot\s+product|dot)\s+(.+)$/i);
  if (dot) {
    const left = physicsExpression(dot[1] ?? '') ?? dot[1]?.trim() ?? '';
    const right = physicsExpression(dot[2] ?? '') ?? dot[2]?.trim() ?? '';
    return { latex: `${left}\\cdot${right}`, confidence: 'high', explanation: 'Recognized a vector dot-product relation.', issues: [] };
  }
  return null;
}

function cleanupPhysicsLatex(value: string): string {
  return value.replace(/\s*=\s*/g, '=').replace(/\s*\*\s*/g, '\\,').replace(/([A-Za-z0-9})])\^([A-Za-z0-9]+)/g, '$1^{$2}');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}
