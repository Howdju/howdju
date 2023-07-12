import axios from "axios";
import { readFileSync } from "fs";

import { requestMediaExcerptInfo } from "./requestMediaExcerptInfo";

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
