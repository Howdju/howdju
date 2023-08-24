import * as textPosition from "dom-anchor-text-position";
import * as textQuote from "dom-anchor-text-quote";

import {
  MediaExcerptInfo,
  CreateDomAnchor,
  inferBibliographicInfo,
  logger,
  UrlTarget,
  makeDomAnchor,
  nodeIsBefore,
  DomAnchor,
} from "howdju-common";

import { getPreviousLeafNode } from "./dom";
import { getCanonicalOrCurrentUrl } from "./location";

export function selectionToMediaExcerptInfo(
  selection: Selection
): MediaExcerptInfo {
  const anchors = [];

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const anchor = rangeToAnchor(range);
    anchors.push(anchor);
  }

  const { authors, sourceDescription, pincite } =
    inferBibliographicInfo(document);
  const url = getCanonicalOrCurrentUrl();

  return {
    anchors,
    authors,
    sourceDescription,
    pincite,
    url,
  };
}

function rangeToAnchor(range: Range): CreateDomAnchor {
  const positionAnchor = textPosition.fromRange(document.body, range);
  const textQuoteAnchor = textQuote.fromTextPosition(
    document.body,
    positionAnchor
  );
  return makeDomAnchor(textQuoteAnchor, positionAnchor);
}

export function targetToRanges(target: UrlTarget) {
  return anchorsToRanges(target.anchors as [DomAnchor]);
}

export function anchorsToRanges(anchors: DomAnchor[]) {
  const ranges = [];
  for (const anchor of anchors) {
    let options = {};
    if (anchor.startOffset) {
      // The average of the start and end seems like a good idea
      const hint = Math.floor((anchor.startOffset + anchor.endOffset) / 2);
      options = { hint };
    }
    const selector = {
      exact: anchor.exactText,
      prefix: anchor.prefixText,
      suffix: anchor.suffixText,
    };
    const range = textQuote.toRange(document.body, selector, options);
    if (!range) {
      logger.warn(`Unable to create a rand for anchor ${anchor}. Skipping.`);
      continue;
    }
    // textQuote.toRange returns a range that is exclusive at the end.
    // If the end is at the beginning of a node that is after the start
    // node (indicating from the library that the range should include
    // the END of the previous node) then update the range to move
    // back to the end of that previous node.
    if (
      range.endOffset === 0 &&
      nodeIsBefore(range.startContainer, range.endContainer)
    ) {
      const node = getPreviousLeafNode(range.endContainer);
      if (!node) {
        logger.warn(
          "Unable to set a range's end because we got no previous leaf node. Skipping this range."
        );
        continue;
      }
      range.setEnd(node, node.length);
    }
    ranges.push(range);
  }
  return ranges;
}
