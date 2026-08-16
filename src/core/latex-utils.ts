export function wrapLatex(latex: string, style: 'block' | 'inline'): string {
  const value = latex.trim();
  if (!value) return '';
  if (/^\$\$[\s\S]*\$\$$/.test(value) || /^\$[\s\S]*\$$/.test(value)) return value;
  return style === 'block' ? `$$\n${value}\n$$` : `$${value}$`;
}

export function validateLatex(latex: string): string[] {
  const errors: string[] = [];
  const stack: string[] = [];
  let escaped = false;
  for (const ch of latex) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if ('{(['.includes(ch)) stack.push(ch);
    if ('})]'.includes(ch)) {
      const expected = ch === '}' ? '{' : ch === ')' ? '(' : '[';
      if (stack.pop() !== expected) errors.push(`Unbalanced delimiter: ${ch}`);
    }
  }
  if (stack.length > 0) errors.push('Unclosed delimiter in LaTeX expression.');
  if (/\\frac\s*\{[^{}]*\}\s*$/.test(latex)) errors.push('\\frac appears to be missing its denominator.');
  return [...new Set(errors)];
}
