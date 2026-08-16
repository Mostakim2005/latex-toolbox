export interface ExpressionToken {
  kind: 'number' | 'identifier' | 'operator' | 'lparen' | 'rparen' | 'comma' | 'relation';
  value: string;
  latex?: string;
  position: number;
}

export interface ExpressionParseResult {
  latex: string;
  consumed: number;
  unknownWords: string[];
  ambiguous: boolean;
  message: string;
}

interface ParserOptions {
  dictionary: Record<string, string>;
}

const FUNCTION_LATEX: Record<string, string> = {
  sin: '\\sin', sine: '\\sin', cos: '\\cos', cosine: '\\cos', tan: '\\tan', tangent: '\\tan', cot: '\\cot', sec: '\\sec', csc: '\\csc',
  asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan',
  arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan',
  sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh',
  ln: '\\ln', log: '\\log', logarithm: '\\log', exp: '\\exp', exponential: '\\exp',
  sqrt: '\\sqrt', abs: '\\left|',
  min: '\\min', max: '\\max', lim: '\\lim',
};

const FUNCTION_WORDS = new Set(Object.keys(FUNCTION_LATEX));

const MULTIWORD_OPERATORS: Array<[RegExp, string]> = [
  [/\bgreater\s+than\s+or\s+equal\s+to\b/gi, ' >= '],
  [/\bless\s+than\s+or\s+equal\s+to\b/gi, ' <= '],
  [/\bnot\s+equal\s+to\b/gi, ' != '],
  [/\bapproximately\s+equal\s+to\b/gi, ' ~= '],
  [/\bplus\s+or\s+minus\b/gi, ' ± '],
  [/\bto\s+the\s+power\s+of\b/gi, ' ^ '],
  [/\bmultiplied\s+by\b/gi, ' * '],
  [/\bdivided\s+by\b/gi, ' / '],
  [/\bgreater\s+than\b/gi, ' > '],
  [/\bless\s+than\b/gi, ' < '],
  [/\bplus\b/gi, ' + '],
  [/\bminus\b/gi, ' - '],
  [/\btimes\b/gi, ' * '],
  [/\bover\b/gi, ' / '],
  [/\bequals\b/gi, ' = '],
];

const NUMBER_WORDS: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
};

export function normalizeExpressionLanguage(input: string): string {
  let text = input
    .normalize('NFKC')
    .replace(/[−–—]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/→/g, ' -> ')
    .replace(/⇌|↔/g, ' <-> ')
    .replace(/≤/g, ' <= ')
    .replace(/≥/g, ' >= ')
    .replace(/≠/g, ' != ')
    .replace(/≈/g, ' ~= ');

  for (const [pattern, replacement] of MULTIWORD_OPERATORS) text = text.replace(pattern, replacement);

  text = text
    .replace(/\bsine\s+of\b/gi, ' sin ')
    .replace(/\bcosine\s+of\b/gi, ' cos ')
    .replace(/\btangent\s+of\b/gi, ' tan ')
    .replace(/\blogarithm\s+of\b/gi, ' log ')
    .replace(/\blog\s+of\b/gi, ' log ')
    .replace(/\bln\s+of\b/gi, ' ln ')
    .replace(/\bto\s+the\b/gi, ' ^ ')
    .replace(/\bsquared\b/gi, ' ^ 2 ')
    .replace(/\bcubed\b/gi, ' ^ 3 ')
    .replace(/\bhalf\b/gi, ' 1/2 ')
    .replace(/\bsquare\s+root\s+of\b/gi, ' sqrt ')
    .replace(/\bsquare\s+root\b/gi, ' sqrt ')
    .replace(/\babsolute\s+value\s+of\b/gi, ' abs ')
    .replace(/\bmodulo\b|\bmod\b/gi, ' mod ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), value);
  }

  return text;
}

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && /[A-Za-z0-9_]/.test(ch);
}

function matchDictionaryPhrase(text: string, index: number, dictionary: Record<string, string>): [string, string, number] | null {
  const entries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
  const remaining = text.slice(index);
  for (const [phrase, latex] of entries) {
    const pattern = new RegExp(`^${escapeRegExp(phrase)}(?=$|[^A-Za-z0-9_])`, 'i');
    if (pattern.test(remaining)) {
      const before = text[index - 1];
      const firstPhraseChar = phrase[0] ?? '';
      if (isWordChar(before) && isWordChar(firstPhraseChar)) continue;
      return [phrase, latex, phrase.length];
    }
  }
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

export function tokenizeExpression(input: string, dictionary: Record<string, string>): { tokens: ExpressionToken[]; unknownWords: string[] } {
  const text = normalizeExpressionLanguage(input);
  const tokens: ExpressionToken[] = [];
  const unknownWords: string[] = [];
  let i = 0;

  const pushIdentifier = (value: string, position: number, latex?: string): void => {
    tokens.push({ kind: 'identifier', value, latex, position });
    const lower = value.toLowerCase();
    const isPlainVariable = /^[a-zA-Z]$/.test(value) || /^(?:dx|dy|dz|dt)$/.test(lower);
    if (!latex && !FUNCTION_WORDS.has(lower) && !isPlainVariable) unknownWords.push(value);
  };

  while (i < text.length) {
    const ch = text[i] ?? '';
    if (/\s/.test(ch)) { i += 1; continue; }
    if (/[0-9.]/.test(ch)) {
      const start = i;
      i += 1;
      while (i < text.length && /[0-9.]/.test(text[i] ?? '')) i += 1;
      tokens.push({ kind: 'number', value: text.slice(start, i), position: start });
      continue;
    }

    const phrase = matchDictionaryPhrase(text, i, dictionary);
    if (phrase) {
      pushIdentifier(phrase[0], i, phrase[1]);
      i += phrase[2];
      continue;
    }

    if (/[A-Za-z_]/.test(ch ?? '')) {
      const start = i;
      i += 1;
      while (i < text.length && /[A-Za-z0-9_]/.test(text[i] ?? '')) i += 1;
      const word = text.slice(start, i);
      const lower = word.toLowerCase();
      if (word === 'pi') pushIdentifier(word, start, '\\pi');
      else if (word === 'e' || word === 'j' || word === 'i') pushIdentifier(word, start);
      else if (lower === 'mod') tokens.push({ kind: 'operator', value: 'mod', position: start });
      else pushIdentifier(word, start, dictionary[word] ?? dictionary[lower]);
      continue;
    }

    if ('+-*/^=<>!~'.includes(ch)) {
      const next = text[i + 1];
      const two = `${ch}${next ?? ''}`;
      const relation = new Set(['<=', '>=', '!=', '==', '~=']);
      if (relation.has(two)) {
        tokens.push({ kind: 'relation', value: two, position: i });
        i += 2;
      } else if (ch === '=' || ch === '<' || ch === '>' || ch === '~') {
        tokens.push({ kind: 'relation', value: ch, position: i });
        i += 1;
      } else {
        tokens.push({ kind: 'operator', value: ch, position: i });
        i += 1;
      }
      continue;
    }

    if (ch === '(') tokens.push({ kind: 'lparen', value: ch, position: i++ });
    else if (ch === ')') tokens.push({ kind: 'rparen', value: ch, position: i++ });
    else if (ch === ',') tokens.push({ kind: 'comma', value: ch, position: i++ });
    else i += 1;
  }

  return { tokens, unknownWords: [...new Set(unknownWords)] };
}

class ExpressionParser {
  private index = 0;
  private readonly tokens: ExpressionToken[];

  constructor(tokens: ExpressionToken[]) { this.tokens = tokens; }

  parse(): { latex: string; consumed: number; ambiguous: boolean; message: string } {
    if (this.tokens.length === 0) return { latex: '', consumed: 0, ambiguous: true, message: 'No mathematical expression was recognized.' };
    const latex = this.parseRelation();
    if (this.index < this.tokens.length) {
      const leftover = this.tokens.slice(this.index).map((token) => token.value).join(' ');
      return { latex, consumed: this.index, ambiguous: true, message: `Some input was not parsed: ${leftover}` };
    }
    return { latex, consumed: this.index, ambiguous: false, message: 'Parsed as a structured scientific expression.' };
  }

  private peek(offset = 0): ExpressionToken | undefined { return this.tokens[this.index + offset]; }
  private take(): ExpressionToken | undefined { return this.tokens[this.index++]; }

  private parseRelation(): string {
    let left = this.parseAdditive();
    const relation = this.peek();
    if (relation?.kind === 'relation') {
      this.take();
      const right = this.parseAdditive();
      left = `${left} ${renderRelation(relation.value)} ${right}`;
    }
    return left;
  }

  private parseAdditive(): string {
    let left = this.parseMultiplicative();
    while (this.peek()?.kind === 'operator' && ['+', '-', '±'].includes(this.peek()?.value ?? '')) {
      const operator = this.take()?.value ?? '+';
      const right = this.parseMultiplicative();
      left = `${left} ${operator === '±' ? '\\pm' : operator} ${right}`;
    }
    return left;
  }

  private parseMultiplicative(): string {
    let left = this.parsePower();
    while (true) {
      const token = this.peek();
      if (token?.kind === 'operator' && ['*', '/', 'mod'].includes(token.value)) {
        const op = this.take()?.value ?? '*';
        const right = this.parsePower();
        if (op === '/') left = `\\frac{${left}}{${right}}`;
        else if (op === 'mod') left = `${left} \\bmod ${right}`;
        else left = `${left} \\cdot ${right}`;
        continue;
      }
      if (this.startsImplicitMultiplication(token)) {
        const right = this.parsePower();
        left = `${left}${renderImplicitProduct(left, right)}`;
        continue;
      }
      break;
    }
    return left;
  }

  private startsImplicitMultiplication(token: ExpressionToken | undefined): boolean {
    if (!token) return false;
    return token.kind === 'number' || token.kind === 'identifier' || token.kind === 'lparen';
  }

  private parsePower(): string {
    let base = this.parseUnary();
    if (this.peek()?.kind === 'operator' && this.peek()?.value === '^') {
      this.take();
      const exponent = this.parsePower();
      base = `${base}^{${exponent}}`;
    }
    if (this.peek()?.kind === 'operator' && this.peek()?.value === '!') {
      this.take();
      base = `${base}!`;
    }
    return base;
  }

  private parseUnary(): string {
    const token = this.peek();
    if (token?.kind === 'operator' && (token.value === '+' || token.value === '-')) {
      this.take();
      const operand = this.parsePower();
      return token.value === '-' ? `-${operand}` : operand;
    }

    if (token?.kind === 'identifier' && FUNCTION_WORDS.has(token.value.toLowerCase())) {
      this.take();
      const name = token.value.toLowerCase();
      const next = this.peek();
      let argument: string;
      if (next?.kind === 'lparen') argument = this.parseParenthesized();
      else argument = this.parseUnary();
      const functionLatex = FUNCTION_LATEX[name] ?? `\\operatorname{${name}}`;
      if (name === 'sqrt') return `\\sqrt{${argument}}`;
      if (name === 'abs') return `\\left|${argument}\\right|`;
      return `${functionLatex}\\left(${argument}\\right)`;
    }

    return this.parsePrimary();
  }

  private parsePrimary(): string {
    const token = this.take();
    if (!token) return '';
    if (token.kind === 'number') return token.value;
    if (token.kind === 'identifier') return token.latex ?? formatIdentifier(token.value);
    if (token.kind === 'lparen') {
      this.index -= 1;
      return this.parseParenthesized();
    }
    return token.value;
  }

  private parseParenthesized(): string {
    if (this.peek()?.kind === 'lparen') this.take();
    const inner = this.parseRelation();
    if (this.peek()?.kind === 'rparen') this.take();
    return `\\left(${inner}\\right)`;
  }
}

function renderRelation(value: string): string {
  switch (value) {
    case '<': return '<';
    case '>': return '>';
    case '<=': return '\\leq';
    case '>=': return '\\geq';
    case '!=': return '\\neq';
    case '~=': return '\\approx';
    case '==': return '=';
    default: return '=';
  }
}

function formatIdentifier(value: string): string {
  if (value.length === 1) return value;
  if (/^[A-Z][a-z]?$/.test(value)) return `\\mathrm{${value}}`;
  return `\\operatorname{${value.replace(/_/g, '\\_')}}`;
}

function renderImplicitProduct(left: string, right: string): string {
  const rightNeedsSpace = /^\\(?:sin|cos|tan|log|ln|exp|sqrt|lim|arcsin|arccos|arctan)/.test(right);
  if (rightNeedsSpace) return `\\,${right}`;
  if (/\d$/.test(left) && (/^[A-Za-z\\]/.test(right) || /^\\/.test(right))) return right;
  return `\\,${right}`;
}

export function parseScientificExpression(input: string, options: ParserOptions): ExpressionParseResult {
  const { tokens, unknownWords } = tokenizeExpression(input, options.dictionary);
  const parser = new ExpressionParser(tokens);
  const parsed = parser.parse();
  return {
    latex: parsed.latex,
    consumed: parsed.consumed,
    unknownWords,
    ambiguous: parsed.ambiguous || unknownWords.length > 0,
    message: unknownWords.length > 0
      ? `${parsed.message} Unrecognized terms: ${unknownWords.join(', ')}.`
      : parsed.message,
  };
}
