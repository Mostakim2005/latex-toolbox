# Architectural Decisions, Pivots & Landmines (`DECISIONS_AND_TRAPS.md`)
> **1-Line Summary:** Architectural decisions and regex safety traps for LaTeX Toolbox.

## 1. Architectural Decisions & Pivot History

### [DECISION: Ship-Preset-Data-Json-With-App] | Aliases: built in presets, data.json bundling
> **1-Line Summary:** `data.json` shipped directly inside the repository and package as a required product deliverable.
* **Decision Maker:** `[DECIDED BY: HUMAN]`
* **Original User Intention:** The 480+ KB curriculum formulas are essential out-of-the-box knowledge and must never be stripped or left to empty user initialization.

### [DECISION: Hybrid-Two-Tier-CAS-Architecture] | Aliases: local js cas, sympy desktop bridge
> **1-Line Summary:** Tier 1 (CortexJS + Nerdamer + Math.js) runs offline everywhere; Tier 2 (SymPy) runs via local Python CLI subprocess on Desktop only.
* **Decision Maker:** `[DECIDED BY: HUMAN]`
* **Original User Intention:** Allow rich mobile and desktop mathematics without requiring Python, while offering Laplace/Fourier/ODE symbolic power on full desktop environments.

### [DECISION: Decouple-User-Presets-From-Static-Curriculum] | Aliases: data.json vs stem-formula-db
> **1-Line Summary:** User customization and settings live in `data.json`, while static preloaded curriculum definitions live in `src/data/stem-formula-db.json`.
* **Decision Maker:** `[DECIDED BY: HUMAN]`
* **Original User Intention:** Prevents plugin updates or settings saves from overwriting user customizations.

### [DECISION: Modal-Backdrop-Dismissal-Guard] | Aliases: modal backdrop click, accidental close guard
> **1-Line Summary:** MathLive Builder and Calculator modals guard against accidental backdrop clicks discarding unfinished multiline derivations.
* **Decision Maker:** `[DECIDED BY: HUMAN]`
* **Original User Intention:** Prevent frustrating data loss when clicking outside the modal or dragging selection across the modal bounds.

### [DECISION: Multi-File-Chunk-Splitting-And-Snippet-Sidecar] | Aliases: startup optimization, lazy mathjs, lazy mathlive, deferred compute engine, chunk splitting, snippet sidecar
> **1-Line Summary:** Replaced the monolithic 3.37 MB single-file bundle with a <20 KB `main.js` shell plus on-demand CJS runtime chunks (`lt-engines.chunk.js`, `lt-builder.chunk.js`, `lt-calculator.chunk.js`), external JSON databases (`lt-default-presets.json`, `lt-stem-formula-db.json`), ESM tree-shaken `mathjs`, modal-scoped glassmorphism (`.lt-no-glass`), and a lazy `custom-snippets.json` sidecar migrated safely from `data.json`.
* **Decision Maker:** `[DECIDED BY: HUMAN]`
* **Original User Intention:** Eliminate multi-second Obsidian startup parsing, `487 KB` `data.json` hydration, and `document.body` CSS recalculation latency while keeping desktop sync APIs and mobile adapter loading functional.
* **Protected Code Anchors (Grep Targets):**
  * `src/core/chunk-loader.ts :: loadPluginChunkAsync`
  * `src/core/preset-store.ts :: migrateSnippetsToSidecar`
  * `src/core/lazy-engines.ts :: getMathJs`
  * `src/core/formula-db.ts :: warmFormulaDatabase`
  * `src/main.ts :: LatexToolboxPlugin.onload`

## 2. Do-Not-Touch Engineering Landmines (Traps)

### [TRAP: Greedy-Dollar-Delimiter-Capture] | Aliases: currency collision, inline math corruption
> **1-Line Summary:** Matching `$[^$]+$` greedily turns sentences like `"I paid $50 and he paid $60"` into corrupted math.
* **Strict Rule:** **NEVER** match dollar delimiters without asserting word boundaries or non-digit lookaheads.
* **Protected Code Anchors (Grep Targets):**
  * `src/main.ts` -> `INLINE_MATH_REGEX_GUARD`

### [TRAP: Data-Json-Preset-Corruption] | Aliases: blank settings wipe, presets lost
> **1-Line Summary:** Overwriting settings via `saveData()` without merging against default presets or respecting `snippetsExternalized` destroys user formula libraries.
* **Protected Code Anchors (Grep Targets):**
  * `src/settings.ts :: safeSaveSettings`
  * `src/core/preset-store.ts :: migrateSnippetsToSidecar`
