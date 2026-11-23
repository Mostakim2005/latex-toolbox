import type { MathfieldElement } from "mathlive";
import type { LaTeXSettings } from "../types";
import { ensureMathLiveLoaded } from "../core/lazy-engines";
import { applyMathLiveKeyboardConfig } from "./stem-keyboards";

function configureMathLiveForObsidian(): void {
  ensureMathLiveLoaded();
}

/**
 * Converts template slot syntax (e.g. ${1:numerator} or {#slot}) into
 * MathLive native interactive placeholders \placeholder[slot_1]{numerator}
 * with clean thin spacing between adjacent slots so borders never overlap.
 */
export function templateToMathLivePlaceholders(template: string): string {
  let idx = 0;
  // Insert thin math space \, between immediately adjacent ${...}${...} tokens to prevent visual overlap
  const spaced = template.replace(/\}\$\{/g, "}\\,${");
  return spaced
    .replace(/\$\{(\d+):([^}]+)\}/g, (_m, id, label) => `\\placeholder[slot_${id}]{${label}}`)
    .replace(/\$\{(\d+)\}/g, (_m, id) => `\\placeholder[slot_${id}]{}`)
    .replace(/\{\s*#?slot\s*\}/gi, () => {
      idx += 1;
      return `\\placeholder[slot_${idx}]{}`;
    });
}

export function stripMathLivePlaceholders(latex: string): string {
  return latex.replace(/\\placeholder(?:\[[^\]]*\])?\{([^}]*)\}/g, "$1");
}

/**
 * Fast STEM physical-keyboard inline shortcuts (active when not deferred to LaTeX Suite).
 */
export const STEM_INLINE_SHORTCUTS: Record<string, string> = {
  dint: "\\int_{\\placeholder[lower]{0}}^{\\placeholder[upper]{\\infty}} \\placeholder[expr]{} \\, dx",
  iint: "\\iint_{\\placeholder[dom]{D}} \\placeholder[expr]{} \\, dA",
  oint: "\\oint_{\\placeholder[path]{C}} \\placeholder[expr]{} \\, d\\mathbf{r}",
  pdiff: "\\frac{\\partial \\placeholder[num]{}}{\\partial \\placeholder[den]{}}",
  ddx: "\\frac{d}{dx}\\left(\\placeholder[expr]{}\\right)",
  ddt: "\\frac{d}{dt}\\left(\\placeholder[expr]{}\\right)",
  lim: "\\lim_{\\placeholder[var]{x} \\to \\placeholder[val]{0}} \\placeholder[expr]{}",
  ohm: "\\Omega",
  ang: "\\angle ",
  jw: "j\\omega",
  par: "\\parallel ",
  lap: "\\mathcal{L}\\left\\{\\placeholder[expr]{}\\right\\}",
  ilap: "\\mathcal{L}^{-1}\\left\\{\\placeholder[expr]{}\\right\\}",
  ce: "\\ce{\\placeholder[chem]{}}",
  eqarr: "\\rightleftharpoons ",
  rxn: "\\rightarrow ",
  deg: "^{\\circ}",
  hbar: "\\hbar",
  eps0: "\\varepsilon_0",
  mu0: "\\mu_0",
};

export interface MathLiveSlotHostOptions {
  initialLatex?: string;
  enableSlotHighlighting?: boolean;
  settings?: LaTeXSettings;
  autoResize?: boolean;
  onChange?: (cleanLatex: string, rawLatex: string) => void;
  onEnter?: () => void;
  onBackspaceEmpty?: () => void;
}

export function mountMathLiveField(
  container: HTMLElement,
  opts: MathLiveSlotHostOptions = {}
): MathfieldElement {
  configureMathLiveForObsidian();
  const mf = document.createElement("math-field") as MathfieldElement;
  mf.classList.add("lt-mathlive-field");
  if (opts.enableSlotHighlighting !== false) {
    mf.classList.add("lt-slot-highlighting-enabled");
  }
  if (opts.autoResize !== false) {
    mf.classList.add("lt-mathlive-autoresize");
  }
  mf.setAttribute("smart-fence", "true");
  mf.setAttribute("smart-superscript", "true");

  // Register STEM physical-keyboard inline shortcuts unless user defers to LaTeX Suite
  if (!opts.settings?.deferToLatexSuite) {
    const existing = (mf.inlineShortcuts ?? {}) as Record<string, string>;
    mf.inlineShortcuts = { ...existing, ...STEM_INLINE_SHORTCUTS };
  }

  // Apply customized virtual keyboard layouts (hides 123/abc if toggled off, adds che/ee/math/phy)
  const syncKeyboard = () => {
    if (opts.settings) {
      applyMathLiveKeyboardConfig(opts.settings);
    }
  };
  mf.addEventListener("focus", syncKeyboard);
  mf.addEventListener("focusin", syncKeyboard);

  if (opts.initialLatex) {
    mf.value = opts.enableSlotHighlighting !== false
      ? templateToMathLivePlaceholders(opts.initialLatex)
      : opts.initialLatex;
  }

  // Direct mouse-click selection on highlighted placeholder slots:
  // Uses MathLive's hit-testing and prompt-selection so clicking any slot selects its full contents for immediate typing.
  mf.addEventListener("pointerup", (ev: PointerEvent) => {
    const path = ev.composedPath?.() ?? [];
    const promptEl = path.find((node) => {
      if (!(node instanceof HTMLElement)) return false;
      return (
        node.classList.contains("ML__prompt") ||
        node.classList.contains("ML__placeholder") ||
        node.getAttribute("part") === "prompt" ||
        node.getAttribute("part") === "placeholder"
      );
    }) as HTMLElement | undefined;

    if (promptEl) {
      mf.focus();
      const mfAny = mf as unknown as {
        getOffsetFromPoint?: (x: number, y: number) => number;
        selection?: { ranges: Array<[number, number]> };
        position?: number;
      };
      if (typeof mfAny.getOffsetFromPoint === "function") {
        const offset = mfAny.getOffsetFromPoint(ev.clientX, ev.clientY);
        if (typeof offset === "number" && offset >= 0) {
          mfAny.position = offset;
        }
      }
      // Select the clicked placeholder/group so typing immediately replaces the slot default
      mf.executeCommand("selectGroup");
    }
  });

  // Tab / Shift+Tab slot jumping + Enter for new derivation line + Backspace on empty line
  mf.addEventListener("keydown", (ev: KeyboardEvent) => {
    if (ev.key === "Tab") {
      const hasPrompt = mf.value.includes("\\placeholder");
      if (hasPrompt) {
        ev.preventDefault();
        mf.executeCommand(ev.shiftKey ? "moveToPreviousPlaceholder" : "moveToNextPlaceholder");
      }
    } else if (ev.key === "Enter" && !ev.shiftKey && opts.onEnter) {
      ev.preventDefault();
      opts.onEnter();
    } else if (ev.key === "Backspace" && !mf.value.trim() && opts.onBackspaceEmpty) {
      ev.preventDefault();
      opts.onBackspaceEmpty();
    }
  });

  mf.addEventListener("input", () => {
    const raw = mf.value;
    const clean = stripMathLivePlaceholders(raw);
    opts.onChange?.(clean, raw);
  });

  container.appendChild(mf);
  return mf;
}
