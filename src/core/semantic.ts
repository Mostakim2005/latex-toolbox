import type { ConversionResult, ScienceDomain, SemanticCandidate, Shortcut } from '../types';
import { convertChemistry } from './chemistry';
import { convertElectronics } from './electronics';
import { convertPhysics } from './physics';
import { normalizeExpressionLanguage, parseScientificExpression } from './expression-parser';
import { CHEMISTRY_TERMS, ELECTRONICS_TERMS, MATH_TERMS, PHYSICS_TERMS, SYMBOLS } from '../domains/dictionaries';

interface IntentPattern {
  id: string;
  domain: ScienceDomain;
  patterns: RegExp[];
  latex: string;
  explanation: string;
  score: number;
}

const INTENTS: IntentPattern[] = [
  { id: 'physics.newton2', domain: 'physics', patterns: [/^(?:newton(?:'s)? second law|force equals? mass (?:times|multiplied by) acceleration)$/i, /^(?:formula|equation|expression) for newton(?:'s)? second law$/i], latex: '\\mathbf{F}=m\\mathbf{a}', explanation: "Recognized Newton's second law.", score: 100 },
  { id: 'physics.kinetic-energy', domain: 'physics', patterns: [/^(?:kinetic energy|formula for kinetic energy|equation for kinetic energy)$/i], latex: 'K=\\frac{1}{2}mv^2', explanation: 'Recognized the kinetic-energy relationship.', score: 96 },
  { id: 'physics.gravitational-potential', domain: 'physics', patterns: [/^(?:gravitational potential energy|potential energy near earth|formula for gravitational potential energy)$/i], latex: 'U=mgh', explanation: "Recognized gravitational potential energy near Earth's surface.", score: 95 },
  { id: 'physics.coulomb', domain: 'physics', patterns: [/^(?:coulomb(?:'s)? law|formula for coulomb(?:'s)? law)$/i], latex: 'F=k_e\\frac{|q_1q_2|}{r^2}', explanation: "Recognized Coulomb's law.", score: 96 },
  { id: 'physics.mass-energy', domain: 'physics', patterns: [/^(?:einstein(?:'s)? mass[ -]?energy equivalence|mass[ -]?energy equivalence|formula for mass[ -]?energy equivalence)$/i], latex: 'E = mc^2', explanation: "Recognized mass-energy equivalence.", score: 96 },
  { id: 'physics.wave', domain: 'physics', patterns: [/^(?:wave equation|wave speed equation|formula for wave speed)$/i], latex: 'v=f\\lambda', explanation: 'Recognized the standard wave-speed relationship.', score: 94 },
  { id: 'physics.ideal-gas', domain: 'physics', patterns: [/^(?:ideal gas law|formula for the ideal gas law)$/i], latex: 'PV=nRT', explanation: 'Recognized the ideal-gas law.', score: 98 },
  { id: 'physics.photon-energy', domain: 'physics', patterns: [/^(?:photon energy|energy of a photon|formula for photon energy)$/i], latex: 'E=hf=\\frac{hc}{\\lambda}', explanation: 'Recognized the photon-energy relation.', score: 94 },
  { id: 'physics.momentum', domain: 'physics', patterns: [/^(?:momentum|linear momentum|formula for momentum)$/i], latex: '\\mathbf{p}=m\\mathbf{v}', explanation: 'Recognized linear momentum.', score: 93 },
  { id: 'electronics.ohm', domain: 'electronics', patterns: [/^(?:ohm(?:'s)? law|voltage equals? current (?:times|multiplied by) resistance|formula for ohm(?:'s)? law)$/i], latex: 'V = IR', explanation: "Recognized Ohm's law.", score: 100 },
  { id: 'electronics.kcl', domain: 'electronics', patterns: [/^(?:kirchhoff(?:'s)? current law|kcl|formula for kirchhoff(?:'s)? current law)$/i], latex: '\\sum I = 0', explanation: "Recognized Kirchhoff's current law (KCL).", score: 99 },
  { id: 'electronics.kvl', domain: 'electronics', patterns: [/^(?:kirchhoff(?:'s)? voltage law|kvl|formula for kirchhoff(?:'s)? voltage law)$/i], latex: '\\sum V = 0', explanation: "Recognized Kirchhoff's voltage law (KVL).", score: 99 },
  { id: 'electronics.capacitor-impedance', domain: 'electronics', patterns: [/^(?:capacitor impedance|impedance of a capacitor|formula for capacitor impedance)$/i], latex: 'Z_C = \\frac{1}{j\\omega C}', explanation: 'Recognized the ideal capacitor impedance.', score: 95 },
  { id: 'electronics.inductor-impedance', domain: 'electronics', patterns: [/^(?:inductor impedance|impedance of an inductor|formula for inductor impedance)$/i], latex: 'Z_L = j\\omega L', explanation: 'Recognized the ideal inductor impedance.', score: 95 },
  { id: 'electronics.resonance', domain: 'electronics', patterns: [/^(?:resonant frequency|formula for resonant frequency|rlc resonant frequency)$/i], latex: 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}', explanation: 'Recognized the ideal RLC resonant frequency.', score: 95 },
  { id: 'chemistry.water', domain: 'chemistry', patterns: [/^(?:water|formula for water|chemical formula of water)$/i], latex: '\\mathrm{H_2O}', explanation: 'Recognized the chemical formula for water.', score: 98 },
  { id: 'chemistry.carbon-dioxide', domain: 'chemistry', patterns: [/^(?:carbon dioxide|formula for carbon dioxide|chemical formula of carbon dioxide)$/i], latex: '\\mathrm{CO_2}', explanation: 'Recognized the chemical formula for carbon dioxide.', score: 98 },
  { id: 'chemistry.water-formation', domain: 'chemistry', patterns: [/^(?:formation of water|water formation|hydrogen and oxygen form water)$/i], latex: '2\\,\\mathrm{H_2} + \\mathrm{O_2} \\rightarrow 2\\,\\mathrm{H_2O}', explanation: 'Recognized the balanced formation reaction for water.', score: 99 },
  { id: 'chemistry.hcl', domain: 'chemistry', patterns: [/^(?:hydrochloric acid|formula for hydrochloric acid)$/i], latex: '\\mathrm{HCl}', explanation: 'Recognized the formula for hydrochloric acid.', score: 97 },
  { id: 'math.euler', domain: 'math', patterns: [/^(?:euler(?:'s)? identity|formula for euler(?:'s)? identity)$/i], latex: 'e^{i\\pi}+1=0', explanation: "Recognized Euler's identity.", score: 99 },
  { id: 'math.quadratic', domain: 'math', patterns: [/^(?:quadratic formula|formula for solving a quadratic)$/i], latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', explanation: 'Recognized the quadratic formula.', score: 99 },
  { id: 'math.pythagorean', domain: 'math', patterns: [/^(?:pythagorean theorem|formula for the pythagorean theorem)$/i], latex: 'a^2+b^2=c^2', explanation: 'Recognized the Pythagorean theorem.', score: 99 },
  { id: 'math.derivative-power', domain: 'math', patterns: [/^(?:power rule|derivative power rule|formula for the power rule)$/i], latex: '\\frac{d}{dx}x^n=nx^{n-1}', explanation: 'Recognized the power rule for differentiation.', score: 97 },
  { id: 'math.taylor', domain: 'math', patterns: [/^(?:taylor series|taylor expansion)$/i, /^(?:maclaurin series|maclaurin expansion)$/i], latex: 'f(x)=\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(a)}{n!}(x-a)^n', explanation: 'Recognized a Taylor-series intent; the expansion point and function may need customization.', score: 89 },
  { id: 'math.fourier', domain: 'math', patterns: [/^(?:fourier transform|continuous fourier transform)$/i], latex: '\\mathcal{F}\\{f(t)\\}(\\omega)=\\int_{-\\infty}^{\\infty}f(t)e^{-i\\omega t}\\,dt', explanation: 'Recognized the continuous Fourier-transform convention.', score: 91 },
  { id: 'math.bayes', domain: 'math', patterns: [/^(?:bayes(?:'s|') theorem|bayes theorem)$/i], latex: 'P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}', explanation: "Recognized Bayes' theorem.", score: 96 },
  { id: 'physics.schrodinger', domain: 'physics', patterns: [/^(?:schr(?:o|ö)dinger(?:'s)? equation|time dependent schrodinger equation)$/i], latex: 'i\\hbar\\frac{\\partial\\Psi}{\\partial t}=\\hat{H}\\Psi', explanation: 'Recognized the time-dependent Schrödinger equation.', score: 100 },
  { id: 'physics.maxwell', domain: 'physics', patterns: [/^(?:maxwell(?:'|’)s equations|maxwell equations)$/i], latex: '\\nabla\\cdot\\mathbf{E}=\\frac{\\rho}{\\varepsilon_0},\\quad\\nabla\\cdot\\mathbf{B}=0,\\quad\\nabla\\times\\mathbf{E}=-\\frac{\\partial\\mathbf{B}}{\\partial t},\\quad\\nabla\\times\\mathbf{B}=\\mu_0\\mathbf{J}+\\mu_0\\varepsilon_0\\frac{\\partial\\mathbf{E}}{\\partial t}', explanation: "Recognized Maxwell's equations in differential form.", score: 100 },
  { id: 'physics.debroglie', domain: 'physics', patterns: [/^(?:de broglie wavelength|matter wave wavelength)$/i], latex: '\\lambda=\\frac{h}{p}', explanation: 'Recognized the de Broglie relation.', score: 94 },
  { id: 'physics.uncertainty', domain: 'physics', patterns: [/^(?:heisenberg uncertainty principle|uncertainty principle)$/i], latex: '\\Delta x\\,\\Delta p\\ge\\frac{\\hbar}{2}', explanation: 'Recognized the Heisenberg uncertainty principle.', score: 96 },
  { id: 'chemistry.ph', domain: 'chemistry', patterns: [/^(?:pH|formula for pH|hydrogen ion pH)$/i], latex: 'pH=-\\log_{10}[\\mathrm{H^+}]', explanation: 'Recognized the common pH definition.', score: 95 },
  { id: 'chemistry.molarity', domain: 'chemistry', patterns: [/^(?:molarity|molar concentration|formula for molarity)$/i], latex: 'M=\\frac{n}{V}', explanation: 'Recognized molar concentration.', score: 95 },
  { id: 'chemistry.equilibrium', domain: 'chemistry', patterns: [/^(?:equilibrium constant|Kc|formula for equilibrium constant)$/i], latex: 'K_c=\\frac{\\prod[\\mathrm{products}]^{\\nu}}{\\prod[\\mathrm{reactants}]^{\\nu}}', explanation: 'Recognized a concentration-based equilibrium-constant template.', score: 88 },
  { id: 'electronics.rc-charge', domain: 'electronics', patterns: [/^(?:rc charging equation|capacitor charging equation)$/i], latex: 'V_C(t)=V_0\\left(1-e^{-t/(RC)}\\right)', explanation: 'Recognized the ideal RC charging equation.', score: 97 },
  { id: 'electronics.transfer-function', domain: 'electronics', patterns: [/^(?:transfer function|system transfer function)$/i], latex: 'H(s)=\\frac{Y(s)}{X(s)}', explanation: 'Recognized the standard transfer-function definition.', score: 96 },
  { id: 'electronics.resonance', domain: 'electronics', patterns: [/^(?:resonant frequency|rlc resonant frequency|resonance frequency)$/i], latex: 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}', explanation: 'Recognized the ideal RLC resonant frequency.', score: 96 },
];

const DOMAIN_TERMS: Record<ScienceDomain, string[]> = {
  general: ['equation', 'formula', 'expression', 'symbol', 'variable'],
  math: ['integral', 'derivative', 'limit', 'matrix', 'vector', 'function', 'logarithm', 'quadratic', 'theorem'],
  physics: ['force', 'mass', 'energy', 'momentum', 'velocity', 'acceleration', 'field', 'photon', 'wave', 'quantum', 'gravity', 'newton', 'coulomb'],
  chemistry: ['chemical', 'reaction', 'molecule', 'ion', 'element', 'compound', 'acid', 'base', 'molar', 'hydrogen', 'oxygen', 'water'],
  electronics: ['voltage', 'current', 'resistance', 'impedance', 'capacitor', 'inductor', 'circuit', 'phasor', 'kirchhoff', 'ohm', 'transistor', 'diode'],
};

export interface SemanticAnalysisOptions { maxCandidates?: number; }

export function analyzeSemanticInput(input: string, domain: ScienceDomain, shortcuts: Shortcut[], options: SemanticAnalysisOptions = {}): SemanticCandidate[] {
  const maxCandidates = Math.max(1, options.maxCandidates ?? 5);
  const trimmed = input.trim();
  if (!trimmed) return [];
  const normalized = normalizeSemanticText(trimmed);
  const candidates: SemanticCandidate[] = [];

  for (const intent of INTENTS) {
    if (intent.domain !== domain) continue;
    if (!intent.patterns.some((pattern) => pattern.test(normalized))) continue;
    candidates.push({ id: intent.id, label: formatIntentLabel(intent.id), domain: intent.domain, latex: intent.latex, confidence: 'high', score: intent.score + 8, explanation: intent.explanation, issues: [], source: 'intent' });
  }

  const exactShortcut = shortcuts.find((shortcut) => normalizeSemanticText(shortcut.trigger) === normalized && (shortcut.domain === 'all' || shortcut.domain === domain));
  if (exactShortcut) candidates.push({ id: `shortcut.${exactShortcut.id}`, label: `Shortcut: ${exactShortcut.trigger}`, domain, latex: exactShortcut.latex, confidence: 'high', score: 108, explanation: 'Matched a saved shortcut exactly.', issues: [], source: 'shortcut' });

  const engineResult = runDomainEngine(trimmed, domain);
  if (engineResult?.latex.trim()) candidates.push({ id: `engine.${domain}`, label: 'Domain parser', domain, latex: engineResult.latex, confidence: engineResult.confidence, score: confidenceScore(engineResult.confidence) + 2, explanation: engineResult.explanation, issues: engineResult.issues, source: 'engine' });

  const generic = genericStructuredCandidate(trimmed, domain, shortcuts);
  if (generic) candidates.push(generic);
  return dedupeCandidates(candidates).sort((a, b) => b.score - a.score).slice(0, maxCandidates);
}

export function semanticToConversion(candidates: SemanticCandidate[], fallback: ConversionResult): ConversionResult {
  const top = candidates[0];
  if (!top) return fallback;
  const competing = candidates.filter((candidate) => candidate.latex !== top.latex && candidate.score >= top.score - 12);
  const confidence: ConversionResult['confidence'] = competing.length > 0 && top.confidence === 'high' ? 'medium' : top.confidence;
  const issues = [...top.issues];
  if (competing.length > 0) issues.push(`There are ${competing.length} alternative interpretations; review the suggestions.`);
  return { latex: top.latex, confidence, explanation: top.explanation, issues, intentId: top.id, candidates };
}

export function looksLikeSemanticInput(input: string): boolean {
  const text = normalizeSemanticText(input);
  if (text.length < 4) return false;
  if (/\b(?:formula|equation|expression|law|theorem|derive|derivative|integral|solve|calculate|convert|represent|write|find)\b/i.test(text)) return true;
  return Object.values(DOMAIN_TERMS).some((terms) => terms.some((term) => text.includes(term)));
}

export function inferDomainFromText(input: string, fallback: ScienceDomain): ScienceDomain {
  const text = normalizeSemanticText(input);
  const scores: Record<ScienceDomain, number> = { general: 0, math: 0, physics: 0, chemistry: 0, electronics: 0 };
  for (const domain of Object.keys(DOMAIN_TERMS) as ScienceDomain[]) for (const term of DOMAIN_TERMS[domain]) if (text.includes(term)) scores[domain] += term.length > 5 ? 2 : 1;
  let best = fallback;
  let bestScore = scores[fallback];
  for (const domain of Object.keys(scores) as ScienceDomain[]) if (scores[domain] > bestScore) { best = domain; bestScore = scores[domain]; }
  return bestScore > 0 ? best : fallback;
}

export function normalizeSemanticText(input: string): string {
  return normalizeExpressionLanguage(input).normalize('NFKC').replace(/[−–—]/g, '-').replace(/[×·⋅]/g, ' times ').replace(/→/g, ' -> ').replace(/⇌|↔/g, ' equilibrium ').replace(/\s+/g, ' ').trim().replace(/[.?!]+$/, '').toLowerCase();
}

function runDomainEngine(input: string, domain: ScienceDomain): ConversionResult | null {
  if (domain === 'physics') return convertPhysics(input);
  if (domain === 'chemistry') return convertChemistry(input);
  if (domain === 'electronics') return convertElectronics(input);
  return null;
}

function genericStructuredCandidate(input: string, domain: ScienceDomain, shortcuts: Shortcut[]): SemanticCandidate | null {
  const dictionary = buildDictionary(domain, shortcuts);
  const parsed = parseScientificExpression(input, { dictionary });
  if (!parsed.latex.trim()) return null;
  const unknownCount = parsed.unknownWords.length;
  const confidence: SemanticCandidate['confidence'] = parsed.ambiguous || unknownCount > 0 ? (unknownCount > 1 ? 'low' : 'medium') : 'medium';
  return { id: 'generic.structured', label: 'Structured expression parser', domain, latex: parsed.latex.trim(), confidence, score: confidenceScore(confidence) - unknownCount * 4, explanation: parsed.message, issues: parsed.unknownWords.map((word) => `Unknown term: ${word}`), source: 'parser' };
}

function buildDictionary(domain: ScienceDomain, shortcuts: Shortcut[]): Record<string, string> {
  const base = domain === 'math' || domain === 'general' ? { ...SYMBOLS, ...MATH_TERMS } : domain === 'physics' ? { ...SYMBOLS, ...PHYSICS_TERMS } : domain === 'chemistry' ? { ...SYMBOLS, ...CHEMISTRY_TERMS } : { ...SYMBOLS, ...ELECTRONICS_TERMS };
  for (const shortcut of shortcuts) if (shortcut.domain === 'all' || shortcut.domain === domain) base[shortcut.trigger] = shortcut.latex;
  return base;
}
function confidenceScore(confidence: SemanticCandidate['confidence']): number { return confidence === 'high' ? 90 : confidence === 'medium' ? 60 : 30; }
function formatIntentLabel(id: string): string { const [, raw = id] = id.split('.'); return raw.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '); }
function dedupeCandidates(candidates: SemanticCandidate[]): SemanticCandidate[] { const seen = new Set<string>(); return candidates.filter((candidate) => { const key = `${candidate.latex}|${candidate.domain}`; if (seen.has(key)) return false; seen.add(key); return true; }); }
