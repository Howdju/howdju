import { setNodeData } from "./node-data";
import {
  annotationClass,
  annotationIndexDataKey,
  annotationLevelClassPrefix,
  getAnnotationOf,
  isAnnotationNode,
} from "./annotate";
import { logger } from "howdju-common";
import { arrayInsertAfter, arrayInsertBefore } from "./util";
import { Target, TextAnchor } from "./target";

export const annotationMouseOverClass = "howdju-annotation-mouse-over";
export const annotationIndexClassPrefix = "howdju-annotation-index-";

export class AnnotationContent {}

export class TextContent extends AnnotationContent {
  type: "text";
  title: string;
  text: string;

  constructor(text: string) {
    super();
    this.type = "text";
    this.title = document.title;
    this.text = text;
  }
}

export class Annotation {
  index: number;
  nodes: HTMLElement[];
  level: number;
  anchor: TextAnchor | undefined;
  // DO_NOT_MERGE do we need both anchor and target?
  target: Target | undefined;

  _isMouseOver: boolean = false;
  onMouseEnterBound;
  onMouseOutBound;

  /**
   * Represents an annotation on the page.
   * @param index The index of the annotation in the annotations on the page.  Effectively an ID, but since we store
   *              the annotations in an array it is an index.
   * @param content The content that is annotated.
   * @param nodes The nodes that correspond to the annotation.
   * @param level The current level of the annotation.
   */
  constructor(index: number, nodes: HTMLElement[], level = 1) {
    this.index = index;
    this.nodes = nodes;
    this.level = level;
    this.anchor = undefined;

    this.isMouseOver = false;
    this.onMouseEnterBound = this.onMouseEnter.bind(this);
    this.onMouseOutBound = this.onMouseOut.bind(this);

    const annotationIndexClass = `${annotationIndexClassPrefix}${this.index}`;
    const annotationLevelClass = `${annotationLevelClassPrefix}${this.level}`;
    for (const node of this.nodes) {
      setNodeData(node, annotationIndexDataKey, this.index);
      node.classList.add(
        annotationClass,
        annotationIndexClass,
        annotationLevelClass
      );
      node.addEventListener("mouseenter", this.onMouseEnterBound, false);
    }
  }

  destructor() {
    for (const node of this.nodes) {
      node.removeEventListener("mouseenter", this.onMouseEnterBound);
    }
  }

  get isMouseOver() {
    return this._isMouseOver;
  }

  set isMouseOver(value) {
    if (this._isMouseOver !== value) {
      for (const node of this.nodes) {
        if (value) {
          node.classList.add(annotationMouseOverClass);
          node.addEventListener("mouseout", this.onMouseOutBound, false);
        } else {
          node.classList.remove(annotationMouseOverClass);
          node.removeEventListener("mouseout", this.onMouseOutBound);
        }
      }
    }
    this._isMouseOver = value;
  }

  incrementLevel() {
    const prevClass = `${annotationLevelClassPrefix}${this.level}`;
    this.level++;
    const newClass = `${annotationLevelClassPrefix}${this.level}`;
    for (const node of this.nodes) {
      node.classList.replace(prevClass, newClass);
    }
  }

  insertNodeAfter(node: Element, refNode: Node) {
    setNodeData(node, annotationIndexDataKey, this.index);
    node.addEventListener("mouseenter", this.onMouseEnterBound, false);
    arrayInsertAfter(this.nodes, refNode, node);
  }

  insertNodeBefore(node: Element, refNode: Node) {
    setNodeData(node, annotationIndexDataKey, this.index);
    node.addEventListener("mouseenter", this.onMouseEnterBound, false);
    arrayInsertBefore(this.nodes, refNode, node);
  }

  onMouseEnter(e: Event) {
    // Doesn't seem to be stopping bubbling
    e.stopPropagation();
    this.isMouseOver = true;

    // set isMouseOver = false for all enclosing annotations
    let curr: Element | null =
      e.currentTarget && "parentElement" in e.currentTarget
        ? (e.currentTarget.parentElement as Element)
        : null;
    while (curr) {
      if (isAnnotationNode(curr)) {
        const annotation = getAnnotationOf(curr);
        if (annotation) {
          annotation.isMouseOver = false;
        }
      }
      curr = curr.parentElement;
    }
  }

  onMouseOut() {
    this.isMouseOver = false;
  }

  getContent() {
    const range = document.createRange();
    range.setStart(this.nodes[0], 0);
    const lastNode = this.nodes[this.nodes.length - 1];

    let endOffset = 0;
    switch (lastNode.nodeType) {
      case Node.TEXT_NODE: {
        endOffset = lastNode.nodeValue!.length;
        break;
      }
      case Node.ELEMENT_NODE: {
        endOffset = lastNode.childNodes.length;
        break;
      }
      default: {
        logger.error(`Unsupported annotation node type: ${lastNode.nodeType}`);
      }
    }

    range.setEnd(lastNode, endOffset);
    const text = range.toString();
    return new TextContent(text);
  }
}
