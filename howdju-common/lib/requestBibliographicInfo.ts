import { JSDOM } from "jsdom";
import axios from "axios";
import * as textQuote from "dom-anchor-text-quote";

import { AnchorInfo, inferBibliographicInfo } from "./domBibliographicInfo";
import { makeDomAnchor } from "./anchors";

/** Given a URL and quotation from it, return anchor info for it */
export async function requestAnchorInfo(
  url: string,
  quotation: string
): Promise<AnchorInfo> {
  const response = await axios.get(url);
  const html = await response.data;

  const dom = new JSDOM(html);

  dom.window.getSelection();

  const bibliographicInfo = inferBibliographicInfo(dom.window.document);

  const textPositionAnchor = textQuote.toTextPosition(
    dom.window.document.body,
    {
      exact: quotation,
    }
  );
  const textQuoteAnchor = textQuote.fromTextPosition(
    dom.window.document.body,
    textPositionAnchor
  );
  const domAnchor = makeDomAnchor(textQuoteAnchor, textPositionAnchor);

  return {
    ...bibliographicInfo,
    anchors: [domAnchor],
    url,
  };
}
