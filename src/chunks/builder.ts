import type { App, Editor } from "obsidian";
import { MathLiveBuilderModal, type BuilderPluginHost } from "../ui/builder-modal";

export function openBuilderModal(
  app: App,
  plugin: BuilderPluginHost,
  editor: Editor | null,
  initialText = ""
): MathLiveBuilderModal {
  const modal = new MathLiveBuilderModal(app, plugin, editor, initialText);
  modal.open();
  return modal;
}

export type LtBuilderChunk = {
  openBuilderModal: typeof openBuilderModal;
};
