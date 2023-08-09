import * as textPosition from "dom-anchor-text-position";
import * as textQuote from "dom-anchor-text-quote";
import { indexOf } from "lodash";

import { logger } from "./logger";

export function nodeIsBefore(node1: Node, node2: Node) {
  return nodePositionCompare(node1, node2) < 0;
}

export function nodeIsAfter(node1: Node, node2: Node) {
  return nodePositionCompare(node1, node2) > 0;
}

export function nodeIsAfterOrSame(node1: Node, node2: Node) {
  return nodePositionCompare(node1, node2) >= 0;
}

/**
 * Returns a number comparing the position of node1 to node2.
 *
 * There are five possibilities, and these are the return values:
 *
 * 1. The nodes are the same node (0)
 * 2. node1 contains node2 (-1 because node1 starts before node2)
 * 3. node2 contains node1 (1 because node1 starts after node2)
 * 4. node1 ends before node2 (-1)
 * 5. node1 begins after node2 (1)
 *
 * @returns -1 is node1 is before node2, 0 if they are the same node, and 1 if node1 is after node2.
 */
export function nodePositionCompare(node1: Node, node2: Node) {
  if (node1 === node2) {
    return 0;
  } else if (node1.contains(node2)) {
    return -1;
  } else if (node2.contains(node1)) {
    return 1;
  }

  // Get the two ancestors that are children of the common ancestor and contain each the two nodes.
  let ancestor1 = node1;
  while (ancestor1.parentNode && !ancestor1.parentNode.contains(node2)) {
    ancestor1 = ancestor1.parentNode;
  }

  let ancestor2 = node2;
  while (
    ancestor2.parentNode &&
    ancestor2.parentNode !== ancestor1.parentNode
  ) {
    ancestor2 = ancestor2.parentNode;
  }

  let sibling = ancestor1.nextSibling;
  // if ancestor2 is later in the sibling chain than ancestor1, then node1 comes before node2
  while (sibling) {
    if (sibling === ancestor2) return -1;
    sibling = sibling.nextSibling;
  }
  // otherwise node2 comes before node1
  return 1;
}

export function getTextWithin(
  doc: Document,
  startText: string,
  endText: string,
  { prefix, suffix }: { prefix?: string; suffix?: string } = {
    prefix: undefined,
    suffix: undefined,
  }
) {
  // Some sites includes the content of the page in a script tag. E.g. substack's `body_html`. So
  // use a hint at the beginning to try and find content in the body. (If we find this doens't work,
  // we might need to use a binary search style approach until we either have exhausted ranges in
  // the document or have found a range that isn't in a script tag.)
  const { range } = getRangeOfText(doc, startText, endText, {
    hint: 0,
    prefix,
    suffix,
  });
  if (!range) {
    return undefined;
  }
  if (isRangeInsideScript(range)) {
    logger.error(
      `getTextWithin returning a range that is within a script tag for ${doc.location.href}`
    );
  }
  if (range.collapsed) {
    return undefined;
  }
  return toPlainTextContent(range);
}

function isRangeInsideScript(range: Range) {
  return (
    isNodeInsideScript(range.startContainer) ||
    isNodeInsideScript(range.endContainer)
  );
}

function isNodeInsideScript(node: Node) {
  let currNode: Node | null = node;
  while (currNode) {
    if (isScriptNode(currNode)) {
      return true;
    }
    currNode = currNode.parentNode;
  }
  return false;
}

function isScriptNode(node: Node) {
  return (
    node.nodeType === getNodeConstructor(node).ELEMENT_NODE &&
    node.nodeName.toLowerCase() === "script"
  );
}

function getRangeOfText(
  doc: Document,
  startText: string,
  endText: string,
  { prefix, suffix, hint }: { prefix?: string; suffix?: string; hint?: number }
) {
  let startPosition = textQuote.toTextPosition(
    doc.body,
    { exact: startText, prefix },
    hint !== undefined ? { hint } : undefined
  );
  if (!startPosition) {
    return { range: undefined, end: undefined };
  }
  let endPosition = textQuote.toTextPosition(
    doc.body,
    { exact: endText, suffix },
    { hint: startPosition.end }
  );
  if (!endPosition) {
    return { range: undefined, end: undefined };
  }
  // If the positions are invalid, try to find better positions.
  if (startPosition.start >= endPosition.end) {
    const betterStartPosition = textQuote.toTextPosition(
      doc.body,
      { exact: startText },
      { hint: endPosition.start }
    );
    const betterEndPosition = textQuote.toTextPosition(
      doc.body,
      { exact: endText },
      { hint: startPosition.end }
    );
    const betterStartLength = betterStartPosition
      ? endPosition.start - betterStartPosition.end
      : Number.NEGATIVE_INFINITY;
    const betterEndLength = betterEndPosition
      ? betterEndPosition.start - startPosition.end
      : Number.NEGATIVE_INFINITY;
    const isValidBetterStart = betterStartPosition && betterStartLength > 0;
    const isValidBetterEnd = betterEndPosition && betterEndLength > 0;
    if (isValidBetterStart) {
      if (isValidBetterEnd) {
        // If both better positions were found, return the one that yields a smaller range.
        if (betterStartLength < betterEndLength) {
          startPosition = betterStartPosition;
        } else {
          endPosition = betterEndPosition;
        }
      } else {
        startPosition = betterStartPosition;
      }
    } else if (isValidBetterEnd) {
      endPosition = betterEndPosition;
    }
    // If the positions are still invalid, give up.
    if (startPosition.start >= endPosition.end) {
      return { range: undefined, end: undefined };
    }
  }

  const range = textPosition.toRange(doc.body, {
    start: startPosition.start,
    end: endPosition.end,
  });
  return { range, end: endPosition.end };
}

function getNodeConstructor(node: Document | Node) {
  // node may be a Document with a defaultView.
  const window =
    "defaultView" in node ? node.defaultView : node.ownerDocument?.defaultView;
  if (!window) {
    throw new Error(
      `Unable to obtain window from node to get Node constructor.`
    );
  }
  return window.Node;
}

/**
 * Try to return the contents of a range formatted as plain text.
 *
 * - Every time we encounter a text node, we add its textContent to the result.
 * - Every time we encounter a paragraph, we add two newlines to the result.
 *
 * JSDOM doesn't implement innerText, so we must do this ourselves
 * (https://github.com/jsdom/jsdom/issues/1245). Another option might be to run headless Chrome.
 *
 * (On the differences between textContent and innerText:
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent#differences_from_innertext)
 */
export function toPlainTextContent(range: Range) {
  const textParts = [] as string[];
  const Node = getNodeConstructor(range.startContainer);
  walkRangeNodes(range, {
    enter: (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text;
        if (node.isSameNode(range.startContainer)) {
          if (node.isSameNode(range.endContainer)) {
            text = node.textContent?.substring(
              range.startOffset,
              range.endOffset
            );
          } else {
            text = node.textContent?.substring(range.startOffset);
          }
        } else if (node.isSameNode(range.endContainer)) {
          text = node.textContent?.substring(0, range.endOffset);
        } else {
          text = node.textContent;
        }
        text = text?.trim();
        if (text) {
          textParts.push(text);
        }
      }
    },
    leave: (node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6"].includes(
          node.nodeName.toLowerCase()
        )
      ) {
        textParts.push("\n\n");
      }
    },
  });
  return textParts
    .join(" ")
    .replace(/^\s+/gm, "")
    .replace(/\s+$/gm, "\n")
    .trim();
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === getNodeConstructor(node).TEXT_NODE;
}

export function walkRangeNodes(
  range: Range,
  { enter, leave }: { enter: (node: Node) => void; leave: (node: Node) => void }
) {
  // If the startContainer is not a text node, then startOffset points to the first node of the
  // range. If the startOffset is 0, it is ambiguous whether the range starts at the startContainer
  // or at its first child. We assume that a startOffset of 0 includes the startContainer.

  let node: Node | null =
    isTextNode(range.startContainer) || range.startOffset == 0
      ? range.startContainer
      : range.startContainer.childNodes[range.startOffset];
  while (node) {
    enter(node);
    if (node.firstChild) {
      node = node.firstChild;
      continue;
    }
    while (node && !node.nextSibling) {
      leave(node);
      if (node.isSameNode(range.endContainer)) {
        return;
      }
      node = node.parentNode;
    }
    if (!node) {
      logger.error(
        `Unexpectedly reached the root node without encountering the range's endContainer.`
      );
      return;
    }
    leave(node);
    node = node.nextSibling;
    // If the endContainer is not a text node, then endOffset points to the last node of the range
    // and we should skip any nodes after it.
    if (
      !isTextNode(range.endContainer) &&
      node?.parentNode?.isSameNode(range.endContainer) &&
      indexOf(node.parentNode.childNodes, node) >= range.endOffset
    ) {
      return;
    }
    if (
      node &&
      !range.endContainer.contains(node) &&
      nodeIsAfter(node, range.endContainer)
    ) {
      return;
    }
  }
}
