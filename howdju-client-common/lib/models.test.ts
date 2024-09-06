import moment from "moment";

import { PropositionOut } from "howdju-common";
import { makeJustificationViewModel } from "./models";

describe("makeJustificationViewModel", () => {
  test("A projustification has a positive root polarity", () => {
    const created = moment.utc("2017-01-12");
    const rootProposition: PropositionOut = {
      id: "example",
      text: "By law, no building in Washington, D.C. may be taller than the Capitol building",
      normalText:
        "By law, no building in Washington, D.C. may be taller than the Capitol building",
      created,
    };
    const justification = makeJustificationViewModel({
      id: "example",
      polarity: "POSITIVE",
      target: {
        type: "PROPOSITION",
        entity: rootProposition,
      },
      basis: {
        type: "PROPOSITION_COMPOUND",
        entity: {
          id: "example",
          atoms: [
            {
              propositionCompoundId: "example",
              entity: {
                id: "example",
                text: "The 1899 Height of Buildings Act established that no building could be taller than the Capitol (289 feet)",
                normalText:
                  "The 1899 Height of Buildings Act established that no building could be taller than the Capitol (289 feet)",
                created,
              },
            },
          ],
        },
      },
      created,
    });

    expect(justification.rootPolarity).toBe("POSITIVE");
  });
  test("A counterjustification targeting a projustification has negative root polarity", () => {
    const created = moment.utc("2017-01-12");
    const rootProposition: PropositionOut = {
      id: "example",
      text: "By law, no building in Washington, D.C. may be taller than the Capitol building",
      normalText:
        "By law, no building in Washington, D.C. may be taller than the Capitol building",
      created,
    };
    const proJustification = makeJustificationViewModel({
      id: "example",
      polarity: "POSITIVE",
      target: {
        type: "PROPOSITION",
        entity: rootProposition,
      },
      basis: {
        type: "PROPOSITION_COMPOUND",
        entity: {
          id: "example",
          atoms: [
            {
              propositionCompoundId: "example",
              entity: {
                id: "example",
                text: "The 1899 Height of Buildings Act established that no building could be taller than the Capitol (289 feet)",
                normalText:
                  "The 1899 Height of Buildings Act established that no building could be taller than the Capitol (289 feet)",
                created,
              },
            },
          ],
        },
      },
      created,
    });

    const counterJustification = makeJustificationViewModel({
      id: "example",
      created,
      polarity: "NEGATIVE",
      target: {
        type: "JUSTIFICATION",
        entity: proJustification,
      },
      basis: {
        type: "PROPOSITION_COMPOUND",
        entity: {
          id: "example",
          atoms: [
            {
              propositionCompoundId: "example",
              entity: {
                id: "example",
                created,
                text: "The 1910 Height of Buildings Act amended the 1899 act to base the height restriction on the width of adjacent streets.",
                normalText:
                  "The 1910 Height of Buildings Act amended the 1899 act to base the height restriction on the width of adjacent streets.",
              },
            },
          ],
        },
      },
    });

    expect(counterJustification.rootPolarity).toBe("NEGATIVE");
  });
});
