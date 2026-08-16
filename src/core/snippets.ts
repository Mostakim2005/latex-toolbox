import type { Snippet } from '../types';

export function expandSnippet(snippet: Snippet): string {
  return snippet.latex.replace(/\$\{\d+:([^}]*)\}/g, '$1').replace(/\$\{\d+\}/g, '');
}
