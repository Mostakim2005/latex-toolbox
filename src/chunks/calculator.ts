import type { App } from "obsidian";
import {
  ScientificCalculatorModal,
  type CalculatorEngineDeps,
  type ScientificCalculatorCallbacks,
} from "../ui/scientific-calculator-modal";

export function openCalculatorModal(
  app: App,
  imagUnit: "j" | "i",
  callbacks: ScientificCalculatorCallbacks,
  closeOnBackdropClick: boolean,
  deps: CalculatorEngineDeps,
  glassmorphism: boolean
): ScientificCalculatorModal {
  const modal = new ScientificCalculatorModal(
    app,
    imagUnit,
    callbacks,
    closeOnBackdropClick,
    deps,
    glassmorphism
  );
  modal.open();
  return modal;
}

export type LtCalculatorChunk = {
  openCalculatorModal: typeof openCalculatorModal;
};
