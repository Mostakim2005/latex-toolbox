# LaTeX Toolbox v5.0.0 → v5.5.0 Patch & External Agent Setup Guide

This guide covers applying the four sequential, verified `git apply` patches to your **v5.0.0** `latex-toolbox` repository, installing updated npm dependencies, and configuring external desktop tools (Python + SymPy Full CAS and optional standalone scientific calculator/URI integrations) that live outside this repository.

## 1. Apply Sequential Git Patches (Inside `latex-toolbox`)

Run these commands from the root of your clean **v5.0.0** `latex-toolbox` repository in exact numerical order:

```bash
# 1. Verify each patch cleanly before applying
git apply --check 01-mathlive-keyboard-slots-multiline.patch
git apply 01-mathlive-keyboard-slots-multiline.patch

git apply --check 02-full-cas-and-sympy-bridge.patch
git apply 02-full-cas-and-sympy-bridge.patch

git apply --check 03-natural-language-chem-and-rationales.patch
git apply 03-natural-language-chem-and-rationales.patch

git apply --check 04-scientific-calculator-stem-db-and-v550.patch
git apply 04-scientific-calculator-stem-db-and-v550.patch
```

> **Windows CRLF Tip:** If your working tree uses Windows line endings and `git apply` reports whitespace/CRLF mismatches, pass `--ignore-space-change --ignore-whitespace` (or `git config core.autocrlf false` before applying).

### What Each Patch Adds

| Patch File | Scope |
| :--- | :--- |
| `01-mathlive-keyboard-slots-multiline.patch` | Settings toggles to hide/show `123` and `abc` keyboards (hidden by default), custom `che`/`ee`/`math`/`phy` [MathLive Virtual Keyboard](https://mathlive.io/mathfield/guides/virtual-keyboard/) tabs, high-contrast mouse-clickable `\placeholder{}` slots + `Tab`/`Shift+Tab` jumping, STEM physical-keyboard `inlineShortcuts`, and multiline/resizable CSS. |
| `02-full-cas-and-sympy-bridge.patch` | Adds [Math.js](https://mathjs.org/docs/), upgrades `src/core/cas-engine.ts` with [CortexJS Compute Engine](https://epsil.dev/compute-engine/) + [Nerdamer](https://nerdamer.com/) + Math.js (integration, definite integrals, factor, limit, partial fractions, complex phasors `a+jb <-> r∠θ°`, SI units, matrix det/inv, smart variable auto-detection), and adds `src/core/sympy-bridge.ts` for full desktop CAS. |
| `03-natural-language-chem-and-rationales.patch` | Adds Wolfram/MATLAB/Symbolab natural-language parser with domain auto-detection & suggestions (`src/core/natural-language.ts`), exact rational nullspace chemistry auto-balancer emitting Obsidian [MathJax `mhchem`](https://mhchem.github.io/MathJax-mhchem/) (`src/core/chem-engine.ts`), and multiline per-line rationale export + `stem-derivation` live Obsidian block renderer (`src/core/derivation-renderer.ts`). |
| `04-scientific-calculator-stem-db-and-v550.patch` | Adds integrated multi-mode Scientific & Engineering Calculator modal (`src/ui/scientific-calculator-modal.ts`: Scientific, EEE Phasors/Circuits, Base-N/Bitwise, 2D Function Plotter), read-only preloaded STEM curriculum formula & concept database (`src/data/stem-formula-db.json` + `src/core/formula-db.ts` covering Grade 11–12 Physics/Chem/Math, 1st–2nd Year EEE, and Engineering basics), full v5.5.0 Builder & Settings UI (`src/main.ts`), and version bump to `5.5.0`. |

## 2. Install Dependencies, Build & Deploy to Obsidian

```bash
npm install
npm run build
node scripts/verify-release.mjs
```

Copy the compiled plugin files into your Obsidian vault's plugin folder (`.obsidian/plugins/latex-toolbox/`):
- `main.js`
- `manifest.json`
- `styles.css`

Then reload Obsidian (or disable and re-enable **LaTeX Toolbox** in Community Plugins).

## 3. External Agent Instructions — Full Desktop CAS (Python + SymPy)

Tier 1 CAS (Simplify, Expand, Factor, Solve, `d/dx`, `∫ dx`, Definite Integrals, Limits, Partial Fractions, Phasors, Units, Matrices, Chemistry Balancing) works **offline out-of-the-box** on both Desktop and Mobile with zero external installs.

To unlock **Tier 2 Full Desktop CAS** (**Laplace**, **Inverse Laplace**, **Fourier**, **ODE `dsolve`**, **Taylor/Laurent Series**, and advanced symbolic integration via [SymPy](https://www.sympy.org/en/shell.html)), instruct your local agent to execute the following setup outside the repository:

### Windows (PowerShell)

```powershell
# 1. Verify Python 3.10+ is installed (if missing, install via winget)
python --version
# winget install --id Python.Python.3.12 -e

# 2. Create a dedicated local venv for LaTeX Toolbox CAS
$VenvDir = "$env:USERPROFILE\.latex-toolbox-cas"
python -m venv $VenvDir

# 3. Install SymPy + ANTLR runtime (required for sympy.parsing.latex.parse_latex)
& "$VenvDir\Scripts\pip.exe" install --upgrade pip
& "$VenvDir\Scripts\pip.exe" install sympy antlr4-python3-runtime==4.11.0 mpmath

# 4. Verify installation
& "$VenvDir\Scripts\python.exe" -c "import sympy; from sympy.parsing.latex import parse_latex; print('SymPy OK:', sympy.__version__, parse_latex(r'\frac{x^2}{2}'))"
```

### Linux / macOS (Bash)

```bash
python3 -m venv "$HOME/.latex-toolbox-cas"
"$HOME/.latex-toolbox-cas/bin/pip" install --upgrade pip
"$HOME/.latex-toolbox-cas/bin/pip" install sympy antlr4-python3-runtime==4.11.0 mpmath
"$HOME/.latex-toolbox-cas/bin/python" -c "import sympy; from sympy.parsing.latex import parse_latex; print('SymPy OK:', sympy.__version__)"
```

### Configure Inside Obsidian Settings

1. Open **Settings → LaTeX Toolbox → Computer Algebra System (CAS) & Engineering**.
2. Set **CAS Backend Mode** to **Hybrid JS + Local Python/SymPy (Full Desktop CAS)**.
3. Set **Python Executable Path** to:
   - Windows: `C:\Users\<YourUsername>\.latex-toolbox-cas\Scripts\python.exe`
   - Linux/macOS: `/home/<YourUsername>/.latex-toolbox-cas/bin/python`
4. Click **Test SymPy** — you should see a notice confirming the Python and SymPy versions.

## 4. Optional External Tools & App URI Integration

- **Audio Rationales:** Voice notes recorded via the Builder's **🎙️ Record Voice Note** button are saved automatically to your configured vault folder (default: `Attachments/MathAudio`). Ensure microphone permission is granted to Obsidian on your OS.
- **External App Rationales:** Use the **App URI** rationale dropdown to attach clickable deep links to external apps (`obsidian://open?file=...`, `matlab://`, `ltspice://`, `https://www.wolframalpha.com/input?i=...`, `https://www.desmos.com/calculator`). To register custom local URI handlers on Windows (e.g., launching LTspice or a local scientific calculator like Qalculate!), register a standard `HKCU\Software\Classes\<scheme>` protocol entry pointing to the executable.
- **Expanding the Read-Only STEM Formula Database:** Add new entries to `src/data/stem-formula-db.json` (never root `data.json`, which stores user settings) using `${1:slot}` placeholders so every inserted formula gets clickable, highlighted MathLive slots automatically, then re-run `npm run build`.
