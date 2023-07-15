import {
  extractDomain,
  isDomain,
  isUrl,
  removeQueryParamsAndFragment,
} from "./urls";

describe("extractDomain", () => {
  it("should return undefined if url is undefined", () => {
    const url = undefined;
    const domain = extractDomain(url);
    expect(domain).toBeUndefined();
  });
  it("should return undefined if url is empty", () => {
    const url = "";
    const domain = extractDomain(url);
    expect(domain).toBeUndefined();
  });
  it("should return undefined if url is not a valid url", () => {
    const url = "not a valid url";
    const domain = extractDomain(url);
    expect(domain).toBeUndefined();
  });
  it("should return the domain if url is a valid url", () => {
    const url = "https://www.google.com";
    const domain = extractDomain(url);
    expect(domain).toBe("www.google.com");
  });
  it("should return the domain if url is a valid url with a port", () => {
    const url = "https://www.google.com:8080";
    const domain = extractDomain(url);
    expect(domain).toBe("www.google.com");
  });
});

describe("isUrl", () => {
  it("should return false if text is undefined", () => {
    expect(isUrl(undefined)).toBe(false);
  });
  it("should return false if text is empty", () => {
    expect(isUrl("")).toBe(false);
  });
  it("should return false if text is not a valid url", () => {
    expect(isUrl("not a valid url")).toBe(false);
  });
  it("should return true if text is a valid url", () => {
    expect(
      isUrl("https://www.google.com:8080/search?q=programming#search-box")
    ).toBe(true);
  });
  it("should return false if the URL is just a domain", () => {
    expect(isUrl("www.google.com")).toBe(false);
  });
  it("should return true if the URL has whitespace", () => {
    expect(
      isUrl(" https://www.google.com:8080/search?q=programming#search-box ")
    ).toBe(true);
  });
});

describe("isDomain", () => {
  it("should return false if text is undefined", () => {
    expect(isDomain(undefined)).toBe(false);
  });
  it("should return false if text is empty", () => {
    expect(isDomain("")).toBe(false);
  });
  it("should return false if text is not a valid domain", () => {
    expect(isDomain("not a valid domain")).toBe(false);
  });
  it("should return true if text is a valid domain", () => {
    expect(isDomain("www.google.com")).toBe(true);
  });
  it("should return false if the URL has extra whitespace", () => {
    expect(isDomain(" www.google.com ")).toBe(false);
  });
});

describe("removeQueryParamsAndFragment", () => {
  it("should return the url if it has no query params or fragment", () => {
    expect(removeQueryParamsAndFragment("https://www.google.com/search")).toBe(
      "https://www.google.com/search"
    );
  });
  it("should remove query params", () => {
    expect(
      removeQueryParamsAndFragment(
        "https://www.google.com/search?q=programming"
      )
    ).toBe("https://www.google.com/search");
  });
  it("should remove a fragment", () => {
    expect(
      removeQueryParamsAndFragment("https://www.google.com/search#search-box")
    ).toBe("https://www.google.com/search");
  });
  it("should remove both query params and a fragment", () => {
    expect(
      removeQueryParamsAndFragment(
        "https://www.google.com/search?q=programming#search-box"
      )
    ).toBe("https://www.google.com/search");
  });
});
