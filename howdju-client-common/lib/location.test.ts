import {
  brandedParse,
  UrlLocatorRef,
  UrlLocatorView,
  UrlRef,
  utcNow,
} from "howdju-common";
import { getCanonicalUrl, toUrlWithFragment } from "./location";

describe("getCanonicalUrl", () => {
  it("should return the canonical URL by link rel=canonical", () => {
    document.body.innerHTML = `<link rel="canonical" href="https://example.com/canonical" />`;
    expect(getCanonicalUrl()).toBe("https://example.com/canonical");
  });
  it("should return the canonical URL by meta property=og:url", () => {
    document.body.innerHTML = `<meta property="og:url" content="https://example.com/canonical" />`;
    expect(getCanonicalUrl()).toBe("https://example.com/canonical");
  });
  it("should return the canonical URL by meta property=url", () => {
    document.body.innerHTML = `<meta property="url" content="https://example.com/canonical" />`;
    expect(getCanonicalUrl()).toBe("https://example.com/canonical");
  });
});

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
});
