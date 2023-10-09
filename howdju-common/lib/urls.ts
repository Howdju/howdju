import isValidDomain from "is-valid-domain";
import normalizeUrlNpm, { Options as NormalizeUrlOptions } from "normalize-url";

import { mergeCopy } from "./general";

export function extractDomain(url: string | undefined) {
  url = url?.trim();
  if (!url) {
    return undefined;
  }
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return undefined;
  }
}

/**
 * Returns true if text is a URL allowed by JavaScript. WARNING this includes
 * URLs with pseudo schemes like `javascript:` and `data:`. `javascript: URLs
 * can lead to XSS attacks.
 */
export function isUrl(text: string | undefined): text is string {
  text = text?.trim();
  if (!text) {
    return false;
  }
  try {
    new URL(text);
    return true;
  } catch (e) {
    return false;
  }
}

export function isDomain(text: string | undefined) {
  if (!text) {
    return false;
  }
  return isValidDomain(text);
}

export function removeQueryParamsAndFragment(url: string) {
  const i = url.indexOf("?");
  if (i > -1) {
    return url.substring(0, i);
  }
  const j = url.indexOf("#");
  if (j > -1) {
    return url.substring(0, j);
  }
  return url;
}

/**
 * Normalizes a URL.
 *
 * - Add https scheme if the URL has no scheme
 * - Remove text fragment
 * - Remove common tracking query parameters
 * - Remove trailing slash
 * - Sorts query parameters alphabetically
 */
export function normalizeUrl(url: string, options?: NormalizeUrlOptions) {
  if (!isUrl(url)) {
    throw new Error(`Invalid URL: ${url}`);
  }
  const urlObj = new URL(url);
  // According to https://en.wikipedia.org/wiki/URI_normalization#Normalization_process (linked from
  // https://github.com/sindresorhus/normalize-url) adding a trailing slash to a non-empty path
  // is a normalization that usually preserves semantics.
  //
  // Following that normalization results in normalized paths like https://domain.com/index.html/,
  // which looks weird and I wonder if a server will always return the right page if there is
  // a trailing slash after a path extension.
  //
  // normalize-url offers no option to force a trailing slash.
  return normalizeUrlNpm(
    urlObj.toString(),
    mergeCopy(
      {
        defaultProtocol: "https",
        stripWWW: false,
        // TODO(#494) Does this mean we could have https://domain.com/path unequivalent to https://domain.com/path/?
        removeTrailingSlash: false,
        removeSingleSlash: false,
      },
      options
    )
  );
}
