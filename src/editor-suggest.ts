import { EditorSuggest, type EditorSuggestContext, type EditorPosition, type Editor, type TFile } from 'obsidian';
import { filterAuthoringItems, expandSnippetWithSelection, type AuthoringItem } from './core/authoring';
import { DOMAIN_LABELS } from './domains/dictionaries';
import { analyzeSemanticInput, inferDomainFromText, looksLikeSemanticInput } from './core/semantic';
import type { ScienceDomain } from './types';
import type LatexToolboxPlugin from './main';

export class LatexToolboxEditorSuggest extends EditorSuggest<AuthoringItem> {
  constructor(private readonly plugin: LatexToolboxPlugin) {
    super(plugin.app);
  }

  onTrigger(cursor: EditorPosition, editor: Editor, file: TFile): EditorSuggestContext | null {
    if (!this.plugin.settings.autocompleteEnabled) return null;
    const line = editor.getLine(cursor.line);
    const before = line.slice(0, cursor.ch);
    const match = before.match(/(?:^|\s)([^\s]{1,32})$/);
    if (!match) return null;
    const query = match[1] ?? '';
    const start = { line: cursor.line, ch: cursor.ch - query.length };
    return { editor, file, query, start, end: cursor };
  }

  getSuggestions(context: EditorSuggestContext): AuthoringItem[] {
    const domain = inferDomain(context.editor, context.start.line, this.plugin.settings.defaultDomain);
    const suggestions = filterAuthoringItems(
      context.query,
      domain,
      this.plugin.settings.customShortcuts,
      this.plugin.settings.customSnippets,
      this.plugin.settings.customTemplates,
      this.plugin.settings.recentEquations,
      this.plugin.settings.favoriteEquations,
      this.plugin.settings.autocompleteMaxResults,
    );

    const line = context.editor.getLine(context.end.line);
    const before = line.slice(0, context.end.ch);
    const semanticStart = findSemanticStart(before);
    if (semanticStart >= 0) {
      const semanticInput = before.slice(semanticStart).trim();
      if (looksLikeSemanticInput(semanticInput) && semanticInput.length <= 140) {
        const semanticDomain = inferDomainFromText(semanticInput, domain);
        const candidates = analyzeSemanticInput(semanticInput, semanticDomain, this.plugin.settings.customShortcuts, { maxCandidates: Math.min(4, this.plugin.settings.autocompleteMaxResults) });
        for (const candidate of candidates) {
          suggestions.push({ id: candidate.id, kind: 'semantic', label: candidate.label, detail: `${candidate.confidence} · ${candidate.latex}`, latex: candidate.latex, domain: candidate.domain, score: candidate.score + 12 });
        }
        const deduped = new Map<string, AuthoringItem>();
        for (const item of suggestions) deduped.set(`${item.kind}:${item.id}`, item);
        return [...deduped.values()].sort((a, b) => b.score - a.score).slice(0, this.plugin.settings.autocompleteMaxResults);
      }
    }
    return suggestions;
  }

  renderSuggestion(item: AuthoringItem, el: HTMLElement): void {
    el.addClass('lt-editor-suggestion');
    el.createDiv({ text: item.label, cls: 'lt-editor-suggestion-title' });
    el.createDiv({ text: `${item.kind} · ${item.detail}`, cls: 'lt-editor-suggestion-detail' });
  }

  selectSuggestion(item: AuthoringItem, evt: MouseEvent | KeyboardEvent): void {
    const context = this.context;
    if (!context) return;
    const semanticStart = item.kind === 'semantic'
      ? findSemanticStart(context.editor.getLine(context.end.line).slice(0, context.end.ch))
      : -1;
    const replaceStart = semanticStart >= 0 ? { line: context.end.line, ch: semanticStart } : context.start;
    const expanded = item.kind === 'snippet' || item.kind === 'template'
      ? expandSnippetWithSelection(item.latex)
      : { text: item.latex, selectionStart: item.latex.length, selectionEnd: item.latex.length };
    context.editor.replaceRange(expanded.text, replaceStart, context.end);
    if (item.kind === 'snippet' || item.kind === 'template') {
      const insertionEnd = context.editor.offsetToPos(context.editor.posToOffset(replaceStart) + expanded.text.length);
      const startOffset = context.editor.posToOffset(insertionEnd) - expanded.text.length + expanded.selectionStart;
      const endOffset = context.editor.posToOffset(insertionEnd) - expanded.text.length + expanded.selectionEnd;
      context.editor.setSelection(context.editor.offsetToPos(startOffset), context.editor.offsetToPos(endOffset));
    }
    void evt;
  }
}

function findSemanticStart(before: string): number {
  const boundary = Math.max(before.lastIndexOf('.'), before.lastIndexOf('?'), before.lastIndexOf('!'));
  const start = boundary + 1;
  const leading = before.slice(start);
  const match = leading.match(/\S/);
  return match?.index === undefined ? -1 : start + match.index;
}

function inferDomain(editor: Editor, lineNumber: number, fallback: ScienceDomain): ScienceDomain {
  const start = Math.max(0, lineNumber - 3);
  const text = Array.from({ length: lineNumber - start + 1 }, (_, index) => editor.getLine(start + index)).join(' ').toLowerCase();
  const scores: Record<ScienceDomain, number> = { general: 0, math: 0, physics: 0, chemistry: 0, electronics: 0 };
  const terms: Record<Exclude<ScienceDomain, 'general'>, string[]> = {
    math: ['integral', 'derivative', 'matrix', 'vector', 'limit', 'set', 'equation', 'calculus'],
    physics: ['force', 'mass', 'energy', 'momentum', 'electric field', 'magnetic', 'photon', 'wave', 'newton'],
    chemistry: ['reaction', 'molecule', 'ion', 'molar', 'hydrogen', 'oxygen', 'acid', 'base', 'chemical'],
    electronics: ['voltage', 'current', 'resistor', 'capacitor', 'inductor', 'impedance', 'circuit', 'op amp', 'transistor'],
  };
  for (const domain of Object.keys(terms) as Array<Exclude<ScienceDomain, 'general'>>) {
    for (const term of terms[domain]) if (text.includes(term)) scores[domain] += term.length > 5 ? 2 : 1;
  }
  const best = (Object.keys(scores) as ScienceDomain[]).reduce((a, b) => scores[b] > scores[a] ? b : a, 'general');
  return scores[best] > 0 ? best : fallback;
}

export { DOMAIN_LABELS };
