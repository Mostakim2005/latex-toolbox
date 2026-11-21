# LaTeX Toolbox

Interactive STEM equation builder, MathLive editor, multi-tier CAS/SymPy bridge, scientific calculator, and AI LaTeX delimiter normalizer.

## UI/UX Surface Inventory

| Surface | Implementation |
| :--- | :--- |
| **Ribbon Icon** | Calculator icon (`STEM LaTeX builder`) opening `MathLiveBuilderModal`. |
| **Modals** | `MathLiveBuilderModal` (Builder, Formulas, Calculator tabs) and `ScientificCalculatorModal`. |
| **Context Menu** | `editor-menu` entries to open selection in STEM Builder or normalize AI LaTeX delimiters. |
| **Status Bar** | Clickable `LaTeX: CAS` pill launching the interactive STEM Builder. |
| **Inline Renderer** | Interactive derivation `CodeBlockProcessor`. |
| **Settings Tab** | `LatexToolboxSettingTab`. |

## Documentation

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS_AND_TRAPS.md`
- `docs/VISUAL_LOG.md`
- `AGENTS.md`

## Develop

```bash
npm install
npm run build
```

## License

See `LICENSE`.
