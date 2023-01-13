import moment from "moment";
import { Justification } from "./zodSchemas";

describe("Justification schema", () => {
  test("recognizes valid proposition compound based justification", () => {
    const justification: Justification = {
      id: "0",
      target: {
        type: "PROPOSITION",
        entity: {
          id: "1",
          text: "the target text",
          created: moment("2023-01-12"),
        },
      },
      polarity: "POSITIVE",
      basis: {
        type: "PROPOSITION_COMPOUND",
        entity: {
          atoms: [
            {
              compoundId: "1",
              entity: {
                text: "the basis text",
                created: moment("2023-01-12"),
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
