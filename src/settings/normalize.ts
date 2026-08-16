import { DEFAULT_SETTINGS } from './defaults';
import type { EquationHistoryItem, LatexToolboxSettings, ScienceDomain, Shortcut, Snippet, Template } from '../types';

const DOMAINS: readonly ScienceDomain[] = ['general', 'math', 'physics', 'chemistry', 'electronics'];
const MAX_SHORTCUTS = 200;
const MAX_SNIPPETS = 120;
const MAX_TEMPLATES = 120;
const MAX_TEXT = 5000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = '', maxLength = MAX_TEXT): string {
  return typeof value === 'string' ? value.slice(0, maxLength) : fallback;
}

function domainValue(value: unknown, fallback: ScienceDomain | 'all'): ScienceDomain | 'all' {
  if (value === 'all' || (typeof value === 'string' && DOMAINS.includes(value as ScienceDomain))) return value as ScienceDomain | 'all';
  return fallback;
}

function scienceDomainValue(value: unknown, fallback: ScienceDomain): ScienceDomain {
  return typeof value === 'string' && DOMAINS.includes(value as ScienceDomain) ? value as ScienceDomain : fallback;
}

function normalizeShortcut(value: unknown): Shortcut | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id).trim();
  const trigger = stringValue(value.trigger, '', 120).trim();
  const latex = stringValue(value.latex).trim();
  if (!id || !trigger || !latex) return null;
  return { id, trigger, latex, domain: domainValue(value.domain, 'all') };
}

function normalizeSnippet(value: unknown): Snippet | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id).trim();
  const name = stringValue(value.name, '', 200).trim();
  const trigger = stringValue(value.trigger, '', 120).trim();
  const latex = stringValue(value.latex).trim();
  if (!id || !name || !trigger || !latex) return null;
  return { id, name, trigger, latex, domain: domainValue(value.domain, 'all') };
}

function normalizeTemplate(value: unknown): Template | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id).trim();
  const name = stringValue(value.name, '', 200).trim();
  const trigger = stringValue(value.trigger, '', 120).trim();
  const description = stringValue(value.description, '', 500).trim();
  const latex = stringValue(value.latex).trim();
  if (!id || !name || !trigger || !latex) return null;
  return { id, name, trigger, description, latex, domain: domainValue(value.domain, 'all') };
}

function normalizeHistory(value: unknown, max: number): EquationHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry): EquationHistoryItem | null => {
    if (!isRecord(entry)) return null;
    const id = stringValue(entry.id).trim();
    const input = stringValue(entry.input).trim();
    const latex = stringValue(entry.latex).trim();
    const domain = domainValue(entry.domain, 'general');
    const createdAt = typeof entry.createdAt === 'number' && Number.isFinite(entry.createdAt) ? entry.createdAt : 0;
    if (!id || !latex || !DOMAINS.includes(domain as ScienceDomain)) return null;
    return { id, input, latex, domain: domain as ScienceDomain, createdAt, favorite: entry.favorite === true };
  }).filter((entry): entry is EquationHistoryItem => entry !== null)
    .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.latex === entry.latex) === index)
    .slice(0, max);
}

export function normalizeSettings(value: unknown): LatexToolboxSettings {
  const saved = isRecord(value) ? value : {};
  const shortcuts = Array.isArray(saved.customShortcuts)
    ? saved.customShortcuts.map(normalizeShortcut).filter((entry): entry is Shortcut => entry !== null).slice(0, MAX_SHORTCUTS)
    : DEFAULT_SETTINGS.customShortcuts.map((entry) => ({ ...entry }));
  const snippets = Array.isArray(saved.customSnippets)
    ? saved.customSnippets.map(normalizeSnippet).filter((entry): entry is Snippet => entry !== null).slice(0, MAX_SNIPPETS)
    : DEFAULT_SETTINGS.customSnippets.map((entry) => ({ ...entry }));
  const templates = Array.isArray(saved.customTemplates)
    ? saved.customTemplates.map(normalizeTemplate).filter((entry): entry is Template => entry !== null).slice(0, MAX_TEMPLATES)
    : DEFAULT_SETTINGS.customTemplates.map((entry) => ({ ...entry }));

  const maxInputLength = typeof saved.maxInputLength === 'number' && Number.isFinite(saved.maxInputLength)
    ? Math.min(5000, Math.max(200, Math.floor(saved.maxInputLength)))
    : DEFAULT_SETTINGS.maxInputLength;
  const autocompleteMaxResults = typeof saved.autocompleteMaxResults === 'number' && Number.isFinite(saved.autocompleteMaxResults)
    ? Math.min(20, Math.max(5, Math.floor(saved.autocompleteMaxResults)))
    : DEFAULT_SETTINGS.autocompleteMaxResults;

  return {
    wrapStyle: saved.wrapStyle === 'inline' ? 'inline' : 'block',
    convertParens: saved.convertParens !== false,
    forceDisplayMath: saved.forceDisplayMath === true,
    autoWrapBareMath: saved.autoWrapBareMath === true,
    defaultDomain: scienceDomainValue(saved.defaultDomain, DEFAULT_SETTINGS.defaultDomain),
    customShortcuts: shortcuts,
    customSnippets: snippets,
    customTemplates: templates,
    recentEquations: normalizeHistory(saved.recentEquations, 30),
    favoriteEquations: normalizeHistory(saved.favoriteEquations, 50),
    autocompleteEnabled: saved.autocompleteEnabled !== false,
    autocompleteMaxResults,
    maxInputLength,
    livePreview: saved.livePreview !== false,
    semanticReviewThreshold: saved.semanticReviewThreshold === 'low' || saved.semanticReviewThreshold === 'high' || saved.semanticReviewThreshold === 'medium'
      ? saved.semanticReviewThreshold
      : DEFAULT_SETTINGS.semanticReviewThreshold,
  };
}
