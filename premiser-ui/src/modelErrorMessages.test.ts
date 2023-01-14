import { PropositionCompound, ModelErrors } from "howdju-common";
import { makeErrorPropCreator } from "./modelErrorMessages";

describe("makeErrorPropCreator", () => {
  test("creates error props", () => {
    const modelErrors: ModelErrors<PropositionCompound> = {
      _errors: [],
      atoms: {
        "0": {
          _errors: [],
          entity: {
            _errors: [],
            text: {
              _errors: [
                {
                  code: "too_small",
                  minimum: 1,
                  type: "string",
                  inclusive: true,
                  message: "String must contain at least 1 character(s)",
                  path: ["basis", "entity", "atoms", 0, "entity", "text"],
                },
              ],
            },
          },
        },
        _errors: [],
      },
    };

    const wasSubmitAttempted = true;
    const errorProps = makeErrorPropCreator<PropositionCompound>(
      wasSubmitAttempted,
      modelErrors,
      {},
      {}
    );

    const fieldErrors = errorProps((pc) => pc.atoms[0].entity.text);

    expect(fieldErrors).toEqual({
      error: true,
      errorText: "String must contain at least 1 character(s)",
    });
  });
});
