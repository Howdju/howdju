import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import stripIndent from "strip-indent";

import {
  brandedParse,
  UrlLocatorRef,
  UrlLocatorView,
  UrlRef,
  utcNow,
} from "howdju-common";

import {
  extractQuotationFromTextFragment,
  toUrlWithFragment,
} from "./urlTextFragments";

describe("toUrlWithFragment", () => {
  it("should return the URL with the fragment", () => {
    const urlLocator: UrlLocatorView = brandedParse(UrlLocatorRef, {
      id: "url-locator-id",
      url: brandedParse(UrlRef, {
        id: "url-id",
        url: "https://example.com",
      }),
      anchors: [
        {
          exactText: "the exact text",
          prefixText: "the prefix text",
          suffixText: "the suffix text",
          startOffset: 0,
          endOffset: 1,
          urlLocatorId: "url-locator-id",
          created: utcNow(),
          creatorUserId: "creator-user-id",
        },
      ],
    });
    expect(toUrlWithFragment(urlLocator)).toBe(
      "https://example.com/#:~:text=the%20exact%20text"
    );
  });
  it("is compatible with an existing document fragment", () => {
    const urlLocator: UrlLocatorView = brandedParse(UrlLocatorRef, {
      id: "url-locator-id",
      url: brandedParse(UrlRef, {
        id: "url-id",
        url: "https://example.com#some-heading",
      }),
      anchors: [
        {
          exactText: "the exact text",
          prefixText: "the prefix text",
          suffixText: "the suffix text",
          startOffset: 0,
          endOffset: 1,
          urlLocatorId: "url-locator-id",
          created: utcNow(),
          creatorUserId: "creator-user-id",
        },
      ],
    });
    expect(toUrlWithFragment(urlLocator)).toBe(
      "https://example.com/#some-heading:~:text=the%20exact%20text"
    );
  });
  it("supports multiple anchors", () => {
    const urlLocator: UrlLocatorView = brandedParse(UrlLocatorRef, {
      id: "url-locator-id",
      url: brandedParse(UrlRef, {
        id: "url-id",
        url: "https://example.com",
      }),
      anchors: [
        {
          exactText: "the exact text",
          prefixText: "the prefix text",
          suffixText: "the suffix text",
          startOffset: 0,
          endOffset: 1,
          urlLocatorId: "url-locator-id",
          created: utcNow(),
          creatorUserId: "creator-user-id",
        },
        {
          exactText: "the exact text 2",
          prefixText: "the prefix text 2",
          suffixText: "the suffix text 2",
          startOffset: 2,
          endOffset: 3,
          urlLocatorId: "url-locator-id",
          created: utcNow(),
          creatorUserId: "creator-user-id",
        },
      ],
    });
    expect(toUrlWithFragment(urlLocator)).toBe(
      "https://example.com/#:~:text=the%20exact%20text&text=the%20exact%20text%202"
    );
  });
  it("overwrites an existing text fragment", () => {
    const urlLocator: UrlLocatorView = brandedParse(UrlLocatorRef, {
      id: "url-locator-id",
      url: brandedParse(UrlRef, {
        id: "url-id",
        url: "https://example.com#:~:text=some%20previous%20fragment",
      }),
      anchors: [
        {
          exactText: "the exact text",
          prefixText: "the prefix text",
          suffixText: "the suffix text",
          startOffset: 0,
          endOffset: 1,
          urlLocatorId: "url-locator-id",
          created: utcNow(),
          creatorUserId: "creator-user-id",
        },
      ],
    });
    expect(toUrlWithFragment(urlLocator)).toBe(
      "https://example.com/#:~:text=the%20exact%20text"
    );
  });
  it("preserves a document fragment while overwriting an existing text fragment", () => {
    const urlLocator: UrlLocatorView = brandedParse(UrlLocatorRef, {
      id: "url-locator-id",
      url: brandedParse(UrlRef, {
        id: "url-id",
        url: "https://example.com#the-doc-fragment:~:text=some%20previous%20fragment",
      }),
      anchors: [
        {
          exactText: "the exact text",
          prefixText: "the prefix text",
          suffixText: "the suffix text",
          startOffset: 0,
          endOffset: 1,
          urlLocatorId: "url-locator-id",
          created: utcNow(),
          creatorUserId: "creator-user-id",
        },
      ],
    });
    expect(toUrlWithFragment(urlLocator)).toBe(
      "https://example.com/#the-doc-fragment:~:text=the%20exact%20text"
    );
  });
  it("encodes hyphens", () => {
    const urlLocator: UrlLocatorView = brandedParse(UrlLocatorRef, {
      id: "url-locator-id",
      url: brandedParse(UrlRef, {
        id: "url-id",
        url: "https://example.com",
      }),
      anchors: [
        {
          exactText: "the - exact - text",
          prefixText: "the prefix text",
          suffixText: "the suffix text",
          startOffset: 0,
          endOffset: 1,
          urlLocatorId: "url-locator-id",
          created: utcNow(),
          creatorUserId: "creator-user-id",
        },
      ],
    });
    expect(toUrlWithFragment(urlLocator)).toBe(
      "https://example.com/#:~:text=the%20%2D%20exact%20%2D%20text"
    );
  });
});

describe("extractQuotationFromTextFragment", () => {
  it("extracts the quotation from the text fragment", () => {
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#:~:text=the%20exact%20text"
      )
    ).toBe("the exact text");
  });
  it("extracts the quotation from the text fragment with a prefix", () => {
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#:~:text=the%20prefix%20text-,the%20exact%20text"
      )
    ).toBe("the exact text");
  });
  it("extracts the quotation from the text fragment with a suffix", () => {
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#:~:text=the%20exact%20text,-the%20suffix%20text"
      )
    ).toBe("the exact text");
  });
  it("extracts the quotation from the text fragment with a prefix and a suffix", () => {
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#:~:text=the%20prefix%20text-,the%20exact%20text,-the%20suffix%20text"
      )
    ).toBe("the exact text");
  });
  it("extracts the quotation from the text fragment with a text end", () => {
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#:~:text=the%20exact%20text%20start,the%20exact%20text%20end"
      )
    ).toBe("the exact text start…the exact text end");
  });
  it("returns the full quotation from a text fragment with a text end if doc is provided", () => {
    const dom = new JSDOM(
      `<html><body>Something eloquent about the exact text <a href="link">should include the whole text</a> to the text end and what not.</body></html>`
    );
    const doc = dom.window.document;
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#:~:text=the%20exact%20text,the%20text%20end",
        { doc }
      )
    ).toBe("the exact text should include the whole text to the text end");
  });
  it("returns the full quotation from a text fragment with a text end if doc is provided from substack", () => {
    const html = readFileSync(
      "lib/testData/domBibliographicInfoTestData/substack.html",
      "utf8"
    );
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    expect(
      extractQuotationFromTextFragment(
        "https://www.thefp.com/p/rfk-jr-is-striking-a-nerve-with-democrats#:~:text=A%20few%20days,running%20for%20president.",
        { doc }
      )
    ).toBe(
      stripIndent(`
    A few days ago, Joe Rogan offered Dr. Peter Hotez $100,000 to appear on his show to debate RFK Jr. on the subject of vaccines and public health. Not 48 hours later, thanks to Twitter, the ante is now more than $2 million and counting.

    If this debate happens, it could rival the audience tuning in to the official presidential debates in the 2024 election cycle.

    Which tells us a tremendous amount about our current political moment.

    So does the fact that Robert Francis Kennedy Jr. is even running for president.`).trim()
    );
  });
  it("returns the full quotation from a text fragment with a text end if doc is provided and initial textStart is after initial textEnd", () => {
    const html = readFileSync(
      "lib/testData/domBibliographicInfoTestData/pubmed.html",
      "utf8"
    );
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // I'm not sure why `Thimerosal is a` matches with `Thimerosal is eliminated` (later in the
    // doc), but it is. And this situation exercises the code that handles that by trying to find
    // better start/end offsets.
    expect(
      extractQuotationFromTextFragment(
        "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1280342/#:~:text=Thimerosal%20is%20a,after%20each%20exposure.",
        { doc }
      )
    ).toBe(
      `Thimerosal is a preservative that has been used in manufacturing vaccines since the 1930s. Reports have indicated that infants can receive ethylmercury (in the form of thimerosal) at or above the U.S. Environmental Protection Agency guidelines for methylmercury exposure, depending on the exact vaccinations, schedule, and size of the infant. In this study we compared the systemic disposition and brain distribution of total and inorganic mercury in infant monkeys after thimerosal exposure with those exposed to MeHg. Monkeys were exposed to MeHg (via oral gavage) or vaccines containing thimerosal (via intramuscular injection) at birth and 1, 2, and 3 weeks of age. Total blood Hg levels were determined 2, 4, and 7 days after each exposure.`
    );
  });

  it("extracts the quotation from the text fragment with a text end, prefix, and suffix", () => {
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#:~:text=the%20prefix%20text-,the%20exact%20text%20start,the%20exact%20text%20end,-the%20suffix%20text"
      )
    ).toBe("the exact text start…the exact text end");
  });
  it("extracts the quotation from multiple text fragments", () => {
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#:~:text=the%20prefix%20text%201-,the%20exact%20text%201,-the%20suffix%20text%201&" +
          "text=the%20prefix%20text%202-,the%20exact%20text%202,-the%20suffix%20text%202"
      )
    ).toBe("the exact text 1…the exact text 2");
  });
  it("returns undefined when there is no text fragment", () => {
    expect(
      extractQuotationFromTextFragment("https://example.com#some-heading")
    ).toBeUndefined();
  });
});
