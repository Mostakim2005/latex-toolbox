import type { ComputeEngine } from "@cortex-js/compute-engine";
import type * as MathJsNamespace from "mathjs";
import type { MathfieldElement as MathfieldElementClass } from "mathlive";

type MathJsLib = typeof MathJsNamespace;

let mathJsSingleton: MathJsLib | null = null;
let computeEngineSingleton: ComputeEngine | null = null;
let mathLiveLoaded = false;

/**
 * Lazily evaluates Math.js only when CAS, calculator, or formula evaluation is actually invoked.
 * Keeping `require("mathjs")` inside a function allows esbuild to wrap the entire library
 * in a deferred CommonJS thunk rather than initializing 300+ factories at Obsidian startup.
 */
export function getMathJs(): MathJsLib {
  if (!mathJsSingleton) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Deferred load keeps Obsidian startup near-instant
    mathJsSingleton = require("mathjs") as MathJsLib;
  }
  return mathJsSingleton;
}

/**
 * Lazily loads and instantiates CortexJS ComputeEngine on first symbolic/numeric CAS call.
 */
export function getComputeEngine(): ComputeEngine {
  if (!computeEngineSingleton) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Deferred load avoids evaluating ComputeEngine at plugin boot
    const mod = require("@cortex-js/compute-engine") as {
      ComputeEngine: new () => ComputeEngine;
    };
    computeEngineSingleton = new mod.ComputeEngine();
  }
  return computeEngineSingleton;
}

/**
 * Lazily loads MathLive (and registers the `math-field` custom element) only when the builder opens.
 */
export function ensureMathLiveLoaded(): void {
  if (mathLiveLoaded) return;
  mathLiveLoaded = true;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Deferred load avoids registering MathLive web components on Obsidian startup
  const mod = require("mathlive") as {
    MathfieldElement?: typeof MathfieldElementClass;
  };
  if (mod.MathfieldElement) {
    mod.MathfieldElement.fontsDirectory = null;
    mod.MathfieldElement.soundsDirectory = null;
  }
}
