import type { ConversionResult } from '../types';

interface Pattern {
  pattern: RegExp;
  latex: string;
  explanation: string;
}

const NAMED_LAWS: Pattern[] = [
  { pattern: /^ohm(?:'s)?\s+law$/i, latex: 'V = IR', explanation: "Recognized Ohm's law." },
  { pattern: /^kirchhoff(?:'s)?\s+current\s+law$/i, latex: '\\sum I = 0', explanation: "Recognized Kirchhoff's current law." },
  { pattern: /^kirchhoff(?:'s)?\s+voltage\s+law$/i, latex: '\\sum V = 0', explanation: "Recognized Kirchhoff's voltage law." },
  { pattern: /^power$/i, latex: 'P = VI = I^2R = \\frac{V^2}{R}', explanation: 'Recognized the electrical-power relationships.' },
  { pattern: /^joule(?:'s)?\s+law$/i, latex: 'P = I^2R', explanation: "Recognized Joule's law of heating." },
  { pattern: /^capacitor\s+current\s+relationship$/i, latex: 'i_C = C\\frac{dv_C}{dt}', explanation: 'Recognized the capacitor current-voltage relationship.' },
  { pattern: /^inductor\s+voltage\s+relationship$/i, latex: 'v_L = L\\frac{di_L}{dt}', explanation: 'Recognized the inductor voltage-current relationship.' },
  { pattern: /^rc\s+time\s+constant$/i, latex: '\\tau = RC', explanation: 'Recognized the RC time constant.' },
  { pattern: /^rl\s+time\s+constant$/i, latex: '\\tau = \\frac{L}{R}', explanation: 'Recognized the RL time constant.' },
  { pattern: /^rlc\s+resonant\s+angular\s+frequency$/i, latex: '\\omega_0 = \\frac{1}{\\sqrt{LC}}', explanation: 'Recognized the RLC resonance frequency.' },
  { pattern: /^resonant\s+frequency$/i, latex: 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}', explanation: 'Recognized the LC/RLC resonant frequency.' },
  { pattern: /^reactive\s+power$/i, latex: 'Q = VI\\sin\\phi', explanation: 'Recognized reactive AC power.' },
  { pattern: /^apparent\s+power$/i, latex: 'S = VI', explanation: 'Recognized apparent AC power.' },
  { pattern: /^complex\s+power$/i, latex: '\\underline{S} = P + jQ', explanation: 'Recognized complex power.' },
  { pattern: /^power\s+factor$/i, latex: '\\mathrm{pf} = \\cos\\phi', explanation: 'Recognized power factor.' },
  { pattern: /^impedance\s+of\s+resistor$/i, latex: 'Z_R = R', explanation: 'Recognized resistor impedance.' },
  { pattern: /^impedance\s+of\s+capacitor$/i, latex: 'Z_C = \\frac{1}{j\\omega C}', explanation: 'Recognized capacitor impedance.' },
  { pattern: /^impedance\s+of\s+inductor$/i, latex: 'Z_L = j\\omega L', explanation: 'Recognized inductor impedance.' },
  { pattern: /^rl\s+impedance$/i, latex: 'Z_{RL} = R + j\\omega L', explanation: 'Recognized series RL impedance.' },
  { pattern: /^rc\s+impedance$/i, latex: 'Z_{RC} = R + \\frac{1}{j\\omega C}', explanation: 'Recognized series RC impedance.' },
  { pattern: /^rlc\s+impedance$/i, latex: 'Z_{RLC} = R + j\\omega L + \\frac{1}{j\\omega C}', explanation: 'Recognized series RLC impedance.' },
  { pattern: /^admittance$/i, latex: 'Y = \\frac{1}{Z}', explanation: 'Recognized admittance as the reciprocal of impedance.' },
  { pattern: /^conductance$/i, latex: 'G = \\frac{1}{R}', explanation: 'Recognized conductance.' },
  { pattern: /^capacitive\s+reactance$/i, latex: 'X_C = \\frac{1}{\\omega C}', explanation: 'Recognized capacitive reactance.' },
  { pattern: /^inductive\s+reactance$/i, latex: 'X_L = \\omega L', explanation: 'Recognized inductive reactance.' },
  { pattern: /^transformer\s+turns\s+ratio$/i, latex: '\\frac{V_2}{V_1} = \\frac{N_2}{N_1}', explanation: 'Recognized the ideal transformer voltage ratio.' },
  { pattern: /^transformer\s+current\s+ratio$/i, latex: '\\frac{I_2}{I_1} = \\frac{N_1}{N_2}', explanation: 'Recognized the ideal transformer current ratio.' },
  { pattern: /^rc\s+cutoff\s+frequency$/i, latex: 'f_c = \\frac{1}{2\\pi RC}', explanation: 'Recognized the first-order RC cutoff frequency.' },
  { pattern: /^rl\s+cutoff\s+frequency$/i, latex: 'f_c = \\frac{R}{2\\pi L}', explanation: 'Recognized the first-order RL cutoff frequency.' },
  { pattern: /^capacitive\s+voltage\s+divider$/i, latex: '\\frac{V_C}{V_{in}} = \\frac{Z_C}{Z_R + Z_C}', explanation: 'Recognized the impedance-form capacitive divider.' },
  { pattern: /^resistive\s+voltage\s+divider$/i, latex: 'V_{out} = V_{in}\\frac{R_2}{R_1+R_2}', explanation: 'Recognized the resistive voltage-divider formula.' },
  { pattern: /^current\s+divider$/i, latex: 'I_1 = I\\frac{R_2}{R_1+R_2}', explanation: 'Recognized the two-resistor current-divider relationship.' },
  { pattern: /^average\s+power\s+for\s+sinusoidal\s+load$/i, latex: 'P = V_{rms}I_{rms}\\cos\\phi', explanation: 'Recognized sinusoidal real power.' },
  { pattern: /^rms\s+voltage\s+for\s+a\s+sine\s+wave$/i, latex: 'V_{rms} = \\frac{V_{peak}}{\\sqrt{2}}', explanation: 'Recognized RMS voltage for a sinusoid.' },
  { pattern: /^rms\s+current\s+for\s+a\s+sine\s+wave$/i, latex: 'I_{rms} = \\frac{I_{peak}}{\\sqrt{2}}', explanation: 'Recognized RMS current for a sinusoid.' },
  { pattern: /^diode\s+equation$/i, latex: 'I = I_S\\left(e^{\\frac{V_D}{nV_T}} - 1\\right)', explanation: 'Recognized the Shockley diode equation.' },
  { pattern: /^transistor\s+current\s+gain$/i, latex: '\\beta = \\frac{I_C}{I_B}', explanation: 'Recognized BJT current gain.' },
  { pattern: /^bjt\s+emitter\s+current$/i, latex: 'I_E = I_C + I_B', explanation: 'Recognized the BJT emitter-current relationship.' },
  { pattern: /^op.?amp\s+inverting\s+gain$/i, latex: '\\frac{V_{out}}{V_{in}} = -\\frac{R_f}{R_{in}}', explanation: 'Recognized an ideal inverting op-amp gain.' },
  { pattern: /^op.?amp\s+non.?inverting\s+gain$/i, latex: '\\frac{V_{out}}{V_{in}} = 1 + \\frac{R_f}{R_g}', explanation: 'Recognized an ideal non-inverting op-amp gain.' },
  { pattern: /^cutoff\s+frequency$/i, latex: 'f_c = \\frac{1}{2\\pi RC}', explanation: 'Recognized the common first-order RC cutoff frequency.' },
];

const SYMBOLS: Record<string, string> = {
  'ohm': '\\Omega', 'ohms': '\\Omega', 'omega': '\\omega',
  'phase': '\\phi', 'phi': '\\phi', 'rho': '\\rho',
  'micro': '\\mu', 'mu': '\\mu', 'epsilon': '\\varepsilon',
  'delta': '\\Delta', 'theta': '\\theta', 'pi': '\\pi',
  'infinity': '\\infty', 'degree': '^{\\circ}',
  'j': 'j', 'imaginary unit': 'j',
};

const UNITS: Record<string, string> = {
  'ampere': '\\mathrm{A}', 'amperes': '\\mathrm{A}', 'a': '\\mathrm{A}',
  'volt': '\\mathrm{V}', 'volts': '\\mathrm{V}', 'v': '\\mathrm{V}',
  'ohm': '\\Omega', 'ohms': '\\Omega',
  'watt': '\\mathrm{W}', 'watts': '\\mathrm{W}',
  'farad': '\\mathrm{F}', 'farads': '\\mathrm{F}',
  'henry': '\\mathrm{H}', 'henries': '\\mathrm{H}',
  'coulomb': '\\mathrm{C}', 'coulombs': '\\mathrm{C}',
  'siemens': '\\mathrm{S}',
  'tesla': '\\mathrm{T}', 'webers': '\\mathrm{Wb}',
  'hertz': '\\mathrm{Hz}', 'kilohertz': '\\mathrm{kHz}', 'megahertz': '\\mathrm{MHz}',
};

const PREFIXES: Record<string, string> = {
  'nano': 'n', 'micro': '\\mu', 'milli': 'm', 'centi': 'c', 'kilo': 'k',
  'mega': 'M', 'giga': 'G', 'tera': 'T',
};

export function convertElectronics(input: string): ConversionResult | null {
  const value = normalizeElectronicsInput(input);
  if (!value) return null;

  for (const pattern of NAMED_LAWS) {
    if (pattern.pattern.test(value)) {
      return { latex: pattern.latex, confidence: 'high', explanation: pattern.explanation, issues: [] };
    }
  }

  const direct = convertRelationship(value);
  if (direct) return direct;

  const unit = convertQuantityWithUnit(value);
  if (unit) return unit;

  const phasor = convertPhasor(value);
  if (phasor) return phasor;

  const boolean = convertBoolean(value);
  if (boolean) return boolean;

  return null;
}

function normalizeElectronicsInput(input: string): string {
  return input.trim()
    .replace(/[−–—]/g, '-')
    .replace(/×|·/g, '*')
    .replace(/Ω/g, 'ohm')
    .replace(/μ/g, 'micro')
    .replace(/ω/g, 'omega')
    .replace(/φ/g, 'phi')
    .replace(/\s+/g, ' ')
    .replace(/\s*=>\s*/g, ' -> ')
    .trim();
}

function convertRelationship(input: string): ConversionResult | null {
  const normalized = input
    .replace(/\bmultiplied\s+by\b/gi, '*')
    .replace(/\btimes\b/gi, '*')
    .replace(/\bdivided\s+by\b/gi, '/')
    .replace(/\bover\b/gi, '/')
    .replace(/\bequals?\b/gi, '=')
    .replace(/\bis\b/gi, '=')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\bcurrent\b/gi, 'I')
    .replace(/\bvoltage\b/gi, 'V')
    .replace(/\bresistance\b/gi, 'R')
    .replace(/\bpower\b/gi, 'P')
    .replace(/\bcharge\b/gi, 'Q')
    .replace(/\bfrequency\b/gi, 'f')
    .replace(/\bangular\s+frequency\b/gi, 'omega')
    .replace(/\binductance\b/gi, 'L')
    .replace(/\bcapacitance\b/gi, 'C')
    .replace(/\bimpedance\b/gi, 'Z')
    .replace(/\badmittance\b/gi, 'Y')
    .replace(/\bconductance\b/gi, 'G')
    .replace(/\breactance\b/gi, 'X')
    .replace(/\bphase\s+angle\b/gi, 'phi')
    .trim();

  if (!/=/.test(normalized)) return null;
  const parts = normalized.split(/\s*=\s*/);
  if (parts.length !== 2) return null;

  const left = renderCircuitExpression(parts[0] ?? '');
  const right = renderCircuitExpression(parts[1] ?? '');
  if (!left || !right) return null;

  return {
    latex: `${left} = ${right}`,
    confidence: 'high',
    explanation: 'Recognized an electrical/electronics relationship.',
    issues: [],
  };
}

function renderCircuitExpression(input: string): string {
  let value = input.trim();
  value = value.replace(/\b(omega|phi|micro)\b/gi, (match) => SYMBOLS[match.toLowerCase()] ?? match);
  value = value.replace(/\b(Vin)\b/g, 'V_{in}').replace(/\b(Vout)\b/g, 'V_{out}');
  value = value.replace(/\b(Iin)\b/g, 'I_{in}').replace(/\b(Iout)\b/g, 'I_{out}');
  value = value.replace(/\b(Rin)\b/g, 'R_{in}').replace(/\b(Rout)\b/g, 'R_{out}');
  value = value.replace(/\b(R1|R2|R3|L1|L2|C1|C2)\b/g, (m) => `${m[0]}_{${m.slice(1)}}`);
  value = value.replace(/\b([a-zA-Z])\s*\^\s*([a-zA-Z0-9+-]+)/g, '$1^{$2}');
  value = value.replace(/\b([a-zA-Z])\s*\/\s*([a-zA-Z0-9]+)/g, '\\frac{$1}{$2}');
  value = value.replace(/\bj\s*([A-Za-z])/g, 'j$1');
  value = value.replace(/\s*\*\s*/g, '\\,');
  value = value.replace(/\s+/g, ' ');
  return value.trim();
}

function convertQuantityWithUnit(input: string): ConversionResult | null {
  const match = input.match(/^(.+?)\s+([A-Za-z]+)$/i);
  if (!match) return null;
  const numberOrExpression = match[1]?.trim() ?? '';
  const unitKey = (match[2] ?? '').toLowerCase();
  let unit = UNITS[unitKey];
  if (!unit && /^(k|m|micro|n)ohms?$/.test(unitKey)) {
    const prefix: keyof typeof PREFIXES = unitKey.startsWith('micro') ? 'micro' : (unitKey[0] as keyof typeof PREFIXES);
    const prefixLatex = prefix === 'micro' ? '\\mu' : `\\mathrm{${PREFIXES[prefix] ?? prefix}}`;
    unit = `${prefixLatex}\\Omega`;
  }
  if (!unit || !/^[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?$/i.test(numberOrExpression)) return null;
  return {
    latex: `${numberOrExpression}\\,${unit}`,
    confidence: 'high',
    explanation: 'Recognized an electrical quantity with an SI unit.',
    issues: [],
  };
}

function convertPhasor(input: string): ConversionResult | null {
  const match = input.match(/^(?:phasor\s+)?(.+?)\s+angle\s+(.+)$/i);
  if (!match) return null;
  const magnitude = renderCircuitExpression(match[1] ?? '');
  const angle = renderCircuitExpression(match[2] ?? '');
  if (!magnitude || !angle) return null;
  return {
    latex: `\\underline{${magnitude}} = ${magnitude}\\angle ${angle}`,
    confidence: 'medium',
    explanation: 'Recognized phasor magnitude-angle notation; review the intended phasor symbol.',
    issues: [],
  };
}

function convertBoolean(input: string): ConversionResult | null {
  const normalized = input.toLowerCase().trim();
  if (!/(boolean|logic|and|or|not|nand|nor|xor|xnor)/.test(normalized)) return null;
  let expression = input;
  expression = expression.replace(/\bAND\b/gi, '\\land');
  expression = expression.replace(/\bOR\b/gi, '\\lor');
  expression = expression.replace(/\bNOT\b/gi, '\\lnot');
  expression = expression.replace(/\bNAND\b/gi, '\\uparrow');
  expression = expression.replace(/\bNOR\b/gi, '\\downarrow');
  expression = expression.replace(/\bXOR\b/gi, '\\oplus');
  expression = expression.replace(/\bXNOR\b/gi, '\\odot');
  expression = expression.replace(/\bTRUE\b/gi, '\\mathrm{T}').replace(/\bFALSE\b/gi, '\\mathrm{F}');
  return { latex: expression, confidence: 'high', explanation: 'Recognized a digital-logic expression.', issues: [] };
}

export function renderEngineeringUnit(prefix: string, unit: string): string | null {
  const normalizedPrefix = prefix.trim().toLowerCase();
  const normalizedUnit = unit.trim().toLowerCase();
  const prefixLatex = PREFIXES[normalizedPrefix];
  const unitLatex = UNITS[normalizedUnit];
  if (!unitLatex) return null;
  if (!prefixLatex) return unitLatex;
  return `${prefixLatex}${unitLatex}`;
}
