import { z } from "zod";
import { removeZodErrorDupes, zodIssueFormatter } from "./zodError";

describe("removeZodErrorDupes", () => {
  test("Removes duplicate issues", () => {
    const error = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-1",
      },
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-1",
      },
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-2",
      },
    ]).format(zodIssueFormatter);

    const actualDeduped = removeZodErrorDupes(error);

    const expectedDeduped = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-1",
      },
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-2",
      },
    ]).format(zodIssueFormatter);
    expect(actualDeduped).toEqual(expectedDeduped);
  });
});
