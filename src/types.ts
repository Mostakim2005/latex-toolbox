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

export type RationaleType = "text" | "audio" | "link" | "app";

export interface LineRationale {
  type: RationaleType;
  label: string;
  /** Plain text justification, vault audio path, web URL, or external app URI (e.g. matlab://, obsidian://). */
  value: string;
}

export interface DerivationLine {
  id: string;
  latex: string;
  rationale?: LineRationale;
}

export type CASBackendMode = "js-only" | "hybrid-python";

export type CASOperation =
  | "simplify"
  | "expand"
  | "factor"
  | "solve"
  | "diff"
  | "integrate"
  | "defint"
  | "limit"
  | "series"
  | "apart"
  | "laplace"
  | "ilaplace"
  | "fourier"
  | "dsolve"
  | "numeric"
  | "phasor"
  | "units"
  | "matrix_det"
  | "matrix_inv"
  | "matrix_eig";

export interface FormulaVariable {
  symbol: string;
  meaning: string;
  unit?: string;
}

export interface FormulaEntry {
  id: string;
  name: string;
  branch: "math" | "physics" | "chemistry" | "eee" | "mechanical" | "civil" | "cs" | "general";
  level: "grade-11-12" | "eee-y1-y2" | "engineering-basics";
  topic: string;
  latex: string;
  definition: string;
  variables?: FormulaVariable[];
  tags?: string[];
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
  /** v5.5.0 Virtual Keyboard & Multiline UX */
  showNumericKeyboard: boolean;
  showAlphabeticKeyboard: boolean;
  enableStemKeyboardTabs: boolean;
  enableLineNumbering: boolean;
  autoResizeEditor: boolean;
  /** v5.5.0 Full CAS & EEE options */
  casBackend: CASBackendMode;
  pythonExecutable: string;
  eeImaginaryUnit: "j" | "i";
  /** v5.5.0 Rich Rationales & External App Links */
  audioNoteFolder: string;
  externalAppSchemes: Record<string, string>;
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
  engine?: string;
  steps?: SolverStep[];
  error?: string;
}
