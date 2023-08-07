import fs from "fs";
import * as textQuote from "dom-anchor-text-quote";
import { JSDOM } from "jsdom";
import {
  GenerateFragmentResult,
  GenerateFragmentStatus,
} from "text-fragments-polyfill/dist/fragment-generation-utils.js";

import {
  QuotationConfirmationResult,
  cleanTextFragmentParameter,
  confirmQuotationInDoc,
  extractQuotationFromTextFragment,
  inferAnchoredBibliographicInfo,
  MediaExcerptInfo,
  logger,
} from "howdju-common";

import { fetchUrl } from "./fetchUrl";

/** Given a URL and quotation from it, return anchor info for it */
export async function requestMediaExcerptInfo(
  url: string,
  quotation: string | undefined
): Promise<MediaExcerptInfo> {
  const html = await fetchUrl(url);
  const dom = new JSDOM(html, { url });

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
  return confirmQuotationInDoc(doc, quotation);
}

const FRAGMENT_DIRECTIVE = ":~:";

export function generateTextFragmentUrlFromHtml(
  url: string,
  html: string,
  quotation: string
) {
  const { window } = new JSDOM(html, { url, runScripts: "dangerously" });

  // Add the fragment generation utils to the JSDOM page.
  // See https://github.com/jsdom/jsdom/wiki/Don't-stuff-jsdom-globals-onto-the-Node-global#running-code-inside-the-jsdom-context
  const fragmentGenerationUtils = readFragmentGenerationScript();
  window.eval(fragmentGenerationUtils);

  // Select the quotation in the JSDOM page.
  const quotationRange = textQuote.toRange(window.document.body, {
    exact: quotation,
  });
  if (!quotationRange) {
    logger.error(`Unable to find quotation ${quotation} in ${url}`);
    return undefined;
  }
  logger.info(`Found quotation in range: ${quotationRange.toString()}`);
  const selection = window.document.getSelection();
  if (!selection) {
    logger.error(`Unable to get selection for ${url}`);
    return undefined;
  }
  window.quotationRange = quotationRange;

  // Run the fragment generation utils on the selection in the JSDOM page.
  window.eval(`
    window.generateFragmentResult = window.generateFragmentFromRange(window.quotationRange);
  `);
  const { status, fragment } =
    window.generateFragmentResult as GenerateFragmentResult;
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

function readFragmentGenerationScript() {
  if (
    fs.existsSync(
      "../howdju-text-fragment-generation/dist/global-fragment-generation.js"
    )
  ) {
    return fs.readFileSync(
      "../howdju-text-fragment-generation/dist/global-fragment-generation.js",
      { encoding: "utf-8" }
    );
  }
  if (fs.existsSync("./global-fragment-generation.js")) {
    return fs.readFileSync("./global-fragment-generation.js", {
      encoding: "utf-8",
    });
  }
  throw new Error("Unable to find fragment generation script");
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
