import moment from "moment";
import { urlString } from "./zodRefinements";
import { CreateJustification, Justification, Persorg } from "./zodSchemas";

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
          normalText: "the target text",
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
                normalText: "the basis text",
                created,
              },
            },
          ],
        },
      },
      rootTarget: {
        text: "the root text",
        normalText: "the root text",
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

describe("CreateJustification schema", () => {
  test("parses a MediaExcerpt basis lacking an ID", () => {
    const createJustification: CreateJustification = {
      id: "0",
      target: {
        type: "PROPOSITION",
        entity: {
          id: "1",
          text: "the target text",
        },
      },
      polarity: "POSITIVE",
      basis: {
        type: "MEDIA_EXCERPT",
        entity: {
          localRep: {
            quotation: "the-quotation",
          },
          locators: {
            urlLocators: [
              {
                url: {
                  id: "the-url-id",
                  url: "https://data.cdc.gov/",
                },
                anchors: [],
              },
            ],
          },
          citations: [
            {
              source: {
                description:
                  "“Some Data Page” Centers for Disease Control and Prevention",
                id: "the-source-id",
              },
            },
          ],
          speakers: [
            {
              persorg: {
                isOrganization: true,
                name: "United States Centers for Disease Control and Prevention (CDC)",
                knownFor: "",
                websiteUrl: "https://www.cdc.gov/",
                wikipediaUrl:
                  "https://en.wikipedia.org/wiki/Centers_for_Disease_Control_and_Prevention",
              },
            },
          ],
        },
      },
    };

    const result = CreateJustification.parse(createJustification);

    expect(result).toEqual(createJustification);
  });
  test("parses a MediaExcerpt basis having both ID and other fields", () => {
    const createJustification: CreateJustification = {
      id: "0",
      target: {
        type: "PROPOSITION",
        entity: {
          id: "1",
          text: "the target text",
        },
      },
      polarity: "POSITIVE",
      basis: {
        type: "MEDIA_EXCERPT",
        entity: {
          // MediaExcerpt has both an ID and other fields
          id: "the-media-excerpt-id",
          localRep: {
            quotation: "the-quotation",
          },
          locators: {
            urlLocators: [
              {
                url: {
                  id: "the-url-id",
                  url: "https://data.cdc.gov/",
                },
                anchors: [],
              },
            ],
          },
          citations: [
            {
              source: {
                description:
                  "“Some Data Page” Centers for Disease Control and Prevention",
                id: "the-source-id",
              },
            },
          ],
          speakers: [
            {
              persorg: {
                isOrganization: true,
                name: "United States Centers for Disease Control and Prevention (CDC)",
                knownFor: "",
                websiteUrl: "https://www.cdc.gov/",
                wikipediaUrl:
                  "https://en.wikipedia.org/wiki/Centers_for_Disease_Control_and_Prevention",
              },
            },
          ],
        },
      },
    };

    const result = CreateJustification.parse(createJustification);

    expect(result).toEqual(createJustification);
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
