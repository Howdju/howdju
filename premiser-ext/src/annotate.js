import concat from "lodash/concat";

import { logger } from "howdju-common";

import { getNodeData } from "./node-data";
import { objectValues } from "./util";
import {
  getSelection,
  clearSelection,
  getCommonAncestor,
  nodeIsBefore,
  normalizeNodes,
  isCoextensive,
  insertNodeAfter,
  insertNodeBefore,
} from "./dom";
import { selectionToTarget, targetToRanges } from "./target";
import { Annotation } from "./annotation";

export const annotationClass = "howdju-annotation";
export const annotationLevelClassPrefix = "howdju-annotation-level-";
export const annotationTagName = "span";
export const annotationIndexDataKey = "annotationIndexDataKey";
export const annotationLevelStyleElementId = "howdju-annotation-level-styles";

let maxAnnotationLevel = 0;
export const annotations = [];

export function annotateSelection() {
  const selection = getSelection();
  if (isSelectionEmpty(selection)) {
    logger.debug("selection was empty, returning");
  }

  // Get target before selection may change
  const target = selectionToTarget(selection);

  const nodes = getNodesForSelection(selection);

  const annotation = getOrCreateAnnotation(nodes, target);

  // The selection can get messed up if we modify nodes within it.  For expediency, just clear it.  That also might be
  //  a reasonable UX choice, since the selection in a sense has been replaced with the annotation.
  clearSelection();

  return annotation;
}

export function annotateTarget(target) {
  const ranges = targetToRanges(target);
  const nodes = rangesToNodes(ranges);
  return getOrCreateAnnotation(nodes, target);
}

/** Returns an existing annotation if it's equivalent; only uses target if it returns a new annotation. */
function getOrCreateAnnotation(nodes, target) {
  const equivalentAnnotation = getEquivalentAnnotation(nodes);
  if (equivalentAnnotation) {
    return equivalentAnnotation;
  }

  const annotation = annotateNodes(nodes);
  annotation.target = target;
  return annotation;
}

function rangesToNodes(ranges) {
  const rangeNodes = [];
  for (const range of ranges) {
    rangeNodes.push(getNodesForRange(range));
  }
  return concat.apply(null, rangeNodes);
}

function isSelectionEmpty(selection) {
  return (
    selection.anchorNode === selection.extentNode &&
    selection.anchorOffset === selection.extentOffset
  );
}

/**
 * If the nodes are equal in number and each coextensive to an annotation's nodes, that annotation is equivalent to one we would create
 */
export function getEquivalentAnnotation(nodes) {
  let partiallyCoextensiveAnnotationsByIndex = {};
  if (nodes.length < 1) {
    return null;
  }

  // Initialize the annotations from the first node
  const firstNode = nodes[0];
  const partiallyCoextensiveAnnotations =
    getAnnotationsHavingCoextensiveNodes(firstNode);
  for (const annotation of partiallyCoextensiveAnnotations) {
    partiallyCoextensiveAnnotationsByIndex[annotation.index] = annotation;
  }

  // Then only keep the annotations that continue to be coextensive with the remaining nodes
  for (let i = 1; i < nodes.length; i++) {
    const node = nodes[i];
    const annotationsCoextensiveWithNode =
      getAnnotationsHavingCoextensiveNodes(node);
    const newAnnotationsByIndex = {};
    for (const encompassingAnnotation of annotationsCoextensiveWithNode) {
      if (
        partiallyCoextensiveAnnotationsByIndex[encompassingAnnotation.index]
      ) {
        newAnnotationsByIndex[encompassingAnnotation.index] =
          encompassingAnnotation;
      }
    }
    // If we rule out all encompassing annotations, we can't add more
    if (Object.keys(newAnnotationsByIndex).length < 1) break;
    partiallyCoextensiveAnnotationsByIndex = newAnnotationsByIndex;
  }

  // annotations can be co-extensive with all of the nodes but still non-equivalent if they have an unequal number of nodes
  const potentialEquivalentAnnotations = objectValues(
    partiallyCoextensiveAnnotationsByIndex
  );
  const equivalentAnnotations = [];
  for (const annotation of potentialEquivalentAnnotations) {
    if (annotation.nodes.length === nodes.length) {
      equivalentAnnotations.push(annotation);
    }
  }

  if (equivalentAnnotations.length > 1) {
    logger.error(
      `multiple equivalent annotations`,
      nodes,
      partiallyCoextensiveAnnotationsByIndex
    );
  }
  return equivalentAnnotations.length ? equivalentAnnotations[0] : null;
}

function getAnnotationsHavingCoextensiveNodes(node) {
  const annotations = [];
  let curr = node;
  while (curr) {
    if (isAnnotationNode(curr) && isCoextensive(curr, node)) {
      annotations.push(getAnnotationOf(curr));
    }
    curr = curr.parentElement;
  }
  return annotations;
}

function getNodesForSelection(selection) {
  const nodes = [];

  if (selection.anchorNode) {
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      const nodesForRange = getNodesForRange(range);
      for (const nodeForRange of nodesForRange) {
        nodes.push(nodeForRange);
      }
    }
  }

  return nodes;
}

function getNodesForRange(range) {
  const startNode = range.startContainer;
  const startOffset = range.startOffset;
  const endNode = range.endContainer;
  const endOffset = range.endOffset;
  return getNodesFor(startNode, startOffset, endNode, endOffset);
}

export function getNodesFor(startNode, startOffset, endNode, endOffset) {
  const nodes = [];

  // if the start is at the very end of the content of a node, just move it ahead to the next node that has content
  // if the end is at the very start of the content of a node, just move it back to the next node having content

  if (startNode === endNode && startNode.nodeType === Node.TEXT_NODE) {
    if (startOffset > 0) {
      startNode = startNode.splitText(startOffset);
    }
    endOffset -= startOffset;
    if (endOffset < startNode.nodeValue.length) {
      startNode.splitText(endOffset);
    }
    nodes.push(startNode);
    return nodes;
  }

  let lastValidAscendingNode;
  const commonAncestor = getCommonAncestor(startNode, endNode);

  if (startNode.nodeType === Node.TEXT_NODE && startOffset > 0) {
    // startNode modified to start after the offset
    startNode = startNode.splitText(startOffset);
  }
  // Start by ascending the tree
  let curr = startNode;
  while (curr && curr !== commonAncestor && !curr.contains(endNode)) {
    nodes.push(curr);
    lastValidAscendingNode = curr;
    if (curr.nextSibling) {
      curr = curr.nextSibling;
    } else {
      curr = curr.parentElement.nextSibling;
    }
  }

  if (
    endNode.nodeType === Node.TEXT_NODE &&
    endOffset < endNode.nodeValue.length
  ) {
    // endNode modified to contain text up to endOffset
    endNode.splitText(endOffset);
  }
  curr = endNode;

  // When a user selects a paragraph by triple-click, the end of the selection is the next paragraph at offset 0
  // We don't want to include this in the annotation
  if (endNode.nodeType === Node.ELEMENT_NODE && endOffset === 0) {
    if (curr.previousSibling) {
      curr = curr.previousSibling;
    } else {
      curr = curr.parentElement.previousSibling;
    }
  }

  while (
    curr &&
    curr !== lastValidAscendingNode &&
    curr !== commonAncestor &&
    !curr.contains(startNode)
  ) {
    nodes.push(curr);
    if (curr.previousSibling) {
      curr = curr.previousSibling;
    } else {
      curr = curr.parentElement.previousSibling;
    }
  }

  return nodes;
}

export function annotateNodes(targetNodes) {
  const annotation = createAnnotation(targetNodes);

  const intersectedAnnotations = findIntersectingAnnotations(annotation);
  for (const intersectedAnnotation of intersectedAnnotations) {
    intersectedAnnotation.incrementLevel();
  }

  normalizeNodes(targetNodes);

  ensureSufficientAnnotationLevelStyles(
    intersectedAnnotations.concat(annotation)
  );

  return annotation;
}

function createAnnotation(targetNodes) {
  const annotationNodes = createAndInsertAnnotationNodes(targetNodes);
  const annotationLevel = determineAnnotationLevel(annotationNodes);
  const annotation = new Annotation(
    annotations.length,
    annotationNodes,
    annotationLevel
  );
  annotations.push(annotation);
  return annotation;
}

function ensureSufficientAnnotationLevelStyles(annotations) {
  let doUpdateAnnotationLevelStyles = false;
  for (const annotation of annotations) {
    if (annotation.level > maxAnnotationLevel) {
      maxAnnotationLevel = annotation.level;
      doUpdateAnnotationLevelStyles = true;
    }
  }

  if (doUpdateAnnotationLevelStyles) {
    refreshAnnotationLevelStyles(maxAnnotationLevel);
  }
}

function createAndInsertAnnotationNodes(targetNodes) {
  const firstNode = targetNodes[0];
  const annotationNodes = [];
  for (const targetNode of targetNodes) {
    annotationNodes.push(createAndInsertAnnotationNode(firstNode, targetNode));
  }
  return annotationNodes;
}

export function createAndInsertAnnotationNode(firstTargetNode, targetNode) {
  const annotationNode = createAnnotationNode();
  let ancestorAnnotationNodes;
  if (isAnnotationNode(targetNode)) {
    const targetNodeAnnotation = getAnnotationOf(targetNode);
    if (nodeIsBefore(firstTargetNode, targetNodeAnnotation.nodes[0])) {
      wrapNodeWith(targetNode, annotationNode);
    } else {
      wrapNodeContentsWith(targetNode, annotationNode);
    }
  } else if (
    (ancestorAnnotationNodes = getAncestorAnnotationNodes(targetNode)).length
  ) {
    let didInsert = false;
    for (const ancestorAnnotationNode of ancestorAnnotationNodes) {
      splitAnnotationNode(ancestorAnnotationNode, targetNode);
      // Go up the ancestors until we find one that starts before the first target node
      const ancestorAnnotation = getAnnotationOf(ancestorAnnotationNode);
      if (
        !didInsert &&
        nodeIsBefore(ancestorAnnotation.nodes[0], firstTargetNode)
      ) {
        // The new annotation should wrap the contents of the first ancestor that starts before it
        wrapNodeContentsWith(ancestorAnnotationNode, annotationNode);
        didInsert = true;
      }
    }
    if (!didInsert) {
      const ancestorAnnotationNode =
        ancestorAnnotationNodes[ancestorAnnotationNodes.length - 1];
      wrapNodeWith(ancestorAnnotationNode, annotationNode);
    }
  } else if (targetNode.nodeType === Node.TEXT_NODE) {
    // Text node don't have contents; they are the contents.  So wrap them.
    wrapNodeWith(targetNode, annotationNode);
  } else {
    // Otherwise, wrap the contents of the node
    wrapNodeContentsWith(targetNode, annotationNode);
  }
  return annotationNode;
}

function splitAnnotationNode(annotationNode, pivotNode) {
  const beforePivotChildren = [];
  const afterPivotChildren = [];
  let isPastPivot = false;
  for (const childNode of annotationNode.childNodes) {
    if (childNode.contains(pivotNode)) {
      isPastPivot = true;
    } else if (isPastPivot) {
      afterPivotChildren.push(childNode);
    } else {
      beforePivotChildren.push(childNode);
    }
  }

  const annotation = getAnnotationOf(annotationNode);
  let beforeClone = null,
    afterClone = null;
  if (beforePivotChildren.length) {
    beforeClone = cloneWithChildren(
      annotationNode,
      beforePivotChildren,
      insertNodeBefore
    );
    annotation.insertNodeBefore(beforeClone, annotationNode);
  }
  if (afterPivotChildren.length) {
    afterClone = cloneWithChildren(
      annotationNode,
      afterPivotChildren,
      insertNodeAfter
    );
    annotation.insertNodeAfter(afterClone, annotationNode);
  }

  return { beforeClone, afterClone };
}

function cloneWithChildren(templateNode, children, insert) {
  const isDeep = false;
  const cloneNode = templateNode.cloneNode(isDeep);
  for (const node of children) {
    cloneNode.appendChild(node);
  }
  insert(cloneNode, templateNode);
  return cloneNode;
}

function getAncestorAnnotationNodes(node) {
  let curr = node,
    ancestorAnnotationNodes = [];
  while (curr) {
    if (isAnnotationNode(curr)) {
      ancestorAnnotationNodes.push(curr);
    }
    curr = curr.parentElement;
  }
  return ancestorAnnotationNodes;
}

export function getAnnotationOf(annotationNode) {
  const annotationIndex = getNodeData(annotationNode, annotationIndexDataKey);
  const annotation = annotations[annotationIndex];
  return annotation;
}

function createAnnotationNode() {
  const annotationNode = document.createElement(annotationTagName);
  return annotationNode;
}

function wrapNodeWith(node, wrapper) {
  node.parentElement.insertBefore(wrapper, node);
  wrapper.appendChild(node);
}

function wrapNodeContentsWith(node, wrapper) {
  // can't iterate over node.childNodes because moving the child modifies the collection
  while (node.firstChild) {
    wrapper.appendChild(node.firstChild);
  }
  node.appendChild(wrapper);
}

function determineAnnotationLevel(annotationNodes) {
  let maxNodeAnnotationLevel = 0;
  for (const node of annotationNodes) {
    const nodeAnnotationLevel = determineNodeAnnotationLevel(node);
    if (nodeAnnotationLevel > maxNodeAnnotationLevel) {
      maxNodeAnnotationLevel = nodeAnnotationLevel;
    }
  }
  return maxNodeAnnotationLevel;
}

function determineNodeAnnotationLevel(node) {
  let maxAnnotationLevel = 1;
  let ancestorElement = node.parentElement;
  while (ancestorElement) {
    if (isAnnotationNode(ancestorElement)) {
      const ancestorAnnotation = getAnnotationOf(ancestorElement);
      const annotationLevelFromAncestor = ancestorAnnotation.level + 1;
      if (annotationLevelFromAncestor > maxAnnotationLevel) {
        maxAnnotationLevel = annotationLevelFromAncestor;
      }
    }
    ancestorElement = ancestorElement.parentElement;
  }
  return maxAnnotationLevel;
}

export function isAnnotationNode(node) {
  // (the document doesn't have a tag name, so check that it exists)
  return (
    node.tagName &&
    node.tagName.toLowerCase() === annotationTagName &&
    node.classList.contains(annotationClass)
  );
}

function findIntersectingAnnotations(annotation, seenAnnotationIndices = null) {
  if (!seenAnnotationIndices) {
    seenAnnotationIndices = {};
  }
  const intersectingAnnotations = [];
  for (const node of annotation.nodes) {
    const annotationsIntersectingNode = findAnnotationsWithinNode(node);
    for (const intersectingAnnotation of annotationsIntersectingNode) {
      if (!seenAnnotationIndices[intersectingAnnotation.index]) {
        intersectingAnnotations.push(intersectingAnnotation);
        seenAnnotationIndices[intersectingAnnotation.index] = true;
        const recursiveAnnotations = findIntersectingAnnotations(
          intersectingAnnotation,
          seenAnnotationIndices
        );
        // the annotations will already have been deduped using foundAnnotationIndices, so we can add them directly
        for (const recursiveAnnotation of recursiveAnnotations) {
          intersectingAnnotations.push(recursiveAnnotation);
        }
      }
    }
  }
  return intersectingAnnotations;
}

function findAnnotationsWithinNode(node) {
  const annotations = [];

  const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
  while (treeWalker.nextNode()) {
    const currentNode = treeWalker.currentNode;
    if (isAnnotationNode(currentNode)) {
      const annotation = getAnnotationOf(currentNode);
      annotations.push(annotation);
    }
  }

  return annotations;
}

function refreshAnnotationLevelStyles(annotationLevel) {
  const cssElement = getOrCreateAnnotationLevelStyleElement();
  const cssText = generateAnnotationLevelCssText(annotationLevel);
  updateStyles(cssElement, cssText);
}

function getOrCreateAnnotationLevelStyleElement() {
  let annotationLevelStyleElement = document.getElementById(
    annotationLevelStyleElementId
  );
  if (!annotationLevelStyleElement) {
    annotationLevelStyleElement = document.createElement("style");
    annotationLevelStyleElement.id = annotationLevelStyleElementId;
    annotationLevelStyleElement.type = "text/css";
    document
      .getElementsByTagName("head")[0]
      .appendChild(annotationLevelStyleElement);
  }
  return annotationLevelStyleElement;
}

function generateAnnotationLevelCssText(annotationLevel) {
  const baseLineHeight = 26;
  const lineHeightIncrement = 4;

  const rules = [];
  for (let level = 1; level <= annotationLevel; level++) {
    rules.push(`.${annotationLevelClassPrefix}${level} {
      line-height: ${baseLineHeight + level * lineHeightIncrement}px;
      padding-bottom: ${level * lineHeightIncrement}px
    }`);
  }
  return rules.join(" ");
}

function updateStyles(styleElement, cssText) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = cssText;
  } else {
    styleElement.childNodes.forEach((n) => styleElement.removeChild(n));
    styleElement.appendChild(document.createTextNode(cssText));
  }
}
