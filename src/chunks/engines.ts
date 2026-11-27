import type { Plugin } from "obsidian";
import {
  casDifferentiate,
  casExpand,
  casFactor,
  casIntegrate,
  casPhasorConvert,
  casSimplify,
  casSolve,
  detectPrimaryVariable,
  runCASOperation,
} from "../core/cas-engine";
import { balanceChemicalEquation } from "../core/chem-engine";
import {
  evaluateFormulaEntry,
  getAllFormulas,
  searchFormulaDatabase,
  setFormulaDbPlugin,
  warmFormulaDatabase,
} from "../core/formula-db";
import { getComputeEngine, getMathJs } from "../core/lazy-engines";
import {
  detectStemDomain,
  getNaturalSuggestions,
  naturalLanguageToLatex,
} from "../core/natural-language";
import {
  loadBundledPresetsAsync,
  loadStemFormulaDbAsync,
} from "../core/preset-store";
import { checkSymPyStatus } from "../core/sympy-bridge";
import { normalizeChemicalFormulaInput, TAXONOMY } from "../taxonomy";

export function initEnginesPlugin(plugin: Plugin): void {
  setFormulaDbPlugin(plugin);
}

export async function warmAllEngineData(plugin: Plugin): Promise<void> {
  setFormulaDbPlugin(plugin);
  await Promise.all([loadStemFormulaDbAsync(plugin), loadBundledPresetsAsync(plugin)]);
}

export {
  balanceChemicalEquation,
  casDifferentiate,
  casExpand,
  casFactor,
  casIntegrate,
  casPhasorConvert,
  casSimplify,
  casSolve,
  checkSymPyStatus,
  detectPrimaryVariable,
  detectStemDomain,
  evaluateFormulaEntry,
  getAllFormulas,
  getComputeEngine,
  getMathJs,
  getNaturalSuggestions,
  naturalLanguageToLatex,
  normalizeChemicalFormulaInput,
  runCASOperation,
  searchFormulaDatabase,
  TAXONOMY,
  warmFormulaDatabase,
};

export type LtEnginesModule = {
  initEnginesPlugin: typeof initEnginesPlugin;
  warmAllEngineData: typeof warmAllEngineData;
  balanceChemicalEquation: typeof balanceChemicalEquation;
  casDifferentiate: typeof casDifferentiate;
  casExpand: typeof casExpand;
  casFactor: typeof casFactor;
  casIntegrate: typeof casIntegrate;
  casPhasorConvert: typeof casPhasorConvert;
  casSimplify: typeof casSimplify;
  casSolve: typeof casSolve;
  checkSymPyStatus: typeof checkSymPyStatus;
  detectPrimaryVariable: typeof detectPrimaryVariable;
  detectStemDomain: typeof detectStemDomain;
  evaluateFormulaEntry: typeof evaluateFormulaEntry;
  getAllFormulas: typeof getAllFormulas;
  getComputeEngine: typeof getComputeEngine;
  getMathJs: typeof getMathJs;
  getNaturalSuggestions: typeof getNaturalSuggestions;
  naturalLanguageToLatex: typeof naturalLanguageToLatex;
  normalizeChemicalFormulaInput: typeof normalizeChemicalFormulaInput;
  runCASOperation: typeof runCASOperation;
  searchFormulaDatabase: typeof searchFormulaDatabase;
  TAXONOMY: typeof TAXONOMY;
  warmFormulaDatabase: typeof warmFormulaDatabase;
};
