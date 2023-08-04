import { isUrl, normalizeUrl } from "howdju-common";

export function urlEquivalent(
  url1: string | undefined,
  url2: string | undefined
) {
  if (!isUrl(url1) || !isUrl(url2)) {
    return false;
  }
  return normalizeUrl(url1) === normalizeUrl(url2);
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
