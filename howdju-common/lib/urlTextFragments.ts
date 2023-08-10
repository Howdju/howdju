import { getTextWithin, isDefined, logger, UrlLocator } from "howdju-common";

const FRAGMENT_DIRECTIVE = ":~:";

export function toUrlWithFragmentFromQuotation(url: string, quotation: string) {
  if (!quotation) {
    return url;
  }
  const urlObj = new URL(url);
  const fragmentDirectiveIndex = urlObj.hash.indexOf(FRAGMENT_DIRECTIVE);
  if (fragmentDirectiveIndex > -1) {
    logger.error(`URL should not already have a text fragment: ${url}`);
  }

  const hash =
    // remove an existing text fragment
    fragmentDirectiveIndex > -1
      ? urlObj.hash.substring(0, fragmentDirectiveIndex)
      : urlObj.hash;

  urlObj.hash =
    hash + FRAGMENT_DIRECTIVE + "text=" + cleanTextFragmentParameter(quotation);
  return urlObj.toString();
}

/**
 * Returns a URL having a text fragment.
 *
 * Text fragments are like: https://example.com#:~:text=[prefix-,]textStart[,textEnd][,-suffix]&text=...
 * @param urlLocator
 * @param useContext
 * @returns
 */
export function toUrlWithFragmentFromAnchors(
  urlLocator: UrlLocator,
  // TODO(427) fix prefix/suffix to be Chrome-compatible.
  useContext = false
) {
  const urlObj = new URL(urlLocator.url.url);
  // TODO(38) what to do if the hash already contains a fragment? Overwrite it? We should probably
  // remove fragments from the URL before saving it to the database.
  const fragmentDirectiveIndex = urlObj.hash.indexOf(FRAGMENT_DIRECTIVE);
  if (fragmentDirectiveIndex > -1) {
    logger.warn(
      `URL ${urlLocator.url.url} already contains a fragment. It will be overwritten.`
    );
  }

  const documentFragment =
    // substring from 1 to remove the leading #.
    fragmentDirectiveIndex > -1
      ? urlObj.hash.substring(1, fragmentDirectiveIndex)
      : urlObj.hash.substring(1);
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
  const newHash = textDirectives?.length
    ? `${documentFragment}${FRAGMENT_DIRECTIVE}${textDirectives.join("&")}`
    : documentFragment
    ? `${documentFragment}`
    : "";
  urlObj.hash = newHash;
  return urlObj.toString();
}

export function cleanTextFragmentParameter(textParameter: string) {
  return encodeTextFragmentParameter(textParameter.replace(/\n/g, ""));
}

function encodeTextFragmentParameter(textParameter: string) {
  // The text fragment spec requires percent-encoding ampersand, comma, and dash.
  // https://wicg.github.io/scroll-to-text-fragment/#fragmentdirective:~:text=The%20text%20parameters%20are%20percent%2Ddecoded%20before%20matching.%20Dash%20(%2D)%2C%20ampersand%20(%26)%2C%20and%20comma%20(%2C)%20characters%20in%20text%20parameters%20are%20percent%2Dencoded%20to%20avoid%20being%20interpreted%20as%20part%20of%20the%20text%20directive%20syntax.
  // encodeURIComponent encodes ampersand and comma, but not dash. decodeURIComponent will decode all three.
  return encodeURIComponent(textParameter).replace(/-/g, "%2D");
}

export interface ExtractQuotationFromTextFragmentOptions {
  /** The DOM document to use to infer from a split (start/end) text fragment. */
  doc?: Document;
  /** The text used to join text directives. */
  textDirectiveDelimiter?: string;
  /** The text used to join textStart and textEnd. */
  textParameterStartEndDelimiter?: string;
}

const defaultOptions = {
  doc: undefined as Document | undefined,
  textDirectiveDelimiter: "…",
  textParameterStartEndDelimiter: "…",
};

export function extractQuotationFromTextFragment(
  url: string,
  options: ExtractQuotationFromTextFragmentOptions = defaultOptions
): string | undefined {
  const urlObj = new URL(url);
  const fragmentMatch = urlObj.hash.match(/:~:(.*)$/);
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
    const textParameters = directive
      .replace(/^text=/, "")
      .split(",")
      .map(decodeURIComponent);

    if (textParameters.length < 1 || textParameters.length > 4) {
      logger.error(`Text directive must have 1–4 parameters: ${directive}`);
      return undefined;
    }
    if (textParameters.length === 1) {
      return textParameters[0];
    }
    if (textParameters.length === 4) {
      if (options.doc) {
        const [prefix, startText, endText, suffix] = textParameters;
        const textWithin = getTextWithin(options.doc, startText, endText, {
          prefix: prefix.replace(/-$/, ""),
          suffix: suffix.replace(/^-/, ""),
        });
        if (textWithin) {
          return textWithin;
        }
        // otherwise, fall through
      }
      const textParameterStartEndDelimiter =
        options.textParameterStartEndDelimiter ??
        defaultOptions.textParameterStartEndDelimiter;
      return (
        textParameters[1] + textParameterStartEndDelimiter + textParameters[2]
      );
    }

    let start = 0;
    let end = textParameters.length - 1;
    if (textParameters[0].endsWith("-")) {
      start += 1;
    }
    if (textParameters[textParameters.length - 1].startsWith("-")) {
      end -= 1;
    }
    if (end - start > 1) {
      logger.error(
        `Text directive with three parameters must have a prefix or suffix: ${directive}`
      );
      return undefined;
    }
    if (options.doc) {
      const startText = textParameters[start];
      const endText = textParameters[end];
      const prefix = start === 1 ? textParameters[0] : undefined;
      const suffix =
        end < textParameters.length - 1
          ? textParameters[textParameters.length - 1]
          : undefined;
      const textWithin = getTextWithin(options.doc, startText, endText, {
        prefix: prefix?.replace(/-$/, ""),
        suffix: suffix?.replace(/^-/, ""),
      });
      if (textWithin) {
        return textWithin;
      }
      // otherwise, fall through
    }
    const textDirectiveDelimiter =
      options.textDirectiveDelimiter ?? defaultOptions.textDirectiveDelimiter;
    return textParameters.slice(start, end + 1).join(textDirectiveDelimiter);
  });
  return quoteParts.filter(isDefined).join(options.textDirectiveDelimiter);
}

export type QuotationConfirmationResult =
  | {
      status: "NOT_FOUND";
      foundQuotation?: undefined;
      errorMessage?: undefined;
    }
  | {
      status: "FOUND";
      foundQuotation: string;
      errorMessage?: undefined;
    }
  | {
      status: "ERROR";
      foundQuotation?: undefined;
      errorMessage: string;
    };
