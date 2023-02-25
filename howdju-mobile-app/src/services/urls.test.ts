import { makeRecentActivityUrl } from "./urls";

describe("makeRecentActivityUrl", () => {
  test("makes the URL", () => {
    expect(makeRecentActivityUrl("http://www.example.com")).toBe(
      "http://www.example.com/recent-activity/"
    );
  });
  test("makes a preprod URL", () => {
    expect(makeRecentActivityUrl("https://pre-prod-www.howdju.com")).toBe(
      "https://pre-prod-www.howdju.com/recent-activity/"
    );
    expect(makeRecentActivityUrl("https://pre-prod-www.howdju.com/")).toBe(
      "https://pre-prod-www.howdju.com/recent-activity/"
    );
  });
});
