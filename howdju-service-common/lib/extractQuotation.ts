import { DOMWindow } from "jsdom";

import { logger, toPlainTextContent } from "howdju-common";

import { runScriptAction } from "./runScript";

export function extractQuotationFromWindowsFragmentUsingPolyfill(
  window: DOMWindow
) {
  const url = window.location.href;

  const fragmentRanges = runScriptAction<Record<string, Range[]> | undefined>(
    window,
    "getRangesForCurrentFragment",
    "window.getRangesForCurrentFragment()"
  );

  if (!fragmentRanges) {
    logger.info(`Found no fragment ranges for URL: ${url}`);
    return undefined;
  }
  if (!("text" in fragmentRanges)) {
    logger.warn(`Found no text fragment range for URL: ${url}`);
    return undefined;
  }
  if (fragmentRanges["text"].length > 1) {
    logger.warn(
      `More than one fragment range found for URL: ${url}; using the first one.`
    );
  }
  const fragmentRange = fragmentRanges["text"][0];
  const quotation = toPlainTextContent(fragmentRange);
  return quotation;
}
