import * as domAnchorTextQuote from 'dom-anchor-text-quote'

class Target {
  constructor(url, anchors, date) {
    this.url = url
    this.anchors = anchors
    this.date = date
  }
}

export function toTarget(selection) {
  const anchors = []

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i)
    const anchor = toAnchor(range)
    anchors.push(anchor)
  }

  const url = window.location.href
  const date = new Date()

  return new Target(url, anchors, date)
}

class TextQuoteAnchor {
  constructor({exact, prefix, suffix}) {
    this.type = 'TextQuote'
    this.exact = exact
    this.prefix = prefix
    this.suffix = suffix
  }
}

function toAnchor(range) {
  const anchor = domAnchorTextQuote.fromRange(document.body, range)
  return new TextQuoteAnchor(anchor)
}
