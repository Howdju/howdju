import * as textPosition from 'dom-anchor-text-position'
import * as textQuote from 'dom-anchor-text-quote'
import {UrlTargetAnchorType} from 'howdju-common'

export class Target {
  constructor(url, anchors, date) {
    this.url = url
    this.anchors = anchors
    this.date = date
  }
}

export function selectionToTarget(selection) {
  const anchors = []

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i)
    const anchor = rangeToAnchor(range)
    anchors.push(anchor)
  }

  const url = window.location.href
  const date = new Date()

  return new Target(url, anchors, date)
}

export class TextQuoteAnchor {
  constructor({exact, prefix, suffix}, {start, end}) {
    this.type = UrlTargetAnchorType.TEXT_QUOTE
    this.exact = exact
    this.prefix = prefix
    this.suffix = suffix
    this.start = start
    this.end = end
  }
}

function rangeToAnchor(range) {
  const position = textPosition.fromRange(document.body, range)
  const selector = textQuote.fromTextPosition(document.body, position)
  return new TextQuoteAnchor(selector, position)
}

export function targetToRanges(target) {
  const ranges = []
  for (const anchor of target.anchors) {
    let options = {}
    if (target.startOffset) {
      // The average of the start and end seems like a good idea
      const hint = (target.startOffset + target.endOffset) / 2
      options = {hint}
    }
    const selector = {
      exact: anchor.exactText,
      prefix: anchor.prefixText,
      suffix: anchor.suffixText
    }
    ranges.push(textQuote.toRange(document.body, selector, options))
  }
  return ranges
}
