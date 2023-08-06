import { GenerateFragmentResult } from "text-fragments-polyfill/dist/fragment-generation-utils.js";

declare global {
  interface Window {
    generateFragmentFromRange: (range: Range) => GenerateFragmentResult;
  }
}
