import type { EquationHistoryItem, ScienceDomain, Shortcut, Snippet, Template } from '../types';

export interface AuthoringItem {
  id: string;
  kind: 'shortcut' | 'snippet' | 'template' | 'history' | 'favorite' | 'semantic';
  label: string;
  detail: string;
  latex: string;
  domain: ScienceDomain | 'all';
  score: number;
}

export interface ExpandedSnippet {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export function domainMatches(itemDomain: ScienceDomain | 'all', domain: ScienceDomain): boolean {
  return itemDomain === 'all' || itemDomain === domain;
}

export function normalizeTrigger(value: string): string {
  return value.trim().replace(/^\\/, '').toLowerCase();
}

export function filterAuthoringItems(
  query: string,
  domain: ScienceDomain,
  shortcuts: Shortcut[],
  snippets: Snippet[],
  templates: Template[],
  recent: EquationHistoryItem[],
  favorites: EquationHistoryItem[],
  maxResults = 12,
): AuthoringItem[] {
  const q = normalizeTrigger(query);
  const items: AuthoringItem[] = [];

  for (const item of shortcuts) {
    if (!domainMatches(item.domain, domain)) continue;
    const haystack = `${item.trigger} ${item.latex}`.toLowerCase();
    const score = scoreMatch(q, haystack, item.trigger);
    if (score >= 0) items.push({ id: item.id, kind: 'shortcut', label: item.trigger, detail: item.latex, latex: item.latex, domain: item.domain, score });
  }
  for (const item of snippets) {
    if (!domainMatches(item.domain, domain)) continue;
    const score = scoreMatch(q, `${item.trigger} ${item.name} ${item.latex}`.toLowerCase(), item.trigger);
    if (score >= 0) items.push({ id: item.id, kind: 'snippet', label: item.name, detail: item.trigger, latex: item.latex, domain: item.domain, score });
  }
  for (const item of templates) {
    if (!domainMatches(item.domain, domain)) continue;
    const score = scoreMatch(q, `${item.trigger} ${item.name} ${item.description}`.toLowerCase(), item.trigger);
    if (score >= 0) items.push({ id: item.id, kind: 'template', label: item.name, detail: item.trigger, latex: item.latex, domain: item.domain, score });
  }

  for (const item of favorites) {
    if (item.domain !== domain) continue;
    const score = q ? scoreMatch(q, `${item.input} ${item.latex}`.toLowerCase(), item.input) : 70;
    if (score >= 0) items.push({ id: item.id, kind: 'favorite', label: item.input || 'Favorite equation', detail: item.latex, latex: item.latex, domain, score });
  }
  for (const item of recent) {
    if (item.domain !== domain || favorites.some((favorite) => favorite.id === item.id)) continue;
    const score = q ? scoreMatch(q, `${item.input} ${item.latex}`.toLowerCase(), item.input) : 20;
    if (score >= 0) items.push({ id: item.id, kind: 'history', label: item.input || 'Recent equation', detail: item.latex, latex: item.latex, domain, score });
  }

  const seen = new Set<string>();
  return items
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .filter((item) => {
      const key = `${item.kind}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, Math.max(1, maxResults));
}

function scoreMatch(query: string, haystack: string, trigger: string): number {
  if (!query) return 10;
  const q = query.toLowerCase();
  const target = haystack.toLowerCase();
  if (target === q) return 100;
  if (trigger.toLowerCase() === q) return 95;
  if (trigger.toLowerCase().startsWith(q)) return 85;
  const index = target.indexOf(q);
  if (index >= 0) return 65 - Math.min(index, 30);
  const initials = target.split(/\s+/).map((word) => word[0] ?? '').join('');
  if (initials.startsWith(q)) return 55;
  return -1;
}

export function expandSnippetWithSelection(snippet: string): ExpandedSnippet {
  const output: string[] = [];
  let cursor = 0;
  let firstStart = -1;
  let firstEnd = -1;
  const pattern = /\$\{(\d+)(?::([^}]*))?\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(snippet)) !== null) {
    output.push(snippet.slice(cursor, match.index));
    const value = match[2] ?? '';
    const start = output.join('').length;
    output.push(value);
    const end = output.join('').length;
    const index = Number(match[1]);
    if (index !== 0 && firstStart < 0) {
      firstStart = start;
      firstEnd = end;
    }
    cursor = match.index + match[0].length;
  }
  output.push(snippet.slice(cursor));
  const text = output.join('');
  if (firstStart < 0) return { text, selectionStart: text.length, selectionEnd: text.length };
  return { text, selectionStart: firstStart, selectionEnd: firstEnd };
}

export function createHistoryItem(input: string, latex: string, domain: ScienceDomain, favorite = false): EquationHistoryItem {
  const now = Date.now();
  return { id: `${now}-${Math.random().toString(36).slice(2, 8)}`, input: input.trim(), latex, domain, createdAt: now, favorite };
}

export function updateHistory(
  recent: EquationHistoryItem[],
  favorites: EquationHistoryItem[],
  item: EquationHistoryItem,
  maxRecent = 30,
): { recent: EquationHistoryItem[]; favorites: EquationHistoryItem[] } {
  const recentNext = [item, ...recent.filter((entry) => entry.latex !== item.latex)].slice(0, maxRecent);
  const favoritesNext = item.favorite
    ? [item, ...favorites.filter((entry) => entry.latex !== item.latex)].slice(0, 50)
    : favorites;
  return { recent: recentNext, favorites: favoritesNext };
}

export function toggleFavorite(
  favorites: EquationHistoryItem[],
  item: EquationHistoryItem,
): EquationHistoryItem[] {
  const existing = favorites.find((entry) => entry.latex === item.latex);
  if (existing) return favorites.filter((entry) => entry.latex !== item.latex);
  return [{ ...item, favorite: true }, ...favorites].slice(0, 50);
}
