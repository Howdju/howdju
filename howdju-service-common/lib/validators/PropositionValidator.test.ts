import { describe, expect, it } from "@jest/globals";
import { PropositionValidator } from "./PropositionValidator";
import { TagValidator } from "./TagValidator";

describe("PropsositionValidator", () => {
  it("validates a proposition", () => {
    const validator = new PropositionValidator(new TagValidator());

    const result = validator.validate({ text: "the text" });

    expect(result).toEqual({
      hasErrors: false,
      modelErrors: [],
      fieldErrors: {
        text: [],
        tags: {
          modelErrors: [],
          itemErrors: [],
        },
      },
    });
  });

  it("invalidates an invalid proposition", () => {
    const validator = new PropositionValidator(new TagValidator());

    const result = validator.validate({ text: "" });

    expect(result).toEqual({
      hasErrors: true,
      modelErrors: [],
      fieldErrors: {
        text: ["MUST_BE_NONEMPTY"],
        tags: {
          modelErrors: [],
          itemErrors: [],
        },
      },
    });
  });
});
