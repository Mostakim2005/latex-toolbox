export interface PresetItem {
  id?: string;
  name?: string;
  trigger?: string;
  latex?: string;
  replacement?: string;
  domain?: string;
  topic?: string;
  subtopic?: string;
  description?: string;
  aliases?: string[];
  [key: string]: unknown;
}

export interface LaTeXSettings {
  wrapStyle: "inline" | "block";
  convertParens: boolean;
  autoFixOnPaste: boolean;
  defaultDomain: string;
  filterLayout: "bar" | "pills";
  uiScale: string;
  enableHistory: boolean;
  autocompleteEnabled: boolean;
  autocompleteMaxResults: number;
  livePreview: boolean;
  glassmorphism: boolean;
  useMathLiveBuilder: boolean;
  enableSlotHighlighting: boolean;
  enableLocalCAS: boolean;
  deferToLatexSuite: boolean;
  recentEquations: Array<Record<string, unknown>>;
  favoriteEquations: Array<Record<string, unknown>>;
  customShortcuts: PresetItem[];
  customSnippets: PresetItem[];
  customTemplates: PresetItem[];
}

export interface SolverStep {
  rel: string;
  expr: string;
  note: string;
}

export interface SolverPreset {
  id: string;
  name: string;
  steps: SolverStep[];
}

export interface CASResult {
  ok: boolean;
  latex: string;
  numeric?: string;
  steps?: SolverStep[];
  error?: string;
}
