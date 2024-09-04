import {
  generateFragment,
  setTimeout,
} from "text-fragments-polyfill/dist/fragment-generation-utils.js";

import { normalizeContentRange } from "howdju-dom";

// Disable timeouts
setTimeout(null);

function rangeToFragment(range: Range) {
  const selection = selectTextOfRange(range);
  return generateFragment(selection);
}

function selectTextOfRange(range: Range) {
  const window = range.startContainer.ownerDocument?.defaultView;
  if (!window) {
    throw new Error("unable to get window from range");
  }
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
window.rangeToFragment = rangeToFragment;
