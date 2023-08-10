import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import stripIndent from "strip-indent";
import * as textPosition from "dom-anchor-text-position";

import { approximateMatch } from "./approximateStringMatch";
import { toPlainTextContent } from "./domCommon";

describe("approximateMatch", () => {
  test("matches", () => {
    const html = readFileSync(
      "lib/testData/urlTextFragments/lexfridman.html",
      "utf8"
    );
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const quotation = stripIndent(`
    Robert F. Kennedy Jr

    (00:09:49) I suppose the way that Camus viewed the world and the way that the Stoics did and a lot of the existentialists, it was that it was so absurd and that the problems and the tasks that were given just to live a life are so insurmountable that the only way that we can get back the gods for giving us this impossible task of living life was to embrace it and to enjoy it and to do our best at it. To me, I read Camus, and particularly in The Myth of Sisyphus as a parable that… And it’s the same lesson that I think he writes about in The Plague, where we’re all given these insurmountable tasks in our lives, but that by doing our duty, by being of service to others, we can bring meaning to a meaningless chaos and we can bring order to the universe.
    `).trim();

    const matches = approximateMatch(doc.body.textContent ?? "", quotation);

    expect(matches).toEqual([{ end: 10800, errors: 25, start: 9995 }]);
  });

  test("matches non-optimally", () => {
    const html = readFileSync(
      "lib/testData/urlTextFragments/lexfridman.html",
      "utf8"
    );
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const quotation = stripIndent(`
      Lex Fridman

      (00:21:33) And you think that kind of empathy that you referred to, that requires moral courage?
    `).trim();

    const [{ start, end, errors }] = approximateMatch(
      doc.body.textContent ?? "",
      quotation
    );

    expect({ start, end, errors }).toEqual({
      start: 19933,
      end: 20035,
      errors: 21,
    });
    const range = textPosition.toRange(doc.body, { start, end });
    const foundQuotation = toPlainTextContent(range);
    // TODO(507) it should be possible to match the quotation exactly.
    expect(foundQuotation).toEqual(quotation.substring(20));
  });
});
