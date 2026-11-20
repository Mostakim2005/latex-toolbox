# Project Operating Instructions (`AGENTS.md`)
> **Notice:** This project inherits user persona, confirmation gates, visual standards, and documentation blueprints from the global master `AGENTS.md`. Do not duplicate those rules here.

## 1. Project Tech Stack & Environment
* **Runtime / Language:** Node.js v20+, TypeScript 5+, esbuild
* **Framework / Host:** Obsidian Plugin API (`obsidian`)
* **Target OS / Build Output:** Desktop & Mobile (`runtime/main.js`, `runtime/manifest.json`, `runtime/styles.css`)

## 2. Mandatory Verification & Build Commands
* **Type Check:** `npx tsc --noEmit`
* **Test Suite:** `node tests/run-all.mjs`
* **Release Verification:** `node scripts/verify-release.mjs`
* **Build / Package:** `npm run build`

## 3. Repository Directory Structure & Conventions
* `src/` - Modular source files (`main.ts`, `settings.ts`, `taxonomy.ts`, `types.ts`).
* `data.json` - Core formula and curriculum taxonomy database bundled with the plugin.
* `tests/` - Comprehensive automated test suite (`phase2` through `phase9`).
* `runtime/` - Compiled plug-and-play deliverable files for vault deployment.
* `docs/` - Core Markdown documentation suite (`PRODUCT.md`, `ARCHITECTURE.md`, `DECISIONS_AND_TRAPS.md`, `VISUAL_LOG.md`).

## 4. Critical Trap Pointers (1-Line Warnings Only)
* **TRAP 1:** Never use unescaped single `$` capture regex without negative lookahead for currency digits — see `docs/DECISIONS_AND_TRAPS.md` -> `[TRAP: Greedy-Dollar-Delimiter-Capture]`.
* **TRAP 2:** Never wipe or overwrite root `data.json` on settings save without schema validation — see `docs/DECISIONS_AND_TRAPS.md` -> `[TRAP: Data-Json-Preset-Corruption]`.
