import {
  generateFragment,
  setTimeout,
} from "text-fragments-polyfill/dist/fragment-generation-utils.js";

import { normalizeContentRange } from "howdju-client-common";

// Disable timeouts
setTimeout(null);

function generateFragmentFromRange(range: Range) {
  const selection = selectTextOfRange(range);
  return generateFragment(selection);
}

function selectTextOfRange(range: Range) {
  const selection = window.getSelection();
  if (!selection) {
    throw new Error("unable to get selection");
  }
  const normalRange = normalizeContentRange(range);
  selection.removeAllRanges();
  selection.addRange(normalRange);
  return selection;
}

// Put functions on the window so that we can reference them from JSDOM.
window.generateFragmentFromRange = generateFragmentFromRange;
