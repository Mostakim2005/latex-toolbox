import { App, Modal, Notice } from "obsidian";
import * as math from "mathjs";
import { casPhasorConvert } from "../core/cas-engine";

type CalcTab = "scientific" | "eee" | "basen" | "graph";

export interface ScientificCalculatorCallbacks {
  onInsertLatex?: (latex: string) => void;
  onSendToBuilder?: (latex: string) => void;
}

export class ScientificCalculatorModal extends Modal {
  private activeTab: CalcTab = "scientific";
  private angleMode: "DEG" | "RAD" = "DEG";
  private expr = "";
  private lastAns = "0";
  private history: Array<{ expr: string; result: string }> = [];

  constructor(
    app: App,
    private imagUnit: "j" | "i" = "j",
    private callbacks: ScientificCalculatorCallbacks = {}
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("lt-calc-modal");
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();

    const header = contentEl.createDiv({ cls: "lt-cas-header" });
    header.createEl("h2", { text: "STEM Scientific & Engineering Calculator" });

    const tabs = contentEl.createDiv({ cls: "lt-calc-tabs" });
    const tabDefs: Array<[CalcTab, string]> = [
      ["scientific", "Scientific"],
      ["eee", "EEE Phasors & Circuits"],
      ["basen", "Base-N / Bitwise"],
      ["graph", "2D Function Plotter"],
    ];
    for (const [id, label] of tabDefs) {
      const btn = tabs.createEl("button", {
        text: label,
        cls: this.activeTab === id ? "lt-calc-tab-active" : "",
      });
      btn.onclick = () => {
        this.activeTab = id;
        this.render();
      };
    }

    const body = contentEl.createDiv();
    if (this.activeTab === "scientific") this.renderScientificTab(body);
    else if (this.activeTab === "eee") this.renderEEETab(body);
    else if (this.activeTab === "basen") this.renderBaseNTab(body);
    else this.renderGraphTab(body);
  }

  private renderScientificTab(container: HTMLElement): void {
    const display = container.createDiv({ cls: "lt-calc-display" });
    const input = display.createEl("input", {
      type: "text",
      value: this.expr,
      placeholder: "e.g. sin(30 deg)^2 + log10(1000) or 5 kOhm * 2 mA to V",
    });
    input.style.width = "100%";
    const resultEl = display.createDiv({ cls: "lt-calc-result", text: `= ${this.lastAns}` });

    const modeBar = container.createDiv({ cls: "lt-cas-toolbar" });
    const angleBtn = modeBar.createEl("button", { text: `Angle: ${this.angleMode}` });
    angleBtn.onclick = () => {
      this.angleMode = this.angleMode === "DEG" ? "RAD" : "DEG";
      angleBtn.setText(`Angle: ${this.angleMode}`);
    };

    const evaluate = () => {
      this.expr = input.value.trim();
      if (!this.expr) return;
      try {
        let evalSrc = this.expr.replace(/\bAns\b/g, `(${this.lastAns})`);
        if (this.angleMode === "DEG") {
          evalSrc = evalSrc.replace(/\b(sin|cos|tan)\(([^)]+)\)/g, "$1(($2) deg)");
        }
        const val = math.evaluate(evalSrc);
        const formatted = math.format(val, { precision: 10 });
        this.lastAns = formatted;
        resultEl.setText(`= ${formatted}`);
        this.history.unshift({ expr: this.expr, result: formatted });
        if (this.history.length > 8) this.history.pop();
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

    const sendBtn = modeBar.createEl("button", { text: "Send to Builder" });
    sendBtn.onclick = () => {
      this.callbacks.onSendToBuilder?.(this.lastAns);
      this.close();
    };

    const insertBtn = modeBar.createEl("button", { text: "Insert Result" });
    insertBtn.onclick = () => {
      this.callbacks.onInsertLatex?.(this.lastAns);
      this.close();
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

    const keypad = container.createDiv({ cls: "lt-calc-keypad" });
    keypad.style.marginTop = "8px";
    for (const k of keys) {
      const b = keypad.createEl("button", { text: k });
      b.onclick = () => {
        if (k === "Clear") {
          input.value = "";
          this.expr = "";
          resultEl.setText("= 0");
        } else if (k === "=") {
          evaluate();
        } else {
          input.value += k;
          input.focus();
        }
      };
    }
  }

  private renderEEETab(container: HTMLElement): void {
    container.createEl("p", {
      text: "Quick AC Phasor conversion, parallel impedance (Z1 || Z2), and RLC resonance.",
    });

    const phasorRow = container.createDiv({ cls: "lt-nl-bar" });
    const phasorIn = phasorRow.createEl("input", {
      type: "text",
      placeholder: `Rectangular (3 + 4${this.imagUnit}) or Polar (5∠53.13)`,
      cls: "lt-nl-input",
    });
    const phasorOut = container.createDiv({ cls: "lt-cas-output" });
    phasorRow.createEl("button", { text: "Convert Phasor", cls: "mod-cta" }).onclick = () => {
      const res = casPhasorConvert(phasorIn.value, this.imagUnit);
      phasorOut.setText(res.ok ? `Result: ${res.latex}` : `Error: ${res.error}`);
    };

    const parRow = container.createDiv({ cls: "lt-nl-bar" });
    const z1In = parRow.createEl("input", { type: "text", placeholder: "Z1 (e.g. 100 or 10+5i)" });
    const z2In = parRow.createEl("input", { type: "text", placeholder: "Z2 (e.g. 200 or 20-10i)" });
    const parOut = container.createDiv({ cls: "lt-cas-output" });
    parRow.createEl("button", { text: "Z1 || Z2" }).onclick = () => {
      try {
        const a = z1In.value.replace(/j/g, "i");
        const b = z2In.value.replace(/j/g, "i");
        const val = math.evaluate(`((${a}) * (${b})) / ((${a}) + (${b}))`);
        parOut.setText(`Z_eq = ${math.format(val, { precision: 6 })}`);
      } catch (e) {
        parOut.setText(`Error: ${String(e)}`);
      }
    };

    const rlcRow = container.createDiv({ cls: "lt-nl-bar" });
    const lIn = rlcRow.createEl("input", { type: "text", placeholder: "L in Henry (e.g. 10e-3)" });
    const cIn = rlcRow.createEl("input", { type: "text", placeholder: "C in Farad (e.g. 100e-6)" });
    const rlcOut = container.createDiv({ cls: "lt-cas-output" });
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
  }

  private renderBaseNTab(container: HTMLElement): void {
    const row = container.createDiv({ cls: "lt-nl-bar" });
    const decIn = row.createEl("input", { type: "text", placeholder: "Enter integer (e.g. 255 or 0xFF or 0b1010)", cls: "lt-nl-input" });
    const out = container.createDiv({ cls: "lt-calc-display" });
    out.setText("DEC: 0 | HEX: 0x0 | BIN: 0b0 | OCT: 0o0");

    const update = () => {
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
    };
    decIn.addEventListener("input", update);
  }

  private renderGraphTab(container: HTMLElement): void {
    const controls = container.createDiv({ cls: "lt-nl-bar" });
    const fnIn = controls.createEl("input", {
      type: "text",
      value: "sin(x) * exp(-0.1 * x)",
      placeholder: "f(x) e.g. sin(x) + 0.5*cos(2*x)",
      cls: "lt-nl-input",
    });
    const minIn = controls.createEl("input", { type: "text", value: "-10", cls: "lt-cas-var-input" });
    const maxIn = controls.createEl("input", { type: "text", value: "10", cls: "lt-cas-var-input" });
    const plotBtn = controls.createEl("button", { text: "Plot", cls: "mod-cta" });

    const canvas = container.createEl("canvas", { cls: "lt-calc-canvas" });
    canvas.width = 680;
    canvas.height = 280;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const xmin = parseFloat(minIn.value) || -10;
      const xmax = parseFloat(maxIn.value) || 10;
      if (xmax <= xmin) {
        new Notice("xmax must be greater than xmin.");
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

      // Grid & axes
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

      // Curve
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
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
