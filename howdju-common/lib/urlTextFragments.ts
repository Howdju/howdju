import { isDefined, logger, UrlLocator } from "howdju-common";

export function toUrlWithFragment(
  urlLocator: UrlLocator,
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
  const textDirectives = urlLocator.anchors?.map((a) => {
    const parameters = [];
    if (useContext && a.prefixText) {
      parameters.push(cleanTextFragmentParameter(a.prefixText) + "-");
    }
    parameters.push(cleanTextFragmentParameter(a.exactText));
    if (useContext && a.suffixText) {
      parameters.push("-" + cleanTextFragmentParameter(a.suffixText));
    }
    return `text=${parameters.join(",")}`;
  });
  const fragmentHash = textDirectives?.length
    ? `#${hash}:~:${textDirectives.join("&")}`
    : hash
    ? `#${hash}`
    : "";
  urlObj.hash = fragmentHash;
  return urlObj.toString();
}

function cleanTextFragmentParameter(textParameter: string) {
  return encodeTextFragmentParameter(textParameter.replace(/\n/g, ""));
}

function encodeTextFragmentParameter(textParameter: string) {
  // The text fragment spec requires percent-encoding ampersand, comma, and dash.
  // https://wicg.github.io/scroll-to-text-fragment/#fragmentdirective:~:text=The%20text%20parameters%20are%20percent%2Ddecoded%20before%20matching.%20Dash%20(%2D)%2C%20ampersand%20(%26)%2C%20and%20comma%20(%2C)%20characters%20in%20text%20parameters%20are%20percent%2Dencoded%20to%20avoid%20being%20interpreted%20as%20part%20of%20the%20text%20directive%20syntax.
  // encodeURIComponent encodes ampersand and comma, but not dash. decodeURIComponent will decode all three.
  return encodeURIComponent(textParameter).replace("-", "%2D");
}

export function extractQuotationFromTextFragment(
  url: string,
  options = {
    /** The text used to join text directives. */
    textDirectiveDelimiter: "…",
    /** The text used to join textStart and textEnd. */
    textParameterStartEndDelimiter: "…",
  }
): string | undefined {
  const urlObj = new URL(url);
  const hash = urlObj.hash.replace(/^#/, "");
  const fragmentMatch = hash.match(/^:~:(.*)$/);
  if (!fragmentMatch) {
    return undefined;
  }
  const fragmentDirective = fragmentMatch[1];
  const fragmentDirectiveParts = fragmentDirective.split("&");
  const quoteParts = fragmentDirectiveParts.map((directive) => {
    if (!directive.startsWith("text=")) {
      logger.error(`Text directive must start with "text=": ${directive}`);
      return undefined;
    }
    const textParameters = directive.replace(/^text=/, "").split(",");
    if (textParameters.length === 1) {
      return textParameters[0];
    }
    if (textParameters.length === 3) {
      return textParameters[1];
    }
    if (textParameters.length === 4) {
      return (
        textParameters[1] +
        options.textParameterStartEndDelimiter +
        textParameters[2]
      );
    }
    if (textParameters.length !== 2) {
      logger.error(`Text directive must have 1–4 parameters: ${directive}`);
      return undefined;
    }
    if (textParameters[0].endsWith("-")) {
      return textParameters[1];
    }
    if (textParameters[1].startsWith("-")) {
      return textParameters[0];
    }
    logger.error(
      `Text directive with two parameters must have a prefix or suffix: ${directive}`
    );
    return undefined;
  });
  return quoteParts
    .filter(isDefined)
    .map(decodeURIComponent)
    .join(options.textDirectiveDelimiter);
}
