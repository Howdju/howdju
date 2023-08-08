export function getSelection() {
  return document.getSelection();
}

export function clearSelection() {
  if (window.getSelection) {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    if (selection.empty) {
      // Chrome
      selection.empty();
    } else if (selection.removeAllRanges) {
      // Firefox
      selection.removeAllRanges();
    }
  } else if ("selection" in document) {
    // IE?
    (document.selection as any).empty();
  }
}

export function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

/**
 * DOM utilities to be used cross-platform.
 *
 * This code may not refer to client globals like `document`, `window`, `Node`, etc.
 */

import { logger, nodeIsAfter } from "howdju-common";

export function normalizeNodes(nodes: Node[]) {
  for (const node of nodes) {
    node.normalize();
  }
}

export function getCommonAncestor(node1: Node, node2: Node) {
  if (!node1 || !node2) {
    throw new Error(
      "cannot get common ancestor when one or both nodes are missing"
    );
  }
  if (node1 === node2) {
    return node1;
  }

  let ancestor: Node | null = node1;
  while (ancestor && !ancestor.contains(node2)) {
    ancestor = ancestor.parentElement;
  }

  return ancestor;
}

/**
 Two nodes are coextensive if there is no content between their starts and their ends.

 E.g., these two nodes are coextensive:
 <span><span>some test</span></span>
 these two are not, because of the content (space, " ") between their start nodes
 <span> <span>some text</span></span>
 */
export function isCoextensive(node1: Node, node2: Node) {
  if (node1 === node2) {
    return true;
  }

  if (node1.contains(node2)) {
    return !hasSiblingsBetween(node2, node1);
  } else if (node2.contains(node1)) {
    return !hasSiblingsBetween(node1, node2);
  }

  return false;
}

/**
 * Returns true if there are any nodes between the starts/ends of startNode, or any ancestor of startNode, and endNode
 */
function hasSiblingsBetween(startNode: Node, endNode: Node) {
  let curr: Node | null = startNode;
  while (curr && curr !== endNode) {
    if (curr.previousSibling || curr.nextSibling) {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

export function insertNodeAfter(node: Node, refNode: Node) {
  if (!refNode.parentNode) {
    throw new Error("Unable to insert node because refNode lacked a parent.");
  }
  if (refNode.nextSibling) {
    refNode.parentNode.insertBefore(node, refNode.nextSibling);
  } else {
    refNode.parentNode.appendChild(node);
  }
}

export function insertNodeBefore(node: Node, refNode: Node) {
  if (!refNode.parentNode) {
    throw new Error("Unable to insert node because refNode lacked a parent.");
  }
  refNode.parentNode.insertBefore(node, refNode);
}

export function getNextLeafNode(node: Node) {
  // nextSibling is null for last child of a node
  let nextLeafNode: Node | null = node;
  while (nextLeafNode && !nextLeafNode.nextSibling) {
    nextLeafNode = nextLeafNode.parentNode;
  }
  if (!nextLeafNode) {
    logger.error(
      "Unable to return next leaf node because we exhausted parents while looking for a next sibling."
    );
    return null;
  }
  nextLeafNode = nextLeafNode.nextSibling;
  while (nextLeafNode && nextLeafNode.childNodes.length) {
    nextLeafNode = nextLeafNode.childNodes[0];
  }
  return nextLeafNode;
}

export function getPreviousLeafNode(node: Node) {
  // previousSibling is null for first child of a node
  let prevLeafNode: Node | null = node;
  while (prevLeafNode && !prevLeafNode.previousSibling) {
    prevLeafNode = prevLeafNode.parentNode;
  }
  if (!prevLeafNode) {
    logger.error(
      "Unable to return previous leaf node because we exhausted parents while looking for a previous sibling."
    );
    return null;
  }
  prevLeafNode = prevLeafNode.previousSibling;
  while (prevLeafNode && prevLeafNode.childNodes.length) {
    prevLeafNode = prevLeafNode.childNodes[prevLeafNode.childNodes.length - 1];
  }
  return prevLeafNode;
}

/**
 * Return a clone of the given range with its start/end normalized relative to encompassed text.
 *
 * Perform the following:
 * - If the start is after the end, swap them.
 * - If the range starts at the end of or ends at the start of a node, the returned range's start/end is
 *   updated to the end/start of the next/previous non-empty leaf node.
 */
export function normalizeContentRange(range: Range): Range {
  if (!range.startContainer || !range.endContainer) {
    throw new Error(
      "Unable to normalize range because one or both nodes are missing."
    );
  }
  const normalRange = range.cloneRange();
  if (range.startContainer === range.endContainer) {
    if (range.startOffset > range.endOffset) {
      normalRange.setStart(range.startContainer, range.endOffset);
      normalRange.setEnd(range.endContainer, range.startOffset);
    }
    return normalRange;
  }
  if (nodeIsAfter(range.startContainer, range.endContainer)) {
    normalRange.setStart(range.endContainer, range.endOffset);
    normalRange.setEnd(range.startContainer, range.startOffset);
  }
  if (
    isTextNode(range.startContainer) &&
    range.startOffset === range.startContainer.textContent?.length
  ) {
    let nextLeafNode = getNextLeafNode(range.startContainer);
    while (nextLeafNode && isEmptyTextContent(nextLeafNode.textContent)) {
      nextLeafNode = getNextLeafNode(nextLeafNode);
    }
    if (nextLeafNode) {
      normalRange.setStart(nextLeafNode, 0);
    }
  }
  if (!isTextNode(range.endContainer) || range.endOffset === 0) {
    let prevLeafNode = getPreviousLeafNode(range.endContainer);
    // Skip insignificant whitespace in the HTML
    while (prevLeafNode && isEmptyTextContent(prevLeafNode.textContent)) {
      prevLeafNode = getPreviousLeafNode(prevLeafNode);
    }
    if (prevLeafNode) {
      normalRange.setEnd(
        prevLeafNode,
        prevLeafNode.nodeValue ? prevLeafNode.nodeValue.length : 0
      );
    }
  }
  return normalRange;
}

function isEmptyTextContent(text: string | null) {
  return text === null || text.trim().length === 0;
}
