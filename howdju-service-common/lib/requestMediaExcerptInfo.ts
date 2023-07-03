import { JSDOM } from "jsdom";
import axios from "axios";
import { ZenRows } from "zenrows";

import {
  extractQuotationFromTextFragment,
  inferAnchoredBibliographicInfo,
  logger,
  MediaExcerptInfo,
} from "howdju-common";
import { DownstreamServiceError } from "./serviceErrors";

/** Given a URL and quotation from it, return anchor info for it */
export async function requestMediaExcerptInfo(
  url: string,
  quotation: string | undefined
): Promise<MediaExcerptInfo> {
  const html = await getHtml(url);
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

async function getHtml(url: string): Promise<string> {
  // Some sites (e.g. science.org) fail if you send a text fragment.
  try {
    const response = await axios.get(url, {
      timeout: 5000,
    });
    const html = await response.data;
    return html;
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    if (!process.env.ZEN_ROWS_API_KEY) {
      logger.info("ZenRows API key is missing so we cannot retry the request.");
      throw new DownstreamServiceError("Failed to fetch URL", error);
    }
    try {
      const client = new ZenRows(process.env.ZEN_ROWS_API_KEY);
      const { data } = await client.get(url, {});
      return data;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      throw new DownstreamServiceError("Failed to fetch URL", error);
    }
  }
}
