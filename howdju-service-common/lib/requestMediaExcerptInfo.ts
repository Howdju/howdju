import { JSDOM } from "jsdom";
import axios from "axios";

import {
  extractQuotationFromTextFragment,
  inferAnchoredBibliographicInfo,
  MediaExcerptInfo,
} from "howdju-common";

/** Given a URL and quotation from it, return anchor info for it */
export async function requestMediaExcerptInfo(
  url: string,
  quotation: string | undefined
): Promise<MediaExcerptInfo> {
  const response = await axios.get(url);
  const html = await response.data;

  const dom = new JSDOM(html, {
    url,
  });

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
