import { App, Modal, Notice } from "obsidian";
import * as math from "mathjs";
import { casPhasorConvert } from "../core/cas-engine";

type CalcTab = "scientific" | "eee" | "basen" | "graph";

export interface ScientificCalculatorCallbacks {
  onInsertLatex?: (latex: string) => void;
  onSendToBuilder?: (latex: string) => void;
}

export interface CalculatorState {
  activeTab: CalcTab;
  angleMode: "DEG" | "RAD";
  expr: string;
  lastAns: string;
  history: Array<{ expr: string; result: string }>;
}

export function createCalculatorState(): CalculatorState {
  return {
    activeTab: "scientific",
    angleMode: "DEG",
    expr: "",
    lastAns: "0",
    history: [],
  };
}

/**
 * Renders the full multi-mode Scientific & Engineering Calculator inside any container
 * (used both inside the tabbed STEM Builder and in the standalone Calculator Modal).
 */
export function renderScientificCalculatorView(
  container: HTMLElement,
  state: CalculatorState,
  imagUnit: "j" | "i",
  callbacks: ScientificCalculatorCallbacks = {},
  onAfterAction?: () => void
): void {
  const render = () => {
    container.empty();

    const tabs = container.createDiv({ cls: "lt-calc-tabs" });
    const tabDefs: Array<[CalcTab, string]> = [
      ["scientific", "Scientific"],
      ["eee", "EEE phasors & circuits"],
      ["basen", "Base-N / bitwise"],
      ["graph", "2D function plotter"],
    ];
    for (const [id, label] of tabDefs) {
      const btn = tabs.createEl("button", {
        text: label,
        cls: state.activeTab === id ? "lt-calc-tab-active" : "",
      });
      btn.onclick = () => {
        state.activeTab = id;
        render();
      };
    }

    const body = container.createDiv();
    if (state.activeTab === "scientific") renderScientificTab(body);
    else if (state.activeTab === "eee") renderEEETab(body);
    else if (state.activeTab === "basen") renderBaseNTab(body);
    else renderGraphTab(body);
  };

  const renderScientificTab = (parent: HTMLElement) => {
    const display = parent.createDiv({ cls: "lt-calc-display" });
    const input = display.createEl("input", {
      type: "text",
      value: state.expr,
      placeholder: "e.g. sin(30 deg)^2 + log10(1000) or 5 kOhm * 2 mA to V",
      cls: "lt-calc-input",
    });
    const resultEl = display.createDiv({ cls: "lt-calc-result", text: `= ${state.lastAns}` });

    const modeBar = parent.createDiv({ cls: "lt-cas-toolbar" });
    const angleBtn = modeBar.createEl("button", { text: `Angle: ${state.angleMode}` });
    angleBtn.onclick = () => {
      state.angleMode = state.angleMode === "DEG" ? "RAD" : "DEG";
      angleBtn.setText(`Angle: ${state.angleMode}`);
    };

    const evaluate = () => {
      state.expr = input.value.trim();
      if (!state.expr) return;
      try {
        let evalSrc = state.expr.replace(/\bAns\b/g, `(${state.lastAns})`);
        if (state.angleMode === "DEG") {
          evalSrc = evalSrc.replace(/\b(sin|cos|tan)\(([^)]+)\)/g, "$1(($2) deg)");
        }
        const val: unknown = math.evaluate(evalSrc);
        const formatted = math.format(val, { precision: 10 });
        state.lastAns = formatted;
        resultEl.setText(`= ${formatted}`);
        state.history.unshift({ expr: state.expr, result: formatted });
        if (state.history.length > 8) state.history.pop();
      } catch (e) {
        resultEl.setText(`Error: ${String(e)}`);
      }
    };

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        evaluate();
      }
    });

    const evalBtn = modeBar.createEl("button", { text: "= Evaluate", cls: "mod-cta" });
    evalBtn.onclick = evaluate;

    const sendBtn = modeBar.createEl("button", { text: "Send to builder" });
    sendBtn.onclick = () => {
      callbacks.onSendToBuilder?.(state.lastAns);
      onAfterAction?.();
    };

    const insertBtn = modeBar.createEl("button", { text: "Insert result" });
    insertBtn.onclick = () => {
      callbacks.onInsertLatex?.(state.lastAns);
      onAfterAction?.();
    };

    const keys = [
      "sin(", "cos(", "tan(", "asin(", "acos(", "atan(",
      "log10(", "log(", "exp(", "sqrt(", "^", "!",
      "pi", "e", "i", "(", ")", "Ans",
      "7", "8", "9", "/", " to ", "Clear",
      "4", "5", "6", "*", "det(", "inv(",
      "1", "2", "3", "-", "abs(", "arg(",
      "0", ".", "e-3", "+", "e3", "=",
    ];

    const keypad = parent.createDiv({ cls: "lt-calc-keypad" });
    for (const k of keys) {
      const b = keypad.createEl("button", { text: k });
      b.onclick = () => {
        if (k === "Clear") {
          input.value = "";
          state.expr = "";
          resultEl.setText("= 0");
        } else if (k === "=") {
          evaluate();
        } else {
          input.value += k;
          input.focus();
        }
      };
    }
  };

  const renderEEETab = (parent: HTMLElement) => {
    parent.createEl("p", {
      text: "Quick AC phasor conversion, parallel impedance (Z1 || Z2), and RLC resonance.",
    });

    const phasorRow = parent.createDiv({ cls: "lt-nl-bar" });
    const phasorIn = phasorRow.createEl("input", {
      type: "text",
      placeholder: `Rectangular (3 + 4${imagUnit}) or Polar (5∠53.13)`,
      cls: "lt-nl-input",
    });
    const phasorOut = parent.createDiv({ cls: "lt-cas-output" });
    phasorRow.createEl("button", { text: "Convert phasor", cls: "mod-cta" }).onclick = () => {
      const res = casPhasorConvert(phasorIn.value, imagUnit);
      phasorOut.setText(res.ok ? `Result: ${res.latex}` : `Error: ${res.error}`);
    };

    const parRow = parent.createDiv({ cls: "lt-nl-bar" });
    const z1In = parRow.createEl("input", { type: "text", placeholder: "Z1 (e.g. 100 or 10+5i)" });
    const z2In = parRow.createEl("input", { type: "text", placeholder: "Z2 (e.g. 200 or 20-10i)" });
    const parOut = parent.createDiv({ cls: "lt-cas-output" });
    parRow.createEl("button", { text: "Z1 || Z2" }).onclick = () => {
      try {
        const a = z1In.value.replace(/j/g, "i");
        const b = z2In.value.replace(/j/g, "i");
        const val: unknown = math.evaluate(`((${a}) * (${b})) / ((${a}) + (${b}))`);
        parOut.setText(`Z_eq = ${math.format(val, { precision: 6 })}`);
      } catch (e) {
        parOut.setText(`Error: ${String(e)}`);
      }
    };

    const rlcRow = parent.createDiv({ cls: "lt-nl-bar" });
    const lIn = rlcRow.createEl("input", { type: "text", placeholder: "L in Henry (e.g. 10e-3)" });
    const cIn = rlcRow.createEl("input", { type: "text", placeholder: "C in Farad (e.g. 100e-6)" });
    const rlcOut = parent.createDiv({ cls: "lt-cas-output" });
    rlcRow.createEl("button", { text: "Resonant f₀" }).onclick = () => {
      const L = parseFloat(lIn.value);
      const C = parseFloat(cIn.value);
      if (!Number.isFinite(L) || !Number.isFinite(C) || L <= 0 || C <= 0) {
        rlcOut.setText("Enter positive numeric L and C values.");
        return;
      }
      const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
      const w0 = 2 * Math.PI * f0;
      rlcOut.setText(`f₀ = ${f0.toFixed(4)} Hz   |   ω₀ = ${w0.toFixed(4)} rad/s`);
    };
  };

  const renderBaseNTab = (parent: HTMLElement) => {
    const row = parent.createDiv({ cls: "lt-nl-bar" });
    const decIn = row.createEl("input", {
      type: "text",
      placeholder: "Enter integer (e.g. 255 or 0xFF or 0b1010)",
      cls: "lt-nl-input",
    });
    const out = parent.createDiv({ cls: "lt-calc-display" });
    out.setText("DEC: 0 | HEX: 0x0 | BIN: 0b0 | OCT: 0o0");

    decIn.addEventListener("input", () => {
      const raw = decIn.value.trim();
      if (!raw) return;
      const n = Number(raw);
      if (!Number.isInteger(n)) {
        out.setText("Enter a valid integer (prefix 0x for hex, 0b for binary, 0o for octal).");
        return;
      }
      const u = n >>> 0;
      out.setText(
        `DEC: ${n}  |  HEX: 0x${u.toString(16).toUpperCase()}  |  BIN: 0b${u.toString(2)}  |  OCT: 0o${u.toString(8)}`
      );
    });
  };

  const renderGraphTab = (parent: HTMLElement) => {
    const controls = parent.createDiv({ cls: "lt-nl-bar" });
    const fnIn = controls.createEl("input", {
      type: "text",
      value: "sin(x) * exp(-0.1 * x)",
      placeholder: "f(x) e.g. sin(x) + 0.5*cos(2*x)",
      cls: "lt-nl-input",
    });
    const minIn = controls.createEl("input", { type: "text", value: "-10", cls: "lt-cas-var-input" });
    const maxIn = controls.createEl("input", { type: "text", value: "10", cls: "lt-cas-var-input" });
    const plotBtn = controls.createEl("button", { text: "Plot", cls: "mod-cta" });

    const canvas = parent.createEl("canvas", { cls: "lt-calc-canvas" });
    canvas.width = 680;
    canvas.height = 280;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const xmin = parseFloat(minIn.value) || -10;
      const xmax = parseFloat(maxIn.value) || 10;
      if (xmax <= xmin) {
        new Notice("Maximum x must be greater than minimum x.");
        return;
      }

      let compiled: math.EvalFunction;
      try {
        compiled = math.compile(fnIn.value);
      } catch (e) {
        new Notice(`Invalid function: ${String(e)}`);
        return;
      }

      const samples = 400;
      const pts: Array<{ x: number; y: number }> = [];
      let ymin = Infinity;
      let ymax = -Infinity;
      for (let i = 0; i <= samples; i++) {
        const x = xmin + (i / samples) * (xmax - xmin);
        try {
          const y = Number(compiled.evaluate({ x }));
          if (Number.isFinite(y) && Math.abs(y) < 1e6) {
            pts.push({ x, y });
            if (y < ymin) ymin = y;
            if (y > ymax) ymax = y;
          } else {
            pts.push({ x, y: NaN });
          }
        } catch {
          pts.push({ x, y: NaN });
        }
      }
      if (!Number.isFinite(ymin) || !Number.isFinite(ymax) || ymin === ymax) {
        ymin = -5;
        ymax = 5;
      }
      const pad = (ymax - ymin) * 0.12;
      ymin -= pad;
      ymax += pad;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const toPx = (x: number) => ((x - xmin) / (xmax - xmin)) * W;
      const toPy = (y: number) => H - ((y - ymin) / (ymax - ymin)) * H;

      ctx.strokeStyle = "rgba(128,128,128,0.25)";
      ctx.lineWidth = 1;
      for (let g = 1; g < 10; g++) {
        ctx.beginPath();
        ctx.moveTo((W * g) / 10, 0);
        ctx.lineTo((W * g) / 10, H);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, (H * g) / 10);
        ctx.lineTo(W, (H * g) / 10);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(160,160,160,0.7)";
      ctx.lineWidth = 1.5;
      if (xmin <= 0 && xmax >= 0) {
        const x0 = toPx(0);
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, H);
        ctx.stroke();
      }
      if (ymin <= 0 && ymax >= 0) {
        const y0 = toPy(0);
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(W, y0);
        ctx.stroke();
      }

      ctx.strokeStyle = "#14b8a6";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      let started = false;
      for (const p of pts) {
        if (!Number.isFinite(p.y)) {
          started = false;
          continue;
        }
        const px = toPx(p.x);
        const py = toPy(p.y);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    };

    plotBtn.onclick = draw;
    draw();
  };

  render();
}

export class ScientificCalculatorModal extends Modal {
  private state: CalculatorState = createCalculatorState();

  constructor(
    app: App,
    private imagUnit: "j" | "i" = "j",
    private callbacks: ScientificCalculatorCallbacks = {},
    private closeOnBackdropClick = false
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("lt-calc-modal-shell");
    contentEl.addClass("lt-calc-modal");

    if (!this.closeOnBackdropClick) {
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

    contentEl.createEl("h2", { text: "STEM scientific & engineering calculator" });
    const host = contentEl.createDiv();
    renderScientificCalculatorView(host, this.state, this.imagUnit, this.callbacks, () => this.close());
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
