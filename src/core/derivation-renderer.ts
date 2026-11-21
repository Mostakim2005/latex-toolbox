import { MarkdownRenderChild, MarkdownRenderer, Plugin, TFile } from "obsidian";
import type { DerivationLine } from "../types";

export interface SerializedDerivation {
  lineNumbers: boolean;
  lines: DerivationLine[];
}

/**
 * Exports derivation lines as pure Obsidian MathJax LaTeX (\begin{aligned}...\end{aligned}).
 * Text rationales are formatted cleanly on the right; line numbers use \tag{N} when enabled.
 */
export function exportDerivationToPureLatex(lines: DerivationLine[], lineNumbers = true): string {
  const nonEmpty = lines.filter((l) => l.latex.trim().length > 0);
  if (nonEmpty.length === 0) return "";
  if (nonEmpty.length === 1 && !nonEmpty[0]!.rationale?.value && !lineNumbers) {
    return nonEmpty[0]!.latex.trim();
  }

  const rows = nonEmpty.map((line, idx) => {
    const expr = line.latex.trim();
    const ratText = line.rationale?.value
      ? ` \\quad \\text{(${escapeLatexText(line.rationale.label || line.rationale.value)})}`
      : "";
    const tag = lineNumbers ? ` \\tag{${idx + 1}}` : "";
    return `  &${expr}${ratText}${tag}`;
  });

  return `\\begin{aligned}\n${rows.join(" \\\\\n")}\n\\end{aligned}`;
}

function escapeLatexText(s: string): string {
  return s.replace(/([%$#&_{}])/g, "\\$1");
}

/**
 * Exports derivation lines as a ```stem-derivation code block so Obsidian renders
 * interactive audio players, web links, and external app URI buttons beside each equation line.
 */
export function exportDerivationToInteractiveBlock(lines: DerivationLine[], lineNumbers = true): string {
  const payload: SerializedDerivation = {
    lineNumbers,
    lines: lines.filter((l) => l.latex.trim().length > 0),
  };
  return "```stem-derivation\n" + JSON.stringify(payload, null, 2) + "\n```";
}

export function hasRichRationales(lines: DerivationLine[]): boolean {
  return lines.some((l) => l.rationale && l.rationale.type !== "text" && l.rationale.value.trim().length > 0);
}

/**
 * Registers the live Obsidian Markdown code-block renderer for ```stem-derivation blocks.
 */
export function registerDerivationBlockProcessor(plugin: Plugin): void {
  plugin.registerMarkdownCodeBlockProcessor("stem-derivation", async (source, el, ctx) => {
    el.empty();
    let data: SerializedDerivation;
    try {
      data = JSON.parse(source) as SerializedDerivation;
    } catch {
      el.createEl("pre", { text: "Invalid stem-derivation JSON block." });
      return;
    }

    const wrapper = el.createDiv({ cls: "lt-rendered-derivation" });
    const renderComp = new MarkdownRenderChild(wrapper);
    ctx.addChild(renderComp);

    for (let i = 0; i < (data.lines?.length ?? 0); i++) {
      const line = data.lines[i]!;
      const row = wrapper.createDiv({ cls: "lt-rendered-derivation-row" });

      // Column 1: Line number
      row.createSpan({
        text: data.lineNumbers !== false ? `${i + 1}.` : "",
        cls: "lt-line-num",
      });

      // Column 2: Rendered MathJax equation
      const mathCell = row.createDiv({ cls: "lt-rendered-math" });
      await MarkdownRenderer.render(plugin.app, `$$\n${line.latex}\n$$`, mathCell, ctx.sourcePath, renderComp);

      // Column 3: Rich Rationale (text / audio / web link / external app URI)
      const ratCell = row.createDiv({ cls: "lt-rendered-rationale" });
      const rat = line.rationale;
      if (rat && rat.value.trim()) {
        if (rat.type === "text") {
          ratCell.createSpan({ text: `(${rat.value})` });
        } else if (rat.type === "link") {
          const a = ratCell.createEl("a", {
            text: `🔗 ${rat.label || rat.value}`,
            href: rat.value,
            cls: "external-link",
          });
          a.setAttr("target", "_blank");
          a.setAttr("rel", "noopener noreferrer");
        } else if (rat.type === "app") {
          const a = ratCell.createEl("a", {
            text: `⚡ ${rat.label || "Open App"}`,
            href: rat.value,
            cls: "lt-app-link-btn",
          });
          a.setAttr("title", rat.value);
        } else if (rat.type === "audio") {
          if (rat.label) ratCell.createSpan({ text: `🎙️ ${rat.label}` });
          const file = plugin.app.vault.getAbstractFileByPath(rat.value);
          const audioEl = ratCell.createEl("audio");
          audioEl.controls = true;
          if (file instanceof TFile) {
            audioEl.src = plugin.app.vault.getResourcePath(file);
          } else {
            audioEl.src = rat.value;
          }
        }
      }
    }
  });
}
