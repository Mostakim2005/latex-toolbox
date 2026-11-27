import { App, Component, Editor, MarkdownRenderer, Modal, Notice } from "obsidian";
import type { MathfieldElement } from "mathlive";
import type { LtEnginesModule } from "../chunks/engines";
import type { FormulaSortMode, FormulaVisualShape } from "../core/formula-db";
import type { CASOperation, CASResult, DerivationLine, FormulaEntry, LaTeXSettings, RationaleType } from "../types";
import { wrapMath } from "../core/delimiters";
import { exportDerivationToInteractiveBlock, exportDerivationToPureLatex, hasRichRationales } from "../core/derivation-renderer";
import { isCursorInMathZone } from "../core/editor-interop";
import { mountMathLiveField, stripMathLivePlaceholders, templateToMathLivePlaceholders } from "./mathlive-field";
import { applyMathLiveKeyboardConfig } from "./stem-keyboards";
import { createCalculatorState, renderScientificCalculatorView } from "./scientific-calculator-modal";

export interface BuilderPluginHost {
  settings: LaTeXSettings;
  saveSettings: () => Promise<void>;
  ensureEngines: () => Promise<LtEnginesModule>;
  ensureSnippetsLoaded: () => Promise<void>;
}

function makeLineId(): string {
  return `line_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function detectPrimaryVariableLocal(latex: string): string {
  const cleaned = (latex || "")
    .replace(/\\(?:sin|cos|tan|cot|sec|csc|log|ln|exp|sqrt|frac|left|right|text|operatorname|cdot|times|pi|infty|int|sum|prod|lim|partial|mathrm|mathbf|ce)\b/g, " ")
    .replace(/\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|omega|phi|psi|sigma|tau)\b/g, (m) => ` ${m.slice(1)} `);

  const diffMatch = cleaned.match(/\bd([a-zA-Z])\b/);
  if (diffMatch?.[1] && !["e", "i", "j"].includes(diffMatch[1])) {
    return diffMatch[1];
  }

  const preferredOrder = ["x", "t", "s", "y", "z", "u", "v", "n", "k", "theta", "omega"];
  const tokens = cleaned.match(/\b[a-zA-Z]+\b/g) ?? [];
  const tokenSet = new Set(tokens);
  for (const v of preferredOrder) {
    if (tokenSet.has(v)) return v;
  }
  for (const tok of tokens) {
    if (tok.length === 1 && !["e", "i", "j", "d"].includes(tok)) return tok;
  }
  return "x";
}

type BuilderTab = "builder" | "formulas" | "calculator";

export class MathLiveBuilderModal extends Modal {
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
  private formulasRendered = false;
  private calculatorRendered = false;
  private previewComp = new Component();

  constructor(
    app: App,
    private plugin: BuilderPluginHost,
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
    this.modalEl.addClass("lt-builder-modal-shell");
    this.modalEl.toggleClass("lt-no-glass", this.plugin.settings.glassmorphism === false);
    contentEl.addClass("lt-modal");
    applyMathLiveKeyboardConfig(this.plugin.settings);

    // Pre-warm engines and external snippet sidecar in parallel while builder UI settles
    void this.plugin.ensureEngines();
    void this.plugin.ensureSnippetsLoaded();

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
      btn.onclick = () => void this.switchTab(id);
      this.tabButtons.set(id, btn);
    }

    // Pane 1: Builder & CAS (rendered immediately)
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

    // Pane 2 & 3: Created empty and hydrated lazily when their tab is opened
    this.formulaPaneEl = contentEl.createDiv({ cls: "lt-tab-pane lt-hidden" });
    this.calcPaneEl = contentEl.createDiv({ cls: "lt-tab-pane lt-hidden" });

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
    void this.switchTab("builder");
  }

  private async switchTab(tab: BuilderTab): Promise<void> {
    this.activeTab = tab;
    this.builderPaneEl.toggleClass("lt-hidden", tab !== "builder");
    this.formulaPaneEl.toggleClass("lt-hidden", tab !== "formulas");
    this.calcPaneEl.toggleClass("lt-hidden", tab !== "calculator");
    for (const [id, btn] of this.tabButtons.entries()) {
      btn.toggleClass("lt-calc-tab-active", id === tab);
    }

    if (tab === "formulas" && !this.formulasRendered) {
      this.formulasRendered = true;
      this.formulaPaneEl.empty();
      this.formulaPaneEl.createDiv({ cls: "lt-formula-meta", text: "Loading formula database..." });
      const [engines] = await Promise.all([
        this.plugin.ensureEngines(),
        this.plugin.ensureSnippetsLoaded(),
      ]);
      this.renderFormulaBrowser(this.formulaPaneEl, engines);
    } else if (tab === "calculator" && !this.calculatorRendered) {
      this.calculatorRendered = true;
      this.calcPaneEl.empty();
      this.calcPaneEl.createDiv({ cls: "lt-formula-meta", text: "Loading calculator engine..." });
      const engines = await this.plugin.ensureEngines();
      this.calcPaneEl.empty();
      renderScientificCalculatorView(
        this.calcPaneEl,
        this.calcState,
        this.plugin.settings.eeImaginaryUnit,
        {
          onInsertLatex: (ltx) => {
            this.insertIntoActiveLine(ltx);
            void this.switchTab("builder");
          },
          onSendToBuilder: (ltx) => {
            this.insertIntoActiveLine(ltx);
            void this.switchTab("builder");
          },
        },
        undefined,
        { casPhasorConvert: engines.casPhasorConvert, getMathJs: engines.getMathJs }
      );
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

    const refreshSuggestions = async () => {
      const engines = await this.plugin.ensureEngines();
      const dom = engines.detectStemDomain(nlInput.value);
      domainBadge.setText(dom.toUpperCase());
      suggWrap.empty();
      const items = engines.getNaturalSuggestions(nlInput.value, 5);
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

    const runConvert = async () => {
      const engines = await this.plugin.ensureEngines();
      const parsed = engines.naturalLanguageToLatex(nlInput.value, this.plugin.settings.eeImaginaryUnit);
      if (!parsed.latex) return;
      this.insertIntoActiveLine(parsed.latex);
      new Notice(parsed.note);
      nlInput.value = "";
      void refreshSuggestions();
    };

    nlInput.addEventListener("input", () => void refreshSuggestions());
    nlInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        void runConvert();
      }
    });
    convertBtn.onclick = () => void runConvert();
    void refreshSuggestions();
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
            this.varInput.value = detectPrimaryVariableLocal(clean);
          }
        },
        onEnter: () => this.addLineAfter(idx, ""),
        onBackspaceEmpty: () => {
          if (this.lines.length > 1) this.removeLine(idx);
        },
      });
      mf.addEventListener("focus", () => {
        this.activeLineIdx = idx;
        if (this.varInput) this.varInput.value = detectPrimaryVariableLocal(line.latex);
      });
      this.fieldRefs.push(mf);

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
      value: detectPrimaryVariableLocal(this.lines[this.activeLineIdx]?.latex ?? ""),
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
        const engines = await this.plugin.ensureEngines();
        const variable = this.varInput.value.trim() || engines.detectPrimaryVariable(activeLatex);
        const res = await engines.runCASOperation(op, activeLatex, {
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

    btnBar.createEl("button", { text: "Balance chem" }).onclick = async () => {
      const activeLatex = stripMathLivePlaceholders(this.lines[this.activeLineIdx]?.latex ?? "");
      const engines = await this.plugin.ensureEngines();
      const bal = engines.balanceChemicalEquation(activeLatex);
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

  private renderFormulaBrowser(container: HTMLElement, engines: LtEnginesModule): void {
    container.empty();
    this.previewComp.load();
    const filters = container.createDiv({ cls: "lt-formula-filters" });
    const searchIn = filters.createEl("input", {
      type: "text",
      placeholder: "Search by Wolfram/SymPy (e.g. 1/2*m*v^2, sqrt(L*C), PV=nRT), English, or symbol...",
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

    const sortSel = filters.createEl("select", { cls: "dropdown" });
    const sortModes: Array<[FormulaSortMode, string]> = [
      ["relevance", "Sort: Smart Wolfram/SymPy"],
      ["syllabus", "Sort: Syllabus order"],
      ["topic", "Sort: Topic (A–Z)"],
      ["name", "Sort: Name (A–Z)"],
      ["visual", "Sort: Visual structure"],
    ];
    for (const [val, lbl] of sortModes) sortSel.createEl("option", { value: val, text: lbl });

    let activeShape: FormulaVisualShape = "all";
    const visualBar = container.createDiv({ cls: "lt-formula-visual-bar" });
    const shapeDefs: Array<[FormulaVisualShape, string]> = [
      ["all", "All visuals"],
      ["fraction", "a/b Fractions"],
      ["sqrt", "√ Roots"],
      ["exp-log", "eˣ / log"],
      ["trig", "sin/cos Trig"],
      ["greek", "λ ω θ Greek"],
      ["integral-sum", "∫ / Σ Calculus"],
    ];
    const shapeBtns = new Map<FormulaVisualShape, HTMLButtonElement>();
    for (const [id, lbl] of shapeDefs) {
      const b = visualBar.createEl("button", {
        text: lbl,
        cls: id === "all" ? "lt-nl-chip lt-calc-tab-active" : "lt-nl-chip",
      });
      b.onclick = () => {
        activeShape = id;
        for (const [sid, sbtn] of shapeBtns.entries()) {
          sbtn.toggleClass("lt-calc-tab-active", sid === id);
        }
        refresh();
      };
      shapeBtns.set(id, b);
    }
    const countBadge = visualBar.createSpan({ cls: "lt-formula-count" });

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
        const res = engines.evaluateFormulaEntry(entry, vals);
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
        void this.switchTab("builder");
      };
      compute();
    };

    const listEl = container.createDiv({ cls: "lt-formula-list lt-formula-list-tall" });
    const refresh = () => {
      listEl.empty();
      const results = engines.searchFormulaDatabase({
        query: searchIn.value,
        branch: branchSel.value,
        level: levelSel.value,
        visualShape: activeShape,
        sortBy: sortSel.value as FormulaSortMode,
      });
      let visibleLimit = 48;
      const renderSlice = () => {
        listEl.empty();
        const slice = results.slice(0, visibleLimit);
        countBadge.setText(`Showing ${slice.length} of ${results.length} (${engines.getAllFormulas().length} total)`);
        for (const item of slice) {
          const card = listEl.createDiv({ cls: "lt-formula-card" });
          card.createDiv({ text: item.name, cls: "lt-formula-title" });
          card.createDiv({
            text: `${item.branch.toUpperCase()} • ${item.topic} • ${item.originalLevel || item.level}`,
            cls: "lt-formula-meta",
          });

          const previewEl = card.createDiv({ cls: "lt-formula-preview" });
          const cleanMath = stripMathLivePlaceholders(templateToMathLivePlaceholders(item.latex));
          void MarkdownRenderer.render(this.app, `$${cleanMath}$`, previewEl, "", this.previewComp);

          card.createDiv({ text: item.definition, cls: "lt-formula-def" });

          const cardActions = card.createDiv({ cls: "lt-cas-preview-actions" });
          const insBtn = cardActions.createEl("button", { text: "Insert template" });
          insBtn.onclick = (ev) => {
            ev.stopPropagation();
            const withSlots = templateToMathLivePlaceholders(item.latex);
            this.insertIntoActiveLine(withSlots, true);
            void this.switchTab("builder");
            new Notice(`Inserted: ${item.name}`);
          };
          if (item.variables.length > 0) {
            const calcBtn = cardActions.createEl("button", { text: "Calculate", cls: "mod-cta" });
            calcBtn.onclick = (ev) => {
              ev.stopPropagation();
              this.selectedCalcFormula = item;
              renderCalcDrawer(item);
            };
          }
        }
        if (results.length > visibleLimit) {
          const moreBtn = listEl.createEl("button", {
            text: `Load more (${results.length - visibleLimit} remaining)`,
          });
          moreBtn.onclick = () => {
            visibleLimit += 48;
            renderSlice();
          };
        }
      };
      renderSlice();
    };

    searchIn.addEventListener("input", refresh);
    branchSel.onchange = refresh;
    levelSel.onchange = refresh;
    sortSel.onchange = refresh;
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
    this.previewComp.unload();
    this.contentEl.empty();
  }
}
