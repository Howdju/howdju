import {setNodeData} from './node-data'
import {
  annotationClass,
  annotationIndexDataKey,
  annotationLevelClassPrefix,
  getAnnotationOf,
  isAnnotationNode
} from './annotate'
import {logger} from 'howdju-client-common'
import {arrayInsertAfter, arrayInsertBefore} from './util'

export const annotationMouseOverClass = 'howdju-annotation-mouse-over'
export const annotationIndexClassPrefix = 'howdju-annotation-index-'

export class AnnotationContent {}

export class TextContent extends AnnotationContent {
  constructor(text) {
    super()
    this.type = 'text'
    this.title = document.title
    this.text = text
  }
}

export class Annotation {
  /**
   * Represents an annotation on the page.
   * @param index The index of the annotation in the annotations on the page.  Effectively an ID, but since we store
   *              the annotations in an array it is an index.
   * @param content The content that is annotated.
   * @param nodes The nodes that correspond to the annotation.
   * @param level The current level of the annotation.
   */
  constructor(index, nodes, level=1) {
    this.index = index
    this.nodes = nodes
    this.level = level
    this.anchor = null

    this.isMouseOver = false
    this.onMouseEnter = this.onMouseEnter.bind(this)
    this.onMouseOut = this.onMouseOut.bind(this)

    const annotationIndexClass = annotationIndexClassPrefix + this.index
    const annotationLevelClass = annotationLevelClassPrefix + this.level
    for (const node of this.nodes) {
      setNodeData(node, annotationIndexDataKey, this.index)
      node.classList.add(annotationClass, annotationIndexClass, annotationLevelClass)
      node.addEventListener('mouseenter', this.onMouseEnter, false)
    }
  }

  destructor() {
    for (const node of this.nodes) {
      node.removeEventListener(this.onMouseEnter)
    }
  }

  get isMouseOver() {
    return this._isMouseOver
  }

  set isMouseOver(value) {
    if (this._isMouseOver !== value) {
      for (const node of this.nodes) {
        if (value) {
          node.classList.add(annotationMouseOverClass)
          node.addEventListener('mouseout', this.onMouseOut, false)
        } else {
          node.classList.remove(annotationMouseOverClass)
          node.removeEventListener('mouseout', this.onMouseOut)
        }
      }
    }
    this._isMouseOver = value
  }

  incrementLevel() {
    const prevClass = annotationLevelClassPrefix + this.level
    this.level++
    const newClass = annotationLevelClassPrefix + this.level
    for (const node of this.nodes) {
      node.classList.replace(prevClass, newClass)
    }
  }

  insertNodeAfter(node, refNode) {
    setNodeData(node, annotationIndexDataKey, this.index)
    node.addEventListener('mouseenter', this.onMouseEnter, false)
    arrayInsertAfter(this.nodes, refNode, node)
  }

  insertNodeBefore(node, refNode) {
    setNodeData(node, annotationIndexDataKey, this.index)
    node.addEventListener('mouseenter', this.onMouseEnter, false)
    arrayInsertBefore(this.nodes, refNode, node)
  }

  onMouseEnter(e) {
    // Doesn't seem to be stopping bubbling
    e.stopPropagation()
    this.isMouseOver = true

    // set isMouseOver = false for all enclosing annotations
    let curr = e.currentTarget.parentElement
    while (curr) {
      if (isAnnotationNode(curr)) {
        const annotation = getAnnotationOf(curr)
        annotation.isMouseOver = false
      }
      curr = curr.parentElement
    }
  }

  onMouseOut() {
    this.isMouseOver = false
  }

  getContent() {
    const range = document.createRange()
    range.setStart(this.nodes[0], 0)
    const lastNode = this.nodes[this.nodes.length - 1]

    let endOffset = 0
    switch (lastNode.nodeType) {
      case Node.TEXT_NODE: {
        endOffset = lastNode.nodeValue.length
        break
      }
      case Node.ELEMENT_NODE: {
        endOffset = lastNode.childNodes.length
        break
      }
      default: {
        logger.error(`Unsupported annotation node type: ${lastNode.nodeType}`)
      }
    }

    range.setEnd(lastNode, endOffset)
    const text = range.toString()
    return new TextContent(text)
  }
}

