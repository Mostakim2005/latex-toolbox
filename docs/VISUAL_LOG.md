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
