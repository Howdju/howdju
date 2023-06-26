import * as textPosition from "dom-anchor-text-position";
import * as textQuote from "dom-anchor-text-quote";

import { CreateDomAnchor } from "./zodSchemas";

export function makeDomAnchor(
  { exact, prefix, suffix }: textQuote.TextQuoteAnchor,
  { start, end }: textPosition.TextPositionAnchor
): CreateDomAnchor {
  return {
    exactText: exact,
    prefixText: prefix,
    suffixText: suffix,
    startOffset: start,
    endOffset: end,
  };
}
