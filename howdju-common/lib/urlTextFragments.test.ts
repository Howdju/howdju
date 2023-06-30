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
