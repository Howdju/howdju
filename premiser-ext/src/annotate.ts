import concat from "lodash/concat";
import { isUndefined } from "lodash";

import { logger, UrlTarget } from "howdju-common";
import {
  getSelection,
  clearSelection,
  getCommonAncestor,
  nodeIsBefore,
  normalizeNodes,
  isCoextensive,
  insertNodeAfter,
  insertNodeBefore,
  selectionToAnchorInfo,
  targetToRanges,
} from "howdju-client-common";

import { getNodeData } from "./node-data";
import { AnnotatedExcerpt, Annotation } from "./annotation";

export const annotationClass = "howdju-annotation";
export const annotationLevelClassPrefix = "howdju-annotation-level-";
export const annotationTagName = "span";
export const annotationIndexDataKey = "annotationIndexDataKey";
export const annotationLevelStyleElementId = "howdju-annotation-level-styles";

let maxAnnotationLevel = 0;
export const annotations: Annotation[] = [];

export function annotateSelection(): AnnotatedExcerpt | undefined {
  const selection = getSelection();
  if (!selection) {
    logger.warn("Selection was null, can't annotate it.");
    return;
  }
  if (isSelectionEmpty(selection)) {
    logger.warn("selection was empty, can't annotate it.");
    return;
  }

  // Get target before selection may change
  const anchorInfo = selectionToAnchorInfo(selection);

  const nodes = getNodesForSelection(selection);

  const annotation = getOrCreateAnnotation(nodes);

  // The selection can get messed up if we modify nodes within it.  For expediency, just clear it.  That also might be
  //  a reasonable UX choice, since the selection in a sense has been replaced with the annotation.
  clearSelection();

  return { annotation, mediaExcerptInfo: anchorInfo };
}

export function annotateTarget(target: UrlTarget) {
  const ranges = targetToRanges(target);
  const nodes = rangesToNodes(ranges);
  return getOrCreateAnnotation(nodes);
}

/** Returns an existing annotation if it's equivalent; only uses target if it returns a new annotation. */
function getOrCreateAnnotation(nodes: Node[]) {
  const equivalentAnnotation = getEquivalentAnnotation(nodes);
  if (equivalentAnnotation) {
    return equivalentAnnotation;
  }

  const annotation = annotateNodes(nodes);
  return annotation;
}

function rangesToNodes(ranges: Range[]) {
  const rangeNodes = [];
  for (const range of ranges) {
    rangeNodes.push(getNodesForRange(range));
  }
  return concat(...rangeNodes);
}

function isSelectionEmpty(selection: Selection) {
  return (
    selection.anchorNode === selection.focusNode &&
    selection.anchorOffset === selection.focusOffset
  );
}

/**
 * If the nodes are equal in number and each coextensive to an annotation's nodes, that annotation is equivalent to one we would create
 */
export function getEquivalentAnnotation(nodes: Node[]) {
  let partiallyCoextensiveAnnotationsByIndex: Record<number, Annotation> = {};
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
    const newAnnotationsByIndex: Record<number, Annotation> = {};
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
  const potentialEquivalentAnnotations = Object.values(
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

function getAnnotationsHavingCoextensiveNodes(node: Node) {
  const annotations = [];
  let curr: Node | null = node;
  while (curr) {
    const annotation = getAnnotationOf(curr);
    if (annotation && isCoextensive(curr, node)) {
      if (!annotation) {
        logger.error("Node missing annotation despite isAnnotationNode.");
      } else {
        annotations.push(annotation);
      }
    }
    curr = curr.parentElement;
  }
  return annotations;
}

function getNodesForSelection(selection: Selection) {
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

function getNodesForRange(range: Range) {
  const startNode = range.startContainer as HTMLElement;
  const startOffset = range.startOffset;
  const endNode = range.endContainer as HTMLElement;
  const endOffset = range.endOffset;
  return getNodesFor(startNode, startOffset, endNode, endOffset);
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

export function getNodesFor(
  startNode: Node,
  startOffset: number,
  endNode: Node,
  endOffset: number
) {
  const nodes = [];

  // if the start is at the very end of the content of a node, just move it ahead to the next node that has content
  // if the end is at the very start of the content of a node, just move it back to the next node having content

  if (startNode === endNode && isTextNode(startNode)) {
    const textNode =
      startOffset > 0 ? startNode.splitText(startOffset) : startNode;

    endOffset -= startOffset;
    const textNodeValueLength = textNode.nodeValue
      ? textNode.nodeValue.length
      : 0;
    if (endOffset < textNodeValueLength) {
      textNode.splitText(endOffset);
    }
    nodes.push(textNode);
    return nodes;
  }

  let lastValidAscendingNode;
  const commonAncestor = getCommonAncestor(startNode, endNode);

  if (isTextNode(startNode) && startOffset > 0) {
    // startNode modified to start after the offset
    startNode = startNode.splitText(startOffset);
  }
  // Start by ascending the tree
  let curr: Node | null = startNode;
  while (curr && curr !== commonAncestor && !curr.contains(endNode)) {
    nodes.push(curr);
    lastValidAscendingNode = curr;
    if (curr.nextSibling) {
      curr = curr.nextSibling;
    } else {
      if (!curr.parentElement) {
        throw new Error(
          "Unable to get nodes because parentElement was missing"
        );
      }
      curr = curr.parentElement.nextSibling;
    }
  }

  const endNodeValueLength = endNode.nodeValue ? endNode.nodeValue.length : 0;
  if (isTextNode(endNode) && endOffset < endNodeValueLength) {
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
      if (!curr.parentElement) {
        throw new Error(
          "Unable to get nodes because parentElement was missing"
        );
      }
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
      if (!curr.parentElement) {
        throw new Error(
          "Unable to get nodes because parentElement was missing"
        );
      }
      curr = curr.parentElement.previousSibling;
    }
  }

  return nodes;
}

export function annotateNodes(targetNodes: Node[]) {
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

function createAnnotation(targetNodes: Node[]) {
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

function ensureSufficientAnnotationLevelStyles(annotations: Annotation[]) {
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

function createAndInsertAnnotationNodes(targetNodes: Node[]) {
  const firstNode = targetNodes[0];
  const annotationNodes = [];
  for (const targetNode of targetNodes) {
    annotationNodes.push(createAndInsertAnnotationNode(firstNode, targetNode));
  }
  return annotationNodes;
}

export function createAndInsertAnnotationNode(
  firstTargetNode: Node,
  targetNode: Node
) {
  const annotationNode = createAnnotationNode();
  let ancestorAnnotationNodes;
  const targetNodeAnnotation = getAnnotationOf(targetNode);
  if (targetNodeAnnotation) {
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
      if (!ancestorAnnotation) {
        logger.error("No ancestor although should have been.");
        continue;
      }
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

function splitAnnotationNode(annotationNode: Element, pivotNode: Node) {
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
  if (!annotation) {
    throw new Error("Cannot split annotation of node that has no annotation.");
  }
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

function cloneWithChildren<E extends Element>(
  templateNode: E,
  children: Node[],
  insert: typeof insertNodeBefore | typeof insertNodeAfter
) {
  const isDeep = false;
  const cloneNode = templateNode.cloneNode(isDeep);
  for (const node of children) {
    cloneNode.appendChild(node);
  }
  insert(cloneNode, templateNode);
  return cloneNode as E;
}

function getAncestorAnnotationNodes(node: Node) {
  let curr: Node | null = node;
  const ancestorAnnotationNodes: Element[] = [];
  while (curr) {
    if (isAnnotationNode(curr)) {
      ancestorAnnotationNodes.push(curr);
    }
    curr = curr.parentElement;
  }
  return ancestorAnnotationNodes;
}

export function getAnnotationOf(annotationNode: Node) {
  const annotationIndex = getNodeData<number>(
    annotationNode,
    annotationIndexDataKey
  );
  if (isUndefined(annotationIndex)) {
    return undefined;
  }
  const annotation = annotations[annotationIndex];
  return annotation;
}

function createAnnotationNode() {
  const annotationNode = document.createElement(annotationTagName);
  return annotationNode;
}

function wrapNodeWith<N extends Node>(node: Node, wrapper: N) {
  if (!node.parentElement) {
    throw new Error("Cannot wrap node that lacks a parentElement.");
  }
  node.parentElement.insertBefore(wrapper, node);
  wrapper.appendChild(node);
  return wrapper;
}

function wrapNodeContentsWith(node: Node, wrapper: Node) {
  // can't iterate over node.childNodes because moving the child modifies the collection
  while (node.firstChild) {
    wrapper.appendChild(node.firstChild);
  }
  node.appendChild(wrapper);
}

function determineAnnotationLevel(annotationNodes: Node[]) {
  let maxNodeAnnotationLevel = 0;
  for (const node of annotationNodes) {
    const nodeAnnotationLevel = determineNodeAnnotationLevel(node);
    if (nodeAnnotationLevel > maxNodeAnnotationLevel) {
      maxNodeAnnotationLevel = nodeAnnotationLevel;
    }
  }
  return maxNodeAnnotationLevel;
}

function determineNodeAnnotationLevel(node: Node) {
  let maxAnnotationLevel = 1;
  let ancestorElement = node.parentElement;
  while (ancestorElement) {
    const ancestorAnnotation = getAnnotationOf(ancestorElement);
    if (ancestorAnnotation) {
      const annotationLevelFromAncestor = ancestorAnnotation.level + 1;
      if (annotationLevelFromAncestor > maxAnnotationLevel) {
        maxAnnotationLevel = annotationLevelFromAncestor;
      }
    }
    ancestorElement = ancestorElement.parentElement;
  }
  return maxAnnotationLevel;
}

export function isAnnotationNode(node: Node): node is Element {
  if (!("tagName" in node) || typeof node.tagName !== "string") {
    return false;
  }
  // (the document doesn't have a tag name, so check that it exists)
  return (
    node.tagName.toLowerCase() === annotationTagName &&
    (node as Element).classList.contains(annotationClass)
  );
}

function findIntersectingAnnotations(
  annotation: Annotation,
  seenAnnotationIndices: Set<number> = new Set()
): Annotation[] {
  const intersectingAnnotations = [];
  for (const node of annotation.nodes) {
    const annotationsIntersectingNode = findAnnotationsWithinNode(node);
    for (const intersectingAnnotation of annotationsIntersectingNode) {
      if (!seenAnnotationIndices.has(intersectingAnnotation.index)) {
        intersectingAnnotations.push(intersectingAnnotation);
        seenAnnotationIndices.add(intersectingAnnotation.index);
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

function findAnnotationsWithinNode(node: Node) {
  const annotations = [];

  const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
  while (treeWalker.nextNode()) {
    const currentNode = treeWalker.currentNode;
    const annotation = getAnnotationOf(currentNode);
    if (annotation) {
      annotations.push(annotation);
    }
  }

  return annotations;
}

function refreshAnnotationLevelStyles(annotationLevel: number) {
  const cssElement = getOrCreateAnnotationLevelStyleElement();
  const cssText = generateAnnotationLevelCssText(annotationLevel);
  updateStyles(cssElement, cssText);
}

function getOrCreateAnnotationLevelStyleElement() {
  const extantElement = document.getElementById(annotationLevelStyleElementId);
  if (extantElement) {
    return extantElement as HTMLStyleElement;
  }

  const element = document.createElement("style");
  element.id = annotationLevelStyleElementId;
  element.type = "text/css";
  document.getElementsByTagName("head")[0].appendChild(element);
  return element;
}

function generateAnnotationLevelCssText(annotationLevel: number) {
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

function updateStyles(styleElement: HTMLStyleElement, cssText: string) {
  if ("styleSheet" in styleElement) {
    (styleElement.styleSheet as any).cssText = cssText;
  } else {
    styleElement.childNodes.forEach((n) => styleElement.removeChild(n));
    styleElement.appendChild(document.createTextNode(cssText));
  }
}
