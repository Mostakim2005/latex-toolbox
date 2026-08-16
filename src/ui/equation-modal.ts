import { Component, MarkdownRenderer, Modal, Notice, type App, type Editor } from 'obsidian';
import { DOMAIN_LABELS } from '../domains/dictionaries';
import { naturalLanguageToLatex } from '../core/natural-language';
import { validateLatex, wrapLatex } from '../core/latex-utils';
import { validateScientificConversion, MAX_SCIENTIFIC_INPUT_LENGTH } from '../core/scientific-validation';
import { expandSnippet } from '../core/snippets';
import type { LatexToolboxSettings, ScienceDomain, SemanticCandidate, Snippet } from '../types';
import type LatexToolboxPlugin from '../main';

const EXAMPLES: Record<ScienceDomain, string> = {
  general: 'alpha squared plus beta equals gamma',
  math: 'integral from 0 to infinity of e to the minus x squared dx',
  physics: 'force equals mass times acceleration',
  chemistry: '2 H2 + O2 -> 2 H2O',
  electronics: 'voltage equals current times resistance',
};

export class EquationModal extends Modal {
  private domain: ScienceDomain;
  private inputEl!: HTMLTextAreaElement;
  private latexEl!: HTMLElement;
  private previewEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private readonly eventComponent = new Component();
  private sourceComponent = new Component();
  private currentLatex = '';
  private currentCandidates: SemanticCandidate[] = [];
  private candidateEl!: HTMLElement;
  private updateTimer: number | null = null;
  private previewRequest = 0;

  constructor(
    app: App,
    private readonly plugin: LatexToolboxPlugin,
    private readonly editor: Editor,
    private readonly settings: LatexToolboxSettings,
    private readonly selectionText: string,
  ) {
    super(app);
    this.domain = settings.defaultDomain;
  }

  onOpen(): void {
    this.modalEl.addClass('latex-toolbox-equation-modal');
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('latex-toolbox-equation-workspace');

    const header = contentEl.createDiv('lt-header');
    const titleGroup = header.createDiv('lt-title-group');
    titleGroup.createEl('h2', { text: 'Smart equation' });
    titleGroup.createDiv({ text: 'Turn scientific language into safe, editable LaTeX.', cls: 'lt-subtitle' });

    const domainRow = contentEl.createDiv('lt-domain-row');
    domainRow.createDiv({ text: 'Domain', cls: 'lt-section-label' });
    const domainGrid = domainRow.createDiv('lt-domain-grid');
    (Object.keys(DOMAIN_LABELS) as ScienceDomain[]).forEach((domain) => {
      const button = domainGrid.createEl('button', { cls: 'lt-domain-button' });
      button.type = 'button';
      button.setAttr('aria-pressed', String(domain === this.domain));
      button.createSpan({ text: DOMAIN_LABELS[domain] });
      this.eventComponent.registerDomEvent(button, 'click', () => {
        this.domain = domain;
        this.renderDomainButtons(domainGrid);
        this.updateConversion();
      });
    });

    const composer = contentEl.createDiv('lt-composer-grid');
    const inputPanel = composer.createDiv('lt-panel lt-input-panel');
    const inputHeader = inputPanel.createDiv('lt-panel-header');
    inputHeader.createDiv({ text: 'Describe it', cls: 'lt-panel-title' });
    const example = inputHeader.createEl('button', { text: 'Use example', cls: 'lt-text-button' });
    example.type = 'button';
    this.eventComponent.registerDomEvent(example, 'click', () => {
      this.inputEl.value = EXAMPLES[this.domain];
      this.updateConversion();
      this.inputEl.focus();
    });

    this.inputEl = inputPanel.createEl('textarea', { cls: 'lt-input', attr: { rows: '7', maxlength: String(Math.min(MAX_SCIENTIFIC_INPUT_LENGTH, this.settings.maxInputLength)), 'aria-label': 'Natural language or LaTeX equation input' } });
    this.inputEl.value = this.selectionText;
    this.eventComponent.registerDomEvent(this.inputEl, 'input', () => this.scheduleConversion());

    const hint = inputPanel.createDiv('lt-input-hint');
    hint.setText('Natural language, symbols, formulas, or existing LaTeX are all valid inputs.');

    const outputPanel = composer.createDiv('lt-panel lt-output-panel');
    outputPanel.createDiv({ text: 'LaTeX', cls: 'lt-panel-title' });
    this.latexEl = outputPanel.createEl('pre', { cls: 'lt-latex-output' });
    this.latexEl.setText('');

    const previewWrap = contentEl.createDiv('lt-preview-wrap');
    previewWrap.createDiv({ text: 'Preview', cls: 'lt-section-label' });
    this.previewEl = previewWrap.createDiv('lt-preview');

    this.statusEl = contentEl.createDiv('lt-status');
    this.statusEl.setAttr('aria-live', 'polite');
    this.candidateEl = contentEl.createDiv('lt-semantic-candidates');
    const footer = contentEl.createDiv('lt-footer');
    const insertButton = footer.createEl('button', { text: this.selectionText ? 'Replace selection' : 'Insert into note', cls: 'mod-cta' });
    insertButton.type = 'button';
    this.eventComponent.registerDomEvent(insertButton, 'click', () => void this.insertResult());
    const favoriteButton = footer.createEl('button', { text: '☆ favorite' });
    favoriteButton.type = 'button';
    this.eventComponent.registerDomEvent(favoriteButton, 'click', () => void this.favoriteCurrent());

    const copyButton = footer.createEl('button', { text: 'Copy LaTeX' });
    copyButton.type = 'button';
    this.eventComponent.registerDomEvent(copyButton, 'click', () => {
      void navigator.clipboard.writeText(this.currentLatex)
        .then(() => new Notice('LaTeX copied.'))
        .catch(() => new Notice('Could not copy LaTeX to the clipboard.'));
    });
    const cancelButton = footer.createEl('button', { text: 'Cancel' });
    cancelButton.type = 'button';
    this.eventComponent.registerDomEvent(cancelButton, 'click', () => this.close());

    this.renderDomainButtons(domainGrid);
    this.updateConversion();
    window.setTimeout(() => this.inputEl.focus(), 0);
  }

  private renderDomainButtons(grid: HTMLElement): void {
    Array.from(grid.children).forEach((child, index) => {
      const domain = (Object.keys(DOMAIN_LABELS) as ScienceDomain[])[index];
      child.setAttr('aria-pressed', String(domain === this.domain));
    });
  }

  private scheduleConversion(): void {
    if (!this.settings.livePreview) return;
    if (this.updateTimer !== null) window.clearTimeout(this.updateTimer);
    this.updateTimer = window.setTimeout(() => { this.updateTimer = null; this.updateConversion(); }, 120);
  }

  private updateConversion(): void {
    const rawResult = naturalLanguageToLatex(this.inputEl.value, this.domain, this.settings.customShortcuts);
    const result = validateScientificConversion(rawResult, this.domain, this.inputEl.value);
    this.currentLatex = result.latex;
    this.currentCandidates = result.candidates ?? [];
    this.latexEl.setText(result.latex || '—');
    const confidenceLabel = result.confidence === 'high' ? 'High confidence' : result.confidence === 'medium' ? 'Review suggested' : 'Low confidence';
    const issueText = result.issues.length > 0 ? ` ${result.issues.slice(0, 2).join(' ')}` : '';
    this.statusEl.setText(`${confidenceLabel} · ${result.explanation}${issueText}`);
    this.statusEl.toggleClass('is-warning', result.confidence !== 'high');
    const errors = validateLatex(result.latex);
    this.statusEl.toggleClass('is-error', errors.length > 0);
    if (errors.length > 0) this.statusEl.setText(`LaTeX validation failed. ${errors.join(' ')}`);
    this.renderCandidates();
    if (this.settings.livePreview) void this.renderPreview(result.latex);
  }

  private renderCandidates(): void {
    this.candidateEl.empty();
    if (this.currentCandidates.length <= 1) return;
    this.candidateEl.createDiv({ text: 'Possible interpretations', cls: 'lt-section-label' });
    const list = this.candidateEl.createDiv('lt-candidate-list');
    for (const candidate of this.currentCandidates.slice(0, 4)) {
      const button = list.createEl('button', { cls: 'lt-candidate', attr: { type: 'button' } });
      button.setAttr('aria-label', `${candidate.label}: ${candidate.latex}`);
      const head = button.createDiv('lt-candidate-head');
      head.createSpan({ text: candidate.label, cls: 'lt-candidate-label' });
      head.createSpan({ text: candidate.confidence, cls: `lt-confidence is-${candidate.confidence}` });
      button.createEl('code', { text: candidate.latex });
      button.createDiv({ text: candidate.explanation, cls: 'lt-candidate-explanation' });
      this.eventComponent.registerDomEvent(button, 'click', () => {
        this.currentLatex = candidate.latex;
        this.latexEl.setText(candidate.latex || '—');
        this.statusEl.setText(`${candidate.confidence === 'high' ? 'High confidence' : candidate.confidence === 'medium' ? 'Review suggested' : 'Low confidence'} · ${candidate.explanation}`);
        this.statusEl.toggleClass('is-warning', candidate.confidence !== 'high');
        this.statusEl.toggleClass('is-error', validateLatex(candidate.latex).length > 0);
        void this.renderPreview(candidate.latex);
      });
    }
  }

  private async renderPreview(latex: string): Promise<void> {
    const request = ++this.previewRequest;
    this.sourceComponent.unload();
    this.sourceComponent = new Component();
    this.previewEl.empty();
    if (!latex.trim()) {
      this.previewEl.createDiv({ text: 'Your rendered equation will appear here.', cls: 'lt-preview-empty' });
      return;
    }
    try {
      const source = wrapLatex(latex, 'block');
      await MarkdownRenderer.render(this.app, source, this.previewEl, this.app.workspace.getActiveFile()?.path ?? '', this.sourceComponent);
      if (request !== this.previewRequest) return;
    } catch {
      this.previewEl.createEl('code', { text: latex });
    }
  }

  private async favoriteCurrent(): Promise<void> {
    const errors = validateLatex(this.currentLatex);
    if (errors.length > 0 || !this.currentLatex.trim()) {
      new Notice('Create a valid equation first.');
      return;
    }
    try {
      await this.plugin.saveFavoriteEquation(this.inputEl.value, this.currentLatex, this.domain);
      new Notice('Equation added to favorites.');
    } catch {
      new Notice('The equation is valid, but it could not be saved to favorites.');
    }
  }

  private async insertResult(): Promise<void> {
    const errors = validateLatex(this.currentLatex);
    if (errors.length > 0) {
      new Notice(`Cannot insert: ${errors.join(' ')}`);
      return;
    }
    const output = wrapLatex(this.currentLatex, this.settings.wrapStyle);
    if (!output) {
      new Notice('Enter an equation first.');
      return;
    }
    if (this.selectionText) this.editor.replaceSelection(output);
    else this.editor.replaceRange(output, this.editor.getCursor());
    try {
      await this.plugin.recordEquation(this.inputEl.value, this.currentLatex, this.domain);
    } catch {
      new Notice('Equation inserted, but recent-equation history could not be saved.');
    }
    this.close();
  }

  onClose(): void {
    if (this.updateTimer !== null) window.clearTimeout(this.updateTimer);
    this.updateTimer = null;
    this.previewRequest += 1;
    this.sourceComponent.unload();
    this.eventComponent.unload();
    this.contentEl.empty();
  }
}

export function openSnippetModal(plugin: LatexToolboxPlugin, editor: Editor, snippets: Snippet[], domain: ScienceDomain): void {
  const filtered = snippets.filter((snippet) => snippet.domain === 'all' || snippet.domain === domain);
  if (filtered.length === 0) {
    new Notice('No snippets are available for this domain.');
    return;
  }
  const modal = new Modal(plugin.app);
  const eventComponent = new Component();
  modal.onOpen = () => {
    modal.titleEl.setText('Insert LaTeX snippet');
    const container = modal.contentEl;
    container.empty();
    container.addClass('latex-toolbox-snippet-modal');
    filtered.forEach((snippet) => {
      const row = container.createDiv('lt-snippet-row');
      row.createDiv({ text: snippet.name, cls: 'lt-snippet-name' });
      row.createEl('code', { text: expandSnippet(snippet) });
      const button = row.createEl('button', { text: 'Insert' });
      button.type = 'button';
      eventComponent.registerDomEvent(button, 'click', () => {
        editor.replaceRange(wrapLatex(expandSnippet(snippet), plugin.settings.wrapStyle), editor.getCursor());
        modal.close();
      });
    });
  };
  modal.onClose = () => { eventComponent.unload(); modal.contentEl.empty(); };
  modal.open();
}
