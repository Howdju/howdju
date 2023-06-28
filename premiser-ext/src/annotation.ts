import { MediaExcerptInfo } from "howdju-common";

import { setNodeData } from "./node-data";
import {
  annotationClass,
  annotationIndexDataKey,
  annotationLevelClassPrefix,
  getAnnotationOf,
  isAnnotationNode,
} from "./annotate";
import { arrayInsertAfter, arrayInsertBefore } from "./util";

export const annotationMouseOverClass = "howdju-annotation-mouse-over";
export const annotationIndexClassPrefix = "howdju-annotation-index-";

export interface AnnotatedExcerpt {
  annotation: Annotation;
  mediaExcerptInfo: MediaExcerptInfo;
}

export class Annotation {
  index: number;
  nodes: HTMLElement[];
  level: number;

  _isMouseOver = false;
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
}
