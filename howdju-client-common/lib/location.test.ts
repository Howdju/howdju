import { getCanonicalUrl } from "./location";

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
