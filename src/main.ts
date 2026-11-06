import { Plugin, Notice } from "obsidian";
import { DEFAULT_SETTINGS } from "./settings";
import type { LaTeXSettings } from "./types";
// Fresh Nihon 4.6.0-derived entry (4826-line bundle). Full split
// (TAXONOMY, Wolfram Guide, Matrix/Chem engines, FloatingSolverWindow, EquationWorkspaceModal, LibraryManagerModal) is incremental — see README.
export default class LatexToolboxPlugin extends Plugin {
  settings!: LaTeXSettings;
  floatingSolver: any = null;
  activeBuilderModal: any = null;
  casProviders = new Map();
  activeCASProviderId: string | null = null;

  async onload() {
    await this.loadSettings();
    this.applyThemePreferences();
    console.warn("[latex-toolbox] TAXONOMY/engines split pending — entry lifecycle only in pilot.");

    this.addCommand({ id: "open-stem-builder", name: "Open interactive STEM builder", callback: () => new Notice("STEM builder — full port pending.") });
    this.addCommand({ id: "open-floating-step-solver", name: "Open floating Step-by-Step STEM Solver window", callback: () => new Notice("Solver — full port pending.") });
    this.addCommand({ id: "manage-stem-library", name: "Manage STEM library (Multi-Subject Tree / Import / Export)", callback: () => new Notice("Library manager — full port pending.") });

    this.addRibbonIcon("calculator", "STEM LaTeX Builder", () => new Notice("LaTeX Toolbox — pilot build."));
    this.addSettingTab(new LatexSettingPlaceholder(this.app, this));
  }

  onunload() {}

  applyThemePreferences() {
    if (typeof document !== "undefined") {
      document.body.toggleClass("latex-glassmorphic", Boolean((this.settings as any).glassmorphism ?? true));
    }
  }

  async loadSettings() {
    const raw = ((await this.loadData()) ?? {}) as Partial<LaTeXSettings>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
  }

  async saveSettings() { await this.saveData(this.settings); }
}

import { PluginSettingTab, App } from "obsidian";
class LatexSettingPlaceholder extends PluginSettingTab {
  constructor(app: App, private plugin: LatexToolboxPlugin) { super(app, plugin); }
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "LaTeX Toolbox — pilot" });
    containerEl.createEl("p", { text: "Full settings UI port is next split step. Defaults match Nihon 4.6.0." });
  }
}
