import { Modal, Notice, type App, type Editor } from 'obsidian';
import { DOMAIN_LABELS } from '../domains/dictionaries';
import { expandSnippetWithSelection, filterAuthoringItems, type AuthoringItem } from '../core/authoring';
import type { EquationHistoryItem, LatexToolboxSettings, ScienceDomain, Shortcut, Snippet, Template } from '../types';
import type LatexToolboxPlugin from '../main';

export class QuickInsertModal extends Modal {
  private queryEl!: HTMLInputElement;
  private listEl!: HTMLElement;
  private domain: ScienceDomain;

  constructor(
    app: App,
    private readonly plugin: LatexToolboxPlugin,
    private readonly editor: Editor,
    private readonly settings: LatexToolboxSettings,
  ) {
    super(app);
    this.domain = settings.defaultDomain;
  }

  onOpen(): void {
    this.modalEl.addClass('latex-toolbox-quick-modal');
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('lt-quick-entry');
    contentEl.createEl('h2', { text: 'Quick insert' });
    contentEl.createDiv({ text: 'Search shortcuts, snippets, templates, favorites, and recent equations.', cls: 'lt-subtitle' });

    const domainRow = contentEl.createDiv('lt-quick-domains');
    (Object.keys(DOMAIN_LABELS) as ScienceDomain[]).forEach((domain) => {
      const button = domainRow.createEl('button', { text: DOMAIN_LABELS[domain], cls: 'lt-domain-button' });
      button.type = 'button';
      button.setAttr('aria-pressed', String(domain === this.domain));
      this.registerDomEvent(button, 'click', () => {
        this.domain = domain;
        (Array.from(domainRow.children) as HTMLElement[]).forEach((child, index) => child.setAttr('aria-pressed', String((Object.keys(DOMAIN_LABELS) as ScienceDomain[])[index] === domain)));
        this.render();
      });
    });

    this.queryEl = contentEl.createEl('input', { cls: 'lt-quick-search', attr: { type: 'search', placeholder: 'Search e.g. frac, Maxwell, Ohm, alpha…', autocomplete: 'off' } }) as HTMLInputElement;
    this.registerDomEvent(this.queryEl, 'input', () => this.render());
    this.listEl = contentEl.createDiv('lt-quick-list');
    this.render();
    window.setTimeout(() => this.queryEl.focus(), 0);
  }

  private render(): void {
    this.listEl.empty();
    const items = filterAuthoringItems(
      this.queryEl.value,
      this.domain,
      this.settings.customShortcuts,
      this.settings.customSnippets,
      this.settings.customTemplates,
      this.settings.recentEquations,
      this.settings.favoriteEquations,
      20,
    );
    if (items.length === 0) {
      this.listEl.createDiv({ text: 'No matching authoring items.', cls: 'lt-empty' });
      return;
    }
    items.forEach((item) => this.renderItem(item));
  }

  private renderItem(item: AuthoringItem): void {
    const row = this.listEl.createDiv('lt-quick-item');
    const icon = item.kind === 'favorite' ? '★' : item.kind === 'history' ? '↶' : item.kind === 'snippet' ? '▦' : item.kind === 'template' ? '▤' : 'λ';
    row.createSpan({ text: icon, cls: 'lt-quick-icon' });
    const body = row.createDiv('lt-quick-body');
    body.createDiv({ text: item.label, cls: 'lt-quick-title' });
    body.createDiv({ text: item.detail, cls: 'lt-quick-detail' });
    this.registerDomEvent(row, 'click', () => this.insert(item));
    if (item.kind === 'history' || item.kind === 'favorite') {
      const star = row.createEl('button', { text: item.kind === 'favorite' ? '★' : '☆', cls: 'lt-star-button' });
      star.type = 'button';
      star.setAttr('aria-label', item.kind === 'favorite' ? 'Remove favorite' : 'Add favorite');
      this.registerDomEvent(star, 'click', (event: MouseEvent) => {
        event.stopPropagation();
        const source = [...this.settings.favoriteEquations, ...this.settings.recentEquations].find((entry) => entry.id === item.id);
        if (source) void this.plugin.toggleEquationFavorite(source).then(() => this.render());
      });
    }
  }

  private insert(item: AuthoringItem): void {
    const expanded = item.kind === 'snippet' || item.kind === 'template'
      ? expandSnippetWithSelection(item.latex)
      : { text: item.latex, selectionStart: item.latex.length, selectionEnd: item.latex.length };
    this.editor.replaceSelection(expanded.text);
    if (item.kind === 'snippet' || item.kind === 'template') {
      const endOffset = this.editor.posToOffset(this.editor.getCursor());
      const startOffset = endOffset - (expanded.text.length - expanded.selectionStart);
      const selectionEnd = startOffset + (expanded.selectionEnd - expanded.selectionStart);
      this.editor.setSelection(this.editor.offsetToPos(startOffset), this.editor.offsetToPos(selectionEnd));
    }
    this.close();
  }
}

export class AuthoringLibraryModal extends Modal {
  private activeTab: 'shortcuts' | 'snippets' | 'templates' = 'shortcuts';

  constructor(app: App, private readonly plugin: LatexToolboxPlugin) { super(app); }

  onOpen(): void {
    this.modalEl.addClass('latex-toolbox-library-modal');
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Authoring library' });
    contentEl.createDiv({ text: 'Manage your shortcuts, snippets, and reusable templates.', cls: 'lt-subtitle' });
    const tabs = contentEl.createDiv('lt-library-tabs');
    for (const tab of ['shortcuts', 'snippets', 'templates'] as const) {
      const button = tabs.createEl('button', { text: tab.charAt(0).toUpperCase() + tab.slice(1), cls: 'lt-library-tab' });
      button.type = 'button';
      button.setAttr('aria-pressed', String(tab === this.activeTab));
      this.registerDomEvent(button, 'click', () => { this.activeTab = tab; this.render(); });
    }
    const toolbar = contentEl.createDiv('lt-library-toolbar');
    const add = toolbar.createEl('button', { text: `Add ${this.activeTab.slice(0, -1)}` });
    add.type = 'button';
    this.registerDomEvent(add, 'click', () => this.addItem());
    const list = contentEl.createDiv('lt-library-list');
    const items = this.activeTab === 'shortcuts' ? this.plugin.settings.customShortcuts : this.activeTab === 'snippets' ? this.plugin.settings.customSnippets : this.plugin.settings.customTemplates;
    items.forEach((item) => this.renderRow(list, item));
    if (items.length === 0) list.createDiv({ text: 'Nothing added yet.', cls: 'lt-empty' });
  }

  private renderRow(list: HTMLElement, item: Shortcut | Snippet | Template): void {
    const row = list.createDiv('lt-library-row');
    const main = row.createDiv();
    const title = 'name' in item ? item.name : item.trigger;
    main.createDiv({ text: title, cls: 'lt-library-name' });
    main.createDiv({ text: 'description' in item ? item.description : item.latex, cls: 'lt-library-detail' });
    row.createEl('code', { text: item.trigger });
    const edit = row.createEl('button', { text: 'Edit' });
    edit.type = 'button';
    this.registerDomEvent(edit, 'click', () => this.editItem(item));
    const remove = row.createEl('button', { text: 'Delete' });
    remove.type = 'button';
    this.registerDomEvent(remove, 'click', () => {
      if (this.activeTab === 'shortcuts') this.plugin.settings.customShortcuts = this.plugin.settings.customShortcuts.filter((entry) => entry.id !== item.id);
      else if (this.activeTab === 'snippets') this.plugin.settings.customSnippets = this.plugin.settings.customSnippets.filter((entry) => entry.id !== item.id);
      else this.plugin.settings.customTemplates = this.plugin.settings.customTemplates.filter((entry) => entry.id !== item.id);
      void this.plugin.saveSettings().then(() => this.render()).catch(() => new Notice('Could not save the authoring library.'));
    });
  }

  private addItem(): void {
    if (this.activeTab === 'shortcuts') this.editItem({ id: `shortcut-${Date.now()}`, trigger: '', latex: '', domain: 'all' }, true);
    else if (this.activeTab === 'snippets') this.editItem({ id: `snippet-${Date.now()}`, name: '', trigger: '', latex: '', domain: 'all' }, true);
    else this.editItem({ id: `template-${Date.now()}`, name: '', trigger: '', description: '', latex: '', domain: 'all' }, true);
  }

  private editItem(item: Shortcut | Snippet | Template, isNew = false): void {
    const modal = new EditAuthoringItemModal(this.app, item, async (updated) => {
      if (this.activeTab === 'shortcuts') {
        const list = this.plugin.settings.customShortcuts;
        this.plugin.settings.customShortcuts = isNew ? [...list, updated as Shortcut] : list.map((entry) => entry.id === updated.id ? updated as Shortcut : entry);
      } else if (this.activeTab === 'snippets') {
        const list = this.plugin.settings.customSnippets;
        this.plugin.settings.customSnippets = isNew ? [...list, updated as Snippet] : list.map((entry) => entry.id === updated.id ? updated as Snippet : entry);
      } else {
        const list = this.plugin.settings.customTemplates;
        this.plugin.settings.customTemplates = isNew ? [...list, updated as Template] : list.map((entry) => entry.id === updated.id ? updated as Template : entry);
      }
      await this.plugin.saveSettings();
      this.render();
    });
    modal.open();
  }
}

class EditAuthoringItemModal extends Modal {
  constructor(app: App, private readonly item: Shortcut | Snippet | Template, private readonly onSave: (item: Shortcut | Snippet | Template) => Promise<void>) { super(app); }

  onOpen(): void {
    this.modalEl.addClass('latex-toolbox-editor-modal');
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: 'Edit authoring item' });
    const fields = new Map<string, HTMLInputElement>();
    const makeField = (label: string, key: string, value: string): void => {
      const wrap = contentEl.createDiv('lt-field');
      wrap.createDiv({ text: label, cls: 'lt-field-label' });
      const input = wrap.createEl('input', { attr: { type: 'text' } }) as HTMLInputElement;
      input.value = value;
      fields.set(key, input);
    };
    if ('name' in this.item) makeField('Name', 'name', this.item.name);
    makeField('Trigger', 'trigger', this.item.trigger);
    if ('description' in this.item) makeField('Description', 'description', this.item.description);
    makeField('LaTeX / expansion', 'latex', this.item.latex);
    makeField('Domain (all, math, physics, chemistry, electronics)', 'domain', this.item.domain);
    const save = contentEl.createEl('button', { text: 'Save', cls: 'mod-cta' });
    save.type = 'button';
    this.registerDomEvent(save, 'click', () => void this.save(fields));
  }

  private async save(fields: Map<string, HTMLInputElement>): Promise<void> {
    const get = (key: string): string => fields.get(key)?.value.trim() ?? '';
    const domain = (get('domain') || 'all') as ScienceDomain | 'all';
    const updated = { ...this.item, trigger: get('trigger'), latex: get('latex'), domain } as Shortcut | Snippet | Template;
    if ('name' in this.item) (updated as Snippet | Template).name = get('name');
    if ('description' in this.item) (updated as Template).description = get('description');
    if (!updated.trigger || !updated.latex || ('name' in updated && !updated.name)) {
      new Notice('Trigger, name, and LaTeX are required.');
      return;
    }
    try {
      await this.onSave(updated);
      this.close();
    } catch {
      new Notice('Could not save the authoring item.');
    }
  }
}
