export function urlEquivalent(url1, url2) {
  // TODO something more sophisticated. E.g. ignore anchor in most cases, ignore query in many cases.
  return url1 === url2
}

const canonicalUrlSelectorAttributes = [
  {
    selector: 'link[rel="canonical"]',
    attribute: 'href'
  },
  {
    selector: 'meta[property="og:url"]',
    attribute: 'content'
  },
  {
    selector: 'meta[property="url"]',
    attribute: 'content'
  },
]

export function getCurrentCanonicalUrl() {
  for (const selectorAttribute of canonicalUrlSelectorAttributes) {
    const node = window.document.querySelector(selectorAttribute['selector'])
    if (node) {
      const url = node.getAttribute(selectorAttribute['attribute'])
      if (url) {
        return url
      }
    }
  }
  return window.document.location.href
}
