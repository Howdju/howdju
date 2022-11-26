import { Justification } from "./zodSchemas";

describe("Justification schema", () => {
  test("recognizes valid data", () => {
    const justification: Justification = {
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
        type: "PROPOSITION_COMPOUND",
        entity: {
          atoms: [
            {
              entity: {
                text: "the basis text",
              },
            },
          ],
        },
      },
      rootTarget: {
        text: "the root text"
      },
      rootTargetType: "PROPOSITION",
      rootPolarity: "POSITIVE",
    };
    const result = Justification.parse(justification);
    expect(result).toEqual(justification);
  });
});
