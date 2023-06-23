import { readFileSync } from "fs";
import { JSDOM } from "jsdom";

import { getMediaExcerptInfo } from "./domMetadata";

describe("getMediaExcerptInfo", () => {
  it("should handle NYT", () => {
    const html = readFileSync("lib/domMetadataTestData/nytimes.html", "utf8");
    const dom = new JSDOM(html);

    const info = getMediaExcerptInfo(dom.window.document);

    expect(info).toStrictEqual({
      authors: ["Victoria Kim"],
      sourceDescription:
        "“Russia Accuses Prigozhin of Trying to Mount a Coup: Live Updates” " +
        "The New York Times (2023-06-23)",
    });
  });

  it("should handle PubMed", () => {
    const html = readFileSync("lib/domMetadataTestData/pubmed.html", "utf8");
    const dom = new JSDOM(html);

    const info = getMediaExcerptInfo(dom.window.document);

    expect(info).toStrictEqual({
      authors: [
        "Thomas M. Burbacher",
        "Danny D. Shen",
        "Noelle Liberato",
        "Kimberly S. Grant",
        "Elsa Cernichiari",
        "Thomas Clarkson",
      ],
      sourceDescription:
        "“Comparison of Blood and Brain Mercury Levels in Infant Monkeys Exposed to " +
        "Methylmercury or Vaccines Containing Thimerosal” Environmental Health Perspectives " +
        "vol. 113,8 (2005): 1015. doi:10.1289/ehp.7712",
    });
  });
});
