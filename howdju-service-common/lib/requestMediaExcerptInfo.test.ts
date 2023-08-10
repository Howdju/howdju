import axios from "axios";
import { readFileSync } from "fs";
import stripIndent from "strip-indent";

import {
  confirmQuotationInHtml,
  generateTextFragmentUrlFromHtml,
  requestMediaExcerptInfo,
} from "./requestMediaExcerptInfo";

describe("requestMediaExcerptInfo", () => {
  it("returns MediaExcerptInfo", async () => {
    const html = readFileSync(
      "lib/testData/requestMediaExcerptInfoTestData/pubmed.html",
      "utf8"
    );
    const get = jest.spyOn(axios, "get");
    get.mockImplementation(() => Promise.resolve({ data: html }));
    const quotation =
      "The results indicate that MeHg is not a suitable reference for risk assessment from exposure to thimerosal-derived Hg. Knowledge of the toxicokinetics and developmental toxicity of thimerosal is needed to afford a meaningful assessment of the developmental effects of thimerosal-containing vaccines.";

    const info = await requestMediaExcerptInfo(
      "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1280342/",
      quotation
    );

    expect(info).toStrictEqual({
      quotation: undefined,
      anchors: [
        {
          exactText:
            "The results indicate that MeHg is not a suitable reference for risk assessment from exposure to thimerosal-derived Hg. Knowledge of the toxicokinetics and developmental toxicity of thimerosal is needed to afford a meaningful assessment of the developmental effects of thimerosal-containing vaccines.",
          prefixText: "l-exposed monkeys (34% vs. 7%). ",
          suffixText: "Keywords: brain and blood distri",
          startOffset: 10427,
          endOffset: 10726,
        },
      ],
      authors: [
        {
          isOrganization: false,
          name: "Thomas M. Burbacher",
        },
        {
          isOrganization: false,
          name: "Danny D. Shen",
        },
        {
          isOrganization: false,
          name: "Noelle Liberato",
        },
        {
          isOrganization: false,
          name: "Kimberly S. Grant",
        },
        {
          isOrganization: false,
          name: "Elsa Cernichiari",
        },
        {
          isOrganization: false,
          name: "Thomas Clarkson",
        },
      ],
      sourceDescription:
        "“Comparison of Blood and Brain Mercury Levels in Infant Monkeys Exposed to Methylmercury or Vaccines Containing Thimerosal” Environmental Health Perspectives vol. 113,8 (2005): 1015. doi:10.1289/ehp.7712",
      url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1280342/",
    });
  });
});

describe("generateTextFragmentUrlFromHtml", () => {
  test("generates a URL with a text fragment", () => {
    const html = readFileSync(
      "lib/testData/requestMediaExcerptInfoTestData/seattletimes.html",
      "utf8"
    );
    const url =
      "https://www.seattletimes.com/seattle-news/homeless/heres-why-people-think-seattle-will-reverse-course-on-homelessness/";
    const quotation = stripIndent(`
      That change in where people living outside slept was good and bad, said Mary Steele, executive director of Compass Housing Alliance.

      “When people are visible, they’re easier for outreach folks to find them and to find them repeatedly,” Steele said. “Worse in that it has more of an impact on the neighborhood for sure.”`);
    expect(generateTextFragmentUrlFromHtml(url, html, quotation)).toBe(
      "https://www.seattletimes.com/seattle-news/homeless/heres-why-people-think-seattle-will-reverse-course-on-homelessness/#:~:text=That%20change%20in,neighborhood%20for%20sure.%E2%80%9D"
    );
  });
});

describe("confirmQuotationInHtml", () => {
  test("confirms a multiline quotation from the Seattle Times", () => {
    const url =
      "https://www.seattletimes.com/seattle-news/homeless/heres-why-people-think-seattle-will-reverse-course-on-homelessness/";
    const html = readFileSync(
      "lib/testData/requestMediaExcerptInfoTestData/seattletimes.html",
      "utf8"
    );
    const quotation = stripIndent(`
      Many poll respondents said the reason they believe the homelessness crisis is worse now than it was three years ago is because they see it more.

      “I see a lot more encampments around or RVs parked on the side of the road where they didn’t used to be,” said Drew Scoggins, a Northgate resident who responded to the poll.`).trim();

    expect(confirmQuotationInHtml(url, html, quotation)).toEqual({
      status: "FOUND",
      foundQuotation: quotation,
    });
  });
  test("confirms a multiline quotation from Lex Fridman podcast", () => {
    const url = "https://lexfridman.com/robert-f-kennedy-jr-transcript/";
    const html = readFileSync(
      "lib/testData/requestMediaExcerptInfoTestData/lexfridman.html",
      "utf8"
    );
    const quotation = stripIndent(`
    Robert F. Kennedy Jr

    (00:09:49) I suppose the way that Camus viewed the world and the way that the Stoics did and a lot of the existentialists, it was that it was so absurd and that the problems and the tasks that were given just to live a life are so insurmountable that the only way that we can get back the gods for giving us this impossible task of living life was to embrace it and to enjoy it and to do our best at it. To me, I read Camus, and particularly in The Myth of Sisyphus as a parable that… And it’s the same lesson that I think he writes about in The Plague, where we’re all given these insurmountable tasks in our lives, but that by doing our duty, by being of service to others, we can bring meaning to a meaningless chaos and we can bring order to the universe.
    `).trim();
    const foundQuotation = `Robert F. Kennedy Jr (00:09:49) I suppose the way that Camus viewed the world and the way that the Stoics did and a lot of the existentialists, it was that it was so absurd and that the problems and the tasks that were given just to live a life are so insurmountable that the only way that we can get back the gods for giving us this impossible task of living life was to embrace it and to enjoy it and to do our best at it. To me, I read Camus, and particularly in The Myth of Sisyphus as a parable that… And it’s the same lesson that I think he writes about in The Plague, where we’re all given these insurmountable tasks in our lives, but that by doing our duty, by being of service to others, we can bring meaning to a meaningless chaos and we can bring order to the universe.`;

    expect(confirmQuotationInHtml(url, html, quotation)).toEqual({
      status: "FOUND",
      foundQuotation,
    });
  });
});
