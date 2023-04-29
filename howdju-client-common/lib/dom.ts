import { logger } from "howdju-common";

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

export function nodeIsBefore(node1: Node, node2: Node) {
  return nodePositionCompare(node1, node2) < 0;
}

export function nodeIsAfter(node1: Node, node2: Node) {
  return nodePositionCompare(node1, node2) > 0;
}

export function nodeIsAfterOrSame(node1: Node, node2: Node) {
  return nodePositionCompare(node1, node2) >= 0;
}

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
