import { ComputeEngine } from "@cortex-js/compute-engine";
import { compile, complex, det, evaluate, format, inv } from "mathjs";

export interface MathJsSubset {
  evaluate: typeof evaluate;
  format: typeof format;
  compile: typeof compile;
  complex: typeof complex;
  det: typeof det;
  inv: typeof inv;
}

let mathJsSingleton: MathJsSubset | null = null;
let computeEngineSingleton: ComputeEngine | null = null;

/**
 * Returns the tree-shaken Math.js runtime subset inside the lazy engines chunk.
 */
export function getMathJs(): MathJsSubset {
  if (!mathJsSingleton) {
    mathJsSingleton = { evaluate, format, compile, complex, det, inv };
  }
  return mathJsSingleton;
}

/**
 * Lazily instantiates CortexJS ComputeEngine on first symbolic/numeric CAS call.
 */
export function getComputeEngine(): ComputeEngine {
  if (!computeEngineSingleton) {
    computeEngineSingleton = new ComputeEngine();
  }
  return computeEngineSingleton;
}
