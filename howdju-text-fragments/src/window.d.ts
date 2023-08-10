import { GenerateFragmentResult } from "text-fragments-polyfill/dist/fragment-generation-utils.js";

/**
 * Augments the Window interface with the methods we provide in this package.
 */
declare global {
  interface Window {
    rangeToFragment: (range: Range) => GenerateFragmentResult;
    getRangesForCurrentFragment: () => Record<string, Range[]> | undefined;
  }
}
