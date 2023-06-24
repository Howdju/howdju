import { readFileSync } from "fs";
import { JSDOM } from "jsdom";

import { extractDate, getMediaExcerptInfo } from "./domMetadata";

describe("getMediaExcerptInfo", () => {
  it("should handle NYT", () => {
    const html = readFileSync("lib/domMetadataTestData/nytimes.html", "utf8");
    const dom = new JSDOM(html);

    const info = getMediaExcerptInfo(dom.window.document);

    expect(info).toStrictEqual({
      authors: [
        { name: "Victoria Kim", isOrganization: false, knownFor: undefined },
      ],
      sourceDescription:
        "“Russia Accuses Prigozhin of Trying to Mount a Coup: Live Updates” " +
        "The New York Times (2023-06-24)",
    });
  });

  it("should handle PubMed", () => {
    const html = readFileSync("lib/domMetadataTestData/pubmed.html", "utf8");
    const dom = new JSDOM(html);

    const info = getMediaExcerptInfo(dom.window.document);

    expect(info).toStrictEqual({
      authors: [
        { name: "Thomas M. Burbacher", isOrganization: false },
        { name: "Danny D. Shen", isOrganization: false },
        { name: "Noelle Liberato", isOrganization: false },
        { name: "Kimberly S. Grant", isOrganization: false },
        { name: "Elsa Cernichiari", isOrganization: false },
        { name: "Thomas Clarkson", isOrganization: false },
      ],
      sourceDescription:
        "“Comparison of Blood and Brain Mercury Levels in Infant Monkeys Exposed to " +
        "Methylmercury or Vaccines Containing Thimerosal” Environmental Health Perspectives " +
        "vol. 113,8 (2005): 1015. doi:10.1289/ehp.7712",
    });
  });

  it("should handle Wikipedia", () => {
    const html = readFileSync("lib/domMetadataTestData/wikipedia.html", "utf8");
    const dom = new JSDOM(html);

    const info = getMediaExcerptInfo(dom.window.document);

    expect(info).toStrictEqual({
      authors: undefined,
      sourceDescription: "“Richard Feynman” Wikipedia (2023-06-16 01:19 UTC)",
    });
  });
});

it("should handle Aeon", () => {
  const html = readFileSync("lib/domMetadataTestData/aeon.html", "utf8");
  const dom = new JSDOM(html);

  const info = getMediaExcerptInfo(dom.window.document);

  expect(info).toStrictEqual({
    authors: [
      {
        name: "William Chester Jordan",
        isOrganization: false,
        knownFor: undefined,
      },
    ],
    sourceDescription:
      "“What crusaders’ daggers reveal about medieval love and violence” Aeon Magazine (2023-06-23)",
  });
});

it("should handle Substack", () => {
  const html = readFileSync("lib/domMetadataTestData/substack.html", "utf8");
  const dom = new JSDOM(html);

  const info = getMediaExcerptInfo(dom.window.document);

  expect(info).toStrictEqual({
    authors: [
      {
        name: "Bari Weiss",
        isOrganization: false,
        knownFor: `Writer, editor and author of "How to Fight Anti-Semitism."`,
      },
    ],
    sourceDescription:
      "“RFK Jr. Is Striking a Nerve. He Tells Me Why.” The Free Press (2023-06-21)",
  });
});

describe("extractDate", () => {
  it("should find by published CSS class", () => {
    const dom = new JSDOM(
      `<div class="article__PublishedDate-sc-br4ey4-17 hWOVM">23 June 2023</div>`
    );
    expect(extractDate(dom.window.document)).toBe("2023-06-23");
  });
});
