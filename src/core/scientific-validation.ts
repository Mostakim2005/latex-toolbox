import type { ConversionResult, ScienceDomain } from '../types';
import { validateLatex } from './latex-utils';

export const MAX_SCIENTIFIC_INPUT_LENGTH = 1600;

const UNIT_ALIASES: Record<string, string> = {
  meter: 'm', metre: 'm', meters: 'm', metres: 'm',
  second: 's', seconds: 's',
  kilogram: 'kg', kilograms: 'kg', gram: 'g', grams: 'g',
  ampere: 'A', amperes: 'A', amp: 'A', amps: 'A',
  volt: 'V', volts: 'V', voltage: 'V',
  ohm: '\\Omega', ohms: '\\Omega',
  watt: 'W', watts: 'W',
  joule: 'J', joules: 'J',
  newton: 'N', newtons: 'N',
  pascal: 'Pa', pascals: 'Pa',
  hertz: 'Hz',
  coulomb: 'C', coulombs: 'C',
  tesla: 'T', teslas: 'T',
  weber: 'Wb', webers: 'Wb',
  farad: 'F', farads: 'F',
  henry: 'H', henries: 'H',
  kelvin: 'K', kelvins: 'K',
  degree: '^\\circ', degrees: '^\\circ',
  electronvolt: 'eV', electronvolts: 'eV',
};

const DIMENSIONS: Record<string, string> = {
  distance: 'L', length: 'L', displacement: 'L', position: 'L',
  time: 'T',
  mass: 'M',
  velocity: 'L T^-1', speed: 'L T^-1',
  acceleration: 'L T^-2',
  force: 'M L T^-2', weight: 'M L T^-2',
  momentum: 'M L T^-1',
  energy: 'M L^2 T^-2', work: 'M L^2 T^-2', heat: 'M L^2 T^-2',
  power: 'M L^2 T^-3',
  pressure: 'M L^-1 T^-2',
  density: 'M L^-3',
  charge: 'I T',
  current: 'I',
  voltage: 'M L^2 T^-3 I^-1', potential: 'M L^2 T^-3 I^-1',
  resistance: 'M L^2 T^-3 I^-2',
  capacitance: 'M^-1 L^-2 T^4 I^2',
  inductance: 'M L^2 T^-2 I^-2',
  frequency: 'T^-1',
  wavelength: 'L',
};

export function sanitizeScientificInput(input: string): { value: string; issues: string[] } {
  const issues: string[] = [];
  const normalized = Array.from(input, (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? ' ' : char).join('').trim();
  if (normalized.length > MAX_SCIENTIFIC_INPUT_LENGTH) {
    issues.push(`Input is too long; the limit is ${MAX_SCIENTIFIC_INPUT_LENGTH} characters.`);
    return { value: normalized.slice(0, MAX_SCIENTIFIC_INPUT_LENGTH), issues };
  }
  return { value: normalized, issues };
}

export function validateScientificConversion(result: ConversionResult, domain: ScienceDomain, sourceText: string): ConversionResult {
  const latexIssues = result.latex ? validateLatex(result.latex) : [];
  const dimensionIssues = domain === 'math' || domain === 'physics' || domain === 'electronics'
    ? validateSimpleDimensions(sourceText)
    : [];
  const securityIssues = /<\/?(?:script|iframe|object|embed)\b/i.test(result.latex) ? ['Generated output contains an unsafe HTML-like tag.'] : [];
  const issues = [...new Set([...result.issues, ...latexIssues, ...dimensionIssues, ...securityIssues])];
  if (securityIssues.length > 0 || latexIssues.length > 0) {
    return { ...result, confidence: 'low', issues, explanation: 'The generated result failed validation and should be reviewed.' };
  }
  if (dimensionIssues.length > 0 && result.confidence === 'high') {
    return { ...result, confidence: 'medium', issues, explanation: `${result.explanation} Dimensional consistency should be reviewed.` };
  }
  return { ...result, issues };
}

export function unitPhraseToLatex(input: string): string | null {
  const normalized = input.trim().toLowerCase();
  const exact = UNIT_ALIASES[normalized];
  if (exact) return `\\mathrm{${exact}}`;
  const numeric = normalized.match(/^(-?(?:\d+(?:\.\d*)?|\.\d+))\s+(.+)$/);
  if (numeric) {
    const unit = UNIT_ALIASES[numeric[2] ?? ''];
    if (unit) return `${numeric[1]}\\,\\mathrm{${unit}}`;
  }

  const match = normalized.match(/^(.+?)\s+per\s+(.+)$/);
  if (match) {
    const numerator = UNIT_ALIASES[match[1] ?? ''];
    const denominator = UNIT_ALIASES[match[2] ?? ''];
    if (numerator && denominator) return `\\frac{\\mathrm{${numerator}}}{\\mathrm{${denominator}}}`;
  }

  const squared = normalized.match(/^(.+?)\s+squared$/);
  if (squared) {
    const unit = UNIT_ALIASES[squared[1] ?? ''];
    if (unit) return `\\mathrm{${unit}}^2`;
  }
  return null;
}

function validateSimpleDimensions(input: string): string[] {
  const relation = input.match(/^(.+?)\s*(?:equals|=)\s*(.+)$/i);
  if (!relation) return [];
  const left = identifyDimension(relation[1] ?? '');
  const right = identifyDimension(relation[2] ?? '');
  if (!left || !right || left === right) return [];
  return [`Possible dimensional mismatch: left side is [${left}], right side is [${right}].`];
}

function identifyDimension(value: string): string | null {
  let text = value.toLowerCase().trim();
  text = text.replace(/\b(?:the|a|an|formula|expression|quantity|of)\b/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [phrase, dimension] of Object.entries(DIMENSIONS).sort((a, b) => b[0].length - a[0].length)) {
    if (new RegExp(`\\b${escapeRegExp(phrase)}\\b`, 'i').test(text)) return dimension;
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}
