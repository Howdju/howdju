import { JSDOM } from "jsdom";
import axios from "axios";
import {
  inferAnchoredBibliographicInfo,
  MediaExcerptInfo,
} from "howdju-common";

/** Given a URL and quotation from it, return anchor info for it */
export async function requestMediaExcerptInfo(
  url: string,
  quotation: string
): Promise<MediaExcerptInfo> {
  const response = await axios.get(url);
  const html = await response.data;

  const dom = new JSDOM(html, {
    url,
  });

  const anchoredBibliographicInfo = inferAnchoredBibliographicInfo(
    dom.window.document,
    quotation
  );
  return {
    ...anchoredBibliographicInfo,
    url,
  };
}
