import isValidDomain from "is-valid-domain";

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

export function isUrl(text: string | undefined) {
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
