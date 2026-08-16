import type { App } from 'obsidian';
import { PluginSettingTab as SettingTab, Setting } from 'obsidian';
import type { LatexToolboxSettings, ScienceDomain } from '../types';
import type LatexToolboxPlugin from '../main';

export class LatexToolboxSettingTab extends SettingTab {
  private readonly latexPlugin: LatexToolboxPlugin;

  constructor(app: App, latexPlugin: LatexToolboxPlugin) {
    super(app, latexPlugin);
    this.latexPlugin = latexPlugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'LaTeX toolbox' });
    containerEl.createEl('p', { text: 'Configure the scientific equation workspace and conversion behavior.' });

    new Setting(containerEl)
      .setName('Default domain')
      .setDesc('The domain selected when the equation workspace opens.')
      .addDropdown((dropdown) => {
        const domains: Record<ScienceDomain, string> = {
          general: 'General science', math: 'Mathematics', physics: 'Physics', chemistry: 'Chemistry', electronics: 'Electrical & electronics',
        };
        Object.entries(domains).forEach(([key, label]) => { dropdown.addOption(key, label); });
        dropdown.setValue(this.latexPlugin.settings.defaultDomain);
        dropdown.onChange((value) => {
          this.latexPlugin.settings.defaultDomain = value as ScienceDomain;
          void this.latexPlugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Math wrapping')
      .setDesc('How newly wrapped math should be delimited.')
      .addDropdown((dropdown) => dropdown
        .addOption('block', 'Display ($$)')
        .addOption('inline', 'Inline ($)')
        .setValue(this.latexPlugin.settings.wrapStyle)
        .onChange((value) => {
          this.latexPlugin.settings.wrapStyle = value as LatexToolboxSettings['wrapStyle'];
          void this.latexPlugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Convert LaTeX delimiters')
      .setDesc('Normalize \\(…\\) and \\[…\\] when using the delimiter fixer.')
      .addToggle((toggle) => toggle
        .setValue(this.latexPlugin.settings.convertParens)
        .onChange((value) => {
          this.latexPlugin.settings.convertParens = value;
          void this.latexPlugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Force display math')
      .setDesc('Convert inline dollar math to display math when explicitly using the fixer.')
      .addToggle((toggle) => toggle
        .setValue(this.latexPlugin.settings.forceDisplayMath)
        .onChange((value) => {
          this.latexPlugin.settings.forceDisplayMath = value;
          void this.latexPlugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Authoring autocomplete')
      .setDesc('Show domain-aware shortcuts, snippets, templates, favorites, and recent equations while typing.')
      .addToggle((toggle) => toggle
        .setValue(this.latexPlugin.settings.autocompleteEnabled)
        .onChange((value) => {
          this.latexPlugin.settings.autocompleteEnabled = value;
          void this.latexPlugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Live equation preview')
      .setDesc('Update the rendered preview while typing. Turn off on slower devices or very large expressions.')
      .addToggle((toggle) => toggle
        .setValue(this.latexPlugin.settings.livePreview)
        .onChange((value) => {
          this.latexPlugin.settings.livePreview = value;
          void this.latexPlugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Maximum equation input length')
      .setDesc('Maximum characters accepted by the natural-language engine.')
      .addSlider((slider) => slider
        .setLimits(200, 5000, 100)
        .setValue(this.latexPlugin.settings.maxInputLength)
        .setDynamicTooltip()
        .onChange((value) => {
          this.latexPlugin.settings.maxInputLength = value;
          void this.latexPlugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Semantic review threshold')
      .setDesc('Controls when the converter emphasizes review instead of treating an interpretation as decisive.')
      .addDropdown((dropdown) => dropdown
        .addOption('low', 'Low')
        .addOption('medium', 'Medium')
        .addOption('high', 'High')
        .setValue(this.latexPlugin.settings.semanticReviewThreshold)
        .onChange((value) => {
          this.latexPlugin.settings.semanticReviewThreshold = value as LatexToolboxSettings['semanticReviewThreshold'];
          void this.latexPlugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Autocomplete result limit')
      .setDesc('Maximum suggestions shown at once.')
      .addSlider((slider) => slider
        .setLimits(5, 20, 1)
        .setValue(this.latexPlugin.settings.autocompleteMaxResults)
        .setDynamicTooltip()
        .onChange((value) => {
          this.latexPlugin.settings.autocompleteMaxResults = value;
          void this.latexPlugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Authoring library')
      .setDesc('Create, edit, or delete custom shortcuts, snippets, and templates.')
      .addButton((button) => button
        .setButtonText('Open library')
        .onClick(() => this.latexPlugin.openAuthoringLibrary()));

    new Setting(containerEl)
      .setName('Automatic bare-math wrapping')
      .setDesc('Keep off for safer prose handling. Explicit wrapping is recommended for ambiguous text.')
      .addToggle((toggle) => toggle
        .setValue(this.latexPlugin.settings.autoWrapBareMath)
        .onChange((value) => {
          this.latexPlugin.settings.autoWrapBareMath = value;
          void this.latexPlugin.saveSettings();
        }));
  }
}
