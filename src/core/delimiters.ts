import type { LatexToolboxSettings } from '../types';

interface Segment { type: 'code' | 'normal' | 'math'; text: string; }

export function fixLatexDelimiters(text: string, settings: Pick<LatexToolboxSettings, 'convertParens' | 'wrapStyle' | 'forceDisplayMath'>): string {
  const segments = splitSafe(text);
  return segments.map((segment) => {
    if (segment.type !== 'normal') return segment.text;
    let value = segment.text;
    if (settings.convertParens) {
      const inline = settings.wrapStyle === 'inline' ? '$' : '$$';
      value = value.replace(/\\\((.*?)\\\)/gs, (_m, body: string) => `${inline}${body}${inline}`);
      value = value.replace(/\\\[(.*?)\\\]/gs, (_m, body: string) => `$$${body}$$`);
    }
    if (settings.forceDisplayMath) value = convertSingleDollarToDisplay(value);
    return value;
  }).join('');
}

function convertSingleDollarToDisplay(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('$$', i)) {
      const end = text.indexOf('$$', i + 2);
      if (end < 0) { result += text.slice(i); break; }
      result += text.slice(i, end + 2);
      i = end + 2;
      continue;
    }
    if (text[i] === '$') {
      const end = text.indexOf('$', i + 1);
      if (end < 0) { result += text.slice(i); break; }
      result += `$$${text.slice(i + 1, end)}$$`;
      i = end + 1;
      continue;
    }
    result += text[i];
    i += 1;
  }
  return result;
}

function splitSafe(text: string): Segment[] {
  const segments: Segment[] = [];
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('```', i)) {
      const end = text.indexOf('```', i + 3);
      if (end < 0) { segments.push({ type: 'code', text: text.slice(i) }); break; }
      segments.push({ type: 'code', text: text.slice(i, end + 3) });
      i = end + 3;
      continue;
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end < 0) { segments.push({ type: 'normal', text: text.slice(i) }); break; }
      segments.push({ type: 'code', text: text.slice(i, end + 1) });
      i = end + 1;
      continue;
    }
    if (text.startsWith('$$', i)) {
      const end = text.indexOf('$$', i + 2);
      if (end < 0) { segments.push({ type: 'normal', text: text.slice(i) }); break; }
      segments.push({ type: 'math', text: text.slice(i, end + 2) });
      i = end + 2;
      continue;
    }
    if (text[i] === '$' && text[i + 1] !== '$') {
      const end = text.indexOf('$', i + 1);
      if (end < 0) { segments.push({ type: 'normal', text: text.slice(i) }); break; }
      segments.push({ type: 'math', text: text.slice(i, end + 1) });
      i = end + 1;
      continue;
    }
    let j = i + 1;
    while (j < text.length && text[j] !== '`' && text[j] !== '$' && !text.startsWith('```', j)) j += 1;
    segments.push({ type: 'normal', text: text.slice(i, j) });
    i = j;
  }
  return segments;
}
