import type { Plugin } from "obsidian";
import type { FormulaEntry, LaTeXSettings, PresetItem } from "../types";
import {
  existsPluginFileAsync,
  readPluginTextAsync,
  readPluginTextSync,
  writePluginTextAsync,
} from "./chunk-loader";

export const DEFAULT_PRESETS_FILENAME = "lt-default-presets.json";
export const STEM_FORMULA_DB_FILENAME = "lt-stem-formula-db.json";
export const CUSTOM_SNIPPETS_FILENAME = "custom-snippets.json";

export interface BundledPresetsData {
  shortcuts: PresetItem[];
  snippets: PresetItem[];
  templates: PresetItem[];
}

interface RawDefaultPresetsJson {
  shortcuts?: PresetItem[];
  snippets?: PresetItem[];
  templates?: PresetItem[];
}

let cachedBundledPresets: BundledPresetsData | null = null;
let cachedStemDb: FormulaEntry[] | null = null;
let customSnippetsLoaded = false;

function normalizeBundledPresets(raw: RawDefaultPresetsJson): BundledPresetsData {
  return {
    shortcuts: Array.isArray(raw.shortcuts) ? raw.shortcuts : [],
    snippets: Array.isArray(raw.snippets) ? raw.snippets : [],
    templates: Array.isArray(raw.templates) ? raw.templates : [],
  };
}

export function getBundledPresetsSync(plugin: Plugin | null): BundledPresetsData {
  if (cachedBundledPresets) return cachedBundledPresets;
  const text = readPluginTextSync(plugin, DEFAULT_PRESETS_FILENAME);
  if (text) {
    cachedBundledPresets = normalizeBundledPresets(JSON.parse(text) as RawDefaultPresetsJson);
    return cachedBundledPresets;
  }
  return { shortcuts: [], snippets: [], templates: [] };
}

export async function loadBundledPresetsAsync(plugin: Plugin): Promise<BundledPresetsData> {
  if (cachedBundledPresets) return cachedBundledPresets;
  try {
    const text = await readPluginTextAsync(plugin, DEFAULT_PRESETS_FILENAME);
    cachedBundledPresets = normalizeBundledPresets(JSON.parse(text) as RawDefaultPresetsJson);
    return cachedBundledPresets;
  } catch {
    return { shortcuts: [], snippets: [], templates: [] };
  }
}

export function getStemFormulaDbSync(plugin: Plugin | null): FormulaEntry[] {
  if (cachedStemDb) return cachedStemDb;
  const text = readPluginTextSync(plugin, STEM_FORMULA_DB_FILENAME);
  if (text) {
    const parsed = JSON.parse(text) as FormulaEntry[];
    cachedStemDb = Array.isArray(parsed) ? parsed : [];
    return cachedStemDb;
  }
  return [];
}

export async function loadStemFormulaDbAsync(plugin: Plugin): Promise<FormulaEntry[]> {
  if (cachedStemDb) return cachedStemDb;
  try {
    const text = await readPluginTextAsync(plugin, STEM_FORMULA_DB_FILENAME);
    const parsed = JSON.parse(text) as FormulaEntry[];
    cachedStemDb = Array.isArray(parsed) ? parsed : [];
    return cachedStemDb;
  } catch {
    return [];
  }
}

function mergeUniquePresets(primary: PresetItem[], secondary: PresetItem[]): PresetItem[] {
  const seen = new Set<string>();
  const merged: PresetItem[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = String(item.id || `${item.trigger || ""}:${item.name || ""}:${item.latex || ""}`);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

export function areCustomSnippetsLoaded(): boolean {
  return customSnippetsLoaded;
}

export function markCustomSnippetsLoaded(loaded: boolean): void {
  customSnippetsLoaded = loaded;
}

export async function ensureCustomSnippetsLoaded(
  plugin: Plugin,
  settings: LaTeXSettings
): Promise<PresetItem[]> {
  if (customSnippetsLoaded) return settings.customSnippets;
  try {
    if (await existsPluginFileAsync(plugin, CUSTOM_SNIPPETS_FILENAME)) {
      const raw = await readPluginTextAsync(plugin, CUSTOM_SNIPPETS_FILENAME);
      const parsed = JSON.parse(raw) as PresetItem[];
      if (Array.isArray(parsed)) {
        settings.customSnippets = settings.customSnippets.length > 0
          ? mergeUniquePresets(settings.customSnippets, parsed)
          : parsed;
      }
    }
  } catch {
    // Keep existing in-memory snippets if sidecar cannot be read
  }
  customSnippetsLoaded = true;
  return settings.customSnippets;
}

export function ensureCustomSnippetsLoadedSync(plugin: Plugin | null, settings: LaTeXSettings): PresetItem[] {
  if (customSnippetsLoaded) return settings.customSnippets;
  const text = readPluginTextSync(plugin, CUSTOM_SNIPPETS_FILENAME);
  if (text) {
    try {
      const parsed = JSON.parse(text) as PresetItem[];
      if (Array.isArray(parsed)) {
        settings.customSnippets = settings.customSnippets.length > 0
          ? mergeUniquePresets(settings.customSnippets, parsed)
          : parsed;
      }
    } catch {
      // Ignore malformed sidecar read
    }
  }
  customSnippetsLoaded = true;
  return settings.customSnippets;
}

export async function saveCustomSnippetsSidecar(
  plugin: Plugin,
  snippets: PresetItem[]
): Promise<void> {
  await writePluginTextAsync(plugin, CUSTOM_SNIPPETS_FILENAME, JSON.stringify(snippets));
  customSnippetsLoaded = true;
}

/**
 * Safely moves legacy inline `customSnippets` from `data.json` into `custom-snippets.json`,
 * verifying the sidecar parses cleanly before slimming `data.json`.
 */
export async function migrateSnippetsToSidecar(
  plugin: Plugin,
  settings: LaTeXSettings,
  persistSlimSettings: () => Promise<void>
): Promise<boolean> {
  if (!Array.isArray(settings.customSnippets) || settings.customSnippets.length === 0) {
    return false;
  }

  let existingSidecar: PresetItem[] = [];
  try {
    if (await existsPluginFileAsync(plugin, CUSTOM_SNIPPETS_FILENAME)) {
      const raw = await readPluginTextAsync(plugin, CUSTOM_SNIPPETS_FILENAME);
      const parsed = JSON.parse(raw) as PresetItem[];
      if (Array.isArray(parsed)) existingSidecar = parsed;
    }
  } catch {
    existingSidecar = [];
  }

  const combined = mergeUniquePresets(settings.customSnippets, existingSidecar);
  const serialized = JSON.stringify(combined);
  await writePluginTextAsync(plugin, CUSTOM_SNIPPETS_FILENAME, serialized);

  // Verify the written file parses cleanly before trimming data.json
  if (!(await existsPluginFileAsync(plugin, CUSTOM_SNIPPETS_FILENAME))) {
    return false;
  }
  const verifyRaw = await readPluginTextAsync(plugin, CUSTOM_SNIPPETS_FILENAME);
  const verifyParsed = JSON.parse(verifyRaw) as PresetItem[];
  if (!Array.isArray(verifyParsed) || verifyParsed.length < combined.length) {
    return false;
  }

  settings.customSnippets = combined;
  settings.snippetsExternalized = true;
  customSnippetsLoaded = true;
  await persistSlimSettings();
  return true;
}
