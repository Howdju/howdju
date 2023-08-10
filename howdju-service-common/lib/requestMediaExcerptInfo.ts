import * as textPosition from "dom-anchor-text-position";
import { JSDOM } from "jsdom";
import {
  GenerateFragmentResult,
  GenerateFragmentStatus,
} from "text-fragments-polyfill/dist/fragment-generation-utils.js";

import {
  QuotationConfirmationResult,
  cleanTextFragmentParameter,
  inferAnchoredBibliographicInfo,
  MediaExcerptInfo,
  logger,
  extractQuotationFromTextFragment,
  approximateMatch,
  toPlainTextContent,
  toJson,
} from "howdju-common";

import { fetchUrl } from "./fetchUrl";
import { runScriptAction } from "./runScript";

/** Given a URL and quotation from it, return anchor info for it */
export async function requestMediaExcerptInfo(
  url: string,
  quotation: string | undefined
): Promise<MediaExcerptInfo> {
  const html = await fetchUrl(url);
  const dom = new JSDOM(html, { url, runScripts: "outside-only" });

  const extractedQuotation = extractQuotationFromTextFragment(url, {
    doc: dom.window.document,
  });

  const anchoredBibliographicInfo = inferAnchoredBibliographicInfo(
    dom.window.document,
    // Try to provide a quotation to get the anchors
    extractedQuotation || quotation
  );
  return {
    // Only return a quotation if we found one.
    quotation: extractedQuotation,
    ...anchoredBibliographicInfo,
    url,
  };
}

export function confirmQuotationInHtml(
  url: string,
  html: string,
  quotation: string
): QuotationConfirmationResult {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const range = getTextRangeInDoc(doc, quotation);
  if (!range) {
    return {
      status: "NOT_FOUND",
    };
  }

  // TODO(491) add an INEXACT_FOUND option if foundQuotation !== quotation.
  const foundQuotation = toPlainTextContent(range);
  return {
    status: "FOUND",
    foundQuotation,
  };
}

export function getTextRangeInDoc(
  doc: Document,
  quotation: string
): Range | undefined {
  const matches = approximateMatch(doc.body.textContent || "", quotation);
  logger.info(`getTextRangeInDoc matches ${toJson(matches)}`);
  if (!matches.length) {
    return undefined;
  }
  const { start, end } = matches[0];
  return textPosition.toRange(doc.body, { start, end }) || undefined;
}

const FRAGMENT_DIRECTIVE = ":~:";

export function generateTextFragmentUrlFromHtml(
  url: string,
  html: string,
  quotation: string
) {
  const { window } = new JSDOM(html, { url, runScripts: "outside-only" });

  // Select the quotation in the JSDOM page.
  const quotationRange = getTextRangeInDoc(window.document, quotation);
  if (!quotationRange) {
    logger.error(`Unable to find quotation ${quotation} in ${url}`);
    return undefined;
  }
  logger.info(`Found quotation in range: ${quotationRange.toString()}`);
  window.quotationRange = quotationRange;

  const { status, fragment } = runScriptAction<GenerateFragmentResult>(
    window,
    "rangeToFragment",
    "window.rangeToFragment(window.quotationRange)"
  );

  if (status !== GenerateFragmentStatus.SUCCESS) {
    logger.error(`Unable to generate fragment for URL (${status}): ${url}`);
    return undefined;
  }

  const prefix = fragment.prefix
    ? `${cleanTextFragmentParameter(fragment.prefix)}-,`
    : "";
  const suffix = fragment.suffix
    ? `,-${cleanTextFragmentParameter(fragment.suffix)}`
    : "";
  const start = cleanTextFragmentParameter(fragment.textStart);
  const end = fragment.textEnd
    ? `,${cleanTextFragmentParameter(fragment.textEnd)}`
    : "";
  const textFragment = `${prefix}${start}${end}${suffix}`;

  return addTextFragmentToUrl(url, textFragment);
}

function addTextFragmentToUrl(url: string, textFragment: string) {
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
  urlObj.hash = hash + FRAGMENT_DIRECTIVE + "text=" + textFragment;
  return urlObj.toString();
}
