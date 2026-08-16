import { MarkdownView, Notice, Plugin } from 'obsidian';
import type { Editor } from 'obsidian';
import { DEFAULT_SETTINGS } from './settings/defaults';
import { normalizeSettings } from './settings/normalize';
import { LatexToolboxSettingTab } from './settings/settings';
import { fixLatexDelimiters } from './core/delimiters';
import { EquationModal, openSnippetModal } from './ui/equation-modal';
import { AuthoringLibraryModal, QuickInsertModal } from './ui/authoring-modals';
import { LatexToolboxEditorSuggest } from './editor-suggest';
import { createHistoryItem, toggleFavorite, updateHistory } from './core/authoring';
import type { LatexToolboxSettings } from './types';

export default class LatexToolboxPlugin extends Plugin {
  settings!: LatexToolboxSettings;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new LatexToolboxSettingTab(this.app, this));
    this.registerEditorSuggest(new LatexToolboxEditorSuggest(this));

    this.addCommand({
      id: 'smart-equation',
      name: 'Open smart equation workspace',
      editorCallback: (editor) => this.openEquationWorkspace(editor),
    });

    this.addCommand({
      id: 'review-equation-interpretation',
      name: 'Review current equation interpretation',
      editorCallback: (editor) => {
        if (!editor.getSelection()) {
          const line = editor.getCursor().line;
          editor.setSelection({ line, ch: 0 }, { line, ch: editor.getLine(line).length });
        }
        this.openEquationWorkspace(editor);
      },
    });

    this.addCommand({
      id: 'quick-insert',
      name: 'Quick insert authoring item',
      editorCallback: (editor) => new QuickInsertModal(this.app, this, editor, this.settings).open(),
    });

    this.addCommand({
      id: 'manage-authoring-library',
      name: 'Manage shortcuts, snippets, and templates',
      callback: () => this.openAuthoringLibrary(),
    });

    this.addCommand({
      id: 'insert-latex-snippet',
      name: 'Insert LaTeX snippet',
      editorCallback: (editor) => openSnippetModal(this, editor, this.settings.customSnippets, this.settings.defaultDomain),
    });

    this.addCommand({
      id: 'expand-latex-shortcut',
      name: 'Expand LaTeX shortcut',
      editorCallback: (editor) => this.expandShortcutAtCursor(editor),
    });

    this.addCommand({
      id: 'fix-latex',
      name: 'Fix LaTeX delimiters',
      editorCallback: (editor) => {
        const original = editor.getValue();
        const fixed = fixLatexDelimiters(original, this.settings);
        if (fixed === original) { new Notice('No delimiter changes needed.'); return; }
        const lastLine = editor.lastLine();
        const end = { line: lastLine, ch: editor.getLine(lastLine).length };
        editor.replaceRange(fixed, { line: 0, ch: 0 }, end);
        new Notice('LaTeX delimiters fixed.');
      },
    });

    this.addRibbonIcon('function-square', 'Smart equation', () => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) {
        new Notice('Open a Markdown note first.');
        return;
      }
      this.openEquationWorkspace(view.editor);
    });
  }

  private openEquationWorkspace(editor: Editor): void {
    const selection = editor.getSelection();
    new EquationModal(this.app, this, editor, this.settings, selection).open();
  }

  private expandShortcutAtCursor(editor: Editor): void {
    const line = editor.getLine(editor.getCursor().line);
    const cursor = editor.getCursor();
    const before = line.slice(0, cursor.ch);
    const match = before.match(/([^\s]+)$/);
    if (!match) {
      new Notice('Type a shortcut first.');
      return;
    }
    const trigger = match[1] ?? '';
    const shortcut = this.settings.customShortcuts.find((entry) => entry.trigger === trigger && (entry.domain === 'all' || entry.domain === this.settings.defaultDomain))
      ?? this.settings.customShortcuts.find((entry) => entry.trigger === trigger);
    if (!shortcut) {
      new Notice(`No shortcut found for “${trigger}”.`);
      return;
    }
    const start = { line: cursor.line, ch: cursor.ch - trigger.length };
    editor.replaceRange(shortcut.latex, start, cursor);
  }

  openAuthoringLibrary(): void {
    new AuthoringLibraryModal(this.app, this).open();
  }

  async recordEquation(input: string, latex: string, domain: import('./types').ScienceDomain): Promise<void> {
    const item = createHistoryItem(input, latex, domain);
    const next = updateHistory(this.settings.recentEquations, this.settings.favoriteEquations, item);
    this.settings.recentEquations = next.recent;
    this.settings.favoriteEquations = next.favorites;
    await this.saveSettings();
  }

  async toggleEquationFavorite(item: import('./types').EquationHistoryItem): Promise<void> {
    this.settings.favoriteEquations = toggleFavorite(this.settings.favoriteEquations, item);
    await this.saveSettings();
  }

  async saveFavoriteEquation(input: string, latex: string, domain: import('./types').ScienceDomain): Promise<void> {
    const item = createHistoryItem(input, latex, domain, true);
    const next = updateHistory(this.settings.recentEquations, this.settings.favoriteEquations, item);
    this.settings.recentEquations = next.recent;
    this.settings.favoriteEquations = next.favorites;
    await this.saveSettings();
  }

  async loadSettings(): Promise<void> {
    try {
      this.settings = normalizeSettings(await this.loadData());
    } catch {
      this.settings = normalizeSettings(DEFAULT_SETTINGS);
      new Notice('Could not load saved LaTeX Toolbox settings; defaults were restored.');
    }
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
  }
}
