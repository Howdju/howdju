import * as textQuote from "dom-anchor-text-quote";
import * as textPosition from "dom-anchor-text-position";

import { isDefined, logger, nodeIsAfter, UrlLocator } from "howdju-common";
import { indexOf } from "lodash";

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
      const textWithin = getTextWithin(options.doc, startText, endText);
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

function getTextWithin(doc: Document, startText: string, endText: string) {
  // Some sites includes the content of the page in a script tag. E.g. substack's `body_html`. So
  // use a hint at the beginning to try and find content in the body. (If we find this doens't work,
  // we might need to use a binary search style approach until we either have exhausted ranges in
  // the document or have found a range that isn't in a script tag.)
  const { range } = getRangeOfText(doc, startText, endText, 0);
  if (!range) {
    return undefined;
  }
  if (range.collapsed) {
    return undefined;
  }
  return toPlainTextContent(range);
}

function getRangeOfText(
  doc: Document,
  startText: string,
  endText: string,
  hint?: number
) {
  let startPosition = textQuote.toTextPosition(
    doc.body,
    { exact: startText },
    hint !== undefined ? { hint } : undefined
  );
  if (!startPosition) {
    return { range: undefined, end: undefined };
  }
  let endPosition = textQuote.toTextPosition(
    doc.body,
    { exact: endText },
    { hint: startPosition.end }
  );
  if (!endPosition) {
    return { range: undefined, end: undefined };
  }
  // If the positions are invalid, try to find better positions.
  if (startPosition.start >= endPosition.end) {
    const betterStartPosition = textQuote.toTextPosition(
      doc.body,
      { exact: startText },
      { hint: endPosition.start }
    );
    const betterEndPosition = textQuote.toTextPosition(
      doc.body,
      { exact: endText },
      { hint: startPosition.end }
    );
    const betterStartLength = betterStartPosition
      ? endPosition.start - betterStartPosition.end
      : Number.NEGATIVE_INFINITY;
    const betterEndLength = betterEndPosition
      ? betterEndPosition.start - startPosition.end
      : Number.NEGATIVE_INFINITY;
    const isValidBetterStart = betterStartPosition && betterStartLength > 0;
    const isValidBetterEnd = betterEndPosition && betterEndLength > 0;
    if (isValidBetterStart) {
      if (isValidBetterEnd) {
        // If both better positions were found, return the one that yields a smaller range.
        if (betterStartLength < betterEndLength) {
          startPosition = betterStartPosition;
        } else {
          endPosition = betterEndPosition;
        }
      } else {
        startPosition = betterStartPosition;
      }
    } else if (isValidBetterEnd) {
      endPosition = betterEndPosition;
    }
    // If the positions are still invalid, give up.
    if (startPosition.start >= endPosition.end) {
      return { range: undefined, end: undefined };
    }
  }

  const range = textPosition.toRange(doc.body, {
    start: startPosition.start,
    end: endPosition.end,
  });
  return { range, end: endPosition.end };
}

function getNodeConstructor(node: Node) {
  const Node = node.ownerDocument?.defaultView?.Node;
  if (!Node) {
    throw new Error(`Unable to obtain Node constructor from range.`);
  }
  return Node;
}

/**
 * Try to return the contents of a range formatted as plain text.
 *
 * - Every time we encounter a text node, we add its textContent to the result.
 * - Every time we encounter a paragraph, we add two newlines to the result.
 *
 * JSDOM doesn't implement innerText, so we must do this ourselves
 * (https://github.com/jsdom/jsdom/issues/1245). Another option might be to run headless Chrome.
 *
 * (On the differences between textContent and innerText:
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent#differences_from_innertext)
 */
function toPlainTextContent(range: Range) {
  const textParts = [] as string[];
  const Node = getNodeConstructor(range.startContainer);
  walkRangeNodes(range, {
    enter: (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text;
        if (node.isSameNode(range.startContainer)) {
          if (node.isSameNode(range.endContainer)) {
            text = node.textContent?.substring(
              range.startOffset,
              range.endOffset
            );
          } else {
            text = node.textContent?.substring(range.startOffset);
          }
        } else if (node.isSameNode(range.endContainer)) {
          text = node.textContent?.substring(0, range.endOffset);
        } else {
          text = node.textContent;
        }
        if (text) {
          textParts.push(text);
        }
      }
    },
    leave: (node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.nodeName.toLowerCase() === "p"
      ) {
        textParts.push("\n\n");
      }
    },
  });
  return textParts.join("").replace(/\s+$/gm, "\n").trim();
}

function isTextNode(node: Node): node is Text {
  return node.nodeType === getNodeConstructor(node).TEXT_NODE;
}

export function walkRangeNodes(
  range: Range,
  { enter, leave }: { enter: (node: Node) => void; leave: (node: Node) => void }
) {
  // If the startContainer is not a text node, then startOffset points to the first node of the
  // range. If the startOffset is 0, it is ambiguous whether the range starts at the startContainer
  // or at its first child. We assume that a startOffset of 0 includes the startContainer.

  let node: Node | null =
    isTextNode(range.startContainer) || range.startOffset == 0
      ? range.startContainer
      : range.startContainer.childNodes[range.startOffset];
  while (node) {
    enter(node);
    if (node.firstChild) {
      node = node.firstChild;
      continue;
    }
    while (node && !node.nextSibling) {
      leave(node);
      if (node.isSameNode(range.endContainer)) {
        return;
      }
      node = node.parentNode;
    }
    if (!node) {
      logger.error(
        `Unexpectedly reached the root node without encountering the range's endContainer.`
      );
      return;
    }
    leave(node);
    node = node.nextSibling;
    // If the endContainer is not a text node, then endOffset points to the last node of the range
    // and we should skip any nodes after it.
    if (
      !isTextNode(range.endContainer) &&
      node?.parentNode?.isSameNode(range.endContainer) &&
      indexOf(node.parentNode.childNodes, node) >= range.endOffset
    ) {
      return;
    }
    if (
      node &&
      !range.endContainer.contains(node) &&
      nodeIsAfter(node, range.endContainer)
    ) {
      return;
    }
  }
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

export function confirmQuotationInDoc(
  doc: Document,
  quotation: string
): QuotationConfirmationResult {
  const quotationRange = textQuote.toRange(doc.body, {
    exact: quotation,
  });
  if (!quotationRange) {
    return {
      status: "NOT_FOUND",
    };
  }

  // TODO(491) add an INEXACT_FOUND option if foundQuotation !== quotation.
  const foundQuotation = toPlainTextContent(quotationRange);
  return {
    status: "FOUND",
    foundQuotation,
  };
}
