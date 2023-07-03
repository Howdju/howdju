import { JSDOM } from "jsdom";
import axios, { AxiosResponse } from "axios";
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
  logger.info(`Requesting URL: ${url}`);
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
      throw new DownstreamServiceError(`Failed to fetch URL: ${url}`, error);
    }
    logger.info(
      `Requesting URL directly failed, retrying with ZenRows. ${{ url, error }}`
    );
    try {
      const client = new ZenRows(process.env.ZEN_ROWS_API_KEY);
      const { data } = (await Promise.race([
        client.get(url),
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error("ZenRows request timed out")), 5000)
        ),
      ])) as AxiosResponse;
      return data;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      throw new DownstreamServiceError(`Failed to fetch URL: ${url}`, error);
    }
  }
}
