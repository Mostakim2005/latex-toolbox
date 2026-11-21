# Visual Feature & Change Log (`VISUAL_LOG.md`)
> **1-Line Summary:** Visual flowcharts explaining LaTeX Toolbox formula insertion and delimiter repair flows.

## Feature & Change Flowcharts

### [VISUAL: Delimiter-Fixer-Pipeline] | Aliases: fix latex workflow, equation normalization
> **1-Line Summary:** Scans active note, checks delimiter balance, and updates corrupted math blocks.

```mermaid
flowchart TD
    %% Color Definitions (Obsidian & GitHub compatible)
    classDef startNode fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff
    classDef processNode fill:#0f766e,stroke:#115e59,color:#ffffff
    classDef outputNode fill:#15803d,stroke:#14532d,color:#ffffff
    classDef trapNode fill:#b91c1c,stroke:#7f1d1d,color:#ffffff

    Start([Start: User triggers Fix LaTeX Delimiters]):::startNode --> Scan[Scan Note Text for Math Patterns]:::processNode
    Scan --> Check{Delimiter Check}:::processNode
    Check -->|Currency detected e.g. $50| Guard[Bypass Currency String]:::trapNode
    Check -->|Unbalanced math $$ or $| Fix[Apply MathJax Standard Enclosure]:::processNode
    Fix --> Done([Replace Note Selection / Content]):::outputNode
    Guard --> Fix

    subgraph Legend["Legend (Color Guide)"]
        L1([Blue = User Action]):::startNode
        L2[Teal = Processing & Regex Analysis]:::processNode
        L3([Green = Completed Replacement]):::outputNode
        L4[Red = Currency Guard]:::trapNode
    end
```

---

### [VISUAL: Multi-Tier-CAS-And-Scientific-Calculator-Flow] | Aliases: cas pipeline, sympy bridge, calculator flow
> **1-Line Summary:** How user queries route through offline JS engines or local desktop SymPy process.

```mermaid
flowchart TD
    %% Color Definitions (Obsidian & GitHub compatible)
    classDef startNode fill:#1d4ed8,stroke:#1e3a8a,color:#ffffff
    classDef processNode fill:#0f766e,stroke:#115e59,color:#ffffff
    classDef outputNode fill:#15803d,stroke:#14532d,color:#ffffff
    classDef trapNode fill:#b91c1c,stroke:#7f1d1d,color:#ffffff

    Start([User triggers CAS / Calc / Balancer]):::startNode --> QueryType{Operation Type?}:::processNode
    QueryType -->|Chemistry Equation| Chem[chem-engine: Gaussian Elimination]:::processNode
    QueryType -->|Natural Language| NL[natural-language: Syntax Translator]:::processNode
    QueryType -->|Standard CAS / Calc| TierCheck{CAS Mode Setting?}:::processNode

    Chem --> Result([Formatted MathJax LaTeX]):::outputNode
    NL --> TierCheck

    TierCheck -->|Tier 1: JS Offline| JSCompute[CortexJS + Nerdamer + Math.js]:::processNode
    TierCheck -->|Tier 2: Desktop Python| CheckDesktop{Platform.isDesktop?}:::processNode

    CheckDesktop -->|No - Mobile| Fallback[Fallback to Tier 1 JS]:::trapNode
    Fallback --> JSCompute
    CheckDesktop -->|Yes - Desktop| Subprocess[sympy-bridge: Spawn Python Child Process]:::processNode

    JSCompute --> Result
    Subprocess --> Result

    subgraph Legend["Legend (Color Guide)"]
        L1([Blue = User Input / Entry]):::startNode
        L2[Teal = Processing Engines]:::processNode
        L3([Green = LaTeX Output]):::outputNode
        L4[Red = Mobile Guard / Fallback]: trapNode
    end
```
