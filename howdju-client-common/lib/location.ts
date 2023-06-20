import { logger, UrlLocatorView } from "howdju-common";
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

export function toUrlWithFragment(
  urlLocator: UrlLocatorView,
  // TODO(427) fix prefix/suffix to be Chrome-compatible.
  useContext = false
) {
  // https://example.com#:~:text=[prefix-,]textStart[,textEnd][,-suffix]&...
  const urlObj = new URL(urlLocator.url.url);
  // TODO(38) what to do if the hash already contains a fragment? Overwrite it? We should probably
  // remove fragments from the URL before saving it to the database.
  if (urlObj.hash.includes(":~:")) {
    logger.error(`URL ${urlLocator.url.url} already contains a fragment.`);
  }
  // For now, just ignore the hash if it already contains a fragment.
  const hash = urlObj.hash.includes(":~:") ? "" : urlObj.hash.replace(/^#/, "");
  const textFragments = urlLocator.anchors?.map((a) => {
    const parts = [];
    if (useContext && a.prefixText) {
      parts.push(cleanTextFragmentPart(a.prefixText) + "-");
    }
    parts.push(cleanTextFragmentPart(a.exactText));
    if (useContext && a.suffixText) {
      parts.push("-" + cleanTextFragmentPart(a.suffixText));
    }
    return `text=${parts.join(",")}`;
  });
  const fragmentHash = textFragments?.length
    ? `#${hash}:~:${textFragments.join("&")}`
    : hash
    ? `#${hash}`
    : "";
  urlObj.hash = fragmentHash;
  return urlObj.toString();
}

function cleanTextFragmentPart(fragmentPart: string) {
  return encodeURIComponent(fragmentPart.replace(/\n/g, ""));
}
