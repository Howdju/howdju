import { readFileSync } from "fs";
import { JSDOM } from "jsdom";
import stripIndent from "strip-indent";

import { mergeCopy, utcNow } from "howdju-common";

import {
  confirmQuotationInDoc,
  extractQuotationFromTextFragment,
  toUrlWithFragmentFromAnchors,
  toUrlWithFragmentFromQuotation,
} from "./urlTextFragments";

const baseUrlLocator = {
  id: "url-locator-id",
  url: {
    id: "url-id",
    // missing URL
    canonicalUrl: "https://example.com",
  },
  anchors: [
    {
      // missing exactText
      prefixText: "the prefix text",
      suffixText: "the suffix text",
      startOffset: 0,
      endOffset: 1,
      urlLocatorId: "url-locator-id",
      created: utcNow(),
      creatorUserId: "creator-user-id",
    },
  ],
  created: utcNow(),
  creator: {
    id: "creator-user-id",
    longName: "Creator User",
  },
  mediaExcerptId: "the-media-excerpt-id",
  creatorUserId: "creator-user-id",
};

describe("toUrlWithFragmentFromQuotation", () => {
  it("should add a quotation to a URL as a text fragment", () => {
    expect(
      toUrlWithFragmentFromQuotation("https://example.com", "a pithy quote")
    ).toBe("https://example.com/#:~:text=a%20pithy%20quote");
  });
  it("should return the URL for an empty quotaiton", () => {
    expect(
      toUrlWithFragmentFromQuotation(
        "https://example.com#document-fragment",
        ""
      )
    ).toBe("https://example.com#document-fragment");
  });
});

describe("toUrlWithFragmentFromAnchors", () => {
  it("should return the URL with the fragment", () => {
    const urlLocator = mergeCopy(baseUrlLocator, {
      url: {
        url: "https://example.com",
      },
      anchors: [
        {
          exactText: "the exact text",
        },
      ],
    });
    expect(toUrlWithFragmentFromAnchors(urlLocator)).toBe(
      "https://example.com/#:~:text=the%20exact%20text"
    );
  });
  it("is compatible with an existing document fragment", () => {
    const urlLocator = mergeCopy(baseUrlLocator, {
      url: {
        url: "https://example.com#some-heading",
      },
      anchors: [
        {
          exactText: "the exact text",
        },
      ],
    });
    expect(toUrlWithFragmentFromAnchors(urlLocator)).toBe(
      "https://example.com/#some-heading:~:text=the%20exact%20text"
    );
  });
  it("supports multiple anchors", () => {
    const urlLocator = mergeCopy(baseUrlLocator, {
      url: {
        url: "https://example.com",
      },
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
    expect(toUrlWithFragmentFromAnchors(urlLocator)).toBe(
      "https://example.com/#:~:text=the%20exact%20text&text=the%20exact%20text%202"
    );
  });
  it("overwrites an existing text fragment", () => {
    const urlLocator = mergeCopy(baseUrlLocator, {
      url: {
        url: "https://example.com#:~:text=some%20previous%20fragment",
      },
      anchors: [
        {
          exactText: "the exact text",
        },
      ],
    });
    expect(toUrlWithFragmentFromAnchors(urlLocator)).toBe(
      "https://example.com/#:~:text=the%20exact%20text"
    );
  });
  it("preserves a document fragment while overwriting an existing text fragment", () => {
    const urlLocator = mergeCopy(baseUrlLocator, {
      url: {
        url: "https://example.com#the-doc-fragment:~:text=some%20previous%20fragment",
      },
      anchors: [
        {
          exactText: "the exact text",
        },
      ],
    });
    expect(toUrlWithFragmentFromAnchors(urlLocator)).toBe(
      "https://example.com/#the-doc-fragment:~:text=the%20exact%20text"
    );
  });
  it("encodes hyphens", () => {
    const urlLocator = mergeCopy(baseUrlLocator, {
      url: {
        url: "https://example.com",
      },
      anchors: [
        {
          exactText: "the - exact - text",
        },
      ],
    });
    expect(toUrlWithFragmentFromAnchors(urlLocator)).toBe(
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

  it("extracts the quotation from the text fragment with a document fragment", () => {
    expect(
      extractQuotationFromTextFragment(
        "https://example.com#the-document-fragment:~:text=the%20exact%20text"
      )
    ).toBe("the exact text");
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
  it("converts paragraph breaks into linebreaks", () => {
    const html = readFileSync(
      "lib/testData/domBibliographicInfoTestData/seattletimes.html",
      "utf8"
    );
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    expect(
      extractQuotationFromTextFragment(
        "https://www.seattletimes.com/seattle-news/homeless/heres-why-people-think-seattle-will-reverse-course-on-homelessness/#:~:text=Despite%20that%2C%20Francine,here%2C%E2%80%9D%20she%20said.",
        { doc }
      )
    ).toBe(
      stripIndent(`
      Despite that, Francine, who asked not to use her last name due to the stigma around addiction, thinks the homelessness crisis in Seattle will turn around.

      “They have too much money out here,” she said.`).trim()
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

describe("confirmQuotationInDoc", () => {
  test("Confirms a quotation", () => {
    const html = readFileSync(
      "lib/testData/domBibliographicInfoTestData/seattletimes.html",
      "utf8"
    );
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const quotation = stripIndent(`
      Many poll respondents said the reason they believe the homelessness crisis is worse now than it was three years ago is because they see it more.

      “I see a lot more encampments around or RVs parked on the side of the road where they didn’t used to be,” said Drew Scoggins, a Northgate resident who responded to the poll.`).trim();

    expect(confirmQuotationInDoc(doc, quotation)).toBe({
      status: "FOUND",
      foundQuotation: quotation,
    });
  });
});
