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
    // TODO persist the position and use it as a hint
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
    // TODO figure out how to use target.start/.end as a hint.
    const options = target.start ? {hint: target.start} : {}
    ranges.push(textQuote.toRange(document.body, target, options))
  }
  return ranges
}
