import type { Plugin } from "obsidian";
import type { LaTeXSettings } from "./types";

export const DEFAULT_SETTINGS: LaTeXSettings = {
  enableSuggest: true,
  enableKbd: true,
  glassmorphism: true,
};

export async function safeSaveSettings(plugin: Plugin, nextSettings: LaTeXSettings): Promise<void> {
  const existing = ((await plugin.loadData()) ?? {}) as Partial<LaTeXSettings>;
  const merged: LaTeXSettings = Object.assign({}, DEFAULT_SETTINGS, existing, nextSettings);
  await plugin.saveData(merged);
}
