import moment from "moment";
import { urlString } from "./zodRefinements";
import { Justification, Persorg } from "./zodSchemas";

describe("Justification schema", () => {
  test("recognizes valid proposition compound based justification", () => {
    const created = moment("2023-01-12");
    const justification: Justification = {
      id: "0",
      target: {
        type: "PROPOSITION",
        entity: {
          id: "1",
          text: "the target text",
          created,
        },
      },
      polarity: "POSITIVE",
      basis: {
        type: "PROPOSITION_COMPOUND",
        entity: {
          created,
          atoms: [
            {
              propositionCompoundId: "1",
              entity: {
                text: "the basis text",
                created,
              },
            },
          ],
        },
      },
      rootTarget: {
        text: "the root text",
        created: moment("2023-01-12"),
      },
      rootTargetType: "PROPOSITION",
      rootPolarity: "POSITIVE",
      created: moment("2023-01-12"),
    };

    const result = Justification.parse(justification);

    expect(result).toEqual(justification);
  });
});

describe("Persorg schema", () => {
  test("rejects a twitter-like URL", () => {
    expect(
      Persorg.shape.twitterUrl.safeParse("https://faketwitter.com/")
    ).toMatchObject({
      success: false,
    });
    expect(
      Persorg.shape.twitterUrl.safeParse("https://fake-twitter.com/")
    ).toMatchObject({
      success: false,
    });
  });
  test("rejects a wikipedia-like URL", () => {
    expect(
      Persorg.shape.twitterUrl.safeParse("https://fakewikipedia.com/")
    ).toMatchObject({
      success: false,
    });
    expect(
      Persorg.shape.twitterUrl.safeParse("https://fake-wikipedia.com/")
    ).toMatchObject({
      success: false,
    });
  });
});

describe("urlString", () => {
  it("should match a domain", () => {
    const result = urlString({
      domain: /some-websites.com$/,
    }).safeParse("https://www.some-websites.com/the-path");
    expect(result.success).toBe(true);
  });
  it("should not match a different domain", () => {
    const result = urlString({
      domain: /the-other-site.com$/,
    }).safeParse("https://www.some-websites.com/the-path");
    expect(result.success).toBe(false);
  });
});
