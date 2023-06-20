import { extractDomain } from "./urls";

describe("urls", () => {
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
});
