import "mathlive";
import type { MathfieldElement } from "mathlive";

/**
 * Converts template slot syntax (e.g. ${1:numerator} or {#slot}) into
 * MathLive native interactive placeholders \placeholder[slot_1]{numerator}
 * so slot-highlighting and Tab-jumping work seamlessly inside <math-field>.
 */
export function templateToMathLivePlaceholders(template: string): string {
  let idx = 0;
  return template
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

export interface MathLiveSlotHostOptions {
  initialLatex?: string;
  enableSlotHighlighting?: boolean;
  onChange?: (cleanLatex: string, rawLatex: string) => void;
}

export function mountMathLiveField(
  container: HTMLElement,
  opts: MathLiveSlotHostOptions = {}
): MathfieldElement {
  const mf = document.createElement("math-field") as MathfieldElement;
  mf.classList.add("lt-mathlive-field");
  if (opts.enableSlotHighlighting !== false) {
    mf.classList.add("lt-slot-highlighting-enabled");
  }
  mf.setAttribute("smart-fence", "true");
  mf.setAttribute("smart-superscript", "true");

  if (opts.initialLatex) {
    mf.value = opts.enableSlotHighlighting !== false
      ? templateToMathLivePlaceholders(opts.initialLatex)
      : opts.initialLatex;
  }

  mf.addEventListener("input", () => {
    const raw = mf.value;
    const clean = stripMathLivePlaceholders(raw);
    opts.onChange?.(clean, raw);
  });

  container.appendChild(mf);
  return mf;
}
