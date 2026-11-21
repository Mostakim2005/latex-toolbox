# Product Intent & Feature Map (`PRODUCT.md`)
> **1-Line Summary:** STEM companion and interactive LaTeX equation builder, formula taxonomy companion, and delimiter normalizer for Obsidian.

## 1. Core Vision & User Experience Intent
* **What This App Does (Plain English):** Enables effortless STEM note-taking by providing an interactive visual LaTeX equation builder, extensive physics/chemistry/math presets, hotkey math symbols, and an AI-assisted equation delimiter repair engine.
* **How It Must Feel to Use:** Instant, keystroke-efficient, zero latency, and non-destructive to surrounding note text.

## 2. Active Features (Do Not Break)

### [FEATURE: Visual-LaTeX-Builder] | Aliases: equation builder, math symbols, latex palette
> **1-Line Summary:** Interactive modal and picker to construct complex math equations without memorizing obscure LaTeX syntax.
* **User Intention (Non-Negotiable):** Allow rapid equation authoring during lectures and research.
* **Code Anchors (Grep Targets):**
  * `src/main.ts` -> `openVisualLatexModal`

### [FEATURE: Delimiter-Fixer-And-Normalizer] | Aliases: mathjax fixer, dollar sign fixer, inline equation repair
> **1-Line Summary:** Scans note content and repairs broken inline/display math delimiters (`$...$`, `$$...$$`).
* **User Intention (Non-Negotiable):** Fix broken copy-pasted equations without corrupting currency symbols like `$100`.
* **Code Anchors (Grep Targets):**
  * `src/main.ts` -> `normalizeLatexDelimiters`

### [FEATURE: Curriculum-Formula-Presets] | Aliases: physics equations, chemistry symbols, math presets
> **1-Line Summary:** Bundled library of 480+ KB formula definitions in `data.json` and read-only preloaded STEM curriculum database in `src/data/stem-formula-db.json` spanning high school, college, and university STEM.
* **Code Anchors (Grep Targets):**
  * `src/taxonomy.ts` -> `loadFormulaTaxonomy`
  * `src/core/formula-db.ts` -> `FormulaDatabase`

### [FEATURE: Multi-Tier-CAS-And-SymPy-Bridge] | Aliases: cas engine, compute engine, mathjs, sympy bridge
> **1-Line Summary:** Tier 1 offline CAS (simplify, expand, factor, solve, derivative, integral, limits, partial fractions, complex phasors, SI units, matrix operations) with optional Tier 2 Python/SymPy desktop bridge.
* **Code Anchors (Grep Targets):**
  * `src/core/cas-engine.ts` -> `evaluateCAS`
  * `src/core/sympy-bridge.ts` -> `runSymPyOperation`

### [FEATURE: Scientific-Calculator-And-Plotter] | Aliases: scientific calculator, eee phasor converter, 2d plotter
> **1-Line Summary:** Multi-mode scientific & engineering calculator modal with real-time AC phasor conversions, Base-N/bitwise tools, and 2D canvas function plotting.
* **Code Anchors (Grep Targets):**
  * `src/ui/scientific-calculator-modal.ts` -> `ScientificCalculatorModal`

### [FEATURE: Natural-Language-And-Chemistry-Balancer] | Aliases: wolfram parser, natural language math, mhchem balancer
> **1-Line Summary:** Natural language math parsing (Wolfram/MATLAB/Symbolab style) and rational nullspace chemical equation balancing emitting MathJax `\ce{}`.
* **Code Anchors (Grep Targets):**
  * `src/core/natural-language.ts` -> `parseNaturalLanguage`
  * `src/core/chem-engine.ts` -> `balanceChemicalEquation`
  * `src/core/derivation-renderer.ts` -> `DerivationRenderer`

### [FEATURE: UI-UX-Parity-And-Accessibility] | Aliases: editor context menu, cas status bar, focus visible, reduced motion
> **1-Line Summary:** Adds editor context menu entries for STEM Builder and delimiter fixing, clickable LaTeX CAS Status Bar pill, and WCAG accessibility compliance.
* **User Intention (Non-Negotiable):** Allow instant access to STEM builders from text selections and quick CAS status monitoring from the Obsidian status bar.
* **Visual / UI Behavior:** Right-click editor menu displays STEM options; status bar pill shows CAS readiness and toggles calculator on click.
* **Code Anchors (Grep Targets):** `src/main.ts`, `styles.css`
