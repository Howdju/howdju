import { GenerateFragmentResult } from "text-fragments-polyfill/dist/fragment-generation-utils.js";

declare global {
  interface Window {
    rangeToFragment: (range: Range) => GenerateFragmentResult;
    getRangesForCurrentFragment: () => Record<string, Range[]> | undefined;
  }
}
