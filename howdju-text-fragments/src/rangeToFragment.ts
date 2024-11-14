import {
  generateFragmentFromRange,
  setTimeout,
} from "text-fragments-polyfill/dist/fragment-generation-utils.js";

// Disable timeouts
setTimeout(null);

function rangeToFragment(range: Range) {
  return generateFragmentFromRange(range);
}

// Put functions on the window so that we can reference them from JSDOM.
window.rangeToFragment = rangeToFragment;
