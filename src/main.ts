import { App, MarkdownView, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import type { LtBuilderChunk } from "./chunks/builder";
import type { LtCalculatorChunk } from "./chunks/calculator";
import type { LtEnginesModule } from "./chunks/engines";
import { clearLoadedChunks, loadPluginChunkAsync, loadPluginChunkSync, scheduleIdleTask } from "./core/chunk-loader";
import { normalizeDelimiters, wrapMath } from "./core/delimiters";
import { registerDerivationBlockProcessor } from "./core/derivation-renderer";
import { detectCompanionLatexPlugins, type CompanionLatexPlugins } from "./core/editor-interop";
import { ensureCustomSnippetsLoaded, migrateSnippetsToSidecar } from "./core/preset-store";
import { DEFAULT_SETTINGS, getMergedLibrary, safeSaveSettings } from "./settings";
import type { CASOperation, FormulaEntry, LaTeXSettings } from "./types";

const ENGINES_CHUNK = "lt-engines.chunk.js";
const BUILDER_CHUNK = "lt-builder.chunk.js";
const CALCULATOR_CHUNK = "lt-calculator.chunk.js";

export default class LatexToolboxPlugin extends Plugin {
  settings: LaTeXSettings = Object.assign({}, DEFAULT_SETTINGS);
  api!: Record<string, unknown>;
  private settingsReady: Promise<void> = Promise.resolve();
  private enginesModule: LtEnginesModule | null = null;
  private enginesPromise: Promise<LtEnginesModule> | null = null;
  private cachedCompanions: CompanionLatexPlugins | null = null;
  private cancelIdleTask: (() => void) | null = null;

  onload(): void {
    this.settings = Object.assign({}, DEFAULT_SETTINGS);
    this.settingsReady = this.loadSettings();
    registerDerivationBlockProcessor(this);

    const getEnginesSync = (): LtEnginesModule => {
      if (!this.enginesModule) {
        const mod = loadPluginChunkSync<LtEnginesModule>(this, ENGINES_CHUNK);
        mod.initEnginesPlugin(this);
        this.enginesModule = mod;
      }
      return this.enginesModule;
    };

    const ensureEngines = (): Promise<LtEnginesModule> => this.ensureEnginesLoaded();

    this.api = {
      version: this.manifest.version,
      normalizeDelimiters,
      normalizeChemicalFormulaInput: (raw: string) => getEnginesSync().normalizeChemicalFormulaInput(raw),
      balanceChemicalEquation: (input: string) => getEnginesSync().balanceChemicalEquation(input),
      naturalLanguageToLatex: (rawInput: string, imagUnit?: "j" | "i") =>
        getEnginesSync().naturalLanguageToLatex(rawInput, imagUnit),
      searchFormulaDatabase: (filter?: Record<string, unknown>) => getEnginesSync().searchFormulaDatabase(filter),
      evaluateFormulaEntry: (entry: FormulaEntry, values: Record<string, number>) =>
        getEnginesSync().evaluateFormulaEntry(entry, values),
      casSimplify: (latex: string) => getEnginesSync().casSimplify(latex),
      casExpand: (latex: string) => getEnginesSync().casExpand(latex),
      casFactor: (latex: string) => getEnginesSync().casFactor(latex),
      casSolve: (latex: string, variable?: string) => getEnginesSync().casSolve(latex, variable),
      casDifferentiate: (latex: string, variable?: string) => getEnginesSync().casDifferentiate(latex, variable),
      casIntegrate: (latex: string, variable?: string, bounds?: { lower: string; upper: string }) =>
        getEnginesSync().casIntegrate(latex, variable, bounds),
      runCASOperation: (op: CASOperation, latex: string, opts?: Record<string, unknown>) =>
        getEnginesSync().runCASOperation(op, latex, opts),
      getTaxonomy: () => getEnginesSync().TAXONOMY,
      getMergedLibrary: () => getMergedLibrary(this.settings, this),
      get companions(): CompanionLatexPlugins {
        return detectCompanionLatexPlugins(pluginApp);
      },
      openBuilder: (initialText?: string) => {
        void (async () => {
          await this.settingsReady;
          const [builderMod] = await Promise.all([
            loadPluginChunkAsync<LtBuilderChunk>(this, BUILDER_CHUNK),
            ensureEngines(),
            this.ensureSnippetsLoaded(),
          ]);
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          const editor = view ? view.editor : null;
          const text = initialText ?? (editor ? editor.getSelection() : "");
          builderMod.openBuilderModal(this.app, this, editor, text);
        })();
      },
      openCalculator: () => {
        void (async () => {
          await this.settingsReady;
          const [calcMod, engines] = await Promise.all([
            loadPluginChunkAsync<LtCalculatorChunk>(this, CALCULATOR_CHUNK),
            ensureEngines(),
          ]);
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          const editor = view ? view.editor : null;
          calcMod.openCalculatorModal(
            this.app,
            this.settings.eeImaginaryUnit,
            {
              onInsertLatex: (ltx) => {
                if (editor) editor.replaceSelection(wrapMath(ltx, this.settings.wrapStyle));
                else void navigator.clipboard?.writeText(ltx);
              },
              onSendToBuilder: (ltx) => (this.api.openBuilder as (t?: string) => void)(ltx),
            },
            this.settings.closeOnBackdropClick,
            { casPhasorConvert: engines.casPhasorConvert, getMathJs: engines.getMathJs },
            this.settings.glassmorphism !== false
          );
        })();
      },
    };
    const pluginApp = this.app;
    Object.defineProperty(this.api, "companions", {
      enumerable: true,
      get: () => {
        if (!this.cachedCompanions) {
          this.cachedCompanions = detectCompanionLatexPlugins(pluginApp);
        }
        return this.cachedCompanions;
      },
    });
    (window as unknown as Record<string, unknown>).LatexToolboxAPI = this.api;

    this.cancelIdleTask = scheduleIdleTask(() => {
      this.cachedCompanions = detectCompanionLatexPlugins(this.app);
      void this.settingsReady.then(() =>
        migrateSnippetsToSidecar(this, this.settings, () =>
          safeSaveSettings(this, this.settings, { persistSidecar: false })
        )
      );
    }, 1500);

    this.registerEvent(
      this.app.workspace.on("editor-paste", (evt, editor) => {
        if (evt.defaultPrevented || !this.settings.autoFixOnPaste) return;
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
      name: "Open interactive STEM builder (MathLive + full CAS)",
      callback: () => (this.api.openBuilder as () => void)(),
    });

    this.addCommand({
      id: "open-scientific-calculator",
      name: "Open STEM scientific & engineering calculator",
      callback: () => (this.api.openCalculator as () => void)(),
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

    const ribbonEl = this.addRibbonIcon("calculator", "STEM LaTeX builder", () => (this.api.openBuilder as () => void)());
    ribbonEl.setAttribute("aria-label", "Open STEM LaTeX builder");

    const statusEl = this.addStatusBarItem();
    statusEl.addClass("ltx-status-pill");
    statusEl.setText("LaTeX: CAS");
    statusEl.setAttribute("role", "button");
    statusEl.setAttribute("tabindex", "0");
    statusEl.setAttribute("aria-label", "Open STEM LaTeX builder");
    statusEl.addEventListener("click", () => (this.api.openBuilder as () => void)());
    statusEl.addEventListener("keydown", (evt: KeyboardEvent) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        (this.api.openBuilder as () => void)();
      }
    });

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        const sel = editor.getSelection();
        menu.addItem((item) =>
          item
            .setTitle(sel ? "LaTeX Toolbox: Open selection in STEM Builder" : "LaTeX Toolbox: Open STEM Builder")
            .setIcon("calculator")
            .onClick(() => (this.api.openBuilder as (t?: string) => void)(sel))
        );
        menu.addItem((item) =>
          item
            .setTitle("LaTeX Toolbox: Fix AI LaTeX delimiters")
            .setIcon("wand")
            .onClick(() => {
              const target = sel || editor.getValue();
              const fixed = normalizeDelimiters(target);
              if (sel) editor.replaceSelection(fixed);
              else editor.setValue(fixed);
              new Notice("Normalized LaTeX delimiters.");
            })
        );
      })
    );

    this.addSettingTab(new LatexToolboxSettingTab(this.app, this));
  }

  onunload(): void {
    this.cancelIdleTask?.();
    this.cancelIdleTask = null;
    clearLoadedChunks(this.manifest.id);
    this.enginesModule = null;
    this.enginesPromise = null;
    const win = window as unknown as Record<string, unknown>;
    if (win.LatexToolboxAPI === this.api) delete win.LatexToolboxAPI;
  }

  async ensureEngines(): Promise<LtEnginesModule> {
    return this.ensureEnginesLoaded();
  }

  private async ensureEnginesLoaded(): Promise<LtEnginesModule> {
    if (this.enginesModule) return this.enginesModule;
    if (!this.enginesPromise) {
      this.enginesPromise = loadPluginChunkAsync<LtEnginesModule>(this, ENGINES_CHUNK)
        .then(async (mod) => {
          await mod.warmAllEngineData(this);
          this.enginesModule = mod;
          return mod;
        })
        .catch((err) => {
          this.enginesPromise = null;
          throw err;
        });
    }
    return this.enginesPromise;
  }

  async ensureSnippetsLoaded(): Promise<void> {
    await this.settingsReady;
    await ensureCustomSnippetsLoaded(this, this.settings);
  }

  async loadSettings(): Promise<void> {
    const raw = ((await this.loadData()) ?? {}) as Partial<LaTeXSettings>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
  }

  async saveSettings(): Promise<void> {
    await this.settingsReady;
    await safeSaveSettings(this, this.settings, { persistSidecar: true });
    const vk = (window as unknown as { mathVirtualKeyboard?: unknown }).mathVirtualKeyboard;
    if (vk) {
      // Only update MathLive keyboard config if MathLive has already been loaded
      const builderMod = loadPluginChunkAsync<LtBuilderChunk & { applyMathLiveKeyboardConfig?: (s: LaTeXSettings) => void }>(
        this,
        BUILDER_CHUNK
      );
      void builderMod.then((m) => m.applyMathLiveKeyboardConfig?.(this.settings));
    }
  }
}

class LatexToolboxSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: LatexToolboxPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName("Virtual keyboard & editor").setHeading();

    const companions = detectCompanionLatexPlugins(this.app);
    containerEl.createEl("p", {
      text: `Detected companions: LaTeX Suite (${companions.hasLatexSuite ? "Active" : "Off"}), Quick LaTeX (${companions.hasQuickLatex ? "Active" : "Off"}).`,
    });

    new Setting(containerEl)
      .setName("Close builder when clicking outside modal")
      .setDesc("Disabled by default so accidental clicks on empty background space do not close your work.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.closeOnBackdropClick).onChange(async (v) => {
          this.plugin.settings.closeOnBackdropClick = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Show numeric keyboard tab (123)")
      .setDesc("Keep disabled if you prefer typing numbers on your physical keyboard. Re-enable anytime.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showNumericKeyboard).onChange(async (v) => {
          this.plugin.settings.showNumericKeyboard = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Show alphabetic QWERTY keyboard tab (abc)")
      .setDesc("Keep disabled to avoid duplicating your physical keyboard. Re-enable for touch/fallback input.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showAlphabeticKeyboard).onChange(async (v) => {
          this.plugin.settings.showAlphabeticKeyboard = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable dedicated STEM keyboard tabs (che, ee, math, phy)")
      .setDesc("Adds specialized virtual keyboard tabs for chemistry, EEE, mathematics, and physics.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enableStemKeyboardTabs).onChange(async (v) => {
          this.plugin.settings.enableStemKeyboardTabs = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable clickable slot highlighting in MathLive")
      .setDesc("Outlines valid template input areas for direct mouse clicking and tab jumping.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enableSlotHighlighting).onChange(async (v) => {
          this.plugin.settings.enableSlotHighlighting = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable line numbering in multiline builder")
      .setDesc("Displays 1., 2., 3. line numbers beside each derivation step.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enableLineNumbering).onChange(async (v) => {
          this.plugin.settings.enableLineNumbering = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Auto-resize multiline MathLive fields")
      .setDesc("Allows equation fields to expand vertically for multiline LaTeX.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.autoResizeEditor).onChange(async (v) => {
          this.plugin.settings.autoResizeEditor = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName("Computer algebra system & engineering").setHeading();

    new Setting(containerEl)
      .setName("Enable local CAS toolbar")
      .setDesc("Enables simplify, expand, factor, solve, d/dx, integration, phasors, units, and matrices.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.enableLocalCAS).onChange(async (v) => {
          this.plugin.settings.enableLocalCAS = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("CAS backend mode")
      .setDesc("Use hybrid Python/SymPy on desktop for full CAS (Laplace, Fourier, ODEs, series, eigenvalues).")
      .addDropdown((d) =>
        d
          .addOption("js-only", "Bundled JS only (Compute Engine + Nerdamer + Math.js)")
          .addOption("hybrid-python", "Hybrid JS + local Python/SymPy (full desktop CAS)")
          .setValue(this.plugin.settings.casBackend)
          .onChange(async (v) => {
            this.plugin.settings.casBackend = v as LaTeXSettings["casBackend"];
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Python executable path")
      .setDesc("Path or command for Python 3 with SymPy installed (e.g. python, python3, or full venv path).")
      .addText((txt) =>
        txt
          .setPlaceholder("python")
          .setValue(this.plugin.settings.pythonExecutable)
          .onChange(async (v) => {
            this.plugin.settings.pythonExecutable = v.trim() || "python";
            await this.plugin.saveSettings();
          })
      )
      .addButton((btn) =>
        btn.setButtonText("Test SymPy").onClick(async () => {
          const engines = await this.plugin.ensureEngines();
          const st = await engines.checkSymPyStatus(this.plugin.settings.pythonExecutable);
          if (st.available) {
            new Notice(`SymPy ${st.sympyVersion} ready (Python ${st.pythonVersion}).`);
          } else {
            new Notice(`SymPy unavailable: ${st.error}`);
          }
        })
      );

    new Setting(containerEl)
      .setName("EEE imaginary unit notation")
      .setDesc("Choose j (electrical engineering standard) or i (mathematics standard).")
      .addDropdown((d) =>
        d
          .addOption("j", "j (EEE standard)")
          .addOption("i", "i (Math standard)")
          .setValue(this.plugin.settings.eeImaginaryUnit)
          .onChange(async (v) => {
            this.plugin.settings.eeImaginaryUnit = v as "j" | "i";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Audio rationale vault folder")
      .setDesc("Folder where recorded voice-note rationales are saved.")
      .addText((txt) =>
        txt
          .setPlaceholder("Attachments/MathAudio")
          .setValue(this.plugin.settings.audioNoteFolder)
          .onChange(async (v) => {
            this.plugin.settings.audioNoteFolder = v.trim() || "Attachments/MathAudio";
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
