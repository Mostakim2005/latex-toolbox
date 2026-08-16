import type { ConversionResult } from '../types';

interface FormulaNode {
  kind: 'element' | 'group';
  symbol?: string;
  children?: FormulaNode[];
  count: number;
  isotope?: number;
}

interface ParsedFormula {
  latex: string;
  issues: string[];
  elements: Record<string, number>;
  charge: number;
}

interface ReactionPart {
  formulaText: string;
  condition?: string;
  arrow?: string;
}

const ELEMENTS = new Set([
  'H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn',
  'Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu',
  'Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr','Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og',
]);

const COMMON_IONS: Record<string, string> = {
  'hydrogen ion': 'H^+', 'proton': 'H^+', 'hydroxide ion': 'OH^-', 'hydronium ion': 'H_3O^+',
  'sodium ion': 'Na^+', 'potassium ion': 'K^+', 'magnesium ion': 'Mg^{2+}', 'calcium ion': 'Ca^{2+}',
  'aluminum ion': 'Al^{3+}', 'aluminium ion': 'Al^{3+}', 'chloride ion': 'Cl^-', 'bromide ion': 'Br^-', 'iodide ion': 'I^-',
  'oxide ion': 'O^{2-}', 'sulfide ion': 'S^{2-}', 'sulphide ion': 'S^{2-}', 'nitrate ion': 'NO_3^-', 'nitrite ion': 'NO_2^-',
  'sulfate ion': 'SO_4^{2-}', 'sulphate ion': 'SO_4^{2-}', 'sulfite ion': 'SO_3^{2-}', 'carbonate ion': 'CO_3^{2-}',
  'hydrogen carbonate ion': 'HCO_3^-', 'bicarbonate ion': 'HCO_3^-', 'phosphate ion': 'PO_4^{3-}', 'ammonium ion': 'NH_4^+',
  'acetate ion': 'CH_3COO^-', 'permanganate ion': 'MnO_4^-', 'dichromate ion': 'Cr_2O_7^{2-}', 'chromate ion': 'CrO_4^{2-}',
  'cyanide ion': 'CN^-', 'silver ion': 'Ag^+', 'carbonate': 'CO_3^{2-}', 'sulfate': 'SO_4^{2-}', 'nitrate': 'NO_3^-', 'phosphate': 'PO_4^{3-}',
};

const COMMON_COMPOUNDS: Record<string, string> = {
  'water': 'H_2O', 'hydrogen peroxide': 'H_2O_2', 'carbon dioxide': 'CO_2', 'carbon monoxide': 'CO',
  'ammonia': 'NH_3', 'methane': 'CH_4', 'ethane': 'C_2H_6', 'ethene': 'C_2H_4', 'ethylene': 'C_2H_4',
  'ethyne': 'C_2H_2', 'acetylene': 'C_2H_2', 'sodium chloride': 'NaCl', 'hydrochloric acid': 'HCl',
  'sulfuric acid': 'H_2SO_4', 'sulphuric acid': 'H_2SO_4', 'nitric acid': 'HNO_3', 'acetic acid': 'CH_3COOH',
};

const ARROWS: Array<{ token: string; latex: string }> = [
  { token: '<->', latex: '\\rightleftharpoons' },
  { token: '<=>', latex: '\\rightleftharpoons' },
  { token: '⇌', latex: '\\rightleftharpoons' },
  { token: '↔', latex: '\\rightleftharpoons' },
  { token: '=>', latex: '\\Rightarrow' },
  { token: '->', latex: '\\rightarrow' },
  { token: '→', latex: '\\rightarrow' },
];

export function convertChemistry(input: string): ConversionResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const normalized = normalizeChemistryUnicode(trimmed).normalize('NFKC')
    .replace(/[−–—]/g, '-')
    .replace(/⇢|⟶/g, '→')
    .replace(/\s+/g, ' ')
    .trim();

  const named = resolveNamedChemistry(normalized);
  if (named) return named;

  if (hasReactionArrow(normalized)) return convertReaction(normalized);

  const standaloneState = normalized.match(/^(.+?)\s*\((aq|s|l|g)\)$/i);
  if (standaloneState) {
    const parsed = parseChemicalFormula(standaloneState[1] ?? '');
    if (parsed.latex) {
      return { latex: `${parsed.latex}_{\\mathrm{(${(standaloneState[2] ?? '').toLowerCase()})}}`, confidence: parsed.issues.length === 0 ? 'high' : 'medium', explanation: 'Recognized a chemical species with a physical state.', issues: parsed.issues };
    }
  }

  // Prefer formula parsing for chemistry-looking tokens, while avoiding ordinary prose.
  if (looksLikeFormula(normalized)) {
    const parsed = parseChemicalFormula(normalized);
    if (parsed.latex) {
      return {
        latex: parsed.latex,
        confidence: parsed.issues.length === 0 ? 'high' : 'medium',
        explanation: parsed.issues.length === 0 ? 'Recognized a chemical formula or ion.' : 'Recognized the chemical structure, but review the flagged notation.',
        issues: parsed.issues,
      };
    }
  }

  return null;
}

function resolveNamedChemistry(input: string): ConversionResult | null {
  const key = input.toLowerCase().trim();
  if (COMMON_IONS[key]) {
    return { latex: renderStandaloneFormula(COMMON_IONS[key]), confidence: 'high', explanation: `Recognized the common ion “${input}”.`, issues: [] };
  }
  if (COMMON_COMPOUNDS[key]) {
    return { latex: renderStandaloneFormula(COMMON_COMPOUNDS[key]), confidence: 'high', explanation: `Recognized the common compound “${input}”.`, issues: [] };
  }
  return null;
}

function hasReactionArrow(input: string): boolean {
  return ARROWS.some(({ token }) => input.includes(token)) || /--?\s*[^>-]+\s*-+>/.test(input);
}

function convertReaction(input: string): ConversionResult {
  const extracted = extractReactionParts(input);
  if (!extracted) {
    return { latex: '', confidence: 'low', explanation: 'Could not identify a valid chemical reaction arrow.', issues: ['Use an arrow such as ->, →, ⇌, or --condition-->.'] };
  }

  const issues: string[] = [];
  const sideTotals: Array<Record<string, number>> = [];
  const sideCharges: number[] = [];
  const renderedSides = extracted.parts.map((side) => {
    const terms = splitReactionTerms(side.formulaText);
    if (terms.length === 0) {
      issues.push('A reaction side is empty.');
      sideTotals.push({});
      sideCharges.push(0);
      return '';
    }
    const totals: Record<string, number> = {};
    sideTotals.push(totals);
    sideCharges.push(0);
    return terms.map((term) => {
      const rendered = parseReactionTerm(term);
      issues.push(...rendered.issues);
      mergeElementCounts(totals, rendered.elements);
      sideCharges[sideCharges.length - 1] = (sideCharges[sideCharges.length - 1] ?? 0) + rendered.charge;
      return rendered.latex;
    }).join(' + ');
  });

  const arrowLatex = extracted.arrowLatex;
  let arrow = arrowLatex;
  if (extracted.condition) {
    const condition = normalizeCondition(extracted.condition);
    if (condition) arrow = `\\xrightarrow{${condition}}`;
    else issues.push(`Unrecognized reaction condition: ${extracted.condition}`);
  }

  const latex = renderedSides.join(` ${arrow} `);
  if (!latex.trim()) return { latex: '', confidence: 'low', explanation: 'No chemical species were recognized.', issues };

  if (sideTotals.length >= 2 && !sameElementCounts(sideTotals[0] ?? {}, sideTotals[1] ?? {})) {
    issues.push('Reaction is not balanced; the plugin preserved the entered coefficients rather than changing them automatically.');
  }
  if (sideCharges.length >= 2 && (sideCharges[0] ?? 0) !== (sideCharges[1] ?? 0)) {
    issues.push('Reaction charge is not balanced; inspect ionic coefficients and charges.');
  }

  return {
    latex,
    confidence: issues.length === 0 ? 'high' : 'medium',
    explanation: issues.length === 0 ? 'Recognized a chemical reaction, including formula structure and reaction notation.' : 'Recognized the reaction structure; review the flagged species or condition.',
    issues,
  };
}

function extractReactionParts(input: string): { parts: ReactionPart[]; arrowLatex: string; condition?: string } | null {
  const conditional = input.match(/^(.*?)\s*--\s*([^>-]+?)\s*-->\s*(.*)$/);
  if (conditional) {
    const condition = conditional[2]?.trim();
    const left = conditional[1]?.trim() ?? '';
    const right = conditional[3]?.trim() ?? '';
    if (left && right) return { parts: [{ formulaText: left }, { formulaText: right }], arrowLatex: '\\rightarrow', condition };
  }

  let found: { token: string; index: number; latex: string } | null = null;
  for (const arrow of ARROWS) {
    const index = input.indexOf(arrow.token);
    if (index >= 0 && (!found || index < found.index)) found = { token: arrow.token, index, latex: arrow.latex };
  }
  if (!found) return null;

  const left = input.slice(0, found.index).trim();
  const right = input.slice(found.index + found.token.length).trim();
  if (!left || !right) return null;

  const rightCondition = right.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (rightCondition) {
    return { parts: [{ formulaText: left }, { formulaText: rightCondition[2]?.trim() ?? '' }], arrowLatex: found.latex, condition: rightCondition[1]?.trim() };
  }
  return { parts: [{ formulaText: left }, { formulaText: right }], arrowLatex: found.latex };
}

function splitReactionTerms(side: string): string[] {
  const terms: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < side.length; i += 1) {
    const char = side[i] ?? '';
    if (char === '(' || char === '[') depth += 1;
    if (char === ')' || char === ']') depth = Math.max(0, depth - 1);
    if (char === '+' && depth === 0 && (i === 0 || /\s/.test(side[i - 1] ?? '')) && /\s/.test(side[i + 1] ?? '')) {
      if (current.trim()) terms.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) terms.push(current.trim());
  return terms.length > 0 ? terms : side.trim() ? [side.trim()] : [];
}

function parseReactionTerm(raw: string): { latex: string; issues: string[]; elements: Record<string, number>; charge: number } {
  let value = raw.trim();
  const issues: string[] = [];

  const coefficient = value.match(/^(\d+(?:\.\d+)?)(?:\s+|(?=[A-Z([]))(.+)$/);
  const prefix = coefficient?.[1] ?? '';
  value = coefficient?.[2]?.trim() ?? value;

  const state = value.match(/\s*(?:\((aq|s|l|g)\)|\[(aq|s|l|g)\])\s*$/i);
  const stateCode = (state?.[1] ?? state?.[2] ?? '').toLowerCase();
  if (state) value = value.slice(0, state.index).trim();

  const parsed = parseChemicalFormula(value);
  issues.push(...parsed.issues);
  const coefficientValue = prefix ? Number(prefix) : 1;
  const elements = Object.fromEntries(Object.entries(parsed.elements).map(([element, count]) => [element, count * coefficientValue]));
  if (!parsed.latex) issues.push(`Unrecognized chemical species: ${raw}`);

  const stateLatex = stateCode ? `_{\\mathrm{(${stateCode})}}` : '';
  const coefficientLatex = prefix ? prefix : '';
  return { latex: `${coefficientLatex}${parsed.latex}${stateLatex}`, issues, elements, charge: parsed.charge * coefficientValue };
}

export function parseChemicalFormula(input: string): ParsedFormula {
  let value = input.trim();
  const issues: string[] = [];
  if (!value) return { latex: '', issues: ['Empty chemical formula.'], elements: {}, charge: 0 };

  // Normalize written charge forms: SO4 2-, SO4^2-, NH4+, Fe3+.
  let charge = '';
  const explicitCharge = value.match(/\^\s*(\d+)?([+-])\s*$/);
  const spacedCharge = value.match(/\s+(\d+)([+-])\s*$/);
  const compactCharge = value.match(/(\d+)?([+-])\s*$/);
  const chargeMatch = explicitCharge ?? spacedCharge ?? compactCharge;
  if (chargeMatch) {
    let number = chargeMatch[1] ?? '';
    const sign = chargeMatch[2] ?? '';
    // NH4+ means NH4 with a + charge; Fe3+ means Fe with a 3+ charge.
    if (!explicitCharge && !spacedCharge && number) {
      const beforeNumber = value.slice(0, chargeMatch.index ?? 0);
      const elementCount = (beforeNumber.match(/[A-Z][a-z]?/g) ?? []).length;
      // Multi-element ions such as NH4+ use the digits as a subscript; monatomic ions such as Fe3+ use them as charge.
      if (elementCount >= 2) {
        number = '';
        const signIndex = (chargeMatch.index ?? 0) + (chargeMatch[0]?.length ?? 0) - 1;
        value = value.slice(0, signIndex).trim();
        charge = sign;
      }
    }
    if (!charge) {
      charge = `${number}${sign}`;
      value = value.slice(0, chargeMatch.index).trim();
      value = value.replace(/\^\s*$/, '').trim();
    }
  }

  const isotopeMatch = value.match(/^\^?\{?(\d{1,3})\}?([A-Z][a-z]?)/);
  let isotope: number | undefined;
  if (isotopeMatch) {
    isotope = Number(isotopeMatch[1]);
    value = value.slice(isotopeMatch[0].length);
    value = `${isotopeMatch[2]}${value}`;
  }

  const hydrateParts = splitHydrate(value);
  const renderedParts: string[] = [];
  const elements: Record<string, number> = {};

  hydrateParts.forEach((part, index) => {
    const componentPrefix = index > 0 ? part.match(/^(\d+)(?=[A-Z([])/)?.[1] ?? '' : '';
    const componentFormula = componentPrefix ? part.slice(componentPrefix.length) : part;
    const parsed = parseFormulaPart(componentFormula);
    issues.push(...parsed.issues);
    mergeElementCounts(elements, parsed.elements);
    let rendered = `\\mathrm{${parsed.latex}}`;
    if (index > 0 && componentPrefix) rendered = `${componentPrefix}${rendered}`;
    if (index > 0) rendered = `\\cdot${rendered}`;
    renderedParts.push(rendered);
  });

  let latex = renderedParts.join('');
  if (isotope !== undefined) latex = `^{${isotope}}${latex}`;
  if (charge) latex = `${latex}^{${charge}}`;

  return { latex, issues, elements, charge: parseChargeNumber(charge) };
}

function splitHydrate(value: string): string[] {
  return value.split(/[·•]/).map((part) => part.trim()).filter(Boolean);
}

function parseFormulaPart(input: string): { latex: string; issues: string[]; elements: Record<string, number> } {
  const issues: string[] = [];
  const elements: Record<string, number> = {};
  let index = 0;
  const nodes: FormulaNode[] = [];

  while (index < input.length) {
    const char = input[index] ?? '';
    if (char === '(' || char === '[') {
      const close = char === '(' ? ')' : ']';
      const innerStart = index + 1;
      let depth = 1;
      let cursor = innerStart;
      while (cursor < input.length && depth > 0) {
        const current = input[cursor] ?? '';
        if (current === char) depth += 1;
        else if (current === close) depth -= 1;
        cursor += 1;
      }
      if (depth !== 0) {
        issues.push(`Unclosed group “${char}”.`);
        break;
      }
      const inner = input.slice(innerStart, cursor - 1);
      const innerParsed = parseFormulaPart(inner);
      issues.push(...innerParsed.issues);
      const countResult = readCount(input, cursor);
      index = countResult.next;
      nodes.push({ kind: 'group', children: [], count: countResult.count, symbol: innerParsed.latex });
      multiplyInto(elements, innerParsed.elements, countResult.count);
      continue;
    }

    const element = input.slice(index).match(/^([A-Z][a-z]?)/)?.[1];
    if (!element || !ELEMENTS.has(element)) {
      issues.push(`Unrecognized chemical symbol near “${input.slice(index)}”.`);
      index += 1;
      continue;
    }
    index += element.length;
    const countResult = readCount(input, index);
    index = countResult.next;
    nodes.push({ kind: 'element', symbol: element, count: countResult.count });
    elements[element] = (elements[element] ?? 0) + countResult.count;
  }

  return { latex: nodes.map(renderNode).join(''), issues, elements };
}

function readCount(value: string, start: number): { count: number; next: number } {
  const match = value.slice(start).match(/^(\d+)/);
  if (!match) return { count: 1, next: start };
  const digits = match[1] ?? '';
  return { count: Number(digits), next: start + digits.length };
}

function renderNode(node: FormulaNode): string {
  if (node.kind === 'element') {
    const symbol = node.symbol ?? '';
    return node.count === 1 ? symbol : `${symbol}_${node.count}`;
  }
  const group = `(${node.symbol ?? ''})`;
  return node.count === 1 ? group : `${group}_${node.count}`;
}

function renderStandaloneFormula(formula: string): string {
  const charge = formula.match(/\^\{(\d*[+-])\}|\^(\d*[+-])/);
  if (!charge) return `\\mathrm{${formula}}`;
  const index = charge.index ?? formula.length;
  const base = formula.slice(0, index);
  const chargeText = charge[1] ?? charge[2] ?? '';
  return `\\mathrm{${base}}^{${chargeText}}`;
}

function sameElementCounts(a: Record<string, number>, b: Record<string, number>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if ((a[key] ?? 0) !== (b[key] ?? 0)) return false;
  }
  return true;
}

function normalizeChemistryUnicode(input: string): string {
  const subscript: Record<string, string> = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
  const superscript: Record<string, string> = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-' };
  let output = '';
  let inSuperscript = false;
  let supBuffer = '';
  const flushSuperscript = (): void => {
    if (!supBuffer) return;
    output += `^${supBuffer}`;
    supBuffer = '';
  };
  for (const char of input) {
    if (superscript[char] !== undefined) {
      inSuperscript = true;
      supBuffer += superscript[char];
      continue;
    }
    if (inSuperscript) {
      flushSuperscript();
      inSuperscript = false;
    }
    output += subscript[char] ?? char;
  }
  if (inSuperscript) flushSuperscript();
  return output;
}

function parseChargeNumber(charge: string): number {
  if (!charge) return 0;
  const match = charge.match(/^(\d+)?([+-])$/);
  if (!match) return 0;
  const magnitude = Number(match[1] ?? '1');
  return (match[2] === '+' ? 1 : -1) * magnitude;
}

function normalizeCondition(value: string): string | null {
  const text = value.trim().toLowerCase();
  if (/^(?:heat|heating|delta|Δ)$/.test(text)) return '\\Delta';
  if (/^(?:light|uv|ultraviolet)$/.test(text)) return '\\mathrm{h\\nu}';
  if (/^(?:electrolysis|electrolytic)$/.test(text)) return '\\text{electrolysis}';
  if (/^(?:cat(?:alyst)?|catalytic)$/.test(text)) return '\\text{cat.}';
  if (/^high\s+pressure$/.test(text)) return '\\text{high pressure}';
  if (/^aqueous$/.test(text)) return '\\mathrm{aq}';
  if (/^([0-9]+(?:\.[0-9]+)?)\s*(?:°?c|celsius)$/.test(text)) return `\\mathrm{${text.replace(/\s+/g, '')}}`;
  if (/^[A-Za-z0-9.+\s-]+$/.test(value.trim())) return `\\mathrm{${value.trim().replace(/\s+/g, '\\,')}}`;
  return null;
}

function looksLikeFormula(input: string): boolean {
  const normalized = input.trim();
  if (/^(?:\d{1,3})?\^?\{?\d{0,3}\}?[A-Z][a-z]?(?:\d+|\(|\)|\[|\]|\^|[+-])*[A-Za-z0-9()[\]^+-·•]*$/.test(normalized)) return true;
  return /^[A-Z][A-Za-z0-9()[\]^+-·•]*\s*(?:\((?:aq|s|l|g)\))?$/i.test(normalized) && /[A-Z]/.test(normalized);
}

function mergeElementCounts(target: Record<string, number>, source: Record<string, number>): void {
  for (const [element, count] of Object.entries(source)) target[element] = (target[element] ?? 0) + count;
}

function multiplyInto(target: Record<string, number>, source: Record<string, number>, factor: number): void {
  for (const [element, count] of Object.entries(source)) target[element] = (target[element] ?? 0) + count * factor;
}
