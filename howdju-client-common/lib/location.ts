import { isUndefined } from "lodash";

export function urlEquivalent(
  url1: string | undefined,
  url2: string | undefined
) {
  if (isUndefined(url1) || isUndefined(url2)) {
    return false;
  }
  // TODO something more sophisticated. E.g. ignore anchor in most cases, ignore query in many cases.
  return url1 === url2;
}

const canonicalUrlSelectorAttributes = [
  {
    selector: 'link[rel="canonical"]',
    attribute: "href",
  },
  {
    selector: 'meta[property="og:url"]',
    attribute: "content",
  },
  {
    selector: 'meta[property="url"]',
    attribute: "content",
  },
];

export function getCanonicalUrl() {
  for (const selectorAttribute of canonicalUrlSelectorAttributes) {
    const { selector, attribute } = selectorAttribute;
    const node = window.document.querySelector(selector);
    if (node) {
      const url = node.getAttribute(attribute);
      if (url) {
        return url;
      }
    }
  }
  return undefined;
}

export function getCurrentUrl() {
  return window.document.location.href;
}

export function getCanonicalOrCurrentUrl() {
  return getCanonicalUrl() || getCurrentUrl();
}
