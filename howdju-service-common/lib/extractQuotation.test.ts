import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import stripIndent from "strip-indent";
import { extractQuotationFromWindowFragmentUsingPolyfill } from "./extractQuotation";

describe("extractQuotationFromWindowsFragmentUsingPolyfill", () => {
  // TODO(506) reenable this test after speeding up polyfill-based quotation extraction.
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("extracts the full quotation from the text fragment with a text end, prefix, and suffix when a doc is provided", () => {
    const html = readFileSync(
      "lib/testData/extractQuotation/lexfridman.html",
      "utf8"
    );
    const url =
      "https://lexfridman.com/robert-f-kennedy-jr-transcript/#:~:text=Camus-,Lex%20Fridman,act%20of%20rebellion.%E2%80%9D%20What%20do%20you%20think%20he%20means%20by%20that%3F,-Robert%20F.%20Kennedy";
    const dom = new JSDOM(html, { url, runScripts: "outside-only" });

    expect(extractQuotationFromWindowFragmentUsingPolyfill(dom.window)).toBe(
      stripIndent(`
        Lex Fridman (00:09:26) The blood of each generation. You mentioned your interest, your admiration of Al Albert Camus, of Stoicism, perhaps your interest in existentialism. Camus said, I believe in Myth of Sisyphus, “The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.” What do you think he means by that?
        `).trim()
    );
  });
});
