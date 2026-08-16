import type { ConversionResult, ScienceDomain, Shortcut } from '../types';
import { CHEMISTRY_TERMS, ELECTRONICS_TERMS, MATH_TERMS, PHYSICS_TERMS, SYMBOLS } from '../domains/dictionaries';
import { parseScientificExpression, normalizeExpressionLanguage } from './expression-parser';
import { convertPhysics } from './physics';
import { convertChemistry } from './chemistry';
import { convertElectronics } from './electronics';
import { analyzeSemanticInput, semanticToConversion } from './semantic';
import { LruCache } from './conversion-cache';
import { MAX_SCIENTIFIC_INPUT_LENGTH, sanitizeScientificInput, unitPhraseToLatex } from './scientific-validation';

const DOMAIN_MAP: Record<ScienceDomain, Record<string, string>> = {
  general: { ...SYMBOLS, ...MATH_TERMS },
  math: { ...SYMBOLS, ...MATH_TERMS },
  physics: { ...SYMBOLS, ...PHYSICS_TERMS },
  chemistry: { ...SYMBOLS, ...CHEMISTRY_TERMS },
  electronics: { ...SYMBOLS, ...ELECTRONICS_TERMS },
};

interface SemanticPattern {
  domain: ScienceDomain | 'any';
  pattern: RegExp;
  latex: string;
  explanation: string;
}

const CONVERSION_CACHE = new LruCache<ConversionResult>(160);

const SEMANTIC_PATTERNS: SemanticPattern[] = [
  { domain: 'physics', pattern: /^force\s*=\s*mass\s*(?:[·x*]|times)\s*acceleration$/i, latex: 'F = ma', explanation: "Recognized Newton's second law." },
  { domain: 'physics', pattern: /^kinetic\s+energy$/i, latex: 'K = \\frac{1}{2}mv^2', explanation: 'Recognized the kinetic-energy formula.' },
  { domain: 'physics', pattern: /^coulomb(?:'s)?\s+law$/i, latex: 'F = k\\frac{q_1q_2}{r^2}', explanation: "Recognized Coulomb's law." },
  { domain: 'physics', pattern: /^newton(?:'s)?\s+second\s+law$/i, latex: 'F = ma', explanation: "Recognized Newton's second law." },
  { domain: 'physics', pattern: /^work\s*=\s*force\s*(?:[·x*]|times)\s*distance$/i, latex: 'W = Fd', explanation: 'Recognized the mechanical-work relationship.' },
  { domain: 'physics', pattern: /^einstein(?:'s)?\s+mass.?energy\s+equivalence$/i, latex: 'E = mc^2', explanation: 'Recognized mass-energy equivalence.' },
  { domain: 'electronics', pattern: /^voltage\s*=\s*current\s*(?:[·x*]|times)\s*resistance$/i, latex: 'V = IR', explanation: "Recognized Ohm's law." },
  { domain: 'electronics', pattern: /^ohm(?:'s)?\s+law$/i, latex: 'V = IR', explanation: "Recognized Ohm's law." },
  { domain: 'electronics', pattern: /^kirchhoff(?:'s)?\s+current\s+law$/i, latex: '\\sum I = 0', explanation: "Recognized Kirchhoff's current law." },
  { domain: 'electronics', pattern: /^kirchhoff(?:'s)?\s+voltage\s+law$/i, latex: '\\sum V = 0', explanation: "Recognized Kirchhoff's voltage law." },
];

export function naturalLanguageToLatex(input: string, domain: ScienceDomain, shortcuts: Shortcut[]): ConversionResult {
  const sanitized = sanitizeScientificInput(input);
  const trimmed = sanitized.value;
  if (!trimmed) return { latex: '', confidence: 'low', explanation: 'Enter an expression to convert.', issues: sanitized.issues };
  const shortcutFingerprint = shortcuts.map((shortcut) => `${shortcut.id}:${shortcut.trigger}:${shortcut.latex}:${shortcut.domain}`).join('|');
  const cacheKey = `${domain}\u0000${shortcutFingerprint}\u0000${trimmed}`;
  const cached = CONVERSION_CACHE.get(cacheKey);
  if (cached) return { ...cached };
  if (trimmed.length > MAX_SCIENTIFIC_INPUT_LENGTH) return { latex: '', confidence: 'low', explanation: 'Input exceeds the supported length.', issues: sanitized.issues };

  if (/^\$\$[\s\S]*\$\$$/.test(trimmed) || /^\$[\s\S]*\$$/.test(trimmed)) {
    return { latex: trimmed, confidence: 'high', explanation: 'Input already contains LaTeX math delimiters; it was preserved.', issues: [] };
  }

  if (/\\[a-zA-Z]+/.test(trimmed) && /[{}]/.test(trimmed)) {
    return { latex: trimmed, confidence: 'high', explanation: 'Existing LaTeX commands were detected; the expression was preserved.', issues: [] };
  }

  const unitLatex = unitPhraseToLatex(trimmed);
  if (unitLatex) {
    const result = { latex: unitLatex, confidence: 'high' as const, explanation: 'Recognized a scientific unit.', issues: [] };
    CONVERSION_CACHE.set(cacheKey, result);
    return result;
  }

  const semanticCandidates = analyzeSemanticInput(trimmed, domain, shortcuts, { maxCandidates: 6 });
  if (semanticCandidates.length > 0 && semanticCandidates[0] !== undefined && semanticCandidates[0].source !== 'parser') {
    const semanticResult = semanticToConversion(semanticCandidates, { latex: '', confidence: 'low', explanation: '', issues: [] });
    if (semanticResult.latex.trim()) return semanticResult;
  }

  const dictionary = buildDictionary(domain, shortcuts);

  if (domain === 'physics') {
    const physics = convertPhysics(trimmed);
    if (physics) return physics;
  }

  if (domain === 'chemistry') {
    const chemistry = convertChemistry(trimmed);
    if (chemistry) return chemistry;
  }

  if (domain === 'electronics') {
    const electronics = convertElectronics(trimmed);
    if (electronics) return electronics;
  }

  const normalized = normalizeExpressionLanguage(trimmed);

  for (const candidate of SEMANTIC_PATTERNS) {
    if ((candidate.domain === domain || candidate.domain === 'any') && candidate.pattern.test(normalized)) {
      return { latex: candidate.latex, confidence: 'high', explanation: candidate.explanation, issues: [] };
    }
  }

  const structured = convertStructuredMathPhrase(trimmed, dictionary);
  if (structured) return structured;

  const groupedFunction = convertGroupedFunctionPhrase(trimmed, dictionary);
  if (groupedFunction) return groupedFunction;

  const combinatorics = convertCombinatoricsPhrase(trimmed, dictionary);
  if (combinatorics) return combinatorics;

  const calculus = convertCalculusPhrase(trimmed, dictionary);
  if (calculus) return calculus;

  const parsed = parseScientificExpression(trimmed, { dictionary });
  const issues = [...parsed.unknownWords.map((word) => `Unknown term: ${word}`)];
  if (parsed.message.includes('not parsed')) issues.push(parsed.message);

  const latex = parsed.latex.trim();
  if (!latex) return { latex: '', confidence: 'low', explanation: 'No structured expression could be recognized.', issues };

  const confidence = parsed.ambiguous ? (issues.length > 1 ? 'low' : 'medium') : 'high';
  const explanation = parsed.ambiguous
    ? `Parsed the recognized structure, but review the result. ${parsed.message}`
    : `${parsed.message}`;
  return { latex, confidence, explanation, issues };
}

function buildDictionary(domain: ScienceDomain, shortcuts: Shortcut[]): Record<string, string> {
  const dictionary = { ...DOMAIN_MAP[domain] };
  for (const shortcut of shortcuts) {
    if (shortcut.domain === 'all' || shortcut.domain === domain) dictionary[shortcut.trigger] = shortcut.latex;
  }
  return dictionary;
}

function convertStructuredMathPhrase(input: string, dictionary: Record<string, string>): ConversionResult | null {
  const vector = input.match(/^(?:vector|vectorize)\s+(.+)$/i);
  if (vector) {
    const value = parseScientificExpression(vector[1] ?? '', { dictionary }).latex || (vector[1] ?? '').trim();
    return { latex: `\\vec{${value}}`, confidence: 'high', explanation: 'Recognized a vector expression.', issues: [] };
  }

  const unitVector = input.match(/^unit\s+vector\s+(.+)$/i);
  if (unitVector) {
    const value = parseScientificExpression(unitVector[1] ?? '', { dictionary }).latex || (unitVector[1] ?? '').trim();
    return { latex: `\\hat{${value}}`, confidence: 'high', explanation: 'Recognized a unit-vector expression.', issues: [] };
  }

  const magnitude = input.match(/^(?:magnitude|length)\s+of\s+(?:vector\s+)?(.+)$/i);
  if (magnitude) {
    const value = parseScientificExpression(magnitude[1] ?? '', { dictionary }).latex || (magnitude[1] ?? '').trim();
    return { latex: `\\left\\lVert\\vec{${value}}\\right\\rVert`, confidence: 'high', explanation: 'Recognized a vector magnitude expression.', issues: [] };
  }

  const dot = input.match(/^dot\s+product\s+of\s+(.+?)\s+and\s+(.+)$/i);
  if (dot) {
    const left = parseScientificExpression(dot[1] ?? '', { dictionary }).latex || (dot[1] ?? '').trim();
    const right = parseScientificExpression(dot[2] ?? '', { dictionary }).latex || (dot[2] ?? '').trim();
    return { latex: `\\vec{${left}}\\cdot\\vec{${right}}`, confidence: 'high', explanation: 'Recognized a vector dot product.', issues: [] };
  }

  const cross = input.match(/^cross\s+product\s+of\s+(.+?)\s+and\s+(.+)$/i);
  if (cross) {
    const left = parseScientificExpression(cross[1] ?? '', { dictionary }).latex || (cross[1] ?? '').trim();
    const right = parseScientificExpression(cross[2] ?? '', { dictionary }).latex || (cross[2] ?? '').trim();
    return { latex: `\\vec{${left}}\\times\\vec{${right}}`, confidence: 'high', explanation: 'Recognized a vector cross product.', issues: [] };
  }

  const matrix = input.match(/^matrix\s+(.+)$/is);
  if (matrix) {
    const rows = (matrix[1] ?? '').split(/\s*;\s*|\n+/).map((row) => row.trim()).filter(Boolean);
    if (rows.length > 0) {
      const parsedRows = rows.map((row) => row.split(/\s*,\s*|\s+/).filter(Boolean).map((cell) => {
        return parseScientificExpression(cell, { dictionary }).latex || cell;
      }));
      const width = parsedRows[0]?.length ?? 0;
      if (width > 0 && parsedRows.every((row) => row.length === width)) {
        const body = parsedRows.map((row) => row.join(' & ')).join(' \\\\ ');
        return { latex: `\\begin{bmatrix}${body}\\end{bmatrix}`, confidence: 'high', explanation: 'Recognized a matrix expression.', issues: [] };
      }
      return { latex: '', confidence: 'low', explanation: 'Matrix rows do not contain the same number of entries.', issues: ['Matrix rows must have equal length.'] };
    }
  }

  const belongs = input.match(/^(.+?)\s+(?:belongs\s+to|is\s+an?\s+element\s+of)\s+(.+)$/i);
  if (belongs) {
    const left = parseScientificExpression(belongs[1] ?? '', { dictionary }).latex || (belongs[1] ?? '').trim();
    const set = formatSetName(belongs[2] ?? '');
    return { latex: `${left}\\in${set}`, confidence: 'high', explanation: 'Recognized a set-membership relation.', issues: [] };
  }

  const notBelongs = input.match(/^(.+?)\s+(?:does\s+not\s+belong\s+to|is\s+not\s+in)\s+(.+)$/i);
  if (notBelongs) {
    const left = parseScientificExpression(notBelongs[1] ?? '', { dictionary }).latex || (notBelongs[1] ?? '').trim();
    const set = formatSetName(notBelongs[2] ?? '');
    return { latex: `${left}\\notin${set}`, confidence: 'high', explanation: 'Recognized a non-membership relation.', issues: [] };
  }

  const quantifier = input.match(/^(for\s+all|there\s+exists)\s+(.+)$/i);
  if (quantifier) {
    const symbol = /^for/i.test(quantifier[1] ?? '') ? '\\forall' : '\\exists';
    const expression = parseScientificExpression(quantifier[2] ?? '', { dictionary }).latex || (quantifier[2] ?? '').trim();
    return { latex: `${symbol}\\,${expression}`, confidence: 'high', explanation: 'Recognized a logical quantifier.', issues: [] };
  }

  const piecewise = input.match(/^(.+?)\s*=\s*(.+?)\s+if\s+(.+?)(?:\s+and\s+(.+?)\s+otherwise)?$/i);
  if (piecewise && piecewise[4]) {
    const lhs = parseScientificExpression(piecewise[1] ?? '', { dictionary }).latex || (piecewise[1] ?? '').trim();
    const first = parseScientificExpression(piecewise[2] ?? '', { dictionary }).latex || (piecewise[2] ?? '').trim();
    const firstCondition = parseScientificExpression(piecewise[3] ?? '', { dictionary }).latex || (piecewise[3] ?? '').trim();
    const otherwise = parseScientificExpression(piecewise[4] ?? '', { dictionary }).latex || (piecewise[4] ?? '').trim();
    return { latex: `${lhs}=\\begin{cases}${first}, & ${firstCondition}\\\\${otherwise}, & \\text{otherwise}\\end{cases}`, confidence: 'medium', explanation: 'Recognized a two-branch piecewise definition; review the conditions.', issues: [] };
  }

  const logic = input.match(/^(.+?)\s+(implies|iff|if and only if|and|or)\s+(.+)$/i);
  if (logic) {
    const left = parseScientificExpression(logic[1] ?? '', { dictionary }).latex || (logic[1] ?? '').trim();
    const right = parseScientificExpression(logic[3] ?? '', { dictionary }).latex || (logic[3] ?? '').trim();
    const word = (logic[2] ?? '').toLowerCase();
    const operator = word === 'and' ? '\\land' : word === 'or' ? '\\lor' : word === 'iff' || word === 'if and only if' ? '\\iff' : '\\Rightarrow';
    return { latex: `${left} ${operator} ${right}`, confidence: 'high', explanation: 'Recognized a logical relation.', issues: [] };
  }

  const mean = input.match(/^mean\s+of\s+(.+)$/i);
  if (mean) {
    const values = mean[1] ?? '';
    const terms = values.split(/\s*(?:,|and)\s*/).filter(Boolean);
    const converted = terms.map((term) => parseScientificExpression(term, { dictionary }).latex || term.trim());
    if (converted.length >= 2) {
      return { latex: `\\bar{x}=\\frac{${converted.join('+')}}{${converted.length}}`, confidence: 'high', explanation: 'Recognized an arithmetic-mean expression.', issues: [] };
    }
  }

  return null;
}

function formatSetName(value: string): string {
  const normalized = value.trim().toLowerCase();
  const sets: Record<string, string> = {
    'r': '\\mathbb{R}', 'real numbers': '\\mathbb{R}', 'reals': '\\mathbb{R}',
    'z': '\\mathbb{Z}', 'integers': '\\mathbb{Z}',
    'n': '\\mathbb{N}', 'natural numbers': '\\mathbb{N}',
    'q': '\\mathbb{Q}', 'rational numbers': '\\mathbb{Q}',
    'c': '\\mathbb{C}', 'complex numbers': '\\mathbb{C}',
  };
  return sets[normalized] ?? parsePlainSet(value);
}

function parsePlainSet(value: string): string {
  return /^\\/.test(value.trim()) ? value.trim() : value.trim();
}

function convertGroupedFunctionPhrase(input: string, dictionary: Record<string, string>): ConversionResult | null {
  const root = input.match(/^square\s+root\s+of\s+(.+)$/i);
  if (root) {
    const expression = parseScientificExpression(root[1] ?? '', { dictionary }).latex || (root[1] ?? '').trim();
    return { latex: `\\sqrt{${expression}}`, confidence: 'high', explanation: 'Recognized a grouped square-root phrase.', issues: [] };
  }
  const absolute = input.match(/^absolute\s+value\s+of\s+(.+)$/i);
  if (absolute) {
    const expression = parseScientificExpression(absolute[1] ?? '', { dictionary }).latex || (absolute[1] ?? '').trim();
    return { latex: `\\left|${expression}\\right|`, confidence: 'high', explanation: 'Recognized a grouped absolute-value phrase.', issues: [] };
  }
  return null;
}

function convertCombinatoricsPhrase(input: string, dictionary: Record<string, string>): ConversionResult | null {
  const choose = input.match(/^(.+?)\s+choose\s+(.+)$/i);
  if (choose) {
    const n = parseScientificExpression(choose[1] ?? '', { dictionary }).latex || (choose[1] ?? '').trim();
    const r = parseScientificExpression(choose[2] ?? '', { dictionary }).latex || (choose[2] ?? '').trim();
    return {
      latex: `\\binom{${n}}{${r}}`,
      confidence: 'high',
      explanation: 'Recognized a binomial-coefficient expression.',
      issues: [],
    };
  }
  return null;
}

function convertCalculusPhrase(input: string, dictionary: Record<string, string>): ConversionResult | null {
  const integral = input.match(/^integral\s+from\s+(.+?)\s+to\s+(.+?)\s+of\s+(.+?)\s+d([a-zA-Z])$/i);
  if (integral) {
    const lower = convertLimit(integral[1] ?? '', dictionary);
    const upper = convertLimit(integral[2] ?? '', dictionary);
    const integrandInput = integral[3] ?? '';
    const variable = integral[4] ?? 'x';
    const body = parseScientificExpression(integrandInput, { dictionary }).latex || integrandInput.trim();
    return {
      latex: `\\int_{${lower}}^{${upper}} ${body}\\,d${variable}`,
      confidence: 'high',
      explanation: 'Recognized a definite integral with limits and differential.',
      issues: [],
    };
  }

  const derivative = input.match(/^the\s+derivative\s+of\s+(.+?)\s+with\s+respect\s+to\s+([a-zA-Z])$/i);
  if (derivative) {
    const expression = parseScientificExpression(derivative[1] ?? '', { dictionary }).latex || (derivative[1] ?? '').trim();
    const variable = derivative[2] ?? 'x';
    return {
      latex: `\\frac{d}{d${variable}}\\left(${expression}\\right)`,
      confidence: 'high',
      explanation: 'Recognized a derivative request.',
      issues: [],
    };
  }

  const partial = input.match(/^the\s+partial\s+derivative\s+of\s+(.+?)\s+with\s+respect\s+to\s+([a-zA-Z])$/i);
  if (partial) {
    const expression = parseScientificExpression(partial[1] ?? '', { dictionary }).latex || (partial[1] ?? '').trim();
    const variable = partial[2] ?? 'x';
    return {
      latex: `\\frac{\\partial}{\\partial ${variable}}\\left(${expression}\\right)`,
      confidence: 'high',
      explanation: 'Recognized a partial-derivative request.',
      issues: [],
    };
  }

  const limit = input.match(/^limit\s+as\s+([a-zA-Z])\s+(?:approaches|goes\s+to)\s+(.+?)\s+of\s+(.+)$/i);
  if (limit) {
    const variable = limit[1] ?? 'x';
    const target = convertLimit(limit[2] ?? '', dictionary);
    const expression = parseScientificExpression(limit[3] ?? '', { dictionary }).latex || (limit[3] ?? '').trim();
    return {
      latex: `\\lim_{${variable}\\to ${target}} ${expression}`,
      confidence: 'high',
      explanation: 'Recognized a limit expression.',
      issues: [],
    };
  }

  return null;
}

function convertLimit(value: string, dictionary: Record<string, string>): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'infinity' || normalized === 'infinite') return '\\infty';
  if (normalized === 'negative infinity' || normalized === 'minus infinity') return '-\\infty';
  const parsed = parseScientificExpression(value, { dictionary });
  return parsed.latex || value.trim();
}

