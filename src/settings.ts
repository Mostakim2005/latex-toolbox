import type { Plugin } from "obsidian";
import type { LaTeXSettings, PresetItem } from "./types";
import defaultPresets from "./presets/default-presets.json";

export const DEFAULT_EXTERNAL_APP_SCHEMES: Record<string, string> = {
  "Obsidian Note": "obsidian://open?file=",
  "WolframAlpha": "https://www.wolframalpha.com/input?i=",
  "Symbolab": "https://www.symbolab.com/solver/step-by-step/",
  "Desmos": "https://www.desmos.com/calculator",
  "MATLAB": "matlab://",
  "LTspice / Circuit": "ltspice://",
  "GeoGebra": "https://www.geogebra.org/calculator",
};

export const DEFAULT_SETTINGS: LaTeXSettings = {
  wrapStyle: "block",
  convertParens: true,
  autoFixOnPaste: true,
  defaultDomain: "math",
  filterLayout: "bar",
  uiScale: "115",
  enableHistory: true,
  autocompleteEnabled: true,
  autocompleteMaxResults: 12,
  livePreview: true,
  glassmorphism: true,
  useMathLiveBuilder: true,
  enableSlotHighlighting: true,
  enableLocalCAS: true,
  deferToLatexSuite: true,
  showNumericKeyboard: false,
  showAlphabeticKeyboard: false,
  enableStemKeyboardTabs: true,
  enableLineNumbering: true,
  autoResizeEditor: true,
  casBackend: "js-only",
  pythonExecutable: "python",
  eeImaginaryUnit: "j",
  audioNoteFolder: "Attachments/MathAudio",
  externalAppSchemes: { ...DEFAULT_EXTERNAL_APP_SCHEMES },
  recentEquations: [],
  favoriteEquations: [],
  customShortcuts: [],
  customSnippets: [],
  customTemplates: [],
};

export function getBundledPresets(): {
  shortcuts: PresetItem[];
  snippets: PresetItem[];
  templates: PresetItem[];
} {
  return {
    shortcuts: defaultPresets.shortcuts ?? [],
    snippets: defaultPresets.snippets ?? [],
    templates: defaultPresets.templates ?? [],
  };
}

export function getMergedLibrary(settings: LaTeXSettings): {
  shortcuts: PresetItem[];
  snippets: PresetItem[];
  templates: PresetItem[];
} {
  const bundled = getBundledPresets();
  return {
    shortcuts: [...bundled.shortcuts, ...(settings.customShortcuts ?? [])],
    snippets: [...bundled.snippets, ...(settings.customSnippets ?? [])],
    templates: [...bundled.templates, ...(settings.customTemplates ?? [])],
  };
}

export async function safeSaveSettings(plugin: Plugin, next: LaTeXSettings): Promise<void> {
  const existing = ((await plugin.loadData()) ?? {}) as Partial<LaTeXSettings>;
  const merged = Object.assign({}, DEFAULT_SETTINGS, existing, next);
  await plugin.saveData(merged);
}
