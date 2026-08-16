export type ScienceDomain = 'general' | 'math' | 'physics' | 'chemistry' | 'electronics';
export type InsertMode = 'cursor' | 'selection';

export interface Shortcut {
  id: string;
  trigger: string;
  latex: string;
  domain: ScienceDomain | 'all';
}

export interface Snippet {
  id: string;
  name: string;
  trigger: string;
  latex: string;
  domain: ScienceDomain | 'all';
}

export interface Template {
  id: string;
  name: string;
  trigger: string;
  description: string;
  latex: string;
  domain: ScienceDomain | 'all';
}

export interface EquationHistoryItem {
  id: string;
  input: string;
  latex: string;
  domain: ScienceDomain;
  createdAt: number;
  favorite: boolean;
}

export interface LatexToolboxSettings {
  wrapStyle: 'block' | 'inline';
  convertParens: boolean;
  forceDisplayMath: boolean;
  autoWrapBareMath: boolean;
  defaultDomain: ScienceDomain;
  customShortcuts: Shortcut[];
  customSnippets: Snippet[];
  customTemplates: Template[];
  recentEquations: EquationHistoryItem[];
  favoriteEquations: EquationHistoryItem[];
  autocompleteEnabled: boolean;
  autocompleteMaxResults: number;
  maxInputLength: number;
  livePreview: boolean;
  semanticReviewThreshold: 'low' | 'medium' | 'high';
}

export interface SemanticCandidate {
  id: string;
  label: string;
  domain: ScienceDomain;
  latex: string;
  confidence: 'high' | 'medium' | 'low';
  score: number;
  explanation: string;
  issues: string[];
  source: 'intent' | 'engine' | 'parser' | 'shortcut';
}

export interface ConversionResult {
  latex: string;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  issues: string[];
  intentId?: string;
  candidates?: SemanticCandidate[];
}
