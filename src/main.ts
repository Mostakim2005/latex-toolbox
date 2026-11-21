import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import type { MathfieldElement } from "mathlive";
import { DEFAULT_SETTINGS, getMergedLibrary, safeSaveSettings } from "./settings";
import type { CASOperation, CASResult, DerivationLine, FormulaEntry, LaTeXSettings, RationaleType } from "./types";
import { normalizeDelimiters, wrapMath } from "./core/delimiters";
import {
  casDifferentiate,
  casExpand,
  casFactor,
  casIntegrate,
  casSimplify,
  casSolve,
  detectPrimaryVariable,
  runCASOperation,
} from "./core/cas-engine";
import { checkSymPyStatus } from "./core/sympy-bridge";
import { balanceChemicalEquation } from "./core/chem-engine";
import { detectStemDomain, getNaturalSuggestions, naturalLanguageToLatex } from "./core/natural-language";
import {
  exportDerivationToInteractiveBlock,
  exportDerivationToPureLatex,
  hasRichRationales,
  registerDerivationBlockProcessor,
} from "./core/derivation-renderer";
import { evaluateFormulaEntry, searchFormulaDatabase } from "./core/formula-db";
import { detectCompanionLatexPlugins, isCursorInMathZone } from "./core/editor-interop";
import { mountMathLiveField, stripMathLivePlaceholders, templateToMathLivePlaceholders } from "./ui/mathlive-field";
import { applyMathLiveKeyboardConfig } from "./ui/stem-keyboards";
import {
  createCalculatorState,
  renderScientificCalculatorView,
  ScientificCalculatorModal,
} from "./ui/scientific-calculator-modal";
import { normalizeChemicalFormulaInput, TAXONOMY } from "./taxonomy";

function makeLineId(): string {
  return `line_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type BuilderTab = "builder" | "formulas" | "calculator";

class MathLiveBuilderModal extends Modal {
  private lines: DerivationLine[] = [];
  private activeLineIdx = 0;
  private activeTab: BuilderTab = "builder";
  private fieldRefs: MathfieldElement[] = [];
  private linesContainer!: HTMLElement;
  private varInput!: HTMLInputElement;
  private casPreviewEl!: HTMLElement;
  private builderPaneEl!: HTMLElement;
  private formulaPaneEl!: HTMLElement;
  private calcPaneEl!: HTMLElement;
  private tabButtons = new Map<BuilderTab, HTMLButtonElement>();
  private calcState = createCalculatorState();
  private selectedCalcFormula: FormulaEntry | null = null;
  private lastCasResult: { label: string; res: CASResult } | null = null;

  constructor(
    app: App,
    private plugin: LatexToolboxPlugin,
    private editor: Editor | null,
    initialText = ""
  ) {
    super(app);
    const initialLines = initialText
      ? initialText.split(/\s*\\\\\s*/).filter(Boolean)
      : [""];
    this.lines = initialLines.map((l) => ({ id: makeLineId(), latex: l.trim() }));
    if (this.lines.length === 0) this.lines.push({ id: makeLineId(), latex: "" });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    // Apply wide, non-cramped sizing directly on modalEl so nothing clips horizontally
    this.modalEl.addClass("lt-builder-modal-shell");
    contentEl.addClass("lt-modal");
    applyMathLiveKeyboardConfig(this.plugin.settings);

    // Prevent accidental closing when clicking outside modal unless enabled in Settings
    if (!this.plugin.settings.closeOnBackdropClick) {
      const bg = this.containerEl.querySelector(".modal-bg");
      if (bg instanceof HTMLElement) {
        const blockClose = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        bg.addEventListener("click", blockClose, true);
        bg.addEventListener("mousedown", blockClose, true);
        bg.addEventListener("pointerdown", blockClose, true);
      }
    }

    // Header + instant tab switcher (Builder & CAS | Formula DB | Scientific Calculator)
    const header = contentEl.createDiv({ cls: "lt-cas-header" });
    header.createEl("h2", { text: "STEM LaTeX builder v5.5 (MathLive + Full CAS)" });

    const navTabs = header.createDiv({ cls: "lt-modal-nav-tabs" });
    const tabDefs: Array<[BuilderTab, string]> = [
      ["builder", "Builder & CAS"],
      ["formulas", "Formula database (calculable)"],
      ["calculator", "Scientific calculator"],
    ];
    for (const [id, label] of tabDefs) {
      const btn = navTabs.createEl("button", { text: label });
      btn.onclick = () => this.switchTab(id);
      this.tabButtons.set(id, btn);
    }

    // Pane 1: Builder & CAS
    this.builderPaneEl = contentEl.createDiv({ cls: "lt-tab-pane" });
    this.renderNaturalLanguageBar(this.builderPaneEl);
    this.linesContainer = this.builderPaneEl.createDiv({ cls: "lt-derivation-lines" });
    this.renderDerivationLines();

    const lineControls = this.builderPaneEl.createDiv({ cls: "lt-cas-toolbar" });
    lineControls.createEl("button", { text: "+ Add line" }).onclick = () => {
      this.addLineAfter(this.activeLineIdx, "");
    };
    const lineNumBtn = lineControls.createEl("button", {
      text: this.plugin.settings.enableLineNumbering ? "Line numbers: ON" : "Line numbers: OFF",
    });
    lineNumBtn.onclick = async () => {
      this.plugin.settings.enableLineNumbering = !this.plugin.settings.enableLineNumbering;
      await this.plugin.saveSettings();
      lineNumBtn.setText(this.plugin.settings.enableLineNumbering ? "Line numbers: ON" : "Line numbers: OFF");
      this.renderDerivationLines();
    };

    if (this.plugin.settings.enableLocalCAS) {
      this.renderCASToolbar(this.builderPaneEl);
    }

    // Pane 2: Calculable Formula Database
    this.formulaPaneEl = contentEl.createDiv({ cls: "lt-tab-pane lt-hidden" });
    this.renderFormulaBrowser(this.formulaPaneEl);

    // Pane 3: Embedded Scientific Calculator
    this.calcPaneEl = contentEl.createDiv({ cls: "lt-tab-pane lt-hidden" });
    renderScientificCalculatorView(this.calcPaneEl, this.calcState, this.plugin.settings.eeImaginaryUnit, {
      onInsertLatex: (ltx) => {
        this.insertIntoActiveLine(ltx);
        this.switchTab("builder");
      },
      onSendToBuilder: (ltx) => {
        this.insertIntoActiveLine(ltx);
        this.switchTab("builder");
      },
    });

    // Footer Insert Actions
    const actions = contentEl.createDiv({ cls: "modal-button-container" });
    const insertLatexBtn = actions.createEl("button", { text: "Insert pure LaTeX", cls: "mod-cta" });
    insertLatexBtn.onclick = () => {
      const pure = exportDerivationToPureLatex(
        this.lines.map((l) => ({ ...l, latex: stripMathLivePlaceholders(l.latex) })),
        this.plugin.settings.enableLineNumbering && this.lines.length > 1
      );
      this.commitToEditor(pure, false);
    };

    const insertRichBtn = actions.createEl("button", { text: "Insert interactive derivation" });
    insertRichBtn.onclick = () => {
      const cleanedLines = this.lines.map((l) => ({ ...l, latex: stripMathLivePlaceholders(l.latex) }));
      const block = exportDerivationToInteractiveBlock(cleanedLines, this.plugin.settings.enableLineNumbering);
      this.commitToEditor(block, true);
    };

    actions.createEl("button", { text: "Cancel" }).onclick = () => this.close();
    this.switchTab("builder");
  }

  private switchTab(tab: BuilderTab): void {
    this.activeTab = tab;
    this.builderPaneEl.toggleClass("lt-hidden", tab !== "builder");
    this.formulaPaneEl.toggleClass("lt-hidden", tab !== "formulas");
    this.calcPaneEl.toggleClass("lt-hidden", tab !== "calculator");
    for (const [id, btn] of this.tabButtons.entries()) {
      btn.toggleClass("lt-calc-tab-active", id === tab);
    }
  }

  private renderNaturalLanguageBar(parent: HTMLElement): void {
    const bar = parent.createDiv({ cls: "lt-nl-bar" });
    const nlInput = bar.createEl("input", {
      type: "text",
      placeholder: "Natural typing: integrate sin(x) from 0 to pi | H2SO4 + NaOH -> Na2SO4 + H2O | [1 2; 3 4] | laplace(e^(-a*t))",
      cls: "lt-nl-input",
    });
    const domainBadge = bar.createSpan({ text: "MATH", cls: "lt-nl-badge" });
    const convertBtn = bar.createEl("button", { text: "Convert" });
    const suggWrap = parent.createDiv({ cls: "lt-nl-suggestions" });

    const refreshSuggestions = () => {
      const dom = detectStemDomain(nlInput.value);
      domainBadge.setText(dom.toUpperCase());
      suggWrap.empty();
      const items = getNaturalSuggestions(nlInput.value, 5);
      for (const item of items) {
        const chip = suggWrap.createEl("button", {
          text: `${item.label} (${item.domain.toUpperCase()})`,
          cls: "lt-nl-chip",
        });
        chip.title = item.description;
        chip.onclick = () => {
          this.insertIntoActiveLine(item.latex);
        };
      }
    };

    const runConvert = () => {
      const parsed = naturalLanguageToLatex(nlInput.value, this.plugin.settings.eeImaginaryUnit);
      if (!parsed.latex) return;
      this.insertIntoActiveLine(parsed.latex);
      new Notice(parsed.note);
      nlInput.value = "";
      refreshSuggestions();
    };

    nlInput.addEventListener("input", refreshSuggestions);
    nlInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        runConvert();
      }
    });
    convertBtn.onclick = runConvert;
    refreshSuggestions();
  }

  private renderDerivationLines(): void {
    this.linesContainer.empty();
    this.fieldRefs = [];
    const showNums = this.plugin.settings.enableLineNumbering;

    this.lines.forEach((line, idx) => {
      const row = this.linesContainer.createDiv({
        cls: `lt-derivation-row${showNums ? "" : " lt-no-line-numbers"}${idx === this.activeLineIdx ? " lt-row-active" : ""}`,
      });

      if (showNums) {
        row.createSpan({ text: `${idx + 1}.`, cls: "lt-line-num" });
      }

      const fieldHost = row.createDiv({ cls: "lt-mathlive-host" });
      const mf = mountMathLiveField(fieldHost, {
        initialLatex: line.latex,
        enableSlotHighlighting: this.plugin.settings.enableSlotHighlighting,
        autoResize: this.plugin.settings.autoResizeEditor,
        settings: this.plugin.settings,
        onChange: (clean) => {
          line.latex = clean;
          if (idx === this.activeLineIdx && this.varInput) {
            this.varInput.value = detectPrimaryVariable(clean);
          }
        },
        onEnter: () => this.addLineAfter(idx, ""),
        onBackspaceEmpty: () => {
          if (this.lines.length > 1) this.removeLine(idx);
        },
      });
      mf.addEventListener("focus", () => {
        this.activeLineIdx = idx;
        if (this.varInput) this.varInput.value = detectPrimaryVariable(line.latex);
      });
      this.fieldRefs.push(mf);

      // Per-line Rationale Box (text / audio / link / app)
      const ratBox = row.createDiv({ cls: "lt-rationale-box" });
      const ratControls = ratBox.createDiv({ cls: "lt-rationale-controls" });
      const typeSel = ratControls.createEl("select", { cls: "dropdown lt-rationale-type" });
      const types: Array<[RationaleType, string]> = [
        ["text", "Text"],
        ["audio", "Audio"],
        ["link", "Web link"],
        ["app", "App URI"],
      ];
      for (const [val, lbl] of types) {
        typeSel.createEl("option", { value: val, text: lbl });
      }
      typeSel.value = line.rationale?.type ?? "text";

      const valInput = ratControls.createEl("input", {
        type: "text",
        cls: "lt-rationale-input",
        value: line.rationale?.value ?? "",
        placeholder: this.getRationalePlaceholder(typeSel.value as RationaleType),
      });

      const labelInput = ratBox.createEl("input", {
        type: "text",
        cls: "lt-rationale-input",
        value: line.rationale?.label ?? "",
        placeholder: "Optional display label (for link/app/audio)",
      });
      labelInput.toggleClass("lt-hidden", typeSel.value === "text");

      const helperBar = ratBox.createDiv({ cls: "lt-rationale-controls" });
      const renderRationaleHelpers = () => {
        helperBar.empty();
        const curType = typeSel.value as RationaleType;
        labelInput.toggleClass("lt-hidden", curType === "text");
        valInput.placeholder = this.getRationalePlaceholder(curType);

        if (curType === "app") {
          const schemeSel = helperBar.createEl("select", { cls: "dropdown" });
          schemeSel.createEl("option", { value: "", text: "Preset app..." });
          for (const [appName, uri] of Object.entries(this.plugin.settings.externalAppSchemes ?? {})) {
            schemeSel.createEl("option", { value: uri, text: appName });
          }
          schemeSel.onchange = () => {
            if (!schemeSel.value) return;
            valInput.value = schemeSel.value;
            if (!labelInput.value) labelInput.value = schemeSel.options[schemeSel.selectedIndex]?.text ?? "";
            syncRationale();
          };
        } else if (curType === "audio") {
          const recBtn = helperBar.createEl("button", { text: "Record voice note" });
          let recorder: MediaRecorder | null = null;
          let chunks: BlobPart[] = [];
          recBtn.onclick = async () => {
            if (recorder && recorder.state === "recording") {
              recorder.stop();
              recBtn.setText("Record voice note");
              return;
            }
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              recorder = new MediaRecorder(stream);
              chunks = [];
              recorder.ondataavailable = (ev) => {
                if (ev.data.size > 0) chunks.push(ev.data);
              };
              recorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunks, { type: "audio/webm" });
                const buf = await blob.arrayBuffer();
                const folder = this.plugin.settings.audioNoteFolder || "Attachments/MathAudio";
                if (!(await this.app.vault.adapter.exists(folder))) {
                  await this.app.vault.adapter.mkdir(folder);
                }
                const path = `${folder}/rationale-${Date.now()}.webm`;
                await this.app.vault.createBinary(path, buf);
                valInput.value = path;
                if (!labelInput.value) labelInput.value = `Voice note (line ${idx + 1})`;
                syncRationale();
                new Notice(`Saved audio rationale to ${path}`);
              };
              recorder.start();
              recBtn.setText("Stop recording");
            } catch (e) {
              new Notice(`Microphone error: ${String(e)}`);
            }
          };
        }
      };

      const syncRationale = () => {
        const v = valInput.value.trim();
        const t = typeSel.value as RationaleType;
        const lbl = labelInput.value.trim();
        line.rationale = v ? { type: t, value: v, label: lbl || (t === "text" ? v : "") } : undefined;
      };

      typeSel.onchange = () => {
        renderRationaleHelpers();
        syncRationale();
      };
      valInput.addEventListener("input", syncRationale);
      labelInput.addEventListener("input", syncRationale);
      renderRationaleHelpers();

      const rowBtns = row.createDiv({ cls: "lt-row-actions" });
      rowBtns.createEl("button", { text: "+" }).onclick = () => this.addLineAfter(idx, "");
      if (this.lines.length > 1) {
        rowBtns.createEl("button", { text: "✕" }).onclick = () => this.removeLine(idx);
      }
    });
  }

  private getRationalePlaceholder(type: RationaleType): string {
    if (type === "audio") return "Vault audio path (e.g. Attachments/MathAudio/note.webm)";
    if (type === "link") return "https://en.wikipedia.org/wiki/...";
    if (type === "app") return "obsidian://open?file=... or matlab://...";
    return "Rationale (e.g. By KVL, Integration by parts)";
  }

  private renderCASToolbar(parent: HTMLElement): void {
    const sec = parent.createDiv({ cls: "lt-cas-section" });
    const head = sec.createDiv({ cls: "lt-cas-header" });
    head.createSpan({
      text: `Full CAS (${this.plugin.settings.casBackend === "hybrid-python" ? "JS + Python SymPy" : "Local JS"})`,
    });

    const varWrap = head.createDiv({ cls: "lt-cas-var-wrap" });
    varWrap.createSpan({ text: "Var:" });
    this.varInput = varWrap.createEl("input", {
      type: "text",
      value: detectPrimaryVariable(this.lines[this.activeLineIdx]?.latex ?? ""),
      cls: "lt-cas-var-input",
    });
    const lowerIn = varWrap.createEl("input", { type: "text", placeholder: "a=0", cls: "lt-cas-var-input" });
    const upperIn = varWrap.createEl("input", { type: "text", placeholder: "b=1", cls: "lt-cas-var-input" });

    const btnBar = sec.createDiv({ cls: "lt-cas-toolbar" });
    const ops: Array<[string, CASOperation]> = [
      ["Simplify", "simplify"],
      ["Expand", "expand"],
      ["Factor", "factor"],
      ["Solve", "solve"],
      ["d/dv", "diff"],
      ["∫ dv", "integrate"],
      ["Def ∫", "defint"],
      ["Limit", "limit"],
      ["PartFrac", "apart"],
      ["Numeric", "numeric"],
      ["Phasor ∠", "phasor"],
      ["Units", "units"],
      ["Det(M)", "matrix_det"],
      ["Inv(M)", "matrix_inv"],
      ["Laplace", "laplace"],
      ["InvLaplace", "ilaplace"],
      ["Fourier", "fourier"],
      ["ODE", "dsolve"],
      ["Series", "series"],
    ];

    for (const [label, op] of ops) {
      btnBar.createEl("button", { text: label }).onclick = async () => {
        const activeLatex = stripMathLivePlaceholders(this.lines[this.activeLineIdx]?.latex ?? "");
        if (!activeLatex) return;
        const variable = this.varInput.value.trim() || detectPrimaryVariable(activeLatex);
        const res = await runCASOperation(op, activeLatex, {
          variable,
          lower: lowerIn.value.trim() || "0",
          upper: upperIn.value.trim() || "1",
          point: lowerIn.value.trim() || "0",
          backend: this.plugin.settings.casBackend,
          pythonExecutable: this.plugin.settings.pythonExecutable,
          imagUnit: this.plugin.settings.eeImaginaryUnit,
        });
        this.showCasPreview(`${label} (${variable})`, res);
      };
    }

    btnBar.createEl("button", { text: "Balance chem" }).onclick = () => {
      const activeLatex = stripMathLivePlaceholders(this.lines[this.activeLineIdx]?.latex ?? "");
      const bal = balanceChemicalEquation(activeLatex);
      this.showCasPreview("Balance chemistry", {
        ok: bal.ok,
        latex: bal.latex,
        engine: "Nullspace Stoichiometry",
        error: bal.error,
      });
    };

    this.casPreviewEl = sec.createDiv({ cls: "lt-cas-output" });
  }

  private showCasPreview(label: string, res: CASResult): void {
    this.casPreviewEl.empty();
    this.lastCasResult = { label, res };

    if (!res.ok) {
      this.casPreviewEl.createSpan({ text: `${label} error: ${res.error}`, cls: "lt-cas-error" });
      return;
    }

    const box = this.casPreviewEl.createDiv({ cls: "lt-cas-preview" });
    box.createSpan({
      text: `${label} [${res.engine ?? "CAS"}]: ${res.latex}${res.numeric ? `  (≈ ${res.numeric})` : ""}`,
      cls: "lt-cas-preview-expr",
    });

    const act = box.createDiv({ cls: "lt-cas-preview-actions" });
    act.createEl("button", { text: "Replace line" }).onclick = () => {
      this.insertIntoActiveLine(res.latex, true);
    };
    act.createEl("button", { text: "Append next line", cls: "mod-cta" }).onclick = () => {
      this.addLineAfter(this.activeLineIdx, res.latex, {
        type: "text",
        label: label,
        value: label,
      });
    };
  }

  private renderFormulaBrowser(container: HTMLElement): void {
    container.empty();
    const filters = container.createDiv({ cls: "lt-formula-filters" });
    const searchIn = filters.createEl("input", {
      type: "text",
      placeholder: "Search O-Level / A-Level / IB Physics, Chemistry, Math & basic EEE formulas...",
      cls: "lt-nl-input",
    });

    const branchSel = filters.createEl("select", { cls: "dropdown" });
    const branches = [
      ["all", "All subjects"],
      ["physics", "Physics (O/A-Level & IB)"],
      ["chemistry", "Chemistry (O/A-Level & IB)"],
      ["math", "Mathematics (O/A-Level & IB)"],
      ["eee", "Electrical engineering (basics)"],
    ];
    for (const [val, lbl] of branches) branchSel.createEl("option", { value: val, text: lbl });

    const levelSel = filters.createEl("select", { cls: "dropdown" });
    const levels = [
      ["all", "All levels"],
      ["o-level", "O-Level / IGCSE"],
      ["a-level-ib", "A-Level / IB"],
      ["eee-basics", "EEE basics (all branches)"],
    ];
    for (const [val, lbl] of levels) levelSel.createEl("option", { value: val, text: lbl });

    // Inline Formula Calculator Panel (shown when user clicks "Calculate" on any formula card)
    const calcDrawer = container.createDiv({ cls: "lt-formula-calc-drawer lt-hidden" });
    const renderCalcDrawer = (entry: FormulaEntry | null) => {
      calcDrawer.empty();
      if (!entry) {
        calcDrawer.addClass("lt-hidden");
        return;
      }
      calcDrawer.removeClass("lt-hidden");
      const top = calcDrawer.createDiv({ cls: "lt-cas-header" });
      top.createEl("strong", { text: `Calculate: ${entry.name}` });
      top.createEl("button", { text: "Close" }).onclick = () => renderCalcDrawer(null);

      calcDrawer.createDiv({ text: entry.definition, cls: "lt-formula-meta" });

      const inputsGrid = calcDrawer.createDiv({ cls: "lt-formula-calc-grid" });
      const varInputs = new Map<string, HTMLInputElement>();
      for (const v of entry.variables) {
        const cell = inputsGrid.createDiv({ cls: "lt-formula-calc-cell" });
        cell.createEl("label", {
          text: `${v.meaning} (${v.key})${v.unit ? ` [${v.unit}]` : ""}`,
        });
        const inp = cell.createEl("input", {
          type: "number",
          value: v.defaultValue !== undefined ? String(v.defaultValue) : "1",
        });
        inp.step = "any";
        varInputs.set(v.key, inp);
      }

      const outBox = calcDrawer.createDiv({ cls: "lt-cas-preview" });
      const outText = outBox.createSpan({ cls: "lt-cas-preview-expr", text: "Click Compute to evaluate." });
      const outBtns = outBox.createDiv({ cls: "lt-cas-preview-actions" });

      let latestLatex = entry.latex;
      const compute = () => {
        const vals: Record<string, number> = {};
        for (const [k, inp] of varInputs.entries()) {
          vals[k] = parseFloat(inp.value);
        }
        const res = evaluateFormulaEntry(entry, vals);
        if (!res.ok) {
          outText.setText(res.error ?? "Calculation failed.");
          return;
        }
        latestLatex = `${stripMathLivePlaceholders(templateToMathLivePlaceholders(entry.latex))} \\implies ${res.latexResult}`;
        outText.setText(`${entry.outputSymbol} = ${res.formatted}${entry.outputUnit ? ` ${entry.outputUnit}` : ""}`);
      };

      outBtns.createEl("button", { text: "Compute", cls: "mod-cta" }).onclick = compute;
      outBtns.createEl("button", { text: "Insert result into builder" }).onclick = () => {
        compute();
        this.insertIntoActiveLine(latestLatex, true);
        this.switchTab("builder");
      };
      compute();
    };

    const listEl = container.createDiv({ cls: "lt-formula-list lt-formula-list-tall" });
    const refresh = () => {
      listEl.empty();
      const results = searchFormulaDatabase({
        query: searchIn.value,
        branch: branchSel.value,
        level: levelSel.value,
      });
      for (const item of results) {
        const card = listEl.createDiv({ cls: "lt-formula-card" });
        card.createDiv({ text: item.name, cls: "lt-formula-title" });
        card.createDiv({ text: `${item.branch.toUpperCase()} • ${item.topic} • ${item.level}`, cls: "lt-formula-meta" });
        card.createDiv({ text: item.definition, cls: "lt-formula-def" });

        const cardActions = card.createDiv({ cls: "lt-cas-preview-actions" });
        const insBtn = cardActions.createEl("button", { text: "Insert template" });
        insBtn.onclick = (ev) => {
          ev.stopPropagation();
          const withSlots = templateToMathLivePlaceholders(item.latex);
          this.insertIntoActiveLine(withSlots, true);
          this.switchTab("builder");
          new Notice(`Inserted: ${item.name}`);
        };
        const calcBtn = cardActions.createEl("button", { text: "Calculate", cls: "mod-cta" });
        calcBtn.onclick = (ev) => {
          ev.stopPropagation();
          this.selectedCalcFormula = item;
          renderCalcDrawer(item);
        };
      }
    };

    searchIn.addEventListener("input", refresh);
    branchSel.onchange = refresh;
    levelSel.onchange = refresh;
    refresh();
  }

  private insertIntoActiveLine(latex: string, replaceAll = false): void {
    const line = this.lines[this.activeLineIdx];
    const mf = this.fieldRefs[this.activeLineIdx];
    if (!line || !mf) return;
    if (replaceAll || !line.latex.trim()) {
      mf.value = latex;
      line.latex = stripMathLivePlaceholders(latex);
    } else {
      mf.insert(latex);
      line.latex = stripMathLivePlaceholders(mf.value);
    }
    mf.focus();
  }

  private addLineAfter(idx: number, latex: string, rationale?: DerivationLine["rationale"]): void {
    this.lines.splice(idx + 1, 0, { id: makeLineId(), latex, rationale });
    this.activeLineIdx = idx + 1;
    this.renderDerivationLines();
    this.fieldRefs[this.activeLineIdx]?.focus();
  }

  private removeLine(idx: number): void {
    if (this.lines.length <= 1) return;
    this.lines.splice(idx, 1);
    this.activeLineIdx = Math.max(0, idx - 1);
    this.renderDerivationLines();
    this.fieldRefs[this.activeLineIdx]?.focus();
  }

  private commitToEditor(output: string, isRawBlock: boolean): void {
    if (!output.trim()) {
      this.close();
      return;
    }
    const useInteractive = isRawBlock || hasRichRationales(this.lines);
    const finalOutput = useInteractive && !isRawBlock
      ? exportDerivationToInteractiveBlock(
          this.lines.map((l) => ({ ...l, latex: stripMathLivePlaceholders(l.latex) })),
          this.plugin.settings.enableLineNumbering
        )
      : output;

    if (this.editor) {
      if (useInteractive) {
        this.editor.replaceSelection(`\n${finalOutput}\n`);
      } else {
        const zone = isCursorInMathZone(this.editor);
        this.editor.replaceSelection(zone.inMath ? finalOutput : wrapMath(finalOutput, this.plugin.settings.wrapStyle));
      }
    } else {
      void navigator.clipboard?.writeText(finalOutput);
      new Notice("Copied output to clipboard.");
    }
    this.close();
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
    registerDerivationBlockProcessor(this);

    const companions = detectCompanionLatexPlugins(this.app);
    this.api = {
      version: "5.5.0",
      normalizeDelimiters,
      normalizeChemicalFormulaInput,
      balanceChemicalEquation,
      naturalLanguageToLatex,
      searchFormulaDatabase,
      evaluateFormulaEntry,
      casSimplify,
      casExpand,
      casFactor,
      casSolve,
      casDifferentiate,
      casIntegrate,
      runCASOperation,
      getTaxonomy: () => TAXONOMY,
      getMergedLibrary: () => getMergedLibrary(this.settings),
      companions,
      openBuilder: (initialText?: string) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const editor = view ? view.editor : null;
        const text = initialText ?? (editor ? editor.getSelection() : "");
        new MathLiveBuilderModal(this.app, this, editor, text).open();
      },
      openCalculator: () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        const editor = view ? view.editor : null;
        new ScientificCalculatorModal(
          this.app,
          this.settings.eeImaginaryUnit,
          {
            onInsertLatex: (ltx) => {
              if (editor) editor.replaceSelection(wrapMath(ltx, this.settings.wrapStyle));
              else void navigator.clipboard?.writeText(ltx);
            },
            onSendToBuilder: (ltx) => (this.api.openBuilder as (t?: string) => void)(ltx),
          },
          this.settings.closeOnBackdropClick
        ).open();
      },
    };
    (window as unknown as Record<string, unknown>).LatexToolboxAPI = this.api;

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

    this.addRibbonIcon("calculator", "STEM LaTeX builder", () => (this.api.openBuilder as () => void)());
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
    applyMathLiveKeyboardConfig(this.settings);
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
          const st = await checkSymPyStatus(this.plugin.settings.pythonExecutable);
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
