// LaTeX Toolbox from live Nihon 4.6.0 bundle (4826 lines)
export interface LaTeXSettings {
  enableSuggest: boolean;
  enableKbd: boolean;
  glassmorphism: boolean;
  uiScale?: string;
  filterLayout?: "bar" | "pills";
  autoFixOnPaste?: boolean;
  wrapStyle?: string;
  autocompleteEnabled?: boolean;
  autocompleteMaxResults?: number;
  customShortcuts?: Array<Record<string, unknown>>;
  customSnippets?: Array<Record<string, unknown>>;
  customTemplates?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface TaxonomyTopic {
  label: string;
  subtopics: string[];
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

