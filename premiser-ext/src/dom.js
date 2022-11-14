export function getSelection() {
  return document.getSelection();
}

export function clearSelection() {
  if (window.getSelection) {
    if (window.getSelection().empty) {
      // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {
      // Firefox
      window.getSelection().removeAllRanges();
    }
  } else if (document.selection) {
    // IE?
    document.selection.empty();
  }
}

export function normalizeNodes(nodes) {
  for (const node of nodes) {
    node.normalize();
  }
}

export function getCommonAncestor(node1, node2) {
  if (!node1 || !node2) {
    throw new Error(
      "cannot get common ancestor when one or both nodes are missing"
    );
  }
  if (node1 === node2) {
    return node1;
  }

  let ancestor = node1;
  while (!ancestor.contains(node2)) {
    ancestor = ancestor.parentElement;
  }

  return ancestor;
}

export function nodeIsBefore(node1, node2) {
  return nodePositionCompare(node1, node2) < 0;
}

export function nodeIsAfter(node1, node2) {
  return nodePositionCompare(node1, node2) > 0;
}

export function nodeIsAfterOrSame(node1, node2) {
  return nodePositionCompare(node1, node2) >= 0;
}

export function nodePositionCompare(node1, node2) {
  if (node1 === node2) {
    return 0;
  } else if (node1.contains(node2)) {
    return -1;
  } else if (node2.contains(node1)) {
    return 1;
  }

  // Get the two ancestors that are children of the common ancestor and contain each the two nodes.
  let ancestor1 = node1;
  while (!ancestor1.parentNode.contains(node2)) {
    ancestor1 = ancestor1.parentNode;
  }

  let ancestor2 = node2;
  while (ancestor2.parentNode !== ancestor1.parentNode) {
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
export function isCoextensive(node1, node2) {
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
function hasSiblingsBetween(startNode, endNode) {
  let curr = startNode;
  while (curr && curr !== endNode) {
    if (curr.previousSibling || curr.nextSibling) {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

export function insertNodeAfter(node, refNode) {
  if (refNode.nextSibling) {
    refNode.parentNode.insertBefore(node, refNode.nextSibling);
  } else {
    refNode.parentNode.appendChild(node);
  }
}

export function insertNodeBefore(node, refNode) {
  refNode.parentNode.insertBefore(node, refNode);
}

export function getPreviousLeafNode(node) {
  // previousSibling is null for first child of a node
  while (!node.previousSibling) {
    node = node.parentNode;
  }
  node = node.previousSibling;
  while (node.childNodes.length) {
    node = node.childNodes[node.childNodes.length - 1];
  }
  return node;
}
