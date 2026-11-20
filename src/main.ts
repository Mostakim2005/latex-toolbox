import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS, getMergedLibrary, safeSaveSettings } from "./settings";
import type { LaTeXSettings } from "./types";
import { normalizeDelimiters, wrapMath } from "./core/delimiters";
import { casDifferentiate, casExpand, casSimplify, casSolve } from "./core/cas-engine";
import { detectCompanionLatexPlugins, isCursorInMathZone } from "./core/editor-interop";
import { mountMathLiveField, stripMathLivePlaceholders } from "./ui/mathlive-field";
import { normalizeChemicalFormulaInput, TAXONOMY } from "./taxonomy";

class MathLiveBuilderModal extends Modal {
  private latex = "";
  constructor(
    app: App,
    private plugin: LatexToolboxPlugin,
    private editor: Editor | null,
    initialText = ""
  ) {
    super(app);
    this.latex = initialText;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("lt-modal");
    contentEl.createEl("h2", { text: "STEM LaTeX Builder (MathLive + Local CAS)" });

    const fieldHost = contentEl.createDiv({ cls: "lt-mathlive-host" });
    const mf = mountMathLiveField(fieldHost, {
      initialLatex: this.latex,
      enableSlotHighlighting: this.plugin.settings.enableSlotHighlighting,
      onChange: (clean) => {
        this.latex = clean;
      },
    });

    const casBar = contentEl.createDiv({ cls: "lt-cas-toolbar" });
    const casOut = contentEl.createDiv({ cls: "lt-cas-output" });

    const runCas = (label: string, fn: (src: string) => { ok: boolean; latex: string; numeric?: string; error?: string }) => {
      const res = fn(this.latex);
      casOut.empty();
      if (!res.ok) {
        casOut.createSpan({ text: `${label} error: ${res.error}`, cls: "lt-cas-error" });
        return;
      }
      this.latex = res.latex;
      mf.value = res.latex;
      casOut.createSpan({ text: `${label}: ${res.latex}${res.numeric ? ` (≈ ${res.numeric})` : ""}` });
    };

    if (this.plugin.settings.enableLocalCAS) {
      casBar.createEl("button", { text: "Simplify" }).onclick = () => runCas("Simplify", casSimplify);
      casBar.createEl("button", { text: "Expand" }).onclick = () => runCas("Expand", casExpand);
      casBar.createEl("button", { text: "Solve (x)" }).onclick = () => runCas("Solve", (s) => casSolve(s, "x"));
      casBar.createEl("button", { text: "d/dx" }).onclick = () => runCas("Derivative", (s) => casDifferentiate(s, "x"));
    }

    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    const insertBtn = actions.createEl("button", { text: "Insert LaTeX", cls: "mod-cta" });
    insertBtn.onclick = () => {
      const clean = stripMathLivePlaceholders(this.latex);
      if (this.editor) {
        const zone = isCursorInMathZone(this.editor);
        this.editor.replaceSelection(zone.inMath ? clean : wrapMath(clean, this.plugin.settings.wrapStyle));
      } else {
        navigator.clipboard?.writeText(clean);
        new Notice("Copied LaTeX to clipboard.");
      }
      this.close();
    };
    actions.createEl("button", { text: "Cancel" }).onclick = () => this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export default class LatexToolboxPlugin extends Plugin {
  settings!: LaTeXSettings;
  api!: Record<string, unknown>;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.applyThemePreferences();

    const companions = detectCompanionLatexPlugins(this.app);
    this.api = {
      version: "5.0.0",
      normalizeDelimiters,
      normalizeChemicalFormulaInput,
      casSimplify,
      casExpand,
      casSolve,
      casDifferentiate,
      getTaxonomy: () => TAXONOMY,
      getMergedLibrary: () => getMergedLibrary(this.settings),
      companions,
      openBuilder: (initialText?: string) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const editor = view ? view.editor : null;
        const text = initialText ?? (editor ? editor.getSelection() : "");
        new MathLiveBuilderModal(this.app, this, editor, text).open();
      },
    };
    (window as unknown as Record<string, unknown>).LatexToolboxAPI = this.api;

    // Auto-fix pasted AI LaTeX delimiters (\(...\), \[...\])
    this.registerEvent(
      this.app.workspace.on("editor-paste", (evt, editor) => {
        if (!this.settings.autoFixOnPaste) return;
        const text = evt.clipboardData?.getData("text/plain") ?? "";
        if (text && (text.includes("\\(") || text.includes("\\["))) {
          evt.preventDefault();
          editor.replaceSelection(normalizeDelimiters(text));
          new Notice("Normalized AI LaTeX delimiters.");
        }
      })
    );

    this.addCommand({
      id: "open-stem-builder",
      name: "Open interactive STEM builder (MathLive + CAS)",
      callback: () => (this.api.openBuilder as () => void)(),
    });

    this.addCommand({
      id: "fix-ai-latex-delimiters",
      name: "Fix AI LaTeX delimiters in selection or active note",
      editorCallback: (editor) => {
        const sel = editor.getSelection();
        if (sel) {
          editor.replaceSelection(normalizeDelimiters(sel));
          new Notice("Normalized LaTeX delimiters in selection.");
        } else {
          editor.setValue(normalizeDelimiters(editor.getValue()));
          new Notice("Normalized LaTeX delimiters across active note.");
        }
      },
    });

    this.addRibbonIcon("calculator", "STEM LaTeX Builder", () => (this.api.openBuilder as () => void)());
    this.addSettingTab(new LatexToolboxSettingTab(this.app, this));
  }

  onunload(): void {
    document.body.removeClass("lt-glassmorphic");
    const win = window as unknown as Record<string, unknown>;
    if (win.LatexToolboxAPI === this.api) delete win.LatexToolboxAPI;
  }

  applyThemePreferences(): void {
    document.body.toggleClass("lt-glassmorphic", this.settings.glassmorphism !== false);
  }

  async loadSettings(): Promise<void> {
    const raw = ((await this.loadData()) ?? {}) as Partial<LaTeXSettings>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
  }

  async saveSettings(): Promise<void> {
    await safeSaveSettings(this, this.settings);
  }
}

class LatexToolboxSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: LatexToolboxPlugin) {
    super(app, plugin);
  }
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "LaTeX Toolbox v5 Settings" });

    const companions = detectCompanionLatexPlugins(this.app);
    containerEl.createEl("p", {
      text: `Detected companions: LaTeX Suite (${companions.hasLatexSuite ? "Active" : "Off"}), Quick LaTeX (${companions.hasQuickLatex ? "Active" : "Off"}).`,
    });

    new Setting(containerEl)
      .setName("Enable Slot Highlighting in MathLive")
      .setDesc("Highlights interactive template placeholders for Tab-jumping.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enableSlotHighlighting).onChange(async (v) => {
          this.plugin.settings.enableSlotHighlighting = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable Local CAS (CortexJS Compute Engine)")
      .setDesc("Enables offline Simplify, Expand, Solve, and Derivative buttons in the builder.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enableLocalCAS).onChange(async (v) => {
          this.plugin.settings.enableLocalCAS = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Defer inline shortcuts to Obsidian LaTeX Suite / Quick LaTeX")
      .setDesc("Avoids hotkey conflicts when companion LaTeX plugins are active.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.deferToLatexSuite).onChange(async (v) => {
          this.plugin.settings.deferToLatexSuite = v;
          await this.plugin.saveSettings();
        })
      );
  }
}
