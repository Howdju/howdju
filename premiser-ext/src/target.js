import * as textPosition from "dom-anchor-text-position";
import * as textQuote from "dom-anchor-text-quote";
import { UrlTargetAnchorTypes } from "howdju-common";
import { getCurrentCanonicalUrl } from "howdju-client-common";
import { nodeIsBefore, getPreviousLeafNode } from "./dom";

export class Target {
  constructor(url, anchors, date) {
    this.url = url;
    this.anchors = anchors;
    this.date = date;
  }
}

export function selectionToTarget(selection) {
  const anchors = [];

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const anchor = rangeToAnchor(range);
    anchors.push(anchor);
  }

  const url = getCurrentCanonicalUrl();
  const date = new Date();

  return new Target(url, anchors, date);
}

export class TextQuoteAnchor {
  constructor({ exact, prefix, suffix }, { start, end }) {
    this.type = UrlTargetAnchorTypes.TEXT_QUOTE;
    this.exact = exact;
    this.prefix = prefix;
    this.suffix = suffix;
    this.start = start;
    this.end = end;
  }
}

function rangeToAnchor(range) {
  const selector = textQuote.fromTextPosition(document.body, position);
  const position = textPosition.fromRange(document.body, range);
  return new TextQuoteAnchor(selector, position);
}

export function targetToRanges(target) {
  const ranges = [];
  for (const anchor of target.anchors) {
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
      range.setEnd(node, node.length);
    }
    ranges.push(range);
  }
  return ranges;
}
